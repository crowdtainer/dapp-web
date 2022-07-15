<script lang="ts">
	import Toast from '$lib/Toast/Toast.svelte';

	import { dismissToast, toasts } from '$lib/Toast/ToastStore';
</script>

{#if $toasts}
	<div class="fixed right-2 top-20 z-50">
		<div class="">
			<section class="">
				{#each $toasts as toast (toast.id)}
					<div class="flex justify-end">
						<Toast
							type={toast.type}
							dismissible={toast.dismissible}
							on:dismiss={() => dismissToast(toast.id)}>{toast.message}</Toast
						>
					</div>
				{/each}
			</section>
		</div>
	</div>
{/if}
