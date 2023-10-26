// Typechain
import { Vouchers721__factory } from '../../typechain/factories/Vouchers721__factory';
import { Crowdtainer__factory } from '../../typechain/factories/Crowdtainer.sol/Crowdtainer__factory';
import type { IERC20 } from '../../typechain';

// Monads
import { type Result, Ok, Err } from "@sniptt/monads";

// Internal
import type { RequestHandler } from './$types';
import type { CrowdtainerDynamicModel, CrowdtainerStaticModel, Error } from '$lib/Model/CrowdtainerModel';
import { Vouchers721Address } from '../../Data/projects.json';
import { crowdtainerStaticDataMap, crowdtainerDynamicDataMap } from '../../../hooks/cache';
import { getERC20Contract } from '$lib/ethersCalls/rpcRequests';
import { provider } from '$lib/ethersCalls/provider';
import { json } from '@sveltejs/kit';

(BigInt.prototype as any).toJSON = function () {
   return this.toString();
};

let lastFetchEpochTimeInMilliseconds = 0;
const cacheExpirationTimeInMilliseconds = 6 * 1000; // 6 seconds

async function fetchData(crowdtainerId: bigint): Promise<Result<CrowdtainerDynamicModel, Error>> {
   try {
      if (Number(crowdtainerId) === 0) {
         return Err({ error: `Invalid crowdtainerId: ${Number(crowdtainerId)}` });
      }

      let crowdtainerDynamicData: CrowdtainerDynamicModel | undefined = crowdtainerDynamicDataMap.get(crowdtainerId.toString(16));
      const start = Date.now();
      const elapsed = start - lastFetchEpochTimeInMilliseconds;
      if (crowdtainerDynamicData !== undefined && elapsed < cacheExpirationTimeInMilliseconds) {
         return Ok(crowdtainerDynamicData);
      }

      console.log(`Fetching dynamic data for Crowdtainer ID ${crowdtainerId}..`);
      let crowdtainerAddress: string;
      let crowdtainerStaticData: CrowdtainerStaticModel | undefined = crowdtainerStaticDataMap.get(crowdtainerId.toString(16));
      await provider.ready;

      const vouchers721Contract = Vouchers721__factory.connect(Vouchers721Address, provider);

      if (crowdtainerStaticData === undefined || crowdtainerStaticData.contractAddress === undefined) {
         crowdtainerAddress = await vouchers721Contract.crowdtainerForId(crowdtainerId);
      } else {
         crowdtainerAddress = crowdtainerStaticData.contractAddress;
      }

      const crowdtainerContract = Crowdtainer__factory.connect(crowdtainerAddress, provider);

      let state = await crowdtainerContract.crowdtainerState();
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
         status: Number(state),
         raised: await crowdtainerContract.totalValueRaised(),
         fundsInContract: await erc20Contract.balanceOf(crowdtainerAddress)
      }

      crowdtainerDynamicDataMap.set(crowdtainerId.toString(16), crowdtainerData);
      lastFetchEpochTimeInMilliseconds = Date.now();
      console.log(`Done. Crowdtainer ID ${crowdtainerId} dynamic data fetch took ${(lastFetchEpochTimeInMilliseconds - start) / 1000} seconds.`);

      return Ok(crowdtainerData);
   } catch (errorMessage) {
      let error: Error = { error: `${errorMessage}` };
      return Err(error);
   }
}

export const GET: RequestHandler = async ({ params }) => {

   let crowdtainerId = BigInt(params.id);
   let result = await fetchData(crowdtainerId);

   if (result.isOk()) {
      return json(result.unwrap());
   } else {
      return json(result.unwrapErr());
   }
}