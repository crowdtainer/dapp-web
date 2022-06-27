import { type Result, Ok, Err } from "@sniptt/monads";

import type { CrowdtainerDynamicModel, CrowdtainerStaticModel } from '$lib/Model/CrowdtainerModel';

export type Error = { code: number, message: string };

export async function fetchDynamicData(projectId: number): Promise<Result<CrowdtainerDynamicModel, Error>> {
	const response = await fetch(`dynamicVoucherAPI/${projectId}`);
	const jsonResponse = await response.json();
	if (response.status != 200) {
		return Err({ code: response.status, message: jsonResponse.error});
	}
	return Ok(jsonResponse);
}

export async function fetchStaticData(projectId: number): Promise<Result<CrowdtainerStaticModel, Error>> {
	const response = await fetch(`staticVoucherAPI/${projectId}`);
	const jsonResponse = await response.json();
	console.log(`This was called?`);
	if (response.status != 200) {
		return Err({ code: response.status, message: jsonResponse.error});
	}
	return Ok(jsonResponse);
}