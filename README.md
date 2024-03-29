<div align="center"><img src="src/lib/images/site/CrowdtainerLogo.svg" alt="Crowdtainer" height="128px"/>

<h1> Crowdtainer Web App </h1>
<h3>The Open source platform for Crowdfunding, Group Buying (E-commerce) and more.</h3>
</div>
<br/>

Crowdtainer allows you to host your own online campaigns without having to rely on proprietary software.

Example applications:
- Crowdfunding in general, of any size: Fund features for you app, fund a book, etc.
- Bulk / group orders (E-commerce): Buy collectively to enable new projects and lower costs for everyone.

Advantages:
- Reduces payment fees to as close to zero as possible by using [Layer 2 networks](https://l2beat.com/scaling/summary).
- Campaigners are not prone to being randomly censored by a crowdfunding company.
- Privacy oriented: Reducing the number of external dependencies can limit the sharing of sensitive customer data, which also means it is easier and less costly to comply with GDPR laws.
- Easy E-commerce integration for Invoices, accounting, etc: Woocommerce is already integrated, others can be easily added.

Disadvantages:
- users who are not familiar or comfortable with cryptocurrency may experience some difficulty, although we are currently developing credit card onboarding to address this issue.
- When compared to companies offering similar services with pre-defined terms and conditions, self-hosting a campaign requires the campaigner to define all contractual terms. This can be advantageous in certain cases, but may require upfront capital.

This repository hosts the web-based application (SvelteKit) to interact with the [Crowdtainer solidity contracts](https://github.com/crowdtainer/dapp-contracts) and includes all necessary auxiliary services.

A live deployment example can be seen in [Barterfly's Website](https://app.barterfly.de/Campaigns).

Following these instructions allows you to host your own instance of Crowdtainer.

### Frameworks

- [SvelteKit](https://kit.svelte.dev) 
- TailWindCSS
- Typechain

## Development

To run everything locally, follow the instructions in [Crowdtainer solidity contracts](https://github.com/crowdtainer/dapp-contracts) to run and deploy the contracts (`npx hardhat node`).
Once a blockchain or RPC can be connected to, proceed setting up this frontend per instructions below.

As this project uses typechain to generate typescript bindings for interaction with deployed smart contracts, if changes are made to the smart contract interfaces, then the respective JSON files (in /abi folder) needs to be updated in this project, and bindings re-generated with: `npm run build-types`.

### Environment variables
```bash
# Copy and make sure to set appropriate values.
cp .env.example .env
```

### Projects & Legal texts

Edit the projects.json file (src/routes/Data/projects.json) accordingly to configure which campaigns should be displayed and available.
The Vouchers721Address is obtained during smart contract deployment (the address of the Vouchers721 contract, which acts as the 'entrypoint' for multiple campaigns). Then each new crowdtainer campaign project generates an 'id' which should be referenced in the projects.json file.

```bash
# Configure projects to be displayed in:
src/routes/Data/projects.json

# Edit the privacy policy and other custom pages accordingly:
src/routes/Legal/Imprint/+page.svelte
src/routes/Legal/PrivacyPolicy/+page.svelte
src/routes/Legal/Terms/+page.svelte

# An optional footer block with contact details will be shown from contactHTML in:
src/lib/strings.ts
```

The productConfiguration defined in projects.json is used to build the product selection UI automatically, by aligning the product name in the deployed campaign (smart contract side), with the description/delimiters defined in product configuration on the frontend.

For example, a campaign deployed to the blockchain with the following parameters: 

```ts
await vouchers721.createCrowdtainer(
      campaignData, [
      "Germany Delivery | 3 Month Subscription | 500g",
      "Germany Delivery | 3 Month Subscription | 1kg",
      "Germany Delivery | Single | 500g",
      "Germany Delivery | Single | 1kg",
      "Europe Delivery | 3 Month Subscription | 500g",
      "Europe Delivery | 3 Month Subscription | 1kg",
      "Europe Delivery | Single | 500g",
      "Europe Delivery | Single | 1kg"
    ],
      metadataService.address
    );
```

Along with the following configuration in projects.json (web application):

```json
"productConfiguration": {
                "categoryDelimiter": " | ",
                "categoryDescriptors" : [ "Delivery", "Type", "Size"]
            }
```

Will generate an interface similar to the following:

<img src="static/images/docs/productSelection.png" alt="Crowdtainer" height="328px"/><br />
<br />


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
### To start a development environment:

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

The plugins folder contains optional auxiliary services that runs separately from the frontend (only a connection to the same redis db is required).

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

## WooCommerce (invoices/orders creation for successful campaigns)

This plugin helps with order creation and tracking workflow, by integrating with Wordpress' plugin WooCommerce. A reason to use WooCommerce is to take advantage of the existing open source ecosystem in E-commerce and avoid reimplementing existing functionality with regards to fulfillment, stock management, invoicing, tax, accounting, etc. The user doesn't need to see any web page from WooCommerce itself; This plugin simply connects to WooCommerce APIs to create orders on the system via REST calls. 

This plugin checks for work in a redis queue (created by successful campaigns in the web app), checks its validity against blockchain state (to verify participation proof), and creates the respective orders in WooCommerce with the respective product selection (a.k.a. cart items). If referrals are enabled in the campaign, it also applies discount codes so that invoices are correctly generated. 

Plugins for other e-commerce platforms can be easily created based on this plugin, by changing the REST api call with a new request format.

Please see all files under:

```sh
cd plugins/woocommerce/

# The procedure to build and run is exactly the same as specified for 'mailer' plugin above.

# Make sure to read `plugins/woocommerce/README.md` as well.
```
---

## Security Policy and Vulnerability Reporting

Please refer to [Security Policy](https://github.com/crowdtainer/dapp-web/blob/main/SECURITY.md) for detailed information about how to report vulnerabilities in this codebase.

---

## Known issues

- Typechain (our tool to generate bindings between EVM/Solidity ABI and typescript) has a bug where it generates a few imports wrongly (without typescript's "type" specifier). For this reason, these files are not included in the '.gitignore' list, so that we can quickly revert changes done by the generator.

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
    - ✅ IPFS/Swarm hash which points to the legal sale contract agreement documents.

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

- ✅ Invoice service (WooCommerce integration).
    - ✅ Background work to process checkout requests and create invoice dispatch job.
        - ✅ Create order in shop system.
        - ✅ Track in redis which tokenIds had its order created.
- ✅ When joining, I'd like to additionally specify:
    - ✅ whether I'd like to be eligible to share referral code so that I can get rewards for my friend's purchases (check-box).
    - ✅ a friend's referral code, so that I can get a discount on my own purchase (address/ENS text input field).
    - ◻️ Referral code shortener (using Either/Or ENS/redis).

- ✅ I'd like an interface to view how much rewards I acquired due sharing of personal referral code, if the project succeeds.
    - Use `Crowdtainer.accumulatedRewardsOf()` method.

- ✅ I'd like an interface/button to claim rewards due sharing of referral code.
    - Only possible if the project is in `Delivery` state.
    - Use `Crowdtainer.claimRewards()` method.
##### Out of scope for MVP:

- ◻️ Support for multiple deployments, each on potentially different chainIDs.
- ◻️ Service to set ERC-721's status as 'claimed' on-chain, for token ids which had its order created/confirmed.
- ◻️ In cases where it is desired to host this web application with a third party server (such as Cloudflare, Vercel, etc), in order to not have to trust them, it is better protect sensitive information such as delivery address by doing E2E encryption between the Browser (client-side) and the service provider before pushing the data to redis dabatase, by applying asymmetric encryption using service provider's PubKey, then decrypting the data at the service provider premises.
