<script lang="ts">
	import { onMount } from 'svelte';
	import { onInterval } from '$lib/intervalTimer';
	import { getTimeRemaining } from '$lib/Converters/time';

	export let endTime: Date;

	let interval = 1000;
	let outputString: string;

	onMount(() => {
		update();
	});

	function update() {
		const [days, hours, minutes, seconds] = getTimeRemaining(endTime);

		if (days === 1) {
			outputString = `${days} day`;
			return;
		} else if (days > 1) {
			outputString = `${days} days`;
			return;
		}

		if (days === 0 && hours === 0 && minutes === 0 && seconds >= 0) {
			if (seconds === 1) {
				outputString = `${seconds} second`;
			} else {
				outputString = `${seconds} seconds`;
			}
			return;
		}

		let day = days === 0 ? '' : `${days}d`;
		let hour = hours === 0 ? '' : `${hours}h`;
		// outputString = `${day} ${hour} ${minutes}m ${seconds}s`;
		outputString = `${day} ${hour} ${minutes} min`;
	}

	onInterval(update, interval);
</script>

{outputString}
