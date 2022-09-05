import { randomInt } from "crypto";                     // Random number
import redis from "$lib/Database/redis";                // Database
import { type Result, Ok, Err } from "@sniptt/monads";  // Monads
import type { RequestHandler } from './__types/[email]' // Internal

// POST Inputs: - { 
//                           code: number,
//                }
export const post: RequestHandler<string> = async ({ request, params }) => {

    let userEmail = params.email;

    let codeForUserKey = `userCode:${userEmail}`;
    let authorizedEmailsKey = `authorizedEmails`;

    if (userEmail == undefined || userEmail === "") {
        return {
            status: 400,
            body: "Missing email field."
        }
    }

    let result = getPayload(await request.json());

    if (result.isErr()) {
        return {
            status: 400,
            body: result.unwrapErr()
        };
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

    if (actualCode == undefined) {
        return {
            status: 400,
            body: "Invalid code."
        }
    }

    if (actualCode !== String(providedCode)) {
        return {
            status: 400,
            body: "Invalid code."
        }
    }

    try {
        await redis.sadd(authorizedEmailsKey, userEmail); // add to "authorized set"
    } catch (e) {
        return {
                status: 500,
                body: `Database error.`
            };
    }

    return {
        status: 200,
        body: "OK"
    };
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