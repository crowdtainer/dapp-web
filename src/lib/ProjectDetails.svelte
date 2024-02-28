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

<div class="">
	<!-- <div class="flex justify-center"> -->
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
	<!-- </div> -->

	{#if visible}
		<div class="py-2">
			<div
				transition:slide|global={{ duration: 150 }}
				class="rounded-md border border-black dark:border-white p-2 mt-2 text-sm inline-block"
			>
				<table class="table-auto">
					<tr class="even:backdrop-brightness-75 class=pr-4">
						<td class="p-1">Network/ChainID:</td>
						<td class="pr-4">
							<span class="inline-flex items-baseline">
								<span>{chainId}</span>
							</span>
						</td>
					</tr>
					<tr class="even:backdrop-brightness-75">
						<td class="p-1">Vouchers721: </td>
						<td class="pr-4">
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

					<tr class="even:backdrop-brightness-75">
						<td class="p-1">Crowdtainer ID {crowdtainerId}: </td>
						<td class="pr-4">
							<button
								on:click={() => {
									copyToClipBoardAndNotify(
										'Crowdtainer address',
										campaignStaticData.contractAddress
									);
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

					<tr class="even:backdrop-brightness-75">
						<td class="p-1">Service provider: </td>
						<td class="pr-4">
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

					<tr class="even:backdrop-brightness-75">
						<td class="p-1">Minimum goal: </td>
						<td class="pr-4">
							<span class="inline-flex items-baseline">
								{moneyFormatter.format(Number(campaignStaticUI.minimum))}
								{campaignStaticData.tokenSymbol}
							</span>
						</td>
					</tr>

					<tr class="even:backdrop-brightness-75">
						<td class="p-1">Maximum goal (cap): </td>
						<td class="pr-4">
							<span class="inline-flex items-baseline">
								{moneyFormatter.format(Number(campaignStaticUI.maximum))}
								{campaignStaticData.tokenSymbol}
							</span>
						</td>
					</tr>

					<tr class="even:backdrop-brightness-75">
						<td class="p-1">Payment token: </td>
						<td class="pr-4">
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

					<tr class="even:backdrop-brightness-75">
						<td class="p-1">ERC20 decimals: </td>
						<td class="pr-4">
							<span>{campaignStaticData.tokenDecimals}</span>
						</td>
					</tr>

					<tr class="even:backdrop-brightness-75">
						<td class="p-1">Referral system: </td>
						<td class="pr-4">
							<span class="inline-flex items-baseline">
								{#if campaignStaticData.referralRate === undefined}
									<span> -- </span>
								{:else if discount > BigNumber.from(0)}
									<span>
										{discount}% off for referred person.<br />
										{discount}% cashback for referrer.</span
									>
								{:else}
									<span> disabled </span>
								{/if}
							</span>
						</td>
					</tr>

					<tr class="even:backdrop-brightness-75">
						<td class="p-1">Service provider signer:</td>
						<td class="pr-4">
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
					<tr class="even:backdrop-brightness-75">
						<td class="p-1">Start date:</td>
						<td class="pr-4">
							<span class="inline-flex items-baseline">
								<span>{campaignStaticUI.startDateString}</span>
							</span>
						</td>
					</tr>
					<tr class="even:backdrop-brightness-75">
						<td class="p-1">Countdown / End date:</td>
						<td>
							<span class="inline-flex items-baseline">
								<span>{campaignStaticUI.endDateString}</span>
							</span>
						</td>
					</tr>
					<!-- Terms and Conditions -->
					<tr class="even:backdrop-brightness-75">
						<td class="p-1">Terms and Conditions:</td>
						<td class="pr-4">
							<span class="inline-flex items-baseline max-w-48">
								{#if campaignStaticData.legalContractURI && campaignStaticData.legalContractURI != ''}
									<span>{campaignStaticData.legalContractURI}</span>
								{:else}
									<span>Unspecified</span>
								{/if}
							</span>
						</td>
					</tr>
				</table>
			</div>
		</div>
		<!-- <div class=''> -->
		<span class="text-sm inline-flex items-baseline m-4 max-w-xs"
			>The unique identifier is composed of the ChainID, Vouchers721 contract address, and
			CrowdtainerID.</span
		>
		<!-- </div> -->
	{/if}
</div>
