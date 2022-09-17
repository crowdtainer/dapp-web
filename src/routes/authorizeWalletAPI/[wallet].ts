import redis from "$lib/Database/redis";                // Database
import { ethers } from 'ethers';                        // Ethers
import { type Result, Ok, Err } from "@sniptt/monads";  // Monads
import { getMessage } from '$lib/Model/SignTerms';      // internal
import type { RequestHandler } from './__types/[wallet]'// Internal

// POST Inputs: - {
//                          email: string,      // Participant's email
//                  signatureHash: hex string   // Terms and conditions
//                }
export const post: RequestHandler<string> = async ({ request }) => {

    let authorizedEmailskey = `authorizedEmails`;

    let result = getPayload(await request.json());

    if (result.isErr()) {
        return {
            status: 400,
            body: result.unwrapErr()
        };
    }

    let [email, signatureHash] = result.unwrap();

    // Get wallet public key from signature
    let signerAddress: string;
    try {
        signerAddress = await ethers.utils.verifyMessage(getMessage(email), signatureHash);
        console.log(`Derived signer address: ${signerAddress}`);

    } catch (error) {
        return {
            status: 500,
            body: "Invalid message."
        };
    }

    if (!ethers.utils.isAddress(signerAddress)) {
        return {
            status: 500,
            body: "Invalid wallet address"
        };
    }

    try {
        // Check if email is authorized
        const emailAuthorized = await redis.sismember(authorizedEmailskey, email);
        if (!emailAuthorized) {
            return {
                status: 400,
                body: "E-mail address not validated."
            };
        }

        let userSigKey = `userSignature:${signerAddress}`;

        // Check if wallet has already signed the Terms
        const signatureCount = await redis.hget(userSigKey, "signatureCount");
        if (signatureCount != null) {
            // persist current signature as a separate hash key, and reset with new data.
            const currentData = {
                email: await redis.hget(userSigKey, "email"),
                signatureHash: await redis.hget(userSigKey, "signatureHash"),
            };
            const newData = {
                email: email,
                signatureHash: signatureHash,
                signatureCount: Number(signatureCount)+1
            };
            redis.multi()
                .hset(`${userSigKey}:${signatureCount}`, currentData)
                .hset(userSigKey, newData)
                .del(authorizedEmailskey)
                .exec();
        }
        else {
            // Persist signature, email, set wallet as authorized.
            const payload = {
                email: email,
                signatureHash: signatureHash,
                signatureCount: 0
            };

            await redis.multi()
                .del(authorizedEmailskey)
                .hset(userSigKey, payload)
                .exec();
            console.log(`userSigKey:${userSigKey} ; Value -> ${userSigKey}`);
            console.log(`Authorized!`);
        }

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

function getPayload(item: any): Result<[email: string, signatureHash: string], Error> {

    if (item == undefined) {
        return Err("Missing payload");
    }

    if (item.email == undefined) {
        return Err("Missing 'email' field");
    }
    if (item.signatureHash == undefined) {
        return Err("Missing 'signatureHash' field");
    }

    try {
        const result: [string, string] = [item.email, item.signatureHash];
        return Ok(result);
    } catch (error) {
        return Err("Error decoding input fields");
    }
}