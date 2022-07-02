import { BigNumber, ethers } from "ethers";

const loadingString = 'Loading...';
export function stateToString(state: number | undefined): string {
    if (state === undefined) {
        return 'Loading..';
    }
    switch (state) {
        case 0:
            return 'Uninitialized';
        case 1:
            return 'Funding'; // TODO: Handle initialized + opening time not reached yet.
        case 2:
            return 'Delivery';
        case 3:
            return 'Failed';
        default:
            throw ('Error: Unknown state.');
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
    if(epoch === undefined) {
        throw Error("Invalid date input");
    }
    return new Date(BigNumber.from(epoch).toNumber()*1000);
}

export function toFormattedDate(epoch: BigNumber | undefined): string {
    if(epoch === undefined) {
        return loadingString;
    }
    let date = new Date(BigNumber.from(epoch).toNumber()*1000);
    return date.toLocaleString("en-GB", {dateStyle: 'short', timeStyle: 'short'});
}

export function toHuman(value: BigNumber | undefined, decimals: number | undefined): string {
    if (value === undefined || decimals === undefined)  {
        return loadingString;
    }
    return ethers.utils.formatUnits(value, decimals);
}

export function toHumanPrices(value: BigNumber[] | undefined, decimals: number | undefined): number[] {
    let prices: number[];
    if (value === undefined || decimals === undefined)  {
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