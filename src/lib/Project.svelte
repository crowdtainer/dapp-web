<script lang="ts">
	import type { Readable } from 'svelte/store';
	import { onMount } from 'svelte';

	import Join from '$lib/Join.svelte';

	import { fetchStaticData } from '$lib/api';
	import { initializeStore, campaignStores } from '$lib/campaignStore';
	import { joinSelection } from '$lib/userStore';

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

	let currentSelection = 0;
	let currentPrice: number;

	onMount(async () => {
		// Dynamic data
		if (campaign == undefined) {
			campaign = initializeStore(crowdtainerId);
		} else {
			campaign = campaignStores.get(crowdtainerId);
		}
	});

	async function loadStaticData() {
		let result = await fetchStaticData(crowdtainerId);
		if (result.isOk()) {
			campaignStatic = prepareForUI(result.unwrap());
			// set initial price
			currentPrice = campaignStatic.prices[currentSelection];
			campaignStaticDataLoaded = true;
		} else {
			throw new Error('Unable to load project.');
		}
	}

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
	$: raised = campaignStaticDataLoaded
		? toHuman($campaign?.raised, campaignStatic.tokenDecimals)
		: 'Loading..';

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
			tokenDecimals: data.tokenDecimals ? data.tokenDecimals : 0, // TODO
			prices: toHumanPrices(data.prices, data.tokenDecimals),
			descriptions: prettyDescription(data.productDescription)
		};
	}

	function updateCurrentSelection(index: number, price: number) {
		currentSelection = index;
		currentPrice = price;
	}

	function addProduct() {
		if (!campaignStaticDataLoaded) {
			return;
		}
		let updatedQuantity = $joinSelection.get(crowdtainerId);
		if (updatedQuantity !== undefined) {
			updatedQuantity[currentSelection]++;
			$joinSelection.set(crowdtainerId, updatedQuantity);
			$joinSelection = $joinSelection;
		} else {
			let quantities: number[] = new Array<number>(campaignStatic.prices.length).fill(0);
			quantities[currentSelection]++;
			$joinSelection.set(crowdtainerId, quantities);
			$joinSelection = $joinSelection;
		}
	}
</script>

<div class="max-w-10xl mx-auto py-1 sm:px-6 lg:px-8">
	<div class="max-w-lg mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-7xl my-8">
		<div class="md:flex">
			<div class="md:shrink-0">
				<img
					class="w-full object-cover md:h-full md:w-96 blur-[3px]"
					src={projectImageURL}
					alt="Coffee"
				/>
			</div>
			<form on:submit|preventDefault={() => addProduct()} class="mt-10">
				<div class="p-8">
					<div class="uppercase tracking-wide text-base text-indigo-500 font-semibold">
						{title}
					</div>
					<a
						href="#"
						class="block mt-1 text-2xl leading-tight font-medium text-black hover:underline"
						>{subtitle}</a
					>
					<p class="mt-5 text-slate-500">
						{@html description}
					</p>

					{#await loadStaticData()}
					<p class="my-6">Loading data..</p>
					{:then}
						<div class="">
							<div class="my-6 bg-gray-200 rounded-md w-full">
								<div
								class="bg-blue-600 text-xs font-medium text-white text-center p-2 leading-normal rounded-l-md"
								style="width: 25%"
								>
								25%
							</div>
						</div>

						<!-- Main Status -->
						<div class="flex items-center justify-between px-2 gap-5">
						<div class="">
							<p class="text-blue-600 text-3xl">{stateString}</p>
							<p class="text-base">Status</p>
						</div>
						<div class="">
							<p class="text-blue-600 text-3xl">{campaignStatic.tokenSymbol} {raised}</p>
							<p class="text-base">raised of {campaignStatic.minimum} goal</p>
						</div>
						<div class="">
							<p class="text-blue-600 text-3xl">9</p>
							<p class="text-base">days to go</p>
						</div>
						</div>

						<!-- Dates -->
						<div class="flex px-2 py-8 items-center justify-between gap-12">
						<div class="">
							<p class="text-xl"><b>{campaignStatic.startDate}</b></p>
							<p class="text-base">Start</p>
						</div>
						<div class="">
							<p class="text-xl"><b>{campaignStatic.endDate}</b></p>
							<p class="text-base">End</p>
						</div>
						</div>
							<div class="flex items-center justify-between">
								<h3 class="text-sm text-gray-900 font-medium">Price</h3>
							</div>
							<p class="text-xl text-gray-900">{currentPrice} {campaignStatic.tokenSymbol}</p>
							<fieldset class="mt-4">
								<legend class="sr-only">Choose a product</legend>
								<div class="grid grid-cols-4 gap-4 sm:grid-cols-8 lg:grid-cols-4">
									{#each campaignStatic.prices as price, index}
										<label
											class:ring-2={currentSelection === index}
											class:ring-indigo-500={currentSelection === index}
											class="ring-2 ring-indigo-500 group relative border rounded-md py-3 px-4 flex items-center justify-center text-sm font-medium uppercase hover:bg-gray-50 focus:outline-none sm:flex-1 sm:py-6 bg-white shadow-sm text-gray-900 cursor-pointer"
										>
											<input
												type="radio"
												name="size-choice"
												on:click={() => updateCurrentSelection(index, price)}
												value={campaignStatic.descriptions[index]}
												class="sr-only"
												aria-labelledby="size-choice-1-label"
											/>
											<span id="size-choice-1-label"> {campaignStatic.descriptions[index]} </span>
											<span
												class="absolute -inset-px rounded-md pointer-events-none"
												aria-hidden="true"
											/>
										</label>
									{/each}
								</div>
							</fieldset>
							<!-- </div> -->
						</div>
						<button
						type="submit"
						class="mt-10 w-1/5 bg-gray-700 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						Add
					</button>
					{:catch error}
					<p class="my-6 text-red-800">{error} Please reload the page.</p>
					{/await}
				</div>
			</form>
		</div>
		<div>
			{#if campaignStaticDataLoaded}
				<Join
					tokenSymbol={campaignStatic.tokenSymbol}
					prices={campaignStatic.prices}
					descriptions={campaignStatic.descriptions}
					{crowdtainerId}
				/>
			{/if}
		</div>
	</div>
</div>
