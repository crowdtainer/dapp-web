// key schemes

export const deliveryRequestsKey = 'deliveryRequests:v1';

export function deliveryVoucherKey(chainId: number, vouchers721address: string, voucherId: number): string {
    return `deliveryRequest:v1:${chainId}:${vouchers721address}:${voucherId}`;
}