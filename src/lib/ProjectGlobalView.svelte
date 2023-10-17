<script lang="ts">
	import { onMount } from 'svelte';
	import { derived, type Readable } from 'svelte/store';

	import {
		initializeCampaignDynamicStores,
		campaignDynamicStores
	} from '$lib/Stores/campaignStore';
	import { joinSelection } from '$lib/Stores/userStore';

	import ProjectRaisedAmount from './ProjectRaisedAmount.svelte';

	import { campaignStaticStores } from './Stores/campaignStaticDataStore.js';

	import type { CrowdtainerDynamicModel } from '$lib/Model/CrowdtainerModel';
	import {
		toState,
		LoadStatus,
		toStateString,
		loadingString,
		toHuman
	} from '$lib/Converters/CrowdtainerData';

	import { connected, accountAddress } from '$lib/Utils/wallet';

	import { initializeDataForWallet } from './Stores/dataForWalletStore.js';
	import { showToast } from './Toast/ToastStore.js';
	import ProjectDetails from './ProjectDetails.svelte';
	import MoneyInContract from './MoneyInContract.svelte';
	import TimeLeft from './TimeLeft.svelte';

	export let vouchers721Address: string;
	export let crowdtainerId: number;
	export let projectId: number;
	export let staticDataLoadStatus: LoadStatus = LoadStatus.Loading;

	export const campaignStaticData = derived(campaignStaticStores, ($campaignStaticStores) => {
		return $campaignStaticStores.staticData[projectId];
	});
	export const campaignStaticUI = derived(campaignStaticStores, ($campaignStaticStores) => {
		return $campaignStaticStores.UIData[projectId];
	});

	let campaignDynamicData: Readable<CrowdtainerDynamicModel> | undefined;

	let fundsInContract: number | undefined;
	let raisedAmount: number | undefined;

	initializeDataForWallet($campaignStaticData.contractAddress, $accountAddress);

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
		loadData();
	});

	function setRaisedAmount() {
		if (staticDataLoadStatus !== LoadStatus.FetchFailed) {
			let decimals = campaignStaticUI ? $campaignStaticUI.tokenDecimals : undefined;
			fundsInContract = toHuman($campaignDynamicData?.fundsInContract, decimals);
			raisedAmount = toHuman($campaignDynamicData?.raised, decimals);
		}
	}

	$: stateString =
		staticDataLoadStatus !== LoadStatus.FetchFailed &&
		$campaignDynamicData !== undefined &&
		campaignStaticData !== undefined
			? toStateString($campaignDynamicData, $campaignStaticData)
			: loadingString;

	// dynamic
	$: state = toState($campaignDynamicData, $campaignStaticData);

	$: $campaignDynamicData, setRaisedAmount();
	$: loadingAnimation = staticDataLoadStatus === LoadStatus.Loading;

	// Immediatelly update UI elements related to connected wallet on wallet or connection change
	$: $connected,
		$accountAddress,
		initializeDataForWallet($campaignStaticData.contractAddress, $accountAddress);
</script>

<!-- dark:backdrop-brightness-[0.8] -->
<div class:animate-pulse={loadingAnimation} class="py-0 rounded-md w-full lg:w-auto">
	<ProjectRaisedAmount {crowdtainerId} {projectId} {staticDataLoadStatus} />

	<!-- Main Status -->
	<div class="flex flex-wrap justify-between gap-6">
		<div>
			<p class="projectStatus">{stateString}</p>
			<p class="projectDataSubtitle">Status</p>
		</div>

		<MoneyInContract {fundsInContract} {raisedAmount} campaignStaticUI={$campaignStaticUI} {state} />

		<div class="min-w-max">
			{#if campaignStaticUI}
				<p class="projectStatus">
					<TimeLeft endTime={$campaignStaticUI.endDate} />
				</p>
				<p class="projectDataSubtitle">to go</p>
			{:else}
				<p class="projectData">
					{loadingString}
				</p>
				<p class="projectDataSubtitle">-</p>
			{/if}
		</div>
	</div>

	<!-- Dates -->
	<div class="flex py-4 justify-between gap-12">
		<div class="">
			<p class="projectData">
				{campaignStaticUI ? $campaignStaticUI.startDateString : loadingString}
			</p>
			<p class="projectDataSubtitle">Start</p>
		</div>
		<div class="">
			<p class="projectData">
				{campaignStaticUI ? $campaignStaticUI.endDateString : loadingString}
			</p>
			<p class="projectDataSubtitle">End</p>
		</div>
	</div>

	<!-- Smart contract details -->
	<div class="dark:text-gray-200">
		{#if campaignStaticData && campaignStaticUI}
			<ProjectDetails
				{vouchers721Address}
				{crowdtainerId}
				campaignStaticData={$campaignStaticData}
				campaignStaticUI={$campaignStaticUI}
			/>
		{/if}
	</div>
</div>
