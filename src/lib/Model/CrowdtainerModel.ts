export type Error = { error: string };

export type CrowdtainerDynamicModel = {
	status: number | undefined;
	raised: bigint | undefined;
	fundsInContract: bigint | undefined;
}

export type CrowdtainerStaticModel = {
	chainId: number;
	contractAddress: string;
	serviceProvider: string;
	startDate: bigint;
	endDate: bigint;
	minimumGoal: bigint;
	maximumGoal: bigint;
	productDescription: string[];
	prices: bigint[];
	tokenAddress: string;
	tokenDecimals: number;
	tokenSymbol: string;
	tokenName: string;
	tokenVersion: string;
	signer: string;
	referralRate: bigint;
}

export interface SplitSelection { 
	categoryDelimiter: string;
	categoryDescriptors: string[];
}