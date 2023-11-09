<script lang="ts">
	import { connect, injectedProviderAvailableNow } from '$lib/Utils/wallet';
	import { WalletType } from '$lib/Utils/walletStorage';
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