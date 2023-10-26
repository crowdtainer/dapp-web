import WalletConnectProvider from '@walletconnect/web3-provider/dist/umd/index.min.js';
// Can't use proper import, see: https://github.com/WalletConnect/walletconnect-monorepo/issues/864
// import WalletConnectProvider from "@walletconnect/web3-provider";
import { getAddress, BrowserProvider, type Signer } from 'ethers';
// import { mainnet } from 'viem/chains'

// import { createWalletClient, custom, type Account, type WalletClient, type ProviderConnectInfo, type ProviderMessage, defineChain } from 'viem'
import 'viem/window';


import { writable, derived } from 'svelte/store';

import { type WalletState, WalletType, ConnectionState, persistState, getLastState, resetStorageState } from '$lib/Utils/walletStorage';
import { MessageType } from '../Toast/MessageType';
import type { ProviderConnectInfo, ProviderMessage } from 'viem';

const VITE_WALLET_CONNECT_BRIDGE_SERVER: string = import.meta.env.VITE_WALLET_CONNECT_BRIDGE_SERVER;
const NO_WALLET_DETECTED = '---';

export const ssr = false;

export const walletState = createWalletStore();
export const connected = derived(walletState, $walletState => $walletState.connectionState === ConnectionState.Connected);
export const accountAddress = derived(walletState, $walletState => {
    return ($walletState.account) ? getAddress($walletState.account) : '';
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
        dispatchMessage("web3Provider not found.", MessageType.Warning);
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

const RPC_BACKEND: string = import.meta.env.VITE_WALLET_CONNECT_RPC;
const CHAIN_ID: number = import.meta.env.VITE_WALLET_CONNECT_CHAIN_ID;

// export const customChainDefinition = /*#__PURE__*/ defineChain({
//     id: CHAIN_ID,
//     name: RPC_BACKEND,
//     network: 'localhost',
//     nativeCurrency: {
//         decimals: 18,
//         name: 'Ether',
//         symbol: 'ETH',
//     },
//     rpcUrls: {
//         default: { http: ['RPC_BACKEND'] },
//         public: { http: ['RPC_BACKEND'] },
//     },
// })

// interface Window {
//     ethereum?: import('ethers').Eip1193Provider;
// }
// declare var window: Window;
interface Network {
    name: string,
    chainId: number,
    ensAddress?: string,
    _defaultProvider?: (providers: any, options?: any) => any
}
// import type { ExternalProvider } from '@ethersproject/providers';
// type ExtensionForProvider = { on: (event: string, callback: (...params: any) => void) => void; };
// type EthersProvider = ExternalProvider & ExtensionForProvider;

let updatesCallbackFunction: ((message: string, type: MessageType) => void) | undefined;

let signerAddress: string | undefined;

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
                    dispatchMessage("Wallet connected", MessageType.Success)
                    : dispatchMessage("Wallet disconnected.", MessageType.Warning);
            }
            wallet.connectionState = connected;
            set(wallet);
            persistState(wallet);
        },
        setChainId: (chainId: number) => {
            wallet.chainId = chainId;
            let connected = chainId == CHAIN_ID
                ? ConnectionState.Connected
                : ConnectionState.ConnectedToUnsupportedNetwork;
            if (!wallet.account) {
                console.log("Wallet present, but no account connected yet. Make sure your wallet is unlocked.");
            }
            else if (connected === ConnectionState.Connected) {
                dispatchMessage("Wallet connected", MessageType.Success);
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
        setAccount: async (account: string) => {
            if (wallet.account !== undefined && wallet.account !== account) {
                dispatchMessage(`Wallet detected: '${account}'`, MessageType.Info);
            }
            // check if wallet's network is supported
            let lastWalletState = getLastState();
            if (lastWalletState != undefined) {
                let chainId = -1;
                if (lastWalletState.type === WalletType.Injected) {
                    const ethereum: any = window.ethereum;
                    let provider = ethereum || (window as any).web3?.currentProvider;
                    if (!provider) {
                        console.log('Injected provider not detected.');
                        return;
                    }
                    chainId = Number.parseInt(await provider.request({ method: 'eth_chainId' }));
                } else if (lastWalletState.type === WalletType.WalletConnect) {
                    chainId = wcProvider.chainId ?? -1;
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
            signerAddress = account;
            set(wallet);
            persistState(wallet);
        },
        persistState: () => {
            persistState(wallet);
        },
        resetState: () => {
            wallet = { connectionState: ConnectionState.Disconnected };
            signerAddress = undefined;
            set(wallet);
            dispatchMessage("Wallet disconnected.", MessageType.Info);
            resetStorageState();
        }
    };
}

export let web3Provider: BrowserProvider;
let wcProvider: WalletConnectProvider;

async function setupWalletConnect() {
    wcProvider = new WalletConnectProvider({
        qrcodeModalOptions: { desktopLinks: [], mobileLinks: [] },
        bridge: VITE_WALLET_CONNECT_BRIDGE_SERVER,
        rpc: {
            // Only one network at a time is supported.
            // Add all supported networks here; Then configure .env accordingly.
            10: RPC_BACKEND,
            420: RPC_BACKEND,
            5: RPC_BACKEND,
            31337: RPC_BACKEND,
        },
        chainId: CHAIN_ID
    });

    //  Wrap with Web3Provider from ethers.js
    web3Provider = new BrowserProvider(wcProvider);

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
        if (CHAIN_ID == wcProvider.chainId) {
            walletState.setConnected(true);
        }
    });

    // Subscribe to session disconnection
    wcProvider.on('disconnect', (code: number, reason: string) => {
        console.log(`Disconnected. Code: ${code} , reason: ${reason}`);
        walletState.setConnected(false);
    });

    try {
        await wcProvider.enable();
    } catch (error) {
        console.log(`Error:`)
        console.dir(error);
    }
}

// let client: WalletClient;

async function setupInjectedProviderWallet() {
    let provider = window.ethereum ? window.ethereum : (window as any).web3?.currentProvider;

    if (!provider) {
        console.log('Error obtaining provider.')
        return;
    }

    console.dir(`The provider: ${provider}`);

    web3Provider = new BrowserProvider(provider);
    walletState.setWalletType(WalletType.Injected);

    // Events

    provider.on('accountsChanged', (accounts: string[]) => {
        console.log(`accountsChanged: ${JSON.stringify(accounts)}`);
        if (accounts.length === 0) {
            console.log("Wallet disconnected.");
            walletState.setConnected(false);
        } else {
            walletState.setAccount(accounts[0]);
            signerAddress = accounts[0];
        }
    });

    provider.on('chainChanged', (chainId: string) => {
        console.log(`Network (` + chainId + `) detected.`);
        walletState.setChainId(Number(chainId));
    });

    provider.on('connect', (connectInfo: ProviderConnectInfo) => {
        console.log(`Connect event received: ${connectInfo}`);
        walletState.setChainId(Number(connectInfo.chainId));
    });

    provider.on('message', (message: ProviderMessage) => {
        console.log(`received a message: ${message}`);
    });

    // window.ethereum.on("*", (log, evt) => { console.log(`log: ${log} ; event: ${evt}`); })

    // web3Provider.on("network", async (newNetwork: Network, oldNetwork: Network) => {
    //     console.log(`Network (` + newNetwork.chainId + `) detected.`);
    //     try {
    //         walletState.setChainId(newNetwork.chainId);
    //         let accountAddress = await getSignerAddress();
    //         if (accountAddress !== undefined && accountAddress != '') {
    //             walletState.setAccount(accountAddress);
    //         }
    //     } catch (error) {
    //         console.log(`Unable to get wallet address.`);
    //         walletState.setConnected(false);
    //     }
    // });

    // web3Provider.provider.on('connect', () => {
    //     walletState.setConnected(true);
    // });

    // web3Provider.provider.on('accountsChanged', (accounts: string[]) => {
    //     if (accounts.length === 0) {
    //         console.log("Wallet disconnected.");
    //         walletState.setConnected(false);
    //     } else {
    //         console.log(`accountsChanged: ${accounts[0]}`);
    //         walletState.setAccount(accounts[0]);
    //     }
    // }

    // web3Provider.on('accountsChanged', (accounts) => {
    //     if (accounts.length === 0) {
    //         console.log("Wallet disconnected.");
    //         walletState.setConnected(false);
    //     } else {
    //         console.log(`accountsChanged: ${accounts[0]}`);
    //         walletState.setAccount(accounts[0]);
    //     }
    // });

    const [account] = await provider.request({ method: 'eth_requestAccounts' })
    if (!account) {
        console.log(`Unable to find connected wallet.`);
    } else { console.log(`Account is ${account}`) };
    walletState.setAccount(account);
    signerAddress = account

    try {
        const response = await (provider as any).enable();
        let accounts = response?.result || response;
        console.log(`Obtained account via legacy approach: ${JSON.stringify(accounts)}`);
    } catch (error) {
        console.log(JSON.stringify(error));
    }


    // client = createWalletClient({
    //     account,
    //     chain: mainnet,
    //     transport: custom(window.ethereum)
    // })

    let chainId = Number.parseInt(await provider.request({ method: 'eth_chainId' }));


    // await web3Provider.send("eth_requestAccounts", []);
    // signerAddress = await signer.getAddress();
    // let chainId = (await web3Provider.getNetwork()).chainId;
    // if (signerAddress) {
    //     walletState.setAccount(signerAddress);
    // }

    // //}
    console.log(`Network (` + chainId + `) detected.`);
    try {
        walletState.setChainId(Number(chainId));
        // walletState.setConnected(true);
    } catch (error) {
        console.log(`Error: ${error}`);
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

export async function getSigner(): Promise<Signer | undefined> {
    console.log(`Get signer called, provider: ${web3Provider}`);
    console.dir(web3Provider);
    if (web3Provider) return await web3Provider.getSigner();
    return undefined;
}

export function getProvider(): BrowserProvider | undefined {
    console.log(`Get signer called, provider: ${web3Provider}`);
    console.dir(web3Provider);
    return web3Provider;
}

export function getSignerAddress(): string | undefined {
    // if (connected) {
    return signerAddress;
    // }
    // return undefined;
}