(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const SCREENS = ["campaign", "subscribers", "import", "offer"];
  const FIELDS = ["Don't import", "Email", "First name", "Last name", "Signup date", "Subscription plan", "Tags"];
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const money = (n) => "$" + Number(n).toFixed(2);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const localRead = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const localWrite = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { toast("Browser storage is unavailable"); return false; } };
  const leadsKey = "newsletter-recreation-subscribers";
  let activeScreen = "campaign", activeEntry = "single", toastTimeout, campaignStep = 1, importStep = 2;
  let campaignState = { name:"", format:"Newsletter issue", publication:"The Creator Brief", audience:"All subscribers", subject:"", preheader:"", body:"", schedule:"Now" };
  let subscriberTags = ["Creator Brief"];
  let imported = null;
  const campaignForm = $("#campaign-form");
  const campaignInitialMarkup = campaignForm.innerHTML;

  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("visible");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => el.classList.remove("visible"), 3200);
  }

  function error(id, message) {
    const el = $(id);
    el.textContent = message || "";
    el.hidden = !message;
    if (message) el.scrollIntoView({behavior:"smooth", block:"nearest"});
  }

  function navigate(screen) {
    if (!SCREENS.includes(screen)) return;
    activeScreen = screen;
    $$(".modal-panel").forEach(el => {el.hidden = el.dataset.panel !== screen;});
    $$(".gallery-tab").forEach(el => {
      const selected = el.dataset.open === screen;
      el.classList.toggle("is-active", selected);
      if (selected) el.setAttribute("aria-current","page"); else el.removeAttribute("aria-current");
    });
    $(".modal-frame").hidden = false;
    $("#closed-panel").hidden = true;
    const url = new URL(location.href);
    url.searchParams.set("screen", screen);
    history.replaceState(null, "", url);
  }

  function closePanel() {
    $(".modal-frame").hidden = true;
    $("#closed-panel").hidden = false;
    $$(".gallery-tab").forEach(el => {el.classList.remove("is-active");el.removeAttribute("aria-current");});
  }

  function updateFormatCards() {
    $$(".option-card").forEach(el => el.classList.toggle("selected", !!$("input",el).checked));
  }

  function campaignStepMarkup(step) {
    if (step === 2) return '<div class="field-block"><label class="field-title" for="campaign-segment">Choose your audience</label><select class="select-input" id="campaign-segment"><option>All subscribers</option><option>Paid subscribers</option><option>Free subscribers</option></select><p class="field-note below">This is a local draft. No emails will be sent.</p></div><div class="field-block"><label class="field-title" for="campaign-schedule">When should it go out?</label><select class="select-input" id="campaign-schedule"><option>Now</option><option>Save as draft</option></select></div>';
    if (step === 3) return '<div class="field-block"><label class="field-title" for="campaign-subject">Email subject <span class="req">*</span></label><input class="text-input" id="campaign-subject" maxlength="150" placeholder="A fresh issue of The Creator Brief" required></div><div class="field-block"><label class="field-title" for="campaign-preheader">Preview text</label><input class="text-input" id="campaign-preheader" maxlength="160" placeholder="A few fresh ideas for your week"></div><div class="field-block"><label class="field-title" for="campaign-body">Newsletter content</label><textarea class="text-input multi-input" id="campaign-body" placeholder="Write your newsletter draft here..."></textarea></div>';
    return '<h2 class="subheading">Review your campaign</h2><div class="review-detail"><strong>' + esc(campaignState.name) + '</strong><br>Format: ' + esc(campaignState.format) + '<br>Publication: ' + esc(campaignState.publication) + '<br>Audience: ' + esc(campaignState.audience) + '<br>Schedule: ' + esc(campaignState.schedule) + '<br>Subject: ' + esc(campaignState.subject) + '<br>Body: ' + (campaignState.body ? esc(campaignState.body.slice(0,100)) : 'Empty draft') + '</div><p class="field-note below">Nothing is sent. The draft is saved to this browser.</p>';
  }

  function renderCampaignStep() {
    const names = ["Continue →", "Continue to content →", "Review campaign →", "Save draft ✓"];
    if (campaignStep === 1) {
      campaignForm.innerHTML = campaignInitialMarkup;
      $("#campaign-name").value = campaignState.name;
      $("#campaign-publication").value = campaignState.publication;
      $("#campaign-audience").value = campaignState.audience;
      const radio = $("input[name='format'][value='" + campaignState.format + "']");
      if (radio) radio.checked = true;
      updateFormatCards();
    } else {
      campaignForm.innerHTML = campaignStepMarkup(campaignStep) + '<p class="form-error" id="campaign-error" role="alert" hidden></p>';
      if (campaignStep === 2) { $("#campaign-segment").value = campaignState.audience; $("#campaign-schedule").value = campaignState.schedule; }
      if (campaignStep === 3) { $("#campaign-subject").value = campaignState.subject; $("#campaign-preheader").value = campaignState.preheader; $("#campaign-body").value = campaignState.body; }
    }
    $$(".four-steps .step").forEach((el,i) => {
      el.classList.toggle("current", i+1 === campaignStep);
      el.classList.toggle("complete", i+1 < campaignStep);
      $("b",el).textContent = i+1 < campaignStep ? "✓" : String(i+1);
    });
    $("#campaign-back").hidden = campaignStep === 1;
    $("#campaign-next").textContent = names[campaignStep-1];
    $("#campaign-footnote").textContent = "Step " + campaignStep + " of 4 · " + (campaignStep === 4 ? "Ready to save" : "No emails sent");
  }

  function storeCampaignData() {
    if (campaignStep === 1) {
      const name = $("#campaign-name").value.trim();
      if (!name) { error("#campaign-error", "Enter a campaign name to continue."); $("#campaign-name").focus(); return false; }
      campaignState = {...campaignState, name, format:$("input[name='format']:checked").value, publication:$("#campaign-publication").value, audience:$("#campaign-audience").value};
    } else if (campaignStep === 2) {
      campaignState.audience = $("#campaign-segment").value;
      campaignState.schedule = $("#campaign-schedule").value;
    } else if (campaignStep === 3) {
      const subject = $("#campaign-subject").value.trim();
      if (!subject) { error("#campaign-error", "Add an email subject to continue."); $("#campaign-subject").focus(); return false; }
      campaignState.subject = subject;
      campaignState.preheader = $("#campaign-preheader").value.trim();
      campaignState.body = $("#campaign-body").value.trim();
    }
    return true;
  }

  function nextCampaign(e) {
    e.preventDefault();
    if (campaignStep < 4) {
      if (!storeCampaignData()) return;
      campaignStep++;
      renderCampaignStep();
    } else {
      const drafts = localRead("newsletter-recreation-campaigns", []);
      drafts.push({...campaignState, id:Date.now(), status:"draft", savedAt:new Date().toISOString()});
      if (localWrite("newsletter-recreation-campaigns",drafts)) {
        toast("Campaign saved as a local draft");
        campaignStep = 1;
        campaignState = {name:"",format:"Newsletter issue",publication:"The Creator Brief",audience:"All subscribers",subject:"",preheader:"",body:"",schedule:"Now"};
        renderCampaignStep();
      }
    }
  }

  function renderTags() {
    $("#subscriber-tag-list").innerHTML = subscriberTags.map((tag, i) => '<span class="tag">' + esc(tag) + '<button type="button" data-remove-tag="' + i + '" aria-label="Remove ' + esc(tag) + '">×</button></span>').join("");
  }

  function updateEntry(entry) {
    activeEntry = entry;
    $$(".segment").forEach(el => {
      const on = el.dataset.entry === entry;
      el.classList.toggle("active",on);
      el.setAttribute("aria-selected",String(on));
    });
    $$("[data-entry-panel]").forEach(el => {el.hidden = el.dataset.entryPanel !== entry;});
    $("#subscriber-submit").textContent = entry === "single" ? "Add subscriber →" : entry === "paste" ? "Add subscribers →" : "Map CSV columns →";
    error("#subscriber-error","");
  }

  function emailList(value) {
    const values = value.split(/[\n,;]+/).map(x=>x.trim()).filter(Boolean);
    const unique = new Set(), valid = [], invalid = [];
    for (const value of values) {
      const key = value.toLowerCase();
      if (!emailPattern.test(key)) invalid.push(value);
      else if (!unique.has(key)) { unique.add(key); valid.push(key); }
    }
    return {valid,invalid,duplicates:values.length - valid.length - invalid.length};
  }

  function addSubscriber(e) {
    e.preventDefault();
    error("#subscriber-error","");
    if (activeEntry === "csv") {
      if (!imported) {error("#subscriber-error","Choose a CSV file to continue.");return;}
      importStep = 2; renderImport(); navigate("import"); return;
    }
    if (!$("#subscriber-consent").checked) {error("#subscriber-error","Please confirm that you have permission to add these readers.");return;}
    let entries = [];
    if (activeEntry === "single") {
      const email = $("#subscriber-email").value.trim().toLowerCase();
      if (!emailPattern.test(email)) {error("#subscriber-error","Enter a valid email address.");$("#subscriber-email").focus();return;}
      entries = [{email,firstName:$("#subscriber-first").value.trim(),lastName:$("#subscriber-last").value.trim()}];
    } else {
      const parsed = emailList($("#paste-emails").value);
      if (parsed.invalid.length) {error("#subscriber-error",parsed.invalid.length + " invalid address(es). Fix the list before importing.");return;}
      if (!parsed.valid.length) {error("#subscriber-error","Enter at least one valid email address.");return;}
      entries = parsed.valid.map(email => ({email}));
    }
    const existing = localRead(leadsKey,[]);
    const seen = new Set(existing.map(x=>x.email));
    let added = 0;
    entries.forEach(entry => {
      if (seen.has(entry.email)) return;
      seen.add(entry.email);
      existing.push({...entry,plan:$("#subscriber-plan").value,tags:[...subscriberTags],welcome:$("#subscriber-welcome").checked,doubleOptIn:$("#subscriber-double").checked,createdAt:new Date().toISOString()});
      added++;
    });
    if (!added) {error("#subscriber-error","These email addresses are already on your local list.");return;}
    if (localWrite(leadsKey,existing)) {
      toast("Added " + added + " subscriber" + (added === 1 ? "" : "s") + " · stored locally");
      if (activeEntry === "single") {$("#subscriber-email").value = "";$("#subscriber-first").value = "";$("#subscriber-last").value = "";}
      if (activeEntry === "paste") {$("#paste-emails").value = "";updatePasteCount();}
    }
  }

  function updatePasteCount() {
    const r = emailList($("#paste-emails").value);
    $("#paste-count").textContent = r.valid.length + " valid · " + r.invalid.length + " invalid · " + r.duplicates + " duplicates";
  }

  function parseCsv(text) {
    const value = text.replace(/^\uFEFF/,"");
    const rows=[]; let row=[],cell="",quoted=false;
    for (let i=0;i<value.length;i++) {
      const ch=value[i];
      if (ch==='"') {
        if (quoted && value[i+1]==='"') {cell+='"';i++;}
        else quoted=!quoted;
      } else if (ch==="," && !quoted) {row.push(cell);cell="";}
      else if ((ch==="\n"||ch==="\r") && !quoted) {
        if (ch==="\r" && value[i+1]==="\n") i++;
        row.push(cell);if (row.some(x=>x.trim()!=="")) rows.push(row);
        row=[];cell="";
      } else cell+=ch;
    }
    if (quoted) throw new Error("CSV contains an unclosed quoted field.");
    row.push(cell);
    if (row.some(x=>x.trim()!=="")) rows.push(row);
    if (rows.length < 2) throw new Error("CSV must have a header and at least one data row.");
    if (rows.length > 20001) throw new Error("For this demo, use at most 20,000 data rows.");
    const headers = rows.shift().map(x=>x.trim());
    if (headers.some(x=>!x)) throw new Error("Every CSV column needs a header.");
    if (new Set(headers.map(x=>x.toLowerCase())).size !== headers.length) throw new Error("CSV headers must be unique.");
    return {headers,rows:rows.map(row=>headers.map((_,i)=>(row[i]??"").trim()))};
  }

  function suggestedMap(header) {
    const h=header.toLowerCase().replace(/[^a-z]/g,"");
    if (/^(email|emailaddress|mail)$/.test(h)) return "Email";
    if (h.includes("firstname")||h==="givenname") return "First name";
    if (h.includes("lastname")||h==="surname") return "Last name";
    if (h.includes("date")||h==="joinedat"||h==="createdat") return "Signup date";
    if (h==="tier"||h.includes("plan")||h==="subscription") return "Subscription plan";
    if (h==="tag"||h==="tags") return "Tags";
    return "Don't import";
  }

  function setImport(headers, rows, name, bytes, sample=false) {
    imported = {headers,rows,name,bytes,sample,mapping:headers.map(suggestedMap)};
    importStep=2;
    renderImport();
  }

  function useSampleImport() {
    const headers=["email","first_name","last_name","joined_at","plan"];
    const rows = Array.from({length:80},(_,i)=>["reader"+(i+1)+"@example.com",["Olivia","Alex","Jordan","Taylor"][i%4],["Morgan","Bennett","Lee","Chen"][i%4],i<18?"invalid-date":"2026-10-"+String((i%26)+1).padStart(2,"0"),i%7===0?"Paid":"Free"]);
    setImport(headers,rows,"creator-brief-subscribers.csv",0,true);
  }

  function dateIsValid(value) {
    if (!value || !String(value).trim()) return false;
    const time = Date.parse(value);
    return Number.isFinite(time);
  }

  function dateProblems() {
    if (!imported) return 0;
    const index=imported.mapping.indexOf("Signup date");
    if (index<0) return 0;
    return imported.rows.filter(row=>row[index]&&!dateIsValid(row[index])).length;
  }

  function importSummary() {
    const emailIndex=imported.mapping.indexOf("Email");
    const stored=new Set(localRead(leadsKey,[]).map(x=>x.email));
    const batch=new Set();
    let bad=0,duplicates=0;
    const records=[];
    for (const row of imported.rows) {
      const email=(row[emailIndex]||"").trim().toLowerCase();
      if (!emailPattern.test(email)) {bad++;continue;}
      if (stored.has(email)||batch.has(email)) {duplicates++;continue;}
      batch.add(email);
      const r={email,createdAt:new Date().toISOString(),source:"csv"};
      imported.mapping.forEach((field,i)=>{
        const v=row[i];if (!v)return;
        if (field==="First name") r.firstName=v;
        if (field==="Last name") r.lastName=v;
        if (field==="Subscription plan") r.plan=v;
        if (field==="Signup date"&&dateIsValid(v)) r.signupDate=v;
        if (field==="Tags") r.tags=v.split(/[;|]/).map(x=>x.trim()).filter(Boolean);
      });
      records.push(r);
    }
    return {records,bad,duplicates};
  }

  function renderImport() {
    if (!imported) useSampleImport();
    $("#import-file-name").textContent=imported.name;
    $("#import-file-size").textContent=imported.rows.length.toLocaleString() + " rows · " + imported.headers.length + " columns" + (imported.sample?" · sample data":" · "+Math.ceil(imported.bytes/1024)+" KB");
    const body=$("#mapping-body");
    body.innerHTML=imported.headers.map((h,i)=>{
      const choices=FIELDS.map(opt=>'<option value="'+esc(opt)+'"'+(imported.mapping[i]===opt?' selected':'')+'>'+esc(opt)+'</option>').join("");
      const status=imported.mapping[i]==="Don't import"?'<span class="status skipped">● Skipped</span>':(imported.mapping[i]==="Signup date"&&dateProblems()?'<span class="status warning">● Review</span>':'<span class="status matched">✓ Matched</span>');
      return '<tr><td>'+esc(h)+'</td><td title="'+esc(imported.rows[0]?.[i]??"")+'">'+esc(imported.rows[0]?.[i]??"—")+'</td><td><select class="select-input map-select" data-map-index="'+i+'" aria-label="Map '+esc(h)+' column">'+choices+'</select></td><td>'+status+'</td></tr>';
    }).join("");
    const problems=dateProblems();
    $("#date-warning").hidden=problems===0;
    $("#date-warning-title").textContent=problems+" rows have unreadable dates";
    const reviewing=importStep===3;
    $("#mapping-view").hidden=reviewing; $("#review-view").hidden=!reviewing;
    $("#map-progress").classList.toggle("complete",reviewing);
    $("#map-progress").classList.toggle("current",!reviewing);
    $("#map-progress").querySelector("b").textContent=reviewing?"✓":"2";
    $("#review-progress").classList.toggle("current",reviewing);
    if (reviewing) {
      const report=importSummary();
      $("#review-total").textContent=imported.rows.length.toLocaleString();
      $("#review-valid").textContent=report.records.length.toLocaleString();
      $("#review-invalid").textContent=(report.bad+report.duplicates).toLocaleString();
      $("#review-summary").textContent="Ready to add "+report.records.length+" valid subscriber(s). "+report.bad+" invalid email(s), "+report.duplicates+" duplicate(s), "+problems+" unreadable date(s). Unreadable dates are skipped; all other mapped fields remain.";
    }
    $("#import-next").textContent=reviewing?"Import "+importSummary().records.length+" subscribers ✓":"Continue to review →";
    $("#import-footnote").textContent="Step "+importStep+" of 3 · "+imported.rows.length.toLocaleString()+" rows";
    error("#import-error","");
  }

  async function loadCsvFile(file) {
    if (!file) return;
    if (file.size > 5*1024*1024) {error("#import-error","CSV must be 5 MB or smaller.");error("#subscriber-error","CSV must be 5 MB or smaller.");return;}
    try {
      const parsed=parseCsv(await file.text());
      setImport(parsed.headers,parsed.rows,file.name,file.size);
      $("#csv-file-name").textContent=file.name+" · "+parsed.rows.length.toLocaleString()+" rows ready to map";
      $("#import-consent").checked=false;
      navigate("import");
      toast("CSV loaded · review your field mapping");
    } catch(e) {const message=e instanceof Error?e.message:"Cannot parse CSV file.";error("#import-error",message);error("#subscriber-error",message);}
  }

  function nextImport() {
    error("#import-error","");
    if (!imported) {error("#import-error","Select a CSV file first.");return;}
    if (importStep===2) {
      if (imported.mapping.filter(x=>x==="Email").length!==1) {error("#import-error","Map exactly one column to Email before continuing.");return;}
      const selected=imported.mapping.filter(x=>x!=="Don't import");
      if (new Set(selected).size!==selected.length) {error("#import-error","Each subscriber field may be mapped only once.");return;}
      importStep=3; renderImport();return;
    }
    if (!$("#import-consent").checked) {error("#import-error","Confirm that these subscribers gave permission before importing.");return;}
    const report=importSummary();
    if (report.records.length===0) {error("#import-error","There are no new valid subscribers to import.");return;}
    const stored=localRead(leadsKey,[]);
    if (localWrite(leadsKey,stored.concat(report.records))) {
      toast("Imported "+report.records.length+" subscribers to local browser storage");
      $("#import-consent").checked=false;
      importStep=2; renderImport();
    }
  }

  function discountType() {return $("input[name='discount-type']:checked").value;}
  function offerUrl() {
    const url=new URL("./newsletter.html",location.href);
    url.searchParams.set("screen","offer");
    url.searchParams.set("code",$("#offer-code").value.trim().toUpperCase());
    return url.href;
  }
  function updateOffer() {
    const type=discountType();
    const value=Number($("#offer-discount").value)||0;
    const bounded=Math.max(0,value);
    const price=type==="percent"?5*(1-Math.min(100,bounded)/100):Math.max(0,5-bounded);
    const months=$("#offer-duration").value;
    const code=$("#offer-code").value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g,"");
    $("#discount-unit").textContent=type==="percent"?"%":"$";
    $("#offer-discount").max=type==="percent"?"100":"5";
    $("#preview-badge").textContent=type==="percent"?bounded+"% OFF":money(bounded)+" OFF";
    $("#preview-price").textContent=money(price);
    $("#preview-before").textContent="Normally $5.00 / month";
    $("#preview-duration").textContent="For your first "+months+" month"+(months==="1"?"":"s");
    $("#preview-link").textContent="/offer/"+(code||"YOUR-CODE");
    $("#preview-eligible").textContent=$("#offer-eligible").value;
    $("#preview-availability").textContent=$("#offer-active").checked?"Available now":"Inactive";
    $$(".discount-pill").forEach(el=>el.classList.toggle("chosen",!!$("input",el).checked));
    error("#offer-error","");
  }

  function submitOffer(e) {
    e.preventDefault();
    const amount=Number($("#offer-discount").value);
    const code=$("#offer-code").value.trim().toUpperCase();
    if (!Number.isFinite(amount)||amount<=0||amount>(discountType()==="percent"?100:5)) {error("#offer-error","Enter a valid discount above zero, no more than "+(discountType()==="percent"?"100%.":"$5."));return;}
    if (!/^[A-Z0-9_-]{3,24}$/.test(code)) {error("#offer-error","Offer code must be 3–24 letters, numbers, dashes or underscores.");return;}
    const offers=localRead("newsletter-recreation-offers",[]);
    const info={id:Date.now(),name:$("#offer-name").value.trim()||"Newsletter offer",type:discountType(),value:amount,months:$("#offer-duration").value,eligible:$("#offer-eligible").value,code,active:$("#offer-active").checked,url:offerUrl(),createdAt:new Date().toISOString()};
    const existing=offers.findIndex(x=>x.code===code);
    if(existing>=0) offers[existing]=info;else offers.push(info);
    if(localWrite("newsletter-recreation-offers",offers)){toast("Offer saved locally · "+code);$("#offer-footnote").textContent="Saved · "+code+" · preview is ready to share";}
  }

  async function copyText(value) {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else { const tmp=document.createElement("textarea");tmp.value=value;tmp.style.position="fixed";tmp.style.opacity="0";document.body.appendChild(tmp);tmp.select();const copied=document.execCommand("copy");tmp.remove();if(!copied) throw new Error("Copy failed"); }
      toast("Link copied to clipboard");
    } catch {toast("Copy unavailable — check your browser permissions");}
  }

  document.addEventListener("click", e => {
    const open=e.target.closest("[data-open]");
    if (open) {navigate(open.dataset.open);return;}
    if (e.target.closest("[data-close]")) {closePanel();return;}
    const entry=e.target.closest("[data-entry]");
    if (entry) {updateEntry(entry.dataset.entry);return;}
    const remove=e.target.closest("[data-remove-tag]");
    if (remove) {subscriberTags.splice(Number(remove.dataset.removeTag),1);renderTags();return;}
    const reset=e.target.closest("[data-reset]");
    if(reset) {
      if(reset.dataset.reset==="campaign"){campaignStep=1;campaignState={name:"",format:"Newsletter issue",publication:"The Creator Brief",audience:"All subscribers",subject:"",preheader:"",body:"",schedule:"Now"};renderCampaignStep();}
      if(reset.dataset.reset==="subscribers"){$("#subscriber-form").reset();subscriberTags=["Creator Brief"];renderTags();updateEntry("single");}
      if(reset.dataset.reset==="offer"){$("#offer-form").reset();updateOffer();$("#offer-footnote").textContent="Preview updates as you edit the offer";}
      toast("Changes discarded");return;
    }
  });

  $("#campaign-form").addEventListener("submit",nextCampaign);
  const back=document.createElement("button");back.type="button";back.className="btn btn-secondary";back.id="campaign-back";back.textContent="Back";back.hidden=true;
  $("#campaign-panel .footer-buttons").prepend(back);
  const next=$("#campaign-panel button[type='submit']");next.id="campaign-next";
  back.addEventListener("click",()=>{if(campaignStep>1){if(campaignStep===2){campaignState.audience=$("#campaign-segment").value;campaignState.schedule=$("#campaign-schedule").value;}if(campaignStep===3){campaignState.subject=$("#campaign-subject").value;campaignState.preheader=$("#campaign-preheader").value;campaignState.body=$("#campaign-body").value;}campaignStep--;renderCampaignStep();}});
  campaignForm.addEventListener("change",(e)=>{if(e.target.name==="format")updateFormatCards();});
  $("#subscriber-form").addEventListener("submit",addSubscriber);
  $("#subscriber-tags").addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==",")return;e.preventDefault();const value=e.target.value.trim().replace(/,/g,"");if(!value)return;if(!subscriberTags.some(tag=>tag.toLowerCase()===value.toLowerCase()))subscriberTags.push(value);e.target.value="";renderTags();});
  $("#paste-emails").addEventListener("input",updatePasteCount);
  $("#subscriber-csv").addEventListener("change",e=>loadCsvFile(e.target.files?.[0]));
  $("#import-csv").addEventListener("change",e=>loadCsvFile(e.target.files?.[0]));
  $("#replace-file").addEventListener("click",()=>$("#import-csv").click());
  $("#mapping-body").addEventListener("change",e=>{if(e.target.matches("[data-map-index]")){imported.mapping[Number(e.target.dataset.mapIndex)]=e.target.value;renderImport();}});
  $("#import-next").addEventListener("click",nextImport);
  $("#import-back").addEventListener("click",()=>{if(importStep===3){importStep=2;renderImport();}else navigate("subscribers");});
  $("#offer-form").addEventListener("input",updateOffer);
  $("#offer-form").addEventListener("change",updateOffer);
  $("#offer-form").addEventListener("submit",submitOffer);
  $("#offer-copy").addEventListener("click",()=>copyText(offerUrl()));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$(".modal-frame").hidden)closePanel();});

  useSampleImport();
  renderTags();
  renderCampaignStep();
  updateOffer();
  const desired=new URLSearchParams(location.search).get("screen");
  navigate(SCREENS.includes(desired)?desired:"campaign");
})();