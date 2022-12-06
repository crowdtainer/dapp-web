<script lang="ts">
	import { ProjectStatusUI } from '$lib/Converters/CrowdtainerData';

	export let tokenId: number | undefined = undefined;
	export let vouchers721Address: string;
	export let crowdtainerAddress: string;
	export let projectStatusUI: ProjectStatusUI;
	export let tokenSymbol: string;
	export let userFundsInCrowdtainer: BigNumber;
	export const wallet: string | undefined = undefined;
	export let orderStatus: OrderStatus;

	import { createEventDispatcher } from 'svelte';

	import ModalDialog, {
		ModalAnimation,
		ModalIcon,
		ModalType,
		type ModalDialogData
	} from './ModalDialog.svelte';
	import { claimFunds, leaveProject, transferToken } from './ethersCalls/rpcRequests';

	// Wallet management
	import { getSigner } from '$lib/wallet';
	import type { BigNumber } from 'ethers';
	import { OrderStatus } from './api';

	const dispatch = createEventDispatcher();

	function userLeftCrowdtainer() {
		dispatch('userLeftCrowdtainerEvent', {
			text: `${crowdtainerAddress}`
		});
	}

	function userClaimedFunds() {
		dispatch('userClaimedFundsEvent', {
			text: `${crowdtainerAddress}`
		});
	}

	function userTransferredParticipation(dialogData: ModalDialogData) {
		dispatch('userTransferredParticipationEvent', dialogData);
	}

	// Modal Dialog
	let dialog: ModalDialogData = {
		type: ModalType.ActionRequest,
		title: '',
		body: '',
		animation: ModalAnimation.Circle2,
		visible: false,
		icon: ModalIcon.DeviceMobile
	};

	// Transfer to wallet dialog
	let transferWalletDialog: ModalDialogData = {
		type: ModalType.DataInput,
		title: 'Transfer',
		body: 'Please enter the wallet address you would like to send the participation proof to:',
		animation: ModalAnimation.None,
		visible: false,
		icon: ModalIcon.None
	};
	let transferWalletUserInput = '';

	let callLeaveProject = async () => {
		dialog.type = ModalType.ActionRequest;
		dialog.title = 'Leave campaign';
		dialog.body = 'Please confirm the transaction request in your mobile wallet.';
		dialog.animation = ModalAnimation.Circle2;
		dialog.visible = true;

		let signResult = await leaveProject(getSigner(), vouchers721Address, crowdtainerAddress);

		if (signResult.isErr()) {
			dialog.visible = true;
			dialog.title = 'Transaction rejected';
			dialog.body = 'Your request to leave the project was not completed.';
			dialog.animation = ModalAnimation.None;
			dialog.icon = ModalIcon.Exclamation;
			console.log(`Failure!? ${signResult.unwrapErr()}`);
			return;
		}

		dialog.visible = false;
		userLeftCrowdtainer();
	};

	let callClaimFunds = async () => {
		dialog.type = ModalType.ActionRequest;
		dialog.title = 'Claim funds';
		dialog.body = 'Please confirm the transaction request in your mobile wallet.';
		dialog.animation = ModalAnimation.Circle2;
		dialog.visible = true;

		let signResult = await claimFunds(getSigner(), crowdtainerAddress);

		if (signResult.isErr()) {
			dialog.visible = true;
			dialog.title = 'Transaction rejected';
			dialog.body = 'Your request to leave the project was not completed.';
			dialog.animation = ModalAnimation.None;
			dialog.icon = ModalIcon.Exclamation;
			console.log(`Failure!? ${signResult.unwrapErr()}`);
			return;
		}

		dialog.visible = false;
		userClaimedFunds();
	};

	let showTransferDialog = async () => {
		transferWalletUserInput = '';
		transferWalletDialog.visible = true;
	};

	let callTransferParticipationProof = async (targetWallet: string, tokenId: number) => {
		dialog.type = ModalType.ActionRequest;
		dialog.title = 'Transfer participation proof to another wallet';
		dialog.body = 'Please confirm the transaction request in your mobile wallet.';
		dialog.animation = ModalAnimation.Circle2;
		dialog.visible = true;

		// TODO: Check if ENS rsoluition is working
		let signResult = await transferToken(getSigner(), vouchers721Address, targetWallet, tokenId);

		if (signResult.isErr()) {
			dialog.visible = true;
			dialog.title = 'Transaction rejected';
			dialog.body = 'Your request to leave the project was not completed.';
			dialog.animation = ModalAnimation.None;
			dialog.icon = ModalIcon.Exclamation;
			console.log(`Failure!? ${signResult.unwrapErr()}`);
			return;
		}

		let confirmation = await signResult.unwrap().wait();

		let resultDialog: ModalDialogData = {
			type: ModalType.Information,
			visible: true,
			title: '',
			body: '',
			icon: ModalIcon.BadgeCheck,
			animation: ModalAnimation.None
		};

		if (confirmation.status === 1) {
			resultDialog.title = 'Success';
			resultDialog.body = `Transfer complete.`;
			console.log(`Transfer transaction hash: ${confirmation.transactionHash}`);
		} else {
			resultDialog.title = 'Failure';
			resultDialog.body = `Participation proof transfer Failed.`;
			resultDialog.icon = ModalIcon.Exclamation;
		}

		userTransferredParticipation(resultDialog);
	};
</script>

{#if dialog.visible}
	<ModalDialog modalDialogData={dialog} />
{/if}

{#if transferWalletDialog.visible}
	<ModalDialog modalDialogData={transferWalletDialog}>
		<label class="block my-2">
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
					transferWalletDialog.visible = false;
					transferWalletUserInput = '';
				}}
			>
				Cancel
			</button>
			<button
				type="button"
				class="sky-btn"
				on:click={async () => {
					transferWalletDialog.visible = false;
					if (tokenId !== undefined) {
						callTransferParticipationProof(transferWalletUserInput, tokenId);
					} else {
						console.log('Error: tokenId not specified');
					}
				}}
			>
				Transfer
			</button>
		</div>
	</ModalDialog>
{/if}

<div class="flex flex-wrap justify-center mt-2">
	<!-- Checkout -->
	{#if projectStatusUI === ProjectStatusUI.Delivery && orderStatus === OrderStatus.WaitingForDeliveryAddress}
		<div class="p-0.5 mb-2 m-2 has-tooltip">
			<span class="tooltip rounded shadow-lg p-1 bg-gray-100 mt-40 text-primary">
				Complete purchase by requesting your product delivery
			</span>
			<a href="/Checkout?vouchers721Address={vouchers721Address}&voucherId={tokenId}">
				<button
					type="button"
					class="relative inline-flex items-center justify-center overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-teal-300 to-lime-300 group-hover:from-teal-300 group-hover:to-lime-300  focus:ring-4 focus:outline-none focus:ring-lime-200"
					alt="Complete purchase by requesting your product delivery"
				>
					<span
						class="h-auto w-36 relative px-5 py-6 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-opacity-0"
					>
						<div class="flex justify-center items-center">
							<img width="30" height="30" src="Cart.svg" alt="Checkout" />
						</div>
						<p class="text-lg mt-5">Checkout</p>
					</span>
				</button>
			</a>
		</div>

		<!-- Download Invoice -->
		<!-- temporarily disabled -->
		{#if false}
			<div class="p-0.5 mb-2 m-2 has-tooltip">
				<!-- <span class="tooltip rounded shadow-lg p-1 bg-gray-100 mt-40"> Download invoice </span> -->
				<button
					type="button"
					class="relative inline-flex items-center justify-center overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-teal-300 to-lime-300 group-hover:from-teal-300 group-hover:to-lime-300  focus:ring-4 focus:outline-none focus:ring-lime-200"
					alt="Download invoice"
				>
					<span
						class="h-auto w-36 relative px-5 py-6 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-opacity-0"
					>
						<div class="flex justify-center items-center">
							<img width="30" height="30" src="Download.svg" alt="Download invoice" />
						</div>
						<p class="text-lg mt-5">Invoice</p>
					</span>
				</button>
				<div />
			</div>
		{/if}
	{/if}

	<!-- Transfer participation proof -->
	{#if projectStatusUI === ProjectStatusUI.Delivery && tokenId !== undefined && orderStatus === OrderStatus.WaitingForDeliveryAddress}
		<div class="p-0.5 mb-2 m-2 has-tooltip">
			<span class="tooltip rounded shadow-lg p-1 bg-gray-100 mt-40">
				Transfer participation proof to another wallet
			</span>
			<button
				class="relative inline-flex items-center justify-center overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-red-200 via-red-300 to-yellow-200 group-hover:from-red-200 group-hover:via-red-300 group-hover:to-yellow-200 focus:ring-4 focus:outline-none focus:ring-red-100"
				alt="Transfer participation proof (NFT) to another wallet"
				on:click={showTransferDialog}
			>
				<span
					class="h-auto w-36 relative px-5 py-6 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-opacity-0"
				>
					<div class="flex justify-center items-center">
						<img
							width="30"
							height="30"
							src="Transfer.svg"
							alt="Transfer participation proof to another wallet"
						/>
					</div>
					<p class="text-lg mt-5">Transfer</p>
				</span>
			</button>
		</div>
	{/if}

	{#if !userFundsInCrowdtainer.isZero() && projectStatusUI === ProjectStatusUI.Funding}
		<!-- Get pre-payment back -->
		<div class="p-0.5 mb-2 m-2 has-tooltip">
			<span class="tooltip rounded shadow-lg p-1 bg-gray-100 text-red-500 mt-40">
				Leave the campaign and get {tokenSymbol} back
			</span>
			<button
				class="relative inline-flex items-center justify-center overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-pink-500 to-orange-400 group-hover:from-cyan-500 group-hover:to-blue-500 focus:ring-4 focus:outline-none focus:ring-red-400"
				on:click={callLeaveProject}
			>
				<span
					class="h-auto w-36 relative px-5 py-6 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-opacity-0"
				>
					<div class="flex justify-center items-center">
						<img width="30" height="30" src="Exit.svg" alt="Leave campaign" />
					</div>
					<p class="text-lg mt-5">Leave</p>
				</span>
			</button>
			<div />
		</div>
	{/if}

	{#if !userFundsInCrowdtainer.isZero() && (projectStatusUI === ProjectStatusUI.Failed || projectStatusUI === ProjectStatusUI.ServiceProviderDeclined)}
		<!-- Get pre-payment back -->
		<div class="p-0.5 mb-2 m-2 has-tooltip">
			<span class="tooltip rounded shadow-lg p-1 bg-gray-100 text-red-500 mt-40">
				Withdrawl {tokenSymbol}
			</span>
			<button
				class="relative inline-flex items-center justify-center overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-pink-500 to-orange-400 group-hover:from-cyan-500 group-hover:to-blue-500 focus:ring-4 focus:outline-none focus:ring-red-400"
				on:click={callClaimFunds}
			>
				<span
					class="h-auto w-36 relative px-5 py-6 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-opacity-0"
				>
					<div class="flex justify-center items-center">
						<img width="30" height="30" src="Exit.svg" alt="Leave campaign" />
					</div>
					<p class="text-lg mt-5">Claim funds</p>
				</span>
			</button>
			<div />
		</div>
	{/if}
</div>
