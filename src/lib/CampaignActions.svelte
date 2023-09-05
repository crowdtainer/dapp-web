<script lang="ts">
	import { ProjectStatusUI } from '$lib/Converters/CrowdtainerData';

	export let tokenId: number | undefined = undefined;
	export let vouchers721Address: string;
	export let crowdtainerAddress: string;
	export let projectStatusUI: ProjectStatusUI;
	export let tokenSymbol: string;
	export let walletData: WalletCrowdtainerModel | undefined;
	export const wallet: string | undefined = undefined;
	export let orderStatus: OrderStatus;

	import { createEventDispatcher } from 'svelte';

	import ModalDialog, {
		ModalAnimation,
		ModalIcon,
		ModalType,
		type ModalDialogData
	} from './ModalDialog.svelte';

	let modalDialog: ModalDialog;
	let transferWalletModalDialog: ModalDialog;

	import { claimFunds, claimRewards, leaveProject, transferToken } from './ethersCalls/rpcRequests';

	// Wallet management
	import { getSigner } from '$lib/Utils/wallet';
	import type { BigNumber } from 'ethers';
	import { OrderStatus } from './api';
	import type { WalletCrowdtainerModel } from './Model/WalletCrowdtainerModel.js';
	import { goto } from '$app/navigation';
	import { showToast } from './Toast/ToastStore.js';

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

	let transferWalletUserInput = '';

	let callLeaveProject = async () => {
		modalDialog.show({
			id: 'leaveCampaign',
			type: ModalType.ActionRequest,
			title: 'Leave campaign',
			body: 'Please confirm the transaction request in your mobile wallet.',
			animation: ModalAnimation.Circle2,
			icon: ModalIcon.DeviceMobile
		});

		let signResult = await leaveProject(getSigner(), vouchers721Address, crowdtainerAddress);

		if (signResult.isErr()) {
			modalDialog.show({
				id: 'leaveCampaignError',
				type: ModalType.ActionRequest,
				title: 'Transaction rejected',
				body: 'Your request to leave the project was not completed.',
				icon: ModalIcon.Exclamation
			});
			console.log(`Failure!? ${signResult.unwrapErr()}`);
			return;
		}

		showToast('You have successfully left the campaign.');

		modalDialog.close();
		userLeftCrowdtainer();
	};

	let callClaimFunds = async () => {
		modalDialog.show({
			id: 'leaveCampaignError',
			type: ModalType.ActionRequest,
			title: 'Claim funds',
			body: 'Please confirm the transaction request in your mobile wallet.',
			icon: ModalIcon.Exclamation
		});

		let signResult = await claimFunds(getSigner(), crowdtainerAddress);

		if (signResult.isErr()) {
			modalDialog.show({
				id: 'claimFundsTxRejected',
				type: ModalType.ActionRequest,
				title: 'Transaction rejected',
				body: 'Your request to leave the project was not completed.',
				icon: ModalIcon.Exclamation
			});
			console.log(`Failure!? ${signResult.unwrapErr()}`);
			return;
		}

		modalDialog.close();
		userClaimedFunds();
	};

	let showTransferDialog = async () => {
		transferWalletUserInput = '';
		transferWalletModalDialog.show({
			id: 'transferWallet',
			type: ModalType.DataInput,
			title: 'Transfer',
			body: 'Please enter the wallet address you would like to send the participation proof to:'
		});
	};

	let callClaimRewards = async () => {
		modalDialog.show({
			id: 'confirmClaimRewardsTx',
			type: ModalType.ActionRequest,
			title: 'Claim referral rewards',
			body: 'Please confirm the transaction request in your mobile wallet.',
			animation: ModalAnimation.Circle2
		});

		let signResult = await claimRewards(getSigner(), crowdtainerAddress);

		if (signResult.isErr()) {
			modalDialog.show({
				id: 'claimRewardsRejected',
				type: ModalType.ActionRequest,
				title: 'Transaction rejected',
				body: 'Your request to claim rewards was not completed.',
				icon: ModalIcon.Exclamation
			});

			console.log(`Failure!? ${signResult.unwrapErr()}`);
			return;
		}

		let confirmation = await signResult.unwrap().wait();
		modalDialog.close();

		if (confirmation.status === 1) {
			modalDialog.show({
				id: 'rewardsClaimResultDialog',
				type: ModalType.Information,
				title: 'Success',
				body: 'Rewards transfer complete.',
				icon: ModalIcon.Exclamation
			});
			console.log(`Transfer transaction hash: ${confirmation.transactionHash}`);
		} else {
			modalDialog.show({
				id: 'rewardsClaimResultDialog',
				type: ModalType.Information,
				title: 'Failure',
				body: 'Participation proof transfer Failed.',
				icon: ModalIcon.Exclamation
			});
		}
		modalDialog.showDialog();
	};

	let callTransferParticipationProof = async (targetWallet: string, tokenId: number) => {
		modalDialog.show({
			id: 'confirmTransferTx',
			type: ModalType.ActionRequest,
			title: 'Transfer participation proof to another wallet',
			body: 'Please confirm the transaction request in your mobile wallet.',
			animation: ModalAnimation.Circle2
		});

		// TODO: Check if ENS rsoluition is working
		let signResult = await transferToken(getSigner(), vouchers721Address, targetWallet, tokenId);

		if (signResult.isErr()) {
			modalDialog.show({
				id: 'transferRejected',
				title: 'Transaction rejected',
				type: ModalType.ActionRequest,
				body: 'Your request to transfer the participation proof was not completed.',
				icon: ModalIcon.Exclamation
			});

			console.log(`Failure!? ${signResult.unwrapErr()}`);
			return;
		}

		let confirmation = await signResult.unwrap().wait();

		let resultDialogData: ModalDialogData;
		if (confirmation.status === 1) {
			resultDialogData = {
				id: 'resultDialog',
				title: 'Success',
				type: ModalType.Information,
				body: 'Transfer complete.',
				icon: ModalIcon.BadgeCheck
			};
			console.log(`Transfer transaction hash: ${confirmation.transactionHash}`);
		} else {
			resultDialogData = {
				id: 'resultDialog',
				title: 'Failure',
				type: ModalType.Information,
				body: 'Participation proof transfer Failed.',
				icon: ModalIcon.Exclamation
			};
		}

		userTransferredParticipation(resultDialogData);
	};
</script>

<ModalDialog bind:this={modalDialog} />

<ModalDialog bind:this={transferWalletModalDialog}>
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

<div class="flex flex-wrap justify-center mt-2">
	<!-- Checkout -->
	{#if projectStatusUI === ProjectStatusUI.Delivery && orderStatus === OrderStatus.WaitingForDeliveryAddress}
		<div class="p-0.5 mb-2 m-2">
			<div
				class="tooltip tooltip-right sm:tooltip-top rounded shadow-lg p-1 text-red-500 mt-4"
				data-tip="Complete purchase by requesting your product delivery"
			>
				<button
					class="relative inline-flex items-center justify-center overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-teal-300 to-lime-300 group-hover:from-teal-300 group-hover:to-lime-300 focus:ring-4 focus:outline-none focus:ring-lime-200"
					on:click={() => {
						goto(`/Checkout?vouchers721Address=${vouchers721Address}&voucherId=${tokenId}`);
					}}
				>
					<span
						class="h-auto w-40 relative px-5 py-6 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-opacity-0"
					>
						<div class="flex justify-center items-center">
							<img width="30" height="30" src="images/site/Cart.svg" alt="Checkout" />
						</div>
						<p class="text-lg mt-5">Checkout</p>
					</span>
				</button>
			</div>
			<div />
		</div>

		<!-- Download Invoice -->
		<!-- temporarily disabled -->
		{#if false}
			<div class="p-0.5 mb-2 m-2 has-tooltip">
				<!-- <span class="tooltip rounded shadow-lg p-1 bg-gray-100 mt-40"> Download invoice </span> -->
				<button
					type="button"
					class="relative inline-flex items-center justify-center overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-teal-300 to-lime-300 group-hover:from-teal-300 group-hover:to-lime-300 focus:ring-4 focus:outline-none focus:ring-lime-200"
				>
					<span
						class="h-auto w-40 relative px-5 py-6 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-opacity-0"
					>
						<div class="flex justify-center items-center">
							<img width="30" height="30" src="images/site/Download.svg" alt="Download invoice" />
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
		<div class="p-0.5 mb-2 m-2">
			<div
				class="tooltip tooltip-right sm:tooltip-top rounded shadow-lg p-1 text-red-500 mt-4"
				data-tip="Transfer participation proof to another wallet"
			>
				<button
					class="relative inline-flex items-center justify-center overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-red-200 via-red-300 to-yellow-200 group-hover:from-red-200 group-hover:via-red-300 group-hover:to-yellow-200 focus:ring-4 focus:outline-none focus:ring-red-100"
					on:click={() => {
						showTransferDialog();
					}}
				>
					<span
						class="h-auto w-40 relative px-5 py-6 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-opacity-0"
					>
						<div class="flex justify-center items-center">
							<img
								width="30"
								height="30"
								src="images/site/Transfer.svg"
								alt="Transfer participation proof to another wallet"
							/>
						</div>
						<p class="text-lg mt-5">Transfer</p>
					</span>
				</button>
			</div>
		</div>
	{/if}

	{#if !walletData?.fundsInCrowdtainer.isZero() && walletData?.accumulatedRewards.isZero() && projectStatusUI === ProjectStatusUI.Funding}
		<!-- Leave button -->
		<div class="p-0.5 mb-2 m-2">
			<div
				class="tooltip tooltip-right sm:tooltip-top rounded shadow-lg p-1 text-red-500 mt-4"
				data-tip="Leave the campaign and get {tokenSymbol} back"
			>
				<button
					class="relative inline-flex items-center justify-center overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-pink-500 to-orange-400 group-hover:from-cyan-500 group-hover:to-blue-500 focus:ring-4 focus:outline-none focus:ring-red-400"
					on:click={callLeaveProject}
				>
					<span
						class="h-auto w-40 relative px-5 py-6 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-opacity-0"
					>
						<div class="flex justify-center items-center">
							<img width="30" height="30" src="images/site/Exit.svg" alt="Leave campaign" />
						</div>
						<p class="text-lg mt-5">Leave</p>
					</span>
				</button>
			</div>
			<div />
		</div>
	{/if}

	{#if !walletData?.fundsInCrowdtainer.isZero() && (projectStatusUI === ProjectStatusUI.Failed || projectStatusUI === ProjectStatusUI.ServiceProviderDeclined)}
		<!-- Get pre-payment back -->

		<div class="p-0.5 mb-2 m-2">
			<button
				class="relative inline-flex items-center justify-center overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-pink-500 to-orange-400 group-hover:from-cyan-500 group-hover:to-blue-500 focus:ring-4 focus:outline-none focus:ring-red-400"
				on:click={callClaimFunds}
			>
				<span
					class="h-auto w-40 relative px-5 py-6 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-opacity-0"
				>
					<div class="flex justify-center items-center">
						<img width="30" height="30" src="images/site/Exit.svg" alt="Leave campaign" />
					</div>
					<p class="text-lg mt-5">Withdraw {tokenSymbol}</p>
				</span>
			</button>
			<div />
		</div>
	{/if}

	<!-- Withdrawl referral rewards / cashback -->
	{#if !walletData?.accumulatedRewards.isZero() && (projectStatusUI === ProjectStatusUI.Delivery || projectStatusUI === ProjectStatusUI.SuccessfulyFunded) && tokenId !== undefined}
		<div class="p-0.5 mb-2 m-2">
			<div
				class="tooltip tooltip-right sm:tooltip-top rounded shadow-lg p-1 text-red-500 mt-4"
				data-tip="Withdraw referral rewards / cashback."
			>
				<button
					class="relative inline-flex items-center justify-center overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-teal-300 to-lime-300 group-hover:from-teal-300 group-hover:to-lime-300 focus:ring-4 focus:outline-none focus:ring-lime-200"
					on:click={() => {
						callClaimRewards();
					}}
				>
					<span
						class="h-auto w-40 relative px-5 py-6 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-opacity-0"
					>
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
