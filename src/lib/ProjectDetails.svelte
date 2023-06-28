<script lang="ts">
	import { slide } from 'svelte/transition';
	import { shortenAddress } from './wallet';

	import { Icon } from '@steeze-ui/svelte-icon';
	import { Clipboard } from '@steeze-ui/heroicons';
	import { addToast, type ToastData } from './Toast/ToastStore';
	import { MessageType } from './Toast/MessageType';

	export let vouchers721Address: string;
	export let crowdtainerId: number;
	export let crowdtainerAddress: string | undefined;
	export let serviceProvider: string | undefined;
	export let tokenDecimals: number | undefined;
	export let signerAddress: string | undefined;

	let visible: boolean;

	function visibilityToggle() {
		visible = !visible;
	}

	function copyToClipBoardAndNotify(description: string, text?: string) {
		if (!text) return;

		navigator.clipboard.writeText(text);

		let toast: ToastData = {
			id: Math.floor(Math.random() * 10000),
			type: MessageType.Info,
			dismissible: true,
			timeout: 7000,
			message: `${description} copied to clipboard.`
		};
		addToast(toast);
	}
</script>

<div class="mb-4">
	<button
		on:click={() => {
			visibilityToggle();
		}}
		class=" w-auto  "
	>
		{#if visible}
			⬇ Details
		{:else}
			➡ Details
		{/if}
	</button>

	{#if visible}
		<div
			transition:slide|global={{ duration: 150 }}
			class="border border-black dark:border-white p-2 mt-2 text-sm"
		>
			<p>Click any address to copy to clip-board.</p>
			<br />

			<table class="table-auto">
				<tr>
					<td class="pr-20"> Vouchers721: </td>
					<td>
						<button
							on:click={() => {
								copyToClipBoardAndNotify('Vouchers721 contract address', vouchers721Address);
							}}
						>
							<span class="inline-flex items-baseline">
								<span>
									{shortenAddress(vouchers721Address)}
								</span>
								<span
									><Icon
										src={Clipboard}
										class="text-black dark:text-white self-center ml-2"
										size="16"
									/></span
								>
							</span>
						</button>
					</td>
				</tr>

				<tr>
					<td>Crowdtainer ID: {crowdtainerId}</td>
					<td>
						<button
							on:click={() => {
								copyToClipBoardAndNotify('Crowdtainer address', crowdtainerAddress);
							}}
						>
							<span class="inline-flex items-baseline">
								{#if crowdtainerAddress !== undefined}
									<span>
										{shortenAddress(crowdtainerAddress)}
									</span>
									<span>
										<Icon
											src={Clipboard}
											class="text-black dark:text-white self-center ml-2"
											size="16"
										/>
									</span>
								{/if}
							</span>
						</button>
					</td>
				</tr>

				<tr>
					<td>Service Provider: </td>
					<td>
						<button
							on:click={() => {
								copyToClipBoardAndNotify('Service Provider address', serviceProvider);
							}}
						>
							<span class="inline-flex items-baseline">
								<span>{shortenAddress(serviceProvider)} </span>
								<span
									><Icon
										src={Clipboard}
										class="text-black dark:text-white self-center ml-2"
										size="16"
									/></span
								>
							</span>
						</button></td
					>
				</tr>

				<tr>
					<td>Signer:</td>
					<td>
						<button
							on:click={() => {
								copyToClipBoardAndNotify('Signer address', signerAddress);
							}}
						>
							<span class="inline-flex items-baseline">
								<span>{shortenAddress(signerAddress)} </span>
								<span
									><Icon
										src={Clipboard}
										class="text-black dark:text-white self-center ml-2"
										size="16"
									/></span
								>
							</span>
						</button></td
					>
				</tr>

				<tr>
					<td>ERC20 decimals: </td>
					<td>
						<span>{tokenDecimals}</span>
					</td>
				</tr>
			</table>
		</div>
	{/if}
</div>
