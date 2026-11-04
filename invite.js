/* Nimontron invitation renderer.
   One JSON config -> one complete invitation site.
   Usage: <script src="../invite/invite.js" data-config="../configs/name.json"></script>
   Guest links: page.html#biye, page.html#boubhat (any key in config.modes). */
(function () {
  "use strict";

  var script = document.currentScript;
  var configUrl = script && script.getAttribute("data-config");

  /* ---------- tiny helpers ---------- */
  var BN_DIGITS = "০১২৩৪৫৬৭৮৯";
  function bnNum(s) { return String(s).replace(/[0-9]/g, function (d) { return BN_DIGITS[d]; }); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function seeded(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
  }

  var UI = {
    bn: {
      events: "অনুষ্ঠানসূচি", rsvp: "আসছেন তো?", rsvpSub: "অনুগ্রহ করে জানিয়ে দিন, আমরা সেই মতো আয়োজন করব।",
      name: "আপনার নাম", phone: "ফোন নম্বর (ঐচ্ছিক)", guests: "মোট কতজন আসছেন", which: "কোন কোন অনুষ্ঠানে আসছেন",
      note: "আশীর্বাদ বা শুভেচ্ছা (ঐচ্ছিক)", send: "জানিয়ে দিন", attending: "আসছি", notAttending: "এবার আসতে পারছি না",
      thanks: "ধন্যবাদ!", thanksSub: "আপনার উত্তর পৌঁছে গেছে। দেখা হচ্ছে শিগগিরই।",
      openMap: "পুরো ম্যাপ খুলুন", addCal: "ক্যালেন্ডারে রাখুন", days: "দিন বাকি", today: "আজই সেই দিন",
      venue: "স্থান", time: "সময়", invitedBy: "নিবেদক", menu: "ভোজের তালিকা", details: "জেনে রাখুন",
      lang: "ভাষা", madeWith: "Nimontron দিয়ে তৈরি", ownEvent: "নিজের অনুষ্ঠানের জন্য এমন নিমন্ত্রণ চান?",
      demo: "নমুনা", demoNote: "এটি একটি নমুনা সাইট। আসল সাইটে প্রতিটি উত্তর সঙ্গে সঙ্গে দম্পতির ইমেলে পৌঁছে যায়।",
      viewing: "অতিথিরা পান নিজের লিংক", required: "নামটা লিখে দিন", pickOne: "অন্তত একটি অনুষ্ঠান বেছে নিন",
      landmarks: "কাছেই"
    },
    en: {
      events: "Events", rsvp: "Will you join us?", rsvpSub: "Please let us know so we can plan for you.",
      name: "Your name", phone: "Phone (optional)", guests: "Number of guests", which: "Which events will you attend",
      note: "A blessing or note (optional)", send: "Send RSVP", attending: "Joyfully attending", notAttending: "Can't make it this time",
      thanks: "Thank you!", thanksSub: "Your RSVP has reached the family. See you soon.",
      openMap: "Open full map", addCal: "Add to calendar", days: "days to go", today: "It's today",
      venue: "Venue", time: "Time", invitedBy: "With love from", menu: "On the menu", details: "Good to know",
      lang: "Language", madeWith: "Made with Nimontron", ownEvent: "Want an invite like this for your event?",
      demo: "Demo", demoNote: "This is a demo site. On a real site, every RSVP reaches the couple by email instantly.",
      viewing: "Each side gets its own link", required: "Please add your name", pickOne: "Pick at least one event",
      landmarks: "Nearby"
    }
  };

  var state = { lang: "bn", mode: "both", cfg: null };
  function t(v) {
    if (v == null) return "";
    if (typeof v === "string") return v;
    return v[state.lang] != null ? v[state.lang] : (v.en || v.bn || "");
  }
  function u(k) { return UI[state.lang][k]; }
  function num(s) { return state.lang === "bn" ? bnNum(s) : String(s); }

  /* ---------- dates & times ---------- */
  function fmtDate(iso) {
    var d = new Date(iso + "T12:00:00+05:30");
    try {
      return new Intl.DateTimeFormat(state.lang === "bn" ? "bn-IN" : "en-IN",
        { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(d);
    } catch (e) { return iso; }
  }
  function fmtTime(hm) {
    var p = hm.split(":"), h = +p[0], m = p[1];
    if (state.lang === "en") {
      var hh = h % 12 || 12;
      return hh + ":" + m + (h < 12 ? " am" : " pm");
    }
    var part = h < 4 ? "রাত" : h < 6 ? "ভোর" : h < 12 ? "সকাল" : h < 16 ? "দুপুর" : h < 18 ? "বিকেল" : h < 20 ? "সন্ধ্যা" : "রাত";
    return part + " " + bnNum((h % 12 || 12) + ":" + m);
  }
  function calLink(ev) {
    var d = ev.date.replace(/-/g, ""), s = ev.time.replace(":", "") + "00";
    var endH = Math.min(23, +ev.time.split(":")[0] + (ev.hours || 4));
    var e = (endH < 10 ? "0" : "") + endH + ev.time.split(":")[1] + "00";
    var q = "action=TEMPLATE&text=" + encodeURIComponent(t(ev.name) + " · " + t(state.cfg.title)) +
      "&dates=" + d + "T" + s + "/" + d + "T" + e + "&ctz=Asia/Kolkata&location=" +
      encodeURIComponent(t(ev.venue.name) + ", " + (ev.venue.mapQuery || t(ev.venue.address)));
    return "https://calendar.google.com/calendar/render?" + q;
  }
  function mapLink(v) {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(v.mapQuery || t(v.address));
  }

  /* ---------- generated artwork ---------- */
  function ornament(o) {
    // concentric rings of petals, like an alpana drawn with rice paste
    o = o || {};
    var rings = o.rings || [
      { n: 8, r: 16, len: 26, w: 11 }, { n: 16, r: 44, len: 22, w: 8 }, { n: 24, r: 70, len: 16, w: 6, dot: true }
    ];
    var size = o.size || 200, c = size / 2, parts = [];
    parts.push('<circle cx="' + c + '" cy="' + c + '" r="7" class="orn-fill"/>');
    rings.forEach(function (ring, ri) {
      for (var i = 0; i < ring.n; i++) {
        var a = (360 / ring.n) * i + (ri % 2 ? 180 / ring.n : 0);
        var y0 = c - ring.r, y1 = y0 - ring.len, w = ring.w;
        var path = "M" + c + " " + y0 + " C" + (c - w) + " " + (y0 - ring.len * 0.35) + " " + (c - w * 0.5) + " " + (y1 + 3) + " " + c + " " + y1 +
          " C" + (c + w * 0.5) + " " + (y1 + 3) + " " + (c + w) + " " + (y0 - ring.len * 0.35) + " " + c + " " + y0 + "Z";
        parts.push('<path d="' + path + '" transform="rotate(' + a.toFixed(2) + " " + c + " " + c + ')" class="' + (ri % 2 ? "orn-line" : "orn-fill") + '"/>');
        if (ring.dot) parts.push('<circle cx="' + c + '" cy="' + (y1 - 6) + '" r="2.2" transform="rotate(' + a.toFixed(2) + " " + c + " " + c + ')" class="orn-fill"/>');
      }
      if (ring.circle !== false) parts.push('<circle cx="' + c + '" cy="' + c + '" r="' + (ring.r - 4) + '" class="orn-line" fill="none"/>');
    });
    return '<svg class="ornament" viewBox="0 0 ' + size + " " + size + '" aria-hidden="true">' + parts.join("") + "</svg>";
  }
  function divider() {
    return '<svg class="divider" viewBox="0 0 240 24" aria-hidden="true"><path d="M8 12H96M144 12H232" class="orn-line"/>' +
      '<path d="M120 2C126 8 126 16 120 22C114 16 114 8 120 2Z" class="orn-fill"/><circle cx="104" cy="12" r="2.5" class="orn-fill"/><circle cx="136" cy="12" r="2.5" class="orn-fill"/></svg>';
  }
  function miniMap(v, key) {
    var r = seeded(key + (v.mapQuery || "")), W = 320, H = 170, cx = W / 2, cy = H / 2, s = [];
    s.push('<rect width="' + W + '" height="' + H + '" class="map-land"/>');
    if (v.water) s.push('<path d="M-10 ' + (H - 30) + " C 80 " + (H - 60) + ", 200 " + (H - 5) + ", " + (W + 10) + " " + (H - 40) + " L " + (W + 10) + " " + (H + 10) + " L -10 " + (H + 10) + 'Z" class="map-water"/>');
    // park blocks
    for (var p = 0; p < 2; p++) {
      var px = 20 + r() * (W - 110), py = 14 + r() * (H - 80);
      if (Math.abs(px + 35 - cx) < 60 && Math.abs(py + 22 - cy) < 40) px = (px + 150) % (W - 90);
      s.push('<rect x="' + px.toFixed(0) + '" y="' + py.toFixed(0) + '" width="70" height="44" rx="8" class="map-park"/>');
    }
    // streets
    var tilt = (r() - 0.5) * 30;
    s.push('<g transform="rotate(' + tilt.toFixed(1) + " " + cx + " " + cy + ')">');
    [-70, -25, 30, 75].forEach(function (dy) { s.push('<path d="M-60 ' + (cy + dy + (r() - 0.5) * 10).toFixed(0) + "H" + (W + 60) + '" class="map-street"/>'); });
    [-110, -40, 50, 120].forEach(function (dx) { s.push('<path d="M' + (cx + dx + (r() - 0.5) * 16).toFixed(0) + " -60V" + (H + 60) + '" class="map-street"/>'); });
    s.push('<path d="M-60 ' + (cy + 8) + "H" + (W + 60) + '" class="map-main"/>');
    s.push("</g>");
    // landmarks
    (v.landmarks || []).forEach(function (lm) {
      var x = cx + lm.x * (W / 2 - 28), y = cy + lm.y * (H / 2 - 22);
      var anchor = lm.x > 0.35 ? "end" : lm.x < -0.35 ? "start" : "middle";
      s.push('<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="4.5" class="map-lm"/>');
      s.push('<text x="' + x.toFixed(0) + '" y="' + (y + (lm.y > 0.5 ? -9 : 15)).toFixed(0) + '" text-anchor="' + anchor + '" class="map-label">' + esc(t(lm.name)) + "</text>");
    });
    // venue pin
    s.push('<circle cx="' + cx + '" cy="' + cy + '" r="16" class="map-pulse"/>');
    s.push('<path d="M' + cx + " " + (cy + 2) + " C " + (cx - 12) + " " + (cy - 12) + ", " + (cx - 9) + " " + (cy - 26) + ", " + cx + " " + (cy - 26) +
      " C " + (cx + 9) + " " + (cy - 26) + ", " + (cx + 12) + " " + (cy - 12) + ", " + cx + " " + (cy + 2) + 'Z" class="map-pin"/>');
    s.push('<circle cx="' + cx + '" cy="' + (cy - 15) + '" r="4" class="map-pin-dot"/>');
    return '<svg class="minimap" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(t(v.name)) + '">' + s.join("") + "</svg>";
  }

  /* ---------- petals: one gentle shower on open, then still ---------- */
  function shower(colors, count) {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var cv = el("canvas", "petals"); document.body.appendChild(cv);
    var ctx = cv.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1), W, H, P = [], start = performance.now();
    function size() { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); addEventListener("resize", size);
    for (var i = 0; i < (count || 34); i++) {
      P.push({ x: Math.random() * W, y: -20 - Math.random() * H * 0.9, s: 5 + Math.random() * 6, v: 0.7 + Math.random() * 1.1,
        a: Math.random() * 6.28, sp: 0.01 + Math.random() * 0.02, c: colors[i % colors.length], rot: Math.random() * 6.28 });
    }
    (function frame(now) {
      var el2 = now - start; ctx.clearRect(0, 0, W, H); var alive = 0;
      P.forEach(function (p) {
        p.y += p.v; p.a += p.sp; p.x += Math.sin(p.a) * 0.6; p.rot += 0.02;
        if (p.y < H + 20) alive++;
        var fade = el2 > 5200 ? Math.max(0, 1 - (el2 - 5200) / 1200) : 1;
        ctx.save(); ctx.globalAlpha = 0.85 * fade; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c; ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, 6.28); ctx.fill(); ctx.restore();
      });
      if (alive && el2 < 6400) requestAnimationFrame(frame); else cv.remove();
    })(start);
  }

  /* ---------- render ---------- */
  function eventsForMode() {
    var cfg = state.cfg, m = cfg.modes && cfg.modes[state.mode];
    var ids = m ? m.events : cfg.events.map(function (e) { return e.id; });
    return cfg.events.filter(function (e) { return ids.indexOf(e.id) > -1; });
  }
  function block(mode) {
    var cfg = state.cfg, m = cfg.modes && cfg.modes[mode];
    return (m && m.message) ? m : cfg;
  }

  function render() {
    var cfg = state.cfg, root = document.getElementById("invite") || document.body.appendChild(el("main", "", ""));
    root.id = "invite";
    document.documentElement.lang = state.lang === "bn" ? "bn" : "en";
    document.title = t(cfg.pageTitle || cfg.title);
    var b = block(state.mode), evs = eventsForMode(), html = [];

    // top bar
    html.push('<header class="topbar"><a class="demo-tag" href="' + esc(cfg.homeUrl || "index.html") + '">' + (cfg.demo ? u("demo") + " · " : "") + "Nimontron</a>" +
      '<div class="lang" role="group" aria-label="' + u("lang") + '">' +
      '<button type="button" data-lang="bn" aria-pressed="' + (state.lang === "bn") + '">বাংলা</button>' +
      '<button type="button" data-lang="en" aria-pressed="' + (state.lang === "en") + '">English</button></div></header>');

    // hero
    var first = evs[0] || cfg.events[0];
    var days = Math.ceil((new Date(first.date + "T" + first.time + ":00+05:30") - new Date()) / 864e5);
    html.push('<section class="hero">' + ornament(cfg.ornament) +
      (cfg.invocation ? '<p class="invocation">' + esc(t(cfg.invocation)) + "</p>" : "") +
      '<p class="eyebrow">' + esc(t(b.eyebrow || cfg.eyebrow)) + "</p>" +
      '<h1 class="names">' + cfg.names.map(function (n) { return '<span>' + esc(t(n)) + "</span>"; }).join('<span class="amp">' + esc(t(cfg.joiner || { bn: "ও", en: "&" })) + "</span>") + "</h1>" +
      '<p class="hero-date">' + esc(fmtDate(first.date)) + (first.bengaliDate ? '<span class="bdate">' + esc(t(first.bengaliDate)) + "</span>" : "") + "</p>" +
      (days >= 0 ? '<p class="countdown">' + (days === 0 ? u("today") : "<b>" + num(days) + "</b> " + u("days")) + "</p>" : "") +
      "</section>");

    // guest-link switcher (demo of separate invites per side)
    if (cfg.modes) {
      html.push('<nav class="modes" aria-label="' + u("viewing") + '"><span class="modes-label">' + u("viewing") + "</span><div>" +
        Object.keys(cfg.modes).map(function (k) {
          return '<a href="#' + k + '" aria-current="' + (state.mode === k) + '">' + esc(t(cfg.modes[k].label)) + "</a>";
        }).join("") + "</div></nav>");
    }

    // message
    html.push('<section class="message">' + divider() + '<p class="msg">' + esc(t(b.message)) + "</p>" +
      (b.hosts ? '<p class="hosts"><span>' + u("invitedBy") + "</span>" + esc(t(b.hosts)) + "</p>" : "") + "</section>");

    // events
    html.push('<section class="events" id="events"><h2>' + u("events") + "</h2>");
    evs.forEach(function (ev) {
      html.push('<article class="event">' +
        '<header><h3>' + esc(t(ev.name)) + "</h3>" + (ev.note ? '<p class="ev-note">' + esc(t(ev.note)) + "</p>" : "") + "</header>" +
        '<dl><div><dt>' + u("time") + "</dt><dd>" + esc(fmtDate(ev.date)) + "<br>" + esc(fmtTime(ev.time)) +
        (ev.bengaliDate ? ' <span class="bdate-inline">· ' + esc(t(ev.bengaliDate)) + "</span>" : "") + "</dd></div>" +
        "<div><dt>" + u("venue") + "</dt><dd><b>" + esc(t(ev.venue.name)) + "</b><br>" + esc(t(ev.venue.address)) + "</dd></div></dl>" +
        '<a class="map-wrap" href="' + mapLink(ev.venue) + '" target="_blank" rel="noopener">' + miniMap(ev.venue, ev.id) +
        '<span class="map-btn">' + u("openMap") + ' <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3h8v8M13 3 4 12"/></svg></span></a>' +
        '<a class="cal-btn" href="' + calLink(ev) + '" target="_blank" rel="noopener">' + u("addCal") + "</a>" +
        "</article>");
    });
    html.push("</section>");

    // menu (aiburobhat, annaprashan, reception)
    if (cfg.menu) {
      html.push('<section class="menu">' + divider() + "<h2>" + u("menu") + "</h2><ul>" +
        cfg.menu.map(function (i) { return "<li>" + esc(t(i)) + "</li>"; }).join("") + "</ul></section>");
    }
    // notes
    if (cfg.notes) {
      html.push('<section class="notes"><h2>' + u("details") + '</h2><div class="note-grid">' +
        cfg.notes.map(function (n) { return '<div class="note"><h3>' + esc(t(n.title)) + "</h3><p>" + esc(t(n.text)) + "</p></div>"; }).join("") + "</div></section>");
    }
    // the little ones' line, a Bengali card tradition
    if (b.kids || cfg.kids) html.push('<section class="kids"><p>' + esc(t(b.kids || cfg.kids)) + "</p></section>");

    // RSVP
    html.push('<section class="rsvp" id="rsvp"><h2>' + u("rsvp") + "</h2><p class='sub'>" + u("rsvpSub") + "</p>" +
      '<form id="rsvp-form" novalidate>' +
      '<label for="r-name">' + u("name") + '</label><input id="r-name" name="name" autocomplete="name" required>' +
      '<label for="r-phone">' + u("phone") + '</label><input id="r-phone" name="phone" inputmode="tel" autocomplete="tel">' +
      '<fieldset class="attend"><legend class="sr">' + u("rsvp") + "</legend>" +
      '<label class="chip"><input type="radio" name="att" value="yes" id="r-yes" checked><span>' + u("attending") + "</span></label>" +
      '<label class="chip"><input type="radio" name="att" value="no" id="r-no"><span>' + u("notAttending") + "</span></label></fieldset>" +
      '<div class="if-yes"><label for="r-guests">' + u("guests") + '</label><div class="stepper"><button type="button" data-step="-1" aria-label="−">−</button>' +
      '<output id="r-guests" data-v="2">' + num(2) + '</output><button type="button" data-step="1" aria-label="+">+</button></div>' +
      (evs.length > 1 ? '<fieldset class="which"><legend>' + u("which") + "</legend>" + evs.map(function (ev, i) {
        return '<label class="check"><input type="checkbox" id="r-ev-' + ev.id + '" value="' + ev.id + '" checked><span>' + esc(t(ev.name)) + "</span></label>";
      }).join("") + "</fieldset>" : "") + "</div>" +
      '<label for="r-note">' + u("note") + '</label><textarea id="r-note" rows="2"></textarea>' +
      '<p class="form-err" id="r-err" role="alert"></p>' +
      '<button class="send" type="submit" id="r-send">' + u("send") + "</button></form>" +
      '<div class="thanks" id="r-thanks" hidden>' + ornament({ size: 120, rings: [{ n: 10, r: 14, len: 20, w: 9 }, { n: 20, r: 38, len: 14, w: 6, dot: true }] }) +
      "<h3>" + u("thanks") + "</h3><p>" + u("thanksSub") + "</p>" + (cfg.demo ? '<p class="demo-note">' + u("demoNote") + "</p>" : "") + "</div></section>");

    // footer
    html.push('<footer class="foot">' + divider() + (b.hosts ? "<p>" + esc(t(b.hosts)) + "</p>" : "") +
      '<p class="made"><a href="' + esc(cfg.homeUrl || "index.html") + '">' + u("madeWith") + "</a> · " + u("ownEvent") + "</p></footer>");

    root.innerHTML = html.join("");
    wire(root);
  }

  function wire(root) {
    var home = root.querySelector(".demo-tag");
    if (home && document.referrer && history.length > 1) home.addEventListener("click", function (e) { e.preventDefault(); history.back(); });
    root.querySelectorAll("[data-lang]").forEach(function (bt) {
      bt.addEventListener("click", function () {
        var y = scrollY; state.lang = bt.getAttribute("data-lang"); render(); scrollTo(0, y);
      });
    });
    var form = root.querySelector("#rsvp-form"), out = root.querySelector("#r-guests");
    root.querySelectorAll("[data-step]").forEach(function (bt) {
      bt.addEventListener("click", function () {
        var v = Math.max(1, Math.min(20, +out.getAttribute("data-v") + +bt.getAttribute("data-step")));
        out.setAttribute("data-v", v); out.textContent = num(v);
      });
    });
    root.querySelectorAll("input[name=att]").forEach(function (r) {
      r.addEventListener("change", function () { root.querySelector(".if-yes").hidden = root.querySelector("#r-no").checked; });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = root.querySelector("#r-err"), name = root.querySelector("#r-name").value.trim();
      var picked = [].slice.call(root.querySelectorAll(".which input:checked"));
      if (!name) { err.textContent = u("required"); root.querySelector("#r-name").focus(); return; }
      if (root.querySelector("#r-yes").checked && root.querySelector(".which") && !picked.length) { err.textContent = u("pickOne"); return; }
      err.textContent = "";
      var payload = { name: name, phone: root.querySelector("#r-phone").value, attending: root.querySelector("#r-yes").checked,
        guests: +out.getAttribute("data-v"), events: picked.map(function (p) { return p.value; }), note: root.querySelector("#r-note").value, mode: state.mode };
      if (typeof window.NIMONTRON_RSVP === "function") { try { window.NIMONTRON_RSVP(payload, state.cfg); } catch (x) {} }
      form.hidden = true; root.querySelector("#r-thanks").hidden = false;
      root.querySelector("#r-thanks").scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function readMode() {
    var h = location.hash.replace("#", "");
    if (state.cfg.modes && state.cfg.modes[h]) state.mode = h;
    else if (state.cfg.modes) state.mode = state.cfg.defaultMode || Object.keys(state.cfg.modes)[0];
  }

  function boot(cfg) {
    state.cfg = cfg; state.lang = cfg.lang || "bn";
    document.documentElement.setAttribute("data-theme-name", cfg.theme || "traditional");
    readMode(); render();
    addEventListener("hashchange", function () {
      if (state.cfg.modes && state.cfg.modes[location.hash.slice(1)]) { readMode(); render(); }
    });
    if (cfg.petals !== false) setTimeout(function () { shower(cfg.petalColors || ["#E8A33D", "#F2C14E", "#C2412D"], cfg.petalCount); }, 350);
  }

  var inline = document.getElementById("invite-config");
  if (inline) boot(JSON.parse(inline.textContent));
  else if (configUrl) fetch(configUrl).then(function (r) { return r.json(); }).then(boot).catch(function () {
    document.body.innerHTML = "<p style='padding:24px'>Could not load this invitation. Please refresh.</p>";
  });
})();
