import type { ethers } from "ethers";
import { timeout } from "./timer.js";
import { getProvider } from "./wallet.js";

export const waitForTransaction = async (transactionHash: string, confirmations: number = 1, timeoutSeconds: number = 10000) => {
    let transactionReceipt: ethers.providers.TransactionReceipt | undefined = undefined;
    const startTime = Date.now();

    while (true) {
        try {
            let provider = getProvider();
            if (!provider) {
                throw new Error(`Provider not available.`);
            }
            transactionReceipt = await provider.getTransactionReceipt(transactionHash);

            if (transactionReceipt && transactionReceipt.confirmations >= confirmations) {
                console.log(`Transaction confirmation(s): ${transactionReceipt.confirmations}`);
                break;
            }

            if (Date.now() - startTime > timeoutSeconds / 1000) {
                throw new Error('Timeout while waiting for transaction confirmation');
            }

            await timeout(1500);
        } catch (error: any) {
            throw new Error(`Unable to get transaction confirmation: ${error.message ? error.message : error}`);
        }
    }

    return transactionReceipt;
};