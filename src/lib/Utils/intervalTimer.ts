import { onDestroy } from 'svelte';

export function onInterval(callback: () => void, milliseconds: number | undefined) {
	callback();
	const interval = setInterval(callback, milliseconds);
	onDestroy(() => {
		clearInterval(interval);
	});
}