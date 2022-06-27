<script lang="ts">

// import WalletConnectProvider from '@walletconnect/web3-provider/dist/umd/index.min.js';
// import { defaultEvmStores, connected, chainId, signerAddress, provider, signer } from 'svelte-ethers-store' ;

import { ethers, providers } from "ethers";

import { onMount } from 'svelte';
import { clickOutside } from '$lib/clickOutside';
import { page } from '$app/stores';
import { fade } from 'svelte/transition';

// const OPTIMISM_KOVAN = import.meta.env.VITE_OPTIMISM_KOVAN_RPC;
// const LOCALHOST_RPC = import.meta.env.VITE_LOCALHOST_RPC;

let localProvider: WalletConnectProvider;

let mobileMenuOpen = false, profileMenuOpen = false;
const flipMobileMenu = () => { mobileMenuOpen = !mobileMenuOpen; }
const flipProfileMenu = () => { profileMenuOpen = !profileMenuOpen; }

$: path = $page.url.pathname;

// Web3
onMount(async () => {
    connectWallet();
});

async function connectWallet() {
  try {
    // localProvider = new WalletConnectProvider({rpc: {
      // 10: "OPTIMISM_KOVAN"}
      // 1: LOCALHOST_RPC}
    // });
    //  Wrap with Web3Provider from ethers.js
    // const web3Provider = new providers.Web3Provider(localProvider);
    // defaultEvmStores.setProvider(web3Provider);
    // if(!$connected) {
      // await localProvider.enable();
    // }

  } catch(error) {
    console.log("Error: " + error);
  }
}

async function disconnectWallet() {
  // localProvider.disconnect();
}

</script>

<!-- {#if !$connected}
<p class="text-sm text-green-600">Disconnected.</p>
{:else}
<p class="text-sm text-green-600">Connected to chain id {$chainId} with account {$signerAddress}</p>
{/if} -->

<nav class="bg-black">
    <div class="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
      <div class="relative flex items-center justify-between h-16">
        <div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
          <!-- Mobile menu button-->
          <button type="button" on:click={flipMobileMenu} class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" aria-controls="mobile-menu" aria-expanded="false">
            <span class="sr-only">Open main menu</span>
            <!-- Closed menu -->
            <svg class="{mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <!-- Open menu -->
            <svg class="{mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
          <div class="flex-shrink-0 flex items-center">
            <a href="/">
              <img class="block lg:hidden h-8 w-auto" src="CrowdtainerLogo.svg" alt="Workflow">
            </a>
            <a href="/">
            <img class="hidden lg:block h-8 w-auto" src="crowdtainer_mark_white_text.svg" alt="Workflow">
          </a>
          </div>
          <div class="hidden sm:block sm:ml-6">
            <div class="flex space-x-4" >
              <a href="/" class="{path === '/' ? "active-btn" : "inactive-btn"}" aria-current="page">Campaigns</a>
              <a href="/Cart" class="{path === '/Cart' ? "active-btn" : "inactive-btn"}">Cart</a>
            </div>
          </div>
        </div>
        <div class="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
          <!-- <button type="button" class="bg-gray-800 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"> -->
            <!-- <span class="sr-only">View notifications</span> -->
            <!-- Heroicon name: outline/bell
            <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg> -->
          <!-- </button> -->

          <!-- Profile dropdown -->
          <div class="ml-3 relative">
            <div>
              <button on:click={flipProfileMenu} type="button" class="bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white" id="user-menu-button" aria-expanded="false" aria-haspopup="true">
                <span class="sr-only">Open user menu</span>
                <img class="h-8 w-8 rounded-full" src="ethereum.svg" alt="">
              </button>
            </div>
  
            {#if profileMenuOpen}
              <div use:clickOutside={() => (profileMenuOpen = false)} transition:fade="{{duration: 130}}" class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabindex="-1">
                <!-- {#if $connected}
                <a href='#' on:click={async () => ( await disconnectWallet())} class="block px-4 py-2 text-sm text-gray-700" role="menuitem" tabindex="-1" id="user-menu-item-0">Disconnect wallet</a> -->
                <!-- {:else} -->
                  <a href='#' on:click={async () => ( await connectWallet())} class="block px-4 py-2 text-sm text-gray-700" role="menuitem" tabindex="-1" id="user-menu-item-0">Connect wallet</a>
                <!-- {/if} -->
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  
    <!-- Mobile menu, show/hide based on menu state. -->
    {#if mobileMenuOpen}
      <div transition:fade="{{duration:200}}" class="sm:hidden" id="mobile-menu">
        <div class="px-2 pt-2 pb-3 space-y-1">
          <!-- Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" -->
          <a href="/" class="{path === '/' ? "mobile-active-btn" : "mobile-inactive-btn"}" aria-current="page">Campaigns</a>
          <a href="/Cart" class="{path === '/Cart' ? "mobile-active-btn" : "mobile-inactive-btn"}">Cart</a>
        </div>
      </div>
    {/if}
  </nav>