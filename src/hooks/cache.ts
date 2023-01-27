
import type { CrowdtainerDynamicModel, CrowdtainerStaticModel } from "$lib/Model/CrowdtainerModel";

// Static data is always the same for a given CrowdtainerId, so we can safely cache it without expiration logic.
export let crowdtainerStaticDataMap = new Map<string, CrowdtainerStaticModel>();

// Cache that expires approximatelly at block time
export let crowdtainerDynamicDataMap = new Map<string, CrowdtainerDynamicModel>();