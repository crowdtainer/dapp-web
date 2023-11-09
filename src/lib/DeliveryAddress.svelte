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
	import countries, { type Country } from 'iso-3166-1/dist/iso-3166.js';
	import { onMount } from 'svelte';

	let modalDialog: ModalDialog;

	export let walletAddress: string;
	export let vouchers721Address: string;
	export let voucherId: number;
	export let supportedCountriesFilter: string[];

	let countriesListDisplay: Country[] = new Array<Country>();

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
			deliveryDetails.billingAddress.email = deliveryAddress.email;
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

		console.log(`Account: ${walletAddress}`);
		// make sure address is check-summed; Some wallets don't use checksummed addresses (e.g. Metamask mobile)
		walletAddress = ethers.utils.getAddress(walletAddress);
		console.log(`Account check-summed: ${walletAddress}`);

		deliveryDetails = normalizeDeliveryDetails(deliveryDetails);

		let message = makeDeliveryRequestMessage(
			walletAddress,
			domain,
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

	onMount(async () => {
		if (supportedCountriesFilter.length > 0) {
			countriesListDisplay = countries.filter((country) =>
				supportedCountriesFilter.includes(country.country)
			);
		} else {
			countriesListDisplay = countries;
		}
	});
</script>

<ModalDialog bind:this={modalDialog} />

{#if displaySuccessMessage}
	<div class="text-black dark:text-white py-16 mx-16">
		<p class="text-secondary text-xl">Success !</p>
		<br />
		<p>
			Thank you. We have received your delivery address and in a few minutes you should receive an
			invoice by Email as a final confirmation.
		</p>
	</div>
{:else}
	<div class="flex justify-center">
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
				{#if countriesListDisplay.length > 0}
					<div class="form-control w-full mb-2">
						<span class=" text-secondary text-sm">Country</span>
						<select class="select" bind:value={deliveryAddress.country}>
							<option disabled selected>Select</option>
							{#each countriesListDisplay as country}
								<option value={country.alpha2}>{country.country}</option>
							{/each}
						</select>
					</div>
				{/if}

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
						<span class="text-secondary text-sm">Street Address</span>
						<input
							type="text"
							name="address"
							placeholder="House number and street name"
							class="text-input-form"
							bind:value={deliveryAddress.address}
						/>
					</label>
				</div>

				<div class="form-group mb-2">
					<label class="block">
						<span class="text-secondary text-sm">Complement (optional)</span>
						<input
							type="text"
							name="addressComplement"
							placeholder="Apartment number, suite, unit, etc"
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
						<span class="text-secondary text-sm">City</span>
						<input
							type="text"
							name="city"
							class="text-input-form"
							bind:value={deliveryAddress.city}
						/>
					</div>
				</div>

				<p class="py-1 text-lg text-primary mt-2">Billing address</p>
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
						{#if countriesListDisplay.length > 0}
							<div class="form-control w-full mb-2">
								<span class=" text-secondary text-sm">Country</span>
								<select class="select" bind:value={billingAddress.country}>
									<option disabled selected>Select</option>
									{#each countriesListDisplay as country}
										<option value={country.alpha2}>{country.country}</option>
									{/each}
								</select>
							</div>
						{/if}

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
								<span class="text-secondary text-sm">Street Address</span>
								<input
									type="text"
									placeholder="House number and street name"
									name="address"
									class="text-input-form"
									bind:value={billingAddress.address}
								/>
							</label>
						</div>

						<div class="form-group mb-2">
							<label class="block">
								<span class="text-secondary text-sm">Complement (optional)</span>
								<input
									type="text"
									name="addressComplement"
									placeholder="Apartment number, suite, unit, etc"
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
								<span class="text-secondary text-sm">City</span>
								<input
									type="text"
									name="city"
									class="text-input-form"
									bind:value={billingAddress.city}
								/>
							</div>
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
