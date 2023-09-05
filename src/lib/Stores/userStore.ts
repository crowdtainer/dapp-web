import { writable, type Readable } from 'svelte/store';

import type { UserStoreModel } from '$lib/Model/UserStoreModel';

// CrowdtainerId -> array of number of selected products
export const joinSelection = writable(new Map<number, number[]>());

// Data with user balances and allowance per project
export let userStores = new Map<number, Readable<UserStoreModel>>;