'use strict';
import { Result, Ok } from '@sniptt/monads';
import { Order } from './commonTypes.js';
import { Billing, Shipping, ShippingLine, WooOrderObject } from './WooOrderInterface.js';

export type Error = { details: number };

export function makeWooOrderObject(inputOrderData: Order,
    paymentMethod: string,
    paymentTitle: string,
    setPaid: boolean): Result<WooOrderObject, Error> {

    let billing: Billing;

    if (inputOrderData.deliveryDetails.billingAddress) {
        billing = {
            first_name: inputOrderData.deliveryDetails.billingAddress.firstName,
            last_name: inputOrderData.deliveryDetails.billingAddress.lastName,
            address_1: inputOrderData.deliveryDetails.billingAddress.address,
            address_2: inputOrderData.deliveryDetails.billingAddress.complement,
            city: inputOrderData.deliveryDetails.billingAddress.city,
            state: inputOrderData.deliveryDetails.billingAddress.state,
            postcode: inputOrderData.deliveryDetails.billingAddress.postalCode,
            country: inputOrderData.deliveryDetails.billingAddress.country,
            email: inputOrderData.deliveryDetails.billingAddress.email,
            phone: ''
        };
    } else {
        // If undefined, it means it is the same as delivery address.
        billing = {
            first_name: inputOrderData.deliveryDetails.deliveryAddress.firstName,
            last_name: inputOrderData.deliveryDetails.deliveryAddress.lastName,
            address_1: inputOrderData.deliveryDetails.deliveryAddress.address,
            address_2: inputOrderData.deliveryDetails.deliveryAddress.complement,
            city: inputOrderData.deliveryDetails.deliveryAddress.city,
            state:inputOrderData.deliveryDetails.deliveryAddress.state,
            postcode: inputOrderData.deliveryDetails.deliveryAddress.postalCode,
            country: inputOrderData.deliveryDetails.deliveryAddress.country,
            email: inputOrderData.deliveryDetails.deliveryAddress.email,
            phone: ''
        };
    }

    let shipping: Shipping = {
        first_name: inputOrderData.deliveryDetails.deliveryAddress.firstName,
        last_name: inputOrderData.deliveryDetails.deliveryAddress.lastName,
        address_1: inputOrderData.deliveryDetails.deliveryAddress.address,
        address_2: inputOrderData.deliveryDetails.deliveryAddress.complement,
        city: inputOrderData.deliveryDetails.deliveryAddress.city,
        state: inputOrderData.deliveryDetails.deliveryAddress.state,
        postcode: inputOrderData.deliveryDetails.deliveryAddress.postalCode,
        country: inputOrderData.deliveryDetails.deliveryAddress.country,
    };

    let shippingLines = new Array<ShippingLine>();

    let wooOrder: WooOrderObject = {
        payment_method: paymentMethod,
        payment_method_title: paymentTitle,
        set_paid: setPaid,
        billing,
        shipping,
        line_items: inputOrderData.lineItems,
        shipping_lines: shippingLines,
        coupon_lines: inputOrderData.couponLines
    };
    return Ok(wooOrder);
}
