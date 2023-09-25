<script lang="ts">
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import type { Readable } from 'svelte/store';

	import {
		initializeCampaignDynamicStores,
		campaignDynamicStores
	} from '$lib/Stores/campaignStore';
	import { joinSelection } from '$lib/Stores/userStore';

	import { campaignStaticStores } from './Stores/campaignStaticDataStore.js';

	import type {
		CrowdtainerDynamicModel,
		CrowdtainerStaticModel
	} from '$lib/Model/CrowdtainerModel';
	import {
		toHuman,
		calculatePercentageRaised,
		calculatePercentageWidth,
		type UIFields,
		LoadStatus
	} from '$lib/Converters/CrowdtainerData';

	import { connected, accountAddress } from '$lib/Utils/wallet';

	import { initializeDataForWallet } from './Stores/dataForWalletStore.js';
	import { showToast } from './Toast/ToastStore.js';

	export let crowdtainerId: number;
	export let projectId: number;
	export let staticDataLoadStatus: LoadStatus = LoadStatus.Loading;

	let campaignStaticUI: UIFields | undefined;
	let campaignStaticData: CrowdtainerStaticModel | undefined;

	let campaignDynamicData: Readable<CrowdtainerDynamicModel> | undefined;

	let raisedAmount: number | undefined;
	let tweeningDuration = 650;
	let tweenedPercentageWidth = tweened(0, { duration: tweeningDuration, easing: cubicOut });
	let tweenedPercentageRaised = tweened(0, { duration: tweeningDuration, easing: cubicOut });

	initializeDataForWallet(campaignStaticData?.contractAddress, $accountAddress);

	function loadData() {
		$joinSelection = $joinSelection;
		// Dynamic data
		if (campaignDynamicData == undefined) {
			campaignDynamicData = initializeCampaignDynamicStores(crowdtainerId);
		} else {
			campaignDynamicData = campaignDynamicStores.get(crowdtainerId);
		}
		if (campaignStaticUI === undefined) {
			return;
		}
	}

	onMount(async () => {
		let fetchError = await campaignStaticStores.fetchData([projectId]);
		if (fetchError) {
			showToast(`Error fetching data: ${fetchError.details}`);
			return;
		}
		campaignStaticData = $campaignStaticStores.staticData[projectId];
		campaignStaticUI = $campaignStaticStores.UIData[projectId];

		loadData();
	});

	function setRaisedAmount() {
		if (staticDataLoadStatus !== LoadStatus.FetchFailed) {
			let decimals = campaignStaticUI ? campaignStaticUI.tokenDecimals : undefined;
			raisedAmount = toHuman($campaignDynamicData?.raised, decimals);
		}
	}

	function setPercentages() {
		if (staticDataLoadStatus !== LoadStatus.FetchFailed && raisedAmount !== undefined) {
			let percentage = campaignStaticUI
				? Number(calculatePercentageRaised(raisedAmount.toString(), campaignStaticUI.minimum))
				: undefined;

			if (percentage) {
				tweenedPercentageRaised.set(percentage);
				tweenedPercentageWidth.set(calculatePercentageWidth(percentage));
			} else {
				tweenedPercentageRaised.set(0);
				tweenedPercentageWidth.set(0);
			}
		} else {
			tweenedPercentageRaised.set(0);
			tweenedPercentageWidth.set(0);
		}
	}

	$: $campaignDynamicData, setRaisedAmount(), setPercentages();

	// Immediatelly update UI elements related to connected wallet on wallet or connection change
	$: $connected,
		$accountAddress,
		initializeDataForWallet(campaignStaticData?.contractAddress, $accountAddress);

	$: campaignStaticUI, console.log(`campaignStaticUI: ${campaignStaticUI}`);
</script>

<!-- <div class="my-6 bg-gray-300 rounded-md w-full">
	<div
		class="progress progress-primary bg-sky-700 text-sm font-small text-white text-center p-1 leading-normal rounded-md"
		style="width: {$tweenedPercentageWidth}%"
	>
		{$tweenedPercentageRaised.toFixed(0)}%
	</div>
</div> -->
<div class="my-6">
	<progress class="h-2 progress-primary w-full" value={$tweenedPercentageWidth} max="100" />
</div>
