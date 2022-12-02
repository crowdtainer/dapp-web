<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { Readable } from 'svelte/store';

	import { initializeCampaignStores, campaignStores } from '$lib/campaignStore';
	import { getTokenURI, walletFundsInCrowdtainer } from './ethersCalls/rpcRequests';
	import { BigNumber, Signer } from 'ethers';

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

	import { connected, getSigner, accountAddress } from '$lib/wallet';
	import ModalDialog, {
		ModalAnimation,
		ModalIcon,
		ModalType,
		type ModalDialogData
	} from './ModalDialog.svelte';
	import { loadTokenURIRepresentation } from './Converters/tokenURI';

	export let tokenId: number;
	export let vouchers721Address: string;
	export let crowdtainerId: number;
	export let title: string;
	export let subtitle: string;
	export let description: string;
	export let projectURL: string;
	export let projectImageURL: string;

	export let campaignStaticData: CrowdtainerStaticModel | undefined;
	export let campaignStaticUI: UIFields | undefined;
	export let staticDataLoadStatus: LoadStatus = LoadStatus.Loading;

	let campaignDynamicData: Readable<CrowdtainerDynamicModel> | undefined;

	let fundsInContract: number | undefined;
	let raisedAmount: number | undefined;
	let userFundsInCrowdtainer: BigNumber = BigNumber.from(0);
	let svg: string | undefined;

	// Modal Dialog
	let dialog: ModalDialogData = {
		visible: false,
		title: '',
		body: '',
		animation: ModalAnimation.Circle2,
		icon: ModalIcon.DeviceMobile,
		type: ModalType.ActionRequest
	};

	function initializeReadLoop(callback: () => void, milliseconds: number | undefined) {
		const interval = setInterval(callback, milliseconds);
		onDestroy(() => {
			clearInterval(interval);
		});
	}

	const readDataForConnectedWallet = async () => {
		if (!$connected || campaignStaticData === undefined) {
			return;
		}

		let funds = await walletFundsInCrowdtainer(
			getSigner(),
			campaignStaticData?.contractAddress,
			$accountAddress
		);
		if (funds.isErr()) {
			console.log(`${funds.unwrapErr()}`);
			return;
		}

		userFundsInCrowdtainer = funds.unwrap();
	};

	initializeReadLoop(readDataForConnectedWallet, 13000);

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
	});

	function setRaisedAmount() {
		if (staticDataLoadStatus !== LoadStatus.FetchFailed) {
			let decimals = campaignStaticUI ? campaignStaticUI.tokenDecimals : undefined;
			fundsInContract = toHuman($campaignDynamicData?.fundsInContract, decimals);
			raisedAmount = toHuman($campaignDynamicData?.raised, decimals);
		}
	}

	function handleUserClaimedFundsEvent(event: CustomEvent) {
		console.log(`Detected event of type: ${event.type} : detail: ${event.detail.text}`);
		dialog.visible = true;
		dialog.title = 'Success';
		dialog.animation = ModalAnimation.None;
		dialog.icon = ModalIcon.BadgeCheck;
		dialog.type = ModalType.Information;
		dialog.body =
			'The value equivalent to your pre-payment amount has been returned to your wallet.';
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
	$: $connected, $accountAddress, readDataForConnectedWallet();
</script>

{#if dialog.visible}
	<ModalDialog modalDialogData={dialog} />
{/if}

<div class="max-w-10xl mx-auto py-1 sm:px-6 lg:px-8">
	<div class="rounded-md max-w-lg mx-auto white overflow-hidden md:max-w-7xl my-8 ">
		<div class="md:flex">
			<div class="md:shrink-0">
				<!-- <img class="w-full object-cover md:h-full md:w-96" src={projectImageURL} alt="Coffee" /> -->
				<img
					class="drop-shadow-md hover:drop-shadow-xl w-full object-cover  md:w-96 p-2"
					src={svg}
					alt="Coffee"
				/>
			</div>
			<div class="p-8 w-full">
				<div class="text-primary drop-shadow-sm font-mono uppercase tracking-wide">
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
							<div class="">
								<p class="projectData">
									{campaignStaticUI ? campaignStaticUI.endDateString : loadingString}
								</p>
								<p class="projectDataSubtitle">Funding ended</p>
							</div>
							<div>
								<p class="projectStatus">{stateString}</p>
								<p class="projectDataSubtitle">Status</p>
							</div>
						</div>
					</div>
				{:else}
					<p class="my-6 text-red-800">Error fetching data.</p>
				{/if}
				<DetailedTokenIdState
					{userFundsInCrowdtainer}
					{campaignStaticUI}
					{fundsInContract}
					{raisedAmount}
					{state}
				/>

				<div class="w-auto flex ">
					{#if campaignStaticData !== undefined && campaignStaticUI !== undefined}
						<CampaignActions
							{tokenId}
							{vouchers721Address}
							crowdtainerAddress={campaignStaticData?.contractAddress}
							projectStatusUI={state}
							tokenSymbol={campaignStaticUI.tokenSymbol}
							{userFundsInCrowdtainer}
							on:userClaimedFundsEvent={handleUserClaimedFundsEvent}
							on:userTransferredParticipationEvent
						/>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
