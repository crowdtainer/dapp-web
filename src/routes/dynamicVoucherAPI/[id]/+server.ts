// Typechain
import { Vouchers721__factory } from '../../typechain/factories/Vouchers721__factory';
import { Crowdtainer__factory } from '../../typechain/factories/Crowdtainer.sol/Crowdtainer__factory';
import { IERC20__factory, type IERC20 } from '../../typechain';

// Ethers
import { BigNumber } from 'ethers';

// Monads
import { type Result, Ok, Err } from "@sniptt/monads";

// Internal
import type { RequestHandler } from './$types';
import type { CrowdtainerDynamicModel, CrowdtainerStaticModel, Error } from '$lib/Model/CrowdtainerModel';
import { Vouchers721Address } from '../../Data/projects.json';
import { crowdtainerStaticDataMap, crowdtainerDynamicDataMap } from '../../../hooks/cache';
import { getERC20Contract } from '$lib/ethersCalls/rpcRequests';
import { provider } from '$lib/ethersCalls/provider';

let lastFetchEpochTimeInMilliseconds = 0;
const cacheExpirationTimeInMilliseconds = 6 * 1000; // 6 seconds

let erc20Contract: IERC20;
let crowdtainerForIdMap = new Map<BigNumber, string>();

async function fetchData(crowdtainerId: BigNumber): Promise<Result<CrowdtainerDynamicModel, Error>> {
   try {
      if (crowdtainerId.toNumber() <= 0) {
         return Err({ error: `Invalid crowdtainerId: ${crowdtainerId.toNumber()}` });
      }

      let crowdtainerDynamicData: CrowdtainerDynamicModel | undefined = crowdtainerDynamicDataMap.get(crowdtainerId.toHexString());
      const start = Date.now();
      const elapsed = start - lastFetchEpochTimeInMilliseconds;
      if (crowdtainerDynamicData !== undefined && elapsed < cacheExpirationTimeInMilliseconds) {
         return Ok(crowdtainerDynamicData);
      }

      console.log(`Fetching dynamic data for Crowdtainer ID ${crowdtainerId}..`);
      let crowdtainerAddress: string;
      let crowdtainerStaticData: CrowdtainerStaticModel | undefined = crowdtainerStaticDataMap.get(crowdtainerId.toHexString());
      await provider.ready;

      const vouchers721Contract = Vouchers721__factory.connect(Vouchers721Address, provider);

      let crowdtainerIdCached = crowdtainerForIdMap.get(crowdtainerId);
      if (!crowdtainerIdCached || crowdtainerStaticData === undefined || crowdtainerStaticData.contractAddress === undefined) {
         crowdtainerAddress = await vouchers721Contract.crowdtainerForId(crowdtainerId);
         crowdtainerForIdMap.set(crowdtainerId, crowdtainerAddress);
      } else {
         crowdtainerAddress = crowdtainerStaticData.contractAddress;
         erc20Contract = IERC20__factory.connect(crowdtainerStaticData.tokenAddress, provider);
      }

      const crowdtainerContract = Crowdtainer__factory.connect(crowdtainerAddress, provider);

      let state: number = await crowdtainerContract.crowdtainerState();
      if (!erc20Contract) {
         let erc20ContractResult = await getERC20Contract(provider, crowdtainerAddress);

         if (erc20ContractResult.isErr()) {
            let error = erc20ContractResult.unwrapErr();
            console.log(error);
            return Err({ error: error });
         } else {
            erc20Contract = erc20ContractResult.unwrap();
         }
      }

      let crowdtainerData: CrowdtainerDynamicModel = {
         status: state,
         raised: await crowdtainerContract.totalValueRaised(),
         fundsInContract: await erc20Contract.balanceOf(crowdtainerAddress)
      }

      crowdtainerDynamicDataMap.set(crowdtainerId.toHexString(), crowdtainerData);
      lastFetchEpochTimeInMilliseconds = Date.now();
      console.log(`Done. Crowdtainer ID ${crowdtainerId} dynamic data fetch took ${(lastFetchEpochTimeInMilliseconds - start) / 1000} seconds.`);

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