<script lang="ts" context="module">
	export enum ModalIcon {
		None,
		DeviceMobile,
		BadgeCheck,
		Exclamation
	}
	export enum ModalAnimation {
		None,
		Circle2,
		Diamonds
	}
	export enum ModalType {
		DataInput,
		ActionRequest,
		Information
	}

	export type ModalDialogData = {
		id: string;
		title: string;
		body: string;
		animation?: ModalAnimation;
		icon?: ModalIcon;
		type: ModalType;
	};
</script>

<script lang="ts">
	import { blur } from 'svelte/transition';
	import { Circle2, Diamonds } from 'svelte-loading-spinners';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { CheckBadge, ExclamationCircle, DevicePhoneMobile } from '@steeze-ui/heroicons';

	let dialog: HTMLDialogElement;
	let data: ModalDialogData = { id: '', title: '', body: '', type: ModalType.Information };

	export function show(_data?: ModalDialogData) {
		if (_data) data = _data;
		dialog.showModal();
	}

	export function close() {
		dialog.close();
	}
</script>

<dialog bind:this={dialog} id={data.id} class="modal modal-bottom sm:modal-middle">
	<form method="dialog" class="modal-box text-black">
		<h3 class="font-bold text-lg">{data.title}</h3>
		<div class="h-auto flex justify-center mt-8">
			<div class="flex flex-row items-center align-center">
				{#if data.animation !== undefined && data.animation !== ModalAnimation.None}
					<div in:blur|global={{ duration: 450 }} class="basis-1/4 mx-4">
						{#if data.animation === ModalAnimation.Diamonds}
							<Diamonds size="60" unit="px" />
						{:else if data.animation === ModalAnimation.Circle2}
							<Circle2 size="60" unit="px" />
						{/if}
					</div>
				{/if}
				<div class="flex justify-center">
					{#if data.icon === ModalIcon.DeviceMobile}
						<Icon src={DevicePhoneMobile} class="text-black m-2" size="36" />
					{:else if data.icon === ModalIcon.BadgeCheck}
						<Icon src={CheckBadge} class="text-black m-2" size="36" />
					{:else if data.icon === ModalIcon.Exclamation}
						<Icon src={ExclamationCircle} class="text-black m-2" size="36" />
					{/if}
				</div>
				<div in:blur|global={{ duration: 450 }} class="w-full text-left">
					<p>{data.body}</p>
				</div>
			</div>
		</div>

		<slot />

		{#if data.type !== ModalType.DataInput}
			<div class="flex justify-center">
				<div class="modal-action">
					<button
						class={data.type === ModalType.ActionRequest ? 'red-action-btn' : 'active-btn'}
						on:click={async () => {
							dialog.close();
						}}
					>
						{#if data.type === ModalType.ActionRequest}
							Close
						{:else}
							Ok
						{/if}
					</button>
				</div>
			</div>
		{/if}
	</form>
</dialog>
