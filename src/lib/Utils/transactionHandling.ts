import type { ethers } from "ethers";
import { timeout } from "./timer.js";
import { getProvider } from "./wallet.js";

// This file is exists because some Providers are not working as excepted in conjunction with ethers.js (specifically, ether's tx wait() function).
// TODO: attempt to migrate to another library (e.g. viem), and remove this file if everything works as expected.

export function promiseWithTimeout<T>(
    promise: Promise<T>,
    timeoutInMs: number,
    timeoutError = new Error('Promise timed out')
): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => {
            reject(timeoutError);
        }, timeoutInMs);
    });
    return Promise.race<T>([promise, timeout]);
}

export const waitForTransaction = async (transactionHash: string, confirmations: number = 1, timeoutSeconds: number = 10000) => {
    let transactionReceipt: ethers.providers.TransactionReceipt | undefined = undefined;
    const startTime = Date.now();

    while (true) {
        try {
            let provider = getProvider();
            if (!provider) {
                throw new Error(`Provider not available.`);
            }

            const timeLeft = timeoutSeconds - (Date.now() - startTime);
            transactionReceipt = await promiseWithTimeout(provider.getTransactionReceipt(transactionHash),
                timeLeft,
                new Error("getTransactionReceipt timed out."));

            if (transactionReceipt && transactionReceipt.confirmations >= confirmations) {
                console.log(`Transaction confirmation(s): ${transactionReceipt.confirmations}`);
                break;
            }

            const elapsedTime = Date.now() - startTime;
            if (elapsedTime > timeoutSeconds / 1000) {
                throw new Error('Timeout while waiting for transaction confirmation');
            }

            await timeout(1500); // Avoid spamming RPC endpoint.
        } catch (error: any) {
            throw new Error(`Unable to get transaction confirmation: ${error.message ? error.message : error}`);
        }
    }
    return transactionReceipt;
};