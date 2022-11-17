import redis from "$lib/Database/redis";                // Database
import { type Result, Ok, Err } from "@sniptt/monads";  // Monads
import type { RequestHandler } from '../../../.svelte-kit/types/src/routes/authProofAPI/__types/[address]' // Internal

import { ethers } from 'ethers';                        // Ethers
import { AuthorizationGateway__factory } from '../../routes/typechain/factories/Crowdtainer.sol/AuthorizationGateway__factory';

// POST Inputs: - { 
//                           calldata: bytes,
//                }
export const post: RequestHandler<string> = async ({ request, params }) => {

    let userWalletAddress = params.address;
    let returnValue: string;

    try {
        // Check if wallet is authorized (only possible when user signed the terms and conditions & validated their Email)
        let userSigKey = `userSignature:${userWalletAddress}`;
        const signatureCount = await redis.hget(userSigKey, "signatureCount");
        console.log(`signatureCount ${signatureCount}`);

        if (signatureCount === null) {
            console.log("Wallet has not completed all pre-order steps");
            return {
                status: 400,
                body: 'Wallet has not completed all pre-order steps'
            }
        }

        if (!ethers.utils.isAddress(userWalletAddress)) {
            return {
                status: 400,
                body: "Invalid wallet address"
            }
        }
        let calldataResult = getPayload(await request.json());

        if (calldataResult.isErr()) {
            return {
                status: 400,
                body: calldataResult.unwrapErr()
            };
        }

        let calldata = calldataResult.unwrap();

        if (!ethers.utils.isBytesLike(calldata)) {
            return {
                status: 400,
                body: "Invalid calldata parameter."
            }
        }

        let hexCalldata = ethers.utils.hexlify(calldata);
        const functionSelector = hexCalldata.slice(0, 10).toLowerCase();

        if (functionSelector !== `0x08b70706`) { //joinWithSignature() => 0x08b70706 
            return {
                status: 400,
                body: "Incorrect payload"
            }
        }

        const abiInterface = new ethers.utils.Interface(JSON.stringify(AuthorizationGateway__factory.abi));

        console.log(`Authorization request received from wallet: ${userWalletAddress}`);
        // Decode function arguments
        const args = abiInterface.decodeFunctionData("getSignedJoinApproval", `${hexCalldata}`);
        const [crowdtainerAddress, address, quantities, enableReferral, referralAddress] = args;

        console.log(`crowdtainerAddress: ${crowdtainerAddress}`);

        // TODO: Apply any sanity checks to parameters (e.g.: quantity too high)
        let epochExpiration = Math.floor(Date.now() / 1000) + import.meta.env.VITE_BACKEND_SIGNER_SIG_EXPIRATION_TIME_IN_SECONDS;
        let nonce = ethers.utils.randomBytes(32);
        let messageHash = ethers.utils.solidityKeccak256(["address", "address", "uint256[4]", "bool", "address", "uint64", "bytes32"],
            [crowdtainerAddress, userWalletAddress, quantities, enableReferral, referralAddress, epochExpiration, nonce]);
        let messageHashBinary = ethers.utils.arrayify(messageHash);

        let signer = new ethers.Wallet(import.meta.env.VITE_BACKEND_SIGNER_PRIVATE_KEY);
        let signature = await signer.signMessage(messageHashBinary);

        returnValue = ethers.utils.defaultAbiCoder.encode(["address", "uint64", "bytes32", "bytes"], [crowdtainerAddress, epochExpiration, nonce, signature]);

    } catch (error) {
        console.log(`${error}`);
        return {
            status: 400,
            body: `${error}`
        };
    }

    return {
        status: 200,
        body: returnValue
    };
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