<script lang="ts">
	import '../app.css';
	import TopMenuNav from '$lib/TopMenuNav.svelte';
	import FooterNav from '$lib/FooterNav.svelte';
	import "@fontsource/open-sans";
</script>

<style>
  :global(body) {
    font-family: "Open Sans", sans-serif;
  }
</style>

<div class="flex flex-col h-screen ">
	<TopMenuNav />
	<main class="flex-grow bg-blue-50 dark:bg-[#0D1116]">
		<slot />
	</main>
	<FooterNav />
</div>
