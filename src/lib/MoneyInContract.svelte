<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import type { UIFields } from './Converters/CrowdtainerData';

	export let campaignStaticUI: UIFields | undefined;
	export let raised: number;

	let moneyFormatter = new Intl.NumberFormat('en-GB', {
		style: 'decimal',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	});

	let tweeningDuration = 650;
	let tweenedRaised = tweened(0, { duration: tweeningDuration, easing: cubicOut });

	function setRaisedAmount(raised: number) {
		tweenedRaised.set(raised);
	}

	$: setRaisedAmount(raised);
</script>

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
