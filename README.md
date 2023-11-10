# Data Integrity Monitor/Alerts via Cloudflare Worker

## General Info

This repo is an example to implementing alerts in Slack with Cloudflare Workers when data differs between two different API sources (ie. Nacelle & Shopify). The key benefit of this is to alert when data does not match and when a sync (or reindex) is required. In order to implement this repo for your own needs, it is recommended to use Cloudflare's Wrangler CLI to edit and deploy the Cloudflare Worker.

This worker uses multiple cron triggers (in a single Cloudflare Worker) to trigger different checks:

- Total collection count
- Total product count
- Count of products in specified list of collections
  - The list of collections must be specified in countProductsInCollections.js.

## Environment Variables

Environment variables can be setup in the Cloudflare Dashboard or in the wrangler.toml file as documented [here](https://developers.cloudflare.com/workers/configuration/environment-variables/#add-environment-variables-via-wrangler).

- SHOPIFY_ENDPOINT
- NACELLE_ENDPOINT
- SLACK_WEBHOOK_URL
- SHOPIFY_ADMIN_ENDPOINT
- SHOPIFY_STOREFRONT_TOKEN
- SHOPIFY_ADMIN_TOKEN

## Working with Wrangler

Please see relevant documentation.

- [Wrangler Install](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- [Wrangler Commands](https://developers.cloudflare.com/workers/wrangler/commands/)
- [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Multiple Cron Triggers](https://developers.cloudflare.com/workers/examples/multiple-cron-triggers/)
  - [Test Cron Triggers Using Wrangler](https://developers.cloudflare.com/workers/examples/multiple-cron-triggers/#test-cron-triggers-using-wrangler)

## Additional Notes

**Be sure to use the access tokens that correspond to the same level of access in the source and destination system.**
**For validating between Shopify & Nacelle, you would use the same Shopify storefront access token and admin token that is being used for the Shopify connector in the Nacelle dashboard.**

Please see [Slack documentation](https://api.slack.com/messaging/webhooks) on setting up incoming webhooks. The 'Incoming Webhook URL' is the appropriate endpoint to use for the env variable.
