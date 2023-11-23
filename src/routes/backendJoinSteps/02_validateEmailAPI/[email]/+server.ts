import { getDatabase } from "$lib/Database/redis";              // Database
import { sanitizeString } from "$lib/Utils/sanitize.js";
import { validEmail } from "$lib/Validation/email.js";
import { type Result, Ok, Err } from "@sniptt/monads";          // Monads
import { error, type RequestHandler } from '@sveltejs/kit';

// POST Inputs: - { 
//                     code: number,
//                }
export const POST: RequestHandler = async ({ request, params }) => {

    let redis = getDatabase();
    if (redis === undefined) {
        throw error(500, `Db connection error.`);
    }

    let userEmail = params.email;

    if (userEmail == undefined || !validEmail(userEmail)) {
        throw error(400, "Missing email field.");
    }

    let emailCodeKey = `userCode:${userEmail}`;
    let validatedEmailsKey = `validatedEmails:${userEmail}`;

    let result = getPayload(await request.json());

    if (result.isErr()) {
        throw error(400, result.unwrapErr());
    }

    let providedCode = result.unwrap();
    let actualCode: null | undefined | string;

    await redis.get(emailCodeKey, (err, result) => {
        if (err) {
            console.error(err);
        } else {
            actualCode = result;
        }
    });

    if (!actualCode || actualCode !== String(providedCode)) {
        throw error(400, "Invalid code.");
    }

    try {
        await redis.sadd(validatedEmailsKey, actualCode); // add to "validated set"
    } catch (e) {
        throw error(500, "Database error.");
    }

    return new Response("OK");
}

type Error = string;

function getPayload(item: any): Result<number, Error> {

    if (item == undefined) {
        return Err("Missing payload");
    }

    if (item.code == undefined) {
        return Err("Missing 'code' field");
    }

    let captchaCodeResult = sanitizeString(item.code, 50, true);
    if (captchaCodeResult.isErr()) {
        return Err(captchaCodeResult.unwrapErr());
    }

    try {
        let captchaCode = parseInt(captchaCodeResult.unwrap());
        if (isNaN(captchaCode)) {
            return Err("Error decoding input field(s).");
        }
        return Ok(Number(captchaCodeResult.unwrap()));
    } catch (error) {
        return Err("Error decoding input field(s).");
    }
}