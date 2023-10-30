<script lang="ts">
	import ProjectGlobalView from './ProjectGlobalView.svelte';
	import AddToCartView from './AddToCartView.svelte';

	import { onMount } from 'svelte';
	import { derived, type Readable } from 'svelte/store';
	import { goto } from '$app/navigation';

	import JoinProject from '$lib/JoinProject.svelte';

	import { initializeCampaignDynamicStores } from '$lib/Stores/campaignStore';
	import { joinSelection } from '$lib/Stores/userStore';

	import DetailedTokenIdState from './DetailedTokenIdState.svelte';
	import CampaignActions from './CampaignActions.svelte';

	import { campaignStaticStores } from './Stores/campaignStaticDataStore.js';

	import type { CrowdtainerDynamicModel, SplitSelection } from '$lib/Model/CrowdtainerModel';
	import { toState, LoadStatus, ProjectStatusUI } from '$lib/Converters/CrowdtainerData';

	import { connected, getSigner, accountAddress } from '$lib/Utils/wallet';
	let modalDialog: ModalDialog;

	import { OrderStatus } from './api';
	import { initializeDataForWallet, walletInCrowdtainer } from './Stores/dataForWalletStore.js';
	import ModalDialog from './ModalDialog.svelte';
	import { showToast } from './Toast/ToastStore.js';
	import { handleCampaignJoinedEvent, handleUserClaimedFundsEvent } from './CampaignActions.js';
	import { loadOrderDetails } from './TokenUtils/search.js';
	import { findTokenIdsForWallet, type TokenIDAssociations } from './ethersCalls/rpcRequests.js';

	export let vouchers721Address: string;
	export let chainId: number;
	export let tokenVersion: string;
	export let txSponsoringEnabled: boolean;
	export let crowdtainerId: number;
	export let title: string;
	export let subtitle: string;
	export let description: string;
	export let projectURL: string;
	export let projectImageURLs: string[];
	export let basePriceUnit: string;
	export let basePriceDenominator: number[];

	export let productConfiguration: SplitSelection;
	export let projectId: number;
	export let staticDataLoadStatus: LoadStatus = LoadStatus.Loading;

	export const campaignStaticData = derived(campaignStaticStores, ($campaignStaticStores) => {
		return $campaignStaticStores.staticData[projectId];
	});
	export const campaignStaticUI = derived(campaignStaticStores, ($campaignStaticStores) => {
		return $campaignStaticStores.UIData[projectId];
	});

	let campaignDynamicData: Readable<CrowdtainerDynamicModel> | undefined;

	let orderStatus: OrderStatus;

	let tokenIdAssociations: TokenIDAssociations | undefined;

	async function refreshData() {
		if (staticDataLoadStatus !== LoadStatus.Loaded) {
			return;
		}

		campaignDynamicData = initializeCampaignDynamicStores(crowdtainerId);
		if ($connected && $accountAddress) {
			initializeDataForWallet($campaignStaticData.contractAddress, $accountAddress);

			let tokenIdSearchResult = await findTokenIdsForWallet(
				getSigner(),
				vouchers721Address,
				$accountAddress
			);
			if (tokenIdSearchResult.isErr()) {
				showToast(`Error loading tokens for connected wallet: ${tokenIdSearchResult.unwrapErr()}`);
				return;
			}
			tokenIdAssociations = tokenIdSearchResult.unwrap();
			let order = await loadOrderDetails(vouchers721Address, tokenIdAssociations?.foundTokenIds);
			if (order) {
				console.log(`Updated order status: ${order}`);
				orderStatus = order;
			} else {
				orderStatus = OrderStatus.Unknown;
			}
		} else {
			console.log(
				`Skipped refresh: wallet connected? ${$connected} : address ? ${$accountAddress}`
			);
			tokenIdAssociations = undefined;
		}
	}

	onMount(async () => {
		let fetchError = await campaignStaticStores.fetchData([projectId]);
		if (fetchError) {
			showToast(`Error fetching data: ${fetchError.details}`);
			return;
		}
	});

	async function handleUserLeftCrowdtainerEvent(event: CustomEvent) {
		console.log(`Detected event of type: ${event.type} : detail: ${event.detail.text}`);
		if (campaignStaticUI === undefined) {
			console.log(`Missing campaignStaticUI data`);
			return;
		}
		tokenIdAssociations = undefined;
		let quantities: number[] = new Array<number>($campaignStaticUI.prices.length).fill(0);
		$joinSelection.set(crowdtainerId, quantities);
		$joinSelection = $joinSelection;

		refreshData();
	}

	function handleUserTransferredParticipationEvent(event: CustomEvent) {
		console.log(`Detected event of type: ${event.type}`);
		console.log(`Modal: typeof(detail): ${typeof event.detail}`);
		console.dir(event.detail);
		modalDialog.show(event.detail);
		// Reload items
		refreshData();
	}

	// dynamic
	$: state = toState($campaignDynamicData, $campaignStaticData);
	$: joinViewEnabled = !$connected || !tokenIdAssociations || tokenIdAssociations.foundTokenIds.length == 0 && 
		state === ProjectStatusUI.Funding &&
		$walletInCrowdtainer.fundsInCrowdtainer.isZero();

	// $: $campaignDynamicData;
	$: loadingAnimation = staticDataLoadStatus === LoadStatus.Loading;

	// Immediatelly update UI elements related to connected wallet on wallet or connection change
	$: $accountAddress,
		initializeDataForWallet($campaignStaticData.contractAddress, $accountAddress),
		refreshData();
</script>

<ModalDialog bind:this={modalDialog} />

<div class="mx-auto py-1 px-2 sm:px-6 lg:px-8">
	<div
		class="dark:bg-transparent backdrop-blur-[4px] backdrop-saturate-50 dark:backdrop-brightness-50 border-2 border-black dark:border dark:border-white rounded-md mx-auto white lg:max-w-7xl my-8"
	>
		<div class="md:flex">
			<!-- large size -->
			<div class="hidden md:block w-4/6">
				<div class="flex flex-col items-center align-center h-full">
					<div class="my-4 grow carousel carousel-vertical p-4 rounded-box">
						<div class="h-[32rem]">
							{#each projectImageURLs as imageURL}
								<div class="carousel-item justify-center w-full">
									<img src={imageURL} class="rounded-box w-auto my-2" alt="" />
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- small size -->
			<div class="block md:hidden p-4">
				<div class="flex flex-col items-center align-center">
					<div class="carousel carousel-end rounded-box space-x-4">
						{#each projectImageURLs as imageURL}
							<div class="carousel-item">
								<img src={imageURL} class="h-80" alt="test" />
							</div>
						{/each}
					</div>
				</div>
			</div>

			<div class="font-sans px-4 sm:pr-8 sm:pl-8 pt-8 pb-4">
				<div class="font-display uppercase tracking-wide text-primary">
					{title}
				</div>
				<a
					href={projectURL}
					class="link font-sans text-black dark:text-gray-200 block mt-1 text-2xl leading-tight font-medium hover:underline"
					>{subtitle}</a
				>
				<div class="font-text my-4 text-slate-700 dark:text-gray-200">
					{@html description}
				</div>

				{#if staticDataLoadStatus === LoadStatus.Loaded || staticDataLoadStatus === LoadStatus.Loading}
					<ProjectGlobalView
						{vouchers721Address}
						{crowdtainerId}
						{projectId}
						{staticDataLoadStatus}
					/>
				{:else}
					<p class="my-6 text-red-800">Error fetching data.</p>
				{/if}

				{#if staticDataLoadStatus === LoadStatus.Loaded && joinViewEnabled && campaignStaticUI}
					<AddToCartView
						{crowdtainerId}
						{basePriceUnit}
						{basePriceDenominator}
						{productConfiguration}
						{projectId}
						{staticDataLoadStatus}
					/>
				{/if}

				{#if loadingAnimation}
					<div class:animate-pulse={tokenIdAssociations === undefined}>Loading...</div>
				{:else if tokenIdAssociations !== undefined && tokenIdAssociations.foundTokenIds.length > 1}
					<div class="mt-4 md:mt-6 inline-flex items-center text-black dark:text-gray-200">
						<p>More than one participation proof detected:</p>
						<button
							class="btn btn-sm ml-2"
							on:click={() => {
								goto(`/Wallet`);
							}}
						>
							View in wallet ⎘</button
						>
					</div>
				{:else if tokenIdAssociations !== undefined}
					<DetailedTokenIdState
						walletData={$walletInCrowdtainer}
						campaignStaticUI={$campaignStaticUI}
						{state}
						{orderStatus}
					/>

					<div class="w-auto flex">
						{#if campaignStaticData !== undefined && campaignStaticUI !== undefined}
							<CampaignActions
								wallet={$accountAddress}
								title={`${subtitle} - ${title}`}
								{projectURL}
								tokenId={tokenIdAssociations.foundTokenIds[0]}
								{vouchers721Address}
								crowdtainerAddress={$campaignStaticData.contractAddress}
								projectStatusUI={state}
								tokenSymbol={$campaignStaticUI.tokenSymbol}
								walletData={$walletInCrowdtainer}
								{orderStatus}
								{modalDialog}
								on:userClaimedFundsEvent={(event) =>
									handleUserClaimedFundsEvent(event, modalDialog)}
								on:userLeftCrowdtainerEvent={handleUserLeftCrowdtainerEvent}
								on:userTransferredParticipationEvent={handleUserTransferredParticipationEvent}
							/>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		{#if joinViewEnabled && campaignStaticData !== undefined && campaignStaticUI !== undefined}
			<div class="dark:text-gray-100">
				<JoinProject
					tokenAddress={$campaignStaticData.tokenAddress}
					{tokenVersion}
					{txSponsoringEnabled}
					{chainId}
					{vouchers721Address}
					crowdtainerAddress={$campaignStaticData.contractAddress}
					campaignStaticUI={$campaignStaticUI}
					{crowdtainerId}
					{basePriceDenominator}
					{basePriceUnit}
					referralRate={$campaignStaticData.referralRate}
					on:userJoinedCrowdtainerEvent={(event) =>
						handleCampaignJoinedEvent(event, modalDialog, () => {
							refreshData();
						})}
				/>
			</div>
		{/if}
	</div>
</div>
