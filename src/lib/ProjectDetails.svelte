<script lang="ts">
	import { slide } from 'svelte/transition';
	import { shortenAddress } from './Utils/wallet';

	import { Icon } from '@steeze-ui/svelte-icon';
	import { Clipboard } from '@steeze-ui/heroicons';
	import { BigNumber } from 'ethers/lib/ethers.js';
	import { copyToClipBoardAndNotify } from './Utils/clipboard.js';
	import type { CrowdtainerStaticModel } from './Model/CrowdtainerModel.js';
	import { moneyFormatter } from '$lib/Utils/moneyFormatter.js';
	import type { UIFields } from './Converters/CrowdtainerData.js';
	import { projects } from '../routes/Data/projects.json';
	import { onMount } from 'svelte';

	export let vouchers721Address: string;
	export let crowdtainerId: number;
	export let campaignStaticData: CrowdtainerStaticModel;
	export let campaignStaticUI: UIFields;

	let visible: boolean;

	let chainId: number | undefined;

	function visibilityToggle() {
		visible = !visible;
	}

	$: discount = campaignStaticData.referralRate
		? BigNumber.from(campaignStaticData.referralRate).toNumber() / 2
		: BigNumber.from(0);

	onMount(() => {
		let projectData = projects.filter((project) => project.crowdtainerId === crowdtainerId);
		if (projectData.length !== 1) {
			console.warn('Unable to find project data');
			return;
		}
		chainId = projectData[0].chainId;
	});

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
			<table class="table-auto">
				<tr>
					<td>Network:</td>
					<td>
						<span class="inline-flex items-baseline">
							<span>{chainId} (chain id)</span>
						</span>
					</td>
				</tr>
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
								copyToClipBoardAndNotify('ERC-20 token addess', campaignStaticData.tokenAddress);
							}}
						>
							<span class="inline-flex items-baseline">
								<span>{shortenAddress(campaignStaticData.tokenAddress)} </span>
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
								<span> {discount} % off for referee.<br /> {discount}% cashback for referrer.</span>
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

				<!-- Dates -->
				<tr>
					<td>Start date:</td>
					<td>
						<span class="inline-flex items-baseline">
							<span>{campaignStaticUI.startDateString}</span>
						</span>
					</td>
				</tr>
				<tr>
					<td>End date:</td>
					<td>
						<span class="inline-flex items-baseline">
							<span>{campaignStaticUI.endDateString}</span>
						</span>
					</td>
				</tr>
			</table>
		</div>
	{/if}
</div>
