import { sveltekit } from '@sveltejs/kit/vite';

// import basicSsl from '@vitejs/plugin-basic-ssl'
// basicSsl()

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()]
};

export default config;
