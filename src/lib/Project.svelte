<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import type { Readable } from 'svelte/store';

	import PreOrderSigBased from '$lib/PreOrderSigBased.svelte';

	import { initializeCampaignStores, campaignStores } from '$lib/campaignStore';
	import { joinSelection } from '$lib/userStore';
	import { walletFundsInCrowdtainer } from './ethersCalls/rpcRequests';
	import { BigNumber, ethers } from 'ethers';

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

	let currentSelection = 0;
	let currentPrice: number;
	let fundsInContract: number | undefined;
	let raisedAmount: number | undefined;
	let tweeningDuration = 650;
	let tweenedPercentageWidth = tweened(0, { duration: tweeningDuration, easing: cubicOut });
	let tweenedPercentageRaised = tweened(0, { duration: tweeningDuration, easing: cubicOut });
	let userFundsInCrowdtainer: BigNumber = BigNumber.from(0);

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

	function updateCurrentSelection(index: number, price: number) {
		currentSelection = index;
		currentPrice = price;
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

	function handleCampaignLeftEvent(event: CustomEvent) {
		if (campaignStaticUI !== undefined) {
			let quantities: number[] = new Array<number>(campaignStaticUI.prices.length).fill(0);
			$joinSelection.set(crowdtainerId, quantities);
			$joinSelection = $joinSelection;
		}

		console.log(`Detected event of type: ${event.type} : detail: ${event.detail.text}`);
		dialog.visible = true;
		dialog.title = 'Success';
		dialog.animation = ModalAnimation.None;
		dialog.icon = ModalIcon.BadgeCheck;
		dialog.type = ModalType.Information;
		dialog.body = 'You have left the project and the pre-payment has been returned to your wallet.';
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
	$: joinViewEnabled =
		(state === ProjectStatusUI.Funding || state === ProjectStatusUI.SuccessfulyFunded) &&
		userFundsInCrowdtainer.isZero();

	$: stateString =
		staticDataLoadStatus !== LoadStatus.FetchFailed &&
		$campaignDynamicData !== undefined &&
		campaignStaticData !== undefined
			? toStateString($campaignDynamicData, campaignStaticData)
			: loadingString;

	$: $campaignDynamicData, setRaisedAmount(), setPercentages();
	$: loadingAnimation = staticDataLoadStatus === LoadStatus.Loading;

	// Immediatelly update UI elements related to connected wallet on wallet or connection change
	$: $connected, $accountAddress, readDataForConnectedWallet();
</script>

{#if dialog.visible}
	<ModalDialog modalDialogData={dialog} />
{/if}

<div class="max-w-10xl mx-auto py-1 sm:px-6 lg:px-8">
	<div class="border-2 max-w-lg mx-auto white overflow-hidden md:max-w-7xl my-8">
		<div class="md:flex">
			<div class="md:shrink-0">
				<img class="w-full object-cover md:h-full md:w-96" src={projectImageURL} alt="Coffee" />
			</div>
			<div class="p-8">
				<div class="font-mono uppercase tracking-wide text-base text-red-600 font-semibold">
					{title}
				</div>
				<a
					href={projectURL}
					class="text-black block mt-1 text-2xl leading-tight font-medium hover:underline"
					>{subtitle}</a
				>
				<p class="mt-5 text-slate-500">
					{@html description}
				</p>

				{#if staticDataLoadStatus === LoadStatus.Loaded || staticDataLoadStatus === LoadStatus.Loading}
					<div class:animate-pulse={loadingAnimation}>
						<div class="my-6 bg-gray-300 rounded-md w-full">
							<div
								class="bg-sky-600 text-sm font-medium text-white text-center p-1 leading-normal rounded-md"
								style="width: {$tweenedPercentageWidth}%"
							>
								{$tweenedPercentageRaised.toFixed(0)}%
							</div>
						</div>

						<!-- Main Status -->
						<div class="flex justify-between px-2 gap-5">
							<div>
								<p class="projectStatus">{stateString}</p>
								<p class="projectDataSubtitle">Status</p>
							</div>

							<MoneyInContract {fundsInContract} {raisedAmount} {campaignStaticUI} {state} />

							<div class="">
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
						<div class="flex px-2 py-8 justify-between gap-12">
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

						{#if joinViewEnabled}
							<div class="pt-4">
								{#if staticDataLoadStatus === LoadStatus.Loaded && currentPrice}
									<p class="text-blue-500 px-2 productPrice">
										{currentPrice}
										{campaignStaticUI ? campaignStaticUI.tokenSymbol : ''}
									</p>
								{:else}
									<p class="px-2 productPrice">{loadingString}</p>
								{/if}
								<div class="flex px-2">
									<h3 class="projectDataSubtitle">Price</h3>
								</div>
							</div>

							<fieldset class="mt-4 font-mono">
								<legend class="sr-only">Choose a product</legend>
								{#if campaignStaticUI}
									<div class="grid grid-cols-2 gap-4">
										{#each campaignStaticUI.prices as price, index}
											<label
												class:ring-2={currentSelection === index}
												class:ring-indigo-500={currentSelection === index}
												class="ring-gray-800 group relative border rounded-md py-3 px-5 flex items-center justify-center text-sm font-medium uppercase hover:bg-gray-50 focus:outline-none sm:flex-1 sm:py-4 bg-white shadow-sm text-gray-900 cursor-pointer"
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
								class="px-2 mt-10 w-full md:w-4/6 lg:w-2/6 bg-gray-900 font-medium text-white hover:bg-gray-700 hover:shadow-lg border border-transparent rounded-3xl py-3 flex items-center justify-center text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
				/>

				<div class="w-auto flex ">
					{#if campaignStaticData !== undefined && campaignStaticUI !== undefined}
						<CampaignActions
							{vouchers721Address}
							crowdtainerAddress={campaignStaticData?.contractAddress}
							projectStatusUI={state}
							tokenSymbol={campaignStaticUI.tokenSymbol}
							{userFundsInCrowdtainer}
							on:userClaimedFundsEvent={handleUserClaimedFundsEvent}
						/>
					{/if}
				</div>
			</div>
		</div>

		{#if joinViewEnabled && campaignStaticData !== undefined}
			{#if campaignStaticData.signer === '0x0000000000000000000000000000000000000000'}
				<PreOrder
					{vouchers721Address}
					crowdtainerAddress={campaignStaticData?.contractAddress}
					{campaignStaticUI}
					{crowdtainerId}
					on:userJoinedCrowdtainerEvent={handleCampaignJoinedEvent}
				/>
			{:else}
				<PreOrderSigBased
					{vouchers721Address}
					crowdtainerAddress={campaignStaticData?.contractAddress}
					{campaignStaticUI}
					{crowdtainerId}
					on:userJoinedCrowdtainerEvent={handleCampaignJoinedEvent}
				/>
			{/if}
		{/if}
	</div>
</div>
