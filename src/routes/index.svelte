<script lang="ts">
	import { onMount } from 'svelte';

	import { projects } from './data/projects.json';
	import Project from '$lib/Project.svelte';
	import { fetchStaticData } from '$lib/api';

	import {
		LoadStatus,
		prepareForUI,
		type UIFields
	} from '$lib/Converters/CrowdtainerData';

	import type { CrowdtainerStaticModel } from '$lib/Model/CrowdtainerModel';

	let campaignStaticData = new Array<CrowdtainerStaticModel>();
	let campaignStaticUI: UIFields[] = new Array<UIFields>();
	let staticDataLoadStatus: LoadStatus = LoadStatus.Loading;

	function projectIds(): number[] {
		let projectIds: number[] = [];
		for (let project of projects) {
			projectIds.push(project.crowdtainerId);
		}
		return projectIds;
	}

	onMount(async () => {
		try {
			let projects = projectIds();

			let result = await fetchStaticData(projects);
			if (result.isOk()) {
				campaignStaticData = result.unwrap();
				await campaignStaticData.forEach((data: CrowdtainerStaticModel) => {
					campaignStaticUI.push(prepareForUI(data));
				});
				staticDataLoadStatus = LoadStatus.Loaded;
			} else {
				// TODO: Show user UI/pop-up with error.
				console.log(result.unwrapErr());
				staticDataLoadStatus = LoadStatus.FetchFailed;
			}
		} catch (error) {
			console.log(`Error: ${error}`);
		}
	});
</script>

<svelte:head>
	<title>Crowdtainer</title>
</svelte:head>

<header class="divider">
	<div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
		<h1 class="text-2xl font-bold text-white">Campaigns</h1>
	</div>
</header>

<main class="">
	<header class="campaignSection">
		<div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
			<h1 class="font-mono  text-2xl font-bold">Active</h1>
		</div>
	</header>

	{#each projects as project, index}
		{#if index !== 0}
			<div class="border-t-2 border-dashed" />
		{/if}
		{#if campaignStaticData.length === 0}
			<Project
				{...project}
				{staticDataLoadStatus}
				campaignStaticData={undefined}
				campaignStaticUI={undefined}
			/>
		{:else}
			<Project
				{...project}
				{staticDataLoadStatus}
				campaignStaticData={campaignStaticData[index]}
				campaignStaticUI={campaignStaticUI[index]}
			/>
		{/if}
	{/each}

	{#if campaignStaticData.length === 0}
		<div class="max-w-7xl mx-auto py-6 sm:px-0 lg:px-0">
			<div class="px-2 py-6 sm:px-0">
				<div class="mx-6 border-2 border-dashed border-gray-200 rounded-lg h-20">
					<p class="text-center m-5">Nothing to see here yet.</p>
				</div>
			</div>
		</div>
	{/if}

	<header class="campaignSection">
		<div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
			<h1 class="font-mono text-2xl font-bold">Upcoming</h1>
		</div>
	</header>

	<div class="max-w-7xl mx-auto py-6 sm:px-0 lg:px-0">
		<div class="px-2 py-6 sm:px-0">
			<div class="mx-6 border-2 border-dashed border-gray-200 rounded-lg h-20">
				<p class="text-center m-5">More projects coming soon.</p>
			</div>
		</div>
	</div>

	<header class="campaignSection">
		<div class="font-mono max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
			<h1 class="text-2xl font-bold">Expired / Previous</h1>
		</div>
	</header>

	<div class="max-w-7xl mx-auto py-6 sm:px-0 lg:px-0">
		<div class="px-2 py-6 sm:px-0">
			<div class="mx-6 border-2 border-dashed border-gray-200 rounded-lg h-20">
				<p class="text-center m-5">Nothing to see here yet.</p>
			</div>
		</div>
	</div>
</main>
