import { readable, type Readable } from 'svelte/store';

import type { CrowdtainerDynamicModel } from '$lib/Model/CrowdtainerModel';
import { fetchDynamicData, type Error } from '$lib/api';

const fetchInterval : number = ( import.meta.env.DEV ? 10000 : 18000);

export let campaignStores = new Map<number, Readable<CrowdtainerDynamicModel>>;

let defaultData: CrowdtainerDynamicModel = {
	status: undefined,
	raised: undefined,
}

export const initializeStore = (campaignId: number): Readable<CrowdtainerDynamicModel> | undefined => {

	if (campaignStores.has(campaignId)) {
		return campaignStores.get(campaignId);
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
		};
	});

	campaignStores.set(campaignId, timerBasedStore);
	return timerBasedStore;
}