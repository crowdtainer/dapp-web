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
		ActionRequest,
		Information
	}

	export type ModalDialogData = {
		visible: boolean;
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
	import { BadgeCheck, Icon, Exclamation, DeviceMobile } from 'svelte-hero-icons';

	export let modalDialogData: ModalDialogData = {
		visible: false,
		title: '',
		body: '',
		animation: ModalAnimation.Circle2,
		icon: ModalIcon.DeviceMobile,
		type: ModalType.ActionRequest
	};
</script>

<input type="checkbox" id="my-modal-6" class="modal-toggle" />
<div class="modal {modalDialogData.visible ? 'modal-open' : ''} modal-bottom sm:modal-middle">
	<div class="modal-box">
		<h3 class="font-bold text-lg">{modalDialogData.title}</h3>
		<div class="h-20 flex justify-center my-8">
			<div class="flex flex-row">
				{#if modalDialogData.visible}
					{#if modalDialogData.animation !== ModalAnimation.None}
						<div in:blur={{ duration: 450 }} class="basis-1/4">
							{#if modalDialogData.animation === ModalAnimation.Diamonds}
								<Diamonds size="60" unit="px" />
							{:else if modalDialogData.animation === ModalAnimation.Circle2}
								<Circle2 size="60" unit="px" />
							{/if}
						</div>
					{/if}
					<div class="flex justify-center">
						{#if modalDialogData.icon === ModalIcon.DeviceMobile}
							<Icon src={DeviceMobile} class="text-black m-2" size="36" />
						{:else if modalDialogData.icon === ModalIcon.BadgeCheck}
							<Icon src={BadgeCheck} class="text-black m-2" size="36" />
						{:else if modalDialogData.icon === ModalIcon.Exclamation}
							<Icon src={Exclamation} class="text-black m-2" size="36" />
						{/if}
					</div>
					<div in:blur={{ duration: 450 }} class="basis-3/4">
						<p>{modalDialogData.body}</p>
					</div>
				{/if}
			</div>
		</div>
		<div class="flex justify-center">
			<button
				type="button"
				class={modalDialogData.type === ModalType.ActionRequest ? 'red-action-btn' : 'active-btn'}
				on:click={async () => {
					modalDialogData.visible = false;
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
</div>
