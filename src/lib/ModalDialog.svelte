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
		animation: ModalAnimation;
		icon: ModalIcon;
		type: ModalType;
	};
</script>

<script lang="ts">
	import { blur } from 'svelte/transition';
	import { Circle2, Diamonds } from 'svelte-loading-spinners';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { CheckBadge, ExclamationCircle, DevicePhoneMobile } from '@steeze-ui/heroicons';

	let dialog: HTMLDialogElement;

	export let modalDialogData: ModalDialogData = {
		id: '',
		title: '',
		body: '',
		animation: ModalAnimation.Circle2,
		icon: ModalIcon.DeviceMobile,
		type: ModalType.ActionRequest
	};

	export function showDialog() {
		dialog.showModal();
	}

	export function close() {
		dialog.close();
	}
</script>

<dialog bind:this={dialog} id={modalDialogData.id} class="modal modal-bottom sm:modal-middle">
	<form method="dialog" class="modal-box text-black">
		<h3 class="font-bold text-lg">{modalDialogData.title}</h3>
		<div class="h-auto flex justify-center mt-8">
			<div class="flex flex-row">
				{#if modalDialogData.animation !== ModalAnimation.None}
					<div in:blur|global={{ duration: 450 }} class="basis-1/4">
						{#if modalDialogData.animation === ModalAnimation.Diamonds}
							<Diamonds size="60" unit="px" />
						{:else if modalDialogData.animation === ModalAnimation.Circle2}
							<Circle2 size="60" unit="px" />
						{/if}
					</div>
				{/if}
				<div class="flex justify-center">
					{#if modalDialogData.icon === ModalIcon.DeviceMobile}
						<Icon src={DevicePhoneMobile} class="text-black m-2" size="36" />
					{:else if modalDialogData.icon === ModalIcon.BadgeCheck}
						<Icon src={CheckBadge} class="text-black m-2" size="36" />
					{:else if modalDialogData.icon === ModalIcon.Exclamation}
						<Icon src={ExclamationCircle} class="text-black m-2" size="36" />
					{/if}
				</div>
				<div in:blur|global={{ duration: 450 }} class="basis-3/4">
					<p>{modalDialogData.body}</p>
				</div>
			</div>
		</div>

		<slot />

		{#if modalDialogData.type !== ModalType.DataInput}
			<div class="flex justify-center">
				<div class="modal-action">
					<button
						class={modalDialogData.type === ModalType.ActionRequest
							? 'red-action-btn'
							: 'active-btn'}
						on:click={async () => {
							dialog.close();
						}}
					>
						{#if modalDialogData.type === ModalType.ActionRequest}
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
