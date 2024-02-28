import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';

// import basicSsl from '@vitejs/plugin-basic-ssl'
// basicSsl()

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [enhancedImages(), sveltekit()]
};

export default config;
