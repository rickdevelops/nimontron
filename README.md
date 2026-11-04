# Nimontron site

Static site, no build step. Upload this folder to a GitHub repo and turn on GitHub Pages.

## Before you share it

Open `index.html`, find the `SITE` block near the bottom and fill in:

- `whatsapp`: your WhatsApp Business number, digits only with 91 in front
- `payLink`: Razorpay or Instamojo payment link (leave empty to book on WhatsApp)
- `upi`: your UPI ID
- `foundingLeft`: lower it each time a founding couple books

## Make a site for a new couple (about 10 minutes)

1. Copy `traditional.json` to `<names>.json` and change names, dates, venues, landmarks and family names. Set `"demo": false`.
2. Copy `traditional.html` to `<names>.html` and change `data-config` to `<names>.json` and the `<title>`.
3. Guest links: `.../<names>.html#biye` for the bride's side, `#boubhat` for the groom's side. Rename or remove modes in the config.

Themes: `traditional`, `modern`, `aiburobhat`, `annaprashan`. Landmark `x`/`y` run from -1 to 1 around the venue pin.

## RSVP to Supabase

The form calls `window.NIMONTRON_RSVP(payload, config)` if it exists. Add a small script before `invite.js` that inserts `payload` into your `rsvp` table (same setup as the Arnab & Srijita site).
