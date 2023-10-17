<script lang="ts">
	import { onMount } from 'svelte';
	import { blur } from 'svelte/transition';
	import { derived, type Readable } from 'svelte/store';

	import {
		initializeCampaignDynamicStores,
		campaignDynamicStores
	} from '$lib/Stores/campaignStore';
	import { joinSelection } from '$lib/Stores/userStore';

	import { campaignStaticStores } from './Stores/campaignStaticDataStore.js';

	import type { CrowdtainerDynamicModel, SplitSelection } from '$lib/Model/CrowdtainerModel';
	import { LoadStatus, loadingString } from '$lib/Converters/CrowdtainerData';

	import { connected, accountAddress } from '$lib/Utils/wallet';

	import { initializeDataForWallet } from './Stores/dataForWalletStore.js';
	import { showToast } from './Toast/ToastStore.js';

	export let crowdtainerId: number;
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

	initializeDataForWallet($campaignStaticData.contractAddress, $accountAddress);

	function setUserSelection(descriptor: string, value: string) {
		// console.log(`Descriptor: ${descriptor}, Value: ${value}`);
		userProductSelection.set(descriptor, value);

		let categoryDescriptorIndex = productConfiguration.categoryDescriptors.indexOf(descriptor);
		if (categoryDescriptorIndex == -1) {
			console.log(`Error: categoryDescriptors not found`);
			return;
		}

		if (productConfiguration.categoryDescriptors.length !== userProductSelection.size) {
			console.log('No user product selection yet.');
			return;
		}

		// Find Crowdtainer's index from selection
		let delimiter = productConfiguration.categoryDelimiter;
		$campaignStaticUI.descriptions.forEach((value, index) => {
			let finalString = '';
			userProductSelection.forEach((element) => {
				finalString += `${element}${delimiter}`;
			});
			// drop last delimiter
			finalString = finalString.substring(0, finalString.lastIndexOf(`${delimiter}`));
			if (value === finalString) {
				// console.log(`Found match: ${finalString} at index ${index}`);
				currentSelection = index;
			}
		});

		// Update current selection price
		if ($campaignStaticUI) {
			currentPrice = $campaignStaticUI.prices[currentSelection];
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
		if ($campaignStaticUI === undefined) {
			return;
		}

		updateCurrentSelection(0, $campaignStaticUI.prices[0]);

		//  products display

		productTypes = new Set<string>();
		productTypesIndices = new Set<number>();
		descriptorForProduct = new Map<string, number>();
		$campaignStaticUI.descriptions.forEach((productLine) => {
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
			// console.log(`Found ${result[0]} ${result[1]} @ index ${index}`);
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
		loadData();
	});

	function updateCurrentSelection(index: number, price: number) {
		currentSelection = index;
		currentPrice = price;
		currentBasePrice = price / basePriceDenominator[index];
	}

	function addProduct() {
		if (staticDataLoadStatus === LoadStatus.FetchFailed || $campaignStaticUI === undefined) {
			return;
		}
		let updatedQuantity = $joinSelection.get(crowdtainerId);
		if (updatedQuantity) {
			updatedQuantity[currentSelection]++;
			$joinSelection.set(crowdtainerId, updatedQuantity);
			$joinSelection = $joinSelection;
		} else {
			let quantities: number[] = new Array<number>($campaignStaticUI.prices.length).fill(0);
			quantities[currentSelection]++;
			$joinSelection.set(crowdtainerId, quantities);
			$joinSelection = $joinSelection;
		}
	}

	$: $campaignDynamicData;

	// Immediatelly update UI elements related to connected wallet on wallet or connection change
	$: $connected,
		$accountAddress,
		initializeDataForWallet($campaignStaticData.contractAddress, $accountAddress);
</script>

<div class="grid w-full gap-2 md:grid-cols-1">
	<div class="md:pt-4">
		<div class="text-black text-md font-medium dark:text-gray-200">Price</div>
		{#if staticDataLoadStatus === LoadStatus.Loaded && currentPrice}
			{#key currentPrice}
				<p in:blur|global={{ duration: 200 }} class="text-primary productPrice">
					{currentPrice}
					{$campaignStaticUI.tokenSymbol} ({`${currentBasePrice.toFixed(2)} ${
						$campaignStaticUI.tokenSymbol
					}/${basePriceUnit}`})
				</p>
			{/key}
		{:else}
			<p class="px-2 productPrice">{loadingString}</p>
		{/if}
	</div>
	<fieldset class="mt-4">
		<legend class="sr-only">Choose a product</legend>
		{#if productOptions && staticDataLoadStatus === LoadStatus.Loaded}
			<div class="flex flex-wrap">
				{#each productOptions as productOption}
					<div class="mx-0 max-w-md md:my-2">
						<div class="text-black text-md font-medium dark:text-gray-200">
							{productOption.name}
						</div>
						<ul class="grid grid-flow-col auto-cols-max my-2 items-center mx-4">
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
					</div>
				{/each}
			</div>
		{/if}
	</fieldset>
</div>
<div class="dark:text-white container mx-auto">
	<button
		on:click={() => {
			addProduct();
		}}
		class="px-2 mt-5 w-full md:w-4/6 lg:w-2/6 btn btn-primary"
	>
		↓ Add to pre-order
	</button>
</div>
