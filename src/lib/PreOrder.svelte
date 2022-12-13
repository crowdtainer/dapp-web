<script lang="ts">
	export let campaignStaticUI: UIFields | undefined;
	export let crowdtainerId: number;
	export let vouchers721Address: string | undefined;
	export let crowdtainerAddress: string;

	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	import { Icon, Check, ShieldCheck } from 'svelte-hero-icons';

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	import type { UIFields } from './Converters/CrowdtainerData';
	import Quantity from '$lib/Quantity.svelte';
	import { derived, type Readable } from 'svelte/store';
	import ProductQuantity from './ProductQuantity.svelte';

	import ModalDialog, { ModalAnimation, ModalIcon, ModalType } from './ModalDialog.svelte';
	import type { ModalDialogData } from './ModalDialog.svelte';

	// Toast
	import { addToast, showWarningToast, type ToastData } from '$lib/Toast/ToastStore';
	import { MessageType } from './Toast/MessageType';
	let toast: ToastData;

	import { joinSelection } from '$lib/userStore';

	// node rpc calls
	import { BigNumber, errors, ethers } from 'ethers';

	// Pre-order state
	let termsAccepted = false;
	let deliveryAcknowledged = false;
	let shipmentConditions = false;
	let termsAcknowledged = false;

	// Wallet management
	import { getAccountAddress, getSigner } from '$lib/wallet';
	import { accountAddress, connected, connect } from '$lib/wallet';
	import { joinProject, checkAllowance, getERC20Contract } from './ethersCalls/rpcRequests';
	import WalletBalances from './WalletBalances.svelte';
	import refreshWalletData from './WalletBalances.svelte';
	import type { IERC20 } from 'src/routes/typechain';
	import ConnectWallet from '$lib/ConnectWallet.svelte';

	// User product selection
	$: productListLength = campaignStaticUI ? campaignStaticUI?.descriptions.length : 0;
	var selection: Readable<number[]> = derived(joinSelection, ($joinSelection) => {
		let storeSelection = $joinSelection.get(crowdtainerId);
		let noSelection = Array(productListLength).fill(0);
		if (storeSelection === undefined) {
			return noSelection;
		} else {
			return storeSelection;
		}
	});

	// TODO: Clear all state (except joinSelection) if wallet is disconnected

	enum JoinStep {
		QuantitySelection = 0,
		ThankYouMessage
	}

	let preOrderStep = JoinStep.QuantitySelection;

	let actionButtonEnabled = true;

	// Modal Dialog
	let modalDialogData: ModalDialogData = {
		visible: false,
		title: '',
		body: '',
		animation: ModalAnimation.Circle2,
		icon: ModalIcon.DeviceMobile,
		type: ModalType.ActionRequest
	};

	let permitApproveTx: undefined | ethers.ContractTransaction;

	$: $connected, refreshWalletData;

	// CrowdtainerId -> totalSum
	const totalSum: Readable<number> = derived(joinSelection, ($joinSelection) => {
		if (
			campaignStaticUI === undefined ||
			crowdtainerId === undefined ||
			campaignStaticUI.descriptions === undefined ||
			campaignStaticUI.prices === undefined
		) {
			return 0;
		}

		let totalSum = 0;
		let selection = $joinSelection.get(crowdtainerId);
		if (selection === undefined) {
			selection = new Array<number>(campaignStaticUI.descriptions.length).fill(0);
			return 0;
		}
		for (var i = 0; i < selection.length; i++) {
			totalSum += selection[i] * campaignStaticUI.prices[i];
		}
		return totalSum;
	});

	// UserStore
	$: totalCostInERCUnits =
		campaignStaticUI !== undefined
			? ethers.utils.parseUnits(`${$totalSum}`, campaignStaticUI.tokenDecimals)
			: BigNumber.from(0);

	onMount(async () => {
		$joinSelection = $joinSelection;

		if (connected) {
			// TODO: Check if this wallet already joined, if yes: preOrderStep = 3;
		}
	});

	function userJoinedCrowdtainer() {
		dispatch('userJoinedCrowdtainerEvent', {
			text: `${crowdtainerAddress}`
		});
	}

	const callJoinProject = async () => {
		let userWallet = getSigner();

		// Make the call to smart contract's join() method.
		if (crowdtainerAddress && vouchers721Address) {
			if (campaignStaticUI === undefined) {
				console.log('campaignStaticUI not fully loaded');
				return;
			}

			modalDialogData = {
				title: 'Join project',
				type: ModalType.ActionRequest,
				icon: ModalIcon.DeviceMobile,
				body: 'Please sign the transaction from your wallet.',
				animation: ModalAnimation.Circle2,
				visible: true
			};

			actionButtonEnabled = false;

			if (userWallet === undefined) {
				console.log('Error: Missing signer.');
				//TODO: UI error handling
				return;
			}

			let userWalletAddress = await userWallet.getAddress();
			console.log(`userWalletAddress: ${userWalletAddress}`);

			let joinTransaction = await joinProject(
				getSigner(),
				vouchers721Address,
				crowdtainerAddress,
				$selection
			);

			if (!joinTransaction.isOk()) {
				let errorString = joinTransaction.unwrapErr();
				let errorDescription =
					errorString.includes('Unknown') || errorString.includes('{}') || errorString.length === 0
						? ''
						: `\n\n Details: ${errorString}`;
				modalDialogData = {
					type: ModalType.ActionRequest,
					visible: true,
					title: 'Transaction rejected',
					body: `An error ocurred when joining the project. ${errorDescription}`,
					icon: ModalIcon.Exclamation,
					animation: ModalAnimation.None
				};

				console.log(`${errorString}`);
				actionButtonEnabled = true;
				return;
			}

			modalDialogData = {
				type: ModalType.ActionRequest,
				visible: true,
				title: 'Join project',
				body: 'Waiting for transaction confirmation..',
				icon: ModalIcon.None,
				animation: ModalAnimation.Diamonds
			};

			await joinTransaction.unwrap().wait();

			// TODO: check side-effects
			actionButtonEnabled = true;

			$joinSelection.set(crowdtainerId, []);

			preOrderStep++;
			userJoinedCrowdtainer();
		} else {
			console.log('crowdtainerAddress || vouchers721Address missing!');
		}
	};

	const callApproveSpending = async () => {
		let erc20ContractResult = await getERC20Contract(getSigner(), crowdtainerAddress);
		let erc20Contract: IERC20;

		if (erc20ContractResult.isErr()) {
			showWarningToast('Error connecting to ERC20 contract. Internet down?');
			console.log(erc20ContractResult.unwrapErr());
			return;
		} else {
			erc20Contract = erc20ContractResult.unwrap();
		}

		let accountAddress = await getAccountAddress();
		if (
			erc20Contract === undefined ||
			accountAddress === undefined ||
			crowdtainerAddress === undefined ||
			campaignStaticUI === undefined
		) {
			console.log('A required object is undefined');
			// TODO: Show UI dialog
			return;
		}

		modalDialogData = {
			type: ModalType.ActionRequest,
			visible: true,
			title: 'Wallet approval',
			body: `Please approve the spending of ${$totalSum} ${campaignStaticUI.tokenSymbol} to Crowdtainer from your wallet.`,
			icon: ModalIcon.None,
			animation: ModalAnimation.Circle2
		};

		actionButtonEnabled = false;

		try {
			permitApproveTx = await erc20Contract.approve(crowdtainerAddress, totalCostInERCUnits);
		} catch (error) {
			console.log(error);
			toast = {
				id: Math.floor(Math.random() * 10000),
				type: MessageType.Warning,
				dismissible: true,
				timeout: 7000,
				message: `Spending approval failed: request rejected.`
			};
			addToast(toast);
			actionButtonEnabled = true;
			modalDialogData.visible = false;
			return;
		}

		modalDialogData.body = `Waiting for transaction confirmation..`;
		modalDialogData.icon = ModalIcon.None;
		modalDialogData.animation = ModalAnimation.Diamonds;
		await permitApproveTx.wait();

		let checkAllowanceResult = await checkAllowance(
			String(accountAddress),
			erc20Contract,
			crowdtainerAddress,
			totalCostInERCUnits
		);

		if (checkAllowanceResult.isErr()) {
			modalDialogData.body = `Unable to authorize USDC spending.`;
			console.log(`${checkAllowanceResult.unwrapErr()}`);
		} else {
			await refreshWalletData;
			modalDialogData.visible = false;
		}

		actionButtonEnabled = true;
	};
</script>

{#if modalDialogData.visible}
	<ModalDialog {modalDialogData} />
{/if}

{#if $totalSum > 0}
	<div transition:slide={{ duration: 150 }}>
		{#if preOrderStep === JoinStep.QuantitySelection}
			{#if campaignStaticUI === undefined}
				<Quantity totalSum={$totalSum} />
			{:else}
				<Quantity tokenSymbol={campaignStaticUI.tokenSymbol} totalSum={$totalSum}>
					<ProductQuantity
						prices={campaignStaticUI.prices}
						descriptions={campaignStaticUI.descriptions}
						{crowdtainerId}
						tokenSymbol={campaignStaticUI.tokenSymbol}
					/>
				</Quantity>
			{/if}
			{#if $connected}
				<div class="flex justify-center gap-2 my-2">
					<div class="grid grid-flow-col auto-cols-max my-2">
						<div><Icon src={ShieldCheck} class="text-green-600" size="24" /></div>
						<p class="text-xs px-1 py-1">Connected to: <b>{$accountAddress}</b></p>
					</div>
				</div>

				<div class="flex justify-center">
					<label class="label cursor-pointer gap-3 my-4 sm:w-full md:w-4/5 lg:w-4/6 xl:w-3/6">
						<input
							type="checkbox"
							disabled={termsAccepted}
							bind:checked={deliveryAcknowledged}
							class="checkbox checkbox-primary"
						/>
						<span class="label-text dark:text-white"
							>I acknowledge that if the project is succesful, I need to return to this website to
							provide my delivery details.</span
						>
					</label>
				</div>

				<div class="flex justify-center">
					<label class="label cursor-pointer gap-3 my-4 sm:w-full md:w-4/5 lg:w-4/6 xl:w-3/6">
						<input
							type="checkbox"
							disabled={termsAccepted}
							bind:checked={shipmentConditions}
							class="checkbox checkbox-primary"
						/>
						<p class="label-text dark:text-white w-full">
							I understand that shipping is <b>only possible to Germany</b> at this time.
						</p>
					</label>
				</div>

				<div class="flex justify-center">
					<label class="label cursor-pointer gap-3 my-4 sm:w-full md:w-4/5 lg:w-4/6 xl:w-3/6">
						<input
							type="checkbox"
							disabled={termsAccepted}
							bind:checked={termsAcknowledged}
							class="checkbox checkbox-primary"
						/>
						<span class="label-text dark:text-white"
							>By clicking "Agree" and cryptographically signing the transaction, I agree to the
							<b>General Terms and Conditions</b>, <b>Privacy Policy</b>, <b>Refund policy</b>, and
							<b>Shipping policy</b>.</span
						>
					</label>
				</div>

				<div class="flex justify-center my-2">
					<div class="grid grid-flow-col auto-cols-max">
						{#if termsAccepted}
							<div><Icon src={Check} class="text-green-700" solid size="32" /></div>
							<div class="my-1">You accepted the terms and conditions. Click next to continue.</div>
						{/if}
					</div>
				</div>

				<div class="mb-8">
					<WalletBalances
						{crowdtainerAddress}
						tokenSymbol={campaignStaticUI?.tokenSymbol}
						totalSum={$totalSum}
						{totalCostInERCUnits}
						actionButtonEnabled={termsAcknowledged &&
							deliveryAcknowledged &&
							actionButtonEnabled &&
							shipmentConditions}
						callApproveSpendingHandler={callApproveSpending}
						callJoinProjectHandler={callJoinProject}
					/>
				</div>
			{:else}
				<ConnectWallet />
			{/if}
		{:else if preOrderStep === JoinStep.ThankYouMessage}
			<p class="text-md text-xl text-center">Thank you for joining this project!</p>
			<p class="text-md text-md text-center mt-6 mb-6">🎉</p>
		{/if}
	</div>
{/if}
