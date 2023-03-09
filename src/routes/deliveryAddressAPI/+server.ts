import { getDatabase } from "$lib/Database/redis";              // Database

import { ethers } from 'ethers';                                // Ethers
import { type Result, Ok, Err, } from "@sniptt/monads";        // Monads

import { isTimeValid, makeDeliveryRequestMessage, type DeliveryDetails } from '$lib/Model/SignTerms';
import { Vouchers721Address } from '../Data/projects.json';

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { Vouchers721__factory } from "../typechain/factories/Vouchers721__factory";
import { deliveryVoucherKey } from "$lib/Database/schemes";
import { provider } from '$lib/ethersCalls/provider';
import { loadTokenURIRepresentation, type TokenURIObject, type Description } from "$lib/Converters/tokenURI.js";
import { Crowdtainer__factory } from "../typechain/index.js";

async function getCampaignState(provider: ethers.Signer | undefined,
    vouchers721Address: string, tokenId: number): Promise<Result<number, string>> {

    if (provider === undefined) {
        return Err("Provider not available.");
    }

    try {
        console.log(`vouchers721Address: ${vouchers721Address}`);
        const vouchers721Contract = Vouchers721__factory.connect(vouchers721Address, provider);

        let crowdtainerId = await vouchers721Contract.tokenIdToCrowdtainerId(tokenId);
        let crowdtainer = await vouchers721Contract.crowdtainerForId(crowdtainerId);
        const crowdtainerContract = Crowdtainer__factory.connect(crowdtainer, provider);
        let campaignState = await crowdtainerContract.crowdtainerState();
        return Ok(campaignState);
    } catch (error) {
        console.log(`Error: ${error}`);
        return Err(`${error}`);
    }
}

async function isOwnerOf(provider: ethers.Signer | undefined,
    vouchers721Address: string, tokenId: number): Promise<Result<boolean, string>> {

    if (provider === undefined) {
        return Err("Provider not available.");
    }

    try {
        const vouchers721Contract = Vouchers721__factory.connect(vouchers721Address, provider);

        let wallet = await provider.getAddress();
        let tokenOwner = await vouchers721Contract.ownerOf(tokenId);

        if (wallet === tokenOwner) {
            return Ok(true);
        } else {
            return Ok(false);
        }

    } catch (error) {
        return Err(`${error}`);
    }
}

async function getOrderDetails(provider: ethers.Signer | undefined,
    vouchers721Address: string, tokenId: number): Promise<Result<TokenURIObject, string>> {

    if (provider === undefined) {
        return Err("Provider not available.");
    }

    try {
        let tokenDetails = await loadTokenURIRepresentation(provider, vouchers721Address, tokenId);
        if (tokenDetails === undefined) {
            return Err("Unable to decode tokenURI.");
        }

        return Ok(tokenDetails);

    } catch (error) {
        return Err(`${error}`);
    }
}

// POST Inputs: - {
//                  signerAddress: string,      // user stated signer address
//                         domain: string,      // user stated domain
//                         origin: string,      // user stated origin
//                          nonce: string,      // nonce with at least 8 digits
//                 currentTimeISO: string,      // time when signature was created
//                deliveryDetails: string,      // Participant's delivery request details
//                  signatureHash: hex string   // statement signature
//                }
export const POST: RequestHandler = async ({ request }) => {

    let result = getPayload(await request.json());

    if (result.isErr()) {
        throw error(400, result.unwrapErr());
    }

    let [signerAddress, domain, origin, nonce, currentTimeISO, deliveryDetails, signatureHash] = result.unwrap();

    try {

        // Check signature
        let message = makeDeliveryRequestMessage(signerAddress, domain, origin, deliveryDetails, nonce, currentTimeISO);

        let recoveredSigner = ethers.utils.verifyMessage(message, signatureHash);

        console.log(`Derived signer address: ${recoveredSigner}`);

        if (!ethers.utils.isAddress(signerAddress)) {
            throw error(400, "Invalid wallet address.");
        }

        // Check if signatures matches
        if (recoveredSigner !== signerAddress) {
            throw error(400, `Invalid statement or message signature.`);
        }

        // TODO: perform domain/origin validation
        console.log(`client declared domain: ${domain}`);
        console.log(`client declared origin: ${domain}`);
        console.log(`siweMessage.issuedAt: ${currentTimeISO}`);
        // TODO: validate nonce (i.e., is it in 8 digit range? has it been used (redis))
        // TODO: Filter out unsupported chainIds

        if (!isTimeValid(currentTimeISO)) {
            throw error(400, 'Signature timestamp too old or too far in the future.');
        }

        if (Vouchers721Address !== deliveryDetails.vouchers721Address) {
            throw error(400, `Invalid Vouchers721 address. Expected: '${Vouchers721Address}' Received:'${deliveryDetails.vouchers721Address}'`);
        }

    } catch (_error) {
        console.dir(_error);
        throw error(400, `Invalid message: ${_error}`);
    }

    let redis = getDatabase();
    if (redis === undefined) {
        throw error(500, `Db connection error.`);
    }

    try {
        let signer = provider.getSigner();
        // Check if token is owned by wallet
        if (!(await isOwnerOf(signer, Vouchers721Address, deliveryDetails.voucherId))) {
            throw error(401, "The signature provided does not belog to a wallet which owns the specified token id.");
        }

        // Check if the smart contract is in delivery state.
        const campaignStateResult = await getCampaignState(signer, Vouchers721Address, deliveryDetails.voucherId);

        if(campaignStateResult.isErr()){
            console.log(`Error: ${campaignStateResult.unwrapErr()}`);
            throw error(500, `Failure to read campaign status as in 'delivery state'.`);
        }

        if(campaignStateResult.unwrap() !== 2) {
            throw error(500, `Failure not in 'delivery state'.`);
        }

        // Key for item
        let key = deliveryVoucherKey(deliveryDetails.chainId, deliveryDetails.vouchers721Address, deliveryDetails.voucherId);

        let orderDetailsResult = await getOrderDetails(signer, Vouchers721Address, deliveryDetails.voucherId);

        if (orderDetailsResult.isErr()) {
            throw error(500, `Unable to get order details for token id: ${deliveryDetails.voucherId} in Vouchers721Address ${Vouchers721Address}.`);
        }

        let orderDetails = orderDetailsResult.unwrap();
        let quantities = new Array<Number>();

        orderDetails.description.forEach((element: Description) => {
            quantities.push(Number(element.amount));
        });

        console.log(`Inserting: ${JSON.stringify(key)}`);

        await redis.multi()
            .hset(key, deliveryDetails)                                 // Save delivery address
            .set(`${key}:quantities`, JSON.stringify(quantities))       // Save order quantities
            .lpush("deliveryRequests:v1", key)                          // Add its id to the work queue
            .exec();

    } catch (e) {
        console.log(`Error: ${e}`);
        throw error(500, "Database error.");
    }

    return new Response("OK");
}

type Error = string;

//                  signerAddress: string,      // user stated signer address
//                         domain: string,      // user stated domain
//                         origin: string,      // user stated origin
//                          nonce: string,      // nonce with at least 8 digits
//                 currentTimeISO: string,      // time when signature was created
//                deliveryDetails: string,      // Participant's delivery request details
//                  signatureHash: hex string   // statement signature
function getPayload(item: any): Result<[
    signerAddress: string,
    domain: string,
    origin: string,
    nonce: string,
    currentTimeISO: string,
    deliveryDetails: DeliveryDetails,
    signatureHash: string], Error> {

    if (item == undefined) {
        return Err("Missing payload");
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

    if (item.deliveryDetails == undefined) {
        return Err("Missing 'deliveryDetails' field");
    }

    if (item.signatureHash == undefined) {
        return Err("Missing 'signatureHash' field");
    }

    try {
        const result: [string, string, string, string, string, DeliveryDetails, string] = [
            item.signerAddress,
            item.domain,
            item.origin,
            item.nonce,
            item.currentTimeISO,
            item.deliveryDetails,
            item.signatureHash];
        return Ok(result);
    } catch (error) {
        return Err("Error decoding input fields");
    }
}