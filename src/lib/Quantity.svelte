<script lang="ts">
	import { blur } from 'svelte/transition';
	import { InformationCircle } from '@steeze-ui/heroicons';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { BigNumber } from 'ethers/lib/ethers.js';
	import { createEventDispatcher } from 'svelte';
	import { shortenAddress } from './Utils/wallet.js';

	export let tokenSymbol: string | undefined;
	export let referralEnabled: boolean;
	export let totalSum: number;
	export let discountValue: number;
	export let ratePercentage: number;
	export let validUserCouponCode: string;

	let discountCode: string = '';
	let redField: boolean;

	const dispatch = createEventDispatcher();

	const userAppliedCoupon = async () => {
		redField = true;
		dispatch('userAppliedCouponEvent', {
			text: `${discountCode}`
		});
	};

	const userRemovedCoupon = async () => {
		redField = true;
		dispatch('userRemovedCouponEvent', {
			text: `${discountCode}`
		});
	};

</script>

<!-- Order container -->
<div class="center container mx-auto max-w-6xl mb-4">
	<div class="">
		<!-- Products container -->
		<div class="m-3">
			<slot />
			<!-- Discount code | start -->
			{#if (validUserCouponCode === undefined || validUserCouponCode === '') && referralEnabled}
				<!-- content here -->
				<div class="flex justify-center my-4">
					<div class="grid grid-flow-col auto-cols-max my-2 items-center">
						<div
							class="tooltip tooltip-info tooltip-right sm:tooltip-bottom lg:tooltip-left p-1 mt-2"
							data-tip="Enter your friends code to apply discount."
						>
							<Icon src={InformationCircle} class="text-green-700 sm:mr-2 mr-0" size="28" />
						</div>

						<input
							type="text"
							bind:value={discountCode}
							on:change={() => {
								redField = false;
							}}
							placeholder="Coupon / referral code"
							class="{redField && validUserCouponCode === ''
								? 'border-red-600 border-2'
								: ''} input input-primary w-full max-w-xs dark:text-black"
						/>
						<button
							class="btn btn-outline mx-2 w-28 dark:text-white dark:disabled:text-gray-200"
							on:click={userAppliedCoupon}
						>
							<p>Apply</p>
						</button>
					</div>
				</div>
			{/if}
			<!-- Discount code | end -->

			<!-- Summary -->
			<div
				class="text-black dark:text-white divide-y divide-dashed text-right mr-4 sm:mr-12 my-2 py-4"
			>
				{#if validUserCouponCode !== undefined && validUserCouponCode !== '' && referralEnabled}
					<p class="text-sm sm:text-md text-primary my-2">
						<button
						on:click={()=>{userRemovedCoupon()}}
						><p class="text-secondary">[ Remove ] &nbsp;</p></button>
						<b
							>{ratePercentage}% OFF referral discount ({shortenAddress(validUserCouponCode)}): -{discountValue}
							{tokenSymbol}</b
						>
					</p>
				{/if}
				<p class="text-sm mt-4">VAT tax (USt.) and shipping included</p>
				{#key totalSum}
					<p in:blur|global={{ duration: 250 }} class="text-lg my-4 mt-4">
						<b>Total</b>: {totalSum - discountValue}
						{tokenSymbol}
					</p>
				{/key}
			</div>
		</div>
	</div>
	<!-- here-->
</div>
