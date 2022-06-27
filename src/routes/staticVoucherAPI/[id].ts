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
import { Vouchers721Address, MetadataServiceV1Address } from '../data/projects.json';
import { Coin__factory } from '../data/typechain';

const provider = new ethers.providers.JsonRpcProvider(import.meta.env.RPC_BACKEND);

async function fetchData(crowdtainerId: BigNumber): Promise<Result<CrowdtainerStaticModel, Error>> {
   try {
      const vouchers721Contract = Vouchers721__factory.connect(Vouchers721Address, provider);
      let crowdtainerAddress = await vouchers721Contract.crowdtainerForId(crowdtainerId);
      const crowdtainerContract = Crowdtainer__factory.connect(crowdtainerAddress, provider);

      let state: number = await crowdtainerContract.crowdtainerState();

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
      return Ok(crowdtainerData);
   } catch (errorMessage) {
      let error: Error = { error: `${errorMessage}` };
      return Err(error);
   }
}

export const get: RequestHandler<CrowdtainerStaticModel | Error> = async ({ params}) => {

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