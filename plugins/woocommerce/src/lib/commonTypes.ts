import { CouponLine, LineItem } from "./WooOrderInterface.js"

export interface Address {
    country: string;
    firstName: string;
    lastName: string;
    address: string;
    complement?: string;
    postalCode: string;
    state: string;
    city: string;
    email: string;
}

export interface DeliveryDetails {
    vouchers721Address: string,
    voucherId: number,
    chainId: number,
    deliveryAddress: Address,
    billingAddress: Address
}

export interface Order {
    deliveryDetails: DeliveryDetails,
    lineItems: LineItem[],
    couponLines: CouponLine[]
}

export type OrdersCreated = { orderIDs: string[] };
