<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import type { UIFields } from './Converters/CrowdtainerData';
	import { ProjectStatusUI } from './Converters/CrowdtainerData';

	export let campaignStaticUI: UIFields | undefined;
	export let fundsInContract: number | undefined;
	export let raisedAmount: number | undefined;
	export let state: ProjectStatusUI | undefined;

	let moneyFormatter = new Intl.NumberFormat('en-GB', {
		style: 'decimal',
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	});

	let tweeningDuration = 650;
	let tweenedRaised = tweened(0, { duration: tweeningDuration, easing: cubicOut });
	let tweenedFundsInContract = tweened(0, { duration: tweeningDuration, easing: cubicOut });

	function setRaisedAmount(raised: number | undefined, fundsInContract: number | undefined) {
		raised === undefined ? tweenedRaised.set(0) : tweenedRaised.set(raised);
		fundsInContract === undefined ? tweenedFundsInContract.set(0) : tweenedFundsInContract.set(fundsInContract);
	}

	$: setRaisedAmount(raisedAmount, fundsInContract);
</script>

<div class="">
	{#if state === ProjectStatusUI.Failed || state === ProjectStatusUI.ServiceProviderDeclined}
		<p class="projectStatus">
			{moneyFormatter.format($tweenedFundsInContract)}
			{campaignStaticUI ? campaignStaticUI.tokenSymbol : ''}
		</p>
		<p class="projectDataSubtitle">left for withdrawal</p>
	{:else if state === ProjectStatusUI.Delivery}
	<p class="projectStatus">
		{moneyFormatter.format($tweenedRaised)}
		{campaignStaticUI ? campaignStaticUI.tokenSymbol : ''}
	</p>
	<p class="projectDataSubtitle">raised</p>
	{:else}
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
	{/if}
</div>