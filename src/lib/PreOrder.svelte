<script lang="ts">
	export let campaignStaticUI: UIFields | undefined;
	export let crowdtainerId: number;
	export let crowdtainerAddress: string | undefined;
	export let vouchers721Address: string | undefined;

	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { blur } from 'svelte/transition';

	import { Circle2 } from 'svelte-loading-spinners';
	import { Icon, Check, ShieldCheck, InformationCircle, DeviceMobile } from 'svelte-hero-icons';

	import type { UIFields } from './Converters/CrowdtainerData';
	import Quantity from '$lib/Quantity.svelte';
	import { joinSelection } from '$lib/userStore';
	import { derived, type Readable } from 'svelte/store';
	import ProductQuantity from './ProductQuantity.svelte';

	// node rpc calls
	import { BigNumber } from 'ethers';
	import { joinProject } from '$lib/ethersCalls/rpcRequests';

	// API
	import {
		sendChallengeCodeAPI,
		requestEmailAuthorizationAPI,
		requestWalletAuthorizationAPI
	} from '$lib/api';

	// Terms and Conditions signing data
	import { signTermsAndConditions } from './Model/SignTerms';

	// Wallet management
	import { getSigner, wcProvider } from '$lib/wallet';
	import {
		walletState,
		accountAddress,
		connected,
		connect,
		disconnect,
		setupWallet,
		tearDownWallet,
		web3Provider
	} from '$lib/wallet';
	import { WalletType } from '$lib/walletStorage';
	import { validEmail } from './Validation/utils';

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

	let preOrderStep = JoinStep.FinalConfirmation;
	let alreadyJoined = false;

	let waitingForUser = false;
	let termsAccepted = false;
	let emailValidated = false;
	let deliveryAcknowledged = false;
	let termsAcknowledged = false;
	let userEmail: string = '';
	let userEmailCode: string = '';

	let emailSent: boolean;
	let invalidCodeWarning: boolean;
	let codeValidatorError: string;

	$: emailValid = validEmail(userEmail);

	$: stepTwoActive = preOrderStep >= JoinStep.EMailCheck ? 'step-primary' : '';
	$: stepThreeActive = preOrderStep >= JoinStep.TermsAcceptance ? 'step-primary' : '';
	$: stepFourActive = preOrderStep >= JoinStep.FinalConfirmation ? 'step-primary' : '';

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

	onMount(async () => {
		$joinSelection = $joinSelection;

		if (connected) {
			// TODO: Check if this wallet already joined, if yes: preOrderStep = 3;
		}
	});
</script>

<!-- Modal dialog -->
<input type="checkbox" id="my-modal-6" class="modal-toggle" />
<div class="modal {waitingForUser ? 'modal-open' : ''} modal-bottom sm:modal-middle">
	<div class="modal-box">
		<h3 class="font-bold text-lg">Terms and Conditions confirmation</h3>
		<div class="h-20 flex justify-center my-8">
			<div class="flex flex-row">
				{#if waitingForUser}
					<div transition:blur={{ duration: 450 }} class="basis-1/4">
						<Circle2 size="60" unit="px" />
					</div>
					<div class="flex justify-center">
						<Icon src={DeviceMobile} class="text-black m-2" size="36" />
					</div>
					<div transition:blur={{ duration: 450 }} class="basis-3/4">
						<p>Please confirm the signature request in your mobile wallet.</p>
					</div>
				{/if}
			</div>
		</div>
		<div class="flex justify-center">
			<button
				type="button"
				class="bg-red-700 text-white hover:bg-red-500 hover:shadow-lg px-16 mt-6 py-4 font-medium text-sm leading-tight uppercase rounded-xl shadow-md  focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg"
				on:click={async () => {
					waitingForUser = false;
				}}
			>
				Close
			</button>
		</div>
	</div>
</div>

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
						class="bg-sky-600 text-white hover:bg-sky-500 hover:shadow-lg px-16 mt-6 py-4 font-medium text-sm leading-tight uppercase rounded-xl shadow-md  focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg"
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
								on:click={async () => {
									emailSent = await sendChallengeCodeAPI(userEmail);
									setTimeout(function () {
										emailSent = false;
									}, 20000);
								}}
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

							<button
								class="btn btn-outline mx-2 w-28"
								on:click={async () => {
									codeValidatorError = await requestEmailAuthorizationAPI(userEmail, userEmailCode);
									emailValidated = codeValidatorError === 'OK';
									if (!emailValidated) {
										invalidCodeWarning = true;
										setTimeout(function () {
											invalidCodeWarning = false;
										}, 5000);
									}
								}}
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
								class="bg-sky-600 text-white hover:bg-sky-500 hover:shadow-lg px-16 mt-6 py-4 font-medium text-sm leading-tight uppercase rounded-xl shadow-md  focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg"
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
						class="{waitingForUser
							? 'hidden'
							: ''} bg-sky-600 text-white hover:bg-sky-500 hover:shadow-lg btn btn-outline mx-2  my-2 w-28"
						on:click={async () => {
							if (termsAccepted) {
								preOrderStep++;
								return;
							}

							waitingForUser = true;
							let signResult = await signTermsAndConditions(getSigner(), userEmail);
							if (signResult.isOk()) {
								let sigHash = signResult.unwrap();
								console.log(`Success: ${sigHash}`);

								let requestResult = await requestWalletAuthorizationAPI(
									$accountAddress,
									userEmail,
									sigHash
								);

								if (requestResult === 'OK') {
									termsAccepted = true;
								} else {
									console.log(`what went wrong? ${requestResult}`);
								}
							} else {
								console.log(`Failure!? ${signResult.unwrapErr()}`);
							}
							waitingForUser = false;
						}}
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

			<div class="flex justify-center">
				<button
					type="button"
					class="bg-sky-600 text-white hover:bg-sky-500 hover:shadow-lg px-16 mt-6 py-4 font-medium text-sm leading-tight uppercase rounded-xl shadow-md  focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg"
					on:click={async () => {
						// Finally make the call to smart contract's join() method.
						if (crowdtainerAddress && vouchers721Address) {
							let signer = getSigner();
							if (signer) {
								console.log('Signer exists.');
							}
							let joinSuccess = await joinProject(signer, vouchers721Address, crowdtainerAddress, $selection);
							if(joinSuccess) {
								preOrderStep++;
							} else {
								// TODO
							}
						} else {
							console.log('crowdtainerAddress || vouchers721Address missing!');
						}
					}}
				>
					Confirm & Join
				</button>
			</div>

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
			<p class="text-md text-md text-center mt-2">
				When the minimum funding is reached, you will be able to enter your delivery address here.
			</p>
		{/if}
	</div>
{/if}
