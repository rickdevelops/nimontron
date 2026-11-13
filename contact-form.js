/* Nimontron contact form (v1)
   Adds a "Talk to us" section at the end of <main>, a "Contact" link in the top bar, and swaps the
   WhatsApp-style icon on the main buttons for an Instagram one (those buttons open an Instagram DM).
   Loaded from index.html with:
     <script src="contact-form.js" data-key="YOUR_WEB3FORMS_ACCESS_KEY" defer></script>
   No key = no form. The Web3Forms key is public by design: it only lets people email the form owner. */
(function () {
  "use strict";

  var IG_ICON = '<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/>' +
    '<circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/>' +
    '<circle cx="17.3" cy="6.7" r="1.3" fill="currentColor"/>';

  function all(sel, fn) { Array.prototype.slice.call(document.querySelectorAll(sel)).forEach(fn); }

  /* The main buttons open Instagram DM, so show an Instagram icon (unless a WhatsApp number is set). */
  var hasWa = !!(window.SITE && /^\d{10,15}$/.test(window.SITE.whatsapp || ""));
  if (!hasWa) { all(".js-wa svg", function (s) { s.innerHTML = IG_ICON; }); }

  var me = document.currentScript || document.querySelector('script[src*="contact-form.js"]');
  var KEY = (me && me.getAttribute("data-key")) || "";
  var ENDPOINT = "https://api.web3forms.com/submit";
  var main = document.querySelector("main");
  if (!KEY || !main || document.getElementById("contact")) return;

  var IG = (window.SITE && window.SITE.instagram) || "nimontron_web";
  var TYPES = [
    "A wedding invitation website",
    "Another ceremony (Aiburobhat, Gaye Holud, Annaprashan...)",
    "A printable card design",
    "A website for my business (photographer, decorator, planner...)",
    "Something else, or a question"
  ];

  var SHORT = ["wedding site", "other ceremony", "printed card", "business site", "question"];

  var TXT = {
    en: {
      nav: "Contact", eyebrow: "Talk to us",
      h2: "Prefer a form? Tell us about your event.",
      sub: "Your name and a phone number or email is enough. We usually reply within a few hours.",
      name: "Your name", phone: "Phone or WhatsApp", email: "Email", opt: "(optional)",
      type: "What do you need?", date: "Event date", datePh: "e.g. 12 Feb, or not decided yet",
      msg: "Your message", msgPh: "Names, venue, or anything you'd like to know",
      t0: TYPES[0], t1: TYPES[1], t2: TYPES[2], t3: TYPES[3], t4: TYPES[4],
      send: "Send message", sending: "Sending...",
      note: "We use your details only to reply to you. Your message reaches our inbox through a form service (Web3Forms).",
      ig: "Or message us on Instagram: ",
      eName: "Please enter your name.",
      eContact: "Add a phone number or an email so we can reply.",
      ePhone: "That phone number doesn't look right. Use digits only, for example 9876543210.",
      eMail: "That email doesn't look right.",
      okH: function (n) { return "Thank you, " + n + "!"; },
      okP: function (ig) { return "We got your message and usually reply within a few hours. If your event is within 3 weeks, a DM to @" + ig + " on Instagram is the fastest way."; },
      fail: function (ig) { return "Couldn't send just now. Please try again, or message us on Instagram @" + ig + "."; }
    },
    bn: {
      nav: "যোগাযোগ", eyebrow: "আমাদের লিখুন",
      h2: "ফর্ম ভরতে চান? আপনার অনুষ্ঠানের কথা জানান।",
      sub: "আপনার নাম আর একটা ফোন নম্বর বা ইমেল দিলেই হবে। আমরা সাধারণত কয়েক ঘণ্টার মধ্যে উত্তর দিই।",
      name: "আপনার নাম", phone: "ফোন বা হোয়াটসঅ্যাপ নম্বর", email: "ইমেল", opt: "(ঐচ্ছিক)",
      type: "কী দরকার?", date: "অনুষ্ঠানের তারিখ", datePh: "যেমন ১২ ফেব্রুয়ারি, বা এখনও ঠিক হয়নি",
      msg: "আপনার বার্তা", msgPh: "নাম, ভেন্যু, বা যা জানতে চান",
      t0: "বিয়ের নিমন্ত্রণ-ওয়েবসাইট", t1: "অন্য অনুষ্ঠান (আইবুড়োভাত, গায়ে হলুদ, অন্নপ্রাশন...)", t2: "ছাপানো কার্ডের ডিজাইন",
      t3: "আমার ব্যবসার ওয়েবসাইট (ফটোগ্রাফার, ডেকোরেটর, প্ল্যানার...)", t4: "অন্য কিছু, বা একটা প্রশ্ন",
      send: "বার্তা পাঠান", sending: "পাঠানো হচ্ছে...",
      note: "আপনার তথ্য শুধু উত্তর দেওয়ার জন্যই ব্যবহার করা হয়। বার্তাটি একটি ফর্ম-সার্ভিস (Web3Forms) হয়ে আমাদের ইনবক্সে আসে।",
      ig: "অথবা ইনস্টাগ্রামে মেসেজ করুন: ",
      eName: "অনুগ্রহ করে আপনার নাম লিখুন।",
      eContact: "একটা ফোন নম্বর বা ইমেল দিন, যাতে আমরা উত্তর দিতে পারি।",
      ePhone: "ফোন নম্বরটা ঠিক মনে হচ্ছে না। শুধু সংখ্যা দিন, যেমন ৯৮৭৬৫৪৩২১০।",
      eMail: "ইমেলটা ঠিক মনে হচ্ছে না।",
      okH: function (n) { return "ধন্যবাদ, " + n + "!"; },
      okP: function (ig) { return "আপনার বার্তা পেয়েছি। আমরা সাধারণত কয়েক ঘণ্টার মধ্যে উত্তর দিই। অনুষ্ঠান ৩ সপ্তাহের মধ্যে হলে ইনস্টাগ্রামে @" + ig + "-তে মেসেজ করলে সবচেয়ে তাড়াতাড়ি উত্তর পাবেন।"; },
      fail: function (ig) { return "এখন পাঠানো গেল না। আবার চেষ্টা করুন, অথবা ইনস্টাগ্রামে @" + ig + "-তে মেসেজ করুন।"; }
    }
  };

  function lang() { return document.documentElement.lang === "bn" ? "bn" : "en"; }

  /* ---------- styles ---------- */
  var css =
    ".cf-sec{padding-top:20px;scroll-margin-top:70px}" +
    ".cf-card{background:var(--sheet,#fff);border:1px solid var(--line,#EADFCB);border-radius:24px;padding:clamp(20px,4vw,36px);max-width:48rem;box-shadow:0 24px 40px -32px rgba(60,20,30,.5)}" +
    ".cf-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}" +
    ".cf-grid .cf-full{grid-column:1/-1}" +
    ".cf-grid label{display:grid;gap:6px;font-weight:600;font-size:.95rem}" +
    ".cf-grid label small{font-weight:400;color:var(--soft,#6B5A60)}" +
    ".cf-grid input,.cf-grid select,.cf-grid textarea{font:400 1rem/1.4 var(--f-body,system-ui,sans-serif);color:var(--ink,#22141C);background:var(--paper,#FBF6EC);border:1.5px solid var(--line,#EADFCB);border-radius:14px;padding:12px 14px;width:100%;min-height:48px;box-sizing:border-box}" +
    ".cf-grid textarea{resize:vertical}" +
    ".cf-grid input:focus,.cf-grid select:focus,.cf-grid textarea:focus{outline:3px solid rgba(192,38,45,.18);border-color:var(--red,#C0262D)}" +
    ".cf-grid [aria-invalid=true]{border-color:var(--red,#C0262D)}" +
    ".cf-actions{display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin-top:20px}" +
    ".cf-actions .btn[disabled]{opacity:.6;cursor:progress}" +
    ".cf-actions p{margin:0;font-size:.95rem}" +
    ".cf-actions a{color:var(--red,#C0262D);font-weight:600}" +
    ".cf-status{min-height:1.4em;margin:14px 0 0;font-weight:600;color:var(--red,#C0262D)}" +
    ".cf-note{font-size:.86rem;color:var(--soft,#6B5A60);margin:12px 0 0}" +
    ".cf-thanks h3{font-size:1.6rem;margin-bottom:8px}" +
    ".cf-thanks p{margin:0;color:var(--soft,#6B5A60)}" +
    ".cf-hp{display:none!important}" +
    "@media(max-width:600px){.cf-grid{grid-template-columns:1fr}}";
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------- markup ---------- */
  var opts = TYPES.map(function (v, i) { return '<option value="' + v + '" data-cf="t' + i + '"></option>'; }).join("");
  var html =
    '<section id="contact" class="cf-sec"><div class="wrap">' +
      '<div class="sec-head"><p class="eyebrow" data-cf="eyebrow"></p><h2 data-cf="h2"></h2><p data-cf="sub"></p></div>' +
      '<div class="cf-card">' +
        '<form id="cf-form" novalidate>' +
          '<div class="cf-grid">' +
            '<label><span data-cf="name"></span><input name="name" autocomplete="name" maxlength="80" required></label>' +
            '<label><span><span data-cf="phone"></span> <small data-cf="opt"></small></span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="24"></label>' +
            '<label><span><span data-cf="email"></span> <small data-cf="opt"></small></span><input name="email" type="email" autocomplete="email" maxlength="120"></label>' +
            '<label><span data-cf="type"></span><select name="type">' + opts + '</select></label>' +
            '<label><span><span data-cf="date"></span> <small data-cf="opt"></small></span><input name="date" maxlength="40" data-cf-ph="datePh"></label>' +
            '<label class="cf-full"><span><span data-cf="msg"></span> <small data-cf="opt"></small></span><textarea name="message" rows="4" maxlength="1000" data-cf-ph="msgPh"></textarea></label>' +
          '</div>' +
          '<input type="checkbox" name="botcheck" class="cf-hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
          '<div class="cf-actions"><button class="btn btn-gold" type="submit"></button>' +
            '<p><span data-cf="ig"></span><a href="https://ig.me/m/' + IG + '" target="_blank" rel="noopener">@' + IG + '</a></p></div>' +
          '<p class="cf-status" id="cf-status" role="status" aria-live="polite"></p>' +
          '<p class="cf-note" data-cf="note"></p>' +
        '</form>' +
        '<div class="cf-thanks" id="cf-thanks" hidden role="status"><h3></h3><p></p></div>' +
      '</div>' +
    '</div></section>';
  main.insertAdjacentHTML("beforeend", html);

  var faq = document.querySelector('.nav nav a.lnk[href="#faq"]');
  if (faq) { faq.insertAdjacentHTML("afterend", '<a class="lnk" href="#contact" data-cf="nav"></a>'); }

  var form = document.getElementById("cf-form");
  var statusEl = document.getElementById("cf-status");
  var thanks = document.getElementById("cf-thanks");
  var btn = form.querySelector("button[type=submit]");
  var sending = false, statusKey = "", doneName = null;

  /* ---------- language ---------- */
  function render() {
    var t = TXT[lang()];
    all("[data-cf]", function (e) { var v = t[e.getAttribute("data-cf")]; if (typeof v === "string") { e.textContent = v; } });
    all("[data-cf-ph]", function (e) { e.placeholder = t[e.getAttribute("data-cf-ph")]; });
    btn.textContent = sending ? t.sending : t.send;
    if (statusKey) { var m = t[statusKey]; statusEl.textContent = typeof m === "function" ? m(IG) : m; }
    else { statusEl.textContent = ""; }
    if (doneName !== null) {
      thanks.querySelector("h3").textContent = t.okH(doneName);
      thanks.querySelector("p").textContent = t.okP(IG);
    }
  }
  function setStatus(key) { statusKey = key; render(); }
  render();
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  /* ---------- validation ---------- */
  function normDigits(s) {
    return s.replace(/[০-৯]/g, function (d) { return String(d.charCodeAt(0) - 0x09E6); });
  }
  function bad(field, key) { return { field: field, key: key }; }
  function check() {
    var f = form.elements;
    var name = f.name.value.trim(), phone = normDigits(f.phone.value.trim()), email = f.email.value.trim();
    if (name.length < 2) { return bad(f.name, "eName"); }
    if (!phone && !email) { return bad(f.phone, "eContact"); }
    if (phone) {
      var n = phone.replace(/\D/g, "").length;
      if (!/^[+\d\s()\-.]+$/.test(phone) || n < 8 || n > 15) { return bad(f.phone, "ePhone"); }
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { return bad(f.email, "eMail"); }
    return null;
  }
  form.addEventListener("input", function (e) {
    if (e.target.removeAttribute) { e.target.removeAttribute("aria-invalid"); }
    if (statusKey && statusKey !== "fail") { setStatus(""); }
  });

  /* ---------- submit ---------- */
  function showThanks(name) {
    doneName = name || "";
    form.hidden = true;
    thanks.hidden = false;
    render();
    thanks.scrollIntoView({ block: "center", behavior: "smooth" });
  }
  function source() {
    try {
      var q = new URLSearchParams(location.search);
      var r = q.get("ref") || q.get("utm_source");
      if (r) { return r.slice(0, 60); }
      if (document.referrer) { return new URL(document.referrer).hostname; }
    } catch (e) {}
    return "direct";
  }
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (sending) { return; }
    var problem = check();
    if (problem) { problem.field.setAttribute("aria-invalid", "true"); setStatus(problem.key); problem.field.focus(); return; }
    var f = form.elements;
    var name = f.name.value.trim();
    if (f.botcheck.checked) { showThanks(name); return; }
    var phone = normDigits(f.phone.value.trim()), email = f.email.value.trim();
    var payload = {
      access_key: KEY,
      subject: "Nimontron lead: " + name + " (" + SHORT[f.type.selectedIndex] + ")",
      from_name: "Nimontron website",
      name: name,
      phone: phone || "(not given)",
      event_type: f.type.value,
      event_date: f.date.value.trim() || "(not given)",
      message: f.message.value.trim() || "(no message)",
      page_language: lang(),
      source: source(),
      botcheck: false
    };
    if (email) { payload.email = email; payload.replyto = email; }
    sending = true; btn.disabled = true; setStatus("");
    function done(ok) {
      sending = false; btn.disabled = false;
      if (ok) { showThanks(name); } else { setStatus("fail"); }
    }
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().then(function (d) { return !!(r.ok && d && d.success); }, function () { return false; });
    }).then(done, function () { done(false); });
  });
})();
