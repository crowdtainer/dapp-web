// Typechain
import { Vouchers721__factory } from '../../typechain/factories/Vouchers721__factory';
import { Crowdtainer__factory } from '../../typechain/factories/Crowdtainer.sol/Crowdtainer__factory';

// Ethers
import { BigNumber, Contract } from 'ethers';

// Monads
import { type Result, Ok, Err } from "@sniptt/monads";

// Internal
import type { RequestHandler } from './$types';
import type { CrowdtainerStaticModel, Error } from '$lib/Model/CrowdtainerModel';
import { Vouchers721Address } from '../../Data/projects.json';
import { Coin__factory } from '../../typechain/';
import { crowdtainerStaticDataMap } from '../../../hooks/cache';
import { error } from '@sveltejs/kit';
import { provider } from '$lib/ethersCalls/provider';

async function fetchData(crowdtainerId: BigNumber): Promise<Result<CrowdtainerStaticModel, Error>> {

   try {
      if (crowdtainerId.toNumber() === 0) {
         return Err({ error: `Invalid crowdtainerId: ${crowdtainerId.toNumber()}` });
      }

      let crowdtainerStaticData: CrowdtainerStaticModel | undefined = crowdtainerStaticDataMap.get(crowdtainerId.toHexString());

      if (crowdtainerStaticData) {
         return Ok(crowdtainerStaticData);
      }

      console.log(`Fetching static data for Crowdtainer ID ${crowdtainerId}..`);
      const start = Date.now();
      await provider.ready;
      const vouchers721Contract = Vouchers721__factory.connect(Vouchers721Address, provider);

      console.log(`CrowdtainerId: ${crowdtainerId}`);
      console.log(`vouchers721Contract.address: ${vouchers721Contract.address}`);

      let crowdtainerAddress: string;
      let crowdtainerContract: Contract;
      try {
         crowdtainerAddress = await vouchers721Contract.crowdtainerForId(crowdtainerId);

      } catch (error) {
         console.dir(error);
         return Err({ error: `${error}` });
      }
      crowdtainerContract = Crowdtainer__factory.connect(crowdtainerAddress, provider);

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
         tokenSymbol: await ERC20Contract.symbol(),
         signer: await crowdtainerContract.getSigner()
      }

      crowdtainerStaticDataMap.set(crowdtainerId.toHexString(), crowdtainerData);
      console.log(`Done. Crowdtainer ID ${crowdtainerId} static data fetch took ${(Date.now() - start) / 1000} seconds.`);
      return Ok(crowdtainerData);
   } catch (errorMessage) {
      let error: Error = { error: `${errorMessage}` };
      console.dir(errorMessage);
      return Err(error);
   }
}

export const GET: RequestHandler = async ({ params }) => {
   try {

      let responses = new Array<CrowdtainerStaticModel>();

      let projectIds: string[] = new Array<string>();

      projectIds = params.id.split(",");

      for (let i = 0; i < projectIds.length; i++) {
         let crowdtainer = BigNumber.from(Number(projectIds[i]));
         let result = await fetchData(crowdtainer);

         if (result.isOk()) {
            responses.push(result.unwrap());
         } else {
            // Fail if any id request fails.
            throw error(500, `${result.unwrapErr()}`);
         }
      }

      return new Response(JSON.stringify(responses));
   } catch (_error) {
      console.log(_error);
      throw error(500, `${_error}`);
   }
}