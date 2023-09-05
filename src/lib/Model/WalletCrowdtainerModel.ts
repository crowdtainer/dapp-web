import { BigNumber, type Wallet } from "ethers";

export type WalletCrowdtainerModel = {
	fundsInCrowdtainer: BigNumber;
	accumulatedRewards: BigNumber;
}

export function createWalletCrowdtainerData(): WalletCrowdtainerModel {
	return {
		fundsInCrowdtainer: BigNumber.from(0),
		accumulatedRewards: BigNumber.from(0)
	}
}