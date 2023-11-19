'use strict';

import 'dotenv/config';
import Redis from "ioredis";

import { getDatabase } from './lib/database.js';
import { CouponLine, LineItem } from './lib/WooOrderInterface.js';

var terminateProcess: boolean;
let numberOfSuccessfulyCreatedOrders = 0;

import {
    checkPreconditions, INTERVAL_IN_MS, WORDPRESS_SERVER,
    WORDPRESS_API_CONSUMER_KEY, WORDPRESS_API_CONSUMER_SECRET,
    WOOCOMMERCE_PRODUCT_IDS, WOOCOMMERCE_VARIATION_IDS, WOOCOMMERCE_COUPON_CODE,
    ALIVE_PING_INTERVAL_IN_SECONDS, HEALTH_CHECK_URL
} from './lib/preconditions.js';

const productIDs = WOOCOMMERCE_PRODUCT_IDS.split(',');
const productVariationIDs = WOOCOMMERCE_VARIATION_IDS.split(',');

import { Address, DeliveryDetails, Order } from './lib/commonTypes.js';
import { createWordpressOrders } from './lib/createWordpressOrders.js';
import axios, { AxiosInstance } from 'axios';
import { HealthReport, LogType } from 'healthreports';

export const Woo_API_Config = {
    baseURL: WORDPRESS_SERVER,
    auth: {
        username: `${WORDPRESS_API_CONSUMER_KEY}`,
        password: `${WORDPRESS_API_CONSUMER_SECRET}`
    },
    headers: { 'Content-Type': 'application/json' }
};



let healthReporter: HealthReport;

if (HEALTH_CHECK_URL) {
    healthReporter = new HealthReport(new URL(HEALTH_CHECK_URL), ALIVE_PING_INTERVAL_IN_SECONDS);
    console.log(`Alive ping signal enabled, pinging each ${ALIVE_PING_INTERVAL_IN_SECONDS} second(s).`);
} else {
    console.log(`Warning: Alive ping signal disabled.`);
}

async function performWork(axiosInstance: AxiosInstance, db: Redis) {

    if (healthReporter) healthReporter.sendAliveSignal();

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

    let ordersCreatedMessage = '0';
    if (ordersCreated.orderIDs.length > 0) {
        ordersCreatedMessage = JSON.stringify(ordersCreated);
        console.log(ordersCreatedMessage);
    }

    let lastErrorStatusCode = '';
    let lastErrorDetails = '';
    ordersWithError.forEach(element => {
        lastErrorStatusCode = element.statusCode.toString();
        lastErrorDetails = element.details;
        console.log(`Order creation failure: status code: ${lastErrorStatusCode}. Details: ${lastErrorDetails}`);
    });

    numberOfSuccessfulyCreatedOrders += ordersCreated.orderIDs.length;

    let logOrderCreatedMessage = `Orders created: ${ordersCreatedMessage}. Total since process start: ${numberOfSuccessfulyCreatedOrders}.`;
    console.log(logOrderCreatedMessage);
    if (healthReporter) healthReporter.postExternalLog(logOrderCreatedMessage, LogType.Information);

    // There are cases where an order is created, yet wordpress returns an error.
    // To avoid creating duplicate orders, we stop processing in case of failed orders
    // until the problem is manually checked and resolved.
    if (ordersWithError.length > 0) {
        let errorMessage = `Shutting down since orders with errors were detected. Last error code: ${lastErrorStatusCode}: ${lastErrorDetails}`;
        console.log(errorMessage);
        if (healthReporter) await healthReporter.postExternalLog(errorMessage, LogType.Error);
        terminateProcess = true;
    }
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
        if (orderCreated) {
            let createdTime = await db.hget(`${currentKey}:orderCreated`, 'epochTimeInMilliseconds');
            let logMessage = `Warning: Order for ${currentKey} already exists (from epoch time ${createdTime} ms). Removing delivery request job.`;
            console.log(logMessage);
            if (healthReporter) await healthReporter.postExternalLog(logMessage, LogType.Information);
            db.lrem('deliveryRequests:v1', 0, currentKey);
            continue;
        }

        // Extract currentKey data. E.g.: deliveryRequest:v1:31337:0x0165878A594ca255338adfa4d48449f69242Eb8F:1000002
        let currentKeyComponents = currentKey.split(':');
        if (currentKeyComponents.length != 5) {
            let errorMessage = `Fatal error: key ${currentKey} uses unexpected format.`;
            console.log(errorMessage);
            if (healthReporter) await healthReporter.postExternalLog(errorMessage, LogType.Error);
            terminateProcess = true;
            break;
        }

        let chainId = Number(currentKeyComponents[2]);
        let vouchers721Address = currentKeyComponents[3];
        let voucherId = Number(currentKeyComponents[4]);

        const deliveryAddressResult = await db.hgetall(`${currentKey}:deliveryAddress`);
        const deliveryAddress: Address = JSON.parse(JSON.stringify(deliveryAddressResult));

        const billingAddressResult = await db.hgetall(`${currentKey}:billingAddress`);
        let billingAddress = JSON.parse(JSON.stringify(billingAddressResult));

        let deliveryDetails: DeliveryDetails = {
            vouchers721Address,
            voucherId,
            chainId,
            deliveryAddress,
            billingAddress
        };

        const quantitiesResult = await db.get(`${currentKey}:quantities`);
        if (quantitiesResult === null) {
            let logMessage = `Skipping ${currentKey}; Quantities data not found.`;
            console.log(logMessage);
            if (healthReporter) await healthReporter.postExternalLog(logMessage, LogType.Error);
            terminateProcess = true;
            break;
        }

        const quantities = JSON.parse(quantitiesResult) as number[];
        console.log(`quantity: ${JSON.stringify(quantities)}`);

        const discountValueResult = await db.get(`${currentKey}:discount`);
        if (discountValueResult === null) {
            let logMessage = `Skipping ${currentKey}; Discount value data not found.`;
            console.log(logMessage);
            if (healthReporter) await healthReporter.postExternalLog(logMessage, LogType.Error);
            terminateProcess = true;
            break;
        }
        const discountValue = Number(discountValueResult);

        if (quantities.length !== productIDs?.length) {
            let logMessage = `Skipping ${currentKey} due mismatch in products array length. Expected: ${productIDs?.length}. Actual: ${quantities.length}.`;
            console.log(logMessage);
            if (healthReporter) await healthReporter.postExternalLog(logMessage, LogType.Error);
            terminateProcess = true;
            break;
        }

        if (quantities.length !== productVariationIDs?.length) {
            let logMessage = `Skipping ${currentKey} due mismatch in product variations array length. Expected: ${productVariationIDs?.length}. Actual: ${quantities.length}.`;
            console.log(logMessage);
            if (healthReporter) await healthReporter.postExternalLog(logMessage, LogType.Error);
            terminateProcess = true;
            break;
        }

        let lineItems = new Array<LineItem>();

        for (let lineCount = 0; lineCount < quantities.length; lineCount++) {
            if (Number(productIDs[lineCount]) === undefined) {
                break;
            }
            if (productVariationIDs) {
                console.log(`productVariationID: ${productVariationIDs[lineCount]}`);
                lineItems.push({
                    product_id: Number(productIDs[lineCount]),
                    quantity: Number(quantities[lineCount]) || 0,
                    variation_id: Number(productVariationIDs[lineCount])
                });
            } else {
                lineItems.push({
                    product_id: Number(productIDs[lineCount]),
                    quantity: Number(quantities[lineCount]) || 0
                });
            }
        }

        if (lineItems.length !== quantities.length) {
            let logMessage = `Error: ${currentKey} is missing product id.`;
            console.log(logMessage);
            if (healthReporter) await healthReporter.postExternalLog(logMessage, LogType.Error);
            terminateProcess = true;
            break;
        }

        let couponLines = new Array<CouponLine>();
        if (discountValue > 0 && WOOCOMMERCE_COUPON_CODE !== '') {
            couponLines.push({ code: WOOCOMMERCE_COUPON_CODE });
        }

        deliveryOrders.set(currentKey, { deliveryDetails, lineItems, couponLines });
    }

    if (deliveryOrders.size > 0) {
        console.log(`Work queue size: ${deliveryOrders.size}.`);
    }

    return deliveryOrders;
}

async function foreverLoop() {
    if (!checkPreconditions()) {
        terminateProcess = true;
    }

    const processStartedMessage = `Woocommerce order creator worker started @ ${new Date().toISOString()}`;
    console.log(processStartedMessage);
    if (healthReporter) await healthReporter.postExternalLog(processStartedMessage, LogType.Information);

    let axiosInstance = axios.create(Woo_API_Config);
    const db = getDatabase();

    while (!terminateProcess) {
        try {
            await performWork(axiosInstance, db);
        } catch (error) {
            let errorMessage = `Fatal error: ${error}.`;
            console.log(errorMessage);
            if (healthReporter) await healthReporter.postExternalLog(errorMessage, LogType.Error);
            terminateProcess = true;
        }
        await delay(INTERVAL_IN_MS);
    }

    console.log('Order creation worker stopping..');
    await db.quit();
    const processEndedMessage = 'Order creation worker stopped.';
    if (healthReporter) await healthReporter.postExternalLog(processEndedMessage, LogType.Error);
    console.log(processEndedMessage);
}

function delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}

await foreverLoop();