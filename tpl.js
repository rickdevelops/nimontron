/* Shared behaviour for the bespoke Nimontron templates: language switch, countdown, reveal, tilt, depth, RSVP demo. */
(function () {
  var D = document, H = D.documentElement, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  H.classList.add("js");
  var BN = "০১২৩৪৫৬৭৮৯";
  function num(n) { return H.lang === "bn" ? String(n).replace(/\d/g, function (d) { return BN[d]; }) : String(n); }

  /* language */
  var key = "nimontron-invite-lang";
  function setLang(l) {
    H.lang = l === "en" ? "en" : "bn";
    D.querySelectorAll("[data-setlang]").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-setlang") === H.lang); });
    var t = D.querySelector("meta[name='title-" + H.lang + "']"); if (t) D.title = t.content;
    D.querySelectorAll("[data-ph-bn]").forEach(function (i) { i.placeholder = i.getAttribute("data-ph-" + H.lang) || ""; });
    count(); guests();
  }
  var start = H.getAttribute("data-default-lang") || "bn";
  try { var s = localStorage.getItem(key); if (s === "bn" || s === "en") start = s; } catch (e) {}
  try { var q = new URLSearchParams(location.search).get("lang"); if (q === "bn" || q === "en") start = q; } catch (e) {}
  D.querySelectorAll("[data-setlang]").forEach(function (b) {
    b.addEventListener("click", function () { var y = scrollY; setLang(b.getAttribute("data-setlang")); try { localStorage.setItem(key, H.lang); } catch (e) {} scrollTo(0, y); });
  });

  /* countdown */
  function count() {
    D.querySelectorAll("[data-count-to]").forEach(function (e) {
      var d = Math.ceil((new Date(e.getAttribute("data-count-to")) - new Date()) / 864e5);
      e.textContent = num(Math.max(0, d));
    });
  }

  /* RSVP demo */
  var g = 2;
  function guests() { var o = D.getElementById("g-out"); if (o) o.textContent = num(g); }
  D.querySelectorAll("[data-g]").forEach(function (b) { b.addEventListener("click", function () { g = Math.max(1, Math.min(20, g + +b.getAttribute("data-g"))); guests(); }); });
  var f = D.getElementById("rsvp-form");
  if (f) {
    f.querySelectorAll("input[name=att]").forEach(function (r) { r.addEventListener("change", function () { var w = D.getElementById("if-yes"); if (w) w.hidden = f.querySelector("input[name=att]:checked").value === "no"; }); });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var n = D.getElementById("r-name"), err = D.getElementById("r-err");
      if (!n.value.trim()) { err.textContent = H.lang === "bn" ? "নামটা লিখে দিন" : "Please add your name"; n.focus(); return; }
      err.textContent = "";
      if (typeof window.NIMONTRON_RSVP === "function") { try { window.NIMONTRON_RSVP({ name: n.value.trim(), guests: g, attending: f.querySelector("input[name=att]:checked").value === "yes" }); } catch (x) {} }
      f.hidden = true; var th = D.getElementById("r-thanks"); th.hidden = false; th.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    });
  }

  /* reveal */
  var rv = D.querySelectorAll(".rv");
  if (!("IntersectionObserver" in window) || reduce) rv.forEach(function (e) { e.classList.add("in"); });
  else { var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }); }, { threshold: .15 }); rv.forEach(function (e) { io.observe(e); }); }

  /* tilt (mouse) */
  if (fine && !reduce) D.querySelectorAll("[data-tilt]").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.setProperty("--rx", (-y * 10).toFixed(2) + "deg"); el.style.setProperty("--ry", (x * 12).toFixed(2) + "deg");
    });
    el.addEventListener("pointerleave", function () { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
  });

  /* depth: pointer / phone tilt + scroll parallax on [data-depth] */
  var px = 0, py = 0, tick = false, layers = D.querySelectorAll("[data-depth]");
  function apply() {
    tick = false; var sy = scrollY;
    layers.forEach(function (l) {
      var d = +l.getAttribute("data-depth");
      l.style.transform = "translate3d(" + (px * d * 18).toFixed(1) + "px," + (py * d * 14 - sy * d * .12).toFixed(1) + "px,0)";
    });
    D.body.style.setProperty("--sp", Math.min(1, sy / (innerHeight || 800)).toFixed(3));
  }
  function q2() { if (!tick) { tick = true; requestAnimationFrame(apply); } }
  if (!reduce) {
    addEventListener("scroll", q2, { passive: true });
    if (fine) addEventListener("pointermove", function (e) { px = e.clientX / innerWidth - .5; py = e.clientY / innerHeight - .5; q2(); }, { passive: true });
    else addEventListener("deviceorientation", function (e) { if (e.gamma == null) return; px = Math.max(-.5, Math.min(.5, e.gamma / 60)); py = Math.max(-.5, Math.min(.5, (e.beta - 45) / 60)); q2(); }, { passive: true });
    apply();
  }

  setLang(start);
  requestAnimationFrame(function () { H.classList.add("ready"); });
})();
