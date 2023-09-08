'use strict';
import { AxiosError, AxiosInstance } from 'axios';
import https from 'https'
import {
    WORDPRESS_SERVER, WOOCOMMERCE_PAYMENT_METHOD, WOOCOMMERCE_PAYMENT_METHOD_TITLE,
    WOOCOMMERCE_SET_PAID
} from './preconditions.js';
import { Order, OrdersCreated } from './commonTypes.js';
import { makeWooOrderObject } from './makeWooOrderObject.js';

import assert from 'node:assert';

export type RequestError = { statusCode: number, details: string };

export async function createWordpressOrders(axios: AxiosInstance, deliveries: Map<string, Order>, onCreated: (id: string) => void)
    : Promise<[OrdersCreated, Array<RequestError>]> {

    let ordersCreated = new Array<string>();
    let ordersWithError = new Array<RequestError>();

    /**
    * Disable SSL check in development mode
    */
    if (process.env.NODE_ENV === 'development') {
        console.log(`Warning: Development mode active. Allowing invalid SSL certs: RejectUnauthorized disabled.`);
        const httpsAgent = new https.Agent({
            rejectUnauthorized: false,
        })
        axios.defaults.httpsAgent = httpsAgent
    }

    for (const [id, order] of deliveries) {

        const wooOrderObject = makeWooOrderObject(order, WOOCOMMERCE_PAYMENT_METHOD, WOOCOMMERCE_PAYMENT_METHOD_TITLE, Boolean(WOOCOMMERCE_SET_PAID));

        assert(wooOrderObject.isOk());
        let requestError: any | undefined;

        console.log(`Woocommerce API payload: ${JSON.stringify(wooOrderObject.unwrap())}`);

        await Promise.all([await axios.post(`${WORDPRESS_SERVER}/wp-json/wc/v3/orders`, wooOrderObject.unwrap())
            .then(function (response) {

                console.log(response.data);
                console.log(response.status);
                console.log(response.statusText);
                console.log(response.headers);
                console.log(response.config);

                onCreated(id);
                ordersCreated.push(id);
            })
            .catch(function (error) {
                console.log(`${JSON.stringify(error)}`);
                requestError = error;
            })]);

        if (requestError !== undefined) {
            ordersWithError.push(makeError(requestError));
        }
    }

    let aggregateResult: [OrdersCreated, Array<RequestError>] = [{ orderIDs: ordersCreated }, ordersWithError];
    return aggregateResult;
}

function makeError(error: any): RequestError {
    if (error.response) {
        return { statusCode: error.response.statusCode, details: `${error.response.statusText}. ${error.message}.` };
    } else if (error.request) {
        // The request was made but no response was received
        return { statusCode: 500, details: 'No server response' };
    } else {
        // Something happened in setting up the request that triggered an Error
        return { statusCode: error.statusCode, details: `${error.message}\n${error.config}` };
    }
}