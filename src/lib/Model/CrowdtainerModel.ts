import type { BigNumber } from "ethers";

export type Error = { error: string };

export type CrowdtainerDynamicModel = {
	status: number | undefined;
	raised: BigNumber | undefined;
	fundsInContract: BigNumber | undefined;
}

export type CrowdtainerStaticModel = {
	chainId: number;
	contractAddress: string;
	serviceProvider: string;
	startDate: BigNumber;
	endDate: BigNumber;
	minimumGoal: BigNumber;
	maximumGoal: BigNumber;
	productDescription: string[];
	prices: BigNumber[];
	tokenAddress: string;
	tokenDecimals: number;
	tokenSymbol: string;
	tokenName: string;
	tokenVersion: string;
	signer: string;
	referralRate: BigNumber;
}

export interface SplitSelection { 
	categoryDelimiter: string;
	categoryDescriptors: string[];
}