import { providers } from 'ethers';
import { SERVER_ETH_RPC } from '$env/static/private';

const url = new URL(SERVER_ETH_RPC);
console.log(`Backend ETH RPC @ ${url.protocol}//${url.hostname}:${url.port}`);

export const provider = new providers.JsonRpcProvider(SERVER_ETH_RPC);