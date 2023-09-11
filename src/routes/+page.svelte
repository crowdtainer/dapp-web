<script lang="ts">
	import { onMount } from 'svelte';

	import { projects, Vouchers721Address } from './Data/projects.json';
	import Project from '$lib/Project.svelte';
	import { fetchStaticData } from '$lib/api';

	import { Icon } from '@steeze-ui/svelte-icon';
	import { UserGroup } from '@steeze-ui/heroicons';
	import '@fontsource/red-hat-display';

	import {
		LoadStatus,
		loadingString,
		prepareForUI,
		toDate,
		type UIFields
	} from '$lib/Converters/CrowdtainerData';
	import type { CrowdtainerStaticModel } from '$lib/Model/CrowdtainerModel';
	import EmptySection from '$lib/EmptySection.svelte';

	let campaignStaticData = new Map<number, CrowdtainerStaticModel>();
	let campaignStaticUI: Map<number, UIFields> = new Map<number, UIFields>();
	let staticDataLoadStatus: LoadStatus = LoadStatus.Loading;
	let networkFailedMessage = 'Error loading data.';

	let activeProjects: number[] = [];
	let upcomingProjects: number[] = [];
	let pastProjects: number[] = [];

	function projectIds(): number[] {
		let projectIds: number[] = [];
		for (let project of projects) {
			projectIds.push(project.crowdtainerId);
		}
		return projectIds;
	}

	function sortProjects() {
		let nowInMs = new Date().getTime();
		for (let [crowdtainerId, data] of campaignStaticData.entries()) {
			let startInMs = toDate(data.startDate).getTime();
			let endInMs = toDate(data.endDate).getTime();
			if (nowInMs < startInMs) {
				upcomingProjects = [...upcomingProjects, crowdtainerId];
			} else if (nowInMs < endInMs) {
				activeProjects = [...activeProjects, crowdtainerId];
			} else {
				pastProjects = [...pastProjects, crowdtainerId];
			}
		}
	}

	function projectFromCrowdtainerId(id: number) {
		let filtered = projects.filter((element) => {
			return element.crowdtainerId === id;
		});
		return filtered[0];
	}

	onMount(async () => {
		try {
			let result = await fetchStaticData(projectIds());
			if (result.isOk()) {
				let data = result.unwrap();
				for (let index = 0; index < data.length; index++) {
					campaignStaticData.set(projects[index].crowdtainerId, data[index]);
					campaignStaticUI.set(projects[index].crowdtainerId, prepareForUI(data[index]));
				}
				staticDataLoadStatus = LoadStatus.Loaded;
			} else {
				// TODO: Show user UI/pop-up with error.
				console.log('Error: %o', result.unwrapErr());
				staticDataLoadStatus = LoadStatus.FetchFailed;
			}
			sortProjects();
		} catch (error) {
			console.log(`Error: ${error}`);
		}
	});
</script>

<svelte:head>
	<title>Crowdtainer</title>
</svelte:head>

<!-- <header class="ct-divider">
	<div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
		<h1 class="text-xl font-bold text-white">Campaigns</h1>
	</div>
</header> -->

<main class="">
	<div class="grid place-items-center">
		<Icon src={UserGroup} theme="solid" class="text-gray-800 dark:text-gray-200 mt-20" size="42" />
		<p class="font-display dark:text-gray-200 text-xl md:mb-2 md:text-2xl my-5">
			Group Buying Campaigns
		</p>

		<div class=" w-full grid place-items-center pb-10">
			<div class="w-full xl:w-5/6 max-w-screen-2xl">
				<div>
					<div class="campaignSection">
						<div class="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
							<h1 class="font-display text-lg lg:text-xl">Active</h1>
						</div>
					</div>
					<div>
						{#each activeProjects as project, index}
							{#if index !== 0}
								<div class="dashedBorder" />
							{/if}
							<Project
								vouchers721Address={Vouchers721Address}
								{...projectFromCrowdtainerId(project)}
								{staticDataLoadStatus}
								campaignStaticData={campaignStaticData.get(project)}
								campaignStaticUI={campaignStaticUI.get(project)}
								basePrices={projects[index].basePriceDenominator}
								basePriceUnit={projects[index].basePriceUnit}
							/>
						{/each}
					</div>

					<div>
						{#if staticDataLoadStatus === LoadStatus.Loading}
							<EmptySection emptyMessage={loadingString} />
						{:else if staticDataLoadStatus === LoadStatus.FetchFailed}
							<EmptySection emptyMessage={networkFailedMessage} isError={true} />
						{:else if activeProjects.length === 0}
							<EmptySection emptyMessage="No active projects currently." />
						{/if}
					</div>
				</div>

				<div>
					<div class="campaignSection">
						<div class="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
							<h1 class="font-display text-lg lg:text-xl">Upcoming</h1>
						</div>
					</div>

					<div>
						{#each upcomingProjects as project, index}
							{#if index !== 0}
								<div class="dashedBorder" />
							{/if}
							<Project
								vouchers721Address={Vouchers721Address}
								{...projectFromCrowdtainerId(project)}
								{staticDataLoadStatus}
								campaignStaticData={campaignStaticData.get(project)}
								campaignStaticUI={campaignStaticUI.get(project)}
								basePrices={projects[index].basePriceDenominator}
								basePriceUnit={projects[index].basePriceUnit}
							/>
						{/each}
					</div>

					<div>
						{#if staticDataLoadStatus === LoadStatus.Loading}
							<EmptySection emptyMessage={loadingString} />
						{:else if staticDataLoadStatus === LoadStatus.FetchFailed}
							<EmptySection emptyMessage={networkFailedMessage} isError={true} />
						{:else if upcomingProjects.length === 0}
							<EmptySection emptyMessage="More projects coming soon." />
						{/if}
					</div>
				</div>

				<div>
					<div class="campaignSection">
						<div class="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
							<h1 class="font-display text-lg lg:text-xl">Previous</h1>
						</div>
					</div>

					<div>
						{#each pastProjects as project, index}
							{#if index !== 0}
								<div class="dashedBorder" />
							{/if}
							<Project
								vouchers721Address={Vouchers721Address}
								{...projectFromCrowdtainerId(project)}
								{staticDataLoadStatus}
								campaignStaticData={campaignStaticData.get(project)}
								campaignStaticUI={campaignStaticUI.get(project)}
								basePrices={projects[index].basePriceDenominator}
								basePriceUnit={projects[index].basePriceUnit}
							/>
						{/each}
					</div>

					<div>
						{#if staticDataLoadStatus === LoadStatus.Loading}
							<EmptySection emptyMessage={loadingString} />
						{:else if staticDataLoadStatus === LoadStatus.FetchFailed}
							<EmptySection emptyMessage={networkFailedMessage} isError={true} />
						{:else if pastProjects.length === 0}
							<EmptySection emptyMessage="Nothing to see here yet." />
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</main>
