<script lang="ts">
	import { slide } from 'svelte/transition';
	import { shortenAddress } from './Utils/wallet';

	import { Icon } from '@steeze-ui/svelte-icon';
	import { Clipboard } from '@steeze-ui/heroicons';
	import { BigNumber } from 'ethers/lib/ethers.js';
	import { copyToClipBoardAndNotify } from './Utils/clipboard.js';
	import type { CrowdtainerStaticModel } from './Model/CrowdtainerModel.js';
	import { moneyFormatter } from '$lib/Utils/moneyFormatter.js';
	import { ethers } from 'ethers';
	import type { UIFields } from './Converters/CrowdtainerData.js';

	export let vouchers721Address: string;
	export let crowdtainerId: number;
	export let campaignStaticData: CrowdtainerStaticModel;
	export let campaignStaticUI: UIFields;

	let visible: boolean;

	function visibilityToggle() {
		visible = !visible;
	}

	$: discount = campaignStaticData.referralRate
		? BigNumber.from(campaignStaticData.referralRate).toNumber() / 2
		: BigNumber.from(0);
</script>

<div class="mb-4">
	<button
		on:click={() => {
			visibilityToggle();
		}}
		class=" w-auto"
	>
		{#if visible}
			⬇ Details
		{:else}
			➡ Details
		{/if}
	</button>

	{#if visible}
		<div
			transition:slide|global={{ duration: 150 }}
			class="border border-black dark:border-white p-2 mt-2 text-sm"
		>
			<p>Click any address to copy to clip-board.</p>
			<br />

			<table class="table-auto">
				<tr>
					<td class="pr-20"> Vouchers721: </td>
					<td>
						<button
							on:click={() => {
								copyToClipBoardAndNotify('Vouchers721 contract address', vouchers721Address);
							}}
						>
							<span class="inline-flex items-baseline">
								<span>
									{shortenAddress(vouchers721Address)}
								</span>
								<span
									><Icon
										src={Clipboard}
										class="text-black dark:text-white self-center ml-2"
										size="16"
									/></span
								>
							</span>
						</button>
					</td>
				</tr>

				<tr>
					<td>Crowdtainer ID: {crowdtainerId}</td>
					<td>
						<button
							on:click={() => {
								copyToClipBoardAndNotify('Crowdtainer address', campaignStaticData.contractAddress);
							}}
						>
							<span class="inline-flex items-baseline">
								{#if campaignStaticData.contractAddress !== undefined}
									<span>
										{shortenAddress(campaignStaticData.contractAddress)}
									</span>
									<span>
										<Icon
											src={Clipboard}
											class="text-black dark:text-white self-center ml-2"
											size="16"
										/>
									</span>
								{/if}
							</span>
						</button>
					</td>
				</tr>

				<tr>
					<td>Service provider: </td>
					<td>
						<button
							on:click={() => {
								copyToClipBoardAndNotify(
									'Service Provider address',
									campaignStaticData.serviceProvider
								);
							}}
						>
							<span class="inline-flex items-baseline">
								<span>{shortenAddress(campaignStaticData.serviceProvider)} </span>
								<span
									><Icon
										src={Clipboard}
										class="text-black dark:text-white self-center ml-2"
										size="16"
									/></span
								>
							</span>
						</button></td
					>
				</tr>

				<tr>
					<td>Minimum goal: </td>
					<td>
						<span class="inline-flex items-baseline">
							{moneyFormatter.format(Number(campaignStaticUI.minimum))}
							{campaignStaticData.tokenSymbol}
						</span>
					</td>
				</tr>

				<tr>
					<td>Maximum goal (cap): </td>
					<td>
						<span class="inline-flex items-baseline">
							{moneyFormatter.format(Number(campaignStaticUI.maximum))}
							{campaignStaticData.tokenSymbol}
						</span>
					</td>
				</tr>

				<tr>
					<td>Payment token: </td>
					<td>
						<button
							on:click={() => {
								copyToClipBoardAndNotify('ERC-20 token addess', campaignStaticData.token);
							}}
						>
							<span class="inline-flex items-baseline">
								<span>{shortenAddress(campaignStaticData.token)} </span>
								<span
									><Icon
										src={Clipboard}
										class="text-black dark:text-white self-center ml-2"
										size="16"
									/></span
								>
							</span>
						</button></td
					>
				</tr>

				<tr>
					<td>ERC20 decimals: </td>
					<td>
						<span>{campaignStaticData.tokenDecimals}</span>
					</td>
				</tr>

				<tr>
					<td>Referral system: </td>
					<td>
						<span class="inline-flex items-baseline">
							{#if campaignStaticData.referralRate === undefined}
								<span> -- </span>
							{:else if discount > BigNumber.from(0)}
								<span> {discount} % off for referee, {discount}% cashback for referrer.</span>
							{:else}
								<span> disabled </span>
							{/if}
						</span>
					</td>
				</tr>

				<tr>
					<td>Service provider signer:</td>
					<td>
						{#if campaignStaticData.signer === '0x0000000000000000000000000000000000000000'}
							<span> Offchain signature is not required to join this project.</span>
						{:else}
							<button
								on:click={() => {
									copyToClipBoardAndNotify('Signer address', campaignStaticData.signer);
								}}
							>
								<span class="inline-flex items-baseline">
									<span>{shortenAddress(campaignStaticData.signer)} </span>
									<span
										><Icon
											src={Clipboard}
											class="text-black dark:text-white self-center ml-2"
											size="16"
										/></span
									>
								</span>
							</button>
						{/if}
					</td>
				</tr>
			</table>
		</div>
	{/if}
</div>
