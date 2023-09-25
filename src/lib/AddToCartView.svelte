<script lang="ts">
	import { onMount } from 'svelte';
	import { blur } from 'svelte/transition';
	import type { Readable } from 'svelte/store';

	import {
		initializeCampaignDynamicStores,
		campaignDynamicStores
	} from '$lib/Stores/campaignStore';
	import { joinSelection } from '$lib/Stores/userStore';

	import { campaignStaticStores } from './Stores/campaignStaticDataStore.js';

	import type {
		CrowdtainerDynamicModel,
		CrowdtainerStaticModel,
		SplitSelection
	} from '$lib/Model/CrowdtainerModel';
	import { type UIFields, LoadStatus, loadingString } from '$lib/Converters/CrowdtainerData';

	import { connected, accountAddress } from '$lib/Utils/wallet';

	import { initializeDataForWallet } from './Stores/dataForWalletStore.js';
	import { showToast } from './Toast/ToastStore.js';

	export let crowdtainerId: number;
	export let basePriceUnit: string;
	export let basePriceDenominator: number[];
	export let productConfiguration: SplitSelection;

	export let projectId: number;
	export let staticDataLoadStatus: LoadStatus = LoadStatus.Loading;

	let campaignStaticUI: UIFields | undefined;
	let campaignStaticData: CrowdtainerStaticModel | undefined;

	let campaignDynamicData: Readable<CrowdtainerDynamicModel> | undefined;

	let currentSelection = 0;
	let currentPrice: number;
	let currentBasePrice: number;

	//  products display
	let productTypes = new Set<string>();
	let productTypesIndices = new Set<number>();
	let descriptorForProduct = new Map<string, number>();

	interface ProductOptions {
		name: string;
		productSubOptions: string[];
	}

	let productOptions: ProductOptions[];

	let userProductSelection = new Map<string, string>(); // <descriptor, sub-option value>

	initializeDataForWallet(campaignStaticData?.contractAddress, $accountAddress);

	function setUserSelection(descriptor: string, value: string) {
		console.log(`Descriptor: ${descriptor}, Value: ${value}`);
		userProductSelection.set(descriptor, value);

		let categoryDescriptorIndex = productConfiguration.categoryDescriptors.indexOf(descriptor);
		if (categoryDescriptorIndex == -1) {
			console.log(`Error: categoryDescriptors not found`);
			return;
		}

		if (productConfiguration.categoryDescriptors.length !== userProductSelection.size) {
			console.log('Missing user input selection');
			return;
		}

		// Find Crowdtainer's index from selection
		let delimiter = productConfiguration.categoryDelimiter;
		campaignStaticUI?.descriptions.forEach((value, index) => {
			let finalString = '';
			userProductSelection.forEach((element) => {
				finalString += `${element}${delimiter}`;
			});
			// drop last delimiter
			finalString = finalString.substring(0, finalString.lastIndexOf(`${delimiter}`));
			if (value === finalString) {
				console.log(`Found match: ${finalString} at index ${index}`);
				currentSelection = index;
			}
		});

		// Update current selection price
		if (campaignStaticUI) {
			currentPrice = campaignStaticUI.prices[currentSelection];
			currentBasePrice = currentPrice / basePriceDenominator[currentSelection];
		} else {
			console.log(`Warning: prices not loaded yet.`);
			return;
		}
	}

	function loadData() {
		$joinSelection = $joinSelection;
		// Dynamic data
		if (campaignDynamicData == undefined) {
			campaignDynamicData = initializeCampaignDynamicStores(crowdtainerId);
		} else {
			campaignDynamicData = campaignDynamicStores.get(crowdtainerId);
		}
		if (campaignStaticUI === undefined) {
			return;
		}

		updateCurrentSelection(0, campaignStaticUI.prices[0]);

		console.log(`campaignStaticUI.descriptions: ${JSON.stringify(campaignStaticUI?.descriptions)}`);

		//  products display

		productTypes = new Set<string>();
		productTypesIndices = new Set<number>();
		descriptorForProduct = new Map<string, number>();
		campaignStaticUI.descriptions.forEach((productLine) => {
			let items = productLine.split(productConfiguration.categoryDelimiter);
			if (items.length != productConfiguration.categoryDescriptors.length) {
				let errorMessage = `
					Error: Product configuration mismatch:
					there must be a categoryDescriptor in productConfiguration for each delimiter, based on Crowdtainer's deployed product name.
					`;
				errorMessage += `Crowdtainer product name: ${productLine}`;
				errorMessage += `productData.length: ${items.length}`;
				errorMessage += `productConfiguration.categoryDescriptors.length: ${productConfiguration.categoryDescriptors.length}`;
				console.log(errorMessage);
				return;
			}

			items.forEach((item: string, index) => {
				if (!productTypes.has(item)) {
					descriptorForProduct.set(item, index);
					productTypes.add(item);
					productTypesIndices.add(index);
				}
			});
		});

		productOptions = new Array<ProductOptions>();

		for (let index = 0; index < productTypesIndices.size; index++) {
			let result = [...descriptorForProduct.entries()].filter(
				(value: [string, number]) => value[1] === index
			);
			console.log(`Found ${result[0]} ${result[1]} @ index ${index}`);
			let productSuboptions = new Array<string>();
			result.forEach((item) => {
				productSuboptions.push(item[0]);
			});

			productOptions.push({
				name: productConfiguration.categoryDescriptors[index],
				productSubOptions: productSuboptions
			});

			// set initial values
			setUserSelection(productConfiguration.categoryDescriptors[index], productSuboptions[0]);
		}
	}

	onMount(async () => {
		let fetchError = await campaignStaticStores.fetchData([projectId]);
		if (fetchError) {
			showToast(`Error fetching data: ${fetchError.details}`);
			return;
		}
		campaignStaticData = $campaignStaticStores.staticData[projectId];
		campaignStaticUI = $campaignStaticStores.UIData[projectId];

		loadData();
	});

	function updateCurrentSelection(index: number, price: number) {
		currentSelection = index;
		currentPrice = price;
		currentBasePrice = price / basePriceDenominator[index];
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

	$: $campaignDynamicData;

	// Immediatelly update UI elements related to connected wallet on wallet or connection change
	$: $connected,
		$accountAddress,
		initializeDataForWallet(campaignStaticData?.contractAddress, $accountAddress);

	$: campaignStaticUI, console.log(`campaignStaticUI: ${campaignStaticUI}`);
</script>

<div class="grid w-full gap-6 md:grid-cols-2 mt-2">
	<fieldset class="mt-4">
		<legend class="sr-only">Choose a product</legend>
		{#if campaignStaticUI}
			{#each productOptions as productOption}
				<div class="text-black text-md font-medium dark:text-gray-200">
					{productOption.name}
				</div>
				<ul class="flex flex-justify my-2 items-center">
					{#each productOption.productSubOptions as subOption, index}
						<li class="mx-2">
							<input
								checked={index == 0}
								type="radio"
								name={productOption.name}
								value={subOption}
								id={subOption}
								class="hidden peer"
								on:click={() => {
									setUserSelection(productOption.name, subOption);
								}}
							/>
							<label
								for={subOption}
								class="inline-flex items-center justify-between w-full px-4 py-3 text-gray-500 bg-white border border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-[#63cddd] peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700"
							>
								<div class="">{subOption.replace(productOption.name, '')}</div>
							</label>
						</li>
					{/each}
				</ul>
			{/each}
		{/if}
	</fieldset>
	<div class="md:pt-4">
		<div class="text-black text-md font-medium dark:text-gray-200">Price</div>
		{#if campaignStaticUI !== undefined && staticDataLoadStatus === LoadStatus.Loaded && currentPrice}
			{#key currentPrice}
				<p in:blur|global={{ duration: 200 }} class="text-primary productPrice">
					{currentPrice}
					{campaignStaticUI.tokenSymbol} ({`${currentBasePrice.toFixed(2)} ${
						campaignStaticUI.tokenSymbol
					}/${basePriceUnit}`})
				</p>
			{/key}
		{:else}
			<p class="px-2 productPrice">{loadingString}</p>
		{/if}
	</div>
</div>
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
