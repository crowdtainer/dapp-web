// Typechain
import { Vouchers721__factory } from '../data/typechain/factories/Vouchers721__factory';
import { Crowdtainer__factory } from '../data/typechain/factories/Crowdtainer__factory';

// Ethers
import { ethers, BigNumber } from 'ethers';

// Monads
import { type Result, Ok, Err } from "@sniptt/monads";

// Internal
import type { RequestHandler } from './__types/[id]'
import type { CrowdtainerStaticModel, Error } from '$lib/Model/CrowdtainerModel';
import { Vouchers721Address } from '../data/projects.json';
import { Coin__factory } from '../data/typechain';
import { crowdtainerStaticDataMap } from '../../hooks/cache';

const provider = new ethers.providers.JsonRpcBatchProvider(import.meta.env.RPC_BACKEND);

async function fetchData(crowdtainerId: BigNumber): Promise<Result<CrowdtainerStaticModel, Error>> {
   try {
      if(crowdtainerId.toNumber() === 0) {
         return Err({error: `Invalid crowdtainerId: ${crowdtainerId.toNumber()}`});
      }

      const vouchers721Contract = Vouchers721__factory.connect(Vouchers721Address, provider);

      let crowdtainerStaticData: CrowdtainerStaticModel | undefined = crowdtainerStaticDataMap.get(crowdtainerId.toHexString());

      if (crowdtainerStaticData !== undefined) {
         return Ok(crowdtainerStaticData);
      }

      let crowdtainerAddress = await vouchers721Contract.crowdtainerForId(crowdtainerId);
      const crowdtainerContract = Crowdtainer__factory.connect(crowdtainerAddress, provider);

      let tokenContractAddress = await crowdtainerContract.token();
      const ERC20Contract = Coin__factory.connect(tokenContractAddress, provider);

      let tokenDecimals = await ERC20Contract.decimals();

      let numberOfProducts = (await crowdtainerContract.numberOfProducts()).toNumber();
      let prices: BigNumber[] = [];
      let descriptions: string[] = [];
      for (let i = 0; i < numberOfProducts; i++) {
         // fetch price
         let price = await crowdtainerContract.unitPricePerType(i);
         if (price != null && price > BigNumber.from(0)) {
            prices.push(price);
         }
         // fetch product description
         let description = await vouchers721Contract.productDescription(crowdtainerId, i);
         descriptions.push(description);
      }

      let crowdtainerData: CrowdtainerStaticModel = {
         contractAddress: crowdtainerAddress,
         serviceProvider: `${await crowdtainerContract.owner()}`,
         startDate: await crowdtainerContract.openingTime(),
         endDate: await crowdtainerContract.expireTime(),
         minimumGoal: await crowdtainerContract.targetMinimum(),
         maximumGoal: await crowdtainerContract.targetMaximum(),
         productDescription: descriptions,
         prices: prices,
         token: await crowdtainerContract.token(),
         tokenDecimals: tokenDecimals,
         tokenSymbol: await ERC20Contract.symbol()
      }

      crowdtainerStaticDataMap.set(crowdtainerId.toHexString(), crowdtainerData);
      return Ok(crowdtainerData);
   } catch (errorMessage) {
      let error: Error = { error: `${errorMessage}` };
      console.log(`${errorMessage}`);
      return Err(error);
   }
}

export const get: RequestHandler<any> = async ({ params }) => {
   try {

      let responses = new Array<CrowdtainerStaticModel>();

      let projectIds: string[] = new Array<string>();

      projectIds = params.id.split(",");

      for(let i=0; i< projectIds.length; i++ ) {
         let crowdtainer = BigNumber.from(Number(projectIds[i]));
         let result = await fetchData(crowdtainer);

         if (result.isOk()) {
            responses.push(result.unwrap());
         } else {
            // Fail if any id request fails.
            return {
               status: 500,
               body: result.unwrapErr()
            };
         }
      }

      return {
         status: 200,
         body: responses
      };

   } catch (error) {
      console.log(error);
      return {
         status: 500,
         body: error
      };
   }
}