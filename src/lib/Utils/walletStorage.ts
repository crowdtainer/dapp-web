import { browser } from '$app/environment';

export enum WalletType { Injected, WalletConnect }
export enum ConnectionState { Disconnected, Connected, ConnectedToUnsupportedNetwork }

export type WalletState = {
    type?: WalletType,
    connectionState: ConnectionState,
    chainId?: number,
    account?: string
}

const STORAGE_KEY = 'WALLET_STATE';

export function persistState(walletState: WalletState) {
    if (browser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(walletState));
    } else {
        console.log("browser not found!");
    }
}

export function resetStorageState() {
    if (browser) {
        localStorage.clear();
    } else {
        console.log("browser not found!");
    }
}

export function getLastState(): WalletState | undefined {
    const walletStateJson = window.localStorage.getItem(STORAGE_KEY);
    if(walletStateJson == null) return undefined;
    return JSON.parse(walletStateJson);
}