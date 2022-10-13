import type { BigNumber } from "ethers";
import type { IERC20 } from "src/routes/typechain/IERC20";

export type UserStoreModel = {
	erc20Contract: IERC20 | undefined;
	erc20Balance: BigNumber | undefined;
	erc20Allowance: BigNumber | undefined;
}