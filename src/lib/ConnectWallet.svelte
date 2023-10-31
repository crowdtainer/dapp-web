<script lang="ts">
	import { connect, injectedProviderAvailableNow } from '$lib/Utils/wallet';
	import { WalletType } from '$lib/Utils/walletStorage';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { InformationCircle } from '@steeze-ui/heroicons';
</script>

<p class="text-center mx-2 my-4">Please connect your wallet to continue.</p>
<br />

<div class="flex justify-center">
	<button
		class="btn btn-outline dark:text-white"
		on:click={() => {
			if (injectedProviderAvailableNow()) {
				connect(WalletType.Injected);
			} else {
				connect(WalletType.WalletConnect);
			}
		}}
	>
		Connect Wallet
	</button>
</div>

<div class="flex justify-center">
	<div class="text-md my-4 sm:w-full md:w-4/5 lg:w-4/6 xl:w-3/6">
		<div class="text-md my-4 mx-4">
			<div class="grid grid-flow-col auto-cols-max my-4">
				<div><Icon src={InformationCircle} class="text-green-700" size="24" /></div>
				<p class="px-2 text-md">Tips</p>
			</div>
			<ul class="list-disc mx-5">
				<li class="my-2">For privacy reasons, we recommend using a brand new wallet.</li>
				<li class="my-2">
					We are working on solutions to unlink the funding wallet from the participation proof.
					Stay tuned!
				</li>
			</ul>
		</div>
	</div>
</div>