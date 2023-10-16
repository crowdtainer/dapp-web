import type { TypedDataSigner } from "@ethersproject/abstract-signer";
import { ethers, type BigNumber, type Signer, type TypedDataDomain } from "ethers";
import type { SignedPermitStruct } from "../../routes/typechain/Vouchers721.js";

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

export const getERC2612Permit = async (signer: Signer & TypedDataSigner,
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