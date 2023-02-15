import { randomInt } from "crypto";                         // Random number
import { getDatabase } from "$lib/Database/redis";          // Database
import type { RequestHandler } from './$types';             // Internal
import { error } from "@sveltejs/kit";

const maxAPI_hits = 8;
const codeExpireTimeInSeconds = 1800 // 30 minutes
const emailWorkerExpirationInSeconds = 10 * 60 // 10 minutes

export const GET: RequestHandler = async ({ params }) => {

    let redis = getDatabase();
    if (redis === undefined) {
        throw error(500, `Db connection error.`);
    }

    let userEmail = params.email;

    // TODO: encrypt user email
    let emailCodekey = `userCode:${userEmail}`;
    let workerKey = `mailWork`;

    let apiHits = `apiHits:${userEmail}`;
    let randomNumber: string | null | undefined;

    try {
        let currentCount = await redis.incr(apiHits);
        console.log(`hits: ${currentCount}, max: ${maxAPI_hits}`);
        await redis.expire(apiHits, codeExpireTimeInSeconds);

        if (currentCount > maxAPI_hits) {
            throw error(429, "Please try again later.");
        }

        let randomNumber = await redis.get(emailCodekey);

        if (randomNumber != undefined) {
            console.log(`Existing code present for email ${userEmail}`);

            // Push new item to "email sender worker" list
            await redis.multi()
                .lpush(workerKey, userEmail)
                .expire(workerKey, emailWorkerExpirationInSeconds)
                .exec();
            console.log(`Key -> ${emailCodekey} ; Value -> ${randomNumber} expires in ${emailWorkerExpirationInSeconds} seconds.`);
            return new Response("OK");
        }
    } catch (_error) {
        console.dir(_error);
        throw error(500, "Database failure.");
    }

    try {
        randomNumber = randomInt(0, 100000).toString();
        // Save code in database and push item to "email sender worker" list
        await redis.multi()
            .set(emailCodekey, Number(randomNumber), 'EX', codeExpireTimeInSeconds)
            .lpush(workerKey, userEmail)
            .expire(workerKey, emailWorkerExpirationInSeconds)
            .exec();

        console.log(`Key -> ${emailCodekey} ; Value -> ${randomNumber}`);
    } catch (_error) {
        console.log(`Unable to set user code: ${emailCodekey}:${randomNumber}`);
        console.dir(_error);
        throw error(500, "Database failure.");
    }

    return new Response("OK");
}