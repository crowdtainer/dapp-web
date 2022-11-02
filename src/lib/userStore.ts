import { writable } from 'svelte/store';
import { readable, type Readable } from 'svelte/store';

import { type Result, Ok, Err } from "@sniptt/monads";

import { getERC20Contract, joinProject } from '$lib/ethersCalls/rpcRequests';
import type { UserStoreModel } from '$lib/Model/UserStoreModel';
import { getSigner } from '$lib/wallet';
import { ethers } from 'ethers';

// CrowdtainerId -> array of number of selected products
export const joinSelection = writable(new Map<number, number[]>());

// Data with user balances and allowance per project
export let userStores = new Map<number, Readable<UserStoreModel>>;

const fetchInterval: number = 6000;

let defaultData: UserStoreModel = {
    erc20Contract: undefined,
    erc20Balance: undefined,
    erc20Allowance: undefined
}

async function fetchUserData(campaignId: number, crowdtainerAddress: string): Promise<Result<UserStoreModel, string>> {
    let signer = getSigner();
    if (!signer) {
        return Err('Missing signer.');
    }

    const signerAddress = await signer.getAddress();

    let erc20Contract = await getERC20Contract(signer, crowdtainerAddress);
    if (erc20Contract.isErr()) {
        return Err(erc20Contract.unwrapErr());
    }

    let erc20Balance = await erc20Contract.unwrap().balanceOf(signerAddress);
    let erc20Allowance = await erc20Contract.unwrap().allowance(signerAddress, crowdtainerAddress)

    console.log(`Fetched data. Balance: ${erc20Balance}; Allowance: ${erc20Allowance}, for ${signerAddress}`);

    return Ok({ erc20Contract: erc20Contract.unwrap(), erc20Balance: erc20Balance, erc20Allowance: erc20Allowance });
}

export const initializeStore = (campaignId: number, crowdtainerAddress: string): Readable<UserStoreModel> | undefined => {
    if (userStores.has(campaignId)) {
        return userStores.get(campaignId);
    }

    const timerBasedStore = readable(defaultData, function start(set) {

        const fetchDataFunction = async () => {
            let response = await fetchUserData(campaignId, crowdtainerAddress);
            if (response.isOk()) {
                set(response.unwrap());
            } else {
                console.log(`${response.unwrapErr()}`);
            }
        };

        // Once on initialization.
        fetchDataFunction();

        // Once every fetchInterval to get updates over time.
        // TODO: Pause / restart when tab/window is out/in focus.
        const interval = setInterval(async () => {
            fetchDataFunction();
        }, fetchInterval);

        return function stop() {
            clearInterval(interval);
        };
    });

    userStores.set(campaignId, timerBasedStore);
    return timerBasedStore;
}