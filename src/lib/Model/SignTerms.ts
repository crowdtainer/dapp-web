import type { Signer } from 'ethers';

// Monads
import { type Result, Ok, Err } from "@sniptt/monads";
import { treatSpecialChars } from '$lib/Utils/sanitize.js';

export let domain = import.meta.env.VITE_DOMAIN;
export let termsURI = `${domain}/${import.meta.env.VITE_TERMS_OF_AGREEMENT_PATH}`;

export interface Address {
    country: string;
    firstName: string;
    lastName: string;
    address: string;
    complement?: string;
    postalCode: string;
    state?: string;
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

export function makeAddress(): Address {
    return {
        country: '',
        firstName: '',
        lastName: '',
        address: '',
        postalCode: '',
        complement: '',
        city: '',
        email: ''
    };
}

export function normalizeDeliveryDetails(deliveryDetails: DeliveryDetails): DeliveryDetails {
    deliveryDetails.deliveryAddress.country = treatSpecialChars(deliveryDetails.deliveryAddress.country);
    deliveryDetails.deliveryAddress.firstName = treatSpecialChars(deliveryDetails.deliveryAddress.firstName);
    deliveryDetails.deliveryAddress.lastName = treatSpecialChars(deliveryDetails.deliveryAddress.lastName);
    deliveryDetails.deliveryAddress.address = treatSpecialChars(deliveryDetails.deliveryAddress.address);
    deliveryDetails.deliveryAddress.complement = treatSpecialChars(deliveryDetails.deliveryAddress.complement ? deliveryDetails.deliveryAddress.complement : '');
    deliveryDetails.deliveryAddress.postalCode = treatSpecialChars(deliveryDetails.deliveryAddress.postalCode);
    deliveryDetails.deliveryAddress.city = treatSpecialChars(deliveryDetails.deliveryAddress.city);
    deliveryDetails.deliveryAddress.state = treatSpecialChars(deliveryDetails.deliveryAddress.state ? deliveryDetails.deliveryAddress.state : '');
    deliveryDetails.deliveryAddress.email = treatSpecialChars(deliveryDetails.deliveryAddress.email);

    if (deliveryDetails.billingAddress) {
        deliveryDetails.billingAddress.country = treatSpecialChars(deliveryDetails.billingAddress.country);
        deliveryDetails.billingAddress.firstName = treatSpecialChars(deliveryDetails.billingAddress.firstName);
        deliveryDetails.billingAddress.lastName = treatSpecialChars(deliveryDetails.billingAddress.lastName);
        deliveryDetails.billingAddress.address = treatSpecialChars(deliveryDetails.billingAddress.address);
        deliveryDetails.billingAddress.complement = treatSpecialChars(deliveryDetails.billingAddress.complement ? deliveryDetails.billingAddress.complement : '');
        deliveryDetails.billingAddress.postalCode = treatSpecialChars(deliveryDetails.billingAddress.postalCode);
        deliveryDetails.billingAddress.city = treatSpecialChars(deliveryDetails.billingAddress.city);
        deliveryDetails.billingAddress.state = treatSpecialChars(deliveryDetails.billingAddress.state ? deliveryDetails.billingAddress.state : '');
        deliveryDetails.billingAddress.email = treatSpecialChars(deliveryDetails.billingAddress.email);
    }
    return deliveryDetails;
}

export function isTimeValid(timeISO: string): boolean {
    try {
        // Signatures older than one day, or too far in the future are rejected
        const timeDifference = +new Date() - +new Date(timeISO);
        console.log(`Signature time difference: ${timeDifference}`);
        if (timeDifference < -360000 || timeDifference > 360000) {
            console.log(`Rejected signature.`);
            return false;
        } else return true;
    } catch (error) {
        console.warn(`Unable to validate ISO time string: ${timeISO}`);
        return false;
    }
}

export function makeAgreeToTermsMessage(domain: string, email: string, walletAddress: string, chainId: string,
    voucherAddress: string, crowdtainerAddress: string, nonce: string, ISO8601_issuedAt: string): string {
    const message: string = `
${domain} wants you to sign in with your Ethereum account:
${walletAddress}

${makeAgreeToTermsStatement(email, termsURI, chainId, voucherAddress, crowdtainerAddress)}

URI: ${termsURI}
Version: 1
Chain ID: ${import.meta.env.VITE_WALLET_CONNECT_CHAIN_ID}
Nonce: ${nonce}
Issued At: ${ISO8601_issuedAt}`;

    return message;
}

export function makeDeliveryRequestMessage(
    walletAddress: string,
    domain: string,
    deliveryAddress: DeliveryDetails,
    nonce: string,
    ISO8601_issuedAt: string
): string {

    const message: string = `
${domain} wants you to sign in with your Ethereum account:
${walletAddress}

${makeDeliveryStatement(deliveryAddress, termsURI)}

URI: ${termsURI}
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

function makeAgreeToTermsStatement(email: string, _termsURI: string, chainId: string,
    voucherAddress: string, crowdtainerAddress: string,): string {
    let statement = `My e-mail address is: ${email}. I agree to the terms and conditions found in ${_termsURI}, for participation in Crowdtainer at network address as specified: \n\n` +
        `voucher ${voucherAddress},\n crowdtainer: ${crowdtainerAddress}.`;
    return treatSpecialChars(statement);
}

function makeDeliveryStatement(delivery: DeliveryDetails, _termsURI: string): string {
    let billingStatement: string;
    if (JSON.stringify(delivery.billingAddress) !== JSON.stringify(delivery.deliveryAddress)) {
        billingStatement = `My billing is: ` +
            `${delivery.billingAddress.firstName}, ${delivery.billingAddress.lastName}, ${delivery.billingAddress.address}, ` +
            `${(delivery.billingAddress.complement !== '') ? `${delivery.billingAddress.complement},` : ''} ${delivery.billingAddress.postalCode}, ` +
            `${(delivery.billingAddress.state) ? `${delivery.billingAddress.state},` : ''}  ${delivery.billingAddress.city}, ${delivery.billingAddress.country}. `
    } else {
        billingStatement = 'Billing address is the same as delivery address.'
    }

    let statement =
        `I confirm acceptance to the terms and conditions found in ${_termsURI}. ` +
        `Email for invoice: ${treatSpecialChars(delivery.deliveryAddress.email)}. ` +
        `Proof of payment: ${treatSpecialChars(delivery.vouchers721Address)}, token id: ${treatSpecialChars(`${delivery.voucherId}`)}. ` +
        `My delivery address is: ` +
        `${delivery.deliveryAddress.lastName}, ${delivery.deliveryAddress.firstName}, ${delivery.deliveryAddress.address}, ` +
        `${(delivery.deliveryAddress.complement !== '') ? `${delivery.deliveryAddress.complement},` : ''} ${delivery.deliveryAddress.postalCode}, ` +
        `${(delivery.deliveryAddress.state !== '') ? `${delivery.deliveryAddress.state},` : ''} ${delivery.deliveryAddress.city}, ${delivery.deliveryAddress.country}. ` +
        billingStatement;
    return statement;
}