/* Nimontron site extras (v1)
   - "For wedding vendors" offer block (before the FAQ)
   - Arnab & Srijita testimonial in the real-wedding section
   - "Use the form" links in the hero and the closing block
   - "What happens next" panel beside the contact form
   Load after contact-form.js:  <script src="site-extras.js" defer></script> */
(function () {
  "use strict";
  var main = document.querySelector("main");
  if (!main || document.getElementById("vendors")) return;

  function all(sel, fn) { Array.prototype.slice.call(document.querySelectorAll(sel)).forEach(fn); }
  function lang() { return document.documentElement.lang === "bn" ? "bn" : "en"; }
  var hasForm = !!document.getElementById("contact");

  var TXT = {
    en: {
      eyebrow: "For wedding vendors",
      h2: "Photographers, decorators, makeup artists: a website that helps couples book you.",
      p: "Couples look you up before they message. Give them one link with your best work, your packages and a Book-on-WhatsApp button, in Bangla and English.",
      l1: "A gallery of your best work", l2: "Packages and prices, the way you want them", l3: "Reviews from your couples",
      l4: "A WhatsApp button with your own number", l5: "Live in about 2 days, works on every phone",
      price: "₹2,499 founding price", priceNote: "Normally ₹4,999 · live for one year · your own domain at cost + ₹500",
      sample: "See a sample site", ask: "Ask for yours",
      fine: "50% to start, the rest when it's live. We use your photos only with your permission.",
      mockName: "Your Studio", mockType: "Wedding Photography · Kolkata", mockBtn: "Book on WhatsApp",
      quote: "“It's amazing! All our guests are loving it, and they want one for their own weddings too.”",
      by: "Arnab & Srijita, our first couple",
      heroForm: "Not on Instagram? Use the contact form →",
      closeForm: "Or use the form",
      nextH: "What happens next",
      s1: "We reply, usually within a few hours.",
      s2: "You get a free preview with your names.",
      s3: "Like it? Pay 50% to book. The rest after delivery.",
      s4: "Your invite goes live, ready to share on WhatsApp."
    },
    bn: {
      eyebrow: "ওয়েডিং ভেন্ডরদের জন্য",
      h2: "ফটোগ্রাফার, ডেকোরেটর, মেকআপ আর্টিস্ট: এমন একটা ওয়েবসাইট, যা দেখে দম্পতিরা সহজে আপনাকে বুক করবেন।",
      p: "মেসেজ করার আগে দম্পতিরা আপনাকে খুঁজে দেখেন। তাঁদের দিন একটা লিংক: আপনার সেরা কাজ, প্যাকেজ আর হোয়াটসঅ্যাপে বুক করার বোতাম, বাংলা আর ইংরেজিতে।",
      l1: "আপনার সেরা কাজের গ্যালারি", l2: "আপনার মতো করে প্যাকেজ আর দাম", l3: "আপনার দম্পতিদের রিভিউ",
      l4: "আপনার নিজের নম্বরে হোয়াটসঅ্যাপ বোতাম", l5: "মোটামুটি ২ দিনে লাইভ, যেকোনো ফোনে চলে",
      price: "শুরুর অফার ₹২,৪৯৯", priceNote: "সাধারণত ₹৪,৯৯৯ · এক বছর লাইভ · নিজের ডোমেন হলে খরচ + ₹৫০০",
      sample: "নমুনা সাইট দেখুন", ask: "আপনারটা চাই",
      fine: "শুরু করতে ৫০%, বাকিটা লাইভ হলে। আপনার অনুমতি ছাড়া আপনার ছবি ব্যবহার করা হয় না।",
      mockName: "আপনার স্টুডিও", mockType: "বিয়ের ফটোগ্রাফি · কলকাতা", mockBtn: "হোয়াটসঅ্যাপে বুক করুন",
      quote: "“অসাধারণ হয়েছে! আমাদের সব অতিথির খুব পছন্দ হয়েছে, ওঁরাও নিজেদের বিয়েতে এমন একটা চান।”",
      by: "অর্ণব ও সৃজিতা, আমাদের প্রথম দম্পতি",
      heroForm: "ইনস্টাগ্রাম নেই? যোগাযোগ ফর্মটি ব্যবহার করুন →",
      closeForm: "অথবা ফর্মে লিখুন",
      nextH: "এরপর কী হবে",
      s1: "আমরা উত্তর দিই, সাধারণত কয়েক ঘণ্টার মধ্যে।",
      s2: "আপনাদের নাম দিয়ে একটা বিনামূল্যে নমুনা পাঠাই।",
      s3: "পছন্দ হলে ৫০% দিয়ে বুক করুন। বাকিটা ডেলিভারির পরে।",
      s4: "নিমন্ত্রণ লাইভ হয়ে যায়, হোয়াটসঅ্যাপে পাঠানোর জন্য তৈরি।"
    }
  };

  var css =
    ".vx-sec{padding-top:20px}" +
    ".vx-card{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:40px;align-items:center;border-radius:28px;padding:clamp(24px,5vw,56px);" +
      "background:radial-gradient(900px 500px at 80% 0%,var(--wine,#4A1324),transparent 60%),var(--night,#1A0A10);color:var(--cream,#FBF3E4);overflow:hidden}" +
    ".vx-card .eyebrow{color:var(--gold,#E9B65A)}" +
    ".vx-card h2{font-size:clamp(1.8rem,3.8vw,2.6rem);line-height:1.1;margin:12px 0 14px}" +
    ".vx-card p{margin:0;opacity:.88}" +
    ".vx-list{list-style:none;padding:0;margin:20px 0 0;display:grid;gap:8px}" +
    ".vx-list li{padding-left:26px;position:relative}" +
    ".vx-list li::before{content:'✦';position:absolute;left:0;color:var(--gold,#E9B65A)}" +
    ".vx-price{margin:22px 0 0;display:grid;gap:2px}" +
    ".vx-price b{font:600 1.5rem/1.2 var(--f-display,Georgia,serif);color:var(--gold2,#F6D58E)}" +
    ".vx-price span{font-size:.92rem;opacity:.8}" +
    ".vx-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}" +
    ".vx-card .btn-ghost{border-color:rgba(251,243,228,.6);color:var(--cream,#FBF3E4)}" +
    ".vx-card .vx-fine{margin-top:14px;font-size:.88rem;opacity:.75}" +
    ".vx-mock{background:var(--paper,#FBF6EC);color:var(--ink,#22141C);border-radius:20px;box-shadow:0 30px 60px -30px rgba(0,0,0,.7);overflow:hidden;transform:rotate(2deg)}" +
    ".vx-bar{display:flex;gap:6px;padding:10px 14px;background:#EFE4D2}" +
    ".vx-bar i{width:9px;height:9px;border-radius:50%;background:#D9C7AB}" +
    ".vx-hero{padding:18px 18px 14px;background:linear-gradient(135deg,var(--wine,#4A1324),var(--night,#1A0A10));color:var(--cream,#FBF3E4)}" +
    ".vx-hero b{display:block;font:600 1.3rem/1.2 var(--f-display,Georgia,serif)}" +
    ".vx-hero small{display:block;opacity:.8;margin-top:4px}" +
    ".vx-hero span{display:inline-block;margin-top:12px;background:var(--gold,#E9B65A);color:#1A0A10;border-radius:999px;padding:6px 12px;font-size:.8rem;font-weight:700}" +
    ".vx-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:10px}" +
    ".vx-tiles i{aspect-ratio:1;border-radius:8px;background:linear-gradient(135deg,#F4EAD8,#E3CDAA)}" +
    ".vx-tiles i:first-child{grid-column:span 2;grid-row:span 2;aspect-ratio:auto}" +
    ".vx-quote{margin:24px 0 26px;padding:4px 0 4px 18px;border-left:3px solid var(--gold,#E9B65A)}" +
    ".vx-quote p{font:italic 500 1.15rem/1.45 var(--f-display,Georgia,serif);margin:0}" +
    ".vx-quote .vx-by{display:block;margin-top:8px;font-size:.92rem;opacity:.8}" +
    "html[lang=bn] .vx-quote p{font-style:normal}" +
    ".vx-cf-row{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:28px;align-items:start}" +
    ".vx-cf-row .cf-card{max-width:none}" +
    ".vx-next{background:var(--tint,#F4EAD8);border-radius:24px;padding:clamp(20px,3vw,30px)}" +
    ".vx-next h3{font-size:1.35rem;margin-bottom:14px}" +
    ".vx-next ol{margin:0;padding:0;list-style:none;counter-reset:vx;display:grid;gap:14px}" +
    ".vx-next li{counter-increment:vx;position:relative;padding-left:42px;min-height:30px}" +
    ".vx-next li::before{content:counter(vx);position:absolute;left:0;top:-2px;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;" +
      "font:600 .95rem/1 var(--f-display,Georgia,serif);color:#2A1305;background:linear-gradient(180deg,var(--gold2,#F6D58E),var(--gold,#E9B65A))}" +
    "@media(max-width:860px){.vx-card,.vx-cf-row{grid-template-columns:1fr}.vx-mock{transform:none;max-width:360px}}";
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  /* 1. Vendor offer block, before the FAQ */
  var vendorHtml =
    '<section id="vendors" class="vx-sec"><div class="wrap"><div class="vx-card">' +
      '<div>' +
        '<p class="eyebrow" data-vx="eyebrow"></p><h2 data-vx="h2"></h2><p data-vx="p"></p>' +
        '<ul class="vx-list"><li data-vx="l1"></li><li data-vx="l2"></li><li data-vx="l3"></li><li data-vx="l4"></li><li data-vx="l5"></li></ul>' +
        '<div class="vx-price"><b data-vx="price"></b><span data-vx="priceNote"></span></div>' +
        '<div class="vx-cta"><a class="btn btn-gold" href="vendor.html?n=Your%20Studio&amp;t=photo" target="_blank" rel="noopener" data-vx="sample"></a>' +
          '<a class="btn btn-ghost vx-ask" href="' + (hasForm ? "#contact" : "https://ig.me/m/nimontron_web") + '"' + (hasForm ? "" : ' target="_blank" rel="noopener"') + ' data-vx="ask"></a></div>' +
        '<p class="vx-fine" data-vx="fine"></p>' +
      '</div>' +
      '<div class="vx-mock" aria-hidden="true"><div class="vx-bar"><i></i><i></i><i></i></div>' +
        '<div class="vx-hero"><b data-vx="mockName"></b><small data-vx="mockType"></small><span data-vx="mockBtn"></span></div>' +
        '<div class="vx-tiles"><i></i><i></i><i></i><i></i><i></i></div></div>' +
    '</div></div></section>';
  var faq = document.getElementById("faq");
  if (faq) { faq.insertAdjacentHTML("beforebegin", vendorHtml); } else { main.insertAdjacentHTML("beforeend", vendorHtml); }

  var ask = document.querySelector(".vx-ask");
  if (ask && hasForm) {
    ask.addEventListener("click", function () {
      var sel = document.querySelector('#cf-form select[name="type"]');
      if (sel) { sel.selectedIndex = 3; }
      setTimeout(function () { var n = document.querySelector('#cf-form input[name="name"]'); if (n) { n.focus({ preventScroll: true }); } }, 600);
    });
  }

  /* 2. Testimonial in the real-wedding section */
  var realCta = document.querySelector('#real a[data-i18n="real.cta"]');
  if (realCta) {
    realCta.insertAdjacentHTML("beforebegin",
      '<blockquote class="vx-quote"><p data-vx="quote"></p><span class="vx-by" data-vx="by"></span></blockquote>');
  }

  /* 3. "Use the form" links (only when the contact form is on the page) */
  if (hasForm) {
    var heroFine = document.querySelector('.hero [data-i18n="hero.fine"]');
    if (heroFine) { heroFine.insertAdjacentHTML("afterend", '<p class="fine"><a href="#contact" data-vx="heroForm"></a></p>'); }
    var closeCta = document.querySelector('a[data-i18n="close.cta"]');
    if (closeCta && closeCta.parentNode) {
      closeCta.parentNode.insertAdjacentHTML("beforeend", '<a class="btn btn-ghost" href="#contact" data-vx="closeForm"></a>');
    }
    /* 4. "What happens next" beside the form */
    var card = document.querySelector("#contact .cf-card");
    if (card) {
      var row = document.createElement("div");
      row.className = "vx-cf-row";
      card.parentNode.insertBefore(row, card);
      row.appendChild(card);
      row.insertAdjacentHTML("beforeend",
        '<aside class="vx-next"><h3 data-vx="nextH"></h3><ol><li data-vx="s1"></li><li data-vx="s2"></li><li data-vx="s3"></li><li data-vx="s4"></li></ol></aside>');
    }
  }

  function render() {
    var t = TXT[lang()];
    all("[data-vx]", function (e) { var v = t[e.getAttribute("data-vx")]; if (typeof v === "string") { e.textContent = v; } });
  }
  render();
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
