
## Notification service

When "signer / off-chain join authorization" is enabled in a project, joining a crowdtainer project requires an e-mail confirmation.

This service helps with the "join project" flow, at the step where the user is "verified" by sending a confirmation code (to check the existance/ownership of their e-mail).

This service reads join request entries from the redis database and dispaches the respective e-mail along with the user's "one time password" code.

Later on, the user then enters this code during the project's join process, and the code is verified in the service provider's backend process to match the provided e-mail before emitting an authorization so that the user can join the project's smart contract.

## Installation / running without docker

```sh
# Make sure you are in the plugin root folder (cd plugins/notifications/)

# Copy and edit the .env file accordingly
cp .env.example .env

# Install dependencies
npm install

# Build
npm run build

# Run
node -r dotenv/config dist/server.js

# To allow invalid https certs (during development):
NODE_ENV=development node -r dotenv/config dist/server.js

```
