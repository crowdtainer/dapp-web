 <script lang="ts">
	import { projects } from './data/projects.json';
	import Project from '$lib/Project.svelte';
</script>

<svelte:head>
	<title>Crowdtainer</title>
</svelte:head>

<header class="divider">
	<div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
		<h1 class="text-2xl font-bold text-white">Campaigns</h1>
	</div>
</header>

<main class="">	<!-- Project Container start -->
	<header class="campaignSection">
		<div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
			<h1 class="font-mono  text-2xl font-bold">Active</h1>
		</div>
	</header>

	{#each projects as project}

	<Project  {...project}/>

	{/each}

	<!-- Project Container End -->

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
