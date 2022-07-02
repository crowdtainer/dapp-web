 <script lang="ts">
	import { projects } from './data/projects.json';
	import Project from '$lib/Project.svelte';
</script>

<svelte:head>
	<title>Crowdtainer</title>
</svelte:head>

<header class="bg-black">
	<div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
		<h1 class="text-2xl font-bold text-white">Active</h1>
	</div>
</header>

<main>	<!-- Project Container start -->

	{#each projects as project}

	<Project  {...project}/>

	{/each}

	<!-- Project Container End -->

	<header class="bg-gradient-to-r from-black to-gray-700 shadow">
		<div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
			<h1 class="text-2xl font-bold text-white">Upcoming</h1>
		</div>
	</header>

	<div class="max-w-7xl mx-auto py-6 sm:px-0 lg:px-0">
		<div class="px-2 py-2 sm:px-0">
			<div class="border-2 border-dashed border-gray-200 rounded-lg h-20">
				<p class="text-white text-center m-5">More projects coming soon.</p>
			</div>
		</div>
	</div>

	<header class="bg-gradient-to-r from-black to-gray-700 shadow">
		<div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
			<h1 class="text-2xl font-bold text-white">Expired / Previous</h1>
		</div>
	</header>

	<div class="max-w-7xl mx-auto py-6 sm:px-0 lg:px-0">
		<div class="px-2 py-2 sm:px-0">
			<div class="border-2 border-dashed border-gray-200 rounded-lg h-20">
				<p class="text-white text-center m-5">Nothing to see here yet.</p>
			</div>
		</div>
	</div>
</main>
