import { Vouchers721__factory } from '../../routes/typechain/factories/Vouchers721__factory';
import { Crowdtainer__factory } from '../../routes/typechain/factories/Crowdtainer.sol/Crowdtainer__factory';
import { IERC721Enumerable__factory } from '../../routes/typechain/factories/IERC721Enumerable__factory';
import { BigNumber, ethers } from 'ethers';
import { IERC20__factory } from '../../routes/typechain/factories/IERC20__factory';

export async function joinProject(provider: ethers.Signer | undefined,
    vouchers721Address: string,
    crowdtainerAddress: string,
    quantities: number[]): Promise<boolean> {

    if (!provider) {
        return false;
    }

    const vouchers721Contract = Vouchers721__factory.connect(vouchers721Address, provider);
    const crowdtainerContract = Crowdtainer__factory.connect(crowdtainerAddress, provider);

    console.log(`Provider is: ${await provider}`);
    console.log(`Vouchers721 address is: ${vouchers721Address}`);
    console.log(`Crowdtainer address is: ${crowdtainerAddress}`);

    let arrayOfBigNumbers: [BigNumber, BigNumber, BigNumber, BigNumber] = [
        BigNumber.from(quantities[0]),
        BigNumber.from(quantities[1]),
        BigNumber.from(quantities[2]),
        BigNumber.from(quantities[3])
    ];

    try {
        // TODO: Continue here; Check permit value, request permit if needed, call join()
        const erc20Address = await crowdtainerContract.token();
        const erc20Contract = IERC20__factory.connect(erc20Address, provider);

        const signerAddress = await provider.getAddress();
        
        let totalCost = 0;
        for (let index = 0; index < 4; index++) {
            totalCost += (await crowdtainerContract.unitPricePerType(index)).toNumber() * arrayOfBigNumbers[index].toNumber();
        }
        
        let balance = (await erc20Contract.balanceOf(signerAddress)).toNumber();
        console.log(`Current wallet balance: ${balance}`);
        
        if (balance < totalCost) {
            console.log(`Not enough funds. Required: ${totalCost}, available: ${balance}`);
            return false;
        }

        let currentAllowance = (await erc20Contract.allowance(signerAddress, crowdtainerAddress)).toNumber();
        console.log(`permit Value: ${currentAllowance}`);

        if (currentAllowance < totalCost) {
            console.log(`Not enough spend allowance. Required: ${totalCost}, current: ${currentAllowance}.`);
            console.log("Requesting permit..");
            // await erc20Contract.approve(crowdtainerAddress, totalCost);
        }
        await erc20Contract.approve(crowdtainerAddress, totalCost * 10^3);

        currentAllowance = (await erc20Contract.allowance(signerAddress, crowdtainerAddress)).toNumber();

        if (currentAllowance < totalCost) {
            console.log("Unable to request permit.");
            return false;
        }

        const result = await vouchers721Contract['join(address,uint256[4])'](crowdtainerAddress, arrayOfBigNumbers, { gasLimit: 9999999999 });
        console.log(`Result: ${result}`);

        // const abi = ["function join(address _crowdtainer, uint256[4] _quantities) external returns (uint256)"];
        // const contract = new ethers.Contract(vouchers721Address, abi, provider);
        // contract.join(crowdtainerAddress,
        //         arrayOfBigNumbers, {gasLimit: 9999999999});
        // false,
        // '0x0000000000000000000000000000000000000000');

        return true;

    } catch (error) {
        console.log(`Error :( ${error}`)
        return false;
    }
}
