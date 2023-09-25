import { prepareForUI, type UIFields } from "$lib/Converters/CrowdtainerData.js";
import type { CrowdtainerStaticModel } from "$lib/Model/CrowdtainerModel.js";
import { fetchStaticData } from "$lib/api.js";
import { writable } from "svelte/store";

import { projects } from '../../routes/Data/projects.json';

export const campaignStaticStores = createStaticCampaignDataStore();

export type Error = { details: string };

type StaticCampaignData = {
    availableProjectIds: number[];
    staticData: { [projectId: number]: CrowdtainerStaticModel };
    UIData: { [projectId: number]: UIFields };
}

function makeNewStaticCampaignData(): StaticCampaignData {
    return { availableProjectIds: [], staticData: [], UIData: [] };
}

export function createStaticCampaignDataStore() {
    let campaignData = makeNewStaticCampaignData();

    const { subscribe, set } = writable(campaignData);

    return {
        subscribe,
        fetchData: async (projectIds: number[]): Promise<Error | undefined> => {
            let missingItems = new Array<number>();
            projectIds.forEach(element => {
                if (!campaignData.availableProjectIds.includes(element)) {
                    missingItems.push(element);
                }
            });

            if (missingItems.length > 0) {
                try {
                    let result = await fetchStaticData(missingItems);

                    if (result.isOk()) {
                        let data = result.unwrap();
                        for (let index = 0; index < data.length; index++) {
                            let crowdtainerId = projects[index].crowdtainerId;
                            campaignData.staticData[crowdtainerId] = data[index];
                            campaignData.UIData[crowdtainerId] = prepareForUI(data[index]);
                            campaignData.availableProjectIds.push(crowdtainerId);
                        }
                    } else {
                        return { details: `Failed fetching static data for crowdtainerIds ${missingItems}. ${result.unwrapErr()}` };
                    }
                } catch (error) {
                    return { details: `Failed fetching static data for crowdtainerIds ${missingItems}. ${result.unwrapErr()}` };
                }
            }
            set(campaignData);
            return;
        }
    };
}

// export async function loadDataForProjectIds(projectIds: number[], cached: StaticCampaignData): Promise<Result<StaticCampaignData, Error>> {

//     let missingItems = new Array<number>();
//     projectIds.forEach(element => {
//         if (!cached.availableProjectIds.includes(element)) {
//             missingItems.push(element);
//         }
//     });

//     let resultData: StaticCampaignData = makeNewStaticCampaignData();

//     if (missingItems.length > 0) {
//         try {
//             let result = await fetchStaticData(missingItems);
//             if (result.isOk()) {
//                 let data = result.unwrap();
//                 for (let index = 0; index < data.length; index++) {
//                     let crowdtainerId = projects[index].crowdtainerId;
//                     resultData.staticData[crowdtainerId] = data[index];
//                     resultData.UIData[crowdtainerId] = prepareForUI(data[index]);
//                     resultData.availableProjectIds.push(crowdtainerId);
//                 }
//             } else {
//                 // TODO: Show user UI/pop-up with error.
//                 console.log('Error: %o', result.unwrapErr());
//                 return Err({ details: `Failed fetching static data for crowdtainerIds ${missingItems}` });
//             }
//         } catch (error) {
//             console.log(`Error: ${error}`);
//             return Err({ details: `Failed fetching static data for crowdtainerIds ${missingItems}` });
//         }
//     }

//     return Ok(resultData);
// }