<script>
	import { page } from '$app/stores';

	import CrowdtainerLogo from '$lib/images/site/CrowdtainerLogo.svg';

	export let title = `${$page.status} - ${$page.error?.message}`;
</script>

<figure
	class="my-10 max-w-4xl mx-auto grid grid-cols-1 py-6 px-4 sm:p-6 md:py-10 md:px-8 rounded-xl p-8 md:p-0"
>
	<img
		class="w-24 h-24 md:w-48 md:h-auto md:rounded-none rounded-full mx-auto"
		src={CrowdtainerLogo}
		alt=""
		width="384"
		height="512"
	/>
	<div class="pt-6 md:p-8 text-center md:text-left space-y-4">
		<blockquote>
			<p class="dark:text-white text-black text-center text-lg font-medium">
				{title}
			</p>
		</blockquote>
		<figure>
			<figcaption class="font-medium">
				<div class="text-center text-sky-500 dark:text-sky-400">No containers here.</div>
			</figcaption>
		</figure>
	</div>
</figure>
