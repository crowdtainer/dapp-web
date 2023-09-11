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
	export let orderStatus: OrderStatus | undefined;

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
		<div class="text-black dark:text-gray-200 text-md text-md text-left">
			<p class="mt-4">You have joined this project.</p>
			<div class="flex flex-justify mt-2 items-center">
				<p>Your contribution:</p>
				<div class="bg-green-200 dark:bg-green-900 rounded-md h-fit p-1 ml-2">
					<p class="text-green-800 dark:text-green-300 font-bold">
						{ethers.utils.formatUnits(
							`${walletData.fundsInCrowdtainer}`,
							BigNumber.from(campaignStaticUI.tokenDecimals)
						)}
						{campaignStaticUI.tokenSymbol}
					</p>
				</div>
				<p>.</p>
			</div>
		</div>
		<div class="flex flex-justify items-center text-black dark:text-gray-200 text-md text-left">
			<!-- // Referral Rewards -->
			{#if walletData.accumulatedRewards.toNumber() > 0 && (state === ProjectStatusUI.Funding || state === ProjectStatusUI.SuccessfulyFunded || state === ProjectStatusUI.Delivery)}
				<p>Friend recommenations rewards:</p>
				<div class="bg-green-200 dark:bg-green-900 rounded-md h-fit p-1 ml-2">
					<p class="text-green-800 dark:text-green-300 font-bold">
						{ethers.utils.formatUnits(
							`${walletData.accumulatedRewards}`,
							BigNumber.from(campaignStaticUI.tokenDecimals)
						)}
						{campaignStaticUI.tokenSymbol}
					</p>
				</div>
				<p>.</p>
			{/if}
		</div>

		<!-- // General project status -->
		<div class="items-center text-black dark:text-gray-200 text-md text-md text-left mt-4">
			{#if state === ProjectStatusUI.Failed || state === ProjectStatusUI.ServiceProviderDeclined}
				<div class="inline-flex items-center justify-center">
					<p>Next step:</p>
					• You can withdrawl {ethers.utils.formatUnits(
						`${walletData.fundsInCrowdtainer}`,
						BigNumber.from(campaignStaticUI.tokenDecimals)
					)}
					{campaignStaticUI.tokenSymbol} from this campaign.
				</div>
			{:else if state === ProjectStatusUI.SuccessfulyFunded}
				<p>• Next step: &nbsp;Waiting for service provider confirmation.</p>
			{:else if state === ProjectStatusUI.Delivery}
				{#if orderStatus !== undefined && orderStatus === OrderStatus.WaitingForDeliveryAddress}
					<p>• Next step: &nbsp;Please proceed to <b>Checkout</b> to complete your order.</p>
				{:else if orderStatus !== undefined && orderStatus === OrderStatus.DeliveryAddressReceived}
					<p>• Next step: &nbsp;Your order has been received and is being processed.</p>
				{/if}
			{/if}
		</div>
	{/if}
{/if}
