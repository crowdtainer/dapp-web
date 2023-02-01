import { getDatabase } from "$lib/Database/redis";              // Database
import { type Result, Ok, Err } from "@sniptt/monads";          // Monads
import type { RequestHandler } from './$types';                 // Internal
import { error } from '@sveltejs/kit';

// POST Inputs: - { 
//                     code: number,
//                }
export const POST: RequestHandler = async ({ request, params }) => {

    let redis = getDatabase();
    if (redis === undefined) {
        throw error(500, `Db connection error.`);
    }

    let userEmail = params.email;

    let codeForUserKey = `userCode:${userEmail}`;
    let authorizedEmailsKey = `authorizedEmails`;

    if (userEmail == undefined || userEmail === "") {
        throw error(400, "Missing email field.");
    }

    let result = getPayload(await request.json());

    if (result.isErr()) {
        throw error(400, result.unwrapErr());
    }

    let providedCode = result.unwrap();
    let actualCode: null | undefined | string;

    await redis.get(codeForUserKey, (err, result) => {
        if (err) {
            console.error(err);
        } else {
            actualCode = result;
        }
    });

    if (actualCode == undefined || actualCode !== String(providedCode)) {
        throw error(400, "Invalid code.");
    }

    try {
        await redis.sadd(authorizedEmailsKey, userEmail); // add to "authorized set"
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
    try {
        return Ok(item.code);
    } catch (error) {
        return Err("Error decoding input fields");
    }
}