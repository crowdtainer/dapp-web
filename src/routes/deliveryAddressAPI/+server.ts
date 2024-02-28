import { getDatabase } from "$lib/Database/redis";              // Database

import { BigNumber, ethers } from 'ethers';                     // Ethers
import { type Result, Ok, Err, } from "@sniptt/monads";         // Monads
import { whereAlpha2 } from 'iso-3166-1';

import { isTimeValid, makeDeliveryRequestMessage, type DeliveryDetails, type Address } from '$lib/Model/SignTerms';
import { Vouchers721Address, projects } from '../Data/projects.json';

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { Vouchers721__factory } from "../typechain/factories/Vouchers721__factory";
import { deliveryRequestsKey, deliveryVoucherKey } from "$lib/Database/schemes";
import { provider } from '$lib/ethersCalls/provider';
import { loadTokenURIRepresentation, type TokenURIObject, type Description } from "$lib/Converters/tokenURI.js";
import { MockERC20__factory, Crowdtainer__factory } from "../typechain/index.js";
import { camelToSentenceCase } from "$lib/Utils/camelCase.js";
import { toHuman } from "$lib/Converters/CrowdtainerData.js";
import { validEmail } from "$lib/Validation/email.js";

import countries from 'iso-3166-1';
interface Country {
    country: string;
    alpha2: string;
    alpha3: string;
    numeric: string;
}

async function getDiscountForWallet(provider: ethers.Signer | undefined,
    vouchers721Address: string, crowdtainerAddress: string, walletAdress: string): Promise<Result<BigNumber, string>> {

    if (provider === undefined) {
        return Err("Provider not available.");
    }

    try {
        console.log(`vouchers721Address: ${vouchers721Address}`);
        const crowdtainerContract = Crowdtainer__factory.connect(crowdtainerAddress, provider);
        let discountValue = await crowdtainerContract.discountForUser(walletAdress);
        return Ok(discountValue);
    } catch (error) {
        console.log(`Error: ${error}`);
        return Err(`${error}`);
    }
}

interface CrowdtainerReference {
    contractAddress: string;
    crowdtainerId: BigNumber;
}

async function getCrowdtainerFromTokenId(provider: ethers.Signer | undefined,
    vouchers721Address: string, tokenId: number): Promise<Result<CrowdtainerReference, string>> {
    if (provider === undefined) {
        return Err("Provider not available.");
    }

    try {
        console.log(`vouchers721Address: ${vouchers721Address}`);
        const vouchers721Contract = Vouchers721__factory.connect(vouchers721Address, provider);
        let crowdtainerId = await vouchers721Contract.tokenIdToCrowdtainerId(tokenId);
        let crowdtainer = await vouchers721Contract.crowdtainerForId(crowdtainerId);

        return Ok({ contractAddress: crowdtainer, crowdtainerId: crowdtainerId });
    } catch (error) {
        console.log(`Error: ${error}`);
        return Err(`${error}`);
    }
}

async function getCampaignState(provider: ethers.Signer | undefined,
    vouchers721Address: string, crowdtainerAddress: string): Promise<Result<number, string>> {

    if (provider === undefined) {
        return Err("Provider not available.");
    }

    try {
        console.log(`vouchers721Address: ${vouchers721Address}`);
        const crowdtainerContract = Crowdtainer__factory.connect(crowdtainerAddress, provider);
        let campaignState = await crowdtainerContract.crowdtainerState();
        return Ok(campaignState);
    } catch (error) {
        console.log(`Error: ${error}`);
        return Err(`${error}`);
    }
}

async function getTokenDecimals(provider: ethers.Signer | undefined,
    crowdtainerAddress: string): Promise<Result<number, string>> {

    if (provider === undefined) {
        return Err("Provider not available.");
    }

    try {
        let crowdtainerContract = Crowdtainer__factory.connect(crowdtainerAddress, provider);
        let tokenContractAddress = await crowdtainerContract.token();
        const ERC20Contract = MockERC20__factory.connect(tokenContractAddress, provider);
        return Ok(await ERC20Contract.decimals());
    } catch (error) {
        console.log(`Error: ${error}`);
        return Err(`${error}`);
    }
}

async function ownerOf(provider: ethers.Signer | undefined,
    vouchers721Address: string, tokenId: number): Promise<Result<string, string>> {
    if (provider === undefined) {
        return Err("Provider not available.");
    }
    try {
        const vouchers721Contract = Vouchers721__factory.connect(vouchers721Address, provider);
        let tokenOwner = await vouchers721Contract.ownerOf(tokenId);
        return Ok(tokenOwner);
    } catch (error) {
        return Err(`${error}`);
    }
}

async function isOwnerOf(wallet: string, provider: ethers.Signer | undefined,
    vouchers721Address: string, tokenId: number): Promise<Result<boolean, string>> {

    if (provider === undefined) {
        return Err("Provider not available.");
    }

    let tokenOwnerResult = await ownerOf(provider, vouchers721Address, tokenId);

    if (tokenOwnerResult.isErr()) {
        return Err(tokenOwnerResult.unwrapErr());
    }

    if (wallet === tokenOwnerResult.unwrap()) {
        return Ok(true);
    } else {
        return Ok(false);
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
//                          nonce: string,      // nonce with at least 8 digits
//                 currentTimeISO: string,      // time when signature was created
//                deliveryDetails: string,      // Participant's delivery request details
//                  signatureHash: hex string   // statement signature
//                }
export const POST: RequestHandler = async ({ request }) => {

    let result = getPayload(await request.json());

    if (result.isErr()) {
        error(400, result.unwrapErr());
    }

    let [signerAddress, domain, nonce, currentTimeISO, deliveryDetails, signatureHash] = result.unwrap();

    // Check if Email is valid
    if (!validEmail(deliveryDetails.deliveryAddress.email)) {
        error(400, `Contact Email address in invalid format: '${deliveryDetails.deliveryAddress.email}'`);
    }

    if (!validEmail(deliveryDetails.billingAddress.email)) {
        error(400, `Billing Email address in invalid format: '${deliveryDetails.billingAddress.email}'`);
    }

    let countryFound = whereAlpha2(deliveryDetails.deliveryAddress.country);
    if (!countryFound) {
        error(400, `Unrecognized delivery address country: '${deliveryDetails.deliveryAddress.country}'`);
    }

    countryFound = whereAlpha2(deliveryDetails.billingAddress.country);
    if (!countryFound) {
        error(400, `Unrecognized billing address country: '${deliveryDetails.billingAddress.country}'`);
    }

    try {
        // Check signature
        let message = makeDeliveryRequestMessage(signerAddress, domain, deliveryDetails, nonce, currentTimeISO);

        let recoveredSigner = ethers.utils.verifyMessage(message, signatureHash);

        console.log(`Derived signer address: ${recoveredSigner}`);

        if (!ethers.utils.isAddress(signerAddress)) {
            error(400, "Invalid wallet address.");
        }

        // Check if signatures matches
        if (recoveredSigner !== signerAddress) {
            error(400, `Invalid statement or message signature.`);
        }

        console.log(`siweMessage.issuedAt: ${currentTimeISO}`);

        // Perform domain validation
        console.log(`client declared domain: ${domain}`);
        if (domain !== import.meta.env.VITE_DOMAIN) {
            error(400, `Invalid domain address: ${domain}. Expected: ${import.meta.env.VITE_DOMAIN}`);
        }

        // TODO: validate nonce (i.e., is it in 8 digit range? has it been used (redis))

        if (!isTimeValid(currentTimeISO)) {
            error(400, 'Signature timestamp too old or too far in the future.');
        }

        if (Vouchers721Address !== deliveryDetails.vouchers721Address) {
            error(400, `Invalid Vouchers721 address. Expected: '${Vouchers721Address}' Received:'${deliveryDetails.vouchers721Address}'`);
        }

    } catch (_error) {
        console.dir(_error);
        error(400, `Invalid message: ${_error}`);
    }

    let redis = getDatabase();
    if (redis === undefined) {
        error(500, `Db connection error.`);
    }

    let signer: ethers.providers.JsonRpcSigner | undefined;
    let crowdtainerReference: CrowdtainerReference;
    try {
        signer = provider.getSigner();
    } catch (e) {
        console.log(`Error: ${e}`);
        error(500, "Internal server error. Please try again later.");
    }

    // Check if token is owned by wallet
    let isOwnerOfResult = await isOwnerOf(signerAddress, signer, Vouchers721Address, deliveryDetails.voucherId);
    if (isOwnerOfResult.isErr()) {
        error(500, "Unable to check token ownership.");
    }

    if (!isOwnerOfResult.unwrap()) {
        error(401, "The signature provided does not belog to a wallet which owns the specified token id");
    }

    let crowdtainerReferenceResult = (await getCrowdtainerFromTokenId(signer, Vouchers721Address, deliveryDetails.voucherId));
    if (crowdtainerReferenceResult.isErr()) {
        console.log(`Error: ${crowdtainerReferenceResult.unwrapErr()}`);
        error(500, `Failure to read campaign reference.`);
    }
    crowdtainerReference = crowdtainerReferenceResult.unwrap();

    // Check if user's country field input is valid and allowed.
    // If restriction found in respective projects.json definition, apply it.
    // An empty list means no restriction (all recognized countries are valid).

    // load shipping country restrictions
    let projectData = projects.filter((project) => project.crowdtainerId === crowdtainerReference.crowdtainerId.toNumber());
    if (projectData.length !== 1) {
        error(500, "Unable to find project data");
    }

    let currentProject = projectData[0];
    let allowedCountries = new Array<Country>();
    let supportedCountries = currentProject.supportedCountriesForShipping;
    if (supportedCountries.length > 0) {
        allowedCountries = countries.all().filter((currentCountry) =>
            supportedCountries.includes(currentCountry.country)
        );
    } else {
        allowedCountries = countries.all();
    }

    if (!allowedCountries.find((value) => value.alpha2 === deliveryDetails.deliveryAddress.country)) {
        error(401, `The country specified is not supported by this project: ${deliveryDetails.deliveryAddress.country}`);;
    }

    if (!allowedCountries.find((value) => value.alpha2 === deliveryDetails.billingAddress.country)) {
        error(401, `The billing country specified is not supported by this project: ${deliveryDetails.billingAddress.country}`);;
    }

    // Check if chainId is correct for based on project definition
    if (deliveryDetails.chainId !== currentProject.chainId) {
        error(401, `The chainId (${deliveryDetails.chainId}) for which the message was signed does not match the project's defined chainId (${currentProject.chainId})`);
    }

    try {

        let crowdtainerAddress = crowdtainerReference.contractAddress;
        // Check if the smart contract is in delivery state.
        const campaignStateResult = await getCampaignState(signer, Vouchers721Address, crowdtainerAddress);

        if (campaignStateResult.isErr()) {
            console.log(`Error: ${campaignStateResult.unwrapErr()}`);
            error(500, `Failure to read campaign status as in 'delivery state'.`);
        }

        if (campaignStateResult.unwrap() !== 2) {
            error(500, `Failure not in 'delivery state'.`);
        }

        // Key for item
        let key = deliveryVoucherKey(deliveryDetails.chainId, deliveryDetails.vouchers721Address, deliveryDetails.voucherId);

        let orderDetailsResult = await getOrderDetails(signer, Vouchers721Address, deliveryDetails.voucherId);

        if (orderDetailsResult.isErr()) {
            error(500, `Unable to get order details for token id: ${deliveryDetails.voucherId} in Vouchers721Address ${Vouchers721Address}.`);
        }

        let orderDetails = orderDetailsResult.unwrap();
        let quantities = new Array<Number>();

        orderDetails.description.forEach((element: Description) => {
            quantities.push(Number(element.amount));
        });

        console.log(`Inserting: ${JSON.stringify(key)}`);

        if (!deliveryDetails.billingAddress) {
            deliveryDetails.billingAddress = deliveryDetails.deliveryAddress;
        }

        let userDiscount = await getDiscountForWallet(signer, Vouchers721Address, crowdtainerAddress, signerAddress);
        if (userDiscount.isErr()) {
            error(500, `Unable get discount given to wallet: ${signerAddress} in Vouchers721Address ${Vouchers721Address}, on crowdtainer ID: ${crowdtainerReference.crowdtainerId}`);
        }

        let decimals = await getTokenDecimals(signer, crowdtainerAddress);
        if (decimals.isErr()) {
            error(500, `Unable to read token decimals from crowdtainer ID: ${crowdtainerReference.crowdtainerId}`);
        }

        await redis.multi()
            .hset(`${key}:deliveryAddress`, deliveryDetails.deliveryAddress)                                // Save delivery address
            .hset(`${key}:billingAddress`, deliveryDetails.billingAddress)                                  // Save billing address
            .set(`${key}:quantities`, JSON.stringify(quantities))                                           // Save order quantities
            .set(`${key}:discount`, JSON.stringify(toHuman(userDiscount.unwrap(), decimals.unwrap())))      // Save discount value
            .lpush(deliveryRequestsKey, key)                                                              // Add its id to the work queue
            .exec();

    } catch (e) {
        console.log(`Error: ${e}`);
        error(500, "Database error.");
    }

    return new Response("OK");
}

type Error = string;

//                  signerAddress: string,      // user stated signer address
//                         domain: string,      // user stated domain
//                          nonce: string,      // nonce with at least 8 digits
//                 currentTimeISO: string,      // time when signature was created
//                deliveryDetails: string,      // Participant's delivery request details
//                  signatureHash: hex string   // statement signature
function getPayload(item: any): Result<[
    signerAddress: string,
    domain: string,
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

    if (item.nonce == undefined) {
        return Err("Missing 'nonce' field");
    }

    if (item.currentTimeISO == undefined) {
        return Err("Missing 'currentTimeISO' field");
    }

    if (item.deliveryDetails == undefined) {
        return Err("Missing 'deliveryDetails' field");
    }

    let deliveryDetails = item.deliveryDetails as DeliveryDetails;
    if (!deliveryDetails) {
        return Err("'deliveryDetails' invalid.");
    }

    let addressKey: keyof Address;
    for (addressKey in deliveryDetails.deliveryAddress) {
        if (addressKey === 'complement' || addressKey === 'state') { // optional fields 
            continue;
        }
        if (deliveryDetails.deliveryAddress[addressKey] === '') {
            return Err(`Delivery Address missing ${camelToSentenceCase(addressKey).toLowerCase()} field`);
        }
    }

    for (addressKey in deliveryDetails.billingAddress) {
        if (addressKey === 'complement' || addressKey === 'state') { // optional fields
            continue;
        }
        if (deliveryDetails.billingAddress[addressKey] === '') {
            return Err(`Billing Address missing ${camelToSentenceCase(addressKey).toLowerCase()} field`);
        }
    }

    if (item.signatureHash == undefined) {
        return Err("Missing 'signatureHash' field");
    }

    try {
        const result: [string, string, string, string, DeliveryDetails, string] = [
            item.signerAddress,
            item.domain,
            item.nonce,
            item.currentTimeISO,
            item.deliveryDetails,
            item.signatureHash];
        return Ok(result);
    } catch (error) {
        return Err("Error decoding input fields");
    }
}