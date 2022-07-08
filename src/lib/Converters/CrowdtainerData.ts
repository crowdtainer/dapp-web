import { BigNumber, ethers } from "ethers";
import type {
    CrowdtainerStaticModel,
    CrowdtainerDynamicModel
} from '$lib/Model/CrowdtainerModel';

export enum LoadStatus {
    Loading,
    Loaded,
    FetchFailed
}

export enum ProjectStatusUI {
    Loading,                // Project status still loading.
    Uninitialized,          // Project not yet initialized by service provider.
    OpeningSoon,            // Waiting for funding start time to be reached.
    Funding,                // Within funding period.
    Failed,                 // Failed to raise minimum amount in time.
    SuccessfulyFunded,      // Minimum funding reached in time.
    Delivery,               // Service provider accepted orders and will deliver products.
    ServiceProviderDeclined // Minimum funding amount was reached in time, but the service provided decided to not go foward. Funds are available for withdrawal by participants.
}

export const loadingString = 'Loading...';

export function toState(dynamicData: CrowdtainerDynamicModel | undefined, staticData: CrowdtainerStaticModel | undefined): ProjectStatusUI {
    if (staticData === undefined || dynamicData === undefined) {
        return ProjectStatusUI.Loading;
    }
    if (dynamicData.raised === undefined) {
        return ProjectStatusUI.Loading;
    }
    let nowInMs = (new Date).getTime();
    let startInMs = toDate(staticData.startDate).getTime();
    let endInMs = toDate(staticData.endDate).getTime();
    let raised = Number(ethers.utils.formatUnits(dynamicData.raised, staticData.tokenDecimals));
    let minimumGoal = Number(ethers.utils.formatUnits(staticData.minimumGoal, staticData.tokenDecimals));
    switch (dynamicData.status) {
        case 0:
            return ProjectStatusUI.Uninitialized;
        case 1: // Funding
            {
                if (nowInMs < startInMs) {
                    return ProjectStatusUI.OpeningSoon; //'Opening soon.. 👀'
                }
                // Given the raised value and current time, we can derive the contract's next state
                if (nowInMs > endInMs && raised < minimumGoal) {
                    return ProjectStatusUI.Failed; //'Failed';
                }
                if (nowInMs > endInMs && raised > minimumGoal) {
                    return ProjectStatusUI.SuccessfulyFunded // 'Successful 🎉';
                }
                return ProjectStatusUI.Funding;
            }
        case 2: // Delivery triggered by service provider
            return ProjectStatusUI.Delivery;
        case 3: // Failed
            {
                if(raised > minimumGoal) {
                    return ProjectStatusUI.ServiceProviderDeclined;
                }
                return ProjectStatusUI.Failed;
            }
        default:
            throw ('Error: Unknown crowdtainer state.');
    }
}

export function toStateString(dynamicData: CrowdtainerDynamicModel, staticData: CrowdtainerStaticModel): string {
    if (dynamicData.status === undefined || dynamicData.raised === undefined || staticData.minimumGoal === undefined) {
        return 'Loading..';
    }
    switch (toState(dynamicData, staticData)) {
        case ProjectStatusUI.Uninitialized: {
            return 'Uninitialized';
        }
        case ProjectStatusUI.OpeningSoon: {
            return 'Opening soon.. 👀';
        }
        case ProjectStatusUI.Funding: {
            return 'Funding';
        }
        case ProjectStatusUI.Failed: {
            return 'Failed 🙈';
        }
        case ProjectStatusUI.SuccessfulyFunded: {
            return 'Successful 🎉';
        }
        case ProjectStatusUI.Delivery: {
            return 'Delivery 📦';
        }
        case ProjectStatusUI.ServiceProviderDeclined: {
            return 'Declined by service provider';
        }
        case ProjectStatusUI.Loading: {
            return loadingString;
        }
    }
}

export function prettifyAddress(address: string | undefined): string {
    if (address === undefined) {
        return loadingString;
    }
    // TODO: Do reverse ENS lookup and replace with ENS domain.
    return address;
}

export function toDate(epoch: BigNumber | undefined): Date {
    if (epoch === undefined) {
        throw Error("Invalid date input");
    }
    return new Date(BigNumber.from(epoch).toNumber() * 1000);
}

export function toFormattedDate(epoch: BigNumber | undefined): string {
    if (epoch === undefined) {
        return loadingString;
    }
    let date = new Date(BigNumber.from(epoch).toNumber() * 1000);
    return date.toLocaleString("en-GB", { dateStyle: 'short', timeStyle: 'short' });
}

export function toHuman(value: BigNumber | undefined, decimals: number | undefined): number {
    if (value === undefined || decimals === undefined) {
        return 0;
    }
    return Number(ethers.utils.formatUnits(value, decimals));
}

export function toHumanPrices(value: BigNumber[] | undefined, decimals: number | undefined): number[] {
    let prices: number[];
    if (value === undefined || decimals === undefined) {
        prices = new Array(value?.length);
        prices.fill(0);
        return prices;
    }
    prices = new Array();
    value.forEach(element => {
        let priceValue = Number(ethers.utils.formatUnits(element, decimals));
        prices.push(priceValue);
    });
    return prices;
}

export function tokenSymbolPretty(name: string | undefined): string {
    if (name) {
        return name;
    } else {
        return '-';
    }
}

export function prettyDescription(descriptions: string[] | undefined): string[] {
    if (descriptions == undefined) {
        let emptyDescriptions: string[] = [];
        emptyDescriptions.fill('');
        return emptyDescriptions;
    }
    return descriptions;
}

export function calculatePercentageRaised(raised: string, minimum: string): string {
    let raisedNumber = Number(raised);
    if (Number.isNaN(raisedNumber) || Number.isNaN(Number(minimum))) {
        return '';
    }
    return `${(raisedNumber * 100 / Number(minimum))}`;
}

export function calculatePercentageWidth(raised: number): number {
    if (raised > 100) {
        return 100;
    } else {
        return raised;
    }
}

export type UIFields = {
    serviceProviderAddress: string;
    startDateString: string;
    endDateString: string;
    startDate: Date;
    endDate: Date;
    minimum: string;
    maximum: string;
    tokenSymbol: string;
    tokenDecimals: number;
    prices: number[];
    descriptions: string[];
};

export function prepareForUI(data: CrowdtainerStaticModel): UIFields {
    return {
        serviceProviderAddress: prettifyAddress(data.serviceProvider),
        startDateString: toFormattedDate(data.startDate),
        endDateString: toFormattedDate(data.endDate),
        startDate: toDate(data.startDate),
        endDate: toDate(data.endDate),
        minimum: toHuman(data.minimumGoal, data.tokenDecimals).toString(),
        maximum: toHuman(data.maximumGoal, data.tokenDecimals).toString(),
        tokenSymbol: tokenSymbolPretty(data.tokenSymbol),
        tokenDecimals: data.tokenDecimals ? data.tokenDecimals : 0, // TODO
        prices: toHumanPrices(data.prices, data.tokenDecimals),
        descriptions: prettyDescription(data.productDescription)
    };
}