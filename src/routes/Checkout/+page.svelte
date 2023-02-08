<script lang="ts">
	import { page } from '$app/stores';

	import { onMount } from 'svelte';

	import { fetchDynamicData, fetchStaticData } from '$lib/api';
	import { LoadStatus, ProjectStatusUI, toState } from '$lib/Converters/CrowdtainerData';
	import type { CrowdtainerDynamicModel } from '$lib/Model/CrowdtainerModel';

	import { connected, getSigner, accountAddress } from '$lib/wallet';
	import EmptySection from '$lib/EmptySection.svelte';
	import { connect } from '$lib/wallet';
	import { WalletType } from '$lib/walletStorage';

	import ModalDialog, {
		ModalAnimation,
		ModalIcon,
		ModalType,
		type ModalDialogData
	} from '$lib/ModalDialog.svelte';
	import { findTokenIdsForWallet } from '$lib/ethersCalls/rpcRequests';
	import { BigNumber } from 'ethers';
	import { loadTokenURIRepresentation, type TokenURIObject } from '$lib/Converters/tokenURI';
	import DeliveryAddress from '$lib/DeliveryAddress.svelte';

	let campaignDynamicData: CrowdtainerDynamicModel | undefined;
	let staticDataLoadStatus: LoadStatus = LoadStatus.Loading;
	let projectStatusUI: ProjectStatusUI;
	let svg: string;
	let tokenJSON: TokenURIObject;
	let loadedWallet: string;
	let userWalletInvalid: boolean;

	let voucherId: BigNumber;
	let vouchers721Address: string;

	let tokenValidForWallet: boolean;

	// Modal Dialog
	let dialog: ModalDialogData = {
		type: ModalType.ActionRequest,
		title: '',
		body: '',
		animation: ModalAnimation.Circle2,
		visible: false,
		icon: ModalIcon.DeviceMobile
	};

	async function loadUserData() {
		console.log(
			`$page.url.searchParams.get('voucherId'): ${$page.url.searchParams.get('voucherId')}`
		);
		console.log(
			`$page.url.searchParams.get('vouchers721Address'): ${$page.url.searchParams.get(
				'vouchers721Address'
			)}`
		);

		try {
			voucherId = BigNumber.from(Number($page.url.searchParams.get('voucherId')));
			vouchers721Address = String($page.url.searchParams.get('vouchers721Address'));
		} catch (error) {
			console.log(`URL path invalid.. ${error}`);
			return;
		}

		if (voucherId.eq(0) || vouchers721Address === '') {
			console.log(`Missing parameters`);
			return;
		}

		let currentSigner = getSigner();
		if (currentSigner === undefined) {
			console.log('Missing wallet');
			return;
		}

		loadedWallet = await currentSigner.getAddress();

		let walletTokensSearch = await findTokenIdsForWallet(currentSigner, vouchers721Address);
		if (walletTokensSearch.isErr()) {
			console.log(`Unable to search wallet tokens: ${walletTokensSearch.unwrapErr()}`);
			//TODO: inform user
			return;
		}

		let [foundTokenIds, foundCrowdtainerIds, crowdtainerAddresses] = walletTokensSearch.unwrap();
		// console.log(`Found ${foundCrowdtainerIds.length} crowdtainer ids: ${foundCrowdtainerIds}`);

		if (foundTokenIds.length == 0) {
			console.log('No tokens found.');
			return;
		}

		// parameter needs to match token owner
		let foundToken = foundTokenIds.filter((item) => item === voucherId.toNumber());
		if (foundToken.length === 0) {
			console.log('The specified token does not belong to the connected wallet.');
			return;
		}

		console.log(`Found token: ${foundToken}`);
		tokenValidForWallet = true;

		// Get the crowdtainer id
		let tokenURIJSON = await loadTokenURIRepresentation(
			currentSigner,
			vouchers721Address,
			foundToken[0]
		);

		if (tokenURIJSON === undefined) {
			console.log('Unable to decode tokenURI JSON.');
			return;
		}

		svg = tokenURIJSON.image;
		tokenJSON = tokenURIJSON;
		// console.log(JSON.stringify(tokenJSON));

		let jsonObject = JSON.parse(JSON.stringify(tokenJSON));

		// Load dynamic data
		let campaignDynamicDataResult = await fetchDynamicData(jsonObject.crowdtainerId);
		if (campaignDynamicDataResult.isErr()) {
			console.log('Unable to read dynamic contract data.');
			return;
		}

		campaignDynamicData = campaignDynamicDataResult.unwrap();

		// Load static data
		let result = await fetchStaticData([jsonObject.crowdtainerId]);
		if (!result.isOk()) {
			console.log('Unable to fetch data');
			return;
		}

		if (result.unwrap().length === 0) {
			console.log('CrowdtainerID not found.');
			return;
		}
		let campaignStaticData = result.unwrap()[0];
		projectStatusUI = toState(campaignDynamicData, campaignStaticData);
		staticDataLoadStatus = LoadStatus.Loaded;
	}

	async function checkWalletValdity() {
		console.log('Checking wallet..');
		let currentSigner = getSigner();
		let currentWalletAddress = await currentSigner?.getAddress();
		if (
			staticDataLoadStatus === LoadStatus.Loaded &&
			currentSigner !== undefined &&
			currentWalletAddress !== loadedWallet
		) {
			userWalletInvalid = true;
		} else if (currentWalletAddress === loadedWallet) {
			userWalletInvalid = false;
		}
	}

	// Immediatelly inform the user if wallet changes
	$: $connected, $accountAddress, checkWalletValdity();

	onMount(async () => {
		loadUserData();
	});
</script>

{#if dialog.visible}
	<ModalDialog modalDialogData={dialog} />
{/if}

<header class="ct-divider">
	<div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
		<h1 class="font-display text-xl text-white">Checkout 🛒</h1>
	</div>
</header>

<div class="max-w-lg mx-auto white overflow-hidden md:max-w-7xl my-8">
	{#if userWalletInvalid}
		<div class="text-black dark:text-white text-center mx-2 my-4">
			<p>The wallet was either disconected or changed.</p>
			<p>Please reconnect the following wallet: {loadedWallet} or restart Checkout.</p>
		</div>
	{:else if $connected && staticDataLoadStatus == LoadStatus.Loaded && projectStatusUI === ProjectStatusUI.Delivery}
		<div class="md:flex ">
			<div class="md:shrink-0">
				<div class="flex justify-center">
					<img
						class="drop-shadow-md sm:mt-10 mt-0 hover:drop-shadow-xl w-34 object-cover md:w-96 p-2"
						src={svg}
						alt="Coffee"
					/>
				</div>
			</div>
			<DeliveryAddress
				walletAddress={loadedWallet}
				{vouchers721Address}
				voucherId={voucherId.toNumber()}
			/>
		</div>
	{:else if projectStatusUI === ProjectStatusUI.Loading}
		<p class="text-black dark:text-white text-center mx-2 my-4">Loading data..</p>
	{:else if !$connected}
		<EmptySection>
			<p class="text-black dark:text-gray-200 text-center mx-2 my-4">
				Please connect your wallet to see your campaigns.
			</p>
			<br />

			<div class="flex justify-center ">
				<button
					class="btn btn-outline text-black dark:text-white"
					on:click={() => {
						connect(WalletType.WalletConnect);
					}}
				>
					Connect Wallet
				</button>
			</div>
		</EmptySection>
	{:else if $connected && !tokenValidForWallet}
		<div>
			<p class="text-black dark:text-white text-center mx-2 my-32">
				The token specified for checkout is either invalid or not owned by the connected wallet.
			</p>
		</div>
		<br />
	{:else if projectStatusUI === ProjectStatusUI.SuccessfulyFunded}
		<p class="text-black dark:text-white text-center mx-2 my-32">
			Waiting for service provider confirmation. Please try again in a few minutes.
		</p>
	{/if}
</div>
