<script lang="ts">
    export let tokenSymbol: string | undefined = undefined;
    export let totalSum: number;
	import { blur } from 'svelte/transition';
</script>

<!-- Order container -->
<div class="center container mx-auto max-w-6xl mb-8">
<div class="">

    <!-- Products container -->
    <div class="m-3">

        <slot/>
        <!-- Summary -->
        <div class="divide-y divide-dashed text-right mr-4 my-2 py-4">
            <p class="text-sm">7% tax (USt.) and shipping included</p>
            <p class="text-sm"><b>(Currently shipping only to Germany)</b></p>
            {#key totalSum}
            <p in:blur="{{ duration: 250 }}" class="text-lg my-4"><b>Total</b>: {totalSum} {tokenSymbol}</p>
            {/key}
        </div>
        <div class="flex justify-center">
            <button
                type="button"
                class="bg-sky-600 text-white hover:bg-sky-500 hover:shadow-lg px-16 mt-6 py-4 font-medium text-sm leading-tight uppercase rounded-xl shadow-md  focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg"
            >
                Join
            </button>
            <!-- Legal Disclaimer -->
        </div>
    </div>
    <div class="flex justify-center">
    <p class="text-base m-4">
        By clicking on "Join" and cryptographically signing the transaction, I agree to the <b>General Terms and Conditions</b> related to the usage of this webpage.
    </p>
    </div>
</div> <!-- here-->
</div>
