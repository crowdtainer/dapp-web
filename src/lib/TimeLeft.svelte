<script lang="ts">
    import { onMount } from 'svelte';
	import { onInterval } from '$lib/Converters/time';
    import { getTimeRemaining } from '$lib/Converters/time';

    export let endTime: Date;

    let interval = 5000;
    let outputString: string;

    onMount(() => {
        update();
    });

    function update(){
        const [days, hours, minutes, seconds] = getTimeRemaining(endTime);
        if(days > 0) {
            outputString = `${days} days`;
            return;
        }
        let day = days === 0 ? '' : `${days}d`;
        let hour = hours === 0 ? '' : `${hours}h`;
        // outputString = `${day} ${hour} ${minutes}m ${seconds}s`;
        outputString = `${day} ${hour} ${minutes}m`;
    }

	onInterval(update, interval);
</script>

{outputString}