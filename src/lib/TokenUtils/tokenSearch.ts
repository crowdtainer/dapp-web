import { getSigner } from "$lib/Utils/wallet.js";
import { getOrderDetailsAPI } from "$lib/api.js";
import { findTokenIdsForWallet, type TokenIDAssociations } from "$lib/ethersCalls/rpcRequests.js";

export async function loadOrderDetails(vouchers721Address: string, tokenId: number[] | undefined): Promise<OrderStatus | undefined> {
    if (tokenId === undefined) {
        console.log(`tokenIdAssociations === undefined`);
        return;
    }

    if (tokenId.length === 0) {
        console.log(`No tokenIDs detected.`);
        return;
    } else if (tokenId.length > 1) {
        console.log(`Multiple tokens detected.`);
        return;
    }

    let signer = getSigner();
    if (!signer) {
        console.log('Error: Unable to load order details, missing signer.');
        return;
    }

    let result = await getOrderDetailsAPI(
        await signer.getChainId(),
        vouchers721Address,
        tokenId[0]
    );

    if (result.isErr()) {
        console.log(`Error: getOrderDetailsAPI: ${result.unwrapErr()}`);
        return;
    }
    return result.unwrap();
}

export async function loadTokenIdsForWallet(vouchers721Address: string): Promise<TokenIDAssociations | undefined> {
    let searchResult = await findTokenIdsForWallet(getSigner(), vouchers721Address);
    if (searchResult.isErr()) {
        console.log(`Err: loadTokenIdsForWallet: ${searchResult.unwrapErr()}`);
        return;
    }
    return searchResult.unwrap();
}
