import { Vouchers721__factory } from '../../routes/typechain/factories/Vouchers721__factory';
import { Crowdtainer__factory } from '../../routes/typechain/factories/Crowdtainer.sol/Crowdtainer__factory';
// import { IERC721Enumerable__factory } from '../../routes/typechain/factories/IERC721Enumerable__factory';
import { BigNumber, ethers } from 'ethers';
import { IERC20__factory } from '../../routes/typechain/factories/IERC20__factory';

import { type Result, Ok, Err } from "@sniptt/monads";
import type { IERC20 } from 'src/routes/typechain/IERC20';

// TODO: Continue here;
// - Split this function into smaller parts;
// - Adapt frontend to react to smart contract state updates:
//      - ERC20 Approval status.
//      - Join button enabled when approval is granted.
//      - Frontend should hide "add to pre-order button" if user already joined.
//      - Frontend should show button to direct user to wallet tab when already joined.

// function totalCost(crowdtainerContract: Crowdtainer, quantities: number[]): BigNumber {
//     let totalCost = BigNumber.from(0);
//     for (let index = 0; index < 4; index++) {
//         totalCost = totalCost.add((await crowdtainerContract.unitPricePerType(index)).mul(arrayOfBigNumbers[index]));
//     }
// }

export async function getERC20Contract(provider: ethers.Signer | undefined, crowdtainerAddress: string): Promise<Result<IERC20, string>> {

    if (!provider) {
        return Err("Provider not available.");
    }

    const crowdtainerContract = Crowdtainer__factory.connect(crowdtainerAddress, provider);
    console.log(`Crowdtainer address is: ${crowdtainerAddress}`);

    const erc20Address = await crowdtainerContract.token();
    const erc20Contract = IERC20__factory.connect(erc20Address, provider);

    return Ok(erc20Contract);
}

export type NotEnoughFundsError = { current: BigNumber, required: BigNumber };

export async function hasEnoughFunds(erc20Contract: IERC20, signerAddress: string, totalCost: BigNumber): Promise<Result<BigNumber, NotEnoughFundsError>> {
    let balance = (await erc20Contract.balanceOf(signerAddress));
    console.log(`Current wallet balance: ${balance}`);

    if (balance.lt(totalCost)) {
        // return Err(`Not enough funds. Required: ${totalCost}, available: ${balance}`);
        return Err({current: balance, required: totalCost});
    }
    return Ok(balance);
}

export async function hasEnoughSpendAllowance(erc20Contract: IERC20, signerAddress: string, crowdtainerAddress:string, totalCost: BigNumber): Promise<Result<boolean, string>> {
    let currentAllowance: BigNumber;
    try {
        currentAllowance = await erc20Contract.allowance(signerAddress, crowdtainerAddress);
        console.log(`permit Value: ${currentAllowance}`);
    } catch (error) {
        return Err(`${error}`);
    }

    if (currentAllowance.lt(totalCost)) {
        console.log(`Not enough spend allowance. Required: ${totalCost}, current: ${currentAllowance}.`);
        return Ok(false);
    } else {
        return Ok(true);
    }
}

export async function requestAllowance(signerAddress: string,
    erc20Contract: IERC20,
    crowdtainerAddress: string,
    totalCost: BigNumber): Promise<Result<string, string>> {

    try {
        // let enoughFunds = await hasEnoughFunds(erc20Contract, signerAddress, totalCost);
        // if(enoughFunds.isErr()){
        //     return Err(`${enoughFunds.unwrapErr()}`);
        // }

        // let enoughAllowance = await hasEnoughSpendAllowance(erc20Contract, signerAddress, crowdtainerAddress, totalCost);

        // if (!enoughAllowance.isErr && enoughAllowance.unwrap() === false) {
            // console.log("Requesting permit..");
            let approvalTx = await erc20Contract.approve(crowdtainerAddress, totalCost);
            approvalTx.wait(1);
        // }

        let currentAllowance = await erc20Contract.allowance(signerAddress, crowdtainerAddress);

        if (currentAllowance.lt(totalCost)) {
            return Err("Unable to request needed allowance.");
        }
        return Ok(`Allowance available for ${crowdtainerAddress}.`);

    } catch (error) {
        return Err(`${error}`);
    }
}

export async function joinProject(provider: ethers.Signer | undefined,
    vouchers721Address: string,
    crowdtainerAddress: string,
    quantities: number[]): Promise<Result<string, string>> {

    if (!provider) {
        return Err("Provider not available.");
    }
    console.log(`Vouchers721 address is: ${vouchers721Address}`);
    try {
        const vouchers721Contract = Vouchers721__factory.connect(vouchers721Address, provider);

        let arrayOfBigNumbers: [BigNumber, BigNumber, BigNumber, BigNumber] = [
            BigNumber.from(quantities[0]),
            BigNumber.from(quantities[1]),
            BigNumber.from(quantities[2]),
            BigNumber.from(quantities[3])
        ];

        console.log("calling it..");
        const result = await vouchers721Contract['join(address,uint256[4])'](vouchers721Address, arrayOfBigNumbers);
        result.wait(2);
        console.log(`Confirmations: ${result.confirmations}; hash: ${result.hash}`);

        console.log(`Result: ${result}`);

        return Ok("Success!");

    } catch (error) {
        return Err(`Error :( ${error}`);
    }
}
