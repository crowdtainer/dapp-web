import type { BigNumber } from "ethers";

export type UserStoreModel = {
	erc20Balance: BigNumber | undefined;
	erc20Allowance: BigNumber | undefined;
}