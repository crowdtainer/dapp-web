<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import type { Readable } from 'svelte/store';

	import PreOrderSigBased from '$lib/PreOrderSigBased.svelte';

	import { initializeCampaignStores, campaignStores } from '$lib/campaignStore';
	import { joinSelection } from '$lib/userStore';
	import { findTokenIdsForWallet, walletFundsInCrowdtainer } from './ethersCalls/rpcRequests';
	import { BigNumber } from 'ethers';

	import TimeLeft from './TimeLeft.svelte';
	import MoneyInContract from './MoneyInContract.svelte';
	import DetailedTokenIdState from './DetailedTokenIdState.svelte';
	import CampaignActions from './CampaignActions.svelte';

	import type {
		CrowdtainerDynamicModel,
		CrowdtainerStaticModel
	} from '$lib/Model/CrowdtainerModel';
	import {
		toHuman,
		toStateString,
		toState,
		calculatePercentageRaised,
		calculatePercentageWidth,
		type UIFields,
		LoadStatus,
		loadingString,
		ProjectStatusUI
	} from '$lib/Converters/CrowdtainerData';

	import { connected, getSigner, accountAddress } from '$lib/wallet';
	import ModalDialog, {
		ModalAnimation,
		ModalIcon,
		ModalType,
		type ModalDialogData
	} from './ModalDialog.svelte';
	import PreOrder from './PreOrder.svelte';
	import { getOrderDetailsAPI, OrderStatus } from './api';
	import ProjectDetails from './ProjectDetails.svelte';

	export let vouchers721Address: string;
	export let crowdtainerId: number;
	export let title: string;
	export let subtitle: string;
	export let description: string;
	export let projectURL: string;
	export let projectImageURL: string;
	export let basePrices: number[];
	export let basePriceUnit: string;

	export let campaignStaticData: CrowdtainerStaticModel | undefined;
	export let campaignStaticUI: UIFields | undefined;
	export let staticDataLoadStatus: LoadStatus = LoadStatus.Loading;

	let campaignDynamicData: Readable<CrowdtainerDynamicModel> | undefined;

	let currentSelection = 0;
	let currentPrice: number;
	let currentBasePrice: number;
	let fundsInContract: number | undefined;
	let raisedAmount: number | undefined;
	let tweeningDuration = 650;
	let tweenedPercentageWidth = tweened(0, { duration: tweeningDuration, easing: cubicOut });
	let tweenedPercentageRaised = tweened(0, { duration: tweeningDuration, easing: cubicOut });
	let userFundsInCrowdtainer: BigNumber = BigNumber.from(0);

	let orderStatus: OrderStatus;

	// tokenId is present only if the connected wallet has joined the project
	let tokenId: number | undefined = undefined;

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
		$joinSelection = $joinSelection;
		// Dynamic data
		if (campaignDynamicData == undefined) {
			campaignDynamicData = initializeCampaignStores(crowdtainerId);
		} else {
			campaignDynamicData = campaignStores.get(crowdtainerId);
		}
		if (campaignStaticUI) updateCurrentSelection(0, campaignStaticUI.prices[0]);
	});

	function setRaisedAmount() {
		if (staticDataLoadStatus !== LoadStatus.FetchFailed) {
			let decimals = campaignStaticUI ? campaignStaticUI.tokenDecimals : undefined;
			fundsInContract = toHuman($campaignDynamicData?.fundsInContract, decimals);
			raisedAmount = toHuman($campaignDynamicData?.raised, decimals);
		}
	}

	function setPercentages() {
		if (staticDataLoadStatus !== LoadStatus.FetchFailed && raisedAmount !== undefined) {
			let percentage = campaignStaticUI
				? Number(calculatePercentageRaised(raisedAmount.toString(), campaignStaticUI.minimum))
				: undefined;

			if (percentage) {
				tweenedPercentageRaised.set(percentage);
				tweenedPercentageWidth.set(calculatePercentageWidth(percentage));
			}
		}
	}

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

	async function loadTokenIdsForWallet() {
		if (staticDataLoadStatus === LoadStatus.Loaded) {
			let searchResult = await findTokenIdsForWallet(getSigner(), vouchers721Address);
			if (searchResult.isErr()) {
				console.log(`loadTokenIdsForWallet: ${searchResult.unwrapErr()}`);
				return;
			}

			let [foundTokenIds, crowdtainerIds, crowdtainerAddresses] = searchResult.unwrap();
			let index = crowdtainerIds.findIndex((element) => element === crowdtainerId);

			if (index === -1) {
				return;
			}

			tokenId = foundTokenIds[index];
		}
	}

	function updateCurrentSelection(index: number, price: number) {
		currentSelection = index;
		currentPrice = price;
		currentBasePrice = price/basePrices[index];
	}

	function addProduct() {
		if (staticDataLoadStatus === LoadStatus.FetchFailed || campaignStaticUI === undefined) {
			return;
		}
		let updatedQuantity = $joinSelection.get(crowdtainerId);
		if (updatedQuantity) {
			updatedQuantity[currentSelection]++;
			$joinSelection.set(crowdtainerId, updatedQuantity);
			$joinSelection = $joinSelection;
		} else {
			let quantities: number[] = new Array<number>(campaignStaticUI.prices.length).fill(0);
			quantities[currentSelection]++;
			$joinSelection.set(crowdtainerId, quantities);
			$joinSelection = $joinSelection;
		}
	}

	function handleCampaignJoinedEvent(event: CustomEvent) {
		console.log(`Detected event of type: ${event.type} : detail: ${event.detail.text}`);
		dialog.visible = true;
		dialog.title = 'You have succesfully joined the project! 🎉';
		dialog.animation = ModalAnimation.None;
		dialog.icon = ModalIcon.BadgeCheck;
		dialog.type = ModalType.Information;
		dialog.body =
			'If the minimum funding is reached, you will be able to enter your delivery address on this site. Otherwise, you can get your pre-payment back.';
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
	$: joinViewEnabled = state === ProjectStatusUI.Funding && userFundsInCrowdtainer.isZero();

	$: stateString =
		staticDataLoadStatus !== LoadStatus.FetchFailed &&
		$campaignDynamicData !== undefined &&
		campaignStaticData !== undefined
			? toStateString($campaignDynamicData, campaignStaticData)
			: loadingString;

	$: $campaignDynamicData,
		setRaisedAmount(),
		setPercentages(),
		loadTokenIdsForWallet(),
		loadOrderDetails();
	$: loadingAnimation = staticDataLoadStatus === LoadStatus.Loading;

	// Immediatelly update UI elements related to connected wallet on wallet or connection change
	$: $connected, $accountAddress, readDataForConnectedWallet();
</script>

{#if dialog.visible}
	<ModalDialog modalDialogData={dialog} />
{/if}

<div class="max-w-10xl mx-auto py-1 sm:px-6 lg:px-8">
	<div
		class="border-2 border-black dark:border dark:border-white rounded-md max-w-lg mx-auto white overflow-hidden md:max-w-7xl my-8"
	>
		<div class="md:flex">
			<div class="md:shrink-0">
				<img class="w-full object-cover md:h-full md:w-96" src={projectImageURL} alt="Coffee" />
			</div>
			<div class="font-sans pr-8 pl-8 pt-8 pb-4">
				<div class="font-display uppercase tracking-wide text-primary">
					{title}
				</div>
				<a
					href={projectURL}
					class="font-sans text-black dark:text-gray-200 block mt-1 text-2xl leading-tight font-medium hover:underline"
					>{subtitle}</a
				>
				<p class="font-text my-8 text-slate-700 dark:text-gray-200">
					{@html description}
				</p>

				{#if staticDataLoadStatus === LoadStatus.Loaded || staticDataLoadStatus === LoadStatus.Loading}
					<div class:animate-pulse={loadingAnimation}>
						<div class="my-6 bg-gray-300 rounded-md w-full">
							<div
								class="progress progress-primary bg-sky-700 text-sm font-small text-white text-center p-1 leading-normal rounded-md"
								style="width: {$tweenedPercentageWidth}%"
							>
								{$tweenedPercentageRaised.toFixed(0)}%
							</div>
						</div>
						<!-- <div class="my-6">
							<progress class="progress-primary w-full" value={$tweenedPercentageWidth} max="100" />
						</div> -->

						<!-- Main Status -->
						<div class="flex flex-wrap justify-between gap-6 ">
							<div>
								<p class="projectStatus">{stateString}</p>
								<p class="projectDataSubtitle">Status</p>
							</div>

							<MoneyInContract {fundsInContract} {raisedAmount} {campaignStaticUI} {state} />

							<div class="min-w-max">
								{#if campaignStaticUI}
									<p class="projectStatus">
										<TimeLeft endTime={campaignStaticUI.endDate} />
									</p>
									<p class="projectDataSubtitle">to go</p>
								{:else}
									<p class="projectData">
										{loadingString}
									</p>
									<p class="projectDataSubtitle">-</p>
								{/if}
							</div>
						</div>

						<!-- Dates -->
						<div class="flex py-4 justify-between gap-12">
							<div class="">
								<p class="projectData">
									{campaignStaticUI ? campaignStaticUI.startDateString : loadingString}
								</p>
								<p class="projectDataSubtitle">Start</p>
							</div>
							<div class="">
								<p class="projectData">
									{campaignStaticUI ? campaignStaticUI.endDateString : loadingString}
								</p>
								<p class="projectDataSubtitle">End</p>
							</div>
						</div>

						<!-- Smart contract details -->
						<div class="dark:text-gray-200">
							<ProjectDetails
								{vouchers721Address}
								{crowdtainerId}
								crowdtainerAddress={campaignStaticData?.contractAddress}
								serviceProvider={campaignStaticData?.serviceProvider}
								tokenDecimals={campaignStaticData?.tokenDecimals}
								signerAddress={campaignStaticData?.signer}
							/>
						</div>

						{#if joinViewEnabled && campaignStaticUI}
							<div class="pt-4">
								{#if staticDataLoadStatus === LoadStatus.Loaded && currentPrice}
									<p class="text-primary productPrice">
										{currentPrice} {campaignStaticUI.tokenSymbol} ({`${currentBasePrice} ${campaignStaticUI.tokenSymbol}/${basePriceUnit}`})
									</p>
								{:else}
									<p class="px-2 productPrice">{loadingString}</p>
								{/if}
								<div class="flex">
									<h3 class="projectDataSubtitle">Price</h3>
								</div>
							</div>

							<fieldset class="mt-4">
								<legend class="sr-only">Choose a product</legend>
								{#if campaignStaticUI}
									<div class="grid grid-cols-2 gap-4">
										{#each campaignStaticUI.prices as price, index}
											<label
												class:ring-2={currentSelection === index}
												class:ring-blue-500={currentSelection === index}
												class="btn bg-white hover:bg-gray-200 dark:bg-black text-primary"
											>
												<input
													type="radio"
													name="size-choice"
													on:click={() => updateCurrentSelection(index, price)}
													value={campaignStaticUI.descriptions[index]}
													class="sr-only"
													aria-labelledby="size-choice-1-label"
												/>
												<span id="size-choice-1-label">
													{campaignStaticUI.descriptions[index]}
												</span>
												<span
													class="absolute -inset-px rounded-md pointer-events-none"
													aria-hidden="true"
												/>
											</label>
										{/each}
									</div>
								{:else}
									<div class="grid grid-cols-1 gap-4">
										{#each [loadingString, loadingString] as text}
											<label
												class="ring-gray-800 group relative border rounded-md py-3 px-5 flex items-center justify-center text-sm font-medium uppercase hover:bg-gray-50 focus:outline-none sm:flex-1 sm:py-4 bg-white shadow-sm text-gray-900 cursor-pointer"
											>
												<input
													type="radio"
													name="size-choice"
													value={text}
													class="sr-only"
													aria-labelledby="size-choice-1-label"
												/>
												<span id="size-choice-1-label"> {text} </span>
												<span
													class="absolute -inset-px rounded-md pointer-events-none"
													aria-hidden="true"
												/>
											</label>
										{/each}
									</div>
								{/if}
							</fieldset>
						{/if}
					</div>

					{#if joinViewEnabled}
						<div class="flex">
							<button
								on:click={() => {
									addProduct();
								}}
								class="px-2 mt-10 w-full md:w-4/6 lg:w-2/6 btn btn-primary"
							>
								Add to pre-order
							</button>
						</div>
					{/if}
				{:else}
					<p class="my-6 text-red-800">Error fetching data.</p>
				{/if}

				<DetailedTokenIdState
					{userFundsInCrowdtainer}
					{campaignStaticUI}
					{fundsInContract}
					{raisedAmount}
					{state}
					{orderStatus}
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
							{orderStatus}
							on:userClaimedFundsEvent={handleUserClaimedFundsEvent}
						/>
					{/if}
				</div>
			</div>
		</div>

		{#if joinViewEnabled && campaignStaticData !== undefined}
			<div class="dark:text-gray-100">
				{#if campaignStaticData.signer === '0x0000000000000000000000000000000000000000'}
					<PreOrder
						{vouchers721Address}
						crowdtainerAddress={campaignStaticData?.contractAddress}
						{campaignStaticUI}
						{crowdtainerId}
						{basePrices}
						{basePriceUnit}
						on:userJoinedCrowdtainerEvent={handleCampaignJoinedEvent}
					/>
				{:else}
					<PreOrderSigBased
						{vouchers721Address}
						crowdtainerAddress={campaignStaticData?.contractAddress}
						{campaignStaticUI}
						{crowdtainerId}
						{basePrices}
						{basePriceUnit}
						on:userJoinedCrowdtainerEvent={handleCampaignJoinedEvent}
					/>
				{/if}
			</div>
		{/if}
	</div>
</div>
