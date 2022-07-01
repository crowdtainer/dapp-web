<script lang="ts">
    import ProductQuantity from '$lib/ProductQuantity.svelte';
    import { joinSelection } from '$lib/userStore';
    import { derived, type Readable } from 'svelte/store';

    export let tokenSymbol: string;
    export let prices: number[];
    export let descriptions: string[];
    export let crowdtainerId: number;

    // CrowdtainerId -> totalSum
    export const totalSum: Readable<number> = derived(joinSelection, $joinSelection => {
        let totalSum = 0;
        let selection = $joinSelection.get(crowdtainerId);
        if(selection === undefined) {
            selection = new Array<number>(descriptions.length).fill(0);
            return 0;
        }
        for (var i = 0; i < selection.length; i++){
                totalSum += selection[i] * prices[i];
        }
        return totalSum;
    });

</script>

<!-- Order container -->
<div class="center container mx-auto max-w-6xl mb-8">
<div class="border-2 ">

    <!-- Products container -->
    <div class="m-3">

        <ProductQuantity {prices} {descriptions} {crowdtainerId} {tokenSymbol}/>

        <!-- Summary -->
        <div class="divide-y divide-dashed text-right mr-4 my-2 py-4">
            <p class="text-sm">7% tax (USt.) and shipping included</p>
            <p class="text-sm"><b>(Currently shipping only to Germany)</b></p>
            <p class="text-lg my-4"><b>Total</b>: {$totalSum} {tokenSymbol}</p>
        </div>
        <div class="flex justify-center">
            <button
                type="button"
                class="bg-indigo-600 border-2 border-black px-16 mt-6 py-4 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg"
            >
                Join
            </button>
            <!-- Legal Disclaimer -->
        </div>
    </div>
    <p class="text-sm m-4">
        By clicking on "Join" and cryptographically signing the transaction, I agree to the <b>General Terms and Conditions</b> related to the usage of this webpage.
    </p>
</div> <!-- here-->
</div>
