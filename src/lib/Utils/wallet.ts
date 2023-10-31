import WalletConnectProvider from '@walletconnect/web3-provider/dist/umd/index.min.js';
// Can't use proper import, see: https://github.com/WalletConnect/walletconnect-monorepo/issues/864
// import WalletConnectProvider from "@walletconnect/web3-provider";
import { ethers, providers, Signer } from 'ethers';
import type { TypedDataSigner } from "@ethersproject/abstract-signer";

import { writable, derived } from 'svelte/store';

import { type WalletState, WalletType, ConnectionState, persistState, getLastState, resetStorageState } from '$lib/Utils/walletStorage';
import { MessageType } from '../Toast/MessageType';

const VITE_WALLET_CONNECT_BRIDGE_SERVER: string = import.meta.env.VITE_WALLET_CONNECT_BRIDGE_SERVER;
const NO_WALLET_DETECTED = '---';

export const ssr = false;

export const walletState = createWalletStore();
export const connected = derived(walletState, $walletState => $walletState.connectionState === ConnectionState.Connected);
export const accountAddress = derived(walletState, $walletState => {
    return ($walletState.account) ? ethers.utils.getAddress($walletState.account) : '';
});
export const shortenedAccount = derived(walletState, $walletState => {
    return shortenAddress($walletState.account);
});
export const shortOrENSNamedAccount = derived(walletState, async $walletState => {
    if ($walletState === undefined) {
        dispatchMessage("Unable to load wallet store.", MessageType.Warning);
        return NO_WALLET_DETECTED;
    }

    if ($walletState.account === undefined) {
        // dispatchMessage("Wallet account not found.", MessageType.Warning);
        return NO_WALLET_DETECTED;
    }
    else if (web3Provider === undefined) {
        console.log("web3Provider not found.");
        return NO_WALLET_DETECTED;
    }
    let reversedResolve: string | null;
    try {
        reversedResolve = await web3Provider.lookupAddress($walletState.account);
    } catch (error) {
        console.log(`${error}`);
        return shortenAddress($walletState.account);
    }
    // fallback to shortenedAccount format
    if (reversedResolve === null) return shortenAddress($walletState.account);
    return reversedResolve;
});

export function shortenAddress(walletAddress: string | undefined): string {
    return (walletAddress) ? walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4) : NO_WALLET_DETECTED;
}

export function injectedProviderAvailableNow(): boolean {
    return window.ethereum !== undefined;
}

const RPC_BACKEND: string = import.meta.env.VITE_WALLET_CONNECT_RPC;
const CHAIN_ID: number = import.meta.env.VITE_WALLET_CONNECT_CHAIN_ID;

interface Window {
    ethereum?: import('ethers').providers.ExternalProvider;
}
declare var window: Window;
interface Network {
    name: string,
    chainId: number,
    ensAddress?: string,
    _defaultProvider?: (providers: any, options?: any) => any
}
import type { ExternalProvider } from '@ethersproject/providers';
type ExtensionForProvider = { on: (event: string, callback: (...params: any) => void) => void; };
type EthersProvider = ExternalProvider & ExtensionForProvider;

let updatesCallbackFunction: ((message: string, type: MessageType) => void) | undefined;

function createWalletStore() {

    let wallet: WalletState;
    let lastWalletState = getLastState();
    if (!lastWalletState)
        wallet = { connectionState: ConnectionState.Disconnected };
    else
        wallet = lastWalletState;

    const { subscribe, set } = writable(wallet);
    return {
        subscribe,
        setUpdatesCallback: (callbackFn: ((message: string, type: MessageType) => void) | undefined) => {
            updatesCallbackFunction = callbackFn;
        },
        setState: (walletState: WalletState) => {
            set(walletState);
            persistState(wallet);
        },
        setConnected: (connectionState: ConnectionState) => {
            if (connectionState !== wallet.connectionState) {
                if (connectionState === ConnectionState.Connected) {
                    dispatchMessage("Wallet connected.", MessageType.Success)
                } else if (connectionState === ConnectionState.Disconnected) {
                    dispatchMessage("Wallet disconnected.", MessageType.Warning);
                } else if (connectionState === ConnectionState.ConnectedButNoAccountAvailable) {
                    dispatchMessage("Wallet detected but no accounts available.", MessageType.Warning);
                }
                else {
                    dispatchMessage("Wallet connected to unsupported network.", MessageType.Warning);
                }
            }
            wallet.connectionState = connectionState;
            set(wallet);
            persistState(wallet);
        },
        setChainId: (chainId: number) => {
            if (wallet.chainId == chainId) {
                return;
            }
            let supportedChainId = chainId == CHAIN_ID;
            if (!supportedChainId) {
                wallet.connectionState = ConnectionState.ConnectedToUnsupportedNetwork;
                dispatchMessage(`Wallet configured with unsupported network: ` + chainId + `. Switch to network chain id ${CHAIN_ID}`, MessageType.Warning);
            }
            else if (supportedChainId && !wallet.account) {
                dispatchMessage("Wallet present, but no account connected yet. Make sure your wallet is unlocked.", MessageType.Warning);
                wallet.connectionState = ConnectionState.ConnectedButNoAccountAvailable;
            } else if (supportedChainId && wallet.account && wallet.account != '') {
                wallet.connectionState = ConnectionState.Connected;
                dispatchMessage("Wallet connected", MessageType.Success);
            }
            wallet.chainId = chainId;
            set(wallet);
            persistState(wallet);
        },
        setWalletType: (type: WalletType) => {
            wallet.type = type;
            set(wallet);
            persistState(wallet);
        },
        setAccount: async (account: string) => {
            // console.log(`called Former: ${wallet.account} , current: ${account}`);
            if (account !== undefined && wallet.account !== undefined && wallet.account != account) {
                dispatchMessage(`Wallet detected: '${shortenAddress(account)}'`, MessageType.Info);
            }
            // check if wallet's network is supported
            if (wallet.type != undefined) {
                let chainId = 0;
                if (web3Provider && wallet.type === WalletType.Injected) {
                    chainId = web3Provider.network.chainId;
                } else if (wcProvider && wallet.type === WalletType.WalletConnect) {
                    chainId = await wcProvider.send("eth_chainId", []) ?? -1 ;
                    // chainId = web3Provider?.network.chainId ?? -1;
                }
                if (chainId == CHAIN_ID) {
                    wallet.connectionState = ConnectionState.Connected;
                    console.log(`Connected to supported network: ` + chainId);
                } else {
                    wallet.connectionState = ConnectionState.ConnectedToUnsupportedNetwork;
                    console.log(`Connected to unsupported network: ` + chainId);
                }
            } else {
                wallet.connectionState = ConnectionState.Disconnected;
            }
            wallet.account = account;
            set(wallet);
            persistState(wallet);
        },
        persistState: () => {
            persistState(wallet);
        },
        resetState: () => {
            wallet = { connectionState: ConnectionState.Disconnected };
            set(wallet);
            dispatchMessage("Wallet disconnected.", MessageType.Info);
            resetStorageState();
        }
    };
}

export let web3Provider: providers.Web3Provider | undefined;
export let wcProvider: WalletConnectProvider | undefined;

async function setupWalletConnect() {
    wcProvider = new WalletConnectProvider({
        qrcodeModalOptions: { desktopLinks: [], mobileLinks: [] },
        bridge: VITE_WALLET_CONNECT_BRIDGE_SERVER,
        rpc: {
            // Only one network at a time is supported.
            // Add all supported networks here; Then configure .env accordingly.
            1: RPC_BACKEND,
            10: RPC_BACKEND,
            420: RPC_BACKEND,
            5: RPC_BACKEND,
            31337: RPC_BACKEND,
        },
        chainId: CHAIN_ID
    });

    //  Wrap with Web3Provider from ethers.js
    web3Provider = new providers.Web3Provider(wcProvider);
    walletState.setWalletType(WalletType.WalletConnect);

    // Setup event listeners
    wcProvider.on('accountsChanged', (accounts: string[]) => {
        console.log(`accountsChanged: ${accounts}`);
        walletState.setAccount(accounts[0]);
    });

    // Subscribe to chainId change
    wcProvider.on('chainChanged', (chainId: number) => {
        console.log(`chainChanged: ${chainId}`);
        walletState.setChainId(chainId);
    });

    wcProvider.on('connect', () => {
        console.log(`Connect event.`);
        if (wcProvider && CHAIN_ID === wcProvider.chainId) {
            if (wcProvider.accounts.length === 0) {
                walletState.setConnected(ConnectionState.ConnectedButNoAccountAvailable);
            } else {
                walletState.setConnected(ConnectionState.Connected);
            }
        } else if (wcProvider && CHAIN_ID != wcProvider.chainId) {
            walletState.setConnected(ConnectionState.ConnectedToUnsupportedNetwork);
        }
    });

    // Subscribe to session disconnection
    wcProvider.on('disconnect', (code: number, reason: string) => {
        console.log(`Disconnected. Code: ${code} , reason: ${reason}`);
        walletState.setConnected(ConnectionState.Disconnected);
    });

    try {
        await wcProvider.enable();
    } catch (error) {
        console.log(`Error:`)
        console.dir(error);
    }

    let currentChainID = wcProvider.chainId;
    if (currentChainID !== CHAIN_ID) {
        await requestSwitchToNetwork(web3Provider, CHAIN_ID);
    }
}

async function setupInjectedProviderWallet() {
    if (window.ethereum === undefined) {
        console.log('Error obtaining provider.')
        return;
    }

    web3Provider = new providers.Web3Provider(window.ethereum, "any");
    walletState.setWalletType(WalletType.Injected);

    // Setup event listeners
    web3Provider.on("network", async (newNetwork: Network, oldNetwork: Network) => {
        console.log(`Network (` + newNetwork.chainId + `) detected.`);
        try {
            let accountAddress = await getAccountAddress();
            if (accountAddress !== undefined && accountAddress != '') {
                walletState.setAccount(accountAddress);
            }
            walletState.setChainId(newNetwork.chainId);
        } catch (error) {
            console.log(`Unable to get wallet address.`);
            walletState.setConnected(ConnectionState.ConnectedButNoAccountAvailable);
        }
    });

    web3Provider.on('connect', async () => {
        console.log('connect event received..');
        if (web3Provider?.network.chainId === CHAIN_ID) {
            if ((await web3Provider.listAccounts()).length === 0) {
                walletState.setConnected(ConnectionState.ConnectedButNoAccountAvailable);
            } else {
                walletState.setConnected(ConnectionState.Connected);
            }
        } else if (web3Provider?.network.chainId != CHAIN_ID) {
            walletState.setConnected(ConnectionState.ConnectedToUnsupportedNetwork);
        }
    });

    (window.ethereum as EthersProvider).on('accountsChanged', (accounts) => {
        console.log(`accountsChanged: ${accounts}`);
        walletState.setAccount(accounts[0]);
    });

    if (web3Provider.network) {
        let currentChainID = web3Provider.network.chainId;
        walletState.setChainId(currentChainID);
        if (currentChainID !== CHAIN_ID) {
            await requestSwitchToNetwork(web3Provider, CHAIN_ID);
        }
    }
}

async function requestSwitchToNetwork(provider: ethers.providers.Web3Provider, chainId: number) {
    try {
        await provider.send("wallet_switchEthereumChain", [{ chainId: chainId }]);
    } catch (error) {
        console.log(`User rejected switching chains: ${error}`);
        dispatchMessage(`The connected wallet doesn't support the chain used by this app.`, MessageType.Warning);
    }
}

function resetWalletConnectCallbacks() {
    if (wcProvider) {
        wcProvider.on('accountsChanged', () => { });
        wcProvider.on('chainChanged', () => { });
        wcProvider.on('connect', () => { });
        wcProvider.on('disconnect', () => { });
    }
    wcProvider = undefined;
    if (web3Provider) {
        web3Provider.removeAllListeners();
    }
    web3Provider = undefined
}

export function dispatchMessage(message: string, type: MessageType) {
    if (updatesCallbackFunction) {
        updatesCallbackFunction(message, type);
    } else {
        console.warn(`Callback function missing. Can't deliver message: ${message}`);
    }
}

export async function connect(walletType: WalletType) {
    walletState.persistState();
    resetWalletConnectCallbacks();;
    try {
        if (walletType === WalletType.WalletConnect) {
            setupWalletConnect();
        } else if (walletType === WalletType.Injected) {
            setupInjectedProviderWallet();
        }
    } catch (error) {
        console.log('Error: ' + error);
    }
}

export async function disconnect() {
    if (wcProvider) {
        wcProvider.disconnect();
        resetWalletConnectCallbacks();
    } else if (web3Provider) {
        web3Provider.removeAllListeners();
    }
    walletState.resetState();
}

export function setupWallet() {
    let lastWalletState: WalletState | undefined = getLastState();

    if (lastWalletState) {
        walletState.setState(lastWalletState);
        if (lastWalletState.type !== undefined) {
            connect(lastWalletState.type);
        }
    } else {
        console.log("No wallet in state.");
    }
}

export async function tearDownWallet() {
    walletState.persistState();
    resetWalletConnectCallbacks();
    updatesCallbackFunction = undefined;
}

export function getSigner(): Signer & TypedDataSigner | undefined {
    if (web3Provider === undefined) {
        return undefined;
    }
    return web3Provider.getSigner();
}

export function getProvider() {
    return web3Provider;
}

async function getAccountAddress(): Promise<string | undefined> {
    if (web3Provider && connected) {
        return await web3Provider.getSigner().getAddress();
    }
    return undefined;
}