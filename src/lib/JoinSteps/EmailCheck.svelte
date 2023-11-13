<script lang="ts">
	import { MessageType } from '$lib/Toast/MessageType.js';
	import { showToast } from '$lib/Toast/ToastStore.js';
	import { validEmail } from '$lib/Validation/utils.js';
	import {
		requestCaptchaChallenge,
		requestEmailAuthorizationAPI,
		sendChallengeCodeAPI
	} from '$lib/api.js';
	import type { Result } from '@sniptt/monads';
	import { Check, InformationCircle } from '@steeze-ui/heroicons';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	export let nextClicked: (verifiedEmail: string, providedCode: string) => void;
	export let emailVerificationRequired: boolean;
	export let captchaVerificationRequired: boolean;

	let emailValidated = false;
	let userEmail: string;
	let userEmailCode: string = '';
	let invalidCodeWarning: boolean;
	let codeValidatorError: string;
	let emailSent: boolean;
	let captchaSVG: string | undefined = undefined;
	let captchaId: number | undefined = undefined;
	let userCaptchaCode: string;

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
		type Error = { code: number; message: string };
		let emailSentResult: Result<string, Error>;
		if (captchaVerificationRequired) {
			if (!captchaId || !captchaSVG) {
				showToast('Unable to get captcha challenge.');
				return;
			}
			emailSentResult = await sendChallengeCodeAPI(
				userEmail,
				captchaId.toString(),
				userCaptchaCode
			);
		} else {
			emailSentResult = await sendChallengeCodeAPI(userEmail);
		}
		if (emailSentResult.isErr()) {
			showToast(`${emailSentResult.unwrapErr().message}`, MessageType.Warning);
			return;
		}

		emailSent = true;
	};

	$: emailValid = validEmail(userEmail);

	async function doRequestCaptchaChallenge() {
		let captchaChallengeResult = await requestCaptchaChallenge();
		if (captchaChallengeResult.isErr()) {
			showToast(
				`Unable to get captcha challenge. ${
					captchaChallengeResult.unwrapErr().message
						? captchaChallengeResult.unwrapErr().message
						: ''
				}`,
				MessageType.Warning
			);
			return;
		}
		captchaSVG = captchaChallengeResult.unwrap().svg;
		captchaId = captchaChallengeResult.unwrap().id;
	}

	onMount(async () => {
		if (captchaVerificationRequired) doRequestCaptchaChallenge();
	});
</script>

<div class="">
	<div class="m-6">
		{#if emailVerificationRequired && !emailValidated}
			<p class="text-lg bold text-center my-2">
				{captchaVerificationRequired && !emailSent ? 'Type the captcha and v' : 'V'}erify your
				Email:
			</p>

			{#if !emailSent}
				{#if captchaVerificationRequired}
					<div class="flex justify-center items-center">
						<div class="m-2 p-2 dark:bg-gray-100">
							{@html captchaSVG}
						</div>
						<div>
							<button
								class=" mx-2 dark:text-white dark:disabled:text-gray-200"
								on:click={doRequestCaptchaChallenge}
							>
								<p>Retry 🔄</p>
							</button>
						</div>
					</div>
				{/if}

				<div class="flex justify-center">
					<div class="form-group">
						{#if captchaVerificationRequired}
							<div class="flex justify-center">
								<input
									type="text"
									name="postalCode"
									class="input input-bordered input-info max-w-xs dark:text-black w-full max-w-xs dark:text-black my-2"
									placeholder="Captcha"
									bind:value={userCaptchaCode}
								/>
							</div>
						{/if}
						<div class="flex justify-center">
							<input
								type="text"
								placeholder="Email"
								bind:value={userEmail}
								class="{emailValid
									? 'border-lime-600 border-2'
									: ''} input input-bordered input-info max-w-xs dark:text-black w-full max-w-xs dark:text-black my-2"
							/>
						</div>
						<div class="flex flex-inline text-sm">
							By entering your Email, you agree to the &nbsp;
							<a target="_blank" rel="noopener" class="link" href="/Legal/PrivacyPolicy"
								>Privacy Policy</a
							>.
						</div>
						<div class="flex justify-center">
							<button
								class="sky-btn mx-2 dark:text-white dark:disabled:text-gray-200"
								disabled={!emailValid || emailSent}
								on:click={callSendChallengeCodeAPI}
							>
								<p in:slide|global={{ duration: 300 }}>Send Code</p>
							</button>
						</div>
					</div>
				</div>
			{/if}

			{#if emailSent}
				<p class="text-lg bold text-center my-4 mt-8">Enter the code sent to your Email:</p>
				<div class="flex justify-center">
					<input
						type="text"
						bind:value={userEmailCode}
						placeholder={invalidCodeWarning ? 'Invalid code' : 'Code'}
						class="{invalidCodeWarning
							? 'border-red-500 border-2'
							: ''} input input-bordered input-info w-28 dark:text-black mx-2"
					/>
					<button
						class="btn btn-outline mx-2 w-28 dark:text-white dark:disabled:text-gray-200"
						on:click={async () => {
							await callRequestEmailAuthorizationAPI();
						}}
					>
						{#if invalidCodeWarning}
							{codeValidatorError}
						{:else}
							Verify
						{/if}
					</button>
				</div>
			{/if}
		{:else}
			<div class="flex justify-center my-12">
				<p class="text-lg bold">E-mail validated!</p>
				<div><Icon src={Check} class="text-green-600" size="24" /></div>
			</div>
			<div class="flex justify-center">
				<button
					class="btn btn-primary m-4 px-12"
					on:click={() => {
						nextClicked(userEmail, userEmailCode);
					}}>Next</button
				>
			</div>
		{/if}
		<div class="flex justify-center mt-4">
			<div class="text-md mt-8 max-w-screen-md text-left">
				<div class="grid grid-flow-col auto-cols-max">
					<div><Icon src={InformationCircle} class="text-green-700" size="24" /></div>
					<p class="px-2 text-md">Why?</p>
				</div>
				<ul class="list-disc mx-5">
					<li class="mt-2">
						European laws requires us communicate in a "durable medium", of which Email is the most
						recognized at this time.
					</li>
					<li class="mt-2">
						You don't need to provide the product delivery address at this stage (funding), but only
						if the campaign is successful.
					</li>
				</ul>
			</div>
		</div>
	</div>
</div>
