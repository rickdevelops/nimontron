/* Nimontron payments API: Razorpay Standard Checkout backend (Cloudflare Worker).

   POST /api/create-order    { plan, mode }  ->  { order_id, amount, currency, key_id, ... }
   POST /api/verify-payment  { razorpay_order_id, razorpay_payment_id, razorpay_signature }  ->  { success: true }

   Secrets (set with `wrangler secret put`, never in code): RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET.
   The browser never sends an amount. It sends a plan id and "full" or "deposit", and the amount is
   worked out here, so nobody can pay Rs 1 for a Rs 7,999 package. */

const RAZORPAY_API = "https://api.razorpay.com/v1";
const MIN_PAISE = 100;

/* Rupees. Keep in sync with the packages on the website. */
const PLANS = Object.freeze({
  mini: { name: "Mini", price: 699 },
  starter: { name: "Starter", price: 1499 },
  classic: { name: "Classic", price: 1999 },
  royal: { name: "Royal", price: 7999 },
});
const MODES = ["full", "deposit"];
const DEFAULT_ORIGINS = "https://nimontron.shop,https://www.nimontron.shop";

/* Deposit is half, rounded up to a whole rupee. Returns paise. */
export function amountFor(plan, mode) {
  const price = PLANS[plan].price;
  const rupees = mode === "full" ? price : Math.ceil(price / 2);
  return rupees * 100;
}

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || DEFAULT_ORIGINS).split(",").map((s) => s.trim()).filter(Boolean);
}

function corsHeaders(origin, env) {
  if (origin && allowedOrigins(env).includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    };
  }
  return { Vary: "Origin" };
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors },
  });
}

async function readJson(request) {
  const text = await request.text();
  if (text.length > 2048) return { error: "Request too large", status: 413 };
  try {
    const data = JSON.parse(text);
    if (data && typeof data === "object" && !Array.isArray(data)) return { data };
  } catch (e) { /* fall through */ }
  return { error: "Body must be a JSON object", status: 400 };
}

function basicAuth(env) {
  return "Basic " + btoa(env.RAZORPAY_KEY_ID + ":" + env.RAZORPAY_KEY_SECRET);
}

async function createOrder(request, env, cors) {
  const parsed = await readJson(request);
  if (parsed.error) return json({ error: parsed.error }, parsed.status, cors);
  const { plan, mode } = parsed.data;

  if (typeof plan !== "string" || !Object.hasOwn(PLANS, plan)) return json({ error: "Unknown plan" }, 400, cors);
  if (!MODES.includes(mode)) return json({ error: "Mode must be full or deposit" }, 400, cors);

  const amount = amountFor(plan, mode);
  if (amount < MIN_PAISE) return json({ error: "Amount must be at least 100 paise" }, 400, cors);

  let res;
  try {
    res = await fetch(RAZORPAY_API + "/orders", {
      method: "POST",
      headers: { Authorization: basicAuth(env), "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: ("nm-" + plan + "-" + mode + "-" + Date.now().toString(36)).slice(0, 40),
        notes: { site: "nimontron.shop", plan, mode },
      }),
    });
  } catch (e) {
    console.error("Razorpay unreachable:", e && e.message);
    return json({ error: "Could not reach the payment gateway" }, 500, cors);
  }

  if (res.status === 401) {
    console.error("Razorpay rejected the API keys (401). Check RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET.");
    return json({ error: "Payment gateway authentication failed" }, 401, cors);
  }
  if (!res.ok) {
    console.error("Razorpay order error", res.status, (await res.text()).slice(0, 300));
    return json({ error: "Could not create the order" }, 500, cors);
  }

  const order = await res.json();
  const price = PLANS[plan].price;
  return json({
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    key_id: env.RAZORPAY_KEY_ID, // public by design; the secret never leaves this file
    plan,
    mode,
    balance: mode === "deposit" ? price - Math.ceil(price / 2) : 0, // rupees still due on delivery
  }, 200, cors);
}

function hexToBytes(hex) {
  if (!/^[0-9a-f]{64}$/i.test(hex)) return null;
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

/* HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET) compared in constant time. */
export async function signatureIsValid(orderId, paymentId, signature, secret) {
  const sig = hexToBytes(signature);
  if (!sig) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  return crypto.subtle.verify("HMAC", key, sig, enc.encode(orderId + "|" + paymentId));
}

async function verifyPayment(request, env, cors) {
  const parsed = await readJson(request);
  if (parsed.error) return json({ error: parsed.error }, parsed.status, cors);
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = parsed.data;

  if (![orderId, paymentId, signature].every((v) => typeof v === "string" && v.length > 0 && v.length <= 128)) {
    return json({ error: "razorpay_order_id, razorpay_payment_id and razorpay_signature are required" }, 400, cors);
  }
  if (!(await signatureIsValid(orderId, paymentId, signature, env.RAZORPAY_KEY_SECRET))) {
    console.error("Signature mismatch for", orderId, paymentId);
    return json({ success: false, error: "Payment verification failed" }, 400, cors);
  }
  return json({ success: true, order_id: orderId, payment_id: paymentId }, 200, cors);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const cors = corsHeaders(origin, env);
    const { pathname } = new URL(request.url);

    if (origin && !cors["Access-Control-Allow-Origin"]) return json({ error: "Origin not allowed" }, 403, cors);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      console.error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set");
      return json({ error: "Payments are not configured" }, 500, cors);
    }

    if (pathname === "/api/create-order") return createOrder(request, env, cors);
    if (pathname === "/api/verify-payment") return verifyPayment(request, env, cors);
    return json({ error: "Not found" }, 404, cors);
  },
};
