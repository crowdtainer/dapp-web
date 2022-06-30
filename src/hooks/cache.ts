import type { CrowdtainerStaticModel } from "$lib/Model/CrowdtainerModel";
import type { BigNumber } from "ethers/lib/ethers";

// Static data is always the same for a given CrowdtainerId, so we can safely cache it without expiration logic.
export let crowdtainerStaticDataMap = new Map<string, CrowdtainerStaticModel>;