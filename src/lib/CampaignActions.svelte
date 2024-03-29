<script lang="ts">
	import { ProjectStatusUI } from '$lib/Converters/CrowdtainerData';
	import ModalDialog from './ModalDialog.svelte';

	import tippy from 'svelte-tippy';
	import 'tippy.js/dist/tippy.css'; // optional

	export let projectURL: string | undefined;
	export let title: string | undefined;
	export let tokenId: number | undefined;
	export let vouchers721Address: string;
	export let crowdtainerAddress: string;
	export let projectStatusUI: ProjectStatusUI;
	export let tokenSymbol: string;
	export let walletData: WalletCrowdtainerModel | undefined;
	export let wallet: string | undefined;
	export let orderStatus: OrderStatus;
	export let modalDialog: ModalDialog;

	let transferWalletModalDialog: ModalDialog;

	import CartImage from '$lib/images/site/Cart.svg';
	import TransferImage from '$lib/images/site/Transfer.svg';

	// Wallet management
	import { OrderStatus } from './api';
	import type { WalletCrowdtainerModel } from './Model/WalletCrowdtainerModel.js';
	import { goto } from '$app/navigation';
	import { createEventDispatcher } from 'svelte';

	// Action functions
	import {
		callClaimFunds,
		callClaimRewards,
		callLeaveProject,
		callTransferParticipationProof,
		showTransferDialog
	} from './CampaignActions.js';
	import { showToast } from './Toast/ToastStore.js';

	let transferWalletUserInput = '';

	const dispatch = createEventDispatcher();

	import ExitImage from '$lib/images/site/Exit.svg';

</script>

<ModalDialog bind:this={transferWalletModalDialog}>
	<label class="block mt-2">
		<span class="block text-sm font-medium text-slate-700">Wallet address or ENS name</span>
		<input
			type="text"
			bind:value={transferWalletUserInput}
			class="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
			  focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
			  invalid:border-pink-500 invalid:text-pink-600
			  focus:invalid:border-pink-500 focus:invalid:ring-pink-500
			"
		/>
	</label>
	<div class="flex justify-center gap-8">
		<button
			type="button"
			class="red-action-btn"
			on:click={async () => {
				transferWalletModalDialog.close();
				transferWalletUserInput = '';
			}}
		>
			Cancel
		</button>
		<button
			type="button"
			class="sky-btn"
			on:click={async () => {
				if (tokenId === undefined) {
					showToast('Error: No unique tokenId found for the connected wallet.');
					transferWalletModalDialog.close();
					return;
				}
				await callTransferParticipationProof(
					transferWalletUserInput,
					tokenId,
					vouchers721Address,
					modalDialog,
					function onUserTransferredParticipation(resultDialogData) {
						dispatch('userTransferredParticipationEvent', resultDialogData);
						transferWalletModalDialog.close();
					}
				);
			}}
		>
			Transfer
		</button>
	</div>
</ModalDialog>

<div class="flex flex-wrap justify-center mt-2">
	<!-- Checkout -->
	{#if projectStatusUI === ProjectStatusUI.Delivery && orderStatus === OrderStatus.WaitingForDeliveryAddress && tokenId !== undefined}
		<div class="p-0.5 mb-2 m-2">
			<div
				class="rounded shadow-lg p-1 text-red-500 mt-4"
			>
				<button
					class="relative inline-flex items-center justify-center overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-teal-300 to-lime-300 group-hover:from-teal-300 group-hover:to-lime-300 focus:ring-4 focus:outline-none focus:ring-lime-200"
					use:tippy={{
						content: `Complete purchase by requesting your product delivery.`,
						arrow: true,
					  }}
					on:click={() => {
						goto(
							`/Checkout?vouchers721Address=${vouchers721Address}&voucherId=${tokenId}&projectURL=${projectURL}&projectTitle=${
								title ? encodeURIComponent(title) : ''
							}`
						);
					}}
				>
					<span class="squared-btn">
						<div class="flex justify-center items-center">
							<img width="30" height="30" src={CartImage} alt="Checkout" />
						</div>
						<p class="text-lg mt-5">Checkout</p>
					</span>
				</button>
			</div>
			<div />
		</div>
	{/if}

	<!-- Transfer participation proof -->
	{#if projectStatusUI === ProjectStatusUI.Delivery && tokenId !== undefined && orderStatus === OrderStatus.WaitingForDeliveryAddress}
		<div class="p-0.5 mb-2 m-2">
			<div
				class="rounded shadow-lg p-1 text-red-500 mt-4"
			>
				<button
					class="relative inline-flex items-center justify-center overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-red-200 via-red-300 to-yellow-200 group-hover:from-red-200 group-hover:via-red-300 group-hover:to-yellow-200 focus:ring-4 focus:outline-none focus:ring-red-100"
					use:tippy={{
						content: `Transfer participation proof to another wallet.`,
						arrow: true,
					  }}
					on:click={() => {
						transferWalletUserInput = '';
						showTransferDialog(transferWalletModalDialog);
					}}
				>
					<span class="squared-btn">
						<div class="flex justify-center items-center">
							<img
								width="30"
								height="30"
								src={TransferImage}
								alt="Transfer participation proof to another wallet."
							/>
						</div>
						<p class="text-lg mt-5">Transfer</p>
					</span>
				</button>
			</div>
		</div>
	{/if}

	{#if walletData !== undefined && !walletData.fundsInCrowdtainer.isZero() && walletData.accumulatedRewards.isZero() && projectStatusUI === ProjectStatusUI.Funding}
		<!-- Leave button -->
		<div class="p-0.5 mb-2 m-2">
			<div
				class="rounded shadow-lg p-1 text-red-500 mt-4"
			>
				<button
					class="relative inline-flex items-center justify-center overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-pink-500 to-orange-400 group-hover:from-cyan-500 group-hover:to-blue-500 focus:ring-4 focus:outline-none focus:ring-red-400"
					use:tippy={{
						content: `Leave the campaign and get ${tokenSymbol} back`,
						arrow: true,
					  }}
					on:click={async () => {
						if (!wallet) {
							showToast('Wallet address not available.');
							return;
						}
						await callLeaveProject(
							wallet,
							vouchers721Address,
							crowdtainerAddress,
							modalDialog,
							function onUserLeftCrowdtainer(crowdtainerAddress) {
								dispatch('userLeftCrowdtainerEvent', {
									text: `${crowdtainerAddress}`
								});
							}
						);
					}}
				>
					<span class="squared-btn">
						<div class="flex justify-center items-center">
							<img width="30" height="30" src={ExitImage} alt="Leave campaign" />
						</div>
						<p class="text-lg mt-5">Leave</p>
					</span>
				</button>
			</div>
			<div />
		</div>
	{/if}

	{#if walletData !== undefined && !walletData.fundsInCrowdtainer.isZero() && (projectStatusUI === ProjectStatusUI.Failed || projectStatusUI === ProjectStatusUI.ServiceProviderDeclined)}
		<!-- Get pre-payment back -->

		<div class="p-0.5 mb-2 m-2">
			<button
				class="relative inline-flex items-center justify-center overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-pink-500 to-orange-400 group-hover:from-cyan-500 group-hover:to-blue-500 focus:ring-4 focus:outline-none focus:ring-red-400"
				on:click={() => {
					callClaimFunds(
						crowdtainerAddress,
						modalDialog,
						function onUserClaimedFunds(crowdtainerAddress) {
							dispatch('userClaimedFundsEvent', {
								text: `${crowdtainerAddress}`
							});
						}
					);
				}}
			>
				<span class="squared-btn">
					<div class="flex justify-center items-center">
						<img width="30" height="30" src={ExitImage} alt="Leave campaign" />
					</div>
					<p class="text-lg mt-5">Withdraw {tokenSymbol}</p>
				</span>
			</button>
			<div />
		</div>
	{/if}

	<!-- Withdrawl referral rewards / cashback -->
	{#if walletData !== undefined && !walletData.accumulatedRewards.isZero() && (projectStatusUI === ProjectStatusUI.Delivery || projectStatusUI === ProjectStatusUI.SuccessfulyFunded)}
		<div class="p-0.5 mb-2 m-2">
			<div
				class="rounded shadow-lg p-1 text-red-500 mt-4"
			>
				<button
					class="relative inline-flex items-center justify-center overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-teal-300 to-lime-300 group-hover:from-teal-300 group-hover:to-lime-300 focus:ring-4 focus:outline-none focus:ring-lime-200"
					use:tippy={{
						content: `Withdraw referral rewards / cashback.`,
						arrow: true,
					  }}
					on:click={() => {
						callClaimRewards(crowdtainerAddress, modalDialog);
					}}
				>
					<span class="squared-btn">
						<div class="flex justify-center items-center">
							<p class="text-4xl">💲</p>
						</div>
						<p class="text-lg mt-3">Claim rewards</p>
					</span>
				</button>
			</div>
		</div>
	{/if}
</div>
