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

    try {
        randomNumber = randomInt(0, 100000).toString();
        // Save code in database and push item to "email sender worker" list
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

    return new Response("OK");
}