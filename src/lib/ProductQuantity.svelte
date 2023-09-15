<script lang="ts">

	import { derived, type Readable } from 'svelte/store';
	import { fade, slide} from 'svelte/transition';
	import { joinSelection } from './Stores/userStore.js';

	export let prices: number[];
	export let descriptions: string[];
	export let crowdtainerId: number;
	export let tokenSymbol: string;
	export let basePriceDenominator: number[];
	export let basePriceUnit: string;

	var selection: Readable<number[]> = derived(joinSelection, ($joinSelection) => {
		let storeSelection = $joinSelection.get(crowdtainerId);
		let noSelection = Array(descriptions.length).fill(0);
		if (storeSelection === undefined) {
			return noSelection;
		} else {
			return storeSelection;
		}
	});

	function incrementProduct(id: number) {
		if (id > $selection.length) {
			return;
		}
		var quantities = $selection;
		quantities[id]++;
		$joinSelection.set(crowdtainerId, quantities);
		$joinSelection = $joinSelection;
	}

	const decrementProduct = (id: number) => {
		if (id > $selection.length) {
			return;
		}
		if ($selection[id] > 0) {
			var quantities = $selection;
			quantities[id]--;
			$joinSelection.set(crowdtainerId, quantities);
			$joinSelection = $joinSelection;
		}
	};
</script>

<div class="text-black">
	<!-- Header -->
	<div id="header" class="text-center flex items-center bg-gray-100 dark:bg-gray-700 dark:text-white h-10 px-4">
		<div class="w-6/12 font-semibold">Description</div>
		<div class="w-3/12 font-semibold">Quantity</div>
		<div class="w-3/12 font-semibold">Subtotal</div>
	</div>
	<!-- Header End -->

	<div id="body" class="px-4 spacey-y-4">
		{#each descriptions as product, index}
		{#if $selection[index] > 0}
			<div transition:slide="{{ duration: 250 }}">
				<div class="flex items-center">
					<!-- Row start -->
					<div class="w-6/12">
						<p class="text-center text-sm md:text-base dark:text-white py-2 m-1">
							<b>{`${product}`} {`- ${(prices[index]/basePriceDenominator[index]).toFixed(2)} ${tokenSymbol}/${basePriceUnit}`}</b>
						</p>
					</div>
					<div class="w-3/12 flex justify-center">
						<div class="">
							<button
								type="button"
								class="m-3 py-2 px-3 border-2 border-gray-600 dark:border-gray-200 text-gray-800 dark:text-white font-medium rounded-3xl text-xs leading-tight uppercase hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0"
								on:click={() => {
									decrementProduct(index);
								}}
							>
								-
							</button>
						</div>
						<div in:fade|global class="my-2 py-2 dark:text-white">
							<p in:fade|global>{$selection[index]}</p>
						</div>
						<div class="">
							<button
								type="button"
								class="m-3 py-2 px-3 border-2 border-gray-600 dark:border-gray-200 text-gray-800 dark:text-white font-medium rounded-3xl text-xs leading-tight uppercase hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0"
								on:click={() => {
									incrementProduct(index);
								}}
							>
								+
							</button>
						</div>
					</div>
					<div class="pl-0 py-4 pr-1 w-3/12">
						{#key $selection[index]}
						<p in:fade|global="{{ duration: 200 }}" class="text-center dark:text-white">{prices[index] * $selection[index]} {tokenSymbol}</p>
						{/key}
					</div>
					<!-- Row end -->
				</div>
			</div>
			{/if}
		{/each}
	</div>
</div>
