import WalletConnectProvider from '@walletconnect/web3-provider/dist/umd/index.min.js';
import { providers, Signer, type Transaction } from 'ethers';

import { writable, derived } from 'svelte/store';

import { type WalletState, WalletType, ConnectionState, persistState, getLastState, resetStorageState } from '$lib/walletStorage';
import { MessageType } from './Toast/MessageType';

export const walletState = createWalletStore();
export const connected = derived(walletState, $walletState => $walletState.connectionState === ConnectionState.Connected);
export const accountAddress = derived(walletState, $walletState => {
    return ($walletState.account) ? $walletState.account : ''
});
export const shortenedAccount = derived(walletState, $walletState => {
    return shortenAddress($walletState.account);
});

export const shortOrENSNamedAccount = derived(walletState, async $walletState => {
    if ($walletState === undefined) return '---';
    let signer = getSigner();
    if ($walletState.account === undefined || signer === undefined || signer.provider === undefined) return '---';
    let reversedResolve: string | null;
    try {
        reversedResolve = await signer.provider?.lookupAddress($walletState.account);
    } catch (error) {
        console.log(`${error}`);
        return shortenAddress($walletState.account);
    }
    // fallback to shortenedAccount format
    if(reversedResolve === null) return shortenAddress($walletState.account);
    return reversedResolve;
});

function shortenAddress(walletAddress: string | undefined) : string {
    return (walletAddress) ? walletAddress.slice(0, 6) + '...' + walletAddress.slice(-6) : '---';
}

// 10: Optimism; 31337: hardhat local node; 5: Ethereum Goerli; 420: Optimism Goerli
let supportedNetworks: number[] = [420, 5, 31337];
const RPC_BACKEND: string = import.meta.env.VITE_WALLET_CONNECT_RPC;

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

    let wallet: WalletState = { connectionState: ConnectionState.Disconnected };

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
        setConnected: (truthy: boolean) => {
            let connected = truthy ? ConnectionState.Connected : ConnectionState.Disconnected;
            if (connected !== wallet.connectionState) {
                (connected) ?
                    dispatchMessage("Wallet connected.", MessageType.Success)
                    : dispatchMessage("Wallet disconnected.", MessageType.Warning);
            }
            wallet.connectionState = connected;
            set(wallet);
            persistState(wallet);
        },
        setChainId: (chainId: number) => {
            wallet.chainId = chainId;
            let connected = supportedNetworks.includes(chainId)
                ? ConnectionState.Connected
                : ConnectionState.ConnectedToUnsupportedNetwork;
            if (connected === ConnectionState.Connected) {
                dispatchMessage("Wallet connected.", MessageType.Success);
            } else if (chainId == 1337) {
                dispatchMessage(`For development / local node, please configure your wallet to chain ID 31337.`, MessageType.Info);
                dispatchMessage(`Wallet configured with unsupported network: ` + chainId + `.`, MessageType.Warning);
            }
            else {
                dispatchMessage(`Wallet configured with unsupported network: ` + chainId + `.`, MessageType.Warning);
            }
            wallet.connectionState = connected;
            set(wallet);
            persistState(wallet);
        },
        setWalletType: (type: WalletType) => {
            wallet.type = type;
            set(wallet);
            persistState(wallet);
        },
        setAccount: (account: string) => {
            if (wallet.account !== undefined && wallet.account !== account) {
                dispatchMessage(`Wallet detected: '${account}'`, MessageType.Info);
            }
            // check if wallet's network is supported
            let lastWalletState = getLastState();
            if (lastWalletState != undefined) {
                if (lastWalletState.type === WalletType.Injected) {
                    if (supportedNetworks.includes(web3Provider.network.chainId)) {
                        wallet.connectionState = ConnectionState.Connected;
                    } else {
                        wallet.connectionState = ConnectionState.ConnectedToUnsupportedNetwork;
                        console.log(`Connected to unsupported network: ` + web3Provider.network.chainId);
                    }
                } else if (lastWalletState.type === WalletType.WalletConnect) {
                    wallet.connectionState = supportedNetworks.includes(wcProvider.chainId ?? -1)
                        ? ConnectionState.Connected
                        : ConnectionState.ConnectedToUnsupportedNetwork;
                    if (wallet.connectionState === ConnectionState.ConnectedToUnsupportedNetwork) {
                        console.log(`Connected to unsupported network: ` + wcProvider.chainId);
                    }
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

export let web3Provider: providers.Web3Provider;
export let wcProvider: WalletConnectProvider;

async function setupWalletConnect() {
    wcProvider = new WalletConnectProvider({
        rpc: {
            //10: RPC_BACKEND
            420: RPC_BACKEND
        },
        // chainId: 10
        chainId: 420
    });
    walletState.setWalletType(WalletType.WalletConnect);
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
        if (supportedNetworks.includes(wcProvider.chainId)) {
            walletState.setConnected(true);
        }
    });

    // Subscribe to session disconnection
    wcProvider.on('disconnect', (code: number, reason: string) => {
        console.log(`Disconnected. Code: ${code} , reason: ${reason}`);
        walletState.setConnected(false);
    });

    //  Wrap with Web3Provider from ethers.js
    web3Provider = new providers.Web3Provider(wcProvider);
    await wcProvider.enable();
}

async function setupInjectedProviderWallet() {
    if (window.ethereum === undefined) {
        console.log('Error obtaining provider.')
        return;
    }

    web3Provider = new providers.Web3Provider(window.ethereum, "any");
    walletState.setWalletType(WalletType.Injected);
    // Events
    web3Provider.on("network", (newNetwork: Network, oldNetwork: Network) => {
        console.log(`Network (` + newNetwork.chainId + `) detected.`);
        walletState.setChainId(newNetwork.chainId);
    });

    web3Provider.on('connect', () => {
        walletState.setConnected(true);
    });

    (window.ethereum as EthersProvider).on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            console.log("Wallet disconnected.");
            walletState.setConnected(false);
        } else {
            console.log(`one: accountsChanged: ${accounts[0]}`);
            walletState.setAccount(accounts[0]);
        }
    });

    await web3Provider.send("eth_requestAccounts", []);
    if (web3Provider.network) {
        walletState.setChainId(web3Provider.network.chainId);
    }
    let accountAddress = await getAccountAddress();
    if (accountAddress !== undefined && accountAddress != '') {
        walletState.setAccount(accountAddress);
    }

}

function resetWalletConnectCallbacks() {
    if (wcProvider) {
        wcProvider.on('accountsChanged', () => { });
        wcProvider.on('chainChanged', () => { });
        wcProvider.on('connect', () => { });
        wcProvider.on('disconnect', () => { });
    }
    if (web3Provider) {
        web3Provider.removeAllListeners();
    }
}

export function dispatchMessage(message: string, type: MessageType) {
    if (updatesCallbackFunction) {
        updatesCallbackFunction(message, type);
    }
}

export async function connect(walletType: WalletType) {
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
        resetWalletConnectCallbacks();
        wcProvider.disconnect();
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

export function getSigner(): Signer | undefined {

    if (!connected || web3Provider === undefined) {
        return undefined;
    }
    return web3Provider.getSigner();
}

export async function getAccountAddress(): Promise<string | undefined> {
    if (connected) {
        return await web3Provider.getSigner().getAddress();
    }
    return undefined;
}