<script lang="ts">
export let emptyMessage: string;
</script>

<slot>
    <div class="max-w-7xl mx-auto py-6 sm:px-0 lg:px-0">
        <div class="px-2 py-6 sm:px-0">
            <div class="mx-6 border-2 border-dashed border-gray-200 rounded-lg h-20">
                <p class="text-center m-5">{emptyMessage}</p>
            </div>
        </div>
    </div>
</slot>
