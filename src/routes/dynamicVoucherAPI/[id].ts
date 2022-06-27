// Typechain
import { Vouchers721__factory } from '../data/typechain/factories/Vouchers721__factory';
import { Crowdtainer__factory } from '../data/typechain/factories/Crowdtainer__factory';

// Ethers
import { ethers, BigNumber } from 'ethers';

// Monads
import { type Result, Ok, Err } from "@sniptt/monads";

// Internal
import type { RequestHandler } from './__types/[id]'
import type { CrowdtainerDynamicModel, Error } from '$lib/Model/CrowdtainerModel';
import { Vouchers721Address } from '../data/projects.json';

const provider = new ethers.providers.JsonRpcProvider(import.meta.env.RPC_BACKEND);

async function fetchData(crowdtainerId: BigNumber): Promise<Result<CrowdtainerDynamicModel, Error>> {
   try {
      const vouchers721Contract = Vouchers721__factory.connect(Vouchers721Address, provider);
      let crowdtainerAddress = await vouchers721Contract.crowdtainerForId(crowdtainerId);
      const crowdtainerContract = Crowdtainer__factory.connect(crowdtainerAddress, provider);

      let state: number = await crowdtainerContract.crowdtainerState();

      let crowdtainerData: CrowdtainerDynamicModel = {
         status: state,
         raised: await crowdtainerContract.totalValueRaised()
      }
      return Ok(crowdtainerData);
   } catch (errorMessage) {
      let error: Error = { error: `${errorMessage}` };
      return Err(error);
   }
}

export const get: RequestHandler<CrowdtainerDynamicModel | Error> = async ({ params}) => {

   let crowdtainerId = BigNumber.from(params.id);
   let result = await fetchData(crowdtainerId);

   if(result.isOk()) {
      return {
         status: 200,
         body: result.unwrap()
      }
   } else {
      return {
         status: 500,
         body: result.unwrapErr()
      };
   }
}