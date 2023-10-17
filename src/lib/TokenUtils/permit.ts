import type { TypedDataSigner } from "@ethersproject/abstract-signer";
import { ethers, BigNumber, type Signer, type TypedDataDomain } from "ethers";
import type { SignedPermitStruct } from "../../routes/typechain/Vouchers721.js";
import { fetchUserNonce } from "$lib/ethersCalls/rpcRequests.js";
import { web3Provider } from "$lib/Utils/wallet.js";
import { Err, Ok, type Result } from "@sniptt/monads";

const types = {
    Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
    ]
}

type PermitValues = {
    owner: string;
    spender: string;
    value: BigNumber;
    nonce: BigNumber;
    deadline: BigNumber;
}

const getERC2612Permit = async (signer: Signer & TypedDataSigner,
    tokenName: string, version: string, chainId: BigNumber,
    tokenAddress: string, ownerAddress: string, spenderAddress: string,
    value: BigNumber, nonce: BigNumber, deadline: BigNumber): Promise<SignedPermitStruct> => {
    console.log(`ChainID: ${chainId}`);
    console.log(`tokenName: ${tokenName}`);
    console.log(`tokenVersion: ${version}`);

    let domainData: TypedDataDomain = {
        name: tokenName,
        version: version,
        chainId: chainId,
        verifyingContract: tokenAddress
    };

    let permitInput: PermitValues = {
        owner: ownerAddress,
        spender: spenderAddress,
        value: value,
        nonce: nonce,
        deadline: deadline
    };

    const rawSignature = await signer._signTypedData(domainData, types, permitInput);

    let signature: ethers.Signature = ethers.utils.splitSignature(rawSignature);

    let signedPermit: SignedPermitStruct;
    return signedPermit = {
        owner: permitInput.owner.toLocaleLowerCase(),
        spender: permitInput.spender.toLocaleLowerCase(),
        value: permitInput.value,
        nonce: permitInput.nonce,
        deadline: permitInput.deadline,
        v: signature.v,
        r: signature.r,
        s: signature.s
    };
}

export interface ERC2612_Input {
    userWalletAddress: string,
    crowdtainerAddress: string,
    chainId: number,
    tokenAddress: string,
    tokenName: string,
    tokenVersion: string,
    withPermitValue: BigNumber,
    signer: ethers.Signer & TypedDataSigner | undefined
}

export const getSignedPermit = async (
    input: ERC2612_Input
): Promise<Result<SignedPermitStruct, string>> => {
    if (!input.signer) {
        return Err(`Missing signer.`);
    }

    let nonceResult = await fetchUserNonce(web3Provider, input.tokenAddress);
    if (nonceResult.isErr()) {
        return Err(`Unable to fetch the current nonce: ${nonceResult.unwrapErr()}`);
    }

    let signedPermit: SignedPermitStruct;
    try {
        let expirationInSeconds = (new Date().getTime() / 1000 + 30 * 60).toFixed(0); // 30 minutes from now
        signedPermit = await getERC2612Permit(
            input.signer,
            input.tokenName,
            input.tokenVersion,
            BigNumber.from(input.chainId),
            input.tokenAddress,
            input.userWalletAddress,
            input.crowdtainerAddress,
            input.withPermitValue,
            nonceResult.unwrap(),
            BigNumber.from(expirationInSeconds)
        );
    } catch (error) {
        return Err(`Spending allowance signature rejected.`);
    }
    return Ok(signedPermit);
};