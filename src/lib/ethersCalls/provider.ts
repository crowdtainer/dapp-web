
import { SERVER_ETH_RPC } from '$env/static/private';
import { JsonRpcProvider } from 'ethers';

const url = new URL(SERVER_ETH_RPC);
console.log(`Backend ETH RPC @ ${url.protocol}//${url.hostname}:${url.port}`);

export const provider = new JsonRpcProvider(SERVER_ETH_RPC);