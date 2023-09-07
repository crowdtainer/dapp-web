import type { Signer } from 'ethers';

// Monads
import { type Result, Ok, Err } from "@sniptt/monads";

export let domain = import.meta.env.VITE_DOMAIN;
export let termsPath = import.meta.env.VITE_TERMS_OF_AGREEMENT_PATH;
export let termsURI = `${domain}/${termsPath}`;

export interface Address {
    country: string;
    firstName: string;
    lastName: string;
    address: string;
    complement?: string;
    postalCode: string;
    state: string;
    city: string;
    email: string;
}

export interface DeliveryDetails {
    vouchers721Address: string,
    voucherId: number,
    chainId: number,
    deliveryAddress: Address,
    billingAddress: Address
}

export function makeAddress() : Address { 
    return {
		country: '',
		firstName: '',
		lastName: '',
		address: '',
		postalCode: '',
		state: '',
		city: '',
		email: ''
	};
}

export function normalizeDeliveryDetails(deliveryDetails: DeliveryDetails): DeliveryDetails {
    deliveryDetails.deliveryAddress.lastName = treatSpecialChars(deliveryDetails.deliveryAddress.lastName);
    deliveryDetails.deliveryAddress.firstName = treatSpecialChars(deliveryDetails.deliveryAddress.firstName);
    deliveryDetails.deliveryAddress.country = treatSpecialChars(deliveryDetails.deliveryAddress.country);
    deliveryDetails.deliveryAddress.address = treatSpecialChars(deliveryDetails.deliveryAddress.address);
    deliveryDetails.deliveryAddress.complement = treatSpecialChars(deliveryDetails.deliveryAddress.complement ? deliveryDetails.deliveryAddress.complement : '');
    deliveryDetails.deliveryAddress.postalCode = treatSpecialChars(deliveryDetails.deliveryAddress.postalCode);
    deliveryDetails.deliveryAddress.city = treatSpecialChars(deliveryDetails.deliveryAddress.city);
    deliveryDetails.deliveryAddress.email = treatSpecialChars(deliveryDetails.deliveryAddress.email);

    if (deliveryDetails.billingAddress) {
        deliveryDetails.billingAddress.lastName = treatSpecialChars(deliveryDetails.billingAddress.lastName);
        deliveryDetails.billingAddress.firstName = treatSpecialChars(deliveryDetails.billingAddress.firstName);
        deliveryDetails.billingAddress.country = treatSpecialChars(deliveryDetails.billingAddress.country);
        deliveryDetails.billingAddress.address = treatSpecialChars(deliveryDetails.billingAddress.address);
        deliveryDetails.billingAddress.complement = treatSpecialChars(deliveryDetails.billingAddress.complement ? deliveryDetails.billingAddress.complement : '');
        deliveryDetails.billingAddress.postalCode = treatSpecialChars(deliveryDetails.billingAddress.postalCode);
        deliveryDetails.billingAddress.city = treatSpecialChars(deliveryDetails.billingAddress.city);
        deliveryDetails.billingAddress.email = treatSpecialChars(deliveryDetails.billingAddress.email);
    }
    return deliveryDetails;
}

export function isTimeValid(timeISO: string): boolean {
    // Signatures older than one day, or too far in the future are rejected
    const timeDifference = +new Date() - +new Date(timeISO);
    console.log(`Signature time difference: ${timeDifference}`);
    if (timeDifference < -360000 || timeDifference > 360000) {
        console.log(`Rejected signature.`);
        return false;
    } else return true;
}

export function makeAgreeToTermsMessage(domain: string, origin: string, email: string, walletAddress: string, nonce: string, ISO8601_issuedAt: string): string {
    const message: string = `
${domain} wants you to sign in with your Ethereum account:
${walletAddress}

${makeAgreeToTermsStatement(email, termsURI)}

URI: ${origin}
Version: 1
Chain ID: ${import.meta.env.VITE_WALLET_CONNECT_CHAIN_ID}
Nonce: ${nonce}
Issued At: ${ISO8601_issuedAt}
Resources:
- ${termsURI}`;

    return message;
}

export function makeDeliveryRequestMessage(
    walletAddress: string,
    domain: string,
    origin: string,
    deliveryAddress: DeliveryDetails,
    nonce: string,
    ISO8601_issuedAt: string
): string {

    const message: string = `
${domain} wants you to sign in with your Ethereum account:
${walletAddress}

${makeDeliveryStatement(deliveryAddress, termsURI)}

URI: ${origin}
Version: 1
Chain ID: ${import.meta.env.VITE_WALLET_CONNECT_CHAIN_ID}
Nonce: ${nonce}
Issued At: ${ISO8601_issuedAt}
Resources:
- ${termsURI}`;

    return message;
}

export async function signMessage(signer: Signer | undefined, message: string): Promise<Result<string, string>> {
    if (signer !== undefined) {
        let signedMessage: string;
        try {
            signedMessage = await signer.signMessage(message);
        } catch (error) {
            console.dir(error);
            return Err(`${error}`);
        }
        return Ok(signedMessage);
    } else {
        return Err("Unable to sign message - signer or wallet not detected.");
    }
}

import { transliterate as tr } from 'transliteration';

export function treatSpecialChars(input: string): string {
    let asciiRepresentation = tr(input);
    return asciiRepresentation.replace(/[^@:/\.a-zA-Z0-9 ]/g, "");
}

function makeAgreeToTermsStatement(email: string, _termsURI: string): string {
    let statement = `I agree to the terms and conditions found in ${_termsURI}. ` +
        `My e-mail address is: ${email}`;
    return treatSpecialChars(statement);
}

function makeDeliveryStatement(delivery: DeliveryDetails, _termsURI: string): string {
    let billingStatement: string;
    if (delivery.billingAddress) {
        billingStatement = `My billing is: ` +
            `${delivery.billingAddress.firstName}, ${delivery.billingAddress.lastName}, ${delivery.billingAddress.address}, ` +
            `${delivery.billingAddress.complement}, ${delivery.billingAddress.postalCode}, ` +
            `${delivery.billingAddress.state}, ${delivery.billingAddress.city}, ${delivery.billingAddress.country}. `
    } else {
        billingStatement = 'Billing address is the same as delivery address.'
    }

    let statement =
        `I confirm acceptance to the terms and conditions found in ${_termsURI}. ` +
        `Email for invoice: ${delivery.deliveryAddress.email}. ` +
        `Proof of payment: ${delivery.vouchers721Address}, token id: ${delivery.voucherId}. ` +
        `My delivery data is: ` +
        `${delivery.deliveryAddress.firstName}, ${delivery.deliveryAddress.lastName}, ${delivery.deliveryAddress.address}, ` +
        `${delivery.deliveryAddress.complement}, ${delivery.deliveryAddress.postalCode}, ` +
        `${delivery.deliveryAddress.state}, ${delivery.deliveryAddress.city}, ${delivery.deliveryAddress.country}. ` +
        billingStatement;
    return treatSpecialChars(statement);
}