<script lang="ts">
	import { derived, type Readable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';

	import Join from '$lib/Join.svelte';

	import { initializeStore, campaignStores } from '$lib/campaignStore';
	import ProductQuantity from '$lib/ProductQuantity.svelte';
	import { joinSelection } from '$lib/userStore';
	import TimeLeft from './TimeLeft.svelte';

	import type {
		CrowdtainerDynamicModel,
		CrowdtainerStaticModel
	} from '$lib/Model/CrowdtainerModel';
	import {
		toHuman,
		toStateString,
		toState,
		calculatePercentageRaised,
		calculatePercentageWidth,
		type UIFields,
		LoadStatus,
		ProjectStatusUI
	} from '$lib/Converters/CrowdtainerData';

	export let crowdtainerId: number;
	export let title: string;
	export let subtitle: string;
	export let description: string;
	export let projectURL: string;
	export let projectImageURL: string;

	export let campaignStaticData: CrowdtainerStaticModel | undefined;
	export let campaignStaticUI: UIFields | undefined;
	export let staticDataLoadStatus: LoadStatus = LoadStatus.Loading;

	const loadingString = 'Loading...';

	let campaignDynamicData: Readable<CrowdtainerDynamicModel> | undefined;

	let currentSelection = 0;
	let currentPrice: number;
	let raised: number;
	let tweeningDuration = 650;
	let tweenedRaised = tweened(0, { duration: tweeningDuration, easing: cubicOut });
	let tweenedPercentageWidth = tweened(0, { duration: tweeningDuration, easing: cubicOut });
	let tweenedPercentageRaised = tweened(0, { duration: tweeningDuration, easing: cubicOut });
	let moneyFormatter = new Intl.NumberFormat('en-GB', {
		style: 'decimal',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	});

	onMount(async () => {
		$joinSelection = $joinSelection;
		// Dynamic data
		if (campaignDynamicData == undefined) {
			campaignDynamicData = initializeStore(crowdtainerId);
		} else {
			campaignDynamicData = campaignStores.get(crowdtainerId);
		}
		if (campaignStaticUI !== undefined) updateCurrentSelection(0, campaignStaticUI.prices[0]);
	});

	// CrowdtainerId -> totalSum
	const totalSum: Readable<number> = derived(joinSelection, ($joinSelection) => {
		if (
			campaignStaticUI === undefined ||
			crowdtainerId === undefined ||
			campaignStaticUI.descriptions === undefined ||
			campaignStaticUI.prices === undefined
		) {
			return 0;
		}

		let totalSum = 0;
		let selection = $joinSelection.get(crowdtainerId);
		if (selection === undefined) {
			selection = new Array<number>(campaignStaticUI.descriptions.length).fill(0);
			return 0;
		}
		for (var i = 0; i < selection.length; i++) {
			totalSum += selection[i] * campaignStaticUI.prices[i];
		}
		return totalSum;
	});

	function setRaisedAmount() {
		if (staticDataLoadStatus !== LoadStatus.FetchFailed) {
			let decimals = campaignStaticUI ? campaignStaticUI.tokenDecimals : undefined;
			raised = toHuman($campaignDynamicData?.raised, decimals);
			tweenedRaised.set(raised);
		}
	}

	function setPercentages() {
		if (staticDataLoadStatus !== LoadStatus.FetchFailed) {
			let percentage = campaignStaticUI
				? Number(calculatePercentageRaised(raised.toString(), campaignStaticUI.minimum))
				: undefined;

			if (percentage !== undefined) {
				tweenedPercentageRaised.set(percentage);
				tweenedPercentageWidth.set(calculatePercentageWidth(percentage));
			}
		}
	}

	// Failed,                 // Failed to raise minimum amount in time.
	// SuccessfulyFunded,      // Minimum funding reached in time.
	// Delivery,               // Service provider accepted orders and will deliver products.
	// ServiceProviderDeclined // Minimum funding amount was reached in time, but the service provided decided to not go foward. Funds are available for withdrawal by participants.

	// dynamic
	$: state = toState($campaignDynamicData, campaignStaticData);
	$: disableJoinView = !(
		state === ProjectStatusUI.Failed ||
		state === ProjectStatusUI.SuccessfulyFunded ||
		state === ProjectStatusUI.Delivery ||
		state === ProjectStatusUI.ServiceProviderDeclined);

	$: stateString =
		staticDataLoadStatus !== LoadStatus.FetchFailed &&
		$campaignDynamicData !== undefined &&
		campaignStaticData !== undefined
			? toStateString($campaignDynamicData, campaignStaticData)
			: loadingString;

	$: $campaignDynamicData, setRaisedAmount();
	$: $campaignDynamicData, setPercentages();
	$: loadingAnimation = staticDataLoadStatus === LoadStatus.Loading;

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
	<div class="border-2  rounded-2xl max-w-lg mx-auto white overflow-hidden md:max-w-7xl my-8">
		<div class="md:flex">
			<div class="md:shrink-0">
				<img class="w-full object-cover md:h-full md:w-96" src={projectImageURL} alt="Coffee" />
			</div>
			<div class="p-8">
				<div class="font-mono uppercase tracking-wide text-base text-red-600 font-semibold">
					{title}
				</div>
				<a href={projectURL} class="block mt-1 text-2xl leading-tight font-medium hover:underline"
					>{subtitle}</a
				>
				<p class="mt-5 text-slate-500">
					{@html description}
				</p>

				{#if staticDataLoadStatus === LoadStatus.Loaded || staticDataLoadStatus === LoadStatus.Loading}
					<div class:animate-pulse={loadingAnimation}>
						<div class="my-6 bg-gray-300 rounded-md w-full">
							<div
								class="bg-sky-600 text-sm font-medium text-white text-center p-1 leading-normal rounded-md"
								style="width: {$tweenedPercentageWidth}%"
							>
								{$tweenedPercentageRaised.toFixed(0)}%
							</div>
						</div>

						<!-- Main Status -->
						<div class="flex items-center justify-between px-2 gap-5">
							<div>
								<p class="projectStatus">{stateString}</p>
								<p class="projectDataSubtitle">Status</p>
							</div>
							<div class="">
								<p class="projectStatus">
									{moneyFormatter.format($tweenedRaised)}
									{campaignStaticUI ? campaignStaticUI.tokenSymbol : ''}
								</p>
								{#if campaignStaticUI}
									<p class="projectDataSubtitle">
										raised of {moneyFormatter.format(Number(campaignStaticUI.minimum))} goal
									</p>
								{:else}
									<p class="projectDataSubtitle">raised</p>
								{/if}
							</div>
							<div class="">
								{#if campaignStaticUI}
									<p class="projectStatus">
										<TimeLeft endTime={campaignStaticUI.endDate} />
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
						<div class="flex px-2 py-8 items-center justify-between gap-12">
							<div class="">
								<p class="projectData">
									{campaignStaticUI ? campaignStaticUI.startDateString : loadingString}
								</p>
								<p class="projectDataSubtitle">Start</p>
							</div>
							<div class="">
								<p class="projectData">
									{campaignStaticUI ? campaignStaticUI.endDateString : loadingString}
								</p>
								<p class="projectDataSubtitle">End</p>
							</div>
						</div>

						{#if disableJoinView}
							<div class="pt-4">
								{#if staticDataLoadStatus === LoadStatus.Loaded && currentPrice !== undefined}
									<p class="px-2 productPrice">
										{currentPrice}
										{campaignStaticUI ? campaignStaticUI.tokenSymbol : ''}
									</p>
								{:else}
									<p class="px-2 productPrice">{loadingString}</p>
								{/if}
								<div class="flex px-2">
									<h3 class="projectDataSubtitle">Price</h3>
								</div>
							</div>

							<fieldset class="mt-4 font-mono">
								<legend class="sr-only">Choose a product</legend>
								{#if campaignStaticUI !== undefined}
									<div class="grid grid-cols-2 gap-4">
										{#each campaignStaticUI.prices as price, index}
											<label
												class:ring-2={currentSelection === index}
												class:ring-indigo-500={currentSelection === index}
												class="ring-gray-800 group relative border rounded-md py-3 px-5 flex items-center justify-center text-sm font-medium uppercase hover:bg-gray-50 focus:outline-none sm:flex-1 sm:py-4 bg-white shadow-sm text-gray-900 cursor-pointer"
											>
												<input
													type="radio"
													name="size-choice"
													on:click={() => updateCurrentSelection(index, price)}
													value={campaignStaticUI.descriptions[index]}
													class="sr-only"
													aria-labelledby="size-choice-1-label"
												/>
												<span id="size-choice-1-label">
													{campaignStaticUI.descriptions[index]}
												</span>
												<span
													class="absolute -inset-px rounded-md pointer-events-none"
													aria-hidden="true"
												/>
											</label>
										{/each}
									</div>
								{:else}
									<div class="grid grid-cols-1 gap-4">
										{#each [loadingString, loadingString] as text}
											<label
												class="ring-gray-800 group relative border rounded-md py-3 px-5 flex items-center justify-center text-sm font-medium uppercase hover:bg-gray-50 focus:outline-none sm:flex-1 sm:py-4 bg-white shadow-sm text-gray-900 cursor-pointer"
											>
												<input
													type="radio"
													name="size-choice"
													value={text}
													class="sr-only"
													aria-labelledby="size-choice-1-label"
												/>
												<span id="size-choice-1-label"> {text} </span>
												<span
													class="absolute -inset-px rounded-md pointer-events-none"
													aria-hidden="true"
												/>
											</label>
										{/each}
									</div>
								{/if}
							</fieldset>
						{/if}
					</div>

					{#if disableJoinView}
						<div class="flex">
							<button
								on:click={() => {
									addProduct();
								}}
								class="px-2 mt-10 w-full md:w-4/6 lg:w-2/6 bg-gray-900 font-medium text-white hover:bg-gray-700 hover:shadow-lg border border-transparent rounded-3xl py-3 flex items-center justify-center text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
							>
								Add to pre-order
							</button>
						</div>
					{/if}
				{:else}
					<p class="my-6 text-red-800">Error fetching data. Please reload the page.</p>
				{/if}
			</div>
		</div>
		{#if $totalSum > 0}
			<div transition:slide={{ duration: 300 }}>
				{#if campaignStaticUI === undefined}
					<Join totalSum={$totalSum} />
				{:else}
					<Join tokenSymbol={campaignStaticUI.tokenSymbol} totalSum={$totalSum}>
						<ProductQuantity
							prices={campaignStaticUI.prices}
							descriptions={campaignStaticUI.descriptions}
							{crowdtainerId}
							tokenSymbol={campaignStaticUI.tokenSymbol}
						/>
					</Join>
				{/if}
			</div>
		{/if}
	</div>
</div>
