<div align="center"><img src="static/images/site/CrowdtainerLogo.svg" alt="Crowdtainer" height="128px"/>

<h1> Crowdtainer Web App </h1> </div>
<br/>

Web-based (Svelte) application to interact with the [Crowdtainer solidity contracts](https://github.com/crowdtainer/dapp-contracts).

Following these instructions allows you to host your own instance of Crowdtainer.

## Development

To run everything locally, follow the instructions in [Crowdtainer solidity contracts](https://github.com/crowdtainer/dapp-contracts) to run and deploy the contracts (`npx hardhat node`).
Once a blockchain or RPC can be connected to, proceed setting up this frontend per instructions below.

### Frameworks

- [SvelteKit](https://kit.svelte.dev) 
- TailWindCSS
- Typechain

As this project uses typechain to generate typescript bindings for interaction with deployed smart contracts, if changes are made to the smart contract interfaces, then the respective JSON files (in /abi folder) needs to be updated in this project, and bindings re-generated with: `npm run build-types`.

### Environment variables
```bash
# Copy and make sure to set appropriate values.
cp .env.example .env
```

### Projects & Legal texts

Edit the projects.json file (src/routes/Data/projects.json) accordingly to inform the frontend about which campaigns should be displayed.
The Vouchers721Address is obtained during smart contract deployment. Then each new Crowdtainer project generates an 'id' which should be referenced in the file.

```bash
# Enter projects to be displayed in:
src/routes/Data/projects.json

# Edit the privacy policy and other custom pages accordingly:
src/routes/Legal/Imprint/+page.svelte
src/routes/Legal/PrivacyPolicy/+page.svelte
src/routes/Legal/Terms/+page.svelte

# An optional footer block with contact details will be shown from contactHTML in:
src/lib/strings.ts
```

## Docker

### Running with docker:

```bash
docker-compose build crowdtainer-node
docker-compose up -d crowdtainer-node
# or simply: docker compose up -d --build crowdtainer-node
```

### Specifying env files

```bash
docker compose --env-file .env.production up -d --build crowdtainer-node
```

### Debugging from VSCode:

```bash
# specify the debug-web service:
docker compose up -d --build debug-web
```
Then use the "Attach" launch configuration in VSCode's debugger.

## Installing/running without docker

### Install dependencies:

```bash
# Node dependencies:
npm install

# Redis:
brew install redis # MacOS; For other OS's see: https://redis.io/docs/getting-started/installation/
```

---
### To start a development server:

 Run redis server:
 ```bash
redis-server

# Alternatively, to run as a MacOS service:
brew services start redis
 ```

Run the frontend in development mode:

```bash
npm run dev
# or:
npm run dev -- --open #open in browser
```

---

### Building for production:

```bash
npm run build #(generated in ./build)
```

To preview: 

```bash
npm run preview
```

To run:

```
node build # or node -r dotenv/config build
```

More details [here](https://kit.svelte.dev/docs/adapter-node)

---

# Plugins

The plugins folder contains services that can be run separately from the frontend (only a connection to the same redis db is required).

## Mailer service (verification codes)
- The e-mail worker sending verification codes (joining with signature) can be executed as follows:

```sh
# Copy the example .env and edit accordingly:
cd plugins/notifications/
cp .env.example .env

# Install dependencies:
npm install

# Build & run:
npm run build; node -r dotenv/config dist/server.js

# The process will exit gracefully with e.g. SIGINT (CTRL+C).
```

Alternatively, it is also possible to run it with docker compose:

```sh
# From the root directory, run the service:
docker compose --env-file plugins/notifications/.env  up --build -d mailer
```
Note: be careful to not expose the redis port to the internet (unless authenticated/encrypted). When docker compose is used, the redis port remains isolated and shared only between the required services.

## WooCommerce integration (order creation from successfull campaigns)

This plugin helps with the "check out" workflow, with integration with Wordpress plugin WooCommerce. A reason to use WooCommerce is to take advantage of the existing ecosystem thus avoiding 'reinventing the wheel' when it comes to fulfillment, stock management, invoicing, tax, accounting, etc. Please see all files under:

```sh
cd plugins/woocommerce/

# The procedure to build and run is exactly the same as specified for 'mailer' plugin above.

# Make sure to read `plugins/woocommerce/README.md` as well.
```
---

## Known issues

- Typechain (our tool to generate bindings between EVM/Solidity ABI and typescript) has a bug where it generates a few imports wrongly (without typescript's "type" specifier). For this reason, these files are not git ignored (included in the '.gitignore' list), so that we can quickly revert changes done by the generator.

---

## User Stories / Development progress

- ✅ for completed items, ◻️ otherwise.

### As an observer (anyone, including page loaded without any wallet connected):

- I'd like to be able to get basic information of a crowdtainer project deployed, such as:
    - ✅ See a list of active crowdtainer projects
        - Can be a static list/item for MVP.
    - ✅ All information used during deployment (opening and closing time, etc).
        - Use `ICrowdtainer.CampaignData`.
    - ✅ Check the project status (Funding, Expired, Delivery, Finalized).
        - Use `Crowdtainer.crowdtainerState()`.
    - ✅ If active, percentage of goal so far (progress bar).
        - Use `Crowdtainer.totalValueRaised()` and `CampaignData.targetMinimum().` to calculate percentage.
    - ◻️ IPFS/Swarm hash which points to the legal sale contract agreement documents.

### As a participant

- ✅ Once I open one of the listed projects (from screen of observer user stories above), I'd like to see the product list and prices, so that I can specify my order and sign a transaction to participate in the group buying.
    - The product name can be read from `Vouchers721.productDescription[crowdtainerId]()`.
    - Prices can be read from `Crowdtainer.unitPricePerType()`.

- ✅ I'd like to view if the project's goal was reached, so that I can decide to either withdrawl my funds or wait for product delivery.
    - Use `Crowdtainer.crowdtainerState()`.

- ✅ Allow connection/disconnection to WalletConnect and properly manage its state (localStore to remember connection).

- ✅ - Button to effectively 'join' the project.
    - To join the project call `ICrowdtainer.join()`.

- ✅ Button to 'leave' the project.
    - This would call `ICrowdtainer.leave()` smart contract method.

- ✅ CCIP-Read support to allow arbitrary off-chain verifications before joining a project (meet law requirements).
    - ✅ Add requirement of participant signing Terms and Conditions with their wallet.
    - ✅ E-mail / code verification.
    - ✅ Server checks if code + Terms & Conditions signature are valid.
    - ✅ Button to effectively 'join' the project via CCIP-Read method.
        - ✅ To join the project call `ICrowdtainer.joinWithSignature()`.

- ✅ I'd like an interface/button to claim refunds if the sale was not successful.
    - Only possible if the project is in `Failed` state.
    - Use `Crowdtainer.claimFunds()` method.

- ✅ After joining, I'd like to see my own purchase/voucher details, as a SVG image.
    - Use `Vouchers721.tokenUri()` to get the generated image.

- ✅ I'd like an interface to see how much I bought for each type of product, to get an overview of my own orders.

- ✅ Button to transfer NFT/participation proof ownership to another wallet.

- ✅ Worker service to dispatch email (pull job from redis):
    - Verification/validation code

- ✅ "Checkout" button (available once funded/suceeded) to conclude the order with service provider (providing delivery address details).
    - ✅ UI/frontend:
        - ✅ Form / UI for delivery address input.
        - ✅ Sign data with wallet PK and send everything to backend endpoint.
    - ✅ Backend endpoint validates the input and persist data in redis (creates a checkout/delivery request).

- ✅ Impressum / legal pages.

- ◻️ E-mail Invoice service.
    - ◻️ Background work to process checkout requests and create invoice dispatch job.
        - ◻️ Create order in shop system, set checkout request status as claimed for the respective wallet.
    - ◻️ Background work to check order status:
        - ◻️ Download invoice PDF when ready and send it by email; Set checkout request as complete.

##### Out of scope for MVP:

- ◻️ "Download Invoice" button
- ◻️ Browser-side encryption (asymmetric, using service provider's PubKey) before pushing sensitive data to redis.
- ◻️ Support for multiple deployments, each on potentially different chainIDs.
- ◻️ When joining, I'd like to additionally specify:
    - ◻️ whether I'd like to be eligible to share referral code so that I can get rewards for my friend's purchases (check-box).
    - ◻️ a friend's referral code, so that I can get a discount on my own purchase (address/ENS text input field).

- ◻️ I'd like an interface to view how much rewards I acquired due sharing of personal referral code, if the project succeeds.
    - Use `Crowdtainer.accumulatedRewardsOf()` method.

- ◻️ I'd like an interface/button to claim rewards due sharing of referral code.
    - Only possible if the project is in `Delivery` state.
    - Use `Crowdtainer.claimRewards()` method.