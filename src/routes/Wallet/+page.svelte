<script lang="ts">
	import { LoadStatus } from '$lib/Converters/CrowdtainerData';
	import { findTokenIdsForWallet, type TokenIDAssociations } from '$lib/ethersCalls/rpcRequests';
	import MyCampaign from '$lib/MyCampaign.svelte';

	import { Vouchers721Address } from '../Data/projects.json';
	import { connected, getSigner, accountAddress, injectedProviderAvailableNow } from '$lib/Utils/wallet';
	import EmptySection from '$lib/EmptySection.svelte';
	import { connect } from '$lib/Utils/wallet';
	import { WalletType } from '$lib/Utils/walletStorage';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Wallet } from '@steeze-ui/heroicons';

	import ModalDialog from '$lib/ModalDialog.svelte';
	import { projectFromCrowdtainerId } from '$lib/TokenUtils/search.js';
	import { showToast } from '$lib/Toast/ToastStore.js';
	import { campaignStaticStores } from '$lib/Stores/campaignStaticDataStore.js';

	let modalDialog: ModalDialog;

	let tokenIdAssociations: TokenIDAssociations | undefined;

	let staticDataLoadStatus: LoadStatus = LoadStatus.Loading;

	function resetState() {
		tokenIdAssociations = undefined;
		staticDataLoadStatus = LoadStatus.Loading;
	}

	function handleUserTransferredParticipationEvent(event: CustomEvent) {
		console.log(`Detected event of type: ${event.type}`);
		console.log(`Modal: typeof(detail): ${typeof event.detail}`);
		console.dir(event.detail);
		modalDialog = event.detail;
		// Reload items
		reloadUserData();
	}

	async function reloadUserData() {
		if ($connected == false || !$accountAddress) {
			console.log(
				`Skipping reloadUserData(); connected: ${$connected} accountAddress: ${$accountAddress}`
			);
			return;
		}
		resetState();
		let signer = getSigner();
		let tokenIdSearchResult = await findTokenIdsForWallet(
			signer,
			Vouchers721Address,
			$accountAddress
		);
		if (tokenIdSearchResult.isErr()) {
			console.warn(`Error loading tokens for connected wallet: ${tokenIdSearchResult.unwrapErr()}`);
			staticDataLoadStatus = LoadStatus.FetchFailed;
			return;
		}
		tokenIdAssociations = tokenIdSearchResult.unwrap();

		let fetchError = await campaignStaticStores.fetchData(tokenIdAssociations.crowdtainerIds);
		if (fetchError) {
			showToast(`Error fetching data: ${fetchError.details}`);
			staticDataLoadStatus = LoadStatus.FetchFailed;
			return;
		}
		staticDataLoadStatus = LoadStatus.Loaded;
	}

	// Immediatelly update UI elements related to connected wallet on wallet or connection change
	$: $accountAddress, reloadUserData();
</script>

<ModalDialog bind:this={modalDialog} />

<div class="flex justify-center mt-24">
	<div class="">
		<Icon src={Wallet} theme="solid" class="text-gray-800 dark:text-gray-200" size="42" />
	</div>
</div>
<div class="flex justify-center mb-4">
	<p class="font-sans text-center dark:text-gray-200 text-xl my-5 md:mb-0 md:text-2xl">
		Your Campaigns
	</p>
</div>

{#if tokenIdAssociations !== undefined && $connected && $accountAddress}
	<div class="divide-y">
		{#each tokenIdAssociations.foundTokenIds as tokenId, index}
			<MyCampaign
				wallet={$accountAddress}
				{tokenId}
				vouchers721Address={Vouchers721Address}
				{...projectFromCrowdtainerId(tokenIdAssociations.crowdtainerIds[index])}
				{staticDataLoadStatus}
				campaignStaticData={$campaignStaticStores.staticData[
					tokenIdAssociations.crowdtainerIds[index]
				]}
				campaignStaticUI={$campaignStaticStores.UIData[tokenIdAssociations.crowdtainerIds[index]]}
				on:userTransferredParticipationEvent={handleUserTransferredParticipationEvent}
			/>
		{/each}
	</div>
{/if}

{#if tokenIdAssociations === undefined && $connected && staticDataLoadStatus === LoadStatus.Loading}
	<EmptySection emptyMessage="Loading.." />
{/if}

{#if tokenIdAssociations !== undefined && tokenIdAssociations.foundTokenIds.length == 0 && $connected}
	<EmptySection
		emptyMessage="No participation proofs associated with the connected wallet were found."
	/>
{/if}

{#if !$connected}
	<EmptySection>
		<p class="text-black dark:text-gray-200 text-center mx-2 my-10">
			Please connect your wallet to see your campaigns.
		</p>
		<br />

		<div class="flex justify-center">
			<button
				class="btn btn-outline text-black dark:text-gray-200 mb-6"
				on:click={() => {
					if (injectedProviderAvailableNow()) {
						connect(WalletType.Injected);
					} else {
						connect(WalletType.WalletConnect);
					}
				}}
			>
				Connect Wallet
			</button>
		</div>
	</EmptySection>
{/if}
