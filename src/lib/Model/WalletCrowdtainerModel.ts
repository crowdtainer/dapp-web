export type WalletCrowdtainerModel = {
	fundsInCrowdtainer: bigint;
	accumulatedRewards: bigint;
}

export function createWalletCrowdtainerData(): WalletCrowdtainerModel {
	return {
		fundsInCrowdtainer: 0n,
		accumulatedRewards: 0n
	}
}