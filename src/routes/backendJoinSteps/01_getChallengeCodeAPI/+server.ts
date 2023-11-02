import { randomInt } from "crypto";                         // Random number
import { getDatabase } from "$lib/Database/redis";          // Database
import { captchaEnabled } from '../../Data/projects.json';
import { error, type RequestHandler } from "@sveltejs/kit";
import { validEmail } from "$lib/Validation/utils.js";
import { Err, Ok, type Result } from "@sniptt/monads";

const maxAPI_hits = 8;
const codeExpireTimeInSeconds = 1800 // 30 minutes
const emailWorkerExpirationInSeconds = 10 * 60 // 10 minutes

//  Inputs: - { 
//                         email: user email
//                     captchaId: captcha id           (required only if captcha is enabled in projects.json)
//                   captchaCode: captcha text/code    (required only if captcha is enabled in projects.json)
//            }
export const POST: RequestHandler = async ({ request }) => {

    let redis = getDatabase();
    if (redis === undefined) {
        throw error(500, `Db connection error.`);
    }

    let result = getPayload(await request.json());

    if (result.isErr()) {
        throw error(400, result.unwrapErr());
    }

    let [captchaId, captchaCode, userEmail] = result.unwrap();

    if (!userEmail || !validEmail(userEmail)) {
        throw error(500, "Missing or invalid e-mail parameter");
    }

    // TODO: encrypt user email client side
    let emailCodeKey = `userCode:${userEmail}`;
    let workerKey = `mailWork`;

    let apiHits = `apiHits:${userEmail}`;
    let randomNumber: string | null | undefined;

    let currentCount: number;
    try {
        currentCount = await redis.incr(apiHits);
        console.log(`hits: ${currentCount}, max: ${maxAPI_hits}`);
        await redis.expire(apiHits, codeExpireTimeInSeconds);
    } catch (_error) {
        console.dir(_error);
        throw error(500, "Database failure.");
    }

    if (currentCount > maxAPI_hits) {
        throw error(429, "Maximum requests limit reached. Please try again later.");
    }

    if (captchaEnabled) {
        // Check if captch code is valid
        let captchaIdsKey = 'captchaId:v1:' + captchaId;
        let actualCode: null | undefined | string;

        try {
            await redis.get(captchaIdsKey, (err, result) => {
                if (err) {
                    console.error(err);
                } else {
                    actualCode = result;
                }
            });
        } catch (_error) {
            console.dir(_error);
            throw error(500, "Database failure.");
        }

        if (!actualCode || actualCode !== String(captchaCode)) {
            throw error(400, "Invalid code.");
        }
    }

    // Save code in database and push item to "email sender worker" list
    try {
        randomNumber = randomInt(0, 100000).toString();
        await redis.multi()
            .set(emailCodeKey, Number(randomNumber), 'EX', codeExpireTimeInSeconds)
            .lpush(workerKey, userEmail)
            .expire(workerKey, emailWorkerExpirationInSeconds)
            .exec();
        console.log(`Key -> ${emailCodeKey} ; Value -> ${randomNumber} ; Expires in ${emailWorkerExpirationInSeconds} seconds.`);
    } catch (_error) {
        console.log(`Unable to set user code: ${emailCodeKey}:${randomNumber}`);
        console.dir(_error);
        throw error(500, "Database failure.");
    }

    return new Response(JSON.stringify("OK"));
}

type Error = string;
function getPayload(item: any): Result<[captchaId: string, captchaCode: string, email: string], Error> {
    if (item == undefined) {
        return Err("Missing payload");
    }

    if (item.email == undefined) {
        return Err("Missing 'email' field");
    }

    if (captchaEnabled && item.captchaId == undefined) {
        console.log('dafuq captach enabled?');
        return Err("Missing 'captchaId' field");
    }

    if (captchaEnabled && item.captchaCode == undefined) {
        return Err("Missing 'captchaCode' field");
    }

    try {
        const result: [string, string, string] =
            [item.captchaId, item.captchaCode, item.email];
        return Ok(result);
    } catch (error) {
        return Err("Error decoding input fields");
    }
}