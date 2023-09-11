import { OrderStatus } from '$lib/api';
import type { RequestHandler } from './$types';

import { error } from '@sveltejs/kit';

import { deliveryVoucherKey } from "$lib/Database/schemes";

// Monads
import { type Result, Ok, Err } from "@sniptt/monads";
import { getDatabase } from '$lib/Database/redis';

async function fetchData(chainId: number, vouchers721Address: string, voucherId: number): Promise<Result<OrderStatus, string>> {
    try {
        let redis = getDatabase();
        if (redis === undefined) {
            throw error(500, `Db connection error.`);
        }

        let key = deliveryVoucherKey(chainId, vouchers721Address, voucherId);

        if (await redis.lpos('deliveryRequests:v1', key) !== null) {
            return Ok(OrderStatus.DeliveryAddressReceived);
        } else {
            return Ok(OrderStatus.WaitingForDeliveryAddress);
        }
    } catch (error) {
        return Err(`Unable to check order status: ${error}`);
    }
}

export const GET: RequestHandler = async ({ url }) => {

    let payload = getPayload(url.searchParams)

    if (payload.isErr()) {
        throw error(400, payload.unwrapErr());
    }

    let [chainId, vouchers721Address, voucherId] = payload.unwrap();

    let result = await fetchData(chainId, vouchers721Address, voucherId);

    if (result.isOk()) {
        return new Response(JSON.stringify(result.unwrap()));
    } else {
        return new Response(JSON.stringify(result.unwrapErr()));
    }
}

function getPayload(params: URLSearchParams): Result<[chainId: number, vouchers721Address: string, voucherId: number], string> {
    try {
        let chainId = params.get('chainId');
        let vouchers721Address = params.get('vouchers721Address');
        let voucherId = params.get('voucherId');

        if (chainId == undefined) {
            return Err("Missing 'chainId' field.");
        }
        if (vouchers721Address == undefined) {
            return Err("Missing 'vouchers721Address' field.");
        }
        if (voucherId == undefined) {
            return Err("Missing 'voucherId' field.");
        }

        const result: [number, string, number] = [Number(chainId), vouchers721Address, Number(voucherId)];

        return Ok(result);
    } catch (error) {
        return Err("Error decoding input fields");
    }
}