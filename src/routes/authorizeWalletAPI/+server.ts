import redis from "$lib/Database/redis";                // Database
import { ethers } from 'ethers';                        // Ethers
import { type Result, Ok, Err } from "@sniptt/monads";  // Monads

import { makeStatement, termsURI, domain } from '$lib/Model/SignTerms';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { SiweMessage, type VerifyParams } from '@crowdtainer/siwe';

// POST Inputs: - {
//                          email: string,      // Participant's email
//                        message: string,      // SIWE message
//                  signatureHash: hex string   // statement signature
//                }
export const POST: RequestHandler = async ({ request }) => {

    let authorizedEmailskey = `authorizedEmails`;

    let result = getPayload(await request.json());

    if (result.isErr()) {
        throw error(400, result.unwrapErr());
    }

    let [email, message, signatureHash] = result.unwrap();
debugger;
    // Get wallet public key from signature
    let signerAddress: string;
    try {
        let siweMessage = new SiweMessage(message);

        // Check signature
        let verifyParams: VerifyParams = { signature: signatureHash, domain };
        let siweResponse = await siweMessage.verify(verifyParams);

        if(!siweResponse.success) {
            console.dir(siweResponse);
            throw error(400, `Invalid message: ${siweResponse.error}`);
        }

                // Check signature
        let expectedStatement = makeStatement(email);

        if (siweMessage.statement !== expectedStatement) {
            throw error(400, `Invalid signed statement. Expected: '${expectedStatement}' Received:'${siweMessage.statement}'`);
        }

        signerAddress = siweMessage.address;
        console.log(`Derived signer address: ${signerAddress}`);

        console.log(`siweMessage.issuedAt: ${siweMessage.issuedAt}`);

    } catch (_error) {
        console.dir(_error);
        throw error(500, `Invalid message: ${_error}`);
    }

    if (!ethers.utils.isAddress(signerAddress)) {
        throw error(500, "Invalid wallet address.");
    }

    try {
        // Check if email is authorized
        const emailAuthorized = await redis.sismember(authorizedEmailskey, email);
        if (!emailAuthorized) {
            throw error(400, "E-mail address not validated.");
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
                signatureCount: Number(signatureCount) + 1
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
        throw error(500, "Database error.");
    }

    return new Response("OK");
}

type Error = string;

function getPayload(item: any): Result<[email: string, message: string, signatureHash: string], Error> {

    if (item == undefined) {
        return Err("Missing payload");
    }

    if (item.email == undefined) {
        return Err("Missing 'email' field");
    }

    if (item.message == undefined) {
        return Err("Missing 'message' field");
    }

    if (item.signatureHash == undefined) {
        return Err("Missing 'signatureHash' field");
    }

    try {
        const result: [string, string, string] = [item.email, item.message, item.signatureHash];
        return Ok(result);
    } catch (error) {
        return Err("Error decoding input fields");
    }
}