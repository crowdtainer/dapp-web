<script lang="ts">
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import { onMount, onDestroy } from 'svelte';

	import { clickOutside } from '$lib/clickOutside';

	// Wallet management
	import {
		walletState,
		shortenedAccount,
		connected,
		connect,
		disconnect,
		setupWallet,
		tearDownWallet
	} from '$lib/wallet';
	import { WalletType } from '$lib/walletStorage';

	// Toast
	import Toasts from '$lib/Toast/Toasts.svelte';
	import { addToast, type ToastData } from '$lib/Toast/ToastStore';
	import type { MessageType } from './Toast/MessageType';

	let mobileMenuOpen = false,
		profileMenuOpen = false;
	const flipMobileMenu = () => {
		mobileMenuOpen = !mobileMenuOpen;
	};
	const flipProfileMenu = () => {
		profileMenuOpen = !profileMenuOpen;
	};

	let updatesCallbackFunction: (message: string, type: MessageType) => void = (
		message: string,
		type: MessageType
	) => {
		let toast: ToastData = {
			id: Math.floor(Math.random() * 10000),
			type: type,
			dismissible: true,
			timeout: 7000,
			message: message
		};
		addToast(toast);
	};

	onMount(() => {
		setupWallet();
		walletState.setUpdatesCallback(updatesCallbackFunction);
		console.log(`import.meta.env.MODE: ` + import.meta.env.MODE);
	});

	onDestroy(() => {
		tearDownWallet();
		walletState.setUpdatesCallback(undefined);
	});

	$: path = $page.url.pathname;

</script>

<Toasts />

<nav class="bg-black">
	<div class="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
		<div class="relative flex items-center justify-between h-16">
			<div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
				<!-- Mobile menu button-->
				<button
					type="button"
					on:click={flipMobileMenu}
					class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
					aria-controls="mobile-menu"
					aria-expanded="false"
				>
					<span class="sr-only">Open main menu</span>
					<!-- Closed menu -->
					<svg
						class="{mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
					<!-- Open menu -->
					<svg
						class="{mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
				<div class="flex-shrink-0 flex items-center">
					<a href="/">
						<img class="block lg:hidden h-8 w-auto" src="CrowdtainerLogo.svg" alt="Workflow" />
					</a>
					<a href="/">
						<img
							class="hidden lg:block h-8 w-auto"
							src="crowdtainer_mark_white_text.svg"
							alt="Workflow"
						/>
					</a>
				</div>
				<div class="hidden sm:block sm:ml-6">
					<div class="flex space-x-4">
						<a href="/" class={path === '/' ? 'active-btn' : 'inactive-btn'} aria-current="page"
							>Campaigns</a
						>
						<a href="/Wallet" class={path === '/Wallet' ? 'active-btn' : 'inactive-btn'}>Wallet</a>
					</div>
				</div>
			</div>
			<div
				class="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0"
			>
				<!-- Profile dropdown -->
				{#if !$connected}
					<p class="bg-black pt-1 pr-4 text-right text-sm text-green-400">Disconnected.</p>
				{:else}
					<p class="bg-black pr-4 text-right text-sm text-green-400">{$shortenedAccount}</p>
				{/if}
				<div class="ml-3 relative">
					<div>
						<button
							on:click={flipProfileMenu}
							type="button"
							class="bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
							id="user-menu-button"
							aria-expanded="false"
							aria-haspopup="true"
						>
							<span class="sr-only">Open user menu</span>
							<img class="h-8 w-8 rounded-full" src="ethereum.svg" alt="" />
						</button>
					</div>

					{#if profileMenuOpen}
						<div
							use:clickOutside={() => (profileMenuOpen = false)}
							transition:fade={{ duration: 130 }}
							class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
							role="menu"
							aria-orientation="vertical"
							aria-labelledby="user-menu-button"
							tabindex="-1"
						>
							{#if $connected}
								<a
									on:click={async () => {
										await disconnect();
										profileMenuOpen = false;
									}}
									class="block px-4 py-2 text-sm text-gray-700"
									role="menuitem"
									tabindex="-1"
									id="user-menu-item-0">Disconnect wallet</a
								>
							{:else}
								<a
									on:click={async () => {
										await connect(WalletType.WalletConnect);
										profileMenuOpen = false;
									}}
									class="block px-4 py-2 text-sm text-gray-700"
									role="menuitem"
									tabindex="-1"
									id="user-menu-item-0">Connect wallet</a
								>
								{#if import.meta.env.MODE === "development"}
								<a
									on:click={async () => {
										await connect(WalletType.Injected);
										profileMenuOpen = false;
									}}
									class="block px-4 py-2 text-sm text-gray-700"
									role="menuitem"
									tabindex="-1"
									id="user-menu-item-0">Connect to injected wallet</a
								>
								{/if}
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Mobile menu, show/hide based on menu state. -->
	{#if mobileMenuOpen}
		<div transition:fade={{ duration: 200 }} class="sm:hidden" id="mobile-menu">
			<div class="px-2 pt-2 pb-3 space-y-1">
				<!-- Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" -->
				<a
					href="/"
					class={path === '/' ? 'mobile-active-btn' : 'mobile-inactive-btn'}
					aria-current="page">Campaigns</a
				>
				<a href="/Wallet" class={path === '/Wallet' ? 'mobile-active-btn' : 'mobile-inactive-btn'}
					>Wallet</a
				>
			</div>
		</div>
	{/if}
</nav>
