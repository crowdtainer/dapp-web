<script lang="ts">
	export let campaignStaticUI: UIFields | undefined;
	export let crowdtainerId: number;
	export let vouchers721Address: string | undefined;
	export let crowdtainerAddress: string;

	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	import { Icon, Check, ShieldCheck, InformationCircle } from 'svelte-hero-icons';

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	import type { UIFields } from './Converters/CrowdtainerData';
	import Quantity from '$lib/Quantity.svelte';
	import { derived, type Readable } from 'svelte/store';
	import type { UserStoreModel } from '$lib/Model/UserStoreModel';
	import ProductQuantity from './ProductQuantity.svelte';

	import ModalDialog, { ModalAnimation, ModalIcon, ModalType } from './ModalDialog.svelte';
	import type { ModalDialogData } from './ModalDialog.svelte';

	// Toast
	import { addToast, showWarningToast, type ToastData } from '$lib/Toast/ToastStore';
	import { MessageType } from './Toast/MessageType';
	let toast: ToastData;

	import { joinSelection } from '$lib/userStore';

	// node rpc calls
	import { BigNumber, ethers } from 'ethers';

	// API
	import {
		sendChallengeCodeAPI,
		requestEmailAuthorizationAPI,
		requestWalletAuthorizationAPI
	} from '$lib/api';

	// Terms and Conditions signing data
	import { signTermsAndConditions } from './Model/SignTerms';

	// Wallet management
	import { getAccountAddress, getSigner } from '$lib/wallet';
	import { accountAddress, connected, connect } from '$lib/wallet';
	import { WalletType } from '$lib/walletStorage';
	import { validEmail } from './Validation/utils';
	import { joinProject, checkAllowance, getERC20Contract } from './ethersCalls/rpcRequests';
	import WalletBalances from './WalletBalances.svelte';
	import refreshWalletData from "./WalletBalances.svelte"
	import type { IERC20 } from 'src/routes/typechain';

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

	// TODO: Clear all state if wallet is disconnected

	enum JoinStep {
		QuantitySelection = 0,
		EMailCheck,
		TermsAcceptance,
		FinalConfirmation,
		ThankYouMessage
	}

	let userStore: Readable<UserStoreModel> | undefined;

	let preOrderStep = JoinStep.QuantitySelection;
	let alreadyJoined = false;

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

	// Pre-order state
	let termsAccepted = false;
	let emailValidated = false;
	let deliveryAcknowledged = false;
	let termsAcknowledged = false;
	let userEmail: string = '';
	let userEmailCode: string = '';

	let emailSent: boolean;
	let invalidCodeWarning: boolean;
	let codeValidatorError: string;

	let permitApproveTx: undefined | ethers.ContractTransaction;

	$: emailValid = validEmail(userEmail);
	$: stepTwoActive = preOrderStep >= JoinStep.EMailCheck ? 'step-primary' : '';
	$: stepThreeActive = preOrderStep >= JoinStep.TermsAcceptance ? 'step-primary' : '';
	$: stepFourActive = preOrderStep >= JoinStep.FinalConfirmation ? 'step-primary' : '';

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

	$: enoughFunds =
		$userStore?.erc20Balance !== undefined && $userStore?.erc20Balance.lt(totalCostInERCUnits)
			? false
			: true;
	$: enoughAllowance =
		$userStore?.erc20Allowance !== undefined &&
		campaignStaticUI !== undefined &&
		$userStore?.erc20Allowance.lt(totalCostInERCUnits)
			? false
			: true;

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

			let joinTransaction = await joinProject(
				getSigner(),
				vouchers721Address,
				crowdtainerAddress,
				$selection
			);

			if (!joinTransaction.isOk()) {
				modalDialogData = {
					type: ModalType.ActionRequest,
					visible: true,
					title: 'Transaction rejected',
					body: 'An error ocurred when joining the project.',
					icon: ModalIcon.Exclamation,
					animation: ModalAnimation.None
				};

				// TODO: Add more information to the user once ethers.js can decode tx simulation revert errors.
				console.log(`${joinTransaction.unwrapErr()}`);
				actionButtonEnabled = true;
				return;
			}

			modalDialogData = {
				type: ModalType.ActionRequest,
				visible: true,
				title: 'Transaction rejected',
				body: 'Waiting for transaction confirmation..',
				icon: ModalIcon.None,
				animation: ModalAnimation.Diamonds
			};

			await joinTransaction.unwrap().wait();

			// TODO: check side-effect
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

		if(erc20ContractResult.isErr()) {
			showWarningToast("Error connecting to ERC20 contract. Internet down?");
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
			// TODO
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
			permitApproveTx = await erc20Contract.approve(
				crowdtainerAddress,
				totalCostInERCUnits
			);
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

	const callSignTermsAndConditions = async () => {
		if (termsAccepted) {
			preOrderStep++;
			return;
		}

		modalDialogData.type = ModalType.ActionRequest;
		modalDialogData.title = 'Terms and Conditions confirmation';
		modalDialogData.body = 'Please confirm the signature request in your mobile wallet.';
		modalDialogData.animation = ModalAnimation.Circle2;
		modalDialogData.visible = true;

		let signResult = await signTermsAndConditions(getSigner(), userEmail);
		if (signResult.isOk()) {
			let sigHash = signResult.unwrap();
			console.log(`Success: ${sigHash}`);

			let requestResult = await requestWalletAuthorizationAPI($accountAddress, userEmail, sigHash);

			if (requestResult === 'OK') {
				termsAccepted = true;
			} else {
				console.log(`what went wrong? ${requestResult}`);
			}
		} else {
			console.log(`Failure!? ${signResult.unwrapErr()}`);
		}

		modalDialogData.visible = false;
	};

	const callRequestEmailAuthorizationAPI = async () => {
		codeValidatorError = await requestEmailAuthorizationAPI(userEmail, userEmailCode);
		emailValidated = codeValidatorError === 'OK';
		if (!emailValidated) {
			invalidCodeWarning = true;
			setTimeout(function () {
				invalidCodeWarning = false;
			}, 5000);
		}
	};

	const callSendChallengeCodeAPI = async () => {
		emailSent = await sendChallengeCodeAPI(userEmail);
		setTimeout(function () {
			emailSent = false;
		}, 20000);
	};
</script>

<ModalDialog {modalDialogData} />

{#if $totalSum > 0 || alreadyJoined}
	<div transition:slide={{ duration: 150 }}>
		<ul class="w-full steps my-5 mb-10">
			<li class="step step-primary">Quantity</li>
			<li class="step {stepTwoActive}">E-mail</li>
			<li class="step {stepThreeActive}">Terms and Conditions</li>
			<li class="step {stepFourActive}">Confirmation & Delivery</li>
		</ul>

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
			<div class="flex justify-center mb-4">
				<div class="w-32">
					<button
						class="sky-btn"
						on:click={() => {
							preOrderStep++;
						}}>Next</button
					>
				</div>
			</div>
		{:else if preOrderStep === JoinStep.EMailCheck}
			<div class="flex justify-center">
				<div class="m-6">
					{#if !emailValidated}
						<p class="flex justify-center text-lg bold">Please verify your E-mail:</p>
						<br />
						<div class="flex justify-center">
							<input
								type="text"
								bind:value={userEmail}
								placeholder="E-mail"
								class="{emailValid
									? 'border-lime-600 border-2'
									: ''} input input-info w-full max-w-xs"
							/>
							<button
								class="btn btn-outline mx-2 w-28"
								disabled={!emailValid || emailSent}
								on:click={callSendChallengeCodeAPI}
							>
								{#if emailSent}
									<p in:slide={{ duration: 300 }}>Sent!</p>
								{:else}
									<p in:slide={{ duration: 300 }}>Send</p>
								{/if}
							</button>
						</div>
						<br />
						<div class="flex justify-center">
							<input
								type="text"
								bind:value={userEmailCode}
								placeholder={invalidCodeWarning ? 'Invalid code' : 'Confirmation code'}
								class="{invalidCodeWarning
									? 'border-red-500 border-2'
									: ''} input input-bordered input-info w-full max-w-xs"
							/>

							<button class="btn btn-outline mx-2 w-28" on:click={callRequestEmailAuthorizationAPI}>
								{#if invalidCodeWarning}
									{codeValidatorError}
								{:else}
									Verify
								{/if}
							</button>
						</div>
					{:else}
						<div class="flex justify-center">
							<p class="text-lg bold">E-mail validated!</p>
							<div><Icon src={Check} class="text-green-600" size="24" /></div>
						</div>
						<div class="flex justify-center">
							<button
								class="sky-btn"
								on:click={() => {
									preOrderStep++;
								}}>Next</button
							>
						</div>
					{/if}
					<div class="flex justify-center">
						<div class="text-md my-8 sm:w-full md:w-4/5 lg:w-4/6 xl:w-5/6">
							<div class="grid grid-flow-col auto-cols-max my-4">
								<div><Icon src={InformationCircle} class="text-green-700" size="24" /></div>
								<p class="px-2 text-md">Why?</p>
							</div>
							<ul class="list-disc mx-5">
								<li class="my-2">
									In case of a successful project, we are required by law to send our customers the
									invoice in a "durable medium".
								</li>
								<li class="my-2">
									To avoid collecting personal data before knowing for sure we will need it, you do
									not need to provide us your delivery address at this stage (funding).
								</li>
								<li class="my-2">
									If the project is succesfully funded, we will send you an e-mail asking you to
									provide us your delivery address.
								</li>
								<li class="my-2">
									We will <b>never</b> use your e-mail or any personal data for purposes other than fulfilling
									our legal obligations.
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
			<div class="flex justify-center py-8">
				<button
					class="btn btn-outline"
					on:click={() => {
						preOrderStep--;
					}}>Back</button
				>
			</div>
		{:else if preOrderStep === JoinStep.TermsAcceptance}
			{#if $connected}
				<div class="flex justify-center gap-2 my-2">
					<div class="grid grid-flow-col auto-cols-max my-2">
						<div><Icon src={ShieldCheck} class="text-green-600" size="24" /></div>
						<p class="text-xs px-1 py-1">Connected to: <b>{$accountAddress}</b></p>
					</div>
				</div>

				<div class="flex justify-center">
					<label class="label cursor-pointer gap-3 my-4 sm:w-full md:w-4/5 lg:w-4/6 xl:w-5/6">
						<input
							type="checkbox"
							disabled={termsAccepted}
							bind:checked={deliveryAcknowledged}
							class="checkbox checkbox-primary"
						/>
						<span class="label-text"
							>I acknowledge that if the project is succesful, I need to return to this website to
							provide my delivery details.</span
						>
					</label>
				</div>

				<div class="flex justify-center">
					<label class="label cursor-pointer gap-3 my-4 sm:w-full md:w-4/5 lg:w-4/6 xl:w-5/6">
						<input
							type="checkbox"
							disabled={termsAccepted}
							bind:checked={termsAcknowledged}
							class="checkbox checkbox-primary"
						/>
						<span class="label-text"
							>By clicking "Agree" and cryptographically signing the transaction, I agree to the
							General Terms and Conditions related to the usage of this webpage.</span
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

				<div class="flex justify-center">
					<button
						disabled={!deliveryAcknowledged || !termsAcknowledged}
						class="{modalDialogData.visible
							? 'hidden'
							: ''} bg-sky-600 text-white hover:bg-sky-500 hover:shadow-lg btn btn-outline mx-2  my-2 w-28"
						on:click={callSignTermsAndConditions}
					>
						{#if termsAccepted}
							Next
						{:else}
							Agree
						{/if}
					</button>
				</div>
			{:else}
				<p class="text-center mx-2 my-2">
					Please connect your wallet in order to sign the Terms and Conditions.
				</p>
				<br />

				<div class="flex justify-center ">
					<button
						class="btn btn-outline"
						on:click={() => {
							connect(WalletType.WalletConnect);
						}}
					>
						Connect Wallet
					</button>
				</div>

				<div class="flex justify-center">
					<div class="text-md my-4 sm:w-full md:w-4/5 lg:w-4/6 xl:w-5/6">
						<div class="text-md my-4  mx-4">
							<div class="grid grid-flow-col auto-cols-max my-4">
								<div><Icon src={InformationCircle} class="text-green-700" size="24" /></div>
								<p class="px-2 text-md">Tips</p>
							</div>
							<ul class="list-disc mx-5">
								<li class="my-2">For privacy reasons, we recommend using a brand new wallet.</li>
								<li class="my-2">
									We are working on solutions to unlink the funding wallet from the participation
									proof. Stay tuned!
								</li>
							</ul>
						</div>
					</div>
				</div>
			{/if}

			<div class="flex justify-center py-16">
				<button
					class="btn btn-outline"
					on:click={() => {
						preOrderStep--;
					}}>Back</button
				>
			</div>
		{:else if preOrderStep === JoinStep.FinalConfirmation}
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

			{#if $connected && campaignStaticUI !== undefined && crowdtainerAddress !== undefined}
				<WalletBalances
					{crowdtainerAddress}
					tokenSymbol={campaignStaticUI?.tokenSymbol}
					totalSum={$totalSum}
					{totalCostInERCUnits}
					{actionButtonEnabled}
					callApproveSpendingHandler={callApproveSpending}
					callJoinProjectHandler={callJoinProject}
				/>
			{:else}
				<p class="text-center mx-2 my-2">
					Please connect your wallet in order to join the project.
				</p>
				<br />

				<div class="flex justify-center ">
					<button
						class="btn btn-outline"
						on:click={() => {
							connect(WalletType.WalletConnect);
						}}
					>
						Connect Wallet
					</button>
				</div>
			{/if}
			<div class="flex justify-center py-12">
				<button
					class="btn btn-outline"
					on:click={() => {
						preOrderStep--;
					}}>Back</button
				>
			</div>
		{:else if preOrderStep === JoinStep.ThankYouMessage}
			<p class="text-md text-xl text-center">Thank you for joining this project!</p>
			<p class="text-md text-md text-center mt-6 mb-6">🎉</p>
		{/if}
	</div>
{/if}
