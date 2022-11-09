<script lang="ts">
	import type { BigNumber } from 'ethers';
	import { onInterval } from './intervalTimer';

	import type { UserStoreModel } from '$lib/Model/UserStoreModel';
	import { fetchUserBalancesData } from './ethersCalls/rpcRequests';
	import { getSigner } from './wallet';

	export let crowdtainerAddress: string;
	export let tokenSymbol: string | undefined;
	export let totalCostInERCUnits: BigNumber;
	export let totalSum: number;
	export let actionButtonEnabled: boolean;
	export let callApproveSpendingHandler: () => void;
	export let callJoinProjectHandler: () => void;

	const interval = 10000;
	let walletData: UserStoreModel;

	export let refreshWalletData = async () => {
		let response = await fetchUserBalancesData(getSigner(), crowdtainerAddress);
		if (response.isOk()) {
			walletData = response.unwrap();
			console.log(`crowdtainerAddress: ${crowdtainerAddress} allowance: ${walletData.erc20Allowance}, balance: ${walletData.erc20Balance}`);
		} else {
			console.log(`hm, ${response.unwrapErr()}`);
		}
	};

	onInterval(refreshWalletData, interval);

	$: enoughFunds =
		walletData &&
		walletData.erc20Balance !== undefined &&
		totalCostInERCUnits.lt(walletData.erc20Balance)
			? true
			: false;
	$: enoughAllowance =
		walletData &&
		walletData.erc20Allowance !== undefined &&
		walletData.erc20Allowance.lt(totalCostInERCUnits)
			? false
			: true;
</script>

<div class="flex justify-center">
	<div class="max-w-xs">
		<div class="grid  grid-flow-col auto-cols-1">
			{#if enoughFunds}
				✅ Enough funds.
			{:else}
				⚠ Not enough funds. Please top up your wallet with {tokenSymbol}.
			{/if}
		</div>
		<div class="grid  grid-flow-col auto-cols-1">
			{#if enoughAllowance}
				✅ Enough spend allowance.
			{:else}
				⚠ Not enough spend allowance.
			{/if}
		</div>

		{#if enoughFunds && enoughAllowance}
			<button type="button" class="sky-btn" on:click={callJoinProjectHandler}>
				Confirm & Join
			</button>
		{:else if enoughFunds && !enoughAllowance}
			<button
				type="button"
				disabled={!actionButtonEnabled}
				class="sky-btn"
				on:click={callApproveSpendingHandler}
			>
				{#if actionButtonEnabled}
					{#if tokenSymbol !== undefined}
						Authorize spending ({totalSum} {tokenSymbol})
					{:else}
						Authorize spending
					{/if}
				{:else}
					Waiting for confirmation..
				{/if}
			</button>
		{:else}
			<button type="button" disabled={true} class="btn btn-outline w-42 mt-6 py-4">
				Confirm & Join
			</button>
		{/if}
	</div>
</div>
