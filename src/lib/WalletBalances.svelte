<script lang="ts">
	import type { BigNumber } from 'ethers';
	import { onInterval } from './intervalTimer';

	import type { UserStoreModel } from '$lib/Model/UserStoreModel';
	import { fetchUserBalancesData } from './ethersCalls/rpcRequests';
	import { getSigner, web3Provider } from './wallet';

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
		let response = await fetchUserBalancesData(web3Provider, crowdtainerAddress);
		if (response.isOk()) {
			walletData = response.unwrap();
			console.log(
				`crowdtainerAddress: ${crowdtainerAddress} allowance: ${walletData.erc20Allowance}, balance: ${walletData.erc20Balance}`
			);
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

		<button
			type="button"
			disabled={!actionButtonEnabled || !enoughFunds}
			class={actionButtonEnabled && enoughFunds ? 'btn btn-primary px-12 my-6' : 'gray-btn'}
			on:click={() => {
				if (enoughFunds && enoughAllowance) {
					callJoinProjectHandler();
				} else if (enoughFunds && !enoughAllowance) {
					callApproveSpendingHandler();
				}
			}}
		>
			{#if actionButtonEnabled && enoughFunds && !enoughAllowance}
				{#if tokenSymbol !== undefined}
					Authorize spending ({totalSum} {tokenSymbol})
				{:else}
					Authorize spending
				{/if}
			{:else}
				Confirm and Join
			{/if}
		</button>
	</div>
</div>
