<script lang="ts">
	import type { UIFields } from './Converters/CrowdtainerData';
	import { ProjectStatusUI } from './Converters/CrowdtainerData';
	import { ethers } from 'ethers';
	import { OrderStatus } from './api';
	import type { WalletCrowdtainerModel } from './Model/WalletCrowdtainerModel.js';

	export let walletData: WalletCrowdtainerModel | undefined;

	export let campaignStaticUI: UIFields | undefined;
	export let state: ProjectStatusUI | undefined;
	export let orderStatus: OrderStatus | undefined;
</script>

{#if walletData !== undefined && campaignStaticUI !== undefined}
	{#if walletData.fundsInCrowdtainer > 0n}
		<div class="text-black dark:text-gray-200 text-md text-md text-left">
			<p class="mt-4">You have joined this project.</p>
			<div class="flex flex-justify mt-2 items-center">
				<p>Your contribution:</p>
				<div class="bg-green-200 dark:bg-green-900 rounded-md h-fit p-1 ml-2">
					<p class="text-green-800 dark:text-green-300 font-bold">
						{ethers.formatUnits(`${walletData.fundsInCrowdtainer}`, campaignStaticUI.tokenDecimals)}
						{campaignStaticUI.tokenSymbol}
					</p>
				</div>
				<p>.</p>
			</div>
		</div>
		<div class="flex flex-justify items-center text-black dark:text-gray-200 text-md text-left">
			<!-- // Referral Rewards -->
			{#if walletData.accumulatedRewards > 0n && (state === ProjectStatusUI.Funding || state === ProjectStatusUI.SuccessfulyFunded || state === ProjectStatusUI.Delivery)}
				<p>Friend recommenations rewards:</p>
				<div class="bg-green-200 dark:bg-green-900 rounded-md h-fit p-1 ml-2">
					<p class="text-green-800 dark:text-green-300 font-bold">
						{ethers.formatUnits(`${walletData.accumulatedRewards}`, campaignStaticUI.tokenDecimals)}
						{campaignStaticUI.tokenSymbol}
					</p>
				</div>
				<p>.</p>
			{/if}
		</div>
	{/if}

	<!-- // General project status -->
	<div class="items-center text-black dark:text-gray-200 text-md text-md text-left mt-4">
		{#if state === ProjectStatusUI.Failed || state === ProjectStatusUI.ServiceProviderDeclined}
			<div class="inline-flex items-center justify-center">
				<p>
					• Next step: &nbsp;You can withdraw {ethers.formatUnits(
						`${walletData.fundsInCrowdtainer}`,
						campaignStaticUI.tokenDecimals
					)}
					{campaignStaticUI.tokenSymbol} from this campaign.
				</p>
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
