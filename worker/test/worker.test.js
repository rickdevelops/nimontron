import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import worker, { amountFor } from "../src/index.js";

const env = { RAZORPAY_KEY_ID: "rzp_test_ABC", RAZORPAY_KEY_SECRET: "topsecret", ALLOWED_ORIGINS: "https://nimontron.shop" };
const ORIGIN = { Origin: "https://nimontron.shop", "Content-Type": "application/json" };
const call = (path, body, headers = ORIGIN, method = "POST") =>
  worker.fetch(new Request("https://pay.example" + path, { method, headers, body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body) }), env);

function mockRazorpay(status = 200, payload) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(payload ?? { id: "order_X1", amount: JSON.parse(init.body).amount, currency: "INR" }), { status });
  };
  return calls;
}

test("amounts are server-side: full, and deposit rounded up to a whole rupee", () => {
  assert.equal(amountFor("classic", "full"), 199900);
  assert.equal(amountFor("classic", "deposit"), 100000);
  assert.equal(amountFor("mini", "deposit"), 300); // TEMP: Mini is Rs 5 for testing (real: 35000 at Rs 699)
  assert.equal(amountFor("royal", "deposit"), 400000);
});

test("create-order: calls Razorpay with server-computed amount and basic auth", async () => {
  const calls = mockRazorpay();
  const res = await call("/api/create-order", { plan: "classic", mode: "deposit", amount: 1 });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual([body.order_id, body.amount, body.currency, body.key_id, body.balance], ["order_X1", 100000, "INR", "rzp_test_ABC", 999]);
  assert.equal(calls[0].url, "https://api.razorpay.com/v1/orders");
  assert.equal(calls[0].init.headers.Authorization, "Basic " + Buffer.from("rzp_test_ABC:topsecret").toString("base64"));
  assert.equal(JSON.parse(calls[0].init.body).amount, 100000); // client-sent amount ignored
  assert.ok(JSON.parse(calls[0].init.body).receipt.length <= 40);
  assert.ok(!JSON.stringify(body).includes("topsecret"));
});

test("create-order: validation", async () => {
  mockRazorpay();
  assert.equal((await call("/api/create-order", { plan: "nope", mode: "full" })).status, 400);
  assert.equal((await call("/api/create-order", { plan: "__proto__", mode: "full" })).status, 400);
  assert.equal((await call("/api/create-order", { plan: "mini", mode: "half" })).status, 400);
  assert.equal((await call("/api/create-order", "not json")).status, 400);
  assert.equal((await call("/api/create-order", "x".repeat(5000))).status, 413);
});

test("create-order: Razorpay 401 -> 401, other errors -> 500", async () => {
  mockRazorpay(401, { error: { description: "Authentication failed" } });
  assert.equal((await call("/api/create-order", { plan: "mini", mode: "full" })).status, 401);
  mockRazorpay(500, { error: {} });
  assert.equal((await call("/api/create-order", { plan: "mini", mode: "full" })).status, 500);
  globalThis.fetch = async () => { throw new Error("network"); };
  assert.equal((await call("/api/create-order", { plan: "mini", mode: "full" })).status, 500);
});

const sign = (o, p, s = "topsecret") => createHmac("sha256", s).update(o + "|" + p).digest("hex");

test("verify-payment: valid signature succeeds", async () => {
  const res = await call("/api/verify-payment", { razorpay_order_id: "order_A1", razorpay_payment_id: "pay_B2", razorpay_signature: sign("order_A1", "pay_B2") });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).success, true);
});

test("verify-payment: mismatch -> 400, missing fields -> 400", async () => {
  const base = { razorpay_order_id: "order_A1", razorpay_payment_id: "pay_B2" };
  for (const sig of [sign("order_A1", "pay_B2", "wrong"), sign("order_A1", "pay_OTHER"), "zz", "a".repeat(64)]) {
    const res = await call("/api/verify-payment", { ...base, razorpay_signature: sig });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).success, false);
  }
  assert.equal((await call("/api/verify-payment", base)).status, 400);
  assert.equal((await call("/api/verify-payment", {})).status, 400);
});

test("CORS: allowed origin echoed, others blocked, preflight works, GET rejected", async () => {
  const ok = await call("/api/verify-payment", {}, ORIGIN);
  assert.equal(ok.headers.get("Access-Control-Allow-Origin"), "https://nimontron.shop");
  assert.equal((await call("/api/create-order", { plan: "mini", mode: "full" }, { Origin: "https://evil.example", "Content-Type": "application/json" })).status, 403);
  const pre = await call("/api/create-order", undefined, ORIGIN, "OPTIONS");
  assert.equal(pre.status, 204);
  assert.equal((await call("/api/create-order", undefined, ORIGIN, "GET")).status, 405);
});

test("missing secrets -> 500", async () => {
  const res = await worker.fetch(new Request("https://pay.example/api/create-order", { method: "POST", body: "{}" }), {});
  assert.equal(res.status, 500);
});
