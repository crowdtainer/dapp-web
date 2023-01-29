import { type Result, Ok, Err } from "@sniptt/monads";

import type { CrowdtainerDynamicModel, CrowdtainerStaticModel } from '$lib/Model/CrowdtainerModel';

export type Error = { code: number, message: string };

export async function fetchDynamicData(projectId: number): Promise<Result<CrowdtainerDynamicModel, Error>> {
	const response = await fetch(`dynamicVoucherAPI/${projectId}`);
	const jsonResponse = await response.json();
	if (response.status != 200) {
		return Err({ code: response.status, message: jsonResponse.error });
	}
	return Ok(jsonResponse);
}

export async function fetchStaticData(projectIds: number[]): Promise<Result<CrowdtainerStaticModel[], Error>> {
	let params = projectIds.filter(Boolean).join(',');
	if (params.length === 0) {
		return Err({ code: 400, message: 'No campaign id specified.' });
	}

	const response = await fetch(`staticVoucherAPI/${params}`);

	const jsonResponse = await response.json();
	if (response.status != 200) {
		return Err({ code: response.status, message: jsonResponse.error });
	}
	return Ok(jsonResponse);
}

// Pre-order steps

export async function sendChallengeCodeAPI(email: string): Promise<boolean> {
	const result = await fetch(`challengeCodeAPI/${email}`);
	return result.ok;
}

export async function requestEmailAuthorizationAPI(email: string, code: string): Promise<string> {
	let result: Response;

	result = await fetch(`authorizeEmailAPI/${email}`, {
		method: 'POST',
		body: JSON.stringify({ code: code })
	});
	return result.text();
}

export async function requestWalletAuthorizationAPI(email: string, signerAddress: string, domain: string, origin: string, nonce: string, currentTimeISO: string, sigHash: string): Promise<string> {
	let result: Response;

	result = await fetch('authorizeWalletAPI', {
		method: 'POST',
		body: JSON.stringify({ email: email, signerAddress: signerAddress, domain: domain, origin: origin, nonce: nonce, currentTimeISO: currentTimeISO, signatureHash: sigHash })
	});
	return result.text();
}

// Order confirmation

export async function requestDeliveryAPI(signerAddress: string, domain: string, origin: string, nonce: string, currentTimeISO: string, deliveryDetails: DeliveryDetails, sigHash: string): Promise<string> {
	let result: Response;

	result = await fetch('deliveryAddressAPI', {
		method: 'POST',
		body: JSON.stringify({ signerAddress: signerAddress, domain: domain, origin: origin, nonce: nonce, currentTimeISO: currentTimeISO , deliveryDetails: deliveryDetails, signatureHash: sigHash })
	});
	return result.text();
}

// Order status

// Order status details (read directly from service provider), substatus of "Delivery" from smart contract state.
export enum OrderStatus {
	Unknown,  					// Order status not loaded or not applicable.
	WaitingForDeliveryAddress,  // Participant has provided shipping/delivery details.
	DeliveryAddressReceived,    // Participant has provided shipping/delivery details.
	InvoiceSent,                // Service provider acknowledged the order and sent the invoice.
	Dispatched,                 // Service provider dispatched items for shipping/logistics service.
	Delivered                   // Shipping/logistics service marked item as delivered.
}

export async function getOrderDetailsAPI(chainId: number, vouchers721Address: string, voucherId: number): Promise<Result<OrderStatus, string>> {
	let orderStatus: OrderStatus

	try {
		let result = await fetch(`orderDetailsAPI?chainId=${chainId}&vouchers721Address=${vouchers721Address}&voucherId=${voucherId}`, {
			method: 'GET'
		});

		orderStatus = await result.json();

	} catch (error) {
		return Err(`${error}`);
	}
	return Ok(orderStatus);
}

// Note: This function can be removed once ethers supports EIP-3668. Until then, parameters
// needs to be generated / encoded manually, then joinWithSignature() called directly with authorization payload.
import { AuthorizationGateway__factory } from '../routes/typechain/factories/Crowdtainer.sol/AuthorizationGateway__factory';
import { ethers } from "ethers";
import type { DeliveryDetails } from "./Model/SignTerms";
export async function requestAuthorizationProof(wallet: string,
	crowdtainerAddress: string,
	quantities: Number[],
	enableReferral: boolean,
	referralAddress: string
): Promise<Result<[string, string], string>> {

	const abiInterface = new ethers.utils.Interface(JSON.stringify(AuthorizationGateway__factory.abi));

	const calldataValue = abiInterface.encodeFunctionData('getSignedJoinApproval',
		[crowdtainerAddress, wallet, quantities, enableReferral, referralAddress]);

	// make sure address is check-summed
	let walletWithChecksum = ethers.utils.getAddress(wallet);
	let result: Response = await fetch(`authProofAPI/${walletWithChecksum}`, {
		method: 'POST',
		body: JSON.stringify({ calldata: calldataValue })
	});

	if (!result.ok) {

		let message = '';

		try {
			let jsonResult = await JSON.parse(await result.text());
			if (jsonResult.message) {
				message = jsonResult.message;
			}
		} catch (error) {
			return Err('Unknown server response');
		}

		if (message) {
			return Err(message);
		}

		return Err(`${await result.text()}`);
	}

	let response: [string, string];
	let signedCalldata = await result.text();

	response = [calldataValue, signedCalldata];

	return Ok(response);
}
