# Discretize serverless apply

Since we use a strictly static site we have to use serverless functions for the application process. This projects contains the serverless function for cloudflare workers, that we use to handle incoming applications.

Two things happen:

1. The incoming application gets saved into a google sheet, which is behind a [nocodeapi.com](https://nocodeapi.com) endpoint
2. A discord broadcast is sent via a webhook

## Local development

1. Create the file `wrangler.toml` with your account cloudflare account id

```
name = "discretize-serverless-apply"
type = "javascript"

account_id = "$accountId"
workers_dev = true
route = ""
zone_id = ""
compatibility_date = "2021-10-08"
```

2. Setup the secrets:

ORIGIN_URL is the url to the website

```
$ wrangler secret put DISCORD_WEBHOOK
$ wrangler secret put NOCODEAPI_URL
$ wrangler secret put ORIGIN_URL
```

3.  Then, after installing [wrangler](https://developers.cloudflare.com/workers/get-started/) you should be able to execcute `wrangler dev` to launch the development server.

## Publishing

If you setup your `wrangler.toml` correctly, all that is required for publishing is executing `wrangler publish`

## Credits

- @alxfox for writing the discord embed logic
- [cloudflare examples](https://developers.cloudflare.com/workers/examples/cors-header-proxy) for fixing the cors related problems
