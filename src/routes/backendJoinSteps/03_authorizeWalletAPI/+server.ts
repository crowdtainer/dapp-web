import { getDatabase } from "$lib/Database/redis";                // Database
import { BigNumber, ethers } from 'ethers';                        // Ethers
import { type Result, Ok, Err } from "@sniptt/monads";  // Monads

import { makeAgreeToTermsMessage, isTimeValid } from '$lib/Model/SignTerms';
import { Crowdtainer__factory } from '../../../routes/typechain/factories/Crowdtainer.sol/Crowdtainer__factory';

import { error, type RequestHandler } from '@sveltejs/kit';
import { validEmail } from "$lib/Validation/email.js";
import { Vouchers721Address } from '../../Data/projects.json';
import { provider } from "$lib/ethersCalls/provider.js";
import { limitStringLength, sanitizeString } from "$lib/Utils/sanitize.js";

async function costForWalletInCrowdtainer(provider: ethers.Signer | undefined,
    crowdtainerAddress: string,
    wallet: string): Promise<Result<BigNumber, string>> {

    if (!provider) {
        return Err("Provider not available.");
    }

    let fundsInCrowdtainer = BigNumber.from(0);

    try {
        const crowdtainerContract = Crowdtainer__factory.connect(crowdtainerAddress, provider);
        fundsInCrowdtainer = await crowdtainerContract.costForWallet(wallet);
    } catch (error) {
        return Err(`${error}`);
    }

    return Ok(fundsInCrowdtainer);
}

const ChainID = import.meta.env.VITE_WALLET_CONNECT_CHAIN_ID;

// POST Inputs: - {
//                          email: string,      // user's email
//                  signerAddress: string,      // user stated signer address
//                        chainId: string,      // Blockchain network ID
//                 voucherAddress: string,      // Voucher Contract address
//             crowdtainerAddress: string,      // Crowdtainer Address
//                         domain: string,      // user stated domain
//                          nonce: string,      // nonce
//                 currentTimeISO: string,      // time when signature was created
//                  signatureHash: hex string   // statement signature
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

    let [email, userWalletAddress, chainId, voucherAddress, crowdtainerAddress, domain, nonce, currentTimeISO, signatureHash] = result.unwrap();

    let validatedEmailsKey: string;
    try {

        if (!validEmail(email)) {
            throw error(400, "Invalid e-mail provided.");
        }

        if (!ethers.utils.isAddress(userWalletAddress)) {
            throw error(400, `Invalid wallet address (${userWalletAddress}).`);
        }

        if (Number(chainId) !== Number(ChainID)) {
            throw error(400, "Invalid chain ID.");
        }

        if (voucherAddress !== Vouchers721Address) {
            throw error(400, "Invalid wallet address.");
        }

        // Check if email was validated
        validatedEmailsKey = `validatedEmails:${email}`;
        const emailAuthorized = await redis.sismember(validatedEmailsKey, nonce);
        if (!emailAuthorized) {
            throw error(400, "Email address not validated.");
        }

        console.log(`siweMessage.issuedAt: ${currentTimeISO}`);

        // Perform domain/origin validation
        console.log(`client declared domain: ${domain}`);
        if (domain !== import.meta.env.VITE_DOMAIN) {
            throw error(400, `Invalid domain address: ${domain}. Expected: ${import.meta.env.VITE_DOMAIN}`);
        }

        let emailCodeKey = `userCode:${email}`;
        let providedCode = nonce;
        let actualCode: null | undefined | string;

        await redis.get(emailCodeKey, (err, result) => {
            if (err) {
                console.error(err);
            } else {
                actualCode = result;
            }
        });

        if (actualCode == undefined || actualCode !== String(providedCode)) {
            throw error(400, "Invalid nonce code.");
        }

        if (!isTimeValid(currentTimeISO)) {
            throw error(400, 'Signature timestamp too old or too far in the future.');
        }

        // Reconstruct the message locally
        let message = makeAgreeToTermsMessage(domain, email, userWalletAddress,
            chainId, voucherAddress, crowdtainerAddress, nonce, currentTimeISO);

        let recoveredSigner = ethers.utils.verifyMessage(message, signatureHash);

        if (!ethers.utils.isAddress(userWalletAddress)) {
            throw error(400, `Invalid wallet address (${userWalletAddress}).`);
        }

        // Check if signatures matches
        if (recoveredSigner !== userWalletAddress) {
            throw error(400, `Invalid statement or message signature.`);
        }

    } catch (_error) {
        console.dir(_error);
        throw error(400, `Invalid message: ${_error}`);
    }

    // Only one wallet per Email allowed.
    // Check if a wallet authorization for this email wasn't already issued
    let authorizedWalletsKey = `authorizedWallet:${chainId}:${voucherAddress}:${crowdtainerAddress}:${email}`;
    const walletResult = await redis.hget(authorizedWalletsKey, "wallet");

    if (walletResult != null) {
        console.log('Email formerly used.');
        let signer = provider.getSigner()
        // Check if the wallet has already joined the respective campaign. If yes, fail.
        let userFundsResult = await costForWalletInCrowdtainer(signer, crowdtainerAddress, walletResult);
        if (userFundsResult.isErr()) {
            throw error(500, `Failed to fetch wallet data. Please try again. ${userFundsResult.unwrapErr()}`);
        }
        let userFundsInCrowdtainer = userFundsResult.unwrap();
        if (!userFundsInCrowdtainer.isZero()) {
            throw error(400, `The provided e-mail was already used by another wallet, to join Crowtainer at address ${crowdtainerAddress}.`);
        }
    }
    if (process.env.NODE === 'development') {
        console.log(`authorizedWalletsKey: ${authorizedWalletsKey}; wallet: ${userWalletAddress}`);
    }

    // Check if wallet has already signed the Terms
    let userSigKey = `userSignature:${chainId}:${voucherAddress}:${crowdtainerAddress}:${userWalletAddress}`;
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
        await redis.multi()
            .hset(`${userSigKey}:${signatureCount}`, currentData)
            .hset(userSigKey, newData)
            .hset(authorizedWalletsKey, 'wallet', userWalletAddress)
            .hset(authorizedWalletsKey, 'nonce', nonce)
            .del(validatedEmailsKey)
            .exec();
    }
    else {
        // Persist
        const payload = {
            email: email,
            signatureHash: signatureHash,
            signatureCount: 0
        };

        // set wallet as authorized.
        await redis.multi()
            .del(validatedEmailsKey)
            .hset(userSigKey, payload)
            .hset(authorizedWalletsKey, 'wallet', userWalletAddress)
            .hset(authorizedWalletsKey, 'nonce', nonce)
            .exec();
        console.log(`userSigKey:${userSigKey} ; Value -> ${userSigKey}`);
    }

    console.log(`Authorized ${userWalletAddress}.`);
    return new Response("OK");
}

type Error = string;
function getPayload(item: any): Result<[email: string, signerAddress: string, chainId: string, voucherAddress: string, crowdtainerId: string,
    domain: string, nonce: string, currentTimeISO: string, signatureHash: string], Error> {

    if (item == undefined) {
        return Err("Missing payload");
    }
    if (item.email == undefined) {
        return Err("Missing 'email' field");
    }
    if (item.signerAddress == undefined) {
        return Err("Missing 'signerAddress' field");
    }
    if (item.chainId == undefined) {
        return Err("Missing 'chainId' field");
    }
    if (item.voucherAddress == undefined) {
        return Err("Missing 'voucherAddress' field");
    }
    if (item.crowdtainerAddress == undefined) {
        return Err("Missing 'crowdtainerAddress' field");
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
    if (item.signatureHash == undefined) {
        return Err("Missing 'signatureHash' field");
    }

    let email = limitStringLength(item.email, 150);
    let domain = limitStringLength(item.domain, 150);
    let chainIdResult = sanitizeString(item.chainId, 50, true);
    let currentTimeISO = limitStringLength(item.currentTimeISO, 29);
    let signerAddressResult = sanitizeString(item.signerAddress, 42);
    let voucherAddressResult = sanitizeString(item.voucherAddress, 42);
    let crowdtainerAddressResult = sanitizeString(item.crowdtainerAddress, 42);
    // "0x" + 65 bytes * 2 hexadecimal characters per byte (130 hexadecimal characters) = 132.
    let signatureHashResult = sanitizeString(item.signatureHash, 132);
    let nonceResult = sanitizeString(item.nonce, 50, true);

    if (chainIdResult.isErr()) {
        return Err(chainIdResult.unwrapErr());
    }
    if (nonceResult.isErr()) {
        return Err(nonceResult.unwrapErr());
    }
    if (signerAddressResult.isErr()) {
        return Err(signerAddressResult.unwrapErr());
    }
    if (voucherAddressResult.isErr()) {
        return Err(voucherAddressResult.unwrapErr());
    }
    if (crowdtainerAddressResult.isErr()) {
        return Err(crowdtainerAddressResult.unwrapErr());
    }
    if (signatureHashResult.isErr()) {
        return Err(signatureHashResult.unwrapErr());
    }

    try {
        const result: [string, string, string, string, string, string, string, string, string] =
            [email, signerAddressResult.unwrap(), chainIdResult.unwrap(), voucherAddressResult.unwrap(), crowdtainerAddressResult.unwrap(), domain,
                nonceResult.unwrap(), currentTimeISO, signatureHashResult.unwrap()];
        return Ok(result);
    } catch (error) {
        return Err("Error decoding input fields");
    }
}