import { getDatabase } from "$lib/Database/redis";      // Database
import { type Result, Ok, Err } from "@sniptt/monads";  // Monads

import { BigNumber, ethers } from 'ethers';             // Ethers
import { AuthorizationGateway__factory } from '../../../typechain/factories/Crowdtainer.sol/AuthorizationGateway__factory';
import { error, type RequestHandler } from "@sveltejs/kit";

import { AUTHORIZER_PRIVATE_KEY } from '$env/static/private';
import { AUTHORIZER_SIGNATURE_EXPIRATION_TIME_IN_SECONDS } from '$env/static/private';

const ChainID = import.meta.env.VITE_WALLET_CONNECT_CHAIN_ID;
import { Vouchers721Address } from '../../../Data/projects.json';

let availableCrowdtainerIds: number[] = [];
import { projects, ERC20_MaximumPurchaseValuePerWallet } from '../../../Data/projects.json';
import type { CrowdtainerStaticModel } from "$lib/Model/CrowdtainerModel.js";
import { fetchStaticData } from "$lib/ethersCalls/fetchStaticData.js";
import { moneyFormatter } from "$lib/Utils/moneyFormatter.js";
import { toHuman } from "$lib/Converters/CrowdtainerData.js";
for (let result of projects) {
    availableCrowdtainerIds.push(result.crowdtainerId);
}

let campaignStaticData: CrowdtainerStaticModel[] | undefined;

if (!ethers.isAddress(ethers.computeAddress(AUTHORIZER_PRIVATE_KEY))) {
    const message = 'Invalid AUTHORIZER_PRIVATE_KEY.';
    console.log(message);
    throw error(500, message);
}
let signer = new ethers.Wallet(AUTHORIZER_PRIVATE_KEY);

async function loadCampaignData(): Promise<CrowdtainerStaticModel[]> {
    let campaignStaticData = new Array<CrowdtainerStaticModel>();
    try {
        for (let i = 0; i < availableCrowdtainerIds.length; i++) {
            let crowdtainer = BigNumber.from(Number(availableCrowdtainerIds[i]));
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
    return campaignStaticData;
}

// POST Inputs: - { 
//                   calldata: bytes,
//                }
export const POST: RequestHandler = async ({ request, params }) => {

    if(!campaignStaticData) { // first execution
       campaignStaticData =  await loadCampaignData();
    }

    let redis = getDatabase();
    if (redis === undefined) {
        throw error(500, `Db connection error.`);
    }

    let userWalletAddress = params.address;
    let returnValue: string;

    if (!userWalletAddress) {
        throw error(500, 'Missing wallet address parameter.');
    }

    if (!ethers.isAddress(userWalletAddress)) {
        throw error(400, "Invalid wallet address.");
    }

    let calldataResult = getPayload(await request.json());

    if (calldataResult.isErr()) {
        throw error(400, calldataResult.unwrapErr());
    }

    let calldata = calldataResult.unwrap();

    if (!ethers.isBytesLike(calldata)) {
        throw error(400, "Invalid calldata parameter.");
    }

    // console.log(`Selector: ${ethers.id('joinWithSignature(bytes,bytes)')}`);
    let hexCalldata = ethers.hexlify(calldata);
    const functionSelector = hexCalldata.slice(0, 10).toLowerCase();
    if (functionSelector !== `0xed52b41c`) { //getSignedJoinApproval().selector
        throw error(400, `Incorrect payload. Function selector: ${functionSelector}. Expected: 0x566a2cc2`);
    }

    const abiInterface = new ethers.Interface(JSON.stringify(AuthorizationGateway__factory.abi));

    console.log(`Authorization request received from wallet: ${userWalletAddress}`);
    // Decode function arguments
    const args = abiInterface.decodeFunctionData("getSignedJoinApproval", `${hexCalldata}`);
    const [crowdtainerAddress, decodedWalletAddress, quantities, enableReferral, referralAddress] = args;

    if (userWalletAddress !== decodedWalletAddress) {
        throw error(400, `Unexpected wallet address.`);
    }

    // Check if wallet is authorized (only possible when user went through all previous steps).
    // Check presence of user signature.
    let userSigKey = `userSignature:${ChainID}:${Vouchers721Address}:${crowdtainerAddress}:${userWalletAddress}`;
    const signatureCount = await redis.hget(userSigKey, "signatureCount");
    const userEmail = await redis.hget(userSigKey, "email");

    if (!signatureCount || !userEmail) {
        const message = `Wallet ${userWalletAddress} has not completed all pre-order steps.`;
        console.log(message);
        throw error(400, message);
    }

    console.log(`signatureCount ${signatureCount}`);

    // Check if wallet has been 'authorized' by users's email.
    let authorizedWalletsKey = `authorizedWallet:${ChainID}:${Vouchers721Address}:${crowdtainerAddress}:${userEmail}`;
    const walletResult = await redis.hget(authorizedWalletsKey, "wallet");

    if (!walletResult) {
        throw error(400, `The wallet has not completed all join steps and is not authorized (${userWalletAddress}).`);
    } else if (walletResult && walletResult != userWalletAddress) {
        throw error(400, `Only one wallet per Email is allowed, however the given Email was already used by another wallet. `);
    }

    const walletNonceResult = Number(await redis.hget(authorizedWalletsKey, "nonce"));
    if (!walletNonceResult || walletNonceResult == 0) {
        throw error(500, `Inconsistent data. Please contact the service provider.`);
    }

    console.log(`raw nonce: ${walletNonceResult}`);
    const nonce = ethers.hexZeroPad(ethers.hexlify(walletNonceResult), 32);
    console.log(`actual: ${nonce}`);

    // Apply other sanity checks and restrictions
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

    let maxCost = ethers.parseUnits(`${ERC20_MaximumPurchaseValuePerWallet}`, campaignData.tokenDecimals);

    console.log(`total order value: ${totalValue}`);
    console.log(`max allowed: ${maxCost}`);

    if (referralAddress !== '0x0000000000000000000000000000000000000000') {
        // apply discount
        console.log(`Before discount: ${totalValue}`);
        let rate = campaignData.referralRate.div(2);
        let discount = BigNumber.from(totalValue).toNumber() * BigNumber.from(rate).toNumber() / 100;
        totalValue = totalValue.sub(BigNumber.from(discount));
        console.log(`rate: ${rate}`);
        console.log(`discount: ${discount}`);
        console.log(`After discount: ${totalValue}`);
    }

    if (totalValue.gt(maxCost)) {
        throw error(400, `Order amount too high: ${moneyFormatter.format(Number(toHuman(totalValue, campaignData.tokenDecimals)))} ${campaignData.tokenSymbol}. Maximum: ${moneyFormatter.format(Number(toHuman(maxCost, campaignData.tokenDecimals)))} ${campaignData.tokenSymbol}.`);
    }

    let epochExpiration = BigNumber.from(Math.floor(Date.now() / 1000) + AUTHORIZER_SIGNATURE_EXPIRATION_TIME_IN_SECONDS);
    let messageHash = ethers.solidityKeccak256(["address", "address", "uint256[]", "bool", "address", "uint64", "bytes32"],
        [crowdtainerAddress, userWalletAddress, quantities, enableReferral, referralAddress, epochExpiration, nonce]);
    let messageHashBinary = ethers.arrayify(messageHash);

    let signature = await signer.signMessage(messageHashBinary);

    returnValue = ethers.defaultAbiCoder.encode(["address", "uint64", "bytes32", "bytes"], [crowdtainerAddress, epochExpiration, nonce, signature]);
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
