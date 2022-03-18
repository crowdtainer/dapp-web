<div style="text-align:center"><img src="static/CrowdtainerLogo.svg" alt="Crowdtainer" height="128px"/>

<h1> Crowdtainer Svelte Web App </h1> </div>
<br/>


Web-based application to interact with the [Crowdtainer solidity contracts](https://github.com/crowdtainer/dapp-contracts).

This is the [Svelte](https://svelte.dev) based web interface for crowdtainer, configured with TailWindCSS / PostCSS, as a static page (@sveltejs/adapter-static).

We strive to keep it in `static` mode (without backends) to allow for hosting the app in a variety of emerging trustless CDN's such as IPFS and SWARM.

See [User stories](./UserStories.md).

## Development

### To start a development server:

```bash
npm run dev

# or

npm run dev -- --open #open in browser
```

### Building for production:

```bash
npm run build #(generated in ./build)
```

To preview: 

```bash
npm run preview
```