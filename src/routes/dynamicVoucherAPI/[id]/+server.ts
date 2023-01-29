// Typechain
import { Vouchers721__factory } from '../../typechain/factories/Vouchers721__factory';
import { Crowdtainer__factory } from '../../typechain/factories/Crowdtainer.sol/Crowdtainer__factory';
import type { IERC20 } from '../../typechain';

// Ethers
import { ethers, BigNumber } from 'ethers';

// Monads
import { type Result, Ok, Err } from "@sniptt/monads";

// Internal
import type { RequestHandler } from './$types';
import type { CrowdtainerDynamicModel, CrowdtainerStaticModel, Error } from '$lib/Model/CrowdtainerModel';
import { Vouchers721Address } from '../../Data/projects.json';
import { crowdtainerStaticDataMap } from '../../../hooks/cache';
import { getERC20Contract } from '$lib/ethersCalls/rpcRequests';

// import { Network, Alchemy } from 'alchemy-sdk';
// const settings = {
//    apiKey: SERVER_ETH_RPC,
//    network: Network.OPT_MAINNET
// };
// const alchemy = new Alchemy(settings);
// const provider =await alchemy.config.getProvider();

import { SERVER_ETH_RPC } from '$env/static/private';

const provider = new ethers.providers.JsonRpcProvider(SERVER_ETH_RPC);

async function fetchData(crowdtainerId: BigNumber): Promise<Result<CrowdtainerDynamicModel, Error>> {
   try {
      let crowdtainerAddress: string;
      let crowdtainerStaticData: CrowdtainerStaticModel | undefined = crowdtainerStaticDataMap.get(crowdtainerId.toHexString());
      const vouchers721Contract = Vouchers721__factory.connect(Vouchers721Address, provider);

      if (crowdtainerStaticData === undefined || crowdtainerStaticData.contractAddress === undefined) {
         crowdtainerAddress = await vouchers721Contract.crowdtainerForId(crowdtainerId);
      } else {
         crowdtainerAddress = crowdtainerStaticData.contractAddress;
      }

      const crowdtainerContract = Crowdtainer__factory.connect(crowdtainerAddress, provider);

      let state: number = await crowdtainerContract.crowdtainerState();
      let erc20ContractResult = await getERC20Contract(provider, crowdtainerAddress);
      let erc20Contract: IERC20;

      if (erc20ContractResult.isErr()) {
         let error = erc20ContractResult.unwrapErr();
         console.log(error);
         return Err({ error: error });
      } else {
         erc20Contract = erc20ContractResult.unwrap();
      }

      let crowdtainerData: CrowdtainerDynamicModel = {
         status: state,
         raised: await crowdtainerContract.totalValueRaised(),
         fundsInContract: await erc20Contract.balanceOf(crowdtainerAddress)
      }

      return Ok(crowdtainerData);
   } catch (errorMessage) {
      let error: Error = { error: `${errorMessage}` };
      return Err(error);
   }
}

export const GET: RequestHandler = async ({ params }) => {

   let crowdtainerId = BigNumber.from(params.id);
   let result = await fetchData(crowdtainerId);

   if (result.isOk()) {
      return new Response(JSON.stringify(result.unwrap()));
   } else {
      return new Response(JSON.stringify(result.unwrapErr()));
   }
}