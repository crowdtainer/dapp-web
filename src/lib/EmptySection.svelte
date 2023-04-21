<script lang="ts">
	export let emptyMessage: string = '';
	export let isError: boolean = false;
</script>

<div class="max-w-7xl mx-auto py-6 sm:px-0 lg:px-0" >
	<div class="px-2 py-6 sm:px-0">
		<div class="mx-6 font-text border-2 border-dashed border-gray-400 rounded-lg ">
			<slot />
			{#if isError}
				<p class="text-red-700 text-center m-5">{emptyMessage}</p>
			{:else}
				<p class="text-gray-500 text-center m-5">{emptyMessage}</p>
			{/if}
		</div>
	</div>
</div>
