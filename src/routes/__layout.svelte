<script lang="ts">
	import '../app.css';
	import TopMenuNav from '$lib/TopMenuNav.svelte';
	import FooterNav from '$lib/FooterNav.svelte';
</script>

<div class="flex flex-col h-screen ">
	<TopMenuNav />
	<main class="flex-grow bg-blue-50 dark:bg-gray-900">
		<slot />
	</main>
	<FooterNav />
</div>
