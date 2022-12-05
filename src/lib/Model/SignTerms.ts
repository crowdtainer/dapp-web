import type { Signer } from 'ethers';
import { getAccountAddress } from '$lib/wallet';

// Monads
import { type Result, Ok, Err } from "@sniptt/monads";

// https://github.com/spruceid/siwe/issues/136#issuecomment-1336364107
import { SiweMessage } from '@crowdtainer/siwe';

export let domain = import.meta.env.MODE === 'development' ? 'localhost:5173' : 'https://crowdtainer.io'; // TODO: Read from .env
export let termsPath = 'terms';                        // TODO: Read from .env
export let termsURI = `${domain}/${termsPath}`;

export function makeStatement(email: string, _termsURI?: string): string {
    let statement = `I agree to the terms and conditions found in ${_termsURI === undefined ? termsURI : _termsURI}. ` +
        `My e-mail address is: ${email}`;
    return statement;
}

export function makeMessage(email: string, address: string): string {
    const domain = window.location.host;
    const origin = window.location.origin;

    const message = new SiweMessage({
        domain,
        address,
        statement: makeStatement(email, termsURI),
        uri: origin,
        version: '1',
        chainId: 1,
        resources: [termsURI]
    });
    return message.prepareMessage();
}

export async function signTermsAndConditions(signer: Signer | undefined, email: string): Promise<Result<[message: string, signature: string], string>> {

    let account = await getAccountAddress();
    let message: string;

    if (signer !== undefined && account !== undefined) {
        let signedMessage: string;
        try {
            message = makeMessage(email, await signer.getAddress());
            signedMessage = await signer.signMessage(message);
        } catch (error) {
            console.dir(error);
            return Err(`${error}`);
        }
        let result: [string, string] = [message, signedMessage];
        return Ok(result);
    } else {
        return Err("Unable to sign message - signer or account not detected.");
    }
}