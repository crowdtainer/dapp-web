import redis from "$lib/Database/redis";                // Database
import { type Result, Ok, Err } from "@sniptt/monads";  // Monads
import type { RequestHandler } from './$types';         // Internal

import { BigNumber, ethers } from 'ethers';                        // Ethers
import { AuthorizationGateway__factory } from '../../../routes/typechain/factories/Crowdtainer.sol/AuthorizationGateway__factory';
import { error } from "@sveltejs/kit";

// POST Inputs: - { 
//                           calldata: bytes,
//                }
export const POST: RequestHandler = async ({ request, params }) => {

    let userWalletAddress = params.address;
    let returnValue: string;

    if(import.meta.env.VITE_BACKEND_SIGNER_SIG_EXPIRATION_TIME_IN_SECONDS === undefined) {
        console.log(`Required environment variable missing: VITE_BACKEND_SIGNER_SIG_EXPIRATION_TIME_IN_SECONDS`);
        throw error(500, "Server error");
    }

    if(import.meta.env.VITE_BACKEND_SIGNER_PRIVATE_KEY === undefined) {
        console.log(`Required environment variable missing: VITE_BACKEND_SIGNER_PRIVATE_KEY`);
        throw error(500, "Server error");
    }

    try {
        // Check if wallet is authorized (only possible when user signed the terms and conditions & validated their Email)
        let userSigKey = `userSignature:${userWalletAddress}`;
        const signatureCount = await redis.hget(userSigKey, "signatureCount");
        console.log(`signatureCount ${signatureCount}`);

        if (signatureCount === null) {
            console.log("Wallet has not completed all pre-order steps.");
            throw error(400, "Wallet has not completed all pre-order steps.");
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

        // TODO: Apply any sanity checks to parameters (e.g.: quantity too high)
        let epochExpiration = BigNumber.from(Math.floor(Date.now() / 1000) + import.meta.env.VITE_BACKEND_SIGNER_SIG_EXPIRATION_TIME_IN_SECONDS);
        let nonce = ethers.utils.randomBytes(32);
        let messageHash = ethers.utils.solidityKeccak256(["address", "address", "uint256[4]", "bool", "address", "uint64", "bytes32"],
            [crowdtainerAddress, userWalletAddress, quantities, enableReferral, referralAddress, epochExpiration, nonce]);
        let messageHashBinary = ethers.utils.arrayify(messageHash);

        let signer = new ethers.Wallet(import.meta.env.VITE_BACKEND_SIGNER_PRIVATE_KEY);
        let signature = await signer.signMessage(messageHashBinary);

        returnValue = ethers.utils.defaultAbiCoder.encode(["address", "uint64", "bytes32", "bytes"], [crowdtainerAddress, epochExpiration, nonce, signature]);

    } catch (_error) {
        console.dir(_error);
        throw error(400, `${error}`);
    }

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