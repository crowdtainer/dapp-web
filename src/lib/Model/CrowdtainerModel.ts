import type { BigNumber } from "ethers";

export type Error = { error: string };

export type CrowdtainerDynamicModel = {
	status: number | undefined;
	raised: BigNumber | undefined;
}

export type CrowdtainerStaticModel = {
	serviceProvider: string | undefined;
	startDate: BigNumber | undefined;
	endDate: BigNumber | undefined;
	minimumGoal: BigNumber | undefined;
	maximumGoal: BigNumber | undefined;
	productDescription: string[] | undefined;
	prices: BigNumber[] | undefined;
	token: string | undefined;
	tokenDecimals: number | undefined;
	tokenSymbol: string | undefined;
}