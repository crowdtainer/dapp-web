<script lang="ts">
    import ProductQuantity from '$lib/ProductQuantity.svelte';

    export let tokenSymbol: string;
    export let prices: number[];
    export let descriptions: string[];

    let totalSum: number = 0;
    
    function handleQuantityChange(event: { detail: { quantities: Array<number>; }; }) {
        totalSum = 0;
        for(var i in event.detail.quantities) {
            totalSum += event.detail.quantities[i] * prices[i];
        }
    }
</script>

<!-- Order container -->
<div class=" border-2 rounded border-blue flex justify-center">
    <!-- Products container -->
    <div class=" m-6 border-black ">

        <ProductQuantity {prices} {descriptions} on:quantitiesChanged={handleQuantityChange}/>

        <!-- Summary -->
        <div class="divide-y divide-dashed text-right mr-4 my-2 py-4">
            <p class="text-sm">7% tax (USt.) and shipping included</p>
            <p class="text-sm"><b>(Currently shipping only to Germany)</b></p>
            <p class="text-lg my-4"><b>Summary</b>: {totalSum} {tokenSymbol}</p>
        </div>
        <div class="flex justify-center">
            <button
                type="button"
                class=" border-2 border-black px-16 mt-6 py-4 bg-gray-700 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg"
            >
                Join
            </button>
            <!-- Legal Disclaimer -->
        </div>
    </div>
</div>
<p class="text-sm m-4">
    By clicking on "Join" and cryptographically signing the transaction, I agree to the <b>General Terms and Conditions</b> related to the usage of this webpage.
</p>