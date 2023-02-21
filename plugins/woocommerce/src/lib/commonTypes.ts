import { LineItem } from "./WooOrderInterface.js"

export interface DeliveryDetails {
    vouchers721Address: string,
    voucherId: number,
    chainId: number,
    country: string,
    firstName: string,
    lastName: string,
    address: string,
    complement: string,
    postalCode: string,
    state: string,
    city: string,
    email: string
}

export interface Order {
    deliveryDetails: DeliveryDetails,
    lineItems: LineItem[]
}

export type OrdersCreated = { orderIDs: string[] };
