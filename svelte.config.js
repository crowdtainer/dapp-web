import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess({
		postcss: true,
	  }),

	kit: {
		adapter: adapter(),
		files: {
      		assets: 'static',
      		hooks: 'src/hooks',
      		lib: 'src/lib',
      		params: 'src/params',
      		routes: 'src/routes',
      		serviceWorker: 'src/service-worker',
      		template: 'src/app.html'
    }
	}
};

export default config;
