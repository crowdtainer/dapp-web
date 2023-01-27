import { getDatabase } from "$lib/Database/redis";                // Database
import { ethers } from 'ethers';                        // Ethers
import { type Result, Ok, Err } from "@sniptt/monads";  // Monads

import { makeAgreeToTermsMessage, isTimeValid } from '$lib/Model/SignTerms';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// POST Inputs: - {
//                          email: string,      // user's email
//                  signerAddress: string,      // user stated signer address
//                         domain: string,      // user stated domain
//                         origin: string,      // user stated origin
//                          nonce: string,      // nonce with at least 8 digits
//                 currentTimeISO: string,      // time when signature was created
//                  signatureHash: hex string   // statement signature
//                }
export const POST: RequestHandler = async ({ request }) => {

    let redis = getDatabase();
    if(redis === undefined){
        throw error(500, `Db connection error.`);
    }

    let authorizedEmailskey = `authorizedEmails`;

    let result = getPayload(await request.json());

    if (result.isErr()) {
        throw error(400, result.unwrapErr());
    }

    let [email, signerAddress, domain, origin, nonce, currentTimeISO, signatureHash] = result.unwrap();

    try {
        // TODO: perform domain/origin validation
        console.log(`client declared domain: ${domain}`);
        console.log(`client declared origin: ${domain}`);
        console.log(`siweMessage.issuedAt: ${currentTimeISO}`);
        // TODO: validate nonce (i.e., is it in 8 digit range? has it been used (redis))
        // TODO: Filter out unsupported chainIds

        if(!isTimeValid(currentTimeISO)) {
            throw error(400, 'Signature timestamp too old or too far in the future.');
        }

        // Reconstruct the message locally
        let message = makeAgreeToTermsMessage(domain, origin, email, signerAddress, nonce, currentTimeISO);

        let recoveredSigner = ethers.utils.verifyMessage(message, signatureHash);

        if (!ethers.utils.isAddress(signerAddress)) {
            throw error(400, `Invalid wallet address (${signerAddress}).`);
        }

        // Check if signatures matches
        if (recoveredSigner !== signerAddress) {
            throw error(400, `Invalid statement or message signature.`);
        }

    } catch (_error) {
        console.dir(_error);
        throw error(400, `Invalid message: ${_error}`);
    }

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

    return new Response("OK");
}

type Error = string;

function getPayload(item: any): Result<[email: string, signerAddress: string,
    domain: string, origin: string, nonce: string, currentTimeISO: string, signatureHash: string], Error> {

    if (item == undefined) {
        return Err("Missing payload");
    }

    if (item.email == undefined) {
        return Err("Missing 'email' field");
    }

    if (item.signerAddress == undefined) {
        return Err("Missing 'signerAddress' field");
    }

    if (item.domain == undefined) {
        return Err("Missing 'domain' field");
    }

    if (item.origin == undefined) {
        return Err("Missing 'origin' field");
    }

    if (item.nonce == undefined) {
        return Err("Missing 'nonce' field");
    }

    if (item.currentTimeISO == undefined) {
        return Err("Missing 'currentTimeISO' field");
    }

    if (item.signatureHash == undefined) {
        return Err("Missing 'signatureHash' field");
    }

    try {
        const result: [string, string, string, string, string, string, string] =
            [item.email, item.signerAddress, item.domain, item.origin,
            item.nonce, item.currentTimeISO, item.signatureHash];
        return Ok(result);
    } catch (error) {
        return Err("Error decoding input fields");
    }
}