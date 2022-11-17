<script lang="ts">
	import { ProjectStatusUI } from '$lib/Converters/CrowdtainerData';

	export let vouchers721Address: string;
	export let crowdtainerAddress: string;
	export let projectStatusUI: ProjectStatusUI;
	export let tokenSymbol: string;
	export const wallet: string | undefined = undefined;

	import { createEventDispatcher } from 'svelte';

	import ModalDialog, {
		ModalAnimation,
		ModalIcon,
		ModalType,
		type ModalDialogData
	} from './ModalDialog.svelte';
	import { leaveProject } from './ethersCalls/rpcRequests';

	// Wallet management
	import { getSigner } from '$lib/wallet';

	const dispatch = createEventDispatcher();

	function userLeftCrowdtainer() {
		dispatch('userLeftCrowdtainerEvent', {
			text: `${crowdtainerAddress}`
		});
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

		userLeftCrowdtainer();
	};

	let callClaimFunds = async () => {
		// TODO
	}

</script>

<slot>
	<ModalDialog modalDialogData={dialog} />

	<div class="flex flex-wrap justify-center mt-2">
		<!-- Checkout -->
		{#if projectStatusUI === ProjectStatusUI.Delivery}
			<div class="p-0.5 mb-2 m-2 has-tooltip">
				<span class="tooltip rounded shadow-lg p-1 bg-gray-100 mt-40">
					Complete purchase by requesting your product delivery
				</span>
				<button
					type="button"
					class="relative inline-flex items-center justify-center overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-teal-300 to-lime-300 group-hover:from-teal-300 group-hover:to-lime-300  focus:ring-4 focus:outline-none focus:ring-lime-200"
					alt="Complete purchase by requesting your product delivery"
					on:click={userLeftCrowdtainer}
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
			</div>

			<!-- Download Invoice -->
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

		<!-- Transfer participation proof -->
		{#if projectStatusUI === ProjectStatusUI.Delivery}
			<div class="p-0.5 mb-2 m-2 has-tooltip">
				<span class="tooltip rounded shadow-lg p-1 bg-gray-100 mt-40">
					Transfer participation proof to another wallet
				</span>
				<button
					class="relative inline-flex items-center justify-center overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-red-200 via-red-300 to-yellow-200 group-hover:from-red-200 group-hover:via-red-300 group-hover:to-yellow-200 focus:ring-4 focus:outline-none focus:ring-red-100"
					alt="Transfer participation proof (NFT) to another wallet"
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

		{#if projectStatusUI === ProjectStatusUI.Funding}
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

		{#if projectStatusUI === ProjectStatusUI.Failed || projectStatusUI === ProjectStatusUI.ServiceProviderDeclined}
			<!-- Get pre-payment back -->
			<div class="p-0.5 mb-2 m-2 has-tooltip">
				<span class="tooltip rounded shadow-lg p-1 bg-gray-100 text-red-500 mt-40">
					Withdrawl {tokenSymbol} back
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
</slot>
