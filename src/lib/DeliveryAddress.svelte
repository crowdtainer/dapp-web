<script lang="ts">
	import {
		type DeliveryDetails,
		makeDeliveryRequestMessage,
		signMessage,
		normalizeDeliveryDetails,
		makeAddress
	} from './Model/SignTerms';
	import ModalDialog, { ModalAnimation, ModalIcon, ModalType } from './ModalDialog.svelte';
	import { getSigner } from './Utils/wallet';
	import { requestDeliveryAPI } from './api';

	// Random number
	import { ethers } from 'ethers';
	import { pseudoRandomNonce } from './Utils/random';
	import { slide } from 'svelte/transition';

	let modalDialog: ModalDialog;

	export let walletAddress: string;
	export let vouchers721Address: string;
	export let voucherId: number;

	let deliveryAddress = makeAddress();
	let billingAddress = makeAddress();

	let deliverySameAsBilling = true;

	let displaySuccessMessage: boolean = false;

	interface ResponseObject {
		message: string;
	}

	const callSubmitDelivery = async () => {
		let signer = getSigner();
		if (signer === undefined) {
			console.log('Error: signer undefined');
			return;
		}

		let chainId = await signer.getChainId();

		let deliveryDetails: DeliveryDetails = {
			vouchers721Address,
			voucherId,
			chainId,
			deliveryAddress,
			billingAddress
		};

		if (deliverySameAsBilling) {
			deliveryDetails.billingAddress = deliveryDetails.deliveryAddress;
		} else {
			deliveryDetails.billingAddress.email = deliveryAddress.email
		}

		modalDialog.show({
			id: 'deliveryConfirmation',
			title: 'Delivery confirmation',
			body: 'Please confirm the signature request in your mobile wallet.',
			type: ModalType.ActionRequest,
			icon: ModalIcon.DeviceMobile,
			animation: ModalAnimation.Circle2
		});

		const nonce = pseudoRandomNonce().toString();
		const currentTime = new Date().toISOString();
		const domain = window.location.host;
		const origin = window.location.origin;

		console.log(`Account: ${walletAddress}`);
		// make sure address is check-summed; Some wallets don't use checksummed addresses (e.g. Metamask mobile)
		walletAddress = ethers.utils.getAddress(walletAddress);
		console.log(`Account check-summed: ${walletAddress}`);

		deliveryDetails = normalizeDeliveryDetails(deliveryDetails);

		let message = makeDeliveryRequestMessage(
			walletAddress,
			domain,
			origin,
			deliveryDetails,
			nonce,
			currentTime
		);
		let signResult = await signMessage(signer, message);

		if (signResult.isOk()) {
			let sigHash = signResult.unwrap();

			// TODO: Apply asymmetric encryption client/browser side before sending.
			let requestResult = await requestDeliveryAPI(
				walletAddress,
				domain,
				origin,
				nonce,
				currentTime,
				deliveryDetails,
				sigHash
			);

			if (requestResult === 'OK') {
				modalDialog.close();
				displaySuccessMessage = true;
			} else {
				console.log(`Error: ${requestResult}`);

				let response: ResponseObject = JSON.parse(requestResult);
				modalDialog.show({
					id: 'requestDeliveryRejected',
					title: 'Delivery Request rejected',
					body: `An error ocurred when requesting delivery:  ${
						response.message ? response.message : requestResult
					}.`,
					type: ModalType.ActionRequest,
					icon: ModalIcon.Exclamation
				});
				console.log(`Delivery Request API call failed: ${requestResult}`);
				return;
			}
		} else {
			console.log(`Failure: ${signResult.unwrapErr()}`);
			modalDialog.show({
				id: 'requestDeliveryRejected',
				title: 'Delivery Request transaction signing rejected',
				body: `Signing request rejected from wallet.`,
				type: ModalType.ActionRequest,
				icon: ModalIcon.Exclamation
			});
		}
	};
</script>

<ModalDialog bind:this={modalDialog} />

{#if displaySuccessMessage}
	<div class="text-black dark:text-white py-16 mx-16">
		<p class="text-secondary text-xl">Success!</p>
		<br />
		<p>
			Thank you. We have received your delivery address and in a few minutes you should receive an
			invoice by Email as a final confirmation.
		</p>
	</div>
{:else}
	<div class="flex justify-center py-3">
		<div
			class="block p-4 rounded-lg shadow-lg bg-white dark:bg-gray-900 drop-shadow-lg max-w-md mb-2"
		>
			<form on:submit|preventDefault={callSubmitDelivery}>
				<p class="py-1 text-lg text-primary">Contact information</p>
				<div class="form-group mb-2">
					<span class="text-secondary text-sm">Email for Invoice</span>
					<input
						type="email"
						name="email"
						class="text-input-form"
						bind:value={deliveryAddress.email}
					/>
				</div>

				<p class="py-1 text-lg text-primary">Delivery address</p>

				<!-- Country -->
				<div class="form-group mb-2">
					<label class="block">
						<span class="text-secondary text-sm">Country</span>
						<input
							type="text"
							name="country"
							class="text-input-form"
							bind:value={deliveryAddress.country}
						/>
					</label>
				</div>

				<!-- Name -->
				<div class="grid grid-cols-2 gap-4">
					<div class="form-group mb-2">
						<span class="text-secondary text-sm">First Name</span>
						<input
							type="text"
							name="firstName"
							class="text-input-form"
							bind:value={deliveryAddress.firstName}
						/>
					</div>
					<div class="form-group">
						<span class="text-secondary text-sm">Last name</span>
						<input
							type="text"
							name="lastName"
							class="text-input-form"
							bind:value={deliveryAddress.lastName}
						/>
					</div>
				</div>

				<!-- Address -->
				<div class="form-group mb-2">
					<label class="block">
						<span class="text-secondary text-sm">Address</span>
						<input
							type="text"
							name="address"
							class="text-input-form"
							bind:value={deliveryAddress.address}
						/>
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
							bind:value={deliveryAddress.complement}
						/>
					</label>
				</div>
				<!-- Postal code / City -->
				<div class="grid grid-cols-2 gap-4">
					<div class="form-group">
						<span class="text-secondary text-sm">Postal code</span>
						<input
							type="text"
							name="postalCode"
							class="text-input-form"
							bind:value={deliveryAddress.postalCode}
						/>
					</div>
					<div class="form-group">
						<span class="text-secondary text-sm">State</span>
						<input
							type="text"
							name="city"
							class="text-input-form"
							bind:value={deliveryAddress.state}
						/>
					</div>
				</div>
				<div class="form-group my-2">
					<span class="text-secondary text-sm">City</span>
					<input
						type="text"
						name="city"
						class="text-input-form"
						bind:value={deliveryAddress.city}
					/>
				</div>

				<p class="py-1 text-lg text-primary">Billing address</p>
				<div class="flex">
					<div class="form-control">
						<label class="label cursor-pointer">
							<input
								type="radio"
								name="radio-1"
								class="radio"
								value={true}
								bind:group={deliverySameAsBilling}
							/>
							<span class="text-secondary label-text ml-2">Same as delivery address</span>
						</label>
					</div>
					<div class="form-control">
						<label class="label cursor-pointer">
							<input
								type="radio"
								name="radio-1"
								class="radio"
								value={false}
								bind:group={deliverySameAsBilling}
							/>
							<span class="text-secondary label-text ml-2">Use a different billing address</span>
						</label>
					</div>
				</div>

				{#if !deliverySameAsBilling}
					<div in:slide={{ duration: 250 }} out:slide={{ duration: 250 }}>
						<!-- Country -->
						<div class="form-group mb-2">
							<label class="block">
								<span class="text-secondary text-sm">Country</span>
								<input
									type="text"
									name="country"
									class="text-input-form"
									bind:value={billingAddress.country}
								/>
							</label>
						</div>

						<!-- Name -->
						<div class="grid grid-cols-2 gap-4">
							<div class="form-group mb-2">
								<span class="text-secondary text-sm">First Name</span>
								<input
									type="text"
									name="firstName"
									class="text-input-form"
									bind:value={billingAddress.firstName}
								/>
							</div>
							<div class="form-group">
								<span class="text-secondary text-sm">Last name</span>
								<input
									type="text"
									name="lastName"
									class="text-input-form"
									bind:value={billingAddress.lastName}
								/>
							</div>
						</div>

						<!-- Address -->
						<div class="form-group mb-2">
							<label class="block">
								<span class="text-secondary text-sm">Address</span>
								<input
									type="text"
									name="address"
									class="text-input-form"
									bind:value={billingAddress.address}
								/>
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
									bind:value={billingAddress.complement}
								/>
							</label>
						</div>
						<!-- Postal code / City -->
						<div class="grid grid-cols-2 gap-4">
							<div class="form-group">
								<span class="text-secondary text-sm">Postal code</span>
								<input
									type="text"
									name="postalCode"
									class="text-input-form"
									bind:value={billingAddress.postalCode}
								/>
							</div>
							<div class="form-group">
								<span class="text-secondary text-sm">State</span>
								<input
									type="text"
									name="city"
									class="text-input-form"
									bind:value={billingAddress.state}
								/>
							</div>
						</div>
						<div class="form-group my-2">
							<span class="text-secondary text-sm">City</span>
							<input
								type="text"
								name="city"
								class="text-input-form"
								bind:value={billingAddress.city}
							/>
						</div>
					</div>
				{/if}

				<div class="flex justify-center">
					<button type="submit" class="sky-btn w-68">Request order</button>
				</div>
			</form>
		</div>
	</div>
{/if}
