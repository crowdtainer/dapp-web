<script lang="ts">
	import { fetchStaticData } from '$lib/api';
	import { LoadStatus, prepareForUI, type UIFields } from '$lib/Converters/CrowdtainerData';
	import { findTokenIdsForWallet } from '$lib/ethersCalls/rpcRequests';
	import type { CrowdtainerStaticModel } from '$lib/Model/CrowdtainerModel';
	import MyCampaign from '$lib/MyCampaign.svelte';

	import { projects, Vouchers721Address } from '../Data/projects.json';
	import { connected, getSigner, accountAddress } from '$lib/Utils/wallet';
	import EmptySection from '$lib/EmptySection.svelte';
	import { connect } from '$lib/Utils/wallet';
	import { WalletType } from '$lib/Utils/walletStorage';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Wallet } from '@steeze-ui/heroicons';

	import ModalDialog, {
		ModalAnimation,
		ModalIcon,
		ModalType,
		type ModalDialogData
	} from '$lib/ModalDialog.svelte';
	import { onMount } from 'svelte';

	let tokenIds: number[] = [];
	let crowdtainerIds: number[] = [];

	let campaignStaticData = new Map<number, CrowdtainerStaticModel>();
	let campaignStaticUI: Map<number, UIFields> = new Map<number, UIFields>();
	let staticDataLoadStatus: LoadStatus = LoadStatus.Loading;
	let loadDataInFlight = false;

	// Modal Dialog
	let dialog: ModalDialogData = {
		id: 'walletDialog',
		type: ModalType.ActionRequest,
		title: '',
		body: '',
		animation: ModalAnimation.Circle2,
		visible: false,
		icon: ModalIcon.DeviceMobile
	};

	function resetState() {
		tokenIds = [];
		crowdtainerIds = [];
		campaignStaticData = new Map<number, CrowdtainerStaticModel>();
		campaignStaticUI = new Map<number, UIFields>();
		staticDataLoadStatus = LoadStatus.Loading;
	}

	function projectFromCrowdtainerId(id: number) {
		let filtered = projects.filter((element) => {
			return element.crowdtainerId === id;
		});
		return filtered[0];
	}

	function handleUserTransferredParticipationEvent(event: CustomEvent) {
		console.log(`Detected event of type: ${event.type}`);
		console.log(`Modal: typeof(detail): ${typeof event.detail}`);
		console.dir(event.detail);
		dialog = event.detail;
		// Reload items
		loadUserData();
	}

	async function loadUserData() {
		if (loadDataInFlight) return;

		loadDataInFlight = true;
		resetState();
		let signer = getSigner();
		let walletTokensSearch = await findTokenIdsForWallet(signer, Vouchers721Address);
		if (walletTokensSearch.isErr()) {
			console.log(`Unable to search wallet tokens: ${walletTokensSearch.unwrapErr()}`);
			loadDataInFlight = false;
			return;
		}

		let [foundTokenIds, foundCrowdtainerIds, crowdtainerAddresses] = walletTokensSearch.unwrap();
		console.log(`Found ${foundCrowdtainerIds.length} crowdtainer ids: ${foundCrowdtainerIds}`);

		if (foundTokenIds.length == 0) {
			loadDataInFlight = false;
			console.log('No tokens found.');
			return;
		}

		foundTokenIds.forEach((item, index) => {
			tokenIds.push(item);
			crowdtainerIds.push(foundCrowdtainerIds[index]);
		});

		let result = await fetchStaticData(crowdtainerIds);
		if (result.isOk()) {
			let data = result.unwrap();
			for (let index = 0; index < data.length; index++) {
				campaignStaticData.set(foundCrowdtainerIds[index], data[index]);
				campaignStaticUI.set(foundCrowdtainerIds[index], prepareForUI(data[index]));
			}
			staticDataLoadStatus = LoadStatus.Loaded;
		} else {
			// TODO: Show user UI/pop-up with error.
			console.log('Error: %o', result.unwrapErr());
			staticDataLoadStatus = LoadStatus.FetchFailed;
		}

		loadDataInFlight = false;
		tokenIds = tokenIds;
	}

	onMount(async () => {
		loadUserData();
	});

	// Immediatelly update UI elements related to connected wallet on wallet or connection change
	$: $connected, $accountAddress, loadUserData();
</script>

<ModalDialog modalDialogData={dialog} />

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

{#if $connected && staticDataLoadStatus == LoadStatus.Loaded}
	<div class="divide-y">
		{#each tokenIds as tokenId, index}
			<MyCampaign
				{tokenId}
				vouchers721Address={Vouchers721Address}
				{...projectFromCrowdtainerId(crowdtainerIds[index])}
				{staticDataLoadStatus}
				campaignStaticData={campaignStaticData.get(crowdtainerIds[index])}
				campaignStaticUI={campaignStaticUI.get(crowdtainerIds[index])}
				on:userTransferredParticipationEvent={handleUserTransferredParticipationEvent}
			/>
		{/each}
	</div>
{/if}

{#if tokenIds.length == 0 && $connected}
	<EmptySection emptyMessage="No campaigns associated with the connected wallet." />
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
					connect(WalletType.WalletConnect);
				}}
			>
				Connect Wallet
			</button>
		</div>
	</EmptySection>
{/if}
