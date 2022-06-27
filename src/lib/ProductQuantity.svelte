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

{#each descriptions as product, index}
<div id="container" class="grid grid-cols-10 w-82 m-3">
	<div class="col-span-2">
		<p class="text-right text-base mr-2 py-1">
			<b>{product} - </b>
		</p>
	</div>
	<div class="w-12 col-span-2">
		<button
			type="button"
			class="px-3 py-2 border-2 border-gray-800 text-gray-800 font-medium text-xs leading-tight uppercase rounded hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0"
			on:click={() => {
				decrementProduct(index);
			}}
		>
			-
		</button>
	</div>
	<div class="w-8 py-1 pr-1 col-span-2">
		{productQuantities[index]}
	</div>
	<div>
		<button
			type="button"
			class="t-2 px-3 py-2 border-2 border-gray-800 text-gray-800 font-medium text-xs leading-tight uppercase rounded hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0"
			on:click={() => {
				incrementProduct(index);
			}}
		>
			+
		</button>
	</div>
	<div class="pl-1 py-1 pr-1 col-span-2">
		{prices[index] * productQuantities[index]} USDC
	</div>

</div>
{/each}
