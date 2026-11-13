# Nimontron payments Worker

Razorpay Standard Checkout needs a server to create orders and check signatures. The site itself lives on GitHub Pages (static), so this small Cloudflare Worker does that part. The free Cloudflare plan is plenty.

| Endpoint | Does |
| --- | --- |
| `POST /api/create-order` | Takes `{ plan, mode }` (`mode` is `full` or `deposit`), works out the amount itself, creates the Razorpay order, returns `{ order_id, amount, currency, key_id }`. |
| `POST /api/verify-payment` | Takes the three Razorpay values and returns success only if `HMAC-SHA256(order_id|payment_id, KEY_SECRET)` matches the signature (HTTP 400 otherwise). |

## Deploy (once)

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put RAZORPAY_KEY_ID        # paste the key id when asked
npx wrangler secret put RAZORPAY_KEY_SECRET    # paste the key secret when asked
npx wrangler deploy                            # prints https://nimontron-pay.<you>.workers.dev
```

Then in `index.html` set `payApi: "https://nimontron-pay.<you>.workers.dev"` and push to GitHub. Until `payApi` is set, the pay buttons simply don't appear.

`ALLOWED_ORIGINS` in `wrangler.toml` lists the sites allowed to call the API (nimontron.shop and www). Add a domain there if you ever need one.

## Test locally

```bash
cd worker && npm run dev          # Worker on http://localhost:8787, reads worker/.env
# in another terminal, from the repo root:
python3 -m http.server 8000       # then temporarily set payApi: "http://localhost:8787" in index.html
```

Open http://localhost:8000 and click a Pay button. Razorpay test mode: card `4111 1111 1111 1111` with any future expiry and CVV, or UPI `success@razorpay` (use `failure@razorpay` to see a failed payment). `npm test` runs the Worker's unit tests.

## Keys

`worker/.env` holds the keys for local use and is in `.gitignore`. Never commit it: this repo is public. Rotate the secret in the Razorpay dashboard if it is ever exposed.

## Changing prices

Prices live in two places that must match: `PLANS` in `src/index.js` (what is charged) and `PLANS` in `../pay.js` (what is shown). The deposit is half, rounded up to a whole rupee.

## Going live

Switch to live keys (`wrangler secret put` again), and finish Razorpay's activation (KYC, plus the Terms, Privacy and Refund pages Razorpay asks to see on the website).
