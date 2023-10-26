import { getDatabase } from "$lib/Database/redis";              // Database
import { type Result, Ok, Err } from "@sniptt/monads";          // Monads
import { error, type RequestHandler } from '@sveltejs/kit';
import { ethers } from "ethers";
import { TX_SPONSOR_PRIVATE_KEY } from '$env/static/private';
import { AuthorizationGateway__factory, Vouchers721__factory } from "../../typechain/index.js";
import { joinProjectWithSignature } from "$lib/ethersCalls/rpcRequests.js";
import type { SignedPermitStruct } from '../../typechain/Vouchers721.js';
import { Vouchers721Address, projects } from '../../Data/projects.json';

import { provider } from "$lib/ethersCalls/provider.js";
import { getProvider } from "$lib/Utils/wallet.js";

let signer = new ethers.Wallet(TX_SPONSOR_PRIVATE_KEY, provider);
if (!ethers.isAddress(ethers.computeAddress(TX_SPONSOR_PRIVATE_KEY))) {
    const message = 'Invalid TX_SPONSOR_PRIVATE_KEY.';
    console.log(message);
    throw error(500, message);
}
let serviceProviderPK = await signer.getAddress();

const vouchers721Contract = Vouchers721__factory.connect(Vouchers721Address, getProvider());

let crowdtainerAddressToId: { [key: string]: number } = {};

const MaximumTxSponsorPerWalletCount = 5;
const RateLimitExpireTimeInSeconds = 3600; // value of zero means no expiration.

// POST Inputs: - {
// calldata:            Parameter values: [crowdtainerAddress, wallet, quantities, enableReferral, referralAddress]
// calldataSignature:   Service provider's signature over calldata: [crowdtainerAddress, epochExpiration, nonce, signature]:(["address", "uint64", "bytes32", "bytes"])
// signedPermit:        User's ERC-2612 spending permit (required if users' allowance < spending request)
//                }
export const POST: RequestHandler = async ({ request }) => {

    let redis = getDatabase();
    if (redis === undefined) {
        throw error(500, `Db connection error.`);
    }

    let result = getPayload(await request.json());
    if (result.isErr()) {
        throw error(400, result.unwrapErr());
    }

    let [calldata, calldataSignature, signedPermit] = result.unwrap();

    if (!ethers.isBytesLike(calldata)) {
        throw error(400, "Invalid calldata parameter.");
    }

    if (!ethers.isBytesLike(calldataSignature)) {
        throw error(400, "Invalid calldataSignature parameter.");
    }

    let hexCalldata = ethers.hexlify(calldata);
    const functionSelector = hexCalldata.slice(0, 10).toLowerCase();
    if (functionSelector !== `0xed52b41c`) { //getSignedJoinApproval().selector
        throw error(400, `Incorrect payload. Function selector: ${functionSelector}. Expected: 0x566a2cc2`);
    }

    const abiInterface = new ethers.Interface(JSON.stringify(AuthorizationGateway__factory.abi));

    // Decode function arguments
    const args = abiInterface.decodeFunctionData("getSignedJoinApproval", `${hexCalldata}`);
    const [crowdtainerAddress, decodedWalletAddress, quantities, enableReferral, referralAddress] = args;

    console.log(`Transaction sponsoring request received from wallet: ${decodedWalletAddress}`);

    // Check if this is a recognized Crowdtainer
    if (!crowdtainerAddressToId[crowdtainerAddress]) {
        let crowdtainerId: BigNumber;
        try {
            crowdtainerId = await vouchers721Contract.idForCrowdtainer(crowdtainerAddress);
            crowdtainerAddressToId[crowdtainerAddress] = crowdtainerId.toNumber();
        } catch (_error) {
            console.log(`${_error}`);
            throw error(400, `Crowdtainer not found.`);
        }
    }

    let jsonData = projects.filter(e => e.crowdtainerId === crowdtainerAddressToId[crowdtainerAddress]);
    if (jsonData.length != 1) {
        throw error(400, "Crowdtainer not found.");
    }

    // Check if transaction sponsoring is enabled for this project by the service provider.
    let projectData = jsonData[0];
    if (!projectData.txSponsoringEnabled) {
        throw error(400, "Transaction sponsoring not enabled for this project.");
    }

    // Add rate limit/counter per wallet
    let txSponsorCountKey = `txSponsorCount:${projectData.chainId}:${projectData.crowdtainerId}:${decodedWalletAddress}`;

    let currentCount: number;
    try {
        currentCount = await redis.incr(txSponsorCountKey);
        console.log(`hits: ${currentCount}, max: ${MaximumTxSponsorPerWalletCount}`);
        if (RateLimitExpireTimeInSeconds > 0) {
            await redis.expire(txSponsorCountKey, RateLimitExpireTimeInSeconds);
        }
    } catch (_error) {
        console.dir(_error);
        throw error(500, "Database failure.");
    }

    if (currentCount > MaximumTxSponsorPerWalletCount) {
        throw error(429, "Maximum sponsored transaction requests limit reached for the given wallet.");
    }

    // Check if service provider signature is valid by reconstructing the message and recovering the signer.

    // Get epochExpiration and nonce
    let [signedCrowdtainerAddress, epochExpiration, nonce, signature] = ethers.defaultAbiCoder.decode(["address", "uint64", "bytes32", "bytes"], calldataSignature);

    if (signedCrowdtainerAddress != crowdtainerAddress) {
        throw error(400, `CrowdtainerAddress mismatch between calldata input and signed calldata input.`);
    }

    let messageHash = ethers.solidityKeccak256(["address", "address", "uint256[]", "bool", "address", "uint64", "bytes32"],
        [crowdtainerAddress, decodedWalletAddress, quantities, enableReferral, referralAddress, epochExpiration, nonce]);
    let messageHashBinary = ethers.arrayify(messageHash);
    let recoveredSigner = ethers.verifyMessage(messageHashBinary, signature);

    if (serviceProviderPK != recoveredSigner) {
        throw error(400, `Service provider signature invalid: ${serviceProviderPK} ${recoveredSigner} `);
    }

    // All checks succeeded. Attempt to include the transaction on behalf of the user.

    let crowdtainerExtraData = ethers.defaultAbiCoder.encode(
        ['address', 'uint256[]', 'bool', 'address'],
        [decodedWalletAddress, quantities, enableReferral, referralAddress]
    );
    let extraData = ethers.defaultAbiCoder.encode(
        ['address', 'bytes4', 'bytes'],
        [crowdtainerAddress, ethers.hexlify('0x566a2cc2'), crowdtainerExtraData]
    );

    let joinTransaction = await joinProjectWithSignature(signer, Vouchers721Address, crowdtainerAddress,
        calldataSignature,
        extraData,
        signedPermit
    );

    if (joinTransaction.isErr()) {
        let errorString = joinTransaction.unwrapErr();
        let errorDescription =
            errorString.includes('Unknown') || errorString.includes('{}') || errorString.length === 0
                ? ''
                : `\n\n Details: ${errorString}`;
        console.log(`${joinTransaction.unwrapErr()}`);
        throw error(400, `Tx failed to join. ${errorDescription}`);
    }

    let txResult = await joinTransaction.unwrap().wait();
    if (txResult.status !== 1) {
        throw error(400, 'The transaction to join the campaing failed.');
    }

    return new Response("OK");
}

type Error = string;

function getPayload(item: any): Result<[string, string, SignedPermitStruct | undefined], Error> {

    if (item == undefined) {
        return Err("Missing payload");
    }

    if (item.calldata == undefined) {
        return Err("Missing 'calldata' field");
    }

    if (item.calldataSignature == undefined) {
        return Err("Missing 'calldataSignature' field");
    }

    const result: [string, string, SignedPermitStruct | undefined] = [item.calldata, item.calldataSignature, item.signedPermit];

    try {
        return Ok(result);
    } catch (error) {
        return Err("Error decoding input fields");
    }
}