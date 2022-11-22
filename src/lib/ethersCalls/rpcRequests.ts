import { Vouchers721__factory } from '../../routes/typechain/factories/Vouchers721__factory';
import { Crowdtainer__factory } from '../../routes/typechain/factories/Crowdtainer.sol/Crowdtainer__factory';
import { BigNumber, ethers, type BigNumberish, type ContractTransaction } from 'ethers';
import { IERC20__factory } from '../../routes/typechain/factories/IERC20__factory';

import { type Result, Ok, Err } from "@sniptt/monads";
import type { IERC20 } from 'src/routes/typechain/IERC20';
import type { UserStoreModel } from '$lib/Model/UserStoreModel';
import { decodeEthersError } from '$lib/Converters/EthersErrorHandler';

// TODO: next steps:
// - Adapt frontend to react to smart contract state updates:
//      - ERC20 Approval status. ✅
//      - Join button enabled when approval is granted. ✅
//      - Frontend should hide "add to pre-order button" if user already joined. ✅
//      - Implement "Leave" when campaign is in 'Funding' state. ✅
//      - Implement "JoinWithSignature". ✅
//      - Implement "Claim funds" for failed projects (in my wallet page). ✅
//      - Implement "My wallet" page, showing all participation proofs with its details. ✅
//      - Implement "Transfer to another wallet" button. // TODO: Continue here
//      - Frontend should show button to direct user to wallet tab when already joined.
//      - Implement "Checkout" button (add delivery address, persist in backend).
//      - Implement "Download invoice" button.

function makeError(error: any): Result<ContractTransaction, string> {
    let errorDecoderResult = decodeEthersError(error);
    if (errorDecoderResult.isErr()) {
        return Err(`${errorDecoderResult.unwrapErr()}`);
    } else {
        return Err(`${errorDecoderResult.unwrap()}`);
    }
}

export async function walletFundsInCrowdtainer(provider: ethers.Signer | undefined,
    crowdtainerAddress: string,
    wallet: string): Promise<Result<BigNumber, string>> {

    if (!provider) {
        return Err("Provider not available.");
    }

    let fundsInCrowdtainer: BigNumber;
    try {
        const crowdtainerContract = Crowdtainer__factory.connect(crowdtainerAddress, provider);
        fundsInCrowdtainer = await crowdtainerContract.costForWallet(wallet);
    } catch (error) {
        return Err(`${error}`);
    }

    return Ok(fundsInCrowdtainer);
}

export async function getERC20Contract(provider: ethers.Signer | undefined, crowdtainerAddress: string): Promise<Result<IERC20, string>> {

    if (!provider) {
        return Err("Provider not available.");
    }

    let erc20Address: string;
    let erc20Contract: IERC20;
    try {
        const crowdtainerContract = Crowdtainer__factory.connect(crowdtainerAddress, provider);
        erc20Address = await crowdtainerContract.token();
        erc20Contract = IERC20__factory.connect(erc20Address, provider);
    } catch (error) {
        return Err(`${error}`);
    }

    return Ok(erc20Contract);
}

export type NotEnoughFundsError = { current: BigNumber, required: BigNumber };

export async function hasEnoughFunds(erc20Contract: IERC20, signerAddress: string, totalCost: BigNumber): Promise<Result<BigNumber, NotEnoughFundsError>> {
    let balance = (await erc20Contract.balanceOf(signerAddress));
    console.log(`Current wallet balance: ${balance}`);

    if (balance.lt(totalCost)) {
        return Err({ current: balance, required: totalCost });
    }
    return Ok(balance);
}

export async function findTokenIdsForWallet(provider: ethers.Signer | undefined,
    vouchers721Address: string): Promise<Result<[BigNumber[], BigNumber[], string[]], string>> {

    if (provider === undefined) {
        return Err("Provider not available.");
    }

    try {
        const vouchers721Contract = Vouchers721__factory.connect(vouchers721Address, provider);

        let wallet = await provider.getAddress();
        let totalTokens = (await vouchers721Contract.balanceOf(wallet)).toNumber();

        let foundTokenIds: BigNumber[] = new Array<BigNumber>();
        let crowdtainerIds: BigNumber[] = new Array<BigNumber>();
        let crowdtainerAddresses: string[] = new Array<string>();

        for (let index = 0; index < totalTokens; index++) {
            const tokenId = await vouchers721Contract.tokenOfOwnerByIndex(wallet, BigNumber.from(index));
            let crowdtainerId = await vouchers721Contract.tokenIdToCrowdtainerId(tokenId);
            let foundCrowdtainerAddress = await vouchers721Contract.crowdtainerIdToAddress(crowdtainerId);
            console.log(`Wallet ${wallet} is owner of tokenId: ${tokenId}, from crowdtainerId ${crowdtainerId} @ address ${foundCrowdtainerAddress}`);

            foundTokenIds.push(tokenId);
            crowdtainerIds.push(crowdtainerId);
            crowdtainerAddresses.push(foundCrowdtainerAddress);
        }

        let result: [BigNumber[], BigNumber[], string[]] = [foundTokenIds, crowdtainerIds, crowdtainerAddresses];
        return Ok(result);

    } catch (error) {
        return Err(`${error}`);
    }
}


export async function leaveProject(provider: ethers.Signer | undefined,
    vouchers721Address: string,
    crowdtainerAddress: string): Promise<Result<ContractTransaction, string>> {

    if (provider === undefined) {
        return Err("Provider not available.");
    }

    const vouchers721Contract = Vouchers721__factory.connect(vouchers721Address, provider);

    // 1- Get token ids for connected wallet
    // 2- Filter by the crowdtainer project
    // 3- Call leave function

    let searchResult = await findTokenIdsForWallet(provider, vouchers721Address);

    if (searchResult.isErr()) {
        return Err(searchResult.unwrapErr());
    }

    let [tokenIds, , crowdtainerAddresses] = searchResult.unwrap();

    try {
        for (let index = 0; index < tokenIds.length; index++) {
            if (crowdtainerAddress === crowdtainerAddresses[index]) {
                let leaveTransaction = await vouchers721Contract.leave(tokenIds[index]);
                return Ok(leaveTransaction);
            }
        }

    } catch (error) {
        return makeError(error);
    }

    return Err("Did not find token for given wallet.")
}

export async function claimFunds(provider: ethers.Signer | undefined,
    crowdtainerAddress: string): Promise<Result<ContractTransaction, string>> {

    if (provider === undefined) {
        return Err("Provider not available.");
    }

    try {
        const crowdtainerContract = Crowdtainer__factory.connect(crowdtainerAddress, provider);
        let claimFundsTransaction = await crowdtainerContract.claimFunds();
        return Ok(claimFundsTransaction);
    } catch (error) {
        return makeError(error);
    }
}


export async function checkAllowance(signerAddress: string,
    erc20Contract: IERC20,
    crowdtainerAddress: string,
    totalCost: BigNumber): Promise<Result<string, string>> {

    try {
        let currentAllowance = await erc20Contract.allowance(signerAddress, crowdtainerAddress);

        if (currentAllowance.lt(totalCost)) {
            return Err(`Unable to request needed allowance. Required: ${totalCost}, current: ${currentAllowance}`);
        }
        return Ok(`Allowance available for ${crowdtainerAddress}.`);

    } catch (error) {
        return Err(`${error}`);
    }
}

export async function getSignerForCrowdtainer(provider: ethers.Signer, crowdtainerAddress: string): Promise<Result<string, string>> {
    try {
        const crowdtainerContract = Crowdtainer__factory.connect(crowdtainerAddress, provider);
        let crowdtainerSigner = await crowdtainerContract.getSigner();
        return Ok(crowdtainerSigner);
    } catch (error) {
        return Err(`Failed to read smart contract data: signer for crowdtainer @ ${crowdtainerAddress}`);
    }
}

export async function joinProjectWithSignature(provider: ethers.Signer | undefined, vouchers721Address: string,
    crowdtainerAddress: string,
    signedPayload: string,
    calldata: string): Promise<Result<ContractTransaction, string>> {
    if (provider === undefined) {
        return Err("Provider not available.");
    }
    try {
        const vouchers721Contract = Vouchers721__factory.connect(vouchers721Address, provider);

        console.log(`EIP-3668: join with signature enabled. Vouchers721 @ ${vouchers721Address}; Crowdtainer @ ${crowdtainerAddress}`);

        let result = await vouchers721Contract.joinWithSignature(signedPayload, calldata);

        return Ok(result);

    } catch (error) {
        return makeError(error);
    }
}

export async function joinProject(provider: ethers.Signer | undefined,
    vouchers721Address: string,
    crowdtainerAddress: string,
    quantities: number[]): Promise<Result<ContractTransaction, string>> {

    if (provider === undefined) {
        return Err("Provider not available.");
    }

    try {
        const vouchers721Contract = Vouchers721__factory.connect(vouchers721Address, provider);

        let arrayOfBigNumbers: [BigNumber, BigNumber, BigNumber, BigNumber] = [
            BigNumber.from(quantities[0]),
            BigNumber.from(quantities[1]),
            BigNumber.from(quantities[2]),
            BigNumber.from(quantities[3])
        ];

        console.log(`EIP-3668: join with signature disabled. Vouchers721 @ ${vouchers721Address}; Crowdtainer @ ${crowdtainerAddress}`);

        let result: ContractTransaction;
        result = await vouchers721Contract['join(address,uint256[4])'](crowdtainerAddress, arrayOfBigNumbers);
        return Ok(result);

    } catch (error) {
        return makeError(error);
    }
}

export async function fetchUserBalancesData(provider: ethers.Signer | undefined,
    crowdtainerAddress: string): Promise<Result<UserStoreModel, string>> {

    if (!provider) {
        return Err('Missing signer.');
    }

    const signerAddress = await provider.getAddress();
    let erc20Contract = await getERC20Contract(provider, crowdtainerAddress);
    if (erc20Contract.isErr()) {
        return Err(erc20Contract.unwrapErr());
    }

    let erc20Balance = await erc20Contract.unwrap().balanceOf(signerAddress);
    let erc20Allowance = await erc20Contract.unwrap().allowance(signerAddress, crowdtainerAddress)

    console.log(`Fetched data. Balance: ${erc20Balance}; Allowance: ${erc20Allowance}, for ${signerAddress}`);

    return Ok({ erc20Contract: erc20Contract.unwrap(), erc20Balance: erc20Balance, erc20Allowance: erc20Allowance });
}

export async function getTokenURI(
    provider: ethers.Signer | undefined,
    vouchers721Address: string,
    tokenId: number): Promise<Result<string, string>> {
    if (provider === undefined) {
        return Err("Provider not available.");
    }
    try {
        const vouchers721Contract = Vouchers721__factory.connect(vouchers721Address, provider);
        let result = await vouchers721Contract.tokenURI(tokenId);
        return Ok(result);
    } catch (error) {
        return Err(`${error}`);
    }
}