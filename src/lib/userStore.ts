import { writable } from 'svelte/store';

// CrowdtainerId -> array of number of selected products
export const joinSelection = writable(new Map<number, number[]>());