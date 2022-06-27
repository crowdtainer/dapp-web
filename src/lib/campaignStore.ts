import { readable, type Readable } from 'svelte/store';

import type { CrowdtainerDynamicModel } from '$lib/Model/CrowdtainerModel';

import { fetchDynamicData, type Error } from '$lib/api';

const fetchInterval : number = ( import.meta.env.DEV ? 2000 : 18000);

export let campaignStores: Map<number, Readable<CrowdtainerDynamicModel>> = new Map;

let defaultData: CrowdtainerDynamicModel = {
	status: undefined,
	raised: undefined,
}

export const initializeStore = (campaignId: number): Readable<CrowdtainerDynamicModel> | undefined => {

	if (campaignStores.has(campaignId)) {
		return campaignStores.get(campaignId);
	}

	const timerBasedStore = readable(defaultData, function start(set) {
		const interval = setInterval(async () => {

			let response = await fetchDynamicData(campaignId);

			if (response.isOk()) {
				set(response.unwrap());
				console.log('Updated campaign data.');
			} else {
				let error: Error = response.unwrapErr();
				console.log(`${error.code} Error: ${error.message}`);
			}
		}, fetchInterval);

		return function stop() {
			clearInterval(interval);
		};
	});

	campaignStores.set(campaignId, timerBasedStore);
	console.log(`Initialized campaign: ${campaignId}`);
	return timerBasedStore;
}