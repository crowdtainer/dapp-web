<script lang="ts">
	import { validEmail } from '$lib/Validation/utils.js';
	import { requestEmailAuthorizationAPI, sendChallengeCodeAPI } from '$lib/api.js';
	import { Check, InformationCircle } from '@steeze-ui/heroicons';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { slide } from 'svelte/transition';

	export let nextClicked: (verifiedEmail: string) => void;
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
		emailSent = await sendChallengeCodeAPI(userEmail);
		setTimeout(function () {
			emailSent = false;
		}, 15000);
	};

	$: emailValid = validEmail(userEmail);
</script>

<div class="flex justify-center">
	<div class="m-6">
		{#if emailVerificationRequired && !emailValidated}
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
			<div class="flex justify-center">
				<p class="text-lg bold">E-mail validated!</p>
				<div><Icon src={Check} class="text-green-600" size="24" /></div>
			</div>
			<div class="flex justify-center">
				<button class="btn btn-primary m-4 px-12" on:click={() => { nextClicked(userEmail)}}>Next</button>
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
						If the project is succesfully funded, we will send you an e-mail asking you to provide
						us your delivery address.
					</li>
					<li class="my-2">
						To avoid collecting personal data before knowing for sure we will need it, you do not
						need to provide us your delivery address at this stage (funding).
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
