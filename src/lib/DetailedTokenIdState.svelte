<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import type { UIFields } from './Converters/CrowdtainerData';
	import { ProjectStatusUI } from './Converters/CrowdtainerData';
	import { BigNumber, ethers } from 'ethers';

	export let userFundsInCrowdtainer: BigNumber | undefined;
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

{#if userFundsInCrowdtainer !== undefined && !userFundsInCrowdtainer.isZero() && campaignStaticUI !== undefined}
	<p class="text-md text-lg text-left mt-3 mb-6">
		• You have joined this project with a contribution of {ethers.utils.formatUnits(
			`${userFundsInCrowdtainer}`,
			BigNumber.from(campaignStaticUI.tokenDecimals)
		)}
		{campaignStaticUI.tokenSymbol}.
		{#if state === ProjectStatusUI.Failed || state === ProjectStatusUI.ServiceProviderDeclined}
			• You can withdrawl {ethers.utils.formatUnits(
				`${userFundsInCrowdtainer}`,
				BigNumber.from(campaignStaticUI.tokenDecimals)
			)}
			{campaignStaticUI.tokenSymbol} from this campaign.
		{:else if state === ProjectStatusUI.SuccessfulyFunded}
			<p>• Waiting for service provider confirmation.</p>
		{:else if state === ProjectStatusUI.Delivery}
			<p>• Ready for checkout.</p>
		{/if}
	</p>
{/if}
