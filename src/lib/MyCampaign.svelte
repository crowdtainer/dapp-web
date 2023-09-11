<script lang="ts">
	import { onMount } from 'svelte';
	import type { Readable } from 'svelte/store';

	import { initializeCampaignStores, campaignStores } from '$lib/Stores/campaignStore';

	import CampaignActions from './CampaignActions.svelte';
	import DetailedTokenIdState from './DetailedTokenIdState.svelte';

	import type {
		CrowdtainerDynamicModel,
		CrowdtainerStaticModel
	} from '$lib/Model/CrowdtainerModel';
	import {
		toHuman,
		toStateString,
		toState,
		type UIFields,
		LoadStatus,
		loadingString
	} from '$lib/Converters/CrowdtainerData';

	import { connected, getSigner, accountAddress } from '$lib/Utils/wallet';

	import ModalDialog, { ModalAnimation, ModalIcon, ModalType } from './ModalDialog.svelte';
	let modalDialog: ModalDialog;

	import { loadTokenURIRepresentation } from './Converters/tokenURI';
	import { getOrderDetailsAPI, type OrderStatus } from './api';
	import ProjectDetails from './ProjectDetails.svelte';
	import { initializeDataForWallet, walletInCrowdtainer } from './Stores/dataForWalletStore.js';

	export let tokenId: number;
	export let vouchers721Address: string;
	export let crowdtainerId: number;
	export let title: string;
	export let subtitle: string;
	export let projectURL: string;

	// svelte-ignore unused-export-let
	export let description: string;
	// svelte-ignore unused-export-let
	export let projectImageURLs: string;
	// svelte-ignore unused-export-let
	export let basePriceDenominator: number[];
	// svelte-ignore unused-export-let
	export let basePriceUnit: string;

	export let campaignStaticData: CrowdtainerStaticModel | undefined;
	export let campaignStaticUI: UIFields | undefined;
	export let staticDataLoadStatus: LoadStatus = LoadStatus.Loading;

	let orderStatus: OrderStatus;

	let campaignDynamicData: Readable<CrowdtainerDynamicModel> | undefined;

	let fundsInContract: number | undefined;
	let raisedAmount: number | undefined;
	let svg: string | undefined;

	initializeDataForWallet(campaignStaticData?.contractAddress, $accountAddress);

	onMount(async () => {
		// Dynamic data
		if (campaignDynamicData == undefined) {
			campaignDynamicData = initializeCampaignStores(crowdtainerId);
		} else {
			campaignDynamicData = campaignStores.get(crowdtainerId);
		}
		let signer = getSigner();
		if (signer === undefined) {
			return;
		}

		let imageDataJSON = await loadTokenURIRepresentation(signer, vouchers721Address, tokenId);
		if (imageDataJSON === undefined) {
			console.log('Unable to decode tokenURI.');
			return;
		}

		svg = imageDataJSON.image;

		loadOrderDetails();
	});

	async function loadOrderDetails() {
		let signer = getSigner();
		if (!signer) {
			console.log('Unable to load order details, missing signer.');
			return;
		}

		if (!tokenId) {
			return;
		}

		let result = await getOrderDetailsAPI(await signer.getChainId(), vouchers721Address, tokenId);

		if (result.isErr()) {
			console.log(`${result.unwrapErr()}`);
			return;
		}

		orderStatus = result.unwrap();
	}

	function setRaisedAmount() {
		if (staticDataLoadStatus !== LoadStatus.FetchFailed) {
			let decimals = campaignStaticUI ? campaignStaticUI.tokenDecimals : undefined;
			fundsInContract = toHuman($campaignDynamicData?.fundsInContract, decimals);
			raisedAmount = toHuman($campaignDynamicData?.raised, decimals);
		}
	}

	function handleUserClaimedFundsEvent(event: CustomEvent) {
		console.log(`Detected event of type: ${event.type} : detail: ${event.detail.text}`);
		modalDialog.show({
			id: 'paymentReturnDialog',
			type: ModalType.Information,
			title: 'Success',
			body: 'The value equivalent to your pre-payment amount has been returned to your wallet.',
			animation: ModalAnimation.Circle2,
			icon: ModalIcon.BadgeCheck
		});
	}

	// dynamic
	$: state = toState($campaignDynamicData, campaignStaticData);

	$: stateString =
		staticDataLoadStatus !== LoadStatus.FetchFailed &&
		$campaignDynamicData !== undefined &&
		campaignStaticData !== undefined
			? toStateString($campaignDynamicData, campaignStaticData)
			: loadingString;

	$: $campaignDynamicData, setRaisedAmount();
	$: loadingAnimation = staticDataLoadStatus === LoadStatus.Loading;

	// Immediatelly update UI elements related to connected wallet on wallet or connection change
	$: $connected,
		$accountAddress,
		initializeDataForWallet(campaignStaticData?.contractAddress, $accountAddress);
</script>

<ModalDialog bind:this={modalDialog} />

<div class="max-w-10xl mx-auto py-1 sm:px-6 lg:px-8">
	<div class="rounded-md max-w-lg mx-auto white overflow-hidden md:max-w-7xl my-8">
		<div class="md:flex">
			<div class="md:shrink-0">
				<!-- <img class="w-full object-cover md:h-full md:w-96" src={projectImageURL} alt="Coffee" /> -->
				<img
					class="drop-shadow-md hover:drop-shadow-xl w-full object-cover md:w-96 p-2"
					src={svg}
					alt="Coffee"
				/>
			</div>
			<div class="p-8 w-full">
				<div class="text-primary drop-shadow-sm font-display uppercase tracking-wide">
					{title}
				</div>
				<a
					href={projectURL}
					class="text-black dark:text-white block mt-1 text-2xl leading-tight font-medium hover:underline"
					>{subtitle}</a
				>

				{#if staticDataLoadStatus !== LoadStatus.FetchFailed}
					<div class:animate-pulse={loadingAnimation}>
						<!-- Dates -->
						<div class="flex py-6 gap-16">
							<div>
								<p class="projectStatus">{stateString}</p>
								<p class="projectDataSubtitle">Status</p>
							</div>
							<div class="">
								<p class="projectData">
									{campaignStaticUI ? campaignStaticUI.endDateString : loadingString}
								</p>
								<p class="projectDataSubtitle">Funding end</p>
							</div>
						</div>
					</div>
				{:else}
					<p class="my-6 text-red-800">Error fetching data.</p>
				{/if}
				<!-- Smart contract details -->
				<div class="dark:text-white">
					<ProjectDetails
						{vouchers721Address}
						{crowdtainerId}
						crowdtainerAddress={campaignStaticData?.contractAddress}
						serviceProvider={campaignStaticData?.serviceProvider}
						erc20TokenAddress={campaignStaticData?.token}
						tokenDecimals={campaignStaticData?.tokenDecimals}
						signerAddress={campaignStaticData?.signer}
						referralRate={campaignStaticData?.referralRate}
					/>
				</div>

				<DetailedTokenIdState
					walletData={$walletInCrowdtainer}
					{campaignStaticUI}
					{fundsInContract}
					{raisedAmount}
					{state}
					{orderStatus}
				/>

				<div class="w-auto flex">
					{#if campaignStaticData !== undefined && campaignStaticUI !== undefined}
						<CampaignActions
							{tokenId}
							{vouchers721Address}
							crowdtainerAddress={campaignStaticData?.contractAddress}
							projectStatusUI={state}
							tokenSymbol={campaignStaticUI.tokenSymbol}
							walletData={$walletInCrowdtainer}
							{orderStatus}
							on:userClaimedFundsEvent={handleUserClaimedFundsEvent}
							on:userTransferredParticipationEvent
						/>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
