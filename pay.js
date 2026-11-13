/* Nimontron payments: Razorpay Standard Checkout on the static site.
   Adds "Pay in full" and "Pay 50% now" buttons to every package card and to the closing "How to book" box.
   Needs the payments Worker (see worker/README.md). Set SITE.payApi in index.html to the Worker URL.
   Leave SITE.payApi empty and this file does nothing, so the site keeps working exactly as before.
   The browser never sends an amount: it sends a package id and "full" or "deposit", and the Worker prices it.
   Load after the inline SITE script:  <script src="pay.js" defer></script> */
(function () {
  "use strict";
  var SITE = window.SITE || {};
  var API = String(SITE.payApi || "").replace(/\/+$/, "");
  if (!API) return;

  var D = document;
  var CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
  /* Display prices in rupees. The Worker holds the real ones; keep both lists the same. */
  var PLANS = {
    mini: { en: "Mini", bn: "মিনি", price: 699 },
    starter: { en: "Starter", bn: "স্টার্টার", price: 1499 },
    classic: { en: "Classic", bn: "ক্লাসিক", price: 1999 },
    royal: { en: "Royal", bn: "রয়্যাল", price: 7999 }
  };

  var T = {
    en: {
      full: "Pay in full", fullSub: "Nothing to pay on delivery", best: "Best choice",
      half: "Pay 50% now", halfSub: function (r) { return "then " + r + " on delivery"; },
      secure: "Secure payment by Razorpay · UPI, cards, net banking, wallets",
      perkLead: "Pay in full and get: ", pkg: "Package", close: "Close", tryAgain: "Try again", maybeLater: "Maybe later",
      opening: "Opening secure checkout…", confirming: "Confirming your payment…",
      upTitle: "Pay once and you're done",
      upBody: function (f, d, r) { return "Pay " + f + " now and there is nothing left to pay on delivery. Or reserve your spot with " + d + " today and pay " + r + " later."; },
      upFull: function (f) { return "Pay " + f + " in full"; },
      upHalf: function (d) { return "Continue with the " + d + " deposit"; },
      errNet: "We can't reach the payment service. Check your connection and try again.",
      errScript: "The secure checkout didn't load. Check your connection or any ad blocker and try again.",
      errGeneric: "We couldn't start the payment. Please try again, or message us.",
      failTitle: "The payment didn't go through",
      failBody: "If any money was deducted, your bank usually returns it within a few working days. Nothing else is needed from you.",
      dFullTitle: "Not ready to pay in full?",
      dFullBody: function (d, r) { return "Reserve your spot with just " + d + " now. The remaining " + r + " is due on delivery."; },
      dFullBtn: function (d) { return "Pay the " + d + " deposit instead"; },
      dHalfTitle: "No problem",
      dHalfBody: "Want to see it first? We'll make a free preview with your names.",
      dHalfBtn: "Get my free preview",
      okFull: "Payment received. Thank you!", okHalf: "Deposit received. Thank you!",
      custTitle: "Your details", custBody: "So we can reach you about your invitation. We use these only for your order.", custName: "Your name", custPhone: "Phone number (WhatsApp if possible)", custEmail: "Email (optional)", custGo: "Continue to payment", errName: "Please enter your name.", errPhone: "Please enter a valid phone number, for example 98XXXXXXXX.", errEmail: "That email does not look right. You can leave it empty.",
      okBodyNote: "Your spot is booked. We have received your payment details and will message you shortly. To get started, send us your names, event dates and venues on Instagram.",
      okBody: "Your spot is booked. Send us your names, event dates and venues along with the payment ID below, and we'll start right away.",
      balance: function (r) { return "The balance of " + r + " is due on delivery."; },
      payId: "Payment ID", copy: "Copy", copied: "Copied",
      msgIg: "Message us on Instagram", msgWa: "Message us on WhatsApp",
      unTitle: "We couldn't confirm this payment yet",
      unBody: "If money was deducted, please don't pay again. Check again, or message us with the payment ID below and we'll confirm it.",
      checkAgain: "Check again"
    },
    bn: {
      full: "পুরো টাকা দিন", fullSub: "ডেলিভারির সময় আর কিছু দিতে হবে না", best: "সেরা পছন্দ",
      half: "এখন ৫০% দিন", halfSub: function (r) { return "বাকি " + r + " ডেলিভারির সময়"; },
      secure: "রেজরপে-র নিরাপদ পেমেন্ট · ইউপিআই, কার্ড, নেট ব্যাংকিং, ওয়ালেট",
      perkLead: "পুরোটা দিলে পাবেন: ", pkg: "প্যাকেজ", close: "বন্ধ করুন", tryAgain: "আবার চেষ্টা করুন", maybeLater: "পরে করব",
      opening: "নিরাপদ পেমেন্ট খুলছে…", confirming: "আপনার পেমেন্ট যাচাই হচ্ছে…",
      upTitle: "একবারেই মিটিয়ে নিন",
      upBody: function (f, d, r) { return "এখন " + f + " দিলে ডেলিভারির সময় আর কিছু দিতে হবে না। অথবা আজ " + d + " দিয়ে জায়গা পাকা করুন, বাকি " + r + " পরে দিন।"; },
      upFull: function (f) { return f + " পুরোটা দিন"; },
      upHalf: function (d) { return d + " অগ্রিম দিয়েই এগোই"; },
      errNet: "পেমেন্ট সার্ভিসে পৌঁছনো যাচ্ছে না। ইন্টারনেট দেখে আবার চেষ্টা করুন।",
      errScript: "নিরাপদ পেমেন্ট লোড হয়নি। ইন্টারনেট বা অ্যাড ব্লকার দেখে আবার চেষ্টা করুন।",
      errGeneric: "পেমেন্ট শুরু করা গেল না। আবার চেষ্টা করুন, বা আমাদের মেসেজ করুন।",
      failTitle: "পেমেন্ট সম্পূর্ণ হয়নি",
      failBody: "টাকা কেটে থাকলে ব্যাংক সাধারণত কয়েক কর্মদিবসের মধ্যে ফেরত দেয়। আপনাকে আর কিছু করতে হবে না।",
      dFullTitle: "পুরোটা দিতে এখনই তৈরি নন?",
      dFullBody: function (d, r) { return "মাত্র " + d + " দিয়ে জায়গা পাকা করুন। বাকি " + r + " ডেলিভারির সময়।"; },
      dFullBtn: function (d) { return "বরং " + d + " অগ্রিম দিই"; },
      dHalfTitle: "কোনো সমস্যা নেই",
      dHalfBody: "আগে দেখে নিতে চান? আপনাদের নামে বিনামূল্যে নমুনা বানিয়ে দেব।",
      dHalfBtn: "বিনামূল্যে নমুনা নিন",
      okFull: "পেমেন্ট পেয়েছি। ধন্যবাদ!", okHalf: "অগ্রিম পেয়েছি। ধন্যবাদ!",
      custTitle: "আপনার তথ্য", custBody: "আপনার আমন্ত্রণ নিয়ে যোগাযোগ করার জন্য। শুধু এই অর্ডারের জন্যই ব্যবহার হবে।", custName: "আপনার নাম", custPhone: "ফোন নম্বর (সম্ভব হলে হোয়াটসঅ্যাপ)", custEmail: "ইমেল (ঐচ্ছিক)", custGo: "পেমেন্টে এগিয়ে যান", errName: "অনুগ্রহ করে নাম লিখুন।", errPhone: "সঠিক ফোন নম্বর লিখুন, যেমন 98XXXXXXXX।", errEmail: "ইমেলটি ঠিক মনে হচ্ছে না। চাইলে ফাঁকা রাখতে পারেন।",
      okBodyNote: "আপনার জায়গা পাকা। আপনার পেমেন্টের তথ্য আমরা পেয়ে গেছি, শীঘ্রই যোগাযোগ করব। কাজ শুরু করতে ইনস্টাগ্রামে আপনাদের নাম, অনুষ্ঠানের তারিখ আর ভেন্যু পাঠান।",
      okBody: "আপনার জায়গা পাকা। নিচের পেমেন্ট আইডি-র সঙ্গে নাম, অনুষ্ঠানের তারিখ আর ভেন্যু পাঠান, আমরা সঙ্গে সঙ্গে কাজ শুরু করব।",
      balance: function (r) { return "বাকি " + r + " ডেলিভারির সময় দিতে হবে।"; },
      payId: "পেমেন্ট আইডি", copy: "কপি", copied: "কপি হয়েছে",
      msgIg: "ইনস্টাগ্রামে মেসেজ করুন", msgWa: "হোয়াটসঅ্যাপে মেসেজ করুন",
      unTitle: "এখনও পেমেন্টটি যাচাই করা যায়নি",
      unBody: "টাকা কেটে থাকলে আবার দেবেন না। আবার যাচাই করুন, বা নিচের পেমেন্ট আইডি-সহ আমাদের মেসেজ করুন, আমরা নিশ্চিত করে দেব।",
      checkAgain: "আবার যাচাই করুন"
    }
  };

  function lang() { return D.documentElement.lang === "bn" ? "bn" : "en"; }
  function tx() { return T[lang()]; }
  function bnDigits(s) { return String(s).replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }); }
  function money(n) {
    var s = "₹" + Number(n).toLocaleString("en-IN");
    return lang() === "bn" ? bnDigits(s) : s;
  }
  function deposit(plan) { return Math.ceil(PLANS[plan].price / 2); }       // same rule as the Worker
  function balance(plan) { return PLANS[plan].price - deposit(plan); }
  function perk() { return lang() === "bn" ? (SITE.fullPayPerkBn || SITE.fullPayPerk || "") : (SITE.fullPayPerk || ""); }

  function el(tag, cls, text) {
    var e = D.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ---------- styles ---------- */
  var css =
    ".np-foot{display:grid;gap:10px;align-content:end;min-width:0}" +
    ".np-pay{display:grid;gap:8px}" +
    ".np-btn{font:600 1rem/1.15 var(--f-body,inherit);border:0;border-radius:999px;padding:13px 16px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;width:100%;text-align:center;transition:transform .2s ease,box-shadow .2s ease,filter .2s}" +
    ".np-btn:hover{transform:translateY(-2px)}.np-btn:focus-visible{outline:3px solid var(--gold,#E9B65A);outline-offset:2px}" +
    ".np-btn[disabled]{opacity:.6;cursor:progress;transform:none}" +
    ".np-btn small{font-weight:500;font-size:.78rem;line-height:1.25;opacity:.92}" +
    ".np-full{position:relative;background:linear-gradient(180deg,#D8343B,var(--red,#C0262D));color:#fff;box-shadow:0 14px 30px -14px rgba(192,38,45,.8),inset 0 1px 0 rgba(255,255,255,.25)}" +
    ".np-tag{position:absolute;top:-9px;right:14px;background:linear-gradient(180deg,var(--gold2,#F6D58E),var(--gold,#E9B65A));color:#2A1305;font:800 .64rem/1 var(--f-body,inherit);letter-spacing:.08em;text-transform:uppercase;padding:4px 8px;border-radius:999px}" +
    ".np-half{background:color-mix(in srgb,currentColor 9%,transparent);color:inherit;font-size:.92rem;padding:10px 14px}" +
    ".np-sec{margin:0;font-size:.74rem;line-height:1.3;text-align:center;opacity:.7}" +
    ".np-box{display:grid;gap:10px;margin:2px 0 6px}" +
    ".np-box label{font-size:.85rem;opacity:.85}" +
    ".np-sel{font:600 1rem/1.2 var(--f-body,inherit);padding:11px 12px;border-radius:12px;border:1px solid rgba(233,182,90,.45);background:rgba(255,255,255,.1);color:inherit;width:100%}" +
    ".np-sel option{color:#22141C;background:#fff}" +
    ".np-ov{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:16px;background:rgba(26,10,16,.66);backdrop-filter:blur(3px)}" +
    ".np-dlg{background:var(--paper,#FBF6EC);color:var(--ink,#22141C);width:100%;max-width:26rem;border-radius:24px;padding:24px 22px;display:grid;gap:14px;box-shadow:0 40px 80px -30px rgba(0,0,0,.7);max-height:calc(100vh - 32px);overflow:auto}" +
    ".np-dlg h3{margin:0;font:500 1.4rem/1.2 var(--f-display,Georgia,serif)}" +
    ".np-dlg p{margin:0;font-size:.97rem;line-height:1.5}" +
    ".np-f{display:grid;gap:10px}" +
    ".np-f label{display:grid;gap:4px;font-size:.85rem;font-weight:600}" +
    ".np-f input{font:inherit;font-weight:400;font-size:1rem;padding:11px 12px;border-radius:10px;border:1.5px solid rgba(34,20,28,.35);background:#fff;color:#22141C;width:100%;box-sizing:border-box}" +
    ".np-f input:focus{outline:3px solid var(--gold,#E9B65A);outline-offset:1px}" +
    ".np-f .np-err{color:#B3261E;font-size:.85rem;min-height:1.1em}" +
    ".np-acts{display:grid;gap:8px}" +
    ".np-dlg .np-btn.np-ghost{background:transparent;color:var(--ink,#22141C);border:1.5px solid var(--ink,#22141C);font-size:.95rem;padding:11px 14px}" +
    ".np-dlg .np-btn.np-link{background:transparent;color:var(--soft,#6B5A60);font-size:.9rem;padding:8px;text-decoration:underline}" +
    ".np-dlg a.np-btn{text-decoration:none}" +
    ".np-id{display:flex;gap:8px;align-items:center;flex-wrap:wrap}" +
    ".np-id code{font:600 .95rem/1 ui-monospace,SFMono-Regular,Menlo,monospace;padding:10px 12px;border-radius:10px;background:var(--tint,#F4EAD8);word-break:break-all;user-select:all}" +
    ".np-id button{font:600 .85rem/1 var(--f-body,inherit);padding:9px 12px;border-radius:10px;border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer}" +
    ".np-spin{width:22px;height:22px;border-radius:50%;border:3px solid var(--line,#EADFCB);border-top-color:var(--red,#C0262D);animation:np-r .8s linear infinite;justify-self:center}" +
    "@keyframes np-r{to{transform:rotate(360deg)}}" +
    "@media (prefers-reduced-motion:reduce){.np-btn,.np-spin{transition:none;animation-duration:2s}.np-btn:hover{transform:none}}";
  var style = el("style"); style.textContent = css; D.head.appendChild(style);

  /* ---------- Razorpay checkout.js, loaded on first use ---------- */
  var scriptPromise = null;
  function ensureCheckout() {
    if (window.Razorpay) return Promise.resolve();
    if (!scriptPromise) {
      scriptPromise = new Promise(function (resolve, reject) {
        var s = el("script"); s.src = CHECKOUT_SRC; s.async = true;
        s.onload = function () { window.Razorpay ? resolve() : reject({ kind: "script" }); };
        s.onerror = function () { scriptPromise = null; s.remove(); reject({ kind: "script" }); };
        D.head.appendChild(s);
      });
    }
    return scriptPromise;
  }
  function warm() { ensureCheckout().catch(function () {}); }

  /* ---------- dialog ---------- */
  var overlay = null, lastFocus = null;
  function closeDialog() {
    if (!overlay) return;
    overlay.remove(); overlay = null;
    D.removeEventListener("keydown", onKey, true);
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }
  function onKey(e) {
    if (!overlay) return;
    if (e.key === "Escape") { e.stopPropagation(); closeDialog(); return; }
    if (e.key !== "Tab") return;
    var items = overlay.querySelectorAll("button:not([disabled]),a[href]");
    if (!items.length) { e.preventDefault(); return; }
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && D.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && D.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  /* spec: {title, body, spinner, acts:[{label, sub, kind:"primary"|"ghost"|"link", onClick | href}], extra: Node} */
  function dialog(spec) {
    if (!overlay) {
      lastFocus = D.activeElement;
      overlay = el("div", "np-ov");
      overlay.addEventListener("mousedown", function (e) { if (e.target === overlay && spec.dismissible !== false) closeDialog(); });
      D.body.appendChild(overlay);
      D.addEventListener("keydown", onKey, true);
    }
    overlay.textContent = "";
    var box = el("div", "np-dlg");
    box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true");
    var h = el("h3", "", spec.title || ""); h.id = "np-title"; box.setAttribute("aria-labelledby", "np-title");
    box.appendChild(h);
    if (spec.spinner) { box.appendChild(el("div", "np-spin")); box.setAttribute("aria-busy", "true"); }
    if (spec.body) box.appendChild(el("p", "", spec.body));
    if (spec.extra) box.appendChild(spec.extra);
    var acts = el("div", "np-acts");
    (spec.acts || []).forEach(function (a) {
      var b = el(a.href ? "a" : "button", "np-btn " + (a.kind === "ghost" ? "np-ghost" : a.kind === "link" ? "np-link" : "np-full"));
      if (a.href) { b.href = a.href; b.target = "_blank"; b.rel = "noopener"; } else b.type = "button";
      b.appendChild(el("span", "", a.label));
      if (a.sub) b.appendChild(el("small", "", a.sub));
      if (a.onClick) b.addEventListener("click", a.onClick);
      acts.appendChild(b);
    });
    if (acts.children.length) box.appendChild(acts);
    overlay.appendChild(box);
    var f = box.querySelector("button,a[href]");
    if (f) f.focus();
  }
  function message(title, body, retry) {
    var acts = [];
    if (retry) acts.push({ label: tx().tryAgain, onClick: retry });
    acts.push({ label: tx().close, kind: retry ? "link" : "ghost", onClick: closeDialog });
    dialog({ title: title, body: body, acts: acts });
  }

  function contactHref() {
    if (/^\d{10,15}$/.test(SITE.whatsapp || "")) return "https://wa.me/" + SITE.whatsapp;
    return "https://ig.me/m/" + (SITE.instagram || "");
  }
  function contactLabel() { return /^\d{10,15}$/.test(SITE.whatsapp || "") ? tx().msgWa : tx().msgIg; }

  function paymentIdBox(id) {
    var wrap = el("div", "np-id");
    wrap.appendChild(el("span", "", tx().payId + ":"));
    wrap.appendChild(el("code", "", id));
    var b = el("button", "", tx().copy); b.type = "button";
    b.addEventListener("click", function () {
      var done = function () { b.textContent = tx().copied; setTimeout(function () { b.textContent = tx().copy; }, 1800); };
      try { navigator.clipboard.writeText(id).then(done, function () {}); } catch (e) {}
    });
    wrap.appendChild(b);
    return wrap;
  }

  /* ---------- payment flow ---------- */
  var busy = false;

  /* "Pay 50%" first offers the full payment once, then goes on with whichever the person picks. */
  function choose(plan, mode) {
    if (busy) return;
    if (mode === "full") return begin(plan, "full");
    var t = tx(), f = money(PLANS[plan].price), d = money(deposit(plan)), r = money(balance(plan));
    var body = t.upBody(f, d, r), p = perk();
    dialog({
      title: t.upTitle, body: p ? body + " " + t.perkLead + p.replace(/[.\s]+$/, "") + "." : body,
      acts: [
        { label: t.upFull(f), sub: t.fullSub, onClick: function () { begin(plan, "full"); } },
        { label: t.upHalf(d), kind: "ghost", onClick: function () { begin(plan, "deposit"); } }
      ]
    });
  }

  var customer = null;
  function normPhone(s) {
    var raw = String(s || "").replace(/[\s\-().]/g, "");
    if (/^\+(?!91)\d{8,15}$/.test(raw)) return raw;
    var d = raw.replace(/^\+?91/, "").replace(/^0/, "");
    return /^[6-9]\d{9}$/.test(d) ? "+91" + d : "";
  }
  function askDetails(plan, mode) {
    if (busy) return;
    var t = tx(), box = el("div", "np-f"), err = el("p", "np-err");
    function field(label, type, ac) {
      var l = el("label", "", label), i = el("input");
      i.type = type; i.autocomplete = ac; i.maxLength = 120;
      l.appendChild(i); box.appendChild(l); return i;
    }
    var iName = field(t.custName, "text", "name");
    var iPhone = field(t.custPhone, "tel", "tel"); iPhone.setAttribute("inputmode", "tel");
    var iMail = field(t.custEmail, "email", "email");
    if (customer) { iName.value = customer.name; iPhone.value = customer.phone; iMail.value = customer.email; }
    box.appendChild(err);
    function go() {
      var name = iName.value.trim().replace(/\s+/g, " "), ph = normPhone(iPhone.value), mail = iMail.value.trim();
      err.textContent = "";
      if (name.length < 2) { err.textContent = t.errName; iName.focus(); return; }
      if (!ph) { err.textContent = t.errPhone; iPhone.focus(); return; }
      if (mail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { err.textContent = t.errEmail; iMail.focus(); return; }
      customer = { name: name.slice(0, 80), phone: ph, email: mail.slice(0, 120) };
      beginPay(plan, mode);
    }
    [iName, iPhone, iMail].forEach(function (i) {
      i.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); go(); } });
    });
    dialog({ title: t.custTitle, body: t.custBody, extra: box, acts: [{ label: t.custGo, onClick: go }, { label: t.close, kind: "link", onClick: closeDialog }] });
    setTimeout(function () { iName.focus(); }, 60);
  }

  function begin(plan, mode) { askDetails(plan, mode); }

  function beginPay(plan, mode) {
    if (busy) return;
    busy = true;
    dialog({ title: tx().opening, spinner: true, dismissible: false });
    Promise.all([ensureCheckout(), createOrder(plan, mode)]).then(function (r) {
      openCheckout(r[1], plan, mode);
    }).catch(function (err) {
      busy = false;
      var t = tx();
      message(t.failTitle, err && err.kind === "script" ? t.errScript : err && err.kind === "net" ? t.errNet : t.errGeneric,
        function () { beginPay(plan, mode); });
    });
  }

  function createOrder(plan, mode) {
    return fetch(API + "/api/create-order", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: plan, mode: mode, customer: customer })
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok || !data.order_id) throw { kind: "server", status: res.status };
        return data;
      });
    }, function () { throw { kind: "net" }; });
  }

  function openCheckout(order, plan, mode) {
    var settled = false, failure = null;
    closeDialog();
    var name = PLANS[plan].en;
    var rzp = new window.Razorpay({
      key: order.key_id, order_id: order.order_id, amount: order.amount, currency: order.currency,
      name: "Nimontron",
      prefill: { name: (customer || {}).name || "", contact: (customer || {}).phone || "", email: (customer || {}).email || "" },
      notes: { customer_name: (customer || {}).name || "", customer_phone: (customer || {}).phone || "", customer_email: (customer || {}).email || "", plan: plan, mode: mode },
      description: name + " · " + (mode === "full" ? "full payment" : "50% deposit"),
      theme: { color: "#C0262D" },
      handler: function (resp) { settled = true; verify(resp, plan, mode); },
      modal: {
        confirm_close: true,
        ondismiss: function () {
          if (settled) return;
          busy = false;
          if (failure) paymentFailed(plan, mode, failure); else cancelled(plan, mode);
        }
      }
    });
    /* Razorpay keeps its own window open for retries, so remember the reason and show it if they leave. */
    rzp.on("payment.failed", function (resp) { failure = (resp && resp.error && resp.error.description) || true; });
    try { rzp.open(); } catch (e) { busy = false; message(tx().failTitle, tx().errGeneric, function () { beginPay(plan, mode); }); }
  }

  function verify(resp, plan, mode) {
    dialog({ title: tx().confirming, spinner: true, dismissible: false });
    var payload = {
      razorpay_order_id: resp.razorpay_order_id,
      razorpay_payment_id: resp.razorpay_payment_id,
      razorpay_signature: resp.razorpay_signature
    };
    fetch(API + "/api/verify-payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (res) { return res.json().catch(function () { return {}; }).then(function (d) { return res.ok && d.success === true; }); })
      .catch(function () { return false; })
      .then(function (ok) {
        busy = false;
        if (ok) notify(plan, mode, payload, true).then(function (sent) { success(plan, mode, payload.razorpay_payment_id, sent); });
        else unconfirmed(plan, mode, resp);
      });
  }

  var SHEET_LOG = "https://script.google.com/macros/s/AKfycbzOo0YX5TnkR-Zjp4iRCduA9D5dCeZtM1yCMfEl-tnWz39kmkL-TerhdW7P4eDPvTFd2A/exec";
  var notified = {};
  /* Emails the owner (via Web3Forms, same key as the contact form) with the payment details. Resolves true if sent. */
  function notify(plan, mode, resp, verified) {
    var id = resp.razorpay_payment_id, key = id + (verified ? ":v" : ":u");
    if (notified[key]) return notified[key];
    var me = D.querySelector('script[src*="contact-form.js"]');
    var KEY = (me && me.getAttribute("data-key")) || "";
    if (!KEY) { notified[key] = Promise.resolve(false); return notified[key]; }
    var paid = mode === "full" ? PLANS[plan].price : deposit(plan);
    var due = mode === "deposit" ? balance(plan) : 0;
    var payload = {
      access_key: KEY,
      subject: "Nimontron PAYMENT " + (verified ? "received" : "NEEDS CHECK") + " - " + PLANS[plan].en + " (" + (mode === "full" ? "full" : "50% deposit") + ") Rs " + paid + (customer ? " - " + customer.name : ""),
      from_name: "Nimontron website",
      status: verified ? "Verified by server (signature OK)" : "NOT verified yet - check the Razorpay dashboard",
      plan: PLANS[plan].en,
      customer_name: customer ? customer.name : "(not given)",
      customer_phone: customer ? customer.phone : "(not given)",
      customer_email: customer && customer.email ? customer.email : "(not given)",
      payment_type: mode === "full" ? "Full payment" : "50% deposit",
      amount_paid: "Rs " + paid,
      balance_due_on_delivery: "Rs " + due,
      payment_id: id || "(missing)",
      order_id: resp.razorpay_order_id || "(missing)",
      page_language: lang(),
      page: location.origin + location.pathname,
      time_utc: new Date().toISOString(),
      botcheck: false
    };
    if (customer && customer.email) { payload.email = customer.email; payload.replyto = customer.email; }
    var send = fetch("https://api.web3forms.com/submit", {
      method: "POST", keepalive: true,
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json().then(function (d) { return !!(r.ok && d && d.success); }, function () { return false; }); })
      .catch(function () { return false; });
    /* Backup record: a row in the owner's Google Sheet (Apps Script web app). */
    var sheet = fetch(SHEET_LOG, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(Object.assign({}, payload, { access_key: undefined }))
    }).then(function (r) { return r.json().then(function (d) { return !!(d && d.success); }, function () { return false; }); })
      .catch(function () { return false; });
    var both = Promise.all([send, sheet]).then(function (r) { return r[0] || r[1]; });
    var wait = new Promise(function (res) { setTimeout(function () { res(false); }, 8000); });
    notified[key] = Promise.race([both, wait]);
    return notified[key];
  }

  function success(plan, mode, paymentId, sent) {
    var t = tx(), box = el("div");
    box.style.display = "grid"; box.style.gap = "10px";
    if (mode === "deposit") box.appendChild(el("p", "", t.balance(money(balance(plan)))));
    if (!sent) box.appendChild(paymentIdBox(paymentId));
    dialog({
      title: mode === "full" ? t.okFull : t.okHalf, body: sent ? t.okBodyNote : t.okBody, extra: box,
      acts: [{ label: contactLabel(), href: contactHref() }, { label: t.close, kind: "link", onClick: closeDialog }]
    });
  }

  function unconfirmed(plan, mode, resp) {
    notify(plan, mode, resp, false);
    var t = tx();
    dialog({
      title: t.unTitle, body: t.unBody, extra: paymentIdBox(resp.razorpay_payment_id),
      acts: [
        { label: t.checkAgain, onClick: function () { verify(resp, plan, mode); } },
        { label: contactLabel(), kind: "ghost", href: contactHref() }
      ]
    });
  }

  function paymentFailed(plan, mode, reason) {
    var t = tx(), acts = [{ label: t.tryAgain, onClick: function () { begin(plan, mode); } }];
    if (mode === "full") acts.push({ label: t.dFullBtn(money(deposit(plan))), kind: "ghost", onClick: function () { begin(plan, "deposit"); } });
    acts.push({ label: t.close, kind: "link", onClick: closeDialog });
    dialog({ title: t.failTitle, body: (typeof reason === "string" ? reason + ". " : "") + t.failBody, acts: acts });
  }

  /* They closed checkout without paying. Full -> offer the smaller deposit; deposit -> offer the free preview. */
  function cancelled(plan, mode) {
    var t = tx();
    if (mode === "full") {
      dialog({
        title: t.dFullTitle, body: t.dFullBody(money(deposit(plan)), money(balance(plan))),
        acts: [
          { label: t.dFullBtn(money(deposit(plan))), onClick: function () { begin(plan, "deposit"); } },
          { label: t.maybeLater, kind: "link", onClick: closeDialog }
        ]
      });
    } else {
      dialog({
        title: t.dHalfTitle, body: t.dHalfBody,
        acts: [
          { label: t.dHalfBtn, href: contactHref() },
          { label: t.maybeLater, kind: "link", onClick: closeDialog }
        ]
      });
    }
  }

  /* ---------- buttons ---------- */
  var renderers = [];
  function payButtons(plan, showTag) {
    var wrap = el("div", "np-pay");
    function render() {
      var t = tx(), p = perk();
      wrap.textContent = "";
      var full = el("button", "np-btn np-full"); full.type = "button";
      if (showTag) full.appendChild(el("span", "np-tag", t.best));
      full.appendChild(el("span", "", t.full + " · " + money(PLANS[plan].price)));
      full.appendChild(el("small", "", p || t.fullSub));
      full.addEventListener("click", function () { choose(plan, "full"); });
      var half = el("button", "np-btn np-half"); half.type = "button";
      half.appendChild(el("span", "", t.half + " · " + money(deposit(plan))));
      half.appendChild(el("small", "", t.halfSub(money(balance(plan)))));
      half.addEventListener("click", function () { choose(plan, "deposit"); });
      [full, half].forEach(function (b) { b.addEventListener("pointerenter", warm, { once: true }); b.addEventListener("focus", warm, { once: true }); });
      wrap.appendChild(full); wrap.appendChild(half);
    }
    render(); renderers.push(render);
    return wrap;
  }

  function mountCards() {
    Array.prototype.forEach.call(D.querySelectorAll(".plan"), function (card) {
      if (card.querySelector(".np-pay")) return;
      var cta = card.querySelector(".js-wa[data-msg]");
      var plan = cta && cta.getAttribute("data-msg");
      if (!plan || !PLANS[plan]) return;
      var foot = el("div", "np-foot");
      cta.parentNode.insertBefore(foot, cta);
      foot.appendChild(payButtons(plan, plan === "classic"));
      var sec = el("p", "np-sec"); foot.appendChild(sec);
      renderers.push(function () { sec.textContent = tx().secure; }); sec.textContent = tx().secure;
      foot.appendChild(cta);
    });
  }

  function mountClosing() {
    var host = D.querySelector(".pay.rv") || D.querySelector(".close .pay");
    if (!host || D.getElementById("pay-now")) return;
    var box = el("div", "np-box"); box.id = "pay-now";
    var label = el("label"), sel = el("select", "np-sel");
    sel.id = "np-plan"; label.htmlFor = "np-plan";
    var holder = el("div", "np-pay");
    function plan() { return sel.value; }
    function renderSel() {
      var keep = sel.value || "classic";
      label.textContent = tx().pkg;
      sel.textContent = "";
      Object.keys(PLANS).forEach(function (k) {
        var o = el("option", "", PLANS[k][lang()] + " · " + money(PLANS[k].price)); o.value = k; sel.appendChild(o);
      });
      sel.value = keep;
    }
    function renderBtns() {
      var t = tx(), p = perk(), id = plan();
      holder.textContent = "";
      var full = el("button", "np-btn np-full"); full.type = "button";
      full.appendChild(el("span", "np-tag", t.best));
      full.appendChild(el("span", "", t.full + " · " + money(PLANS[id].price)));
      full.appendChild(el("small", "", p || t.fullSub));
      full.addEventListener("click", function () { choose(plan(), "full"); });
      var half = el("button", "np-btn np-half"); half.type = "button";
      half.appendChild(el("span", "", t.half + " · " + money(deposit(id))));
      half.appendChild(el("small", "", t.halfSub(money(balance(id)))));
      half.addEventListener("click", function () { choose(plan(), "deposit"); });
      holder.appendChild(full); holder.appendChild(half);
    }
    sel.addEventListener("change", renderBtns);
    sel.addEventListener("focus", warm, { once: true });
    renderSel(); renderBtns();
    var sec = el("p", "np-sec", tx().secure);
    renderers.push(function () { renderSel(); renderBtns(); sec.textContent = tx().secure; });
    box.appendChild(label); box.appendChild(sel); box.appendChild(holder); box.appendChild(sec);
    var h3 = host.querySelector("h3");
    host.insertBefore(box, h3 ? h3.nextSibling : host.firstChild);
  }

  mountCards();
  mountClosing();

  /* keep wording in step with the English / বাংলা switch */
  new MutationObserver(function () { renderers.forEach(function (r) { r(); }); })
    .observe(D.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
