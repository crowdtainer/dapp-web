import type { BigNumber } from "ethers";

export type UserStoreModel = {
	erc20ContractAddress: string;
	erc20Balance: BigNumber | undefined;
	erc20Allowance: BigNumber | undefined;
}