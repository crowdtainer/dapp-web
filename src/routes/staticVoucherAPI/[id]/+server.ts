// Ethers
import { BigNumber } from 'ethers';

// Internal
import type { RequestHandler } from './$types';
import type { CrowdtainerStaticModel, Error } from '$lib/Model/CrowdtainerModel';
import { error } from '@sveltejs/kit';
import { fetchStaticData } from '$lib/ethersCalls/fetchStaticData.js';

export const GET: RequestHandler = async ({ params }) => {
   try {

      let responses = new Array<CrowdtainerStaticModel>();

      let projectIds: string[] = new Array<string>();

      projectIds = params.id.split(",");

      for (let i = 0; i < projectIds.length; i++) {
         let crowdtainer = BigNumber.from(Number(projectIds[i]));
         let result = await fetchStaticData(crowdtainer);

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