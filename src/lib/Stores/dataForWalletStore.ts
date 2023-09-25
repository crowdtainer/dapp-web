import { walletFundsInCrowdtainer } from '$lib/ethersCalls/rpcRequests';
import { getSigner } from '$lib/Utils/wallet';

import { createWalletCrowdtainerData } from '$lib/Model/WalletCrowdtainerModel.js';
import { readable } from 'svelte/store';

let _campaignContractAddress: string | undefined;
let _accountAddress: string;

export const initializeDataForWallet = (campaignContractAddress: string | undefined, accountAddress: string) => {
    _campaignContractAddress = campaignContractAddress;
    _accountAddress = accountAddress;
}

export const walletInCrowdtainer = readable(createWalletCrowdtainerData(), function start(set) {
	const interval = setInterval(async () => {

        if (_campaignContractAddress === undefined || _accountAddress === undefined) {
            console.log(`Missing campaign | wallet address.`);
            return;
        }

        let funds = await walletFundsInCrowdtainer(
            getSigner(),
            _campaignContractAddress,
            _accountAddress
        );
        if (funds.isErr()) {
            console.log(`${funds.unwrapErr()}`);
            return;
        }

        let userWalletInCrowdtainer = funds.unwrap();

		set(userWalletInCrowdtainer);
	}, 5000);

	return function stop() {
        console.log(`walletFundsInCrowdtainer loop terminated.`);
		clearInterval(interval);
	};
});