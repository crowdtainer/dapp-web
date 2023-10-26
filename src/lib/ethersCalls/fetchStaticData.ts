// Typechain
import { Vouchers721__factory } from '../../routes/typechain/factories/Vouchers721__factory';
import { Crowdtainer__factory } from '../../routes/typechain/factories/Crowdtainer.sol/Crowdtainer__factory';

// Monads
import { type Result, Ok, Err } from "@sniptt/monads";

import type { CrowdtainerStaticModel, Error } from '$lib/Model/CrowdtainerModel';
import { Vouchers721Address } from '../../routes/Data/projects.json';
import { projects } from '../../routes/Data/projects.json';
import { MockERC20__factory, type Crowdtainer } from '../../routes/typechain/';
import { crowdtainerStaticDataMap } from '../../hooks/cache';
import { provider } from '$lib/ethersCalls/provider';

export async function fetchStaticData(crowdtainerId: bigint): Promise<Result<CrowdtainerStaticModel, Error>> {

   try {
      if (Number(crowdtainerId) === 0) {
         return Err({ error: `Invalid crowdtainerId: ${crowdtainerId}` });
      }

      let crowdtainerStaticData: CrowdtainerStaticModel | undefined = crowdtainerStaticDataMap.get(crowdtainerId.toString(16));

      if (crowdtainerStaticData) {
         return Ok(crowdtainerStaticData);
      }

      console.log(`Fetching static data for Crowdtainer ID ${crowdtainerId}..`);
      const start = Date.now();
      await provider.ready;
      const vouchers721Contract = Vouchers721__factory.connect(Vouchers721Address, provider);

      console.log(`CrowdtainerId: ${crowdtainerId}`);
      console.log(`vouchers721Contract.address: ${await vouchers721Contract.getAddress()}`);

      let crowdtainerAddress: string;
      let crowdtainerContract: Crowdtainer;
      try {
         crowdtainerAddress = await vouchers721Contract.crowdtainerForId(crowdtainerId);

      } catch (error) {
         console.dir(error);
         return Err({ error: `${error}` });
      }
      crowdtainerContract = Crowdtainer__factory.connect(crowdtainerAddress, provider);

      let tokenContractAddress = await crowdtainerContract.token();
      const ERC20Contract = MockERC20__factory.connect(tokenContractAddress, provider);

      let numberOfProducts = (await crowdtainerContract.numberOfProducts());
      let prices: bigint[] = [];
      let descriptions: string[] = [];
      for (let i = 0; i < numberOfProducts; i++) {
         // fetch price
         let price = await crowdtainerContract.unitPricePerType(i);
         if (price != null && price > 0n) {
            prices.push(price);
         }
         // fetch product description
         let description = await vouchers721Contract.productDescription(crowdtainerId, i);
         descriptions.push(description);
      }

      let jsonData = projects.filter(e => e.crowdtainerId === Number(crowdtainerId));
      if (jsonData.length != 1) {
         return Err({ error: `Invalid projects.json configuration.` });
      }

      let crowdtainerData: CrowdtainerStaticModel = {
         chainId: jsonData[0].chainId,
         contractAddress: crowdtainerAddress,
         serviceProvider: `${await crowdtainerContract.owner()}`,
         startDate: await crowdtainerContract.openingTime(),
         endDate: await crowdtainerContract.expireTime(),
         minimumGoal: await crowdtainerContract.targetMinimum(),
         maximumGoal: await crowdtainerContract.targetMaximum(),
         productDescription: descriptions,
         prices: prices,
         tokenAddress: await crowdtainerContract.token(),
         tokenDecimals: Number(await ERC20Contract.decimals()),
         tokenSymbol: await ERC20Contract.symbol(),
         tokenName: await ERC20Contract.name(),
         signer: await crowdtainerContract.getSigner(),
         referralRate: await crowdtainerContract.referralRate(),
         tokenVersion: jsonData[0].tokenVersion
      }

      crowdtainerStaticDataMap.set(crowdtainerId.toString(16), crowdtainerData);
      console.log(`Done. Crowdtainer ID ${crowdtainerId} static data fetch took ${(Date.now() - start) / 1000} seconds.`);
      return Ok(crowdtainerData);
   } catch (errorMessage) {
      let error: Error = { error: `${errorMessage}` };
      console.dir(errorMessage);
      return Err(error);
   }
}