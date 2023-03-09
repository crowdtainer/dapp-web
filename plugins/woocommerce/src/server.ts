// TODO: Create abstraction of common code from notifications and this plugin.

'use strict';

import 'dotenv/config';
import Redis from "ioredis";

import { getDatabase } from './lib/database.js';
import { LineItem } from './lib/WooOrderInterface.js';

var terminateProcess: boolean;
let numberOfSuccessfulyCreatedOrders = 0;

import {
    checkPreconditions, INTERVAL_IN_MS, WORDPRESS_SERVER,
    WORDPRESS_API_CONSUMER_KEY, WORDPRESS_API_CONSUMER_SECRET,
    WOOCOMMERCE_PRODUCT_IDS
} from './lib/preconditions.js';

const productIDs = WOOCOMMERCE_PRODUCT_IDS.split(',');

import { DeliveryDetails, Order } from './lib/commonTypes.js';
import { createWordpressOrders } from './lib/createWordpressOrders.js';
import axios, { AxiosInstance } from 'axios';

export const Woo_API_Config = {
    baseURL: WORDPRESS_SERVER,
    auth: {
        username: WORDPRESS_API_CONSUMER_KEY,
        password: WORDPRESS_API_CONSUMER_SECRET
    },
    headers: { 'Content-Type': 'application/json' }
};

async function performWork(axiosInstance: AxiosInstance, db: Redis) {

    console.log('\n');
    const deliveryOrders = await getDeliveryOrdersWork(db);
    if (deliveryOrders.size == 0) {
        return;
    }

    const [ordersCreated, ordersWithError] = await createWordpressOrders(axiosInstance, deliveryOrders, async function onCreated(id: string) {
        await db.multi()
            .hsetnx(`${id}:orderCreated`, 'epochTimeInMilliseconds', new Date().getTime()) // Flag order as created.
            .lrem('deliveryRequests:v1', 0, id)
            .del(`${id}:quantities`)
            .exec();
    });

    if (ordersCreated.orderIDs.length > 0) {
        console.log(`Orders created: ${JSON.stringify(ordersCreated)}`);
    }

    if (ordersWithError.length > 0) {
        console.log(`Order creation failures: ${JSON.stringify(ordersWithError)}`);
    }

    numberOfSuccessfulyCreatedOrders += ordersCreated.orderIDs.length;
    console.log(`Total orders created since process start: ${numberOfSuccessfulyCreatedOrders}.`);
}

function signalHandler() {
    console.log('Termination signal received, stopping..');
    terminateProcess = true;
}

process.on('SIGINT', signalHandler);
process.on('SIGTERM', signalHandler);
process.on('SIGQUIT', signalHandler);

async function getDeliveryOrdersWork(db: Redis): Promise<Map<string, Order>> {

    const deliveryRequestIds = await db.lrange("deliveryRequests:v1", 0, -1);
    const deliveryOrders = new Map<string, Order>();

    for (let i = 0; i < deliveryRequestIds.length; i++) {

        let currentKey = deliveryRequestIds[i];
        console.log(`Current key: ${currentKey}`);

        let orderCreated = await db.hexists(`${currentKey}:orderCreated`, 'epochTimeInMilliseconds');
        if(orderCreated) {
            let createdTime = await db.hget(`${currentKey}:orderCreated`, 'epochTimeInMilliseconds');
            console.log(`Warning: Order for ${currentKey} already exists (from epoch time ${createdTime} ms). Removing delivery request job.`)
            db.lrem('deliveryRequests:v1', 0, currentKey);
            continue;
        }

        const deliveryDetailsResult = await db.hgetall(currentKey);
        const deliveryDetails: DeliveryDetails = JSON.parse(JSON.stringify(deliveryDetailsResult));

        const quantitiesResult = await db.get(`${currentKey}:quantities`);

        if (quantitiesResult === null) {
            console.log(`Error: Skipping ${currentKey}; Quantities data not found.`);
            continue;
        }

        const quantities = JSON.parse(quantitiesResult) as number[];
        console.log(`quantity: ${JSON.stringify(quantities)}`);

        if (quantities.length !== productIDs?.length) {
            console.log(`Error: Skipping ${currentKey} due mismatch in array length. Expected: ${productIDs?.length}. Actual: ${quantities.length}.`);
            continue;
        }

        let lineItems = new Array<LineItem>();

        for (let lineCount = 0; lineCount < quantities.length; lineCount++) {
            if (Number(productIDs[lineCount]) === undefined) {
                break;
            }
            lineItems.push({ product_id: Number(productIDs[lineCount]), quantity: Number(quantities[lineCount]) || 0 });
        }

        if (lineItems.length !== quantities.length) {
            console.log(`Error: Skipping ${currentKey} due missing product id.`);
            continue;
        }

        console.log(`Fetched: ${currentKey}`);
        deliveryOrders.set(currentKey, { deliveryDetails, lineItems });
    }

    if (deliveryOrders.size === 0) {
        console.log(`Work queue empty.`);
    }

    return deliveryOrders;
}

async function foreverLoop() {
    if (!checkPreconditions()) {
        terminateProcess = true;
    }

    console.log("Order creation worker started.");

    const db = getDatabase();
    let axiosInstance = axios.create(Woo_API_Config);

    while (!terminateProcess) {
        await performWork(axiosInstance, db);
        await delay(INTERVAL_IN_MS);
    }

    console.log("Order creation worker stopped.");
    db.quit();
}

function delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}

await foreverLoop();