<script lang="ts">
	export let tokenSymbol: string | undefined = undefined;
	export let totalSum: number;
	import { blur } from 'svelte/transition';
</script>

<!-- Order container -->
<div class="center container mx-auto max-w-6xl mb-4">
	<div class="">
		<!-- Products container -->
		<div class="m-3">
			<slot />
			<!-- Summary -->
			<div class="text-black divide-y divide-dashed text-right mr-4 my-2 py-4">
				<p class="text-sm">7% tax (USt.) and shipping included</p>
				<p class="text-sm"><b>(Currently shipping only to Germany)</b></p>
				{#key totalSum}
					<p in:blur={{ duration: 250 }} class="text-lg my-4">
						<b>Total</b>: {totalSum}
						{tokenSymbol}
					</p>
				{/key}
			</div>
		</div>
	</div>
	<!-- here-->
</div>
