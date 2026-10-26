/**
 * Local LoopO-style forms demo widget, v2.4.
 * No requests are sent to any remote server. Test submissions are stored in localStorage.
 * To use in production, replace the submit handler with a secure backend/API endpoint.
 * <script async src="/forms/v2.js" data-workspace="..." data-form="..."></script>
 */
(() => {
  "use strict";
  const script = document.currentScript;
  if (!script || script.dataset.installed === "1") return;
  script.dataset.installed = "1";
  const workspace = script.getAttribute("data-workspace") || "harborandco";
  const formId = script.getAttribute("data-form") || "homepage-popup";
  const targetSelector = script.getAttribute("data-target");
  const title = script.getAttribute("data-title") || "A little something for your inbox.";
  const subtitle = script.getAttribute("data-subtitle") || "Fresh ideas, special offers, and good things from Harbor & Co.";
  const storageKey = "loopo-demo-leads";
  const stamp = { hostname: location.host || "local-preview", path:location.pathname, lastSeen:Date.now(), workspace, formId };
  try { localStorage.setItem("loopo-demo-detected", JSON.stringify(stamp)); } catch { /* private mode */ }
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel("loopo-demo-detection");channel.postMessage(stamp);channel.close();
  }
  const style = document.createElement("style");
  style.textContent = `
    .loopo-overlay{position:fixed;inset:0;z-index:99990;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(17,17,17,.36);backdrop-filter:blur(4px);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#202020;animation:loopo-fade .24s ease both}
    .loopo-card{background:white;width:min(460px,100%);padding:38px;border-radius:24px;box-shadow:0 30px 100px rgba(0,0,0,.19);position:relative;text-align:left;animation:loopo-in .35s ease both}
    .loopo-overlay .loopo-dismiss{border:1px solid #e4e4e4;background:white;border-radius:11px;color:#888;font-size:23px;width:36px;height:36px;position:absolute;right:19px;top:19px;cursor:pointer}
    .loopo-logo{display:grid;place-items:center;width:46px;height:46px;border-radius:14px;color:#ed917e;background:#ffe8e3;font-size:20px;font-weight:700}
    .loopo-card h2{font-size:27px;line-height:1.2;font-weight:650;letter-spacing:-.8px;margin:21px 0 11px}.loopo-card p{font-size:16px;line-height:1.5;color:#777;margin:0 0 23px}.loopo-card form{display:flex;gap:9px;flex-wrap:wrap}.loopo-card input{flex:1 1 175px;min-width:0;padding:13px 14px;border:1px solid #dcdcdc;border-radius:11px;background:white;color:#222;font:inherit;font-size:15px}.loopo-card button[type=submit]{border:0;background:#262626;color:white;border-radius:11px;padding:13px 17px;font:inherit;font-size:15px;cursor:pointer}.loopo-card .loopo-fine{display:block;color:#aaa;font-size:12px;margin-top:14px;line-height:1.5}.loopo-card .loopo-message{padding:16px;background:#e8f9f0;color:#17804e;border-radius:12px;font-size:16px}
    .loopo-inline .loopo-card{width:100%;box-shadow:none;border:1px solid #eee;padding:34px}.loopo-inline .loopo-dismiss{display:none}
    @keyframes loopo-fade{from{opacity:0}to{opacity:1}}@keyframes loopo-in{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
    @media(max-width:500px){.loopo-card{padding:27px}.loopo-card h2{font-size:24px}}
    @media(prefers-reduced-motion:reduce){.loopo-overlay,.loopo-card{animation:none}}
  `;
  document.head.appendChild(style);
  const escape = s => String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function render() {
    const card = document.createElement("div");
    card.className = "loopo-card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-label", "Email sign-up form");
    card.innerHTML = `<button type="button" class="loopo-dismiss" aria-label="Close popup">×</button><div class="loopo-logo">✳</div><h2>${escape(title)}</h2><p>${escape(subtitle)}</p><form><input aria-label="Email address" name="email" type="email" placeholder="Your email address" autocomplete="email" required maxlength="254"/><button type="submit">Subscribe →</button></form><small class="loopo-fine">No spam. Unsubscribe whenever you'd like.</small>`;
    card.querySelector("form").addEventListener("submit", event => {
      event.preventDefault();
      const email = card.querySelector('input[name="email"]').value.trim();
      if (!email || !card.querySelector('input[name="email"]').checkValidity()) return;
      let leads=[];try{leads=JSON.parse(localStorage.getItem(storageKey)||"[]")}catch{ /* private mode */ }
      leads.push({ email, workspace, formId, capturedAt:new Date().toISOString(), source:location.href });
      try{localStorage.setItem(storageKey, JSON.stringify(leads))}catch{ /* storage unavailable */ }
      card.querySelector("form").replaceWith(Object.assign(document.createElement("div"),{className:"loopo-message",textContent:"You're subscribed! Thanks for joining."}));
      card.querySelector(".loopo-fine").textContent = "Demo only: your email was saved in this browser, not sent to a server.";
      window.dispatchEvent(new CustomEvent("loopo:submit",{detail:{email,workspace,formId}}));
    });
    return card;
  }
  function start() {
    let host;
    if (targetSelector) {
      try { host = document.querySelector(targetSelector); } catch { /* invalid selector */ }
      if (!host) { console.warn("[forms/v2] Missing target:",targetSelector);return; }
      host.classList.add("loopo-inline");
      host.appendChild(render());
    } else {
      const key = "loopo-popup-seen:" + workspace + ":" + formId;
      if (sessionStorage.getItem(key) === "1" && script.dataset.force !== "true") return;
      sessionStorage.setItem(key,"1");
      host = document.createElement("div");host.className="loopo-overlay";
      host.appendChild(render());document.body.appendChild(host);
      const dismiss=()=>{host.remove();document.removeEventListener("keydown",onEsc)};
      const onEsc=e=>{if(e.key==="Escape")dismiss()};
      host.querySelector(".loopo-dismiss").addEventListener("click",dismiss);
      host.addEventListener("click", e=>{if(e.target===host)dismiss()});
      document.addEventListener("keydown",onEsc);
      host.querySelector("input").focus();
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(start, targetSelector ? 0 : 900), {once:true});
  else setTimeout(start,targetSelector ? 0 : 900);
})();
