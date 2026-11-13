/* Nimontron visitor counter (private). Cloudflare Web Analytics, no cookies.
   Only the Cloudflare account owner can see the numbers. Nothing is shown on the site.
   Put the site token from the Cloudflare dashboard between the quotes below. */
(function () {
  var TOKEN = "PASTE_CLOUDFLARE_TOKEN_HERE";
  if (!TOKEN || TOKEN.indexOf("PASTE_") === 0) return;
  var s = document.createElement("script");
  s.type = "module";
  s.src = "https://static.cloudflareinsights.com/beacon.min.js";
  s.setAttribute("data-cf-beacon", JSON.stringify({ token: TOKEN }));
  document.body.appendChild(s);
})();
