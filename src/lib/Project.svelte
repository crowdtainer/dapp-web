<script lang="ts">
	import type { Readable } from 'svelte/store';
	import { onMount } from 'svelte';

	import Join from '$lib/Join.svelte';

	import { fetchStaticData } from '$lib/api';
	import { initializeStore, campaignStores } from '$lib/campaignStore';

	import type {
		CrowdtainerDynamicModel,
		CrowdtainerStaticModel
	} from '$lib/Model/CrowdtainerModel';
	import {
		toHuman,
		toHumanPrices,
		toFormattedDate,
		stateToString,
		prettifyAddress
	} from '$lib/Converters/CrowdtainerData';

	export let crowdtainerId: number;
	export let title: string;
	export let subtitle: string;
	export let description: string;
	export let projectImageURL: string;

	let campaign: Readable<CrowdtainerDynamicModel> | undefined;
	let campaignStatic: UIFields;
	let campaignStaticDataLoaded: boolean;

	onMount(async () => {
		// static data
		let result = await fetchStaticData(crowdtainerId);
		if (result.isOk()) {
			campaignStatic = prepareForUI(result.unwrap());
			campaignStaticDataLoaded = true;
		} else {
			console.log(`Failed to fetch static data..`); // TODO: error handling for static
		}

		// Dynamic data
		if (campaign == undefined) {
			campaign = initializeStore(crowdtainerId);
		} else {
			campaign = campaignStores.get(crowdtainerId);
		}
	});

	function tokenSymbolPretty(name: string | undefined): string {
		if (name) {
			return name;
		} else {
			return '-';
		}
	}

	function prettyDescription(descriptions: string[] | undefined): string[] {
		if (descriptions == undefined) {
			let emptyDescriptions: string[] = [];
			emptyDescriptions.fill('');
			return emptyDescriptions;
		}
		return descriptions;
	}

	// dynamic
	$: stateString = stateToString($campaign?.status);
	$: raised = (campaignStaticDataLoaded) ? toHuman($campaign?.raised, campaignStatic.tokenDecimals) : 'Loading..';

	type UIFields = {
		serviceProviderAddress: string;
		startDate: string;
		endDate: string;
		minimum: string;
		maximum: string;
		tokenSymbol: string;
		tokenDecimals: number;
		prices: number[];
		descriptions: string[];
	};

	function prepareForUI(data: CrowdtainerStaticModel): UIFields {
		return {
			serviceProviderAddress: prettifyAddress(data.serviceProvider),
			startDate: toFormattedDate(data.startDate),
			endDate: toFormattedDate(data.endDate),
			minimum: toHuman(data.minimumGoal, data.tokenDecimals),
			maximum: toHuman(data.maximumGoal, data.tokenDecimals),
			tokenSymbol: tokenSymbolPretty(data.tokenSymbol),
			tokenDecimals: (data.tokenDecimals) ? data.tokenDecimals : 0, // TODO
			prices: toHumanPrices(data.prices, data.tokenDecimals),
			descriptions: prettyDescription(data.productDescription)
		};
	}
</script>

<div class="max-w-10xl mx-auto py-1 sm:px-6 lg:px-8">
	<div class="max-w-lg mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-7xl my-8">
		<div class="md:flex">
			<div class="md:shrink-0">
				<img
					class="h-48 w-full object-cover md:h-full md:w-96 blur-[3px]"
					src={projectImageURL}
					alt="Coffee"
				/>
			</div>
			<div class="p-8">
				<div class="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
					{title}
				</div>
				<a href="#" class="block mt-1 text-lg leading-tight font-medium text-black hover:underline"
					>{subtitle}</a
				>
				<p class="mt-5 text-slate-500">
					{@html description}
				</p>

				<div class="">
					{#if campaignStaticDataLoaded}
						<p class="my-3"><b>Service provider:</b> {campaignStatic.serviceProviderAddress}</p>
						<p class="my-5"><b>Status:</b> {stateString} | <b>Ends in:</b> 42 days</p>
						<p class="my-5"><b>Start:</b> {campaignStatic.startDate} - <b>End: </b>{campaignStatic.endDate}</p>
						<div class="flex flex-wrap ml-0 mr-2">
							<p class="py-1"><b>Raised:</b> {raised} {campaignStatic.tokenSymbol}</p>
							<div class="ml-2 mr-4 bg-gray-200 rounded-full w-80">
								<div
									class="bg-blue-600 text-xs font-medium text-white text-center p-2 leading-normal rounded-l-full"
									style="width: 25%"
								>
									25%
								</div>
							</div>
						</div>
						<div class="flex flex-wrap ml-0 mr-2">
							<p class="my-1">
								<b>Minimum goal:</b>
								{campaignStatic.minimum}
								{campaignStatic.tokenSymbol}
							</p>
							<p class="my-1">
								<b>Maximum goal:</b>
								{campaignStatic.maximum}
								{campaignStatic.tokenSymbol}
							</p>
						</div>
						<!-- Prices -->
						{#each campaignStatic.prices as price, index}
							<div class="flex flex-wrap mb-2 pt-2">
								<div>
									<p><b>{campaignStatic.descriptions[index]}</b></p>
								</div>
								<div>
									<p class="mx-2 text-green-700">{price} {campaignStatic.tokenSymbol}</p>
								</div>
							</div>
						{:else}
							<p>Loading..</p>
						{/each}
					{/if}
				</div>
			</div>
		</div>
		<div>
		{#if campaignStaticDataLoaded}
		<Join tokenSymbol={campaignStatic.tokenSymbol} 
			  prices={campaignStatic.prices}
			  descriptions={campaignStatic.descriptions} />
		{/if}
		</div>
	</div>
</div>
