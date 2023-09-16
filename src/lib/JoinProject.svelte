<script lang="ts">
	export let campaignStaticUI: UIFields;
	export let crowdtainerId: number;
	export let vouchers721Address: string | undefined;
	export let crowdtainerAddress: string;
	export let basePriceDenominator: number[];
	export let basePriceUnit: string;
	export let referralRate: BigNumber | undefined;
	// export let splitSelectionBy: SplitSelection[];

	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	import { shortenAddress } from './Utils/wallet';
	import type { UIFields } from './Converters/CrowdtainerData';
	import Quantity from '$lib/Quantity.svelte';
	import { derived, type Readable } from 'svelte/store';
	import ProductQuantity from './ProductQuantity.svelte';

	import { ModalAnimation, ModalIcon, ModalType } from './ModalDialog.svelte';
	import ModalDialog from '$lib/ModalDialog.svelte';

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	import { joinSelection } from '$lib/Stores/userStore';

	// node rpc calls
	import { BigNumber, ethers } from 'ethers';

	// Wallet management
	import { getSigner } from '$lib/Utils/wallet';
	import { connected } from '$lib/Utils/wallet';

	import { isReferralEnabledForAddress } from './ethersCalls/rpcRequests';
	import refreshWalletData from './JoinProject.svelte';
	import ConnectWallet from './ConnectWallet.svelte';
	import EmailCheck from './JoinSteps/EmailCheck.svelte';
	import TermsAndConditions from './JoinSteps/TermsAndConditions.svelte';
	import JoinProjectButton from './JoinProjectButton.svelte';

	let modalDialog: ModalDialog;

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

	let validUserCouponCode = '';
	let referralCheckBoxActivated = true;

	// Pre-order state
	let emailVerificationRequired = true;
	let userVerifiedEmail = '';
	let termsAccepted = false;

	$: stepTwoActive = preOrderStep >= JoinStep.EMailCheck ? 'step-primary' : '';
	$: stepThreeActive = preOrderStep >= JoinStep.TermsAcceptance ? 'step-primary' : '';
	$: stepFourActive = preOrderStep >= JoinStep.FinalConfirmation ? 'step-primary' : '';

	$: $connected, refreshWalletData;
	$: projectHasSigner =
		campaignStaticUI.signer === '0x0000000000000000000000000000000000000000' ? false : true;

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

	$: referralEnabled = referralRate !== undefined && BigNumber.from(referralRate).toNumber() > 0;
	$: ratePercentage = referralEnabled ? BigNumber.from(referralRate).toNumber() / 2 : 0;
	$: discountValue =
		ratePercentage > 0 && validUserCouponCode !== '' ? $totalSum * (ratePercentage / 100) : 0;

	// UserStore
	$: totalCostInERCUnits =
		campaignStaticUI !== undefined && $totalSum !== undefined && !isNaN($totalSum)
			? ethers.utils.parseUnits(`${$totalSum - discountValue}`, campaignStaticUI.tokenDecimals)
			: BigNumber.from(0);

	onMount(async () => {
		$joinSelection = $joinSelection;

		if (connected) {
			// TODO: Check if this wallet already joined, if yes: preOrderStep = 3;
		}
	});

	async function handleUserAppliedCouponEvent(event: CustomEvent) {
		console.log(`Detected event of type: ${event.type} : detail: ${event.detail.text}`);
		let couponCode = event.detail.text as string;

		validUserCouponCode = '';

		if (!ethers.utils.isAddress(couponCode)) {
			// TODO: Support ENS resolution and short coupon codes
			modalDialog.show({
				id: 'invalidReferralAddress',
				title: 'Referral address / coupon code',
				type: ModalType.Information,
				icon: ModalIcon.Exclamation,
				body: 'The given code is not a valid ethereum address.',
				animation: ModalAnimation.None
			});
			return;
		}

		let userWallet = getSigner();
		if (userWallet === undefined) {
			modalDialog.show({
				id: 'missingSigner',
				title: 'Referral address / coupon code',
				type: ModalType.Information,
				icon: ModalIcon.Exclamation,
				body: 'Error with wallet connection: missing signer.',
				animation: ModalAnimation.None
			});
			return;
		}

		let referralEnabledResult = await isReferralEnabledForAddress(
			userWallet,
			crowdtainerAddress,
			couponCode
		);

		if (referralEnabledResult.isErr()) {
			modalDialog.show({
				id: 'referralAddressCheckError',
				title: 'Referral address / coupon code',
				type: ModalType.Information,
				icon: ModalIcon.Exclamation,
				body: referralEnabledResult.unwrapErr(),
				animation: ModalAnimation.None
			});
			return;
		}

		let referralEnabled = referralEnabledResult.unwrap();

		if (!referralEnabled) {
			modalDialog.show({
				id: 'referralAddressError',
				title: 'Referral address / coupon code',
				type: ModalType.Information,
				icon: ModalIcon.Exclamation,
				body: `The provided wallet (${shortenAddress(
					couponCode
				)}) either didn't join this campaign or didn't enable referrals.`,
				animation: ModalAnimation.None
			});
			return;
		}
		validUserCouponCode = couponCode;
	}

	async function handleRemovedAppliedCouponEvent(event: CustomEvent) {
		console.log(`Detected event of type: ${event.type} : detail: ${event.detail.text}`);
		// let couponCode = event.detail.text as string;
		validUserCouponCode = '';
	}

	function userJoinedCrowdtainer() {
		dispatch('userJoinedCrowdtainerEvent', {
			text: `${crowdtainerAddress}`
		});
	}
</script>

<ModalDialog bind:this={modalDialog} />

{#if campaignStaticUI}
	{#if $totalSum > 0 && projectHasSigner}
		<div in:slide|global={{ duration: 150 }}>
			<ul class="w-full steps my-5 mb-10">
				<li class="step step-primary">Quantity</li>
				<li class="step {stepTwoActive}">E-mail</li>
				<li class="step {stepThreeActive}">Terms and Conditions</li>
				<li class="step {stepFourActive}">Confirmation</li>
			</ul>

			{#if preOrderStep === JoinStep.QuantitySelection}
				<Quantity
					tokenSymbol={campaignStaticUI.tokenSymbol}
					totalSum={$totalSum}
					{ratePercentage}
					{referralEnabled}
					{discountValue}
					{validUserCouponCode}
					on:userAppliedCouponEvent={handleUserAppliedCouponEvent}
					on:userRemovedCouponEvent={handleRemovedAppliedCouponEvent}
				>
					<ProductQuantity
						prices={campaignStaticUI.prices}
						descriptions={campaignStaticUI.descriptions}
						{crowdtainerId}
						tokenSymbol={campaignStaticUI.tokenSymbol}
						{basePriceDenominator}
						{basePriceUnit}
					/>
				</Quantity>
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
				<EmailCheck
					{emailVerificationRequired}
					nextClicked={(verifiedEmail) => {
						if (verifiedEmail) {
							userVerifiedEmail = verifiedEmail;
						}
						emailVerificationRequired = false;
						preOrderStep++;
					}}
				/>
				<div class="flex justify-center py-8">
					<button
						class="btn btn-outline dark:text-white"
						on:click={() => {
							preOrderStep--;
						}}>Back</button
					>
				</div>
			{:else if preOrderStep === JoinStep.TermsAcceptance}
				<TermsAndConditions
					acceptanceRequired={!termsAccepted}
					termsAcceptanceSuccess={() => {
						preOrderStep++;
						termsAccepted = true;
					}}
					{modalDialog}
					userEmail={userVerifiedEmail}
				/>
				<div class="flex justify-center py-16">
					<button
						class="btn btn-outline dark:text-white"
						on:click={() => {
							preOrderStep--;
						}}>Back</button
					>
				</div>
			{:else if preOrderStep === JoinStep.FinalConfirmation}
				<Quantity
					tokenSymbol={campaignStaticUI.tokenSymbol}
					totalSum={$totalSum}
					{ratePercentage}
					{referralEnabled}
					{discountValue}
					{validUserCouponCode}
					on:userAppliedCouponEvent={handleUserAppliedCouponEvent}
					on:userRemovedCouponEvent={handleRemovedAppliedCouponEvent}
				>
					<ProductQuantity
						prices={campaignStaticUI.prices}
						descriptions={campaignStaticUI.descriptions}
						{crowdtainerId}
						tokenSymbol={campaignStaticUI.tokenSymbol}
						{basePriceDenominator}
						{basePriceUnit}
					/>
				</Quantity>

				<div class="flex justify-center my-4">
					<div class="max-w-xs">
						<div class="grid grid-flow-col auto-cols-1">
							<div class="form-control">
								<label class="label cursor-pointer">
									<input
										type="checkbox"
										bind:checked={referralCheckBoxActivated}
										class="checkbox checkbox-success"
									/>
									<span class="ml-4">Enable referral program for my wallet.</span>
								</label>
							</div>
						</div>
					</div>
				</div>

				{#if $connected && crowdtainerId && crowdtainerAddress && vouchers721Address}
					<JoinProjectButton
						{crowdtainerId}
						{crowdtainerAddress}
						{vouchers721Address}
						tokenSymbol={campaignStaticUI.tokenSymbol}
						totalSum={$totalSum}
						tokenDecimals={campaignStaticUI.tokenDecimals}
						{totalCostInERCUnits}
						{discountValue}
						{validUserCouponCode}
						{referralCheckBoxActivated}
						{actionButtonEnabled}
						productListLength={campaignStaticUI ? campaignStaticUI?.descriptions.length : 0}
						{modalDialog}
						userJoinedSuccess={() => {
							userJoinedCrowdtainer();
							preOrderStep++;
						}}
						withSignature={projectHasSigner}
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
	{:else if $totalSum > 0 && !projectHasSigner}
		<Quantity
			tokenSymbol={campaignStaticUI.tokenSymbol}
			totalSum={$totalSum}
			{ratePercentage}
			{referralEnabled}
			{discountValue}
			{validUserCouponCode}
			on:userAppliedCouponEvent={handleUserAppliedCouponEvent}
			on:userRemovedCouponEvent={handleRemovedAppliedCouponEvent}
		>
			<ProductQuantity
				prices={campaignStaticUI.prices}
				descriptions={campaignStaticUI.descriptions}
				{crowdtainerId}
				tokenSymbol={campaignStaticUI.tokenSymbol}
				{basePriceDenominator}
				{basePriceUnit}
			/>
		</Quantity>

		<div class="flex justify-center">
			<div class="max-w-xl mx-10">
				<p class="text-center text-lg pb-4">By clicking "Confirm and Join" I acknowledge that:</p>
				<ul class="list-disc">
					<li>
						If the project is succesful, I need to return to this website to provide my delivery
						details.
					</li>
					<li>
						I am aware that Ethereum network fees will apply to prepare the payment and in case I
						want to leave a campaign. Those fees are paid to 3rd parties and are not re-payable by
						us in case of my withdrawal from the purchase.
					</li>
					<li>
						I agree to the <a
							target="_blank"
							href="/Legal/Terms"
							rel="noopener"
							class="text-secondary"><b>General Terms and Conditions 📚</b></a
						>.
					</li>
				</ul>
			</div>
		</div>

		<div class="flex justify-center my-4">
			<div class="max-w-xs">
				<div class="grid grid-flow-col auto-cols-1">
					<div class="form-control">
						<label class="label cursor-pointer">
							<input
								type="checkbox"
								bind:checked={referralCheckBoxActivated}
								class="checkbox checkbox-success"
							/>
							<span class="ml-4">Enable referral program for my wallet.</span>
						</label>
					</div>
				</div>
			</div>
		</div>

		{#if $connected && crowdtainerId && crowdtainerAddress && vouchers721Address}
			<JoinProjectButton
				{crowdtainerId}
				{crowdtainerAddress}
				{vouchers721Address}
				tokenSymbol={campaignStaticUI.tokenSymbol}
				totalSum={$totalSum}
				tokenDecimals={campaignStaticUI.tokenDecimals}
				{totalCostInERCUnits}
				{discountValue}
				{validUserCouponCode}
				{referralCheckBoxActivated}
				{actionButtonEnabled}
				productListLength={campaignStaticUI ? campaignStaticUI?.descriptions.length : 0}
				{modalDialog}
				userJoinedSuccess={() => {
					userJoinedCrowdtainer();
					preOrderStep = JoinStep.ThankYouMessage;
				}}
				withSignature={projectHasSigner}
			/>
		{:else}
			<ConnectWallet />
		{/if}
	{/if}
{/if}
