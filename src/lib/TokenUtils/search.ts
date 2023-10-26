import { getSigner, walletState } from "$lib/Utils/wallet.js";
import { OrderStatus, getOrderDetailsAPI } from "$lib/api.js";

import { projects } from '../../routes/Data/projects.json';

export async function loadOrderDetails(chainId: number, vouchers721Address: string, tokenId: number[] | undefined): Promise<OrderStatus | undefined> {
    if (tokenId === undefined) {
        console.log(`tokenIdAssociations === undefined`);
        return;
    }

    if (tokenId.length === 0) {
        console.log(`No tokenIDs detected for connected wallet.`);
        return;
    } else if (tokenId.length > 1) {
        console.log(`Multiple tokens detected.`);
        return;
    }

    let result = await getOrderDetailsAPI(
        chainId,
        vouchers721Address,
        tokenId[0]
    );

    if (result.isErr()) {
        console.log(`Error: getOrderDetailsAPI: ${result.unwrapErr()}`);
        return;
    }
    return result.unwrap();
}

export function projectFromCrowdtainerId(id: number) {
    let filtered = projects.filter((element) => {
        return element.crowdtainerId === id;
    });
    return filtered[0];
}
