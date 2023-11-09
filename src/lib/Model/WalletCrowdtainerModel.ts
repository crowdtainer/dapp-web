import { BigNumber } from "ethers";

export type WalletCrowdtainerModel = {
	lastLoadedEpochTimeInMs: number | undefined; //last loaded data time, or undefined if never read.
	fundsInCrowdtainer: BigNumber;
	accumulatedRewards: BigNumber;
}

export function createWalletCrowdtainerData(): WalletCrowdtainerModel {
	return {
		lastLoadedEpochTimeInMs: undefined,
		fundsInCrowdtainer: BigNumber.from(0),
		accumulatedRewards: BigNumber.from(0)
	}
}