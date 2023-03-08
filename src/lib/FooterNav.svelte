<script lang="ts">
	import { onMount } from "svelte";
	let isDarkMode: boolean;

	import { contactHTML } from "./strings";

	onMount(() => {
		isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
	});
</script>

<footer
	style="{!isDarkMode? "background-image: url('/images/site/footerWaves.jpeg');" :
	"background-image: url('/images/site/footerWavesDark.jpeg');"} background-size: 100% 130%;"
	class="footer p-10 bg-black text-base-content"
	data-theme="black"
>
	<div>
		<span class="footer-title">Legal</span>
		<a href="/Legal/Imprint" class="link link-hover">Impressum / Imprint</a>
		<a href="/Legal/Terms" class="link link-hover">Geschäftsbedingungen / Terms & Conditions</a>
		<a href="/Legal/PrivacyPolicy" class="link link-hover">Datenschutzerklärung / Privacy Policy</a>
	</div>
	<div>
		<span class="footer-title">Learn</span>
		<a href="https://crowdtainer.io/post/" class="link link-hover">Blog</a>
		<a href="https://" class="link link-hover">Documentation</a>
	</div>
	<div>
		<span class="footer-title">Community</span>
		<div class="grid grid-flow-col gap-4">
			<a href="http://instagram.com/" class="mr-3">
				<svg role="img" width="32" height="32" class="logo-group" viewBox="0 0 18 18">
					<path
						fill="#FFF"
						d="M8.77 1.58c2.34 0 2.62.01 3.54.05.86.04 1.32.18 1.63.3.41.17.7.35 1.01.66.3.3.5.6.65 1 .12.32.27.78.3 1.64.05.92.06 1.2.06 3.54s-.01 2.62-.05 3.54a4.79 4.79 0 01-.3 1.63c-.17.41-.35.7-.66 1.01-.3.3-.6.5-1.01.66-.31.12-.77.26-1.63.3-.92.04-1.2.05-3.54.05s-2.62 0-3.55-.05a4.79 4.79 0 01-1.62-.3c-.42-.16-.7-.35-1.01-.66-.31-.3-.5-.6-.66-1a4.87 4.87 0 01-.3-1.64c-.04-.92-.05-1.2-.05-3.54s0-2.62.05-3.54c.04-.86.18-1.32.3-1.63.16-.41.35-.7.66-1.01.3-.3.6-.5 1-.65.32-.12.78-.27 1.63-.3.93-.05 1.2-.06 3.55-.06zm0-1.58C6.39 0 6.09.01 5.15.05c-.93.04-1.57.2-2.13.4-.57.23-1.06.54-1.55 1.02C1 1.96.7 2.45.46 3.02c-.22.56-.37 1.2-.4 2.13C0 6.1 0 6.4 0 8.77s.01 2.68.05 3.61c.04.94.2 1.57.4 2.13.23.58.54 1.07 1.02 1.56.49.48.98.78 1.55 1.01.56.22 1.2.37 2.13.4.94.05 1.24.06 3.62.06 2.39 0 2.68-.01 3.62-.05.93-.04 1.57-.2 2.13-.41a4.27 4.27 0 001.55-1.01c.49-.49.79-.98 1.01-1.56.22-.55.37-1.19.41-2.13.04-.93.05-1.23.05-3.61 0-2.39 0-2.68-.05-3.62a6.47 6.47 0 00-.4-2.13 4.27 4.27 0 00-1.02-1.55A4.35 4.35 0 0014.52.46a6.43 6.43 0 00-2.13-.41A69 69 0 008.77 0z"
					/>
					<path
						fill="#FFF"
						d="M8.8 4a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm0 7.43a2.92 2.92 0 110-5.85 2.92 2.92 0 010 5.85zM13.43 5a1.05 1.05 0 100-2.1 1.05 1.05 0 000 2.1z"
					/></svg
				>
			</a>
			<a href="http://twitter.com/crowdtainer" class="mr-3"
				><svg
					data-v-4c469572=""
					id="twitter"
					width="32"
					height="32"
					xmlns="http://www.w3.org/2000/svg"
					aria-labelledby="logoTitle"
					role="img"
					class="logo-group"
					><title data-v-4c469572="" id="twitterTitle">Link to Crowdtainer's Twitter</title>
					<g data-v-4c469572="" fill-rule="nonzero" fill="none"
						><path
							data-v-4c469572=""
							d="M15.962 0C7.147 0 0 7.164 0 16s7.147 16 15.962 16 15.963-7.164 15.963-16S24.777 0 15.962 0z"
							fill="#FFF"
							class="bg"
						/>
						<path
							data-v-4c469572=""
							d="M24.031 12.86c.244 5.387-3.764 11.392-10.86 11.392-2.157 0-4.164-.635-5.855-1.721a7.673 7.673 0 005.656-1.586 3.83 3.83 0 01-3.57-2.66c.6.115 1.19.082 1.726-.065-1.837-.37-3.106-2.03-3.064-3.804a3.805 3.805 0 001.73.479A3.84 3.84 0 018.612 9.78a10.836 10.836 0 007.874 4.002c-.557-2.395 1.256-4.703 3.724-4.703 1.097 0 2.09.465 2.788 1.21a7.61 7.61 0 002.426-.93 3.844 3.844 0 01-1.68 2.119 7.608 7.608 0 002.193-.604 7.679 7.679 0 01-1.906 1.985z"
							fill="#000"
							class="logo"
						/></g
					>
				</svg></a
			>
			<a href="https://discord.gg/ZS3FcRHn" class="mr-3"
				><svg
					data-v-ea960c88=""
					id="discord"
					width="32"
					height="32"
					xmlns="http://www.w3.org/2000/svg"
					aria-labelledby="discordTitle"
					role="img"
					class="logo-group"
					><title data-v-ea960c88="" id="discordTitle">Link to Crowdtainer's Discord</title>
					<g data-v-ea960c88="" fill="none" fill-rule="evenodd"
						><path
							data-v-ea960c88=""
							d="M15.981 0C7.167 0 .02 7.163.02 16c0 8.836 7.148 16 15.962 16 8.815 0 15.962-7.164 15.962-16 0-8.837-7.147-16-15.962-16z"
							fill="#FFF"
							class="bg"
						/>
						<path
							data-v-ea960c88=""
							d="M20.302 24.464l-.494-1.727L21 23.848l1.127 1.045 2.002 1.774V9.923A1.916 1.916 0 0022.219 8H9.744a1.916 1.916 0 00-1.91 1.923V22.54c0 1.064.857 1.923 1.91 1.923h10.559zm-1.676-4.275l-.615-.756c1.22-.345 1.685-1.11 1.685-1.11-.381.252-.745.429-1.07.55a6.118 6.118 0 01-1.35.402 6.508 6.508 0 01-2.412-.01 7.802 7.802 0 01-1.369-.401 5.45 5.45 0 01-.68-.317l-.037-.022-.01-.004-.037-.021-.037-.028-.26-.159s.446.747 1.629 1.102l-.624.774c-2.058-.065-2.84-1.418-2.84-1.418 0-3.006 1.341-5.442 1.341-5.442 1.34-1.008 2.617-.98 2.617-.98l.093.112c-1.676.486-2.45 1.223-2.45 1.223l.55-.27c.996-.44 1.788-.56 2.114-.589l.158-.018a7.577 7.577 0 014.684.877s-.736-.7-2.319-1.185l.13-.15s1.276-.028 2.617.98c0 0 1.34 2.436 1.34 5.442 0 0-.761 1.302-2.848 1.418zm-.932-4.358c-.53 0-.95.466-.95 1.036 0 .569.429 1.036.95 1.036.531 0 .95-.467.95-1.036 0-.57-.419-1.036-.95-1.036zm-3.398 0c-.531 0-.95.466-.95 1.036 0 .569.428 1.036.95 1.036.53 0 .95-.467.95-1.036.009-.57-.42-1.036-.95-1.036z"
							fill="#000"
							class="logo"
						/></g
					></svg
				></a
			>
			<a href="https://github.com/crowdtainer/" class="mr-3"
				><svg
					id="github"
					width="32"
					height="32"
					xmlns="http://www.w3.org/2000/svg"
					aria-labelledby="githubTitle"
					role="img"
					class="logo-group"
					><title id="githubTitle">Link to Crowdtainer's Github</title>
					<g fill="none"
						><path
							d="M16.019 0C7.204 0 .057 7.164.057 16s7.147 16 15.962 16S31.98 24.836 31.98 16 24.834 0 16.02 0z"
							fill="#FFF"
							class="bg"
						/>
						<path
							d="M18.97 24.821c-.472.092-.623-.198-.623-.448v-2.561c0-.87-.305-1.439-.64-1.728 2.075-.23 4.254-1.02 4.254-4.605 0-1.02-.363-1.852-.96-2.506.097-.236.416-1.185-.091-2.47 0 0-.78-.251-2.558.956a9.024 9.024 0 00-2.333-.312 8.95 8.95 0 00-2.332.313c-1.778-1.207-2.56-.956-2.56-.956-.505 1.285-.187 2.235-.09 2.47a3.614 3.614 0 00-.96 2.505c0 3.576 2.173 4.376 4.242 4.612-.266.233-.507.644-.59 1.248-.533.238-1.88.65-2.71-.776 0 0-.492-.896-1.428-.963 0 0-.908-.012-.063.568 0 0 .611.287 1.033 1.365 0 0 .539 1.667 3.13 1.102v1.737c0 .247-.15.536-.615.45a9.332 9.332 0 01-6.368-8.855c0-5.156 4.17-9.334 9.31-9.334 5.142 0 9.312 4.178 9.312 9.334a9.332 9.332 0 01-6.36 8.854z"
							fill="#000"
							class="logo"
						/></g
					></svg
				></a
			>
		</div>
	</div>
	{#if contactHTML !== undefined && contactHTML !== ''}
		<div>
			<span class="footer-title">Contact</span>
			{@html contactHTML}
		</div>
	{/if}
</footer>
