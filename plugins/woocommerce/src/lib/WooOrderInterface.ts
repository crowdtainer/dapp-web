export interface Billing {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2?: string;
    city: string;
    state?: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
}

export interface Shipping {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2?: string;
    city: string;
    state?: string;
    postcode: string;
    country: string;
}

export interface LineItem {
    product_id: number;
    quantity: number;
    variation_id?: number;
}

export interface ShippingLine {
    method_id: string;
    method_title: string;
    total: string;
}

export interface CouponLine {
    code: string;
}

export interface WooOrderObject {
    payment_method: string;
    payment_method_title: string;
    set_paid: boolean;
    billing: Billing;
    shipping: Shipping;
    line_items: LineItem[];
    shipping_lines: ShippingLine[];
    coupon_lines: CouponLine[];
}