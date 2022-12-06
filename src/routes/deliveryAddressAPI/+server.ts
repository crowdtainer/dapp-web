import redis from "$lib/Database/redis";                // Database

import { ethers } from 'ethers';                        // Ethers
import { type Result, Ok, Err } from "@sniptt/monads";  // Monads

import { domain, makeDeliveryStatement, type DeliveryDetails } from '$lib/Model/SignTerms';
import { Vouchers721Address } from '../Data/projects.json';

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { SiweMessage, type VerifyParams } from '@crowdtainer/siwe';
import { Vouchers721__factory } from "../typechain/factories/Vouchers721__factory";
import { deliveryVoucherKey } from "$lib/Database/schemes";

const provider = new ethers.providers.JsonRpcProvider(import.meta.env.VITE_RPC_BACKEND);

export async function isOwnerOf(provider: ethers.Signer | undefined,
    vouchers721Address: string, tokenId: number): Promise<Result<boolean, string>> {

    if (provider === undefined) {
        return Err("Provider not available.");
    }

    try {
        const vouchers721Contract = Vouchers721__factory.connect(vouchers721Address, provider);

        let wallet = await provider.getAddress();
        let tokenOwner = (await vouchers721Contract.ownerOf(tokenId));

        if (wallet === tokenOwner) {
            return Ok(true);
        } else {
            return Ok(false);
        }

    } catch (error) {
        return Err(`${error}`);
    }
}

// POST Inputs: - {
//                deliveryDetails: string,      // Participant's delivery request details
//                        message: string,      // SIWE message
//                  signatureHash: hex string   // statement signature
//                }
export const POST: RequestHandler = async ({ request }) => {

    let result = getPayload(await request.json());

    if (result.isErr()) {
        throw error(400, result.unwrapErr());
    }

    let [deliveryDetails, message, signatureHash] = result.unwrap();

    let signerAddress: string;

    try {
        let siweMessage = new SiweMessage(message);

        // Check signature
        let verifyParams: VerifyParams = { signature: signatureHash, domain };
        let siweResponse = await siweMessage.verify(verifyParams);

        if (!siweResponse.success) {
            console.dir(siweResponse);
            throw error(400, `Invalid message: ${siweResponse.error}`);
        }

        console.log("Signed message payload:");
        console.dir(deliveryDetails);

        if (deliveryDetails === undefined) {
            throw error(400, `Invalid message: parsing failed.`);
        }

        // Check signature
        let expectedStatement = makeDeliveryStatement(deliveryDetails);

        if (siweMessage.statement !== expectedStatement) {
            throw error(400, `Invalid signed statement. Expected: '${expectedStatement}' Received:'${siweMessage.statement}'`);
        }

        signerAddress = siweMessage.address;
        console.log(`Derived signer address: ${signerAddress}`);

        // TODO: Filter out unsupported chainIds

        if (Vouchers721Address !== deliveryDetails.vouchers721Address) {
            throw error(400, `Invalid Vouchers721 address. Expected: '${Vouchers721Address}' Received:'${deliveryDetails.vouchers721Address}'`);
        }

        // TODO: deny signatures too old and with used nonces
        console.log(`siweMessage.issuedAt: ${siweMessage.issuedAt}`);
        console.log(`siweMessage.nonce: ${siweMessage.nonce}`);

    } catch (_error) {
        console.dir(_error);
        throw error(400, `Invalid message: ${_error}`);
    }

    if (!ethers.utils.isAddress(signerAddress)) {
        throw error(400, "Invalid wallet address.");
    }

    try {
        // Check if token is owned by wallet
        if (!(await isOwnerOf(provider.getSigner(), Vouchers721Address, deliveryDetails.voucherId))) {
            throw error(401, "The signature provided does not belog to a wallet which owns the specified token id.");
        }

        // TODO: Check if related parcel wasn't already shipped

        // Key for item
        let key = deliveryVoucherKey(deliveryDetails.chainId, deliveryDetails.vouchers721Address, deliveryDetails.voucherId);

        // Save delivery address to redis
        redis.hset(key, deliveryDetails);

    } catch (e) {
        throw error(500, "Database error.");
    }

    return new Response("OK");
}

type Error = string;

function getPayload(item: any): Result<[deliveryDetails: DeliveryDetails, message: string, signatureHash: string], Error> {

    if (item == undefined) {
        return Err("Missing payload");
    }

    if (item.deliveryDetails == undefined) {
        return Err("Missing 'deliveryDetails' field");
    }

    if (item.message == undefined) {
        return Err("Missing 'message' field");
    }

    if (item.signatureHash == undefined) {
        return Err("Missing 'signatureHash' field");
    }

    console.dir(item.deliveryDetails);
    try {
        const result: [DeliveryDetails, string, string] = [item.deliveryDetails, item.message, item.signatureHash];
        return Ok(result);
    } catch (error) {
        return Err("Error decoding input fields");
    }
}