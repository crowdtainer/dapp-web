<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import type { UIFields } from './Converters/CrowdtainerData';
	import { ProjectStatusUI } from './Converters/CrowdtainerData';
	import { moneyFormatter } from './Utils/moneyFormatter.js';

	export let campaignStaticUI: UIFields | undefined;
	export let fundsInContract: number | undefined;
	export let raisedAmount: number | undefined;
	export let state: ProjectStatusUI | undefined;

	let tweeningDuration = 650;
	let tweenedRaised = tweened(0, { duration: tweeningDuration, easing: cubicOut });
	let tweenedFundsInContract = tweened(0, { duration: tweeningDuration, easing: cubicOut });

	function setRaisedAmount(raised: number | undefined, fundsInContract: number | undefined) {
		raised === undefined ? tweenedRaised.set(0) : tweenedRaised.set(raised);
		fundsInContract === undefined
			? tweenedFundsInContract.set(0)
			: tweenedFundsInContract.set(fundsInContract);
	}

	$: setRaisedAmount(raisedAmount, fundsInContract);
</script>

<div class="px-2">
	{#if state === ProjectStatusUI.Failed || state === ProjectStatusUI.ServiceProviderDeclined}
		<div class="projectStatus">
			<div class="flex flex-inline">
				{moneyFormatter.format($tweenedFundsInContract)}
				<p class="text-xs">{campaignStaticUI ? campaignStaticUI.tokenSymbol : ''}</p>
			</div>
		</div>
		<p class="projectDataSubtitle">left in pool</p>
	{:else if state === ProjectStatusUI.Delivery}
		<div class="projectStatus">
			<div class="flex flex-inline">
				{moneyFormatter.format($tweenedRaised)}
				<p class="text-xs">{campaignStaticUI ? campaignStaticUI.tokenSymbol : ''}</p>
			</div>
		</div>
		<p class="projectDataSubtitle">raised</p>
	{:else}
		<div class="projectStatus">
			<div class="flex flex-inline items-end text-left lg:text-right">
				<div class='mr-2'>{moneyFormatter.format($tweenedRaised)}</div>
				<p class="">{campaignStaticUI ? campaignStaticUI.tokenSymbol : ''}</p>
			</div>
		</div>
		{#if campaignStaticUI}
			<p class="projectDataSubtitle lg:text-right">
				raised of {moneyFormatter.format(Number(campaignStaticUI.minimum))} goal
			</p>
		{:else}
			<p class="projectDataSubtitle">raised</p>
		{/if}
	{/if}
</div>