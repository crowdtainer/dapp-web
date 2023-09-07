import 'dotenv/config';

import { dbPreconditiosFail } from './database.js';

export const DEFAULT_INTERVAL_IN_MS = 5000;
export const INTERVAL_IN_MS = process.env.INTERVAL_IN_MS ? Number(process.env.INTERVAL_IN_MS) : DEFAULT_INTERVAL_IN_MS;

// Authentication
export const WORDPRESS_SERVER = process.env.WORDPRESS_SERVER || '';
export const WORDPRESS_API_CONSUMER_KEY = process.env.WORDPRESS_API_CONSUMER_KEY || '';
export const WORDPRESS_API_CONSUMER_SECRET = process.env.WORDPRESS_API_CONSUMER_SECRET || '';

// Order options
export const WOOCOMMERCE_PRODUCT_IDS = process.env.WOOCOMMERCE_PRODUCT_IDS || '';
export const WOOCOMMERCE_VARIATION_IDS = process.env.WOOCOMMERCE_VARIATION_IDS || '';
export const WOOCOMMERCE_PAYMENT_METHOD = process.env.WOOCOMMERCE_PAYMENT_METHOD || '';
export const WOOCOMMERCE_PAYMENT_METHOD_TITLE = process.env.WOOCOMMERCE_PAYMENT_METHOD_TITLE || '';
export const WOOCOMMERCE_SET_PAID = process.env.WOOCOMMERCE_SET_PAID || '';
export const WOOCOMMERCE_COUPON_CODE = process.env.WOOCOMMERCE_COUPON_CODE || '';

function printMissingVariable(name: string) {
    console.log(`Failure: missing ${name} environment variable.`);
}

export function checkPreconditions(): boolean {
    if (!process.env.INTERVAL_IN_MS) {
        console.log(`Warning: INTERVAL_IN_MS environment variable not defined. Using ${DEFAULT_INTERVAL_IN_MS} ms as default.`)
    }

    let missingMandatoryEnvVar = false;

    if (WORDPRESS_SERVER == '') {
        printMissingVariable('WORDPRESS_SERVER');
        missingMandatoryEnvVar = true;
    }

    if (WORDPRESS_API_CONSUMER_KEY == '') {
        printMissingVariable('WORDPRESS_API_CONSUMER_KEY');
        missingMandatoryEnvVar = true;
    }

    if (WORDPRESS_API_CONSUMER_SECRET == '') {
        printMissingVariable('WORDPRESS_API_CONSUMER_SECRET');
        missingMandatoryEnvVar = true;
    }

    if (WOOCOMMERCE_PRODUCT_IDS == '') {
        printMissingVariable('WOOCOMMERCE_PRODUCT_IDS');
        missingMandatoryEnvVar = true;
    }

    if (WOOCOMMERCE_VARIATION_IDS == '') {
        printMissingVariable('WOOCOMMERCE_VARIATION_IDS');
        missingMandatoryEnvVar = true;
    }

    if (WOOCOMMERCE_PAYMENT_METHOD == '') {
        printMissingVariable('WOOCOMMERCE_PAYMENT_METHOD');
        missingMandatoryEnvVar = true;
    }
    if (WOOCOMMERCE_PAYMENT_METHOD_TITLE == '') {
        printMissingVariable('WOOCOMMERCE_PAYMENT_METHOD_TITLE');
        missingMandatoryEnvVar = true;
    }
    if (WOOCOMMERCE_SET_PAID == '') {
        printMissingVariable('WOOCOMMERCE_SET_PAID');
        missingMandatoryEnvVar = true;
    }

    if (missingMandatoryEnvVar) {
        return false;
    }

    const dbResult = dbPreconditiosFail();
    if (dbResult.isSome()) {
        console.log(`Failure: ${dbResult.unwrap().details}`)
        return false;
    }

    return true;
}