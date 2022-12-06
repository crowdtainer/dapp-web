import type { Signer } from 'ethers';
import { getAccountAddress } from '$lib/wallet';

// Monads
import { type Result, Ok, Err } from "@sniptt/monads";

// https://github.com/spruceid/siwe/issues/136#issuecomment-1336364107
import { SiweMessage } from '@crowdtainer/siwe';

export let domain = import.meta.env.MODE === 'development' ? 'localhost:5173' : import.meta.env.VITE_SIGNATURE_DOMAIN;
export let termsPath = import.meta.env.VITE_TERMS_OF_AGREEMENT_URI_PATH;
export let termsURI = `${domain}/${termsPath}`;

export interface DeliveryDetails {
    vouchers721Address: string,
    voucherId: number,
    chainId: number,
    country: string,
    firstName: string,
    lastName: string,
    address: string,
    complement: string,
    postalCode: string,
    city: string,
    email: string
}

export function makeAgreeToTermsStatement(email: string, _termsURI?: string): string {
    let statement = `I agree to the terms and conditions found in ${_termsURI === undefined ? termsURI : _termsURI}. ` +
        `My e-mail address is: ${email}`;
    return statement;
}

export function makeDeliveryStatement(delivery: DeliveryDetails, _termsURI?: string): string {
    let statement = `My delivery address is: ` +
        `${delivery.firstName} ${delivery.lastName} ${delivery.address} ` +
        `${delivery.complement} ${delivery.postalCode} ${delivery.city} ${delivery.country}. Email for invoice: ${delivery.email}. ` +
        `I confirm acceptance to the terms and conditions found in ${_termsURI === undefined ? termsURI : _termsURI}. ` +
        `Proof of payment: ${delivery.vouchers721Address}, token id: ${delivery.voucherId}.`;
    return statement;
}

export function makeAgreeToTermsMessage(email: string, walletAddress: string): string {
    const domain = window.location.host;
    const origin = window.location.origin;

    const message = new SiweMessage({
        domain,
        address: walletAddress,
        statement: makeAgreeToTermsStatement(email, termsURI),
        uri: origin,
        version: '1',
        chainId: 1,
        resources: [termsURI]
    });
    return message.prepareMessage();
}

export function makeDeliveryRequestMessage(walletAddress: string, deliveryAddress: DeliveryDetails): string {
    const domain = window.location.host;
    const origin = window.location.origin;

    const message = new SiweMessage({
        domain,
        address: walletAddress,
        statement: makeDeliveryStatement(deliveryAddress, termsURI),
        uri: origin,
        version: '1',
        chainId: 1,
        resources: [termsURI]
    });
    return message.prepareMessage();
}

export async function signMessage(signer: Signer | undefined, message: string): Promise<Result<[message: string, signature: string], string>> {

    let account = await getAccountAddress();

    if (signer !== undefined && account !== undefined) {
        let signedMessage: string;
        try {
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