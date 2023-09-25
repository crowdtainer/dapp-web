import { readable, writable, type Readable, type Writable, derived } from 'svelte/store';

import type { CrowdtainerDynamicModel, CrowdtainerStaticModel } from '$lib/Model/CrowdtainerModel';
import { fetchDynamicData, type Error } from '$lib/api';

const fetchInterval: number = (import.meta.env.DEV ? 10000 : 18000);

export let campaignDynamicStores = new Map<number, Readable<CrowdtainerDynamicModel>>;

export const joinSelection = writable(new Map<number, number[]>());

let defaultData: CrowdtainerDynamicModel = {
	status: undefined,
	raised: undefined,
	fundsInContract: undefined
}

export const initializeCampaignDynamicStores = (campaignId: number): Readable<CrowdtainerDynamicModel> | undefined => {

	if (campaignDynamicStores.has(campaignId)) {
		return campaignDynamicStores.get(campaignId);
	}

	const timerBasedStore = readable(defaultData, function start(set) {

		const fetchDataFunction = async () => {
			let response = await fetchDynamicData(campaignId);
			if (response.isOk()) {
				set(response.unwrap());
			} else {
				let error: Error = response.unwrapErr();
				console.log(`${error.code} Error: ${error.message}`);
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
			campaignDynamicStores.delete(campaignId);
		};
	});

	campaignDynamicStores.set(campaignId, timerBasedStore);
	return timerBasedStore;
}