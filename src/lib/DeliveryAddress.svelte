<script lang="ts">
	import { type DeliveryDetails, makeDeliveryRequestMessage, signMessage } from './Model/SignTerms';
	import ModalDialog, {
		ModalAnimation,
		ModalIcon,
		ModalType,
		type ModalDialogData
	} from './ModalDialog.svelte';
	import { getSigner } from './wallet';
	import { requestDeliveryAPI } from './api';

	// Random number
	import { ethers } from 'ethers';
	import { pseudoRandomNonce } from './Utils/random';

	// Modal Dialog
	let modalDialogData: ModalDialogData = {
		visible: false,
		title: '',
		body: '',
		animation: ModalAnimation.Circle2,
		icon: ModalIcon.DeviceMobile,
		type: ModalType.ActionRequest
	};

	export let walletAddress: string;
	export let vouchers721Address: string;
	export let voucherId: number;

	const country = 'Germany';
	let firstName: string;
	let lastName: string;
	let address: string;
	let complement: string;
	let postalCode: string;
	let city: string;
	let email: string;

	let displaySuccessMessage: boolean = false;

	const callSubmitDelivery = async () => {
		let signer = getSigner();
		if (signer === undefined) {
			console.log('Error: signer undefined');
			// TODO: user feedback
			return;
		}

		let chainId = await signer.getChainId();

		let deliveryDetails: DeliveryDetails = {
			vouchers721Address,
			voucherId,
			chainId,
			country,
			firstName,
			lastName,
			address,
			complement,
			postalCode,
			city,
			email
		};

		modalDialogData.type = ModalType.ActionRequest;
		modalDialogData.title = 'Delivery confirmation';
		modalDialogData.body = 'Please confirm the signature request in your mobile wallet.';
		modalDialogData.animation = ModalAnimation.Circle2;
		modalDialogData.visible = true;

		const nonce = pseudoRandomNonce().toString();
		const currentTime = new Date().toISOString();
		const domain = window.location.host;
		const origin = window.location.origin;

		console.log(`Account: ${walletAddress}`);
		// make sure address is check-summed; Some wallets don't use checksummed addresses (e.g. Metamask mobile)
		walletAddress = ethers.utils.getAddress(walletAddress);
		console.log(`Account check-summed: ${walletAddress}`);

		let message = makeDeliveryRequestMessage(walletAddress, domain, origin, deliveryDetails, nonce, currentTime);
		let signResult = await signMessage(signer, message);

		if (signResult.isOk()) {
			let sigHash = signResult.unwrap();

			// TODO: Apply asymmetric encryption client/browser side before sending.
			let requestResult = await requestDeliveryAPI(walletAddress, domain, origin, nonce, currentTime, deliveryDetails, sigHash);

			if (requestResult === 'OK') {
				modalDialogData.visible = false;
				displaySuccessMessage = true;
			} else {
				console.log(`Error: ${requestResult}`);
				modalDialogData = {
					type: ModalType.ActionRequest,
					visible: true,
					title: 'Transaction rejected',
					body: `An error ocurred when requesting delivery. Please contact us with the following details: ${requestResult}.`,
					icon: ModalIcon.Exclamation,
					animation: ModalAnimation.None
				};
				modalDialogData.visible = true;
				console.log(`what went wrong? ${requestResult}`);
				return;
			}
		} else {
			console.log(`Failure!? ${signResult.unwrapErr()}`);
		}
	};
</script>

{#if modalDialogData.visible}
	<ModalDialog {modalDialogData} />
{/if}

{#if displaySuccessMessage}
	<div class="text-black dark:text-white py-16 mx-16">
		<p class="text-secondary text-xl">Success!</p>
		<br />
		<p>
			Thank you for your order. We have received your delivery address and in a few minutes you
			should receive an invoice by Email as a final confirmation.
		</p>
	</div>
{:else}
	<div class="flex justify-center py-3">
		<div
			class="block p-4 rounded-lg shadow-lg bg-white dark:bg-gray-900 drop-shadow-lg max-w-md mb-2"
		>
			<form on:submit|preventDefault={callSubmitDelivery}>
				<p class="py-1 text-lg text-primary">Delivery address</p>

				<!-- Country -->
				<div class="form-group mb-2">
					<label class="block">
						<span class="text-secondary text-sm">Country</span>
						<input
							type="text"
							name="country"
							disabled
							class="text-input-form"
							placeholder="Country"
							value="Germany"
						/>
					</label>
				</div>

				<!-- Name -->
				<div class="grid grid-cols-2 gap-4">
					<div class="form-group mb-2">
						<span class="text-secondary text-sm">First Name</span>
						<input type="text" name="firstName" class="text-input-form" bind:value={firstName} />
					</div>
					<div class="form-group mb-2">
						<span class="text-secondary text-sm">Last name</span>
						<input type="text" name="lastName" class="text-input-form" bind:value={lastName} />
					</div>
				</div>

				<!-- Address -->
				<div class="form-group mb-2">
					<label class="block">
						<span class="text-secondary text-sm">Address</span>
						<input type="text" name="address" class="text-input-form" bind:value={address} />
					</label>
				</div>

				<div class="form-group mb-2">
					<label class="block">
						<span class="text-secondary text-sm"
							>House number, apartment number or other (optional)</span
						>
						<input
							type="text"
							name="addressComplement"
							class="text-input-form"
							bind:value={complement}
						/>
					</label>
				</div>

				<!-- Postal code / City -->
				<div class="grid grid-cols-2 gap-4">
					<div class="form-group mb-2">
						<span class="text-secondary text-sm">Postal code</span>
						<input type="text" name="postalCode" class="text-input-form" bind:value={postalCode} />
					</div>
					<div class="form-group mb-2">
						<span class="text-secondary text-sm">City</span>
						<input type="text" name="city" class="text-input-form" bind:value={city} />
					</div>
				</div>

				<p class="py-1 text-lg text-primary">Contact information</p>
				<div class="form-group mb-2">
					<span class="text-secondary text-sm">Email for Invoice</span>
					<input type="email" name="email" class="text-input-form" bind:value={email} />
				</div>

				<div class="flex justify-center">
					<button type="submit" class="sky-btn w-68">Complete order</button>
				</div>
			</form>
		</div>
	</div>
{/if}
