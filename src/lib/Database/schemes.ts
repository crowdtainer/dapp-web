// key schemes

function shortenAddress(address: string) {
    return address.slice(0, 6) + '...' + address.slice(-4);
}

export function deliveryVoucherKey(chainId: number, vouchers721address: string, voucherId: number): string {
    return `deliveryRequest:v1:${chainId}:${shortenAddress(vouchers721address)}:${voucherId}`;
}