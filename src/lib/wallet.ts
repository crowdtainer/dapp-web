import WalletConnectProvider from '@walletconnect/web3-provider/dist/umd/index.min.js';
import { providers } from 'ethers';

import { writable, derived } from 'svelte/store';

import { type WalletState, WalletType, ConnectionState, persistState, getLastState } from '$lib/walletStorage';
import { MessageType } from './Toast/MessageType';

export const walletState = createWalletStore();
export const connected = derived(walletState, $walletState => $walletState.connectionState === ConnectionState.Connected);
export const shortenedAccount = derived(walletState, $walletState => {
    return ($walletState.account) ? $walletState.account?.slice(0,6) + '...' + $walletState.account?.slice(-6): ''
});

let supportedNetworks: number[] = [10];
const RPC_BACKEND: string = import.meta.env.VITE_RPC_BACKEND;

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
            } else {
                dispatchMessage("Wallet configured with unsupported network.", MessageType.Warning);
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
            if(wallet.account !== undefined && wallet.account !== account) {
                dispatchMessage(`Switched to wallet '${account}'`, MessageType.Info);
            }
            // check if wallet's network is supported
            let connected = supportedNetworks.includes(wcProvider.chainId ?? -1)
                ? ConnectionState.Connected
                : ConnectionState.ConnectedToUnsupportedNetwork;

            wallet.connectionState = connected;
            wallet.account = account;
            set(wallet);
            persistState(wallet);
        },
        persistState: () => {
            persistState(wallet);
        }
    };
}

let wcProvider: WalletConnectProvider;

async function setupWalletConnect() {
    wcProvider = new WalletConnectProvider({
        rpc: {
            10: RPC_BACKEND
        },
        chainId: 10
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
        if(supportedNetworks.includes(wcProvider.chainId)){
            walletState.setConnected(true);
        }
    });

    // Subscribe to session disconnection
    wcProvider.on('disconnect', (code: number, reason: string) => {
        console.log(`Disconnected. Code: ${code} , reason: ${reason}`);
        walletState.setConnected(false);
    });

    //  Wrap with Web3Provider from ethers.js
    const web3Provider = new providers.Web3Provider(wcProvider);
    await wcProvider.enable();
}

function resetWalletConnectCallbacks() {
    if (wcProvider) {
        wcProvider.on('accountsChanged', () => { });
        wcProvider.on('chainChanged', () => { });
        wcProvider.on('connect', () => { });
        wcProvider.on('disconnect', () => { });
    }
}

export function dispatchMessage(message: string, type: MessageType) {
    if (updatesCallbackFunction) {
        updatesCallbackFunction(message, type);
    }
}

export async function connect(walletType: WalletType) {

    if (walletType === WalletType.WalletConnect) {
        try {
            setupWalletConnect();
        } catch (error) {
            console.log('Error: ' + error);
        }
    }
}

export async function disconnect() {
    if (wcProvider) {
        resetWalletConnectCallbacks();
        wcProvider.disconnect();
    }
    walletState.setState({ connectionState: ConnectionState.Disconnected });
}

export async function setupWallet() {
    let lastWalletState: WalletState | undefined = getLastState();

    if (lastWalletState) {
        walletState.setState(lastWalletState);
        if (lastWalletState.connectionState === ConnectionState.Connected) {
            if (lastWalletState.type) {
                connect(lastWalletState.type);
            }
        }
    }
}

export async function tearDownWallet() {
    walletState.persistState();
    resetWalletConnectCallbacks();
    updatesCallbackFunction = undefined;
}