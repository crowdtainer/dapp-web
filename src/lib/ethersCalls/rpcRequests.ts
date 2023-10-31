import { Vouchers721__factory } from '../../routes/typechain/factories/Vouchers721__factory';
import { Crowdtainer__factory } from '../../routes/typechain/factories/Crowdtainer.sol/Crowdtainer__factory';
import { BigNumber, ethers, type ContractTransaction } from 'ethers';
import { IERC20__factory } from '../../routes/typechain/factories/IERC20__factory';

import { type Result, Ok, Err } from "@sniptt/monads";
import type { IERC20 } from '../../routes/typechain/IERC20';
import type { UserStoreModel } from '$lib/Model/UserStoreModel';
import { decodeEthersError } from '$lib/Converters/EthersErrorHandler';
import { accountAddress, getSigner } from '$lib/Utils/wallet';
import type { WalletCrowdtainerModel } from '$lib/Model/WalletCrowdtainerModel.js';
import { toHuman } from '$lib/Converters/CrowdtainerData.js';
import type { SignedPermitStruct, Vouchers721 } from '../../routes/typechain/Vouchers721.js';
import { IERC20Permit__factory, type IERC20Permit } from '../../routes/typechain/index.js';
import { waitForTransaction } from '$lib/Utils/transactionHandling.js';

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
    wallet: string): Promise<Result<WalletCrowdtainerModel, string>> {

    if (!provider) {
        return Err("Provider not available.");
    }

    if (!accountAddress) {
        return Err("Account not available.");
    }

    let walletCrowdtainerData: WalletCrowdtainerModel = {
        fundsInCrowdtainer: BigNumber.from(0),
        accumulatedRewards: BigNumber.from(0)
    };

    try {
        const crowdtainerContract = Crowdtainer__factory.connect(crowdtainerAddress, provider);
        walletCrowdtainerData.fundsInCrowdtainer = await crowdtainerContract.costForWallet(wallet);
        walletCrowdtainerData.accumulatedRewards = await crowdtainerContract.accumulatedRewardsOf(wallet);
    } catch (error) {
        return Err(`${error}`);
    }

    return Ok(walletCrowdtainerData);
}

export async function getERC20Contract(provider: ethers.Signer | ethers.providers.JsonRpcProvider | undefined, crowdtainerAddress: string): Promise<Result<IERC20, string>> {

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

export type TokenIDAssociations = {
    foundTokenIds: number[],
    crowdtainerIds: number[],
    crowdtainerAddresses: string[]
};

export function makeNewTokenIDAssociations(): TokenIDAssociations {
    return { foundTokenIds: new Array<number>(), crowdtainerIds: new Array<number>(), crowdtainerAddresses: new Array<string>() };
}

export async function hasEnoughFunds(erc20Contract: IERC20, signerAddress: string, totalCost: BigNumber): Promise<Result<BigNumber, NotEnoughFundsError>> {
    let balance = (await erc20Contract.balanceOf(signerAddress));
    console.log(`Current wallet balance: ${balance}`);

    if (balance.lt(totalCost)) {
        return Err({ current: balance, required: totalCost });
    }
    return Ok(balance);
}

export async function findTokenIdsForWallet(provider: ethers.Signer | undefined,
    vouchers721Address: string, walletAddress: string): Promise<Result<TokenIDAssociations, string>> {

    if (provider === undefined) {
        return Err("Provider not available.");
    }

    try {
        const vouchers721Contract = Vouchers721__factory.connect(vouchers721Address, provider);

        if (!walletAddress || walletAddress == '') {
            return Err("Unable to read connected wallet address.");
        }

        let totalTokens = (await vouchers721Contract.balanceOf(walletAddress)).toNumber();
        console.log(`totalTokens: ${totalTokens} for wallet ${walletAddress}`);

        let tokenAssociations = makeNewTokenIDAssociations();

        for (let index = 0; index < totalTokens; index++) {
            const tokenId = await vouchers721Contract.tokenOfOwnerByIndex(walletAddress, BigNumber.from(index));
            let crowdtainerId = await vouchers721Contract.tokenIdToCrowdtainerId(tokenId);
            let foundCrowdtainerAddress = await vouchers721Contract.crowdtainerIdToAddress(crowdtainerId);
            console.log(`Wallet ${walletAddress} is owner of tokenId: ${tokenId}, from crowdtainerId ${crowdtainerId} @ address ${foundCrowdtainerAddress}`);

            tokenAssociations.foundTokenIds.push(tokenId.toNumber());
            tokenAssociations.crowdtainerIds.push(crowdtainerId.toNumber());
            tokenAssociations.crowdtainerAddresses.push(foundCrowdtainerAddress);
        }

        return Ok(tokenAssociations);

    } catch (error) {
        return Err(`${error}`);
    }
}

export async function isReferralEnabledForAddress(provider: ethers.Signer, crowdtainerAddress: string, walletAddress: string): Promise<Result<boolean, string>> {
    try {
        const crowdtainerContract = Crowdtainer__factory.connect(crowdtainerAddress, provider);
        let enabledReferral = await crowdtainerContract.enableReferral(walletAddress);
        return Ok(enabledReferral);
    } catch (error) {
        return Err(`Failed to read smart contract data: couldn't check if referrals are enabled for ${walletAddress}. Details: ${error}`);
    }
}

export async function leaveProject(provider: ethers.Signer | undefined, wallet: string,
    vouchers721Address: string,
    crowdtainerAddress: string): Promise<Result<ContractTransaction, string>> {

    if (provider === undefined) {
        return Err("Provider not available.");
    }

    let vouchers721Contract: Vouchers721;
    try {
        vouchers721Contract = Vouchers721__factory.connect(vouchers721Address, provider);
    } catch (error) {
        console.log(`Unable to connect to vouchers contract: ${error}`);
        return Err(`Unable to connect to vouchers contract: ${error}`);
    }

    // 1- Get token ids for connected wallet
    // 2- Filter by the crowdtainer project
    // 3- Call leave function
    let searchResult = await findTokenIdsForWallet(provider, vouchers721Address, wallet);

    if (searchResult.isErr()) {
        return Err(searchResult.unwrapErr());
    }

    let tokenIdsAssociations = searchResult.unwrap();

    try {
        for (let index = 0; index < tokenIdsAssociations.foundTokenIds.length; index++) {
            if (crowdtainerAddress.toLowerCase() === tokenIdsAssociations.crowdtainerAddresses[index].toLowerCase()) {

                console.log(`Calling leave with parameter: ${tokenIdsAssociations.foundTokenIds[index]}`);
                let leaveTransaction = await vouchers721Contract.leave(BigNumber.from(tokenIdsAssociations.foundTokenIds[index]));

                let transactionReceipt: ethers.providers.TransactionReceipt | undefined = undefined;
                let error: string = '';
                try {
                    transactionReceipt = await waitForTransaction(leaveTransaction.hash);
                } catch (_error) {
                    error = `${_error}`;
                }

                if (!transactionReceipt || transactionReceipt.confirmations < 1) {
                    // tx failed
                    console.log(`Failed to leave project.`);
                    return Err('Leave transaction failed.');
                }
                return Ok(leaveTransaction);
            }
        }
    } catch (error) {
        console.log(error);
        return makeError(error);
    }

    return Err(`Did not find token for given wallet: ${wallet}`)
}

export async function claimFunds(provider: ethers.Signer | undefined,
    crowdtainerAddress: string): Promise<Result<ContractTransaction, string>> {

    if (provider === undefined) {
        return Err("Provider not available.");
    }

    try {
        const crowdtainerContract = Crowdtainer__factory.connect(crowdtainerAddress, provider);
        let claimFundsTransaction = await crowdtainerContract['claimFunds()']();
        return Ok(claimFundsTransaction);
    } catch (error) {
        return makeError(error);
    }
}

export async function claimRewards(provider: ethers.Signer | undefined,
    crowdtainerAddress: string): Promise<Result<ContractTransaction, string>> {

    if (provider === undefined) {
        return Err("Provider not available.");
    }

    try {
        const crowdtainerContract = Crowdtainer__factory.connect(crowdtainerAddress, provider);
        let claimFundsTransaction = await crowdtainerContract.claimRewards();
        return Ok(claimFundsTransaction);
    } catch (error) {
        return makeError(error);
    }
}

export async function transferToken(provider: ethers.Signer | undefined,
    vouchers721Address: string, targetWallet: string, tokenId: number): Promise<Result<ContractTransaction, string>> {

    if (provider === undefined) {
        return Err("Provider not available.");
    }

    try {
        let resolvedAddress: string;
        if (ethers.utils.isAddress(targetWallet)) {
            resolvedAddress = targetWallet;
        }
        else {
            // Try for ENS address resolution
            resolvedAddress = await provider.resolveName(targetWallet);
            if (!ethers.utils.isAddress(resolvedAddress)) {
                return Err('Invalid ethereum address and ENS resolution failed.');
            }
        }
        const vouchers721Contract = Vouchers721__factory.connect(vouchers721Address, provider);
        let claimFundsTransaction = await vouchers721Contract.transferFrom(provider.getAddress(), resolvedAddress, BigNumber.from(tokenId));
        return Ok(claimFundsTransaction);
    } catch (error) {
        return makeError(error);
    }
}

export async function checkAllowance(signerAddress: string,
    erc20Contract: IERC20,
    erc20Decimals: number,
    crowdtainerAddress: string,
    totalCost: BigNumber): Promise<Result<string, string>> {

    try {
        console.log(`erc20Decimals: ${erc20Decimals}`);
        let currentAllowance = await erc20Contract.allowance(signerAddress, crowdtainerAddress);

        if (currentAllowance.lt(totalCost)) {
            return Err(`Unable to request needed allowance. Required: ${toHuman(totalCost, erc20Decimals)}, current: ${toHuman(currentAllowance, erc20Decimals)}`);
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
    calldata: string,
    signedPermit: SignedPermitStruct | undefined): Promise<Result<ContractTransaction, string>> {
    if (provider === undefined) {
        return Err("Provider not available.");
    }
    try {
        console.log(`EIP-3668: join with signature enabled. Vouchers721 @ ${vouchers721Address}; Crowdtainer @ ${crowdtainerAddress}`);

        const vouchers721Contract = Vouchers721__factory.connect(vouchers721Address, provider);

        let result: ContractTransaction;
        if (signedPermit) {
            console.log(`Join with signature call invoked with allowance permit.`);
            result = await vouchers721Contract.joinWithSignatureAndPermit(signedPayload, calldata, signedPermit);
        } else {
            result = await vouchers721Contract.joinWithSignature(signedPayload, calldata);
            console.log(`Join with signature call invoked wihout allowance permit.`);
        }

        return Ok(result);
    } catch (error) {
        console.dir(error);
        return makeError(error);
    }
}

export async function joinProject(provider: ethers.Signer | undefined,
    vouchers721Address: string,
    crowdtainerAddress: string,
    quantities: number[],
    validUserCouponCode: string,
    referralEnabled: boolean,
    signedPermit: SignedPermitStruct | undefined): Promise<Result<ContractTransaction, string>> {

    if (provider === undefined) {
        return Err("Provider not available.");
    }

    try {
        const vouchers721Contract = Vouchers721__factory.connect(vouchers721Address, provider);

        let quantitiesBigNum = new Array<BigNumber>();
        quantities.forEach(element => {
            quantitiesBigNum.push(BigNumber.from(element));
        });

        console.log(`EIP-3668: join with signature disabled. Vouchers721 @ ${vouchers721Address}; Crowdtainer @ ${crowdtainerAddress}`);

        if (signedPermit) {
            console.log(`Join call invoked with permit/allowance.`);
            let result: ContractTransaction = await vouchers721Contract['join(address,uint256[],bool,address,(address,address,uint256,uint256,uint256,uint8,bytes32,bytes32))'](crowdtainerAddress, quantitiesBigNum, referralEnabled, validUserCouponCode, signedPermit);
            if (result) {
                console.log(`raw data: ${JSON.stringify(result.raw)}`);
            }
            return Ok(result);
        } else {
            console.log(`Join call invoked wihout allowance permit.`);
            let result: ContractTransaction = await vouchers721Contract['join(address,uint256[],bool,address)'](crowdtainerAddress, quantitiesBigNum, referralEnabled, validUserCouponCode)
            return Ok(result);
        }

    } catch (error) {
        return makeError(error);
    }
}

export async function fetchUserBalancesData(provider: ethers.providers.JsonRpcProvider | undefined,
    crowdtainerAddress: string): Promise<Result<UserStoreModel, string>> {

    if (!provider) {
        return Err('Missing signer.');
    }

    let signer = getSigner();
    if (signer === undefined) {
        return Err('Signer not available.');
    }
    const signerAddress = await signer.getAddress();
    let erc20Contract = await getERC20Contract(provider, crowdtainerAddress);
    if (erc20Contract.isErr()) {
        return Err(erc20Contract.unwrapErr());
    }

    let erc20Balance = await erc20Contract.unwrap().balanceOf(signerAddress);
    let erc20Allowance = await erc20Contract.unwrap().allowance(signerAddress, crowdtainerAddress)

    console.log(`Fetched data. Balance: ${erc20Balance}; Allowance: ${erc20Allowance}, for ${signerAddress}`);

    return Ok({ erc20ContractAddress: erc20Contract.unwrap().address, erc20Balance: erc20Balance, erc20Allowance: erc20Allowance });
}

export async function fetchUserNonce(provider: ethers.providers.JsonRpcProvider | undefined,
    erc20TokenAddress: string): Promise<Result<BigNumber, string>> {

    if (!provider) {
        return Err('Missing signer.');
    }

    console.log(`erc20TokenAddress: ${erc20TokenAddress}`);
    let signer = getSigner();
    if (signer === undefined) {
        return Err('Signer not available.');
    }
    const signerAddress = await signer.getAddress();
    let erc20nonce: BigNumber;
    let erc20Contract: IERC20Permit;
    try {
        erc20Contract = IERC20Permit__factory.connect(erc20TokenAddress, provider);
        erc20nonce = await erc20Contract.nonces(signerAddress);
    } catch (error) {
        return Err(`${error}`);
    }

    return Ok(erc20nonce);
}

export async function getTokenURI(
    signerOrProvider: ethers.Signer | ethers.providers.Provider | undefined,
    vouchers721Address: string,
    tokenId: number): Promise<Result<string, string>> {
    if (signerOrProvider === undefined) {
        return Err("Signer / Provider not available.");
    }
    try {
        const vouchers721Contract = Vouchers721__factory.connect(vouchers721Address, signerOrProvider);
        let result = await vouchers721Contract.tokenURI(tokenId);
        return Ok(result);
    } catch (error) {
        return Err(`${error}`);
    }
}