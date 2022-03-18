
## Requirements

- Typescript code.
- Support for [wallet connect](https://docs.walletconnect.com/quick-start/dapps/react-native).

### Optional / sugggested
- [Ethers.js](https://ethers.org).
- Solidity ABI to TypeScript automatic binding generator [TypeChain](https://github.com/dethcrypto/TypeChain)
- [TailwindCSS](https://tailwindcss.com) for styling.

## User Stories

- ✅ for completed items, ◻️ otherwise.

### As an observer (anyone, including page loaded without any wallet connected):

- I'd like to be able to get basic information of a crowdtainer project deployed, such as:
    - ◻️ See a list of active crowdtainer projects
        - Can be a static list/item for MVP.
    - ◻️ All information used during deployment (opening and closing time, etc).
        - Use `ICrowdtainer.CampaignData`.
    - ◻️ Check the project status (Funding, Expired, Delivery, Finalized).
        - Use `Crowdtainer.crowdtainerState()`.
    - ◻️ If active, percentage of goal so far (progress bar).
        - Use `Crowdtainer.totalValueRaised()` and `CampaignData.targetMinimum().` to calculate percentage.
    - ◻️ IPFS/Swarm hash which points to the legal sale contract agreement documents.

### As a buyer/participant

- ◻️ Once I open one of the listed projects (from screen of observer user stories above), I'd like to see the product list and prices, so that I can specify my order and sign a transaction to participate in the group buying.
    - The product name can be read from `Vouchers721.productDescription[crowdtainerId]()`.
    - Prices can be read from `Crowdtainer.unitPricePerType()`.
    - To join the project call `ICrowdtainer.join()`.

- ◻️ When joining, I'd like to additionally specify:
    - ◻️ whether I'd like to be eligible to share referral code so that I can get rewards for my friend's purchases (check-box).
    - ◻️ a friend's referral code, so that I can get a discount on my own purchase (address/ENS text input field).

- ◻️ After joining, I'd like to see my own purchase/voucher details, as a SVG image.
    - Use `Vouchers721.tokenUri()` to get the generated image.

#### Dashboard view (viewable components only if wallet is connected)

- ◻️ I’d like an interface/button to view and withdrawl my deposits in a running project, so that I can quit if no longer interested, or if the crowdfunding failed.
    - This would call `leave()` smart contract method.

- ◻️ I'd like to view if the project's goal was reached, so that I can decide to either withdrawl my funds or wait for product delivery.
    - Use `Crowdtainer.crowdtainerState()`.

- ◻️ I'd like an interface to view how much rewards I acquired due sharing of personal referral code, if the project succeeds.
    - Use `Crowdtainer.accumulatedRewardsOf()` method.

- ◻️ I'd like an interface/button to claim rewards due sharing of referral code.
    - Only possible if the project is in `Delivery` state.
    - Use `Crowdtainer.claimRewards()` method.

- ◻️ I'd like an interface/button to claim refunds if the sale was not successful.
    - Only possible if the project is in `Failed` state.
    - Use `Crowdtainer.claimFunds()` method.

- ◻️ I'd like an interface to see how much I bought for each type of product, to get an overview of my own order.

### As a service provider (lower priority for MVP)

- ◻️ I must be able to create a project by specifying the following variables so that I can start a crowdtainer for my product or service:

```
    /**
     * @param _shippingAgent Address that represents the product or service provider.
     * @param _openingTime Funding opening time.
     * @param _expireTime Time after which the shipping agent can no longer withdraw funds.
     * @param _targetMinimum Amount in ERC20 units required for the Crowdtainer to be considered to be successful.
     * @param _targetMaximum Amount in ERC20 units after which no further participation is possible.
     * @param _unitPricePerType Array with price of each item, in ERC2O units. Zero indicates end of product list.
     * @param _referralRate Percentage used for incentivising participation. Half the amount goes to the referee, and the other half to the referrer.
     * @param _referralEligibilityValue The minimum purchase value required to be eligible to participate in referral rewards.
     * @param _token Address of the ERC20 token used for payment.
```

- ◻️ I must be able to withdraw the funds if the minimum target is reached, so that I can signal that no more sales are available, and start working on shipping the sold products.
    - Use function `Crowdtainer.getPaidAndDeliver()`.

- ◻️ I need a button to cancel a project, so that I can signal participants that the project will no longer be possible, and participants are therefore able to leave taking their money without waiting for expiration.
    - Use function `Crowdtainer.abortProject()`.

- ◻️ I need a way to mark a voucher as "claimed".
    - Use function `Vouchers721.setClaimStatus(tokenId,value)`.

- ◻️ I need a 2-way communication channel, so that once a Crowdtainer is successful, I can communicate with them regarding their delivery.
    - Idea: NFT-gated discord channel per Crowdtainer project.
