'use strict';
import { Result, Ok } from '@sniptt/monads';
import { Order } from './commonTypes.js';
import { Billing, Shipping, ShippingLine, WooOrderObject } from './WooOrderInterface.js';

export type Error = { details: number };

export function makeWooOrderObject(inputOrderData: Order,
    paymentMethod: string,
    paymentTitle: string,
    setPaid: boolean): Result<WooOrderObject, Error> {

    // TODO: Add support for separate fields for billing
    let billing: Billing = {
        first_name: inputOrderData.deliveryDetails.firstName,
        last_name: inputOrderData.deliveryDetails.lastName,
        address_1: inputOrderData.deliveryDetails.address,
        address_2: inputOrderData.deliveryDetails.complement,
        city: inputOrderData.deliveryDetails.city,
        state: inputOrderData.deliveryDetails.state,
        postcode: inputOrderData.deliveryDetails.postalCode,
        country: inputOrderData.deliveryDetails.country,
        email: inputOrderData.deliveryDetails.email,
        phone: ''
    };

    let shipping: Shipping = {
        first_name: inputOrderData.deliveryDetails.firstName,
        last_name: inputOrderData.deliveryDetails.lastName,
        address_1: inputOrderData.deliveryDetails.address,
        address_2: inputOrderData.deliveryDetails.complement,
        city: inputOrderData.deliveryDetails.city,
        state: inputOrderData.deliveryDetails.state,
        postcode: inputOrderData.deliveryDetails.postalCode,
        country: inputOrderData.deliveryDetails.country,
    };

    let shippingLines = new Array<ShippingLine>();

    let wooOrder: WooOrderObject = {
        payment_method: paymentMethod,
        payment_method_title: paymentTitle,
        set_paid: setPaid,
        billing,
        shipping,
        line_items: inputOrderData.lineItems,
        shipping_lines: shippingLines
    };
    return Ok(wooOrder);
}
