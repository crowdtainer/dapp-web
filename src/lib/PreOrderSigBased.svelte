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
	import ProductQuantity from './ProductQuantity.svelte';

	import ModalDialog, { ModalAnimation, ModalIcon, ModalType } from './ModalDialog.svelte';
	import type { ModalDialogData } from './ModalDialog.svelte';

	// Toast
	import { addToast, showWarningToast, type ToastData } from '$lib/Toast/ToastStore';
	import { MessageType } from './Toast/MessageType';
	let toast: ToastData;

	import { joinSelection } from '$lib/userStore';

	// node rpc calls
	import { BigNumber, ethers, type ContractReceipt } from 'ethers';

	// API
	import {
		sendChallengeCodeAPI,
		requestEmailAuthorizationAPI,
		requestWalletAuthorizationAPI,
		requestAuthorizationProof
	} from '$lib/api';

	// Terms and Conditions signing data
	import { makeAgreeToTermsMessage, signMessage } from './Model/SignTerms';

	// Wallet management
	import { getAccountAddress, getSigner, web3Provider } from '$lib/wallet';
	import { accountAddress, walletState, connected, connect } from '$lib/wallet';
	import { WalletType } from '$lib/walletStorage';
	import { validEmail } from './Validation/utils';
	import {
		checkAllowance,
		getERC20Contract,
		joinProjectWithSignature
	} from './ethersCalls/rpcRequests';
	import WalletBalances from './WalletBalances.svelte';
	import refreshWalletData from './WalletBalances.svelte';
	import type { IERC20 } from 'src/routes/typechain';
	import ConnectWallet from './ConnectWallet.svelte';

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
		EMailCheck,
		TermsAcceptance,
		FinalConfirmation,
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

	// Pre-order state
	let termsAccepted = false;
	let emailValidated = false;
	let deliveryAcknowledged = false;
	let shipmentConditions = false;
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
			if (userWalletAddress === undefined) {
				console.log(`Unable to get wallet signer address.`);
				return;
			}

			console.log(`userWalletAddress: ${userWalletAddress}`);

			let authorizationResult = await requestAuthorizationProof(
				userWalletAddress,
				crowdtainerAddress,
				$selection,
				false,
				'0x0000000000000000000000000000000000000000'
			);

			if (authorizationResult.isErr()) {
				console.log(`Error: ${authorizationResult.unwrapErr()}`);
				modalDialogData = {
					type: ModalType.ActionRequest,
					visible: true,
					title: 'Transaction rejected',
					body: `An error ocurred when joining the project: ${authorizationResult.unwrapErr()}`,
					icon: ModalIcon.Exclamation,
					animation: ModalAnimation.None
				};
				actionButtonEnabled = true;
				return;
			}

			let [calldata, signedPayload] = authorizationResult.unwrap();
			console.log(`Calldata: ${calldata}; \nsignedPayload: ${signedPayload}`);

			let crowdtainerExtraData = ethers.utils.defaultAbiCoder.encode(
				['address', 'uint256[4]', 'bool', 'address'],
				[userWalletAddress, $selection, false, '0x0000000000000000000000000000000000000000']
			);
			let extraData = ethers.utils.defaultAbiCoder.encode(
				['address', 'bytes4', 'bytes'],
				[crowdtainerAddress, ethers.utils.hexlify('0x566a2cc2'), crowdtainerExtraData]
			);

			let joinTransaction = await joinProjectWithSignature(
				getSigner(),
				vouchers721Address,
				crowdtainerAddress,
				signedPayload,
				extraData
			);

			if (joinTransaction.isErr()) {
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

				console.log(`${joinTransaction.unwrapErr()}`);
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
			modalDialogData.visible = true;
			return;
		}

		modalDialogData.body = `Waiting for transaction confirmation..`;
		modalDialogData.icon = ModalIcon.None;
		modalDialogData.animation = ModalAnimation.Diamonds;

		let receipt: ContractReceipt | undefined;
		let error: string = '';
		try {
			receipt = await permitApproveTx.wait();
		} catch (_error) {
			error = `${_error}`;
		}

		if (error !== '' || receipt === undefined || receipt.status === 0) {
			// tx failed
			let message = 'Transaction failed';
			if (error !== '') {
				message += `. Reason: ${error}`;
			} else {
				message += `.`;
			}
			modalDialogData.body = message;
			modalDialogData.icon = ModalIcon.Exclamation;
			modalDialogData.animation = ModalAnimation.None;
			modalDialogData.visible = true;
			return;
		}

		let checkAllowanceResult = await checkAllowance(
			String(accountAddress),
			erc20Contract,
			crowdtainerAddress,
			totalCostInERCUnits
		);

		if (checkAllowanceResult.isErr()) {
			modalDialogData.body = `Unable to authorize USDC spending.`;
			modalDialogData.visible = true;
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
		modalDialogData.body = 'Please read the message and confirm the signature request in your mobile wallet.';
		modalDialogData.animation = ModalAnimation.Circle2;
		modalDialogData.visible = true;

		let signer = getSigner();
		if (signer === undefined) {
			console.log('Error: signer undefined');
			return;
		}

		let account = $walletState.account;
		if (account === undefined) {
			console.log('Error: Wallet undefined');
			return;
		}

		console.log(account);

		// make sure address is check-summed; Some wallets don't use checksummed addresses (e.g. Metamask mobile)
		account = ethers.utils.getAddress(account);

		let message = makeAgreeToTermsMessage(userEmail, account);
		let signResult = await signMessage(signer, message);
		if (signResult.isOk()) {
			let [message, sigHash] = signResult.unwrap();
			let requestResult = await requestWalletAuthorizationAPI(userEmail, message, sigHash);

			let errorDescription: string = '';

			if (requestResult === 'OK') {
				termsAccepted = true;
			} else {
				try {
					let json = JSON.parse(requestResult);
					if(json.message) { errorDescription = json.message};
				} catch (error) {
					console.log(`Error parsing server error message.`);
				}
				console.log(`Error: ${requestResult}`);
				let message = 'An error ocurred while approving the signature';
				message = `${message}${(errorDescription !== '' ? `: ${errorDescription}` : `.`)}`;

				modalDialogData = {
					type: ModalType.ActionRequest,
					visible: true,
					title: 'Operation failed',
					body: message,
					icon: ModalIcon.Exclamation,
					animation: ModalAnimation.None
				};
				actionButtonEnabled = true;
				console.log(`what went wrong? ${requestResult}`);
				return;
			}
		} else {
			console.log(`Failure!? ${signResult.unwrapErr()}`);
		}

		modalDialogData.visible = false;
	};

	const callRequestEmailAuthorizationAPI = async () => {
		let result = await requestEmailAuthorizationAPI(userEmail, userEmailCode);
		emailValidated = result === 'OK';
		if (!emailValidated) {
			let jsonResult = JSON.parse(result);
			codeValidatorError = jsonResult.message;
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

{#if modalDialogData.visible}
	<ModalDialog {modalDialogData} />
{/if}

{#if $totalSum > 0}
	<div in:slide={{ duration: 150 }}>
		<ul class="w-full steps my-5 mb-10">
			<li class="step step-primary">Quantity</li>
			<li class="step {stepTwoActive}">E-mail</li>
			<li class="step {stepThreeActive}">Terms and Conditions</li>
			<li class="step {stepFourActive}">Confirmation</li>
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
						class="btn btn-primary px-12"
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
									: ''} input input-primary w-full max-w-xs dark:text-black"
							/>
							<button
								class="btn btn-outline mx-2 w-28 dark:text-white dark:disabled:text-gray-200"
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
									: ''} input input-bordered input-info w-full max-w-xs dark:text-black"
							/>

							<button
								class="btn btn-outline mx-2 w-28 dark:text-white dark:disabled:text-gray-200"
								on:click={callRequestEmailAuthorizationAPI}
							>
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
								class="btn btn-primary m-4 px-12"
								on:click={() => {
									preOrderStep++;
								}}>Next</button
							>
						</div>
					{/if}
					<div class="flex justify-center">
						<div class="text-md my-8 sm:w-full md:w-4/5 lg:w-4/6 xl:w-3/6">
							<div class="grid grid-flow-col auto-cols-max my-4">
								<div><Icon src={InformationCircle} class="text-green-700" size="24" /></div>
								<p class="px-2 text-md">Why?</p>
							</div>
							<ul class="list-disc mx-5">
								<li class="my-2">
									If the project is succesfully funded, we will send you an e-mail asking you to
									provide us your delivery address.
								</li>
								<li class="my-2">
									To avoid collecting personal data before knowing for sure we will need it, you do
									not need to provide us your delivery address at this stage (funding).
								</li>
								<li class="my-2">
									We will <b>never</b> use your e-mail or all personal data for purposes other than fulfilling
									our legal obligations.
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
			<div class="flex justify-center py-8">
				<button
					class="btn btn-outline dark:text-white"
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
							I understand that shipping is <b>only possible to Germany</b> at this time, and due the
							experimental nature of this project, delivery can take more than 30 days.
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
							<b>General Terms and Conditions</b>, <b>Privacy Policy</b>, <b>Refund policy</b>,
							<b>Shipping policy</b>, and that I am solely responsible in keeping my cryptographic
							private keys used to interact with this website safe.</span
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
						disabled={!deliveryAcknowledged || !termsAcknowledged || !shipmentConditions}
						class="{modalDialogData.visible ? 'hidden' : ''} btn btn-primary mx-2  my-2 w-28 "
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
					<div class="text-md my-4 sm:w-full md:w-4/5 lg:w-4/6 xl:w-3/6">
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
					class="btn btn-outline dark:text-white"
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
				<ConnectWallet />
			{/if}
			<div class="flex justify-center py-12">
				<button
					class="btn btn-outline dark:text-white"
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
