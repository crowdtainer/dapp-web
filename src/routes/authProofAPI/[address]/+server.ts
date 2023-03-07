import { getDatabase } from "$lib/Database/redis";      // Database
import { type Result, Ok, Err } from "@sniptt/monads";  // Monads
import type { RequestHandler } from './$types';         // Internal

import { BigNumber, ethers } from 'ethers';             // Ethers
import { AuthorizationGateway__factory } from '../../../routes/typechain/factories/Crowdtainer.sol/AuthorizationGateway__factory';
import { error } from "@sveltejs/kit";

import { AUTHORIZER_PRIVATE_KEY } from '$env/static/private';
import { AUTHORIZER_SIGNATURE_EXPIRATION_TIME_IN_SECONDS } from '$env/static/private';

const ERC20_MAXIMUM_PURCHASE_VALUE = 450;

let availableCrowdtainerIds: number[] = [];
import { projects } from '../../Data/projects.json';
import type { CrowdtainerStaticModel } from "$lib/Model/CrowdtainerModel.js";
import { fetchStaticData } from "$lib/ethersCalls/fetchStaticData.js";
for (let result of projects) {
    availableCrowdtainerIds.push(result.crowdtainerId);
}

let campaignStaticData = new Array<CrowdtainerStaticModel>();

// POST Inputs: - { 
//                           calldata: bytes,
//                }
export const POST: RequestHandler = async ({ request, params }) => {

    let redis = getDatabase();
    if (redis === undefined) {
        throw error(500, `Db connection error.`);
    }

    try {
        for (let i = 0; i < availableCrowdtainerIds.length; i++) {
            let crowdtainer = BigNumber.from(Number(availableCrowdtainerIds[i]));
            console.log(`Got here`);
            let result = await fetchStaticData(crowdtainer);

            if (result.isOk()) {
                campaignStaticData.push(result.unwrap());
            } else {
                // Fail if any id request fails.
                throw error(500, `${result.unwrapErr()}`);
            }
        }
    } catch (_error) {
        console.log(`Error: ${_error}`);
        throw error(500, `${_error}`);
    }

    let userWalletAddress = params.address;
    let returnValue: string;

    if (!ethers.utils.isAddress(ethers.utils.computeAddress(AUTHORIZER_PRIVATE_KEY))) {
        const message = 'Invalid AUTHORIZER_PRIVATE_KEY.';
        console.log(message);
        throw error(500, message);
    }

    // Check if wallet is authorized (only possible when user signed the terms and conditions & validated their Email)
    let userSigKey = `userSignature:${userWalletAddress}`;
    const signatureCount = await redis.hget(userSigKey, "signatureCount");
    console.log(`signatureCount ${signatureCount}`);

    if (signatureCount === null) {
        const message = `Wallet ${userWalletAddress} has not completed all pre-order steps.`;
        console.log(message);
        throw error(400, message);
    }

    if (!ethers.utils.isAddress(userWalletAddress)) {
        throw error(400, "Invalid wallet address.");
    }

    let calldataResult = getPayload(await request.json());

    if (calldataResult.isErr()) {
        throw error(400, calldataResult.unwrapErr());
    }

    let calldata = calldataResult.unwrap();

    if (!ethers.utils.isBytesLike(calldata)) {
        throw error(400, "Invalid calldata parameter.");
    }

    let hexCalldata = ethers.utils.hexlify(calldata);
    const functionSelector = hexCalldata.slice(0, 10).toLowerCase();

    if (functionSelector !== `0x08b70706`) { //joinWithSignature() => 0x08b70706
        throw error(400, "Incorrect payload.");
    }

    const abiInterface = new ethers.utils.Interface(JSON.stringify(AuthorizationGateway__factory.abi));

    console.log(`Authorization request received from wallet: ${userWalletAddress}`);
    // Decode function arguments
    const args = abiInterface.decodeFunctionData("getSignedJoinApproval", `${hexCalldata}`);
    const [crowdtainerAddress, address, quantities, enableReferral, referralAddress] = args;

    // Apply sanity checks and restrictions
    let campaignData: CrowdtainerStaticModel | undefined;
    campaignStaticData.forEach((value: CrowdtainerStaticModel, _key: number) => {
        if (value.contractAddress === crowdtainerAddress) {
            campaignData = value;
        }
    });

    if (campaignData === undefined) {
        throw error(400, `Unrecognized crowdtainer address.`);
    }

    let totalValue = BigNumber.from(0);

    for (let i = 0; i < campaignData.prices.length; i++) {
        console.log(`Quantities[${i}]: ${quantities[i]}`);
        totalValue = totalValue.add(campaignData.prices[i].mul(BigNumber.from(quantities[i])));
    }

    let maxCost = ethers.utils.parseUnits(`${ERC20_MAXIMUM_PURCHASE_VALUE}`, campaignData.tokenDecimals);

    console.log(`total order value: ${totalValue}`);
    console.log(`max allowed: ${maxCost}`);

    if (totalValue > maxCost) {
        throw error(400, `Order amount too high. Maximum: ${ERC20_MAXIMUM_PURCHASE_VALUE} ${campaignData.tokenSymbol}.`);
    }

    let epochExpiration = BigNumber.from(Math.floor(Date.now() / 1000) + AUTHORIZER_SIGNATURE_EXPIRATION_TIME_IN_SECONDS);
    let nonce = ethers.utils.randomBytes(32);
    let messageHash = ethers.utils.solidityKeccak256(["address", "address", "uint256[4]", "bool", "address", "uint64", "bytes32"],
        [crowdtainerAddress, userWalletAddress, quantities, enableReferral, referralAddress, epochExpiration, nonce]);
    let messageHashBinary = ethers.utils.arrayify(messageHash);

    let signer = new ethers.Wallet(AUTHORIZER_PRIVATE_KEY);
    let signature = await signer.signMessage(messageHashBinary);

    returnValue = ethers.utils.defaultAbiCoder.encode(["address", "uint64", "bytes32", "bytes"], [crowdtainerAddress, epochExpiration, nonce, signature]);
    console.log(`Authorization granted for wallet: ${userWalletAddress}`);

    return new Response(returnValue);
}

type Error = string;

function getPayload(item: any): Result<number, Error> {
    if (item == undefined) {
        return Err("Missing payload");
    }

    if (item.calldata == undefined) {
        return Err("Missing 'calldata' field");
    }
    try {
        return Ok(item.calldata);
    } catch (error) {
        return Err("Error decoding input fields");
    }
}