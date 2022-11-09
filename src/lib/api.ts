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

export async function requestWalletAuthorizationAPI(wallet:string, email: string, sigHash: string): Promise<string> {	
	let result: Response;

	result = await fetch(`authorizeWalletAPI/${wallet}`, {
		method: 'POST',
		body: JSON.stringify({ email: email, signatureHash: sigHash })
	});
	return result.text();
}