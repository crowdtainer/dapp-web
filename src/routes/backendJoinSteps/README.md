## 1. Explanation

When a camapaign has a signer (address!=0), the requirements to "allow" users to join can be arbitrarily defined
off-chain. In the current implementation, the following invariants are meant to be asserted:

1. Email is validated (user is able to open their email and provide the backend with a code).
2. User signed the terms and agreement with their wallet.
3. One email per wallet combination is allowed.
4. All of the above must be specific to the network and chainId, so that one project doesn't interfere with another.
5. A cost per wallet limit/cap is applied.

Below is a description of how each invariant above is implemented currently:

### Invariant 1
- The client (frontend) requests a nonce code for a given email (**getChallangeCodeAPI**).
- The server:
    - responds with a random number (sent by email).
    - persists the number in the db.
- The client provides the nonce code to **validateEmailAPI**.
- The server checks if the nonce for the email matches, if yes, flag the email as 'verified'.

### Invariant 2
- The client sends a request to the 'authorizeWalletAPI', with the following parameters:
```
//                          email: string,      // user's email
//                  signerAddress: string,      // user stated signer address
//                        chainId: string,      // Blockchain network ID
//                 voucherAddress: string,      // Voucher Contract address
//             crowdtainerAddress: string,      // Crowdtainer Address
//                         domain: string,      // user stated domain
//                          nonce: string,      // nonce
//                 currentTimeISO: string,      // time when signature was created
//                  signatureHash: hex string   // statement signature
```

Signature hash is the hash of a message, whose contents itself includes all of the aforementioned parameters. See implementation for exact string format.

- The server checks:
  - If the email was previously validated (Invariant 1).
  - If the domain is correct.
  - If the provided chain id matches the supported network for the given campaign.
  - If the provided Vouchers721 and Crowdtainer smart contract addresses matches a recognized/valid campaign.
  - The the nonce code is correct and valid for the given email.
- The server then hashes the contents in the pre-defined message string, and checks if the provided signed hash matches the signer.
- The server performs the checks of **Invariant 3**.
- The server sets the respective wallet as 'authorized' by persisting the signature, along with the respective nonce.

### Invariant 3

- If the given e-mail is found in the db, and the found wallet has already joined the campaign, then fail the request.
- Otherwise, persist the wallet for the given email.
- On smart contract level, a previously used nonce can no longer be used. The 'nonce' is the code provided in the first step, in form of email verification code.

### Invariant 4

- All keys are prefixed with chain id, Vouchers721 and Crowdtainer contract addresses.

### Invariant 5

- In the last step, before the backend (**authProofAPI**) will sign the approval for the user to join the campaign, a cost limit is applied, based on the definition in projects.json of the respective campaign.