<script lang="ts">
    import "../app.css";
    import TopMenuNav from '$lib/TopMenuNav.svelte';
    import FooterNav from '$lib/FooterNav.svelte';
</script>

<TopMenuNav />

<main>
    <slot />
</main>

<FooterNav />