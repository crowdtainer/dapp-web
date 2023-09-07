
## Checkout / order processing with WooCommerce integration

This service helps with the "check out" workflow, with integration with Wordpress plugin WooCommerce.

> WooCommerce / Wordpress are used interchangebly. For the purposes of this documentation it means the same thing: a server with Wordpress + WooCommerce plugin installed.

A reason to use WooCommerce is to take advantage of the existing ecosystem thus avoiding 'reinventing the wheel' when it comes to fulfillment, stock management, invoicing, tax, accounting, etc.

> Note: Before running this service, it is expected that the campaign products/services are pre-created in WooCommerce, and such WooCommerce's products id's must be specified in the environment file (.env). That is, the same products displayed in the campaign's deployed smart contract must be created in WooCommerce, with its respective prices and descriptions.

> It is crutial that the conversion rate is correct for each product: e.g.: in Germany, set the  EUR price equivalent to the USDC amount for each product based on the moment where "getPaidAndDeliver()" method has been called on the smart contract. As always, consult a local tax advisor before doing anything.

> Future work may also include automatically creating the products in WooCommerce based on smart contract data, but this is NOT a feature of the current "MVP".

### Process Description

After a crowdtainer project has been successful, an "order/delivery" process can be initiated:

1. The service provider calls "getPaidAndDeliver" in the project's respective smart contract, receiving the customers funds / payments.
2. The action above causes the web application to show a "Check out" button in the project's page, as well as the instruction "Please proceed to checkout to complete your order".
3. The "Checkout" button drives the user to a form, to be filled with delivery details.
4. After entering their delivery details, the user clicks the "Request Order" button.
5. A signature request is presented on the user's connected wallet. The payload is signed by the user and sent to the service provider's database (redis).
6. A thank you message is shown to the user, who is informed that the service provider's order acceptance will arrive soon by e-mail with the respective invoice.
7. In the project's web page, the "Check out" button disappears, and the user is presented with the message: "Your order has been received and is being processed."

All steps above happens outside this plugin. If they are successful and the final state (7) is reached, a 'job' had been created in the database, to be processed by this plugin. This is the point where this module's work starts.

### Order creation service

After a connection to the redis database and the WooCommerce site can be established, a worker thread will continuosly iterate on all the available jobs from the redis database:

1. The database item/work is read and data is parsed.
2. An order is created via API on the given WooCommerce instance (as defined in the environment variable).
3. If the order is successfully created in WooCommerce, the delivery job is deleted from the redis database.

Each Wordpress/WooCommerce installation can be freely configured to react to the order creation. Usually this will eventually trigger creation and dispatch of the invoice PDF e-mail.


## Installation / running without docker

```sh
# Make sure you in the plugin root folder (cd plugins/woocommerce/)

# Copy and edit the .env file accordingly
cp .env.exmple .env

# Note: make sure REDIS_CONNECTION_STRING is defined in your .env.
# It is by default commented so that it works directly with the docker compose setup, which sets the value.

# Install dependencies
npm install

# Build
npm run build

# Run
node -r dotenv/config dist/server.js

# To allow invalid https certs (during development):
NODE_ENV=development node -r dotenv/config dist/server.js

```

