<script lang="ts">
	import { MessageType } from '$lib/Toast/MessageType.js';
	import { showToast } from '$lib/Toast/ToastStore.js';
	import { validEmail } from '$lib/Validation/utils.js';
	import { requestEmailAuthorizationAPI, sendChallengeCodeAPI } from '$lib/api.js';
	import { Check, InformationCircle } from '@steeze-ui/heroicons';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { slide } from 'svelte/transition';

	export let nextClicked: (verifiedEmail: string, providedCode: string) => void;
	export let emailVerificationRequired: boolean;

    let emailValidated = false;
	let userEmail: string;
	let userEmailCode: string = '';
	let invalidCodeWarning: boolean;
	let codeValidatorError: string;
	let emailSent: boolean;

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
		let emailSentResult = await sendChallengeCodeAPI(userEmail);
		if(!emailSentResult.ok){
			console.log(`result: ${emailSentResult.status}`)
			if(emailSentResult.status == 429) {
				showToast(`${emailSentResult.statusText}. Please try again later.`, MessageType.Warning);
			} else {
				showToast('Unable to send challenge code.', MessageType.Warning);
			}
			return;
		}

		emailSent = true;
		setTimeout(function () {
			emailSent = false;
		}, 15000);
	};

	$: emailValid = validEmail(userEmail);
</script>

<div class="">
	<div class="m-6">
		{#if emailVerificationRequired && !emailValidated}
			<p class="text-lg bold text-center">Please verify your E-mail:</p>
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
						<p in:slide|global={{ duration: 300 }}>Sent!</p>
					{:else}
						<p in:slide|global={{ duration: 300 }}>Send</p>
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
			<div class="flex justify-center my-12">
				<p class="text-lg bold">E-mail validated!</p>
				<div><Icon src={Check} class="text-green-600" size="24" /></div>
			</div>
			<div class="flex justify-center">
				<button class="btn btn-primary m-4 px-12" on:click={() => { nextClicked(userEmail, userEmailCode)}}>Next</button>
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
						If the project is succesfully funded, we will send you an e-mail asking you to provide
						us your delivery address.
					</li>
					<li class="mt-2">
						To avoid collecting personal data before knowing for sure we will need it, you do not
						need to provide us your delivery address at this stage (funding).
					</li>
					<li class="mt-2">
						We will <b>never</b> use your e-mail or all personal data for purposes other than fulfilling
						our legal obligations.
					</li>
				</ul>
			</div>
		</div>
	</div>
</div>
