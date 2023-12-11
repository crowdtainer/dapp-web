<script lang="ts">
	// controls whether the wallet connection button / display is loaded and shown
	export let displayWalletConnection = true;

	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import { onMount, onDestroy } from 'svelte';

	import { Clipboard } from '@steeze-ui/heroicons';
	import { clickOutside } from '$lib/Utils/clickOutside';

	// Wallet management
	import {
		walletState,
		shortOrENSNamedAccount,
		connected,
		connect,
		disconnect,
		setupWallet,
		tearDownWallet
	} from '$lib/Utils/wallet';
	import { ConnectionState, WalletType } from '$lib/Utils/walletStorage';

	// Toast
	import { addToast, type ToastData } from '$lib/Toast/ToastStore';
	import type { MessageType } from './Toast/MessageType';
	import { copyToClipBoardAndNotify } from './Utils/clipboard.js';
	import { Icon } from '@steeze-ui/svelte-icon';
	let VITE_WALLET_CONNECT_CHAIN_ID = import.meta.env.VITE_WALLET_CONNECT_CHAIN_ID;

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
		if (displayWalletConnection) {
			console.log(`import.meta.env.MODE: ` + import.meta.env.MODE);
			walletState.setUpdatesCallback(updatesCallbackFunction);
			setupWallet();
		}
	});

	onDestroy(() => {
		if (displayWalletConnection) {
			tearDownWallet();
		}
	});

	$: path = $page.url.pathname;
</script>


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
		<div class="flex-1 flex items-center sm:items-stretch justify-start">
			<div class="flex-shrink-0 flex items-center">
				<a href="/">
					<img
						class="block lg:hidden h-8 w-auto mx-16 sm:mx-0"
						src="/images/site/CrowdtainerLogo.svg"
						alt="Crowdtainer"
					/>
				</a>
				<a href="/">
					<img
						class="hidden lg:block h-8 w-auto"
						src="/images/site/TopNavbarLogo.svg"
						alt="Crowdtainer"
					/>
				</a>
			</div>
			<div class="hidden sm:block sm:ml-6">
				<div class="flex space-x-4">
					<a href="/" class={path === '/' ? 'active-btn' : 'inactive-btn'} aria-current="page"
						>Campaigns</a
					>
					<a href="/Wallet" class={path === '/Wallet' ? 'active-btn' : 'inactive-btn'}>Wallet</a>
					<a href="/About" class={path === '/About' ? 'active-btn' : 'inactive-btn'}>About</a>
				</div>
			</div>
		</div>

		<div
			class="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-3 sm:pr-0"
		>
			<!-- Profile dropdown -->
			{#if displayWalletConnection}
				{#if $connected}
					<div class="pr-2 md:pr-4 text-right text-sm text-white">
						{#await $shortOrENSNamedAccount}
							Loading
						{:then address}
							<div class="flex justify-center">
								<button
									on:click={() => {
										copyToClipBoardAndNotify('Connected wallet address', $walletState.account);
									}}
								>
									<span class="inline-flex items-center">
										<span class="relative flex h-2 w-2 mx-2">
											<span class="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
										</span>
										<span>{address} </span>
										<span><Icon src={Clipboard} class="self-center ml-2" size="16" /></span>
									</span>
								</button>
							</div>
						{/await}
					</div>
				{:else if $walletState.connectionState === ConnectionState.ConnectedButNoAccountAvailable}
					<div class="inline-flex items-baseline">
						<span class="relative flex h-2 w-2 mx-2 float-right">
							<span
								class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"
							/>
							<span class="relative inline-flex rounded-full h-2 w-2 bg-yellow-400" />
						</span>
						<p class="pt-1 text-right text-sm text-white max-w-[120px] md:max-w-full">Wallet locked</p>
					</div>
				{:else if $walletState.connectionState === ConnectionState.ConnectedToUnsupportedNetwork}
					<div class="inline-flex items-baseline">
						<span class="relative flex h-2 w-2 mx-2 float-right">
							<span
								class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"
							/>
							<span class="relative inline-flex rounded-full h-2 w-2 bg-yellow-400" />
						</span>
						<p class="pt-1 text-right text-sm text-white max-w-[120px] md:max-w-full">
							Change your wallet to chain id {VITE_WALLET_CONNECT_CHAIN_ID}
						</p>
					</div>
				{:else if $walletState.connectionState === ConnectionState.Disconnected}
					<div class="inline-flex items-baseline">
						<span class="relative flex h-2 w-2 mx-2 float-right">
							<span class="relative inline-flex rounded-full h-2 w-2 bg-red-400" />
						</span>
						<p class="pt-1 text-right text-sm text-white max-w-[120px] md:max-w-full">
							Disconnected
						</p>
					</div>
				{/if}
				<div class="ml-2 relative">
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
							<img class="h-8 w-8 rounded-full" src="/images/site/Ethereum.svg" alt="" />
						</button>
					</div>

					{#if profileMenuOpen}
						<div
							use:clickOutside={() => (profileMenuOpen = false)}
							transition:fade|global={{ duration: 130 }}
							class="origin-top-right absolute right-0 mt-2 w-52 rounded-md shadow-lg py-1 bg-white text-gray-800 dark:text-gray-200 dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none"
							role="menu"
							aria-orientation="vertical"
							aria-labelledby="user-menu-button"
							tabindex="-1"
						>
							{#if $walletState.connectionState !== ConnectionState.Disconnected}
								<!-- svelte-ignore a11y-invalid-attribute -->
								<a
									href="#"
									on:click={async () => {
										await disconnect();
										profileMenuOpen = false;
									}}
									class="block px-4 py-4 text-sm"
									role="menuitem"
									tabindex="-1"
									id="user-menu-item-0">Disconnect wallet</a
								>
							{:else}
								<!-- svelte-ignore a11y-invalid-attribute -->
								<a
									href="#"
									on:click={async () => {
										await connect(WalletType.WalletConnect);
										profileMenuOpen = false;
									}}
									class="block px-4 py-4 text-sm"
									role="menuitem"
									tabindex="-1"
									id="user-menu-item-0">Connect to external wallet</a
								>
								<!-- svelte-ignore a11y-invalid-attribute -->
								<a
									href="#"
									on:click={async () => {
										await connect(WalletType.Injected);
										profileMenuOpen = false;
									}}
									class="block px-4 py-4 text-sm"
									role="menuitem"
									tabindex="-1"
									id="user-menu-item-0">Connect to browser wallet</a
								>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Mobile menu, show/hide based on menu state. -->
{#if mobileMenuOpen}
	<div transition:fade|global={{ duration: 200 }} class="sm:hidden" id="mobile-menu">
		<div class="px-2 pt-2 pb-3 space-y-1">
			<!-- Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" -->
			<a
				href="/"
				class={path === '/' ? 'mobile-active-btn' : 'mobile-inactive-btn'}
				aria-current="page"
				on:click={() => {
					mobileMenuOpen = false;
				}}>Campaigns</a
			>
			<a
				href="/Wallet"
				class={path === '/Wallet' ? 'mobile-active-btn' : 'mobile-inactive-btn'}
				on:click={() => {
					mobileMenuOpen = false;
				}}>Wallet</a
			>
			<a
				href="/About"
				class={path === '/About' ? 'mobile-active-btn' : 'mobile-inactive-btn'}
				on:click={() => {
					mobileMenuOpen = false;
				}}>About</a
			>
		</div>
	</div>
{/if}
