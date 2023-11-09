<script lang="ts">
	import { accountAddress, connected, getSigner, walletState } from '$lib/Utils/wallet';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Check, ShieldCheck } from '@steeze-ui/heroicons';
	import { makeAgreeToTermsMessage, signMessage } from '$lib/Model/SignTerms.js';
	import { requestWalletAuthorizationAPI } from '$lib/api.js';

	import { ethers } from 'ethers';
	const ChainID = import.meta.env.VITE_WALLET_CONNECT_CHAIN_ID;

	import ModalDialog, { ModalAnimation, ModalIcon, ModalType } from '$lib/ModalDialog.svelte';
	import { onMount } from 'svelte';
	import { showToast } from '$lib/Toast/ToastStore.js';
	import { MessageType } from '$lib/Toast/MessageType.js';
	import ConnectWallet from '$lib/ConnectWallet.svelte';

	export let supportedCountriesForShipping: string[];
	export let userEmail: string;
	export let termsAcceptanceSuccess: () => void;
	export let acceptanceRequired = true;
	export let vouchers721Address: string | undefined;
	export let crowdtainerAddress: string;
	export let userEMailCode: string;

	export let modalDialog: ModalDialog;

	let termsAccepted = false;

	let deliveryAcknowledged = false;
	let shipmentConditions = false;
	let termsAcknowledged = false;
	let feesAcknowledged = false;
	let shippingAcknowledged = false;

	let supportedCountriesText = supportedCountriesForShipping.join(', ');

	onMount(async () => {
		if (!acceptanceRequired) {
			termsAccepted = true;
		}
		if (termsAccepted) {
			deliveryAcknowledged = true;
			shipmentConditions = true;
			termsAcknowledged = true;
			feesAcknowledged = true;
			shippingAcknowledged = true;
		}
	});

	const callSignTermsAndConditions = async () => {
		if (termsAccepted) {
			termsAcceptanceSuccess();
			return;
		}

		modalDialog.show({
			id: 'toc_confirmation',
			type: ModalType.ActionRequest,
			title: 'Terms and Conditions confirmation',
			body: 'Please read the message and confirm the signature request in your mobile wallet.',
			animation: ModalAnimation.Circle2
		});

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

		if (vouchers721Address === undefined) {
			showToast('Error: Missing Vouchers721Address.', MessageType.Warning);
			return;
		}

		console.log(`Account: ${account}`);

		// make sure address is check-summed; Some wallets don't use checksummed addresses (e.g. Metamask mobile)
		account = ethers.utils.getAddress(account);

		console.log(`Account check-summed: ${account}`);

		const nonce = userEMailCode;
		const currentTime = new Date().toISOString();
		const domain = window.location.host;

		// Obtain a valid nonce, which gives access to the current email/wallet combination to a campaign ID.

		let message = makeAgreeToTermsMessage(
			domain,
			userEmail,
			account,
			ChainID,
			vouchers721Address,
			crowdtainerAddress,
			nonce,
			currentTime
		);

		let signResult = await signMessage(signer, message);
		if (signResult.isOk()) {
			let sigHash = signResult.unwrap();
			let requestResult = await requestWalletAuthorizationAPI(
				userEmail,
				account,
				ChainID,
				vouchers721Address,
				crowdtainerAddress,
				domain,
				nonce,
				currentTime,
				sigHash
			);

			let errorDescription: string = '';

			if (requestResult === 'OK') {
				termsAccepted = true;
				termsAcceptanceSuccess();
			} else {
				try {
					let json = JSON.parse(requestResult);
					if (json.message) {
						errorDescription = json.message;
					}
				} catch (error) {
					console.log(`Error parsing server error message.`);
				}
				console.log(`Error: ${requestResult}`);
				let message = 'An error ocurred while approving the signature';
				message = `${message}${errorDescription !== '' ? `: ${errorDescription}` : `.`}`;

				modalDialog.show({
					id: 'approveFailed',
					type: ModalType.ActionRequest,
					title: 'Operation failed',
					body: message,
					icon: ModalIcon.Exclamation
				});

				// actionButtonEnabled = true;
				console.log(`requestResult: ${requestResult}`);
				return;
			}
		} else {
			console.log(`Failure: ${signResult.unwrapErr()}`);
		}

		modalDialog.close();
	};
</script>

{#if $connected}
	<div class="text-left mx-4">
		<div class="flex justify-center my-2">
			<div class="grid grid-flow-col auto-cols-max">
				<div class="my-1">Please confirm:</div>
			</div>
		</div>

		<div class="flex justify-center">
			<label class="label cursor-pointer gap-3 my-1 sm:w-full md:w-4/5 lg:w-4/6 xl:w-3/6">
				<input
					type="checkbox"
					disabled={termsAccepted}
					bind:checked={deliveryAcknowledged}
					class="checkbox checkbox-primary"
				/>
				<span class="label-text dark:text-white w-full"
					>If the project is succesful, I need to return to this website to provide my delivery
					details.</span
				>
			</label>
		</div>

		{#if supportedCountriesForShipping.length > 0}
		<div class="flex sm:justify-center">
			<label class="label cursor-pointer gap-3 my-1 sm:w-full md:w-4/5 lg:w-4/6 xl:w-3/6">
				<input
						type="checkbox"
						disabled={termsAccepted}
						bind:checked={shippingAcknowledged}
						class="checkbox checkbox-primary"
					/>
				<span class="label-text dark:text-white w-full"
					>Shipping is only possible to: {supportedCountriesText}.</span
				>
			</label>
		</div>
		{/if}


		<div class="flex justify-center">
			<label class="label cursor-pointer gap-3 my-1 sm:w-full md:w-4/5 lg:w-4/6 xl:w-3/6">
				<input
					type="checkbox"
					disabled={termsAccepted}
					bind:checked={shipmentConditions}
					class="checkbox checkbox-primary"
				/>
				<p class="label-text dark:text-white w-full">
					I understand that due the experimental nature of this project, delivery can take more than
					30 days.
				</p>
			</label>
		</div>

		<div class="flex justify-center">
			<label class="label cursor-pointer gap-3 my-1 sm:w-full md:w-4/5 lg:w-4/6 xl:w-3/6">
				<input
					type="checkbox"
					disabled={termsAccepted}
					bind:checked={feesAcknowledged}
					class="checkbox checkbox-primary"
				/>
				<span class="label-text dark:text-white"
					>I am aware that Ethereum network fees will apply to prepare the payment and in case I
					want to leave a campaign. Those fees are paid to 3rd parties and are not re-payable by us
					in case of my withdrawal from the purchase.</span
				>
			</label>
		</div>

		<div class="flex justify-center">
			<label class="label cursor-pointer gap-3 my-1 sm:w-full md:w-4/5 lg:w-4/6 xl:w-3/6">
				<input
					type="checkbox"
					disabled={termsAccepted}
					bind:checked={termsAcknowledged}
					class="checkbox checkbox-primary"
				/>
				<span class="label-text dark:text-white"
					>I agree to the <a class="link" target="_blank" href="/Legal/Terms" rel="noopener"
						>General Terms and Conditions</a
					> and that I am solely responsible in safeguarding my cryptographic private keys used to interact
					with this website.</span
				>
			</label>
		</div>

		<div class="flex justify-center">
			<div>
				<button
					disabled={feesAcknowledged &&
						deliveryAcknowledged &&
						termsAcknowledged &&
						shipmentConditions &&
						shippingAcknowledged}
					class="{modalDialog.open ? 'hidden' : ''} btn btn-primary mx-2 my-2 w-auto"
					on:click={() => {
						feesAcknowledged =
							deliveryAcknowledged =
							termsAcknowledged =
							shipmentConditions =
							shippingAcknowledged =
								true;
					}}
				>
					Select all items
				</button>
			</div>
		</div>
	</div>

	<div class="flex justify-center gap-2 my-2">
		<div class="grid grid-flow-col auto-cols-max my-2">
			<div><Icon src={ShieldCheck} class="text-green-600" size="24" /></div>
			<p class="text-xs px-1 py-1">Connected to: <b>{$accountAddress}</b></p>
		</div>
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
			disabled={!feesAcknowledged ||
				!deliveryAcknowledged ||
				!termsAcknowledged ||
				!shipmentConditions ||
				!shippingAcknowledged}
			class="{modalDialog.open ? 'hidden' : ''} btn btn-primary mx-2 my-2 w-28"
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
	<ConnectWallet />
{/if}
