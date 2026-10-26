(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const defaultConfig = {domain: "harborandco.com", workspace: "harborandco", form: "homepage-popup", developerEmail: ""};
  let config = { ...defaultConfig, ...loadJson("loopo-demo-config", {}) };
  let tab = ["popup", "inline", "share"].includes(new URLSearchParams(location.search).get("tab")) ? new URLSearchParams(location.search).get("tab") : "popup";
  let toastTimer;
  let copyTimer;
  let isExampleStatus = true;
  const codeBase = new URL("./forms/v2.js", location.href).href;
  const shareBase = new URL("./share.html", location.href);
  const emailText = {shopify:"Shopify",wordpress:"WordPress",webflow:"Webflow"};

  const guideSteps = {
    shopify: [
      "In Shopify admin, open Online Store → Themes.",
      "On your published theme choose the more-actions menu → Edit code.",
      "Open layout/theme.liquid and paste the pop-up script immediately before </body>.",
      "Save, open your storefront in another tab, and refresh to verify the widget."
    ],
    wordpress: [
      "Use a trusted code-snippet or header/footer injection plugin, or your child theme.",
      "Choose the footer/body-end location and paste the pop-up script.",
      "Enable it for the pages where the pop-up should appear.",
      "Save and visit the public website to confirm it loads."
    ],
    webflow: [
      "Open your Webflow project settings and locate the Custom Code section.",
      "Paste the pop-up script into the Footer Code field.",
      "Save your changes and publish the site.",
      "Open the published URL and verify that the widget appears."
    ]
  };

  function loadJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function attr(s) {return escapeHtml(s);}
  function makeShareUrl() {
    const url = new URL(shareBase.href);
    url.searchParams.set("workspace", config.workspace);
    url.searchParams.set("form", config.form);
    return url.href;
  }
  function generateCode(mode = tab) {
    if (mode === "popup") {
      return `<!-- Harbor & Co. · signup forms -->\n<script async\n  src="${codeBase}"\n  data-workspace="${config.workspace}"\n  data-form="${config.form}">\n</script>`;
    }
    if (mode === "inline") {
      return `<!-- Embed this form anywhere on your page -->\n<div id="loopo-inline-form"></div>\n<script async\n  src="${codeBase}"\n  data-workspace="${config.workspace}"\n  data-form="${config.form}"\n  data-target="#loopo-inline-form"></script>`;
    }
    return makeShareUrl();
  }
  function codeMarkup(mode) {
    const url = `<span class="code-string">"${attr(codeBase)}"</span>`;
    const workspace = `<span class="code-string">"${attr(config.workspace)}"</span>`;
    const form = `<span class="code-string">"${attr(config.form)}"</span>`;
    if (mode === "popup") {
      return `<pre><span class="code-comment">&lt;!-- Harbor &amp; Co. · signup forms --&gt;</span>\n<span class="code-tag">&lt;script</span> <span class="code-key">async</span>\n  <span class="code-key">src=</span>${url}\n  <span class="code-key">data-workspace=</span>${workspace}\n  <span class="code-key">data-form=</span>${form}<span class="code-tag">&gt;</span>\n<span class="code-tag">&lt;/script&gt;</span></pre>`;
    }
    return `<pre><span class="code-comment">&lt;!-- Embed this form anywhere on your page --&gt;</span>\n<span class="code-tag">&lt;div</span> <span class="code-key">id=</span><span class="code-string">"loopo-inline-form"</span><span class="code-tag">&gt;&lt;/div&gt;</span>\n<span class="code-tag">&lt;script</span> <span class="code-key">async</span>\n  <span class="code-key">src=</span>${url}\n  <span class="code-key">data-workspace=</span>${workspace}\n  <span class="code-key">data-form=</span>${form}\n  <span class="code-key">data-target=</span><span class="code-string">"#loopo-inline-form"</span><span class="code-tag">&gt;&lt;/script&gt;</span></pre>`;
  }
  function render() {
    $("#header-domain").textContent = config.domain;
    $$(".tab").forEach(el => {
      const active = el.dataset.tab === tab;
      el.classList.toggle("active", active);
      el.setAttribute("aria-selected", String(active));
      el.tabIndex = active ? 0 : -1;
    });
    $("#tab-panel").setAttribute("aria-labelledby", "tab-" + tab);
    const copy = $("#copy-code");
    copy.classList.toggle("copied", tab === "popup" && !copy.dataset.used);
    $("#copy-label").textContent = tab === "popup" && !copy.dataset.used ? "Copied" : tab === "share" ? "Copy link" : "Copy code";
    $("#code-caption").innerHTML = tab === "popup" ? 'HTML <span class="dot">·</span> 6 lines' : tab === "inline" ? 'HTML <span class="dot">·</span> 7 lines' : 'SHAREABLE LINK';
    $("#code-card").classList.toggle("share-mode", tab === "share");
    if (tab === "share") {
      $("#code-body").innerHTML = `
        <div class="share-card"><div class="share-top"><div class="share-mark">↗</div><div><h3 class="share-heading">Homepage pop-up</h3><p class="share-subtitle">A public link to your sign-up form</p></div></div>
        <div class="share-url"><a href="${attr(makeShareUrl())}" target="_blank" rel="noopener" id="share-url">${escapeHtml(makeShareUrl())}</a><button id="open-share" type="button">Open ↗</button></div></div>`;
    } else {
      $("#code-body").innerHTML = codeMarkup(tab);
    }
    $("#installation-hint").innerHTML = tab === "popup"
      ? 'Paste just before <code>&lt;/body&gt;</code> on every page, or once in your theme’s footer template.'
      : tab === "inline"
      ? 'Place the snippet where you want your form to appear. You can embed it in any page section.'
      : 'Copy the link to share this form directly — no installation or code changes required.';
    $("#guides-section").hidden = tab === "share";
    $("#detection-banner").hidden = tab === "share";
    if (tab === "share") $("#open-share")?.addEventListener("click", () => window.open(makeShareUrl(), "_blank", "noopener"));
    updateDetection();
  }
  async function copyToClipboard(text) {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      try {await navigator.clipboard.writeText(text); return true;} catch { /* fallback */ }
    }
    const temp = document.createElement("textarea");
    temp.value = text;temp.setAttribute("readonly", "");temp.style.cssText="position:fixed;top:-9999px;left:-9999px";
    document.body.appendChild(temp);temp.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { /* rejected */ }
    temp.remove();return ok;
  }
  function toast(message) {
    const node = $("#toast");
    node.textContent = message;node.classList.add("show");
    clearTimeout(toastTimer);toastTimer = setTimeout(() => node.classList.remove("show"), 2600);
  }
  async function copyCurrent() {
    const ok = await copyToClipboard(generateCode());
    if (!ok) {toast("Clipboard access was blocked. Select and copy the code manually.");return;}
    const button = $("#copy-code");button.classList.add("copied");button.dataset.used = "1";
    $("#copy-label").textContent = "Copied";
    toast(tab === "share" ? "Share link copied" : "Installation code copied");
    clearTimeout(copyTimer);copyTimer = setTimeout(() => {
      button.classList.remove("copied");$("#copy-label").textContent = tab === "share" ? "Copy link" : "Copy code";
    }, 2500);
  }
  function setTab(next) {
    tab = next;
    $("#copy-code").dataset.used = "";
    render();
  }
  function closeDialog() {
    $("#dialog-layer").classList.add("is-hidden");
    $("#reopen-panel").hidden = false;
    $("#reopen-button").focus();
  }
  function openDialog() {
    $("#dialog-layer").classList.remove("is-hidden");
    $("#reopen-panel").hidden = true;
    $("#close-dialog").focus();
  }
  function updateDetection() {
    const status = loadJson("loopo-demo-detected", null);
    const banner = $("#detection-banner");
    if (status?.lastSeen) {
      isExampleStatus = false;
      const relative = Math.round((Date.now() - status.lastSeen) / 60000);
      const when = relative < 1 ? "just now" : `${relative} min ago`;
      $("#detection-title").textContent = `Detected on ${status.hostname || "your demo site"}`;
      $("#detection-description").textContent = `Last seen ${when} on ${status.path || "/"} · local demo script v2.4`;
      banner.classList.remove("pending");
    } else if (isExampleStatus) {
      // This is reference content from the supplied screenshot, not a live remote verification.
      $("#detection-title").textContent = `Detected on ${config.domain}`;
      $("#detection-description").textContent = "Last seen 2 min ago on /collections/kitchen · script v2.4 (sample)";
      banner.classList.remove("pending");
    }
  }
  function showGuide(type) {
    $("#guide-title").textContent = "Install on " + emailText[type];
    $("#guide-intro").textContent = "Follow these steps to install the pop-up on your site. You can always come back and copy the code again.";
    $("#guide-steps").replaceChildren(...guideSteps[type].map(step => {const item=document.createElement("li");item.textContent=step;return item;}));
    $("#guide-dialog").showModal();
  }
  function openSettings() {
    const form = $("#settings-form");
    for (const [key, value] of Object.entries(config)) form.elements.namedItem(key).value = value;
    $("#settings-dialog").showModal();
  }
  function emailDeveloper() {
    const address = config.developerEmail || "";
    const subject = encodeURIComponent(`Please install our ${config.form} form`);
    const message = encodeURIComponent(`Hi,\n\nCould you install our form on ${config.domain}?\n\nAdd the following code just before the closing </body> tag:\n\n${generateCode("popup")}\n\nThanks!`);
    window.location.href = `mailto:${address}?subject=${subject}&body=${message}`;
  }
  $$(".tab").forEach(button => {
    button.addEventListener("click", () => setTab(button.dataset.tab));
    button.addEventListener("keydown", e => {
      const items = $$(".tab");const i = items.indexOf(button);
      const j = e.key === "ArrowRight" ? (i+1)%items.length : e.key === "ArrowLeft" ? (i-1+items.length)%items.length : null;
      if (j !== null) {e.preventDefault();setTab(items[j].dataset.tab);items[j].focus();}
    });
  });
  $("#copy-code").addEventListener("click", copyCurrent);
  $("#done-button").addEventListener("click", closeDialog);
  $("#close-dialog").addEventListener("click", closeDialog);
  $("#reopen-button").addEventListener("click", openDialog);
  $("#email-button").addEventListener("click", emailDeveloper);
  $$("[data-guide]").forEach(button => button.addEventListener("click",()=>showGuide(button.dataset.guide)));
  $$("[data-close-guide]").forEach(button => button.addEventListener("click",()=>$("#guide-dialog").close()));
  $$("[data-close-settings]").forEach(button => button.addEventListener("click",()=>$("#settings-dialog").close()));
  $("#guide-copy").addEventListener("click", async () => {const ok=await copyToClipboard(generateCode("popup"));toast(ok?"Code copied":"Clipboard was blocked");});
  $("#open-settings").addEventListener("click", openSettings);
  $("#footer-settings").addEventListener("click", openSettings);
  $("#settings-form").addEventListener("submit", e => {
    e.preventDefault();
    if (!e.currentTarget.reportValidity()) return;
    const data = new FormData(e.currentTarget);
    config = Object.fromEntries(data.entries());
    localStorage.setItem("loopo-demo-config",JSON.stringify(config));
    $("#settings-dialog").close();
    render();toast("Installation settings saved");
  });
  document.addEventListener("keydown", e => {
    if(e.key === "Escape" && !$("#dialog-layer").classList.contains("is-hidden") && !$("#guide-dialog").open && !$("#settings-dialog").open) closeDialog();
    if(e.altKey && e.key.toLowerCase() === "s") {e.preventDefault();openSettings();}
  });
  window.addEventListener("storage", e => { if (e.key === "loopo-demo-detected") updateDetection(); });
  setInterval(updateDetection, 20000);
  render();
})();
