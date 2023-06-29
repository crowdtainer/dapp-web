<script lang="ts">
	import '../app.css';
	import TopMenuNav from '$lib/TopMenuNav.svelte';
	import FooterNav from '$lib/FooterNav.svelte';
	import '@fontsource/open-sans';

	import { page } from '$app/stores';
	import Toasts from '$lib/Toast/Toasts.svelte';

	let backgroundColor = '';
	let backgroundStyle = '';
	let backdropStyle = '';
	let footerBackgroundColor = '';
	let navBarStyle = '';

	function setStyleForPage(path: string) {
		if (path === '/') {
			navBarStyle = 'bg-[#172939] dark:backdrop-blur-none dark:backdrop-blur-sm';
			backgroundColor = 'bg-white dark:bg-[#172939]';
			footerBackgroundColor = 'bg-[#FFF8F0] dark:bg-[#153437]';
			backgroundStyle = ``;
			backdropStyle = 'backdrop-blur-[0px] dark:backdrop-brightness-[0.6]';
		} else {
			navBarStyle = 'bg-[#172939] dark:backdrop-blur-none dark:backdrop-blur-sm';
			backgroundColor = 'bg-white dark:bg-[#101921]';
			footerBackgroundColor = '';
			backgroundStyle = '';
			backdropStyle = '';
		}
	}

	$: setStyleForPage($page.url.pathname);
</script>

<Toasts />

<div class={backgroundColor}>
	<div class={backgroundStyle}>
		<div class="min-h-screen {backdropStyle}">
			<div class="">
				<nav class="{navBarStyle} z-50">
					<TopMenuNav />
				</nav>
			</div>
			<main class="">
				<slot />
			</main>
		</div>
	</div>
	<div class="sticky top-[300vh] {footerBackgroundColor}">
		<FooterNav />
	</div>
</div>
