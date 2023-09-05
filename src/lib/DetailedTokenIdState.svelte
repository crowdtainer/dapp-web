<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import type { UIFields } from './Converters/CrowdtainerData';
	import { ProjectStatusUI } from './Converters/CrowdtainerData';
	import { BigNumber, ethers } from 'ethers';
	import { OrderStatus } from './api';
	import type { WalletCrowdtainerModel } from './Model/WalletCrowdtainerModel.js';

	export let walletData: WalletCrowdtainerModel | undefined;
	
	export let campaignStaticUI: UIFields | undefined;
	export let fundsInContract: number | undefined;
	export let raisedAmount: number | undefined;
	export let state: ProjectStatusUI | undefined;
	export let orderStatus: OrderStatus;

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

{#if campaignStaticUI !== undefined}
	{#if walletData !== undefined && !walletData.fundsInCrowdtainer.isZero()}
		<p class="text-black dark:text-gray-200 text-md text-md text-left mt-3 mb-6">
			• You have joined this project with a contribution of <b
				>{ethers.utils.formatUnits(
					`${walletData.fundsInCrowdtainer}`,
					BigNumber.from(campaignStaticUI.tokenDecimals)
				)}
				{campaignStaticUI.tokenSymbol}.</b
			>
			<br />

			<!-- // Referral Rewards -->
			{#if walletData.accumulatedRewards.toNumber() > 0 && (state === ProjectStatusUI.Funding || state === ProjectStatusUI.SuccessfulyFunded || state === ProjectStatusUI.Delivery)}
				• Your accumulated rewards due friend recommenations is: {ethers.utils.formatUnits(
					`${walletData.accumulatedRewards}`,
					BigNumber.from(campaignStaticUI.tokenDecimals)
				)}
				{campaignStaticUI.tokenSymbol}.
			{/if}

			<!-- // General project status -->
			{#if state === ProjectStatusUI.Failed || state === ProjectStatusUI.ServiceProviderDeclined}
				• You can withdrawl {ethers.utils.formatUnits(
					`${walletData.fundsInCrowdtainer}`,
					BigNumber.from(campaignStaticUI.tokenDecimals)
				)}
				{campaignStaticUI.tokenSymbol} from this campaign.
			{:else if state === ProjectStatusUI.SuccessfulyFunded}
				<p>• Waiting for service provider confirmation.</p>
			{:else if state === ProjectStatusUI.Delivery}
				{#if orderStatus === OrderStatus.WaitingForDeliveryAddress}
					<p>• Please proceed to <b>Checkout</b> to complete your order.</p>
				{:else if orderStatus === OrderStatus.DeliveryAddressReceived}
					<p>• Your order has been received and is being processed.</p>
				{/if}
			{/if}
		</p>
	{/if}
{/if}
