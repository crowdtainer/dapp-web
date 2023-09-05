import type { BigNumber } from "ethers";

export type Error = { error: string };

export type CrowdtainerDynamicModel = {
	status: number | undefined;
	raised: BigNumber | undefined;
	fundsInContract: BigNumber | undefined;
}

export type CrowdtainerStaticModel = {
	contractAddress: string;
	serviceProvider: string;
	startDate: BigNumber;
	endDate: BigNumber;
	minimumGoal: BigNumber;
	maximumGoal: BigNumber;
	productDescription: string[];
	prices: BigNumber[];
	token: string;
	tokenDecimals: number;
	tokenSymbol: string;
	signer: string;
	referralRate: BigNumber;
}