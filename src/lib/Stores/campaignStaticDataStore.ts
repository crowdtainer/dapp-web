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
                        return { details: `Failed fetching static data for crowdtainerIds ${missingItems}. ${result.unwrapErr().message}` };
                    }
                } catch (error) {
                    return { details: `Failed fetching static data for crowdtainerIds ${missingItems}: ${error}` };
                }
            }
            set(campaignData);
            return;
        }
    };
}