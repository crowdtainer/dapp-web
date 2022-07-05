<script lang="ts">
	import { derived, type Readable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';

	import Join from '$lib/Join.svelte';

	import { fetchStaticData } from '$lib/api';
	import { initializeStore, campaignStores } from '$lib/campaignStore';
	import ProductQuantity from '$lib/ProductQuantity.svelte';
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

	const loadingString = 'Loading...';

	enum LoadStatus { Loading, Loaded, FetchFailed };

	let campaign: Readable<CrowdtainerDynamicModel> | undefined;
	let campaignStatic: CrowdtainerStaticModel | undefined;
	let campaignStaticUI: UIFields | undefined;
	let staticDataLoadStatus: LoadStatus = LoadStatus.Loading;

	let currentSelection = 0;
	let currentPrice: number;
	let raised: number;
	let tweeningDuration = 650;
	let tweenedRaised = tweened(0, { duration: tweeningDuration, easing: cubicOut });
	let tweenedPercentageWidth = tweened(0, { duration: tweeningDuration, easing: cubicOut });
	let tweenedPercentageRaised = tweened(0, { duration: tweeningDuration, easing: cubicOut });
	let moneyFormatter = new Intl.NumberFormat('en-GB', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0, });

	onMount(async () => {
		await loadStaticData();
		$joinSelection = $joinSelection;
		// Dynamic data
		if (campaign == undefined) {
			campaign = initializeStore(crowdtainerId);
		} else {
			campaign = campaignStores.get(crowdtainerId);
		}
	});

	// CrowdtainerId -> totalSum
    export const totalSum: Readable<number> = derived(joinSelection, $joinSelection => {
        if(campaignStaticUI === undefined
			|| crowdtainerId === undefined
			|| campaignStaticUI.descriptions === undefined
			|| campaignStaticUI.prices === undefined) {
            return 0;
        }
        let totalSum = 0;
        let selection = $joinSelection.get(crowdtainerId);
        if(selection === undefined) {
            selection = new Array<number>(campaignStaticUI.descriptions.length).fill(0);
            return 0;
        }
        for (var i = 0; i < selection.length; i++){
                totalSum += selection[i] * campaignStaticUI.prices[i];
        }
        return totalSum;
    });

	async function loadStaticData() {
		staticDataLoadStatus = LoadStatus.Loading;
		let result = await fetchStaticData(crowdtainerId);
		if (result.isOk()) {
			campaignStatic = result.unwrap();
			campaignStaticUI = prepareForUI(campaignStatic);
			// set initial price
			currentPrice = campaignStaticUI.prices[currentSelection];
			staticDataLoadStatus = LoadStatus.Loaded;
		} else {
			campaignStatic = campaignStaticUI = undefined;
			staticDataLoadStatus = LoadStatus.FetchFailed;
		}
	}

	function setRaisedAmount() {
		if(staticDataLoadStatus !== LoadStatus.FetchFailed) {
			let decimals = campaignStaticUI ? campaignStaticUI.tokenDecimals : undefined;
			raised = toHuman($campaign?.raised, decimals);
			tweenedRaised.set(raised);
		}
	}

	function setPercentages() {
		if(staticDataLoadStatus !== LoadStatus.FetchFailed) {
			let percentage = campaignStaticUI
					? Number(calculatePercentageRaised(raised.toString(), campaignStaticUI.minimum))
					: undefined;

			if (percentage !== undefined) {
				tweenedPercentageRaised.set(percentage);
				tweenedPercentageWidth.set(calculatePercentageWidth(percentage));
			}
		}
	}

	// dynamic
	$: stateString = (staticDataLoadStatus !== LoadStatus.FetchFailed && $campaign !== undefined && campaignStatic !== undefined)
		? toStateString($campaign, campaignStatic)
		: loadingString;

	$: $campaign, setRaisedAmount();
	$: $campaign, setPercentages();
	$: loadingAnimation = (staticDataLoadStatus === LoadStatus.Loading);

	function updateCurrentSelection(index: number, price: number) {
		currentSelection = index;
		currentPrice = price;
	}

	function addProduct() {
		if (staticDataLoadStatus === LoadStatus.FetchFailed || campaignStaticUI === undefined) {
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
	<div class="max-w-lg mx-auto white overflow-hidden md:max-w-7xl my-8">
		<div class="md:flex">
			<div class="md:shrink-0">
				<img
					class="w-full object-cover md:h-full md:w-96 blur-[3px]"
					src={projectImageURL}
					alt="Coffee"
				/>
			</div>
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

					{#if staticDataLoadStatus === LoadStatus.Loaded || staticDataLoadStatus === LoadStatus.Loading}
						<div class:animate-pulse={loadingAnimation}>
							<div class="my-6 bg-gray-300 rounded-md w-full">
								<div
									class="bg-blue-700 text-sm font-medium text-white text-center p-1 leading-normal rounded-md"
									style="width: {$tweenedPercentageWidth}%"
								>
								{($tweenedPercentageRaised).toFixed(0)}%
								</div>
							</div>

							<!-- Main Status -->
							<div  class="flex items-center justify-between px-2 gap-5">
								<div >
									<p class="text-blue-700 text-3xl">{stateString}</p>
									<p class="text-base">Status</p>
								</div>
								<div class="">
									<p class="text-blue-700 text-3xl">{campaignStaticUI ? campaignStaticUI.tokenSymbol : ''} {moneyFormatter.format($tweenedRaised)}</p>
									{#if campaignStaticUI}
									<p class="text-base">raised of {moneyFormatter.format(Number(campaignStaticUI.minimum))} goal</p>
									{:else}
									<p class="text-base">raised</p>
									{/if}
								</div>
								<div class="">
									{#if campaignStaticUI}
										<p class="text-blue-700 text-3xl">
										<TimeLeft endTime={campaignStaticUI.endDate} />
										</p>
										<p class="text-base">to go</p>
									{:else}
									<p class="text-blue-700 text-3xl">
										{loadingString}
										</p>
										<p class="text-base">-</p>
									{/if}
								</div>
							</div>

							<!-- Dates -->
							<div class="flex px-2 py-8 items-center justify-between gap-12">
								<div class="">
									<p class="text-xl">{campaignStaticUI ? campaignStaticUI.startDateString : loadingString}</p>
									<p class="text-base">Start</p>
								</div>
								<div class="">
									<p class="text-xl">{campaignStaticUI ? campaignStaticUI.endDateString : loadingString}</p>
									<p class="text-base">End</p>
								</div>
							</div>
							{#if staticDataLoadStatus === LoadStatus.Loaded}
								<p class="px-2 text-2xl text-gray-900">{currentPrice} {campaignStaticUI? campaignStaticUI.tokenSymbol : ''}</p>
							{:else}
								<p class="px-2 text-2xl text-gray-900">{loadingString}</p>
							{/if}
							<div class="flex px-2 items-center justify-between">
								<h3 class="text-sm text-gray-900 font-medium">Price</h3>
							</div>
							<fieldset class="mt-4">
								<legend class="sr-only">Choose a product</legend>
								<div class="grid grid-cols-4 gap-4 sm:grid-cols-8 lg:grid-cols-4">
									{#if campaignStaticUI !== undefined}
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
									{:else}
									<label
											class="ring-2 ring-indigo-500 group relative border rounded-md py-3 px-4 flex items-center justify-center text-sm font-medium uppercase hover:bg-gray-50 focus:outline-none sm:flex-1 sm:py-6 bg-white shadow-sm text-gray-900 cursor-pointer"
										>
											<input
												type="radio"
												name="size-choice"
												value={loadingString}
												class="sr-only"
												aria-labelledby="size-choice-1-label"
											/>
											<span id="size-choice-1-label"> {loadingString} </span>
											<span
												class="absolute -inset-px rounded-md pointer-events-none"
												aria-hidden="true"
											/>
										</label>
									{/if}
								</div>
							</fieldset>
							<!-- </div> -->
						</div>

						<button
							on:click="{() => {addProduct()}}"
							class="mt-10 w-1/5 bg-gray-700 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						>
							Add
						</button>
					{:else}
						<p class="my-6 text-red-800">Error fetching data. Please reload the page.</p>
					{/if}
				</div>
		</div>
		{#if $totalSum > 0}
		<div transition:slide="{{ duration: 300 }}">
			{#if campaignStaticUI === undefined}
				<Join totalSum={$totalSum}/>
			{:else}
				<Join
					tokenSymbol={campaignStaticUI.tokenSymbol}
					totalSum={$totalSum}
				>
					<ProductQuantity
						prices={campaignStaticUI.prices}
						descriptions={campaignStaticUI.descriptions}
						{crowdtainerId}
						tokenSymbol={campaignStaticUI.tokenSymbol}/>
				</Join>
			{/if}
		</div>
		{/if}
	</div>
</div>