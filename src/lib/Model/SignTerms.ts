import type { Signer } from 'ethers';
import { ethers } from 'ethers';
import { SiweMessage } from 'siwe';
import { getAccountAddress } from '$lib/wallet';

// Monads
import { type Result, Ok, Err } from "@sniptt/monads";

const domain = 'window.location.host';
const origin = 'window.location.origin';

export function getMessage(email: string): string {
    // Disabled until fix is available in a release: https://github.com/spruceid/siwe/pull/115
    // const message = new SiweMessage({
    //     domain,
    //     address,
    //     statement,
    //     uri: origin,
    //     version: '1',
    //     chainId: 1
    // });
    // return message.prepareMessage();

    return `I agree to the terms and conditions found in https://crowdtainer.io/terms` +
           `\nMy e-mail address is: ${email}`;
}

export async function signTermsAndConditions(signer: Signer | undefined, email: string): Promise<Result<string, string>> {
    let account = await getAccountAddress();
    console.log(`Detected account: ${account}`);
    if (signer !== undefined && account !== undefined) {

        let signedMessage: string;
        try {
         // TODO: replace with createSiweMessage
         signedMessage = await signer.signMessage(getMessage(email));
        } catch (error) {
            return Err(`${error}`);
        }
        return Ok(`${signedMessage}`);
    } else {
        return Err("Unable to sign message - signer or account not detected.");
    }
}