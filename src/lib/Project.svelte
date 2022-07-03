<script lang="ts">
	import type { Readable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	import Join from '$lib/Join.svelte';

	import { fetchStaticData } from '$lib/api';
	import { initializeStore, campaignStores } from '$lib/campaignStore';
	import { joinSelection } from '$lib/userStore';
	import TimeLeft from './TimeLeft.svelte';

	import type {
		CrowdtainerDynamicModel, CrowdtainerStaticModel
	} from '$lib/Model/CrowdtainerModel';
	import {
		toHuman,
		toStateString,
		calculatePercentageRaised,
		calculatePercentageWidth,
		type UIFields,
		prepareForUI
	} from '$lib/Converters/CrowdtainerData';

	export let crowdtainerId: number;
	export let title: string;
	export let subtitle: string;
	export let description: string;
	export let projectImageURL: string;

	let campaign: Readable<CrowdtainerDynamicModel> | undefined;
	let campaignStatic: CrowdtainerStaticModel | undefined;
	let campaignStaticUI: UIFields;
	let campaignStaticDataLoaded: boolean;

	let currentSelection = 0;
	let currentPrice: number;
	let raised: number;
	let tweeningDuration = 650;
	let tweenedRaised = tweened(0, { duration: tweeningDuration, easing: cubicOut });
	let tweenedPercentageWidth = tweened(0, { duration: tweeningDuration, easing: cubicOut });
	let tweenedPercentageRaised = tweened(0, { duration: tweeningDuration, easing: cubicOut });
	let moneyFormatter = new Intl.NumberFormat('en-GB', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0, });

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
			campaignStatic = result.unwrap();
			campaignStaticUI = prepareForUI(campaignStatic);
			// set initial price
			currentPrice = campaignStaticUI.prices[currentSelection];
			campaignStaticDataLoaded = true;
		} else {
			throw new Error('Unable to load project.');
		}
	}

	function setRaisedAmount() {
		if(campaignStaticDataLoaded) {
			raised = toHuman($campaign?.raised, campaignStaticUI.tokenDecimals);
			tweenedRaised.set(raised);
		}
	}

	function setPercentages() {
		if(campaignStaticDataLoaded) {
			let percentage = Number(calculatePercentageRaised(raised.toString(), campaignStaticUI.minimum));
			tweenedPercentageRaised.set(percentage);
			tweenedPercentageWidth.set(calculatePercentageWidth(percentage));
		} 
	}

	// dynamic
	$: stateString = (campaignStaticDataLoaded && $campaign !== undefined && campaignStatic !== undefined)
		? toStateString($campaign, campaignStatic)
		: 'Loading..';

	$: $campaign, setRaisedAmount();
	$: $campaign, setPercentages();

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
			let quantities: number[] = new Array<number>(campaignStaticUI.prices.length).fill(0);
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
							<div class="my-6 bg-gray-300 rounded-md w-full">
								<div
									class="bg-blue-700 text-sm font-medium text-white text-center p-1 leading-normal rounded-md"
									style="width: {$tweenedPercentageWidth}%"
								>
								{($tweenedPercentageRaised).toFixed(0)}%
								</div>
							</div>

							<!-- Main Status -->
							<div class="flex items-center justify-between px-2 gap-5">
								<div class="">
									<p class="text-blue-700 text-3xl">{stateString}</p>
									<p class="text-base">Status</p>
								</div>
								<div class="">
									<p class="text-blue-700 text-3xl">{campaignStaticUI.tokenSymbol} {moneyFormatter.format($tweenedRaised)}</p>
									<p class="text-base">raised of {moneyFormatter.format(Number(campaignStaticUI.minimum))} goal</p>
								</div>
								<div class="">
									<p class="text-blue-700 text-3xl">
										<TimeLeft endTime={campaignStaticUI.endDate} />
									</p>
									<p class="text-base">to go</p>
								</div>
							</div>

							<!-- Dates -->
							<div class="flex px-2 py-8 items-center justify-between gap-12">
								<div class="">
									<p class="text-xl">{campaignStaticUI.startDateString}</p>
									<p class="text-base">Start</p>
								</div>
								<div class="">
									<p class="text-xl">{campaignStaticUI.endDateString}</p>
									<p class="text-base">End</p>
								</div>
							</div>
							<p class="px-2 text-2xl text-gray-900">{currentPrice} {campaignStaticUI.tokenSymbol}</p>
							<div class="flex px-2 items-center justify-between">
								<h3 class="text-sm text-gray-900 font-medium">Price</h3>
							</div>
							<fieldset class="mt-4">
								<legend class="sr-only">Choose a product</legend>
								<div class="grid grid-cols-4 gap-4 sm:grid-cols-8 lg:grid-cols-4">
									{#each campaignStaticUI.prices as price, index}
										<label
											class:ring-2={currentSelection === index}
											class:ring-indigo-500={currentSelection === index}
											class="ring-2 ring-indigo-500 group relative border rounded-md py-3 px-4 flex items-center justify-center text-sm font-medium uppercase hover:bg-gray-50 focus:outline-none sm:flex-1 sm:py-6 bg-white shadow-sm text-gray-900 cursor-pointer"
										>
											<input
												type="radio"
												name="size-choice"
												on:click={() => updateCurrentSelection(index, price)}
												value={campaignStaticUI.descriptions[index]}
												class="sr-only"
												aria-labelledby="size-choice-1-label"
											/>
											<span id="size-choice-1-label"> {campaignStaticUI.descriptions[index]} </span>
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
					tokenSymbol={campaignStaticUI.tokenSymbol}
					prices={campaignStaticUI.prices}
					descriptions={campaignStaticUI.descriptions}
					{crowdtainerId}
				/>
			{/if}
		</div>
	</div>
</div>
