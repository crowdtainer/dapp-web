<script lang="ts">
	import '../app.css';
	import TopMenuNav from '$lib/TopMenuNav.svelte';
	import FooterNav from '$lib/FooterNav.svelte';
	import '@fontsource/open-sans';
</script>

<!-- mx-auto w-full -->
<div class="bg-gray-100 dark:bg-[#0d1116]">
	<!-- bg-contain bg-no-repeat bg-top dark:bg-[url('/images/site/hero-bg-2x.webp') -->
	<div class="min-h-screen">
		<div class="">
			<TopMenuNav />
		</div>
		<!-- <div class="grow"> -->
		<main class="">
			<slot />
		</main>
		<!-- </div> -->
		<div class="sticky top-[300vh]">
			<FooterNav />
		</div>
	</div>
</div>

<!-- <style>
	:global(body) {
		font-family: 'Open Sans', sans-serif;
	}
</style> -->
