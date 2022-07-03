<script lang="ts">
	import { joinSelection } from '$lib/userStore';
	import { derived, type Readable } from 'svelte/store';
	import { slide } from 'svelte/transition';

	export let prices: number[];
	export let descriptions: string[];
	export let crowdtainerId: number;
	export let tokenSymbol: string;

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

<div>
	<!-- Header -->
	<div id="header" class="text-center flex items-center bg-gray-100 h-10 px-4">
		<div class="w-5/12 font-semibold">Description</div>
		<div class="w-4/12 font-semibold">Quantity</div>
		<div class="w-3/12 font-semibold">Subtotal</div>
	</div>
	<!-- Header End -->

	<div id="body" class="px-4 spacey-y-4">
		{#each descriptions as product, index}
		{#if $selection[index] > 0}
			<div transition:slide|local="{{ duration: 100 }}">
				<div class="flex">
					<!-- Row start -->
					<div class="w-5/12">
						<p class="text-center text-base py-2 m-1">
							<b>{product}</b>
						</p>
					</div>
					<div class="w-4/12 flex justify-center">
						<div class="">
							<button
								type="button"
								class="m-3 py-2 px-3 border-2 border-gray-800 text-gray-800 font-medium text-xs leading-tight uppercase rounded hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0"
								on:click={() => {
									decrementProduct(index);
								}}
							>
								-
							</button>
						</div>
						<div class="my-2 py-2">
							{$selection[index]}
						</div>
						<div class="">
							<button
								type="button"
								class="m-3 py-2 px-3 border-2 border-gray-800 text-gray-800 font-medium text-xs leading-tight uppercase rounded hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0"
								on:click={() => {
									incrementProduct(index);
								}}
							>
								+
							</button>
						</div>
					</div>
					<div class="text-center pl-0 py-4 pr-1 w-3/12">
						{prices[index] * $selection[index]}
						{tokenSymbol}
					</div>
					<!-- Row end -->
				</div>
			</div>
			{/if}
		{/each}
	</div>
</div>
