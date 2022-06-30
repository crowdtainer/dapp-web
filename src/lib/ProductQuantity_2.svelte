<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	export let prices: number[];
	export let descriptions: string[];

	$: productQuantities = resetQuantities(descriptions.length);

	function updateQuantities(newQuantities: Array<number>) {
		dispatch('quantitiesChanged', {
			quantities: newQuantities
		});
	}

	function resetQuantities(size: number): number[] {
		let newArray = Array(size);
		newArray.fill(0);
		return newArray;
	}

	function incrementProduct(id: number) {
		if (id > productQuantities.length) {
			return;
		}
		productQuantities[id]++;
		updateQuantities(productQuantities);
	}

	const decrementProduct = (id: number) => {
		if (id > productQuantities.length) {
			return;
		}
		if (productQuantities[id] > 0) {
			productQuantities[id]--;
			updateQuantities(productQuantities);
		}
	};
</script>

<!-- Header -->
<div>
	<div id="header" class="flex items-center bg-gray-100 h-10 px-4">
		<div class="w-3/12 font-semibold">Description</div>
		<div class="w-6/12 font-semibold">Quantity</div>
		<div class="w-3/12 font-semibold">Subtotal</div>
	</div>
<!-- Header End -->

<div id="body" class="px-4 spacey-y-4">
{#each descriptions as product, index}

		<div class="flex">
			<!-- Row start -->
			<div class="w-2/12">
				<p class="text-right text-base py-1">
					<b>{product} - </b>
				</p>
			</div>
			<div class="w-2/12 flex justify-center">
				<button
					type="button"
					class="px-3 border-2 border-gray-800 text-gray-800 font-medium text-xs leading-tight uppercase rounded hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0"
					on:click={() => {
						decrementProduct(index);
					}}
				>
					-
				</button>
			</div>
			<div class="py-1 w-2/12">
				{productQuantities[index]}
			</div>
			<div class="w-2/12">
				<button
					type="button"
					class="center t-2 px-3 border-2 border-gray-800 text-gray-800 font-medium text-xs leading-tight uppercase rounded hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0"
					on:click={() => {
						incrementProduct(index);
					}}
				>
					+
				</button>
			</div>
			<div class="pl-1 py-1 pr-1 w-2/12">
				{prices[index] * productQuantities[index]} USDC
			</div>
		</div>
		<!-- Row end -->
{/each}
</div></div>