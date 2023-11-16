<script lang="ts">
	import { page } from '$app/stores';

	import { onMount } from 'svelte';

	import { fetchDynamicData, fetchStaticData } from '$lib/api';
	import { LoadStatus, ProjectStatusUI, toState } from '$lib/Converters/CrowdtainerData';
	import type { CrowdtainerDynamicModel } from '$lib/Model/CrowdtainerModel';
	import { projects } from '../Data/projects.json';

	import {
		connected,
		getSigner,
		accountAddress,
		injectedProviderAvailableNow
	} from '$lib/Utils/wallet';
	import EmptySection from '$lib/EmptySection.svelte';
	import { connect } from '$lib/Utils/wallet';
	import { WalletType } from '$lib/Utils/walletStorage';

	import { findTokenIdsForWallet, type TokenIDAssociations } from '$lib/ethersCalls/rpcRequests';
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
	let tokenIdAssociations: TokenIDAssociations;

	let countriesList: string[] | undefined = undefined;

	let projectTitle: string | null;
	let projectURL: string | null;
	let voucherId: BigNumber;
	let vouchers721Address: string;

	let crowdtainerId: number | undefined = undefined;

	let tokenValidForWallet: boolean;

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
			projectTitle = $page.url.searchParams.get('projectTitle');
			projectURL = $page.url.searchParams.get('projectURL');
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

		let walletTokensSearch = await findTokenIdsForWallet(
			currentSigner,
			vouchers721Address,
			loadedWallet
		);
		if (walletTokensSearch.isErr()) {
			console.log(`Unable to search wallet tokens: ${walletTokensSearch.unwrapErr()}`);
			//TODO: inform user
			return;
		}

		tokenIdAssociations = walletTokensSearch.unwrap();
		// console.log(`Found ${foundCrowdtainerIds.length} crowdtainer ids: ${foundCrowdtainerIds}`);

		if (tokenIdAssociations.foundTokenIds.length == 0) {
			console.log('No tokens found.');
			return;
		}

		// parameter needs to match token owner
		let foundToken = tokenIdAssociations.foundTokenIds.filter(
			(item) => item === voucherId.toNumber()
		);
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
		crowdtainerId = Number(jsonObject.crowdtainerId);

		if (!crowdtainerId) {
			console.warn('Unable to find crowdtainer ID');
			return;
		}

		// Load dynamic data

		let campaignDynamicDataResult = await fetchDynamicData(crowdtainerId);
		if (campaignDynamicDataResult.isErr()) {
			console.log('Unable to read dynamic contract data.');
			return;
		}

		campaignDynamicData = campaignDynamicDataResult.unwrap();

		// Load static data
		let result = await fetchStaticData([crowdtainerId]);
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

		// load shipping country restrictions
		let projectData = projects.filter((project) => project.crowdtainerId === crowdtainerId);
		if (projectData.length !== 1) {
			console.warn('Unable to find project data');
			return;
		}
		countriesList = new Array<string>();
		countriesList = projectData[0].supportedCountriesForShipping;

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
	$: $connected, $accountAddress, loadUserData(), checkWalletValdity();

	onMount(async () => {
		loadUserData();
	});
</script>

<header class="ct-divider">
	<div class="block md:hidden">
		<!-- small screen -->
		<div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
			<div class="text-sm md:text-xl breadcrumbs text-white">
				<ul>
					<li>Checkout &nbsp; 🛍️</li>
					<li><a href={projectURL}>{projectTitle ? `${projectTitle}` : ''}</a></li>
				</ul>
			</div>
		</div>
	</div>
	<div class="hidden md:block">
		<!-- large screen -->
		<div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
			<div class="breadcrumbs text-white">
				<ul>
					<li><a href={projectURL}>{projectTitle ? `${projectTitle}` : ''}</a></li>
					<li>Checkout &nbsp; 🛍️</li>
				</ul>
			</div>
		</div>
	</div>
</header>

<div class="max-w-lg mx-auto white overflow-hidden md:max-w-7xl my-2 lg:my-10">
	{#if userWalletInvalid}
		<div class="text-black dark:text-white text-center mx-2 my-4">
			<p>The wallet was either disconected or changed.</p>
			<p>Please reconnect the following wallet: {loadedWallet} or restart Checkout.</p>
		</div>
	{:else if $connected && staticDataLoadStatus == LoadStatus.Loaded && projectStatusUI === ProjectStatusUI.Delivery}
		<div class="md:flex">
			<div class="md:shrink-0">
				<div class="flex justify-center">
					<img
						class="drop-shadow-md sm:mt-10 mt-0 hover:drop-shadow-xl w-34 object-cover md:w-96 p-2"
						src={svg}
						alt="Coffee"
					/>
				</div>
			</div>

			{#if countriesList}
				<DeliveryAddress
					supportedCountriesFilter={countriesList}
					walletAddress={loadedWallet}
					{vouchers721Address}
					voucherId={voucherId.toNumber()}
				/>
			{/if}
		</div>
	{:else if projectStatusUI === ProjectStatusUI.Loading}
		<p class="text-black dark:text-white text-center mx-2 my-4">Loading data..</p>
	{:else if !$connected}
		<EmptySection>
			<p class="text-black dark:text-gray-200 text-center mx-2 my-4">
				Please connect your wallet to see your campaigns.
			</p>
			<br />

			<div class="flex justify-center">
				<button
					class="btn btn-outline text-black dark:text-white"
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
	{:else if projectStatusUI === ProjectStatusUI.Funding}
		<p class="text-black dark:text-white text-center mx-2 my-32">
			Funding still ongoing. Please come back later.
		</p>
	{:else}
		<p class="text-black dark:text-white text-center mx-2 my-32">
			No successfully funded campaigns available for this wallet.
		</p>
	{/if}
</div>
