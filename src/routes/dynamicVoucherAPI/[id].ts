// Typechain
import { Vouchers721__factory } from '../typechain/factories/Vouchers721__factory';
import { Crowdtainer__factory } from '../typechain/factories/Crowdtainer.sol/Crowdtainer__factory';

// Ethers
import { ethers, BigNumber } from 'ethers';

// Monads
import { type Result, Ok, Err } from "@sniptt/monads";

// Internal
import type { RequestHandler } from './__types/[id]'
import type { CrowdtainerDynamicModel, CrowdtainerStaticModel, Error } from '$lib/Model/CrowdtainerModel';
import { Vouchers721Address } from '../data/projects.json';
import { crowdtainerStaticDataMap } from '../../hooks/cache';

// import { Network, Alchemy } from 'alchemy-sdk';

const settings = {
   apiKey: import.meta.env.VITE_RPC_API_KEY,
   network: import.meta.env.VITE_RPC_BACKEND
 };
// const alchemy = new Alchemy(settings);
// const provider =await alchemy.config.getProvider();

const provider = new ethers.providers.JsonRpcProvider(import.meta.env.VITE_RPC_BACKEND);

async function fetchData(crowdtainerId: BigNumber): Promise<Result<CrowdtainerDynamicModel, Error>> {
   try {

      let crowdtainerAddress: string;
      let crowdtainerStaticData: CrowdtainerStaticModel | undefined = crowdtainerStaticDataMap.get(crowdtainerId.toHexString());
      const vouchers721Contract = Vouchers721__factory.connect(Vouchers721Address, provider);

      if(crowdtainerStaticData === undefined || crowdtainerStaticData.contractAddress === undefined) {
         crowdtainerAddress = await vouchers721Contract.crowdtainerForId(crowdtainerId);
      } else {
         crowdtainerAddress = crowdtainerStaticData.contractAddress;
      }

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