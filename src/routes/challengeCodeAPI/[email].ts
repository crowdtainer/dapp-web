// Random number
import { randomInt } from "crypto";                         // Random number
import redis from "$lib/Database/redis";                    // Database
import type { RequestHandler } from './__types/[email]'     // Internal

const maxAPI_hits = 8;
const codeExpireTime = 1800 // 30 minutes
const emailWorkerExpiration = 5 * 60 // 5 minutes

export const get: RequestHandler<string> = async ({ params }) => {

    let userEmail = params.email;

    // TODO: encrypt user email
    let emailCodekey = `userCode:${userEmail}`;
    let workerKey = `mailWork`;

    let apiHits = `apiHits:${userEmail}`;
    let randomNumber: string | null | undefined;

    try {
        let currentCount = await redis.incr(apiHits);
        console.log(`hits: ${currentCount}, max: ${maxAPI_hits}`);
        await redis.expire(apiHits, codeExpireTime);

        if (currentCount > maxAPI_hits) {
            return {
                status: 429,
                body: "Please try again later."
            };
        }

        let randomNumber = await redis.get(emailCodekey);

        if (randomNumber != undefined) {
            console.log(`Existing code present for email ${userEmail}`);

            return {
                status: 200,
                body: randomNumber
            };

        }
    } catch (error) {
        return {
            status: 500,
            body: "Database failure."
        };
    }

    try {
        randomNumber = randomInt(0, 100000).toString();
        // Save code in database and push item to "email sender worker" list
        await redis.multi()
            .set(emailCodekey, Number(randomNumber), 'EX', codeExpireTime)
            .lpush(workerKey, emailCodekey)
            .expire(workerKey, emailWorkerExpiration)
            .exec();

        console.log(`Key -> ${emailCodekey} ; Value -> ${randomNumber}`);
    } catch (e) {
        console.log(`Unable to set user code: ${emailCodekey}:${randomNumber}`);
        return {
            status: 500,
            body: "Database failure."
        };
    }

    return {
        status: 200,
        body: "OK"
    };
}