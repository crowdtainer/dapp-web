import { getTokenURI } from "$lib/ethersCalls/rpcRequests";
import type { BrowserProvider, Signer } from "ethers";

export interface Description {
    description: string;
    amount: string;
    pricePerUnit: string;
}

export interface TokenURIObject {
    crowdtainerId: string;
    voucherId: string;
    currentOwner: string;
    erc20Symbol: string;
    erc20Decimals: string;
    description: Description[];
    TotalCost: string;
    image: string;
}

export async function loadTokenURIRepresentation(
    signer: BrowserProvider,
    vouchers721Address: string,
    tokenId: number
): Promise<TokenURIObject | undefined> {
    let result = await getTokenURI(signer, vouchers721Address, tokenId);
    if (result.isErr()) {
        console.log(`${result.unwrapErr()}`);
        return undefined;
    }
    let payload = result.unwrap();

    if (!payload.startsWith('data:application/json;base64,')) {
        console.log('Unrecognized data');
        return undefined;
    }
    let [, imageDataInBase64] = payload.split(',');
    const imageDataJSON: TokenURIObject = JSON.parse(atob(imageDataInBase64));

    return imageDataJSON;
}