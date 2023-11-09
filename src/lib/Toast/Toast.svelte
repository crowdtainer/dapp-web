<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';

	import Icon from '$lib/Toast/Icon.svelte';
	import { MessageType } from './MessageType';

	const dispatch = createEventDispatcher();

	export let type: MessageType = MessageType.Warning;
	export let dismissible = false;

	$: typeString = (type: MessageType): string => {
		switch (type) {
			case MessageType.Warning:
				return 'warningToast';
			case MessageType.Info:
				return 'infoToast';
			case MessageType.Success:
				return 'successToast';
			default:
				return '';
		}
	};
</script>

<div class={'toastBox ' + typeString(type)} role="alert" transition:fade|global>
	<Icon iconType={type} width="1.1em" />

	<div class="mx-2">
		<slot />
	</div>

	{#if dismissible}
		<button class="toastButton" on:click={() => dispatch('dismiss')}>
			<Icon iconType={MessageType.X} width="0.8em" />
		</button>
	{/if}
</div>
