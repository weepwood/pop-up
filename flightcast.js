(() => {
  "use strict";
  const $ = (q, root=document) => root.querySelector(q);
  const $$ = (q, root=document) => Array.from(root.querySelectorAll(q));
  const screens = ["media","title","analysis","chat"];
  const storeKey="popup-flightcast-demo-v1";
  const defaultTitle="Discipline Expert: The Habit That Will Make Or Break Your Entire 2026!";
  const titles=[
    defaultTitle,
    "The One Habit That Will Transform Your Entire Year",
    "Why Discipline Matters More Than Motivation",
    "How to Build Habits That Actually Stick in 2026",
    "The Daily Routine That Changes Everything",
    "Stop Waiting for Motivation: Build Discipline Instead",
    "7 Small Habits With Massive Long-Term Results",
    "The Truth About Self-Discipline Nobody Tells You",
    "The 2-Minute Rule for Becoming Consistent",
    "Transform Your Habits: A Practical Guide to 2026"
  ];
  const platforms=["youtube","spotify","rss"];
  const initial={
    title:defaultTitle, description:"", platform:{youtube:true,spotify:false,rss:false},
    titleIndex:0, rejected:[], selectedTitle:0, uploads:{}, episodeTab:"content", theme:"light",
    userChats:[], activeChat:"Last 30 days performance"
  };
  let state=structuredClone(initial);
  try{
    const x=JSON.parse(localStorage.getItem(storeKey)||"null");
    if(x&&typeof x==="object"){
      state={...state,...x,platform:{...state.platform,...x.platform},uploads:{...x.uploads}};
      state.userChats=Array.isArray(x.userChats)?x.userChats.slice(-20):[];
      state.rejected=Array.isArray(x.rejected)?x.rejected:[];
    }
  }catch{}
  const params=new URLSearchParams(location.search);
  let screen=screens.includes(params.get("screen"))?params.get("screen"):"media";
  let panelOpen=true,menuOpen=false,chartMenuOpen=false;
  let toastTimer;
  const svgUpload='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>';
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function save(){try{localStorage.setItem(storeKey,JSON.stringify(state));}catch{toast("Browser storage unavailable — changes may not persist");}}
  function toast(t){const el=$("#toast");el.textContent=t;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2900);}
  function dropzone(id,label="Select or drop video",hint="MP4, MOV, AVI (max 60GB)",accept="video/*,.mp4,.mov,.avi"){
    const uploaded=state.uploads[id];
    return '<button type="button" class="dropzone'+(uploaded?' has-file':'')+'" data-upload="'+esc(id)+'" data-accept="'+esc(accept)+'" aria-label="Choose file for '+esc(label)+'"><span class="upload-icon">'+svgUpload+'</span><strong>'+esc(uploaded?.name||label)+'</strong><small>'+esc(uploaded?'Local selection · '+formatBytes(uploaded.size):hint)+'</small></button>';
  }
  const formatBytes=x=>x>=1048576?(x/1048576).toFixed(1)+" MB":x>=1024?(x/1024).toFixed(1)+" KB":x+" B";
  function mediaBody(){return '<div class="media-layout"><div class="field-group"><label class="field-label">Episode Media</label>'+dropzone("episodeVideo")+'</div><div class="field-group"><label class="field-label">Thumbnail</label><div class="upload-columns">'+dropzone("thumbnail","Video Thumbnail","JPG, PNG, WEBP","image/*") +dropzone("audioTrack","Audio Track","MP3, WAV, M4A","audio/*,.mp3,.wav,.m4a")+'</div></div><button class="subtle-action" data-action="reopen-panel">Customize platform media ↗</button></div>';}
  function titleBody(){return '<div class="episode-title-view"><label class="field-label" for="episode-title">Title</label><textarea id="episode-title" class="edit-title" maxlength="200" rows="2">'+esc(state.title)+'</textarea><div class="word-counter"><span id="title-count">'+state.title.length+'</span> / 200 characters</div><label class="field-label" for="description-editor">Description</label><div class="editor-frame"><div class="editor-toolbar"><button data-action="format-bold" type="button" title="Add bold markup"><strong>B</strong></button><button data-action="format-italic" type="button" title="Add italic markup"><i>I</i></button><button data-action="format-list" type="button" title="Insert list">☷</button><button data-action="format-number" type="button" title="Insert numbered list">≡</button><button data-action="format-link" type="button" title="Insert link">🔗</button></div><textarea id="description-editor" class="description-editor" placeholder="Add your episode description here">'+esc(state.description)+'</textarea></div><div class="field-toolbar" style="margin:24px 0 10px"><label class="field-label" style="margin:0">Chapters</label><button data-action="add-chapter" type="button">+ Add chapter</button></div><table class="chapter-table"><thead><tr><th>#</th><th>Start Time</th><th>Title</th></tr></thead><tbody id="chapters-body"><tr><td>1</td><td>0:00</td><td>Intro</td></tr><tr><td>2</td><td>5:01</td><td>A Great Way to Stick to Your Habits</td></tr><tr><td>3</td><td>7:36</td><td>Create the Conditions to Succeed</td></tr><tr><td>4</td><td>11:30</td><td>The 2-Minute Rule: The Most Important Habit</td></tr></tbody></table><button class="subtle-action" data-action="reopen-panel">Customize platform title ↗</button></div>';}
  function makeSeries(kind="retention"){
    const len=kind==="retention"?62:45;
    const values=[];
    for(let s=0;s<(kind==="retention"?2:3);s++){
      const pts=[];
      for(let i=0;i<len;i++){
        let v;
        if(kind==="retention"){
          const base=s===0?100-65*(i/(len-1))**0.76:100-96*(1-Math.exp(-4.5*i/(len-1)))/(1-Math.exp(-4.5));
          const wiggle=Math.sin(i*1.52+s)*2+Math.cos(i*.57+s*4)*2.5;
          v=Math.min(100,Math.max(1,base+wiggle+(i>20&&i<26?6:0)));
        } else {
          const base=[57,21,17][s];
          const spike=i>16&&i<20?[33,25,14][s]*(1-Math.abs(i-18)/3):0;
          v=Math.max(2,base+Math.sin(i*.9+s)*8+Math.cos(i*.37+s*2)*7+spike+(s===0?12*Math.sin(i*.26):0));
        }
        pts.push(v);
      }
      values.push(pts);
    }
    return values;
  }
  function chartSvg(kind){
    const series=makeSeries(kind),w=900,h=kind==="retention"?345:190,left=kind==="retention"?40:6,top=8,bottom=h-18,plotW=w-left-8,plotH=bottom-top;
    const grid=Array.from({length:5},(_,i)=>{const y=top+plotH*i/4;return '<line class="gridline" x1="'+left+'" y1="'+y+'" x2="'+(w-8)+'" y2="'+y+'"/>'+(kind==="retention"?'<text x="2" y="'+(y+4)+'" font-size="12" fill="#aaa">'+(100-25*i)+'%</text>':"");}).join("");
    const colors=kind==="retention"?["#32a34c","#fd3a3a"]:["#fd3b3b","#2aa748","#8530f4"];
    return '<svg class="svg-chart" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+(kind==="retention"?"Illustrative Spotify and YouTube audience retention over 60 minutes":"Illustrative YouTube, Spotify and RSS plays over time")+'">'+grid+series.map((arr,s)=>{const points=arr.map((v,i)=>[left+i*plotW/(arr.length-1),bottom-v*plotH/100].map(n=>n.toFixed(1)).join(",")).join(" ");return '<polyline fill="none" stroke="'+colors[s]+'" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" points="'+points+'"/>';}).join("")+'</svg>';
  }
  function analyticsBody(){return '<div class="analysis-card"><div class="metric-icon">◷</div><h2>Retention</h2><p>How your audience engages with this episode over time</p><div class="large-metric">100% <small>(YouTube, 30 seconds)</small></div><div class="chart-frame">'+chartSvg("retention")+'<div class="chart-labels"><span>0:00</span><span>10:00</span><span>20:00</span><span>30:00</span><span>40:00</span><span>50:00</span><span>60:00</span></div></div><div class="context-position"><button class="more-action" type="button" data-action="chart-menu" aria-expanded="'+chartMenuOpen+'" aria-label="Chart actions">···</button><div class="chart-menu" id="chart-menu" '+(!chartMenuOpen?'hidden':'')+'><button data-action="explain" type="button">✧ &nbsp;Explain</button><button data-action="export" type="button">⇩ &nbsp;Export</button></div></div></div>';}
  const chatHistory=[
    ["Today","Last 30 days performance","Best episodes to clip"],
    ["This week","Spotify vs YouTube growth","Guest episodes compared","Where listeners drop off"],
    ["Earlier","Top countries this year","Title ideas for next episode","Launch week plays"]
  ];
  const demoAnswers={
    "Last 30 days performance":"You had 53.7K plays in the last 30 days, up 30% on the 30 days before. That's each platform added together.",
    "Best episodes to clip":"Episodes with audience retention spikes around the 21-minute mark are promising clip candidates in this illustrative dataset.",
    "Spotify vs YouTube growth":"YouTube grew 31% in the sample period, while Spotify grew 27%. Spotify listeners have a longer retention curve.",
    "Guest episodes compared":"Guest episodes had stronger mid-episode retention in this example. Compare publishing times and topics before drawing conclusions.",
    "Where listeners drop off":"The sample YouTube series loses viewers rapidly early on, especially within the first four minutes.",
    "Top countries this year":"Geographic audience data is not connected in this demo. This panel uses illustrative metrics only.",
    "Title ideas for next episode":"Try a focused title: Why Your Best Habits Fail — And What to Do About It.",
    "Launch week plays":"Launch week reached 11.9K plays in this fictional example."
  };
  function responseText(prompt){
    if(demoAnswers[prompt])return demoAnswers[prompt];
    const q=prompt.toLowerCase();
    if(q.includes("platform")||q.includes("grow"))return "In this illustrative dataset, YouTube contributed 29.0K plays (54%), Spotify 13.7K (26%) and RSS 10.9K (20%). All three platforms grew versus the previous period.";
    if(q.includes("episode")||q.includes("clip"))return "The most replayed moment in the sample is near minute 21. It may be a useful clip candidate, subject to reviewing the actual episode.";
    if(q.includes("quarter"))return "Quarter-over-quarter comparisons need more data than this static example provides. Connect a real analytics service to calculate this accurately.";
    return "This is an interactive UI recreation with example data, not a live AI model. Try asking which platform grew the most, or which episodes to clip.";
  }
  function answerMarkup(prompt){
    const defaultPrompt=prompt==="Last 30 days performance";
    const paragraphs=defaultPrompt?[
      demoAnswers[prompt],
      "YouTube was 54% of those plays. Spotify was 26%, and RSS was 20%. Each platform grew on the 30 days before: YouTube up 31%, RSS up 29%, and Spotify up 27%.",
      "The strongest week was May 8–May 14, with 14.1K plays. The first 7 days had 11.9K plays, and the last 7 days had 12.1K plays. Plays held that higher pace through the end of the month."
    ]:[responseText(prompt)];
    return paragraphs.map(x=>'<p>'+esc(x)+'</p>').join("");
  }
  function chatBody(){
    const prompt=state.activeChat;
    const groups=chatHistory.map(group=>'<div class="chat-group"><div class="chat-group-label">'+group[0]+'</div>'+group.slice(1).map(t=>'<button type="button" class="chat-entry'+(prompt===t?' active':'')+'" data-chat="'+esc(t)+'">'+esc(t)+'</button>').join("")+'</div>').join("");
    const extras=state.userChats.map(t=>'<button type="button" class="chat-entry'+(prompt===t?' active':'')+'" data-chat="'+esc(t)+'">'+esc(t)+'</button>').join("");
    return '<div class="chat-layout"><aside class="chat-list"><div class="chat-list-header"><span>Chats</span><button type="button" data-action="new-chat" title="New chat">+</button></div>'+groups+(extras?'<div class="chat-group"><div class="chat-group-label">Your prompts</div>'+extras+'</div>':'')+'</aside><div class="conversation"><div class="question-bubble">'+esc(prompt==="Last 30 days performance"?"How did my show do in the last 30 days?":prompt)+'</div><div class="answer-block"><div class="fey-icon">♢</div><div class="answer-inner"><div class="thinking">Thought for 6 seconds ⌄ <small style="color:#bbb">(sample answer)</small></div><div class="answer-text">'+answerMarkup(prompt)+'</div><div class="metric-list"><div class="metric-row"><span class="metric-dot"></span>YouTube Views <strong>29.0K</strong><small>54%</small></div><div class="metric-row"><span class="metric-dot green"></span>Spotify Streams <strong>13.7K</strong><small>26%</small></div><div class="metric-row"><span class="metric-dot purple"></span>RSS Downloads <strong>10.9K</strong><small>20%</small></div></div><div class="chat-chart">'+chartSvg("plays")+'</div><div class="chat-followups"><button type="button" data-prompt="Which platform grew the most?">✧ &nbsp; Which platform grew the most?</button><button type="button" data-prompt="Which episodes drove it?">✧ &nbsp; Which episodes drove it?</button><button type="button" data-prompt="Compare with last quarter">✧ &nbsp; Compare with last quarter</button></div></div></div><form id="chat-form" class="chat-form"><input id="chat-input" aria-label="Ask Fey AI a question" placeholder="Ask a question about your podcast…" maxlength="200" required><button type="submit">Send ↗</button></form></div></div>';
  }
  function placeholderTab(tab){return '<div style="padding:55px 12px;text-align:center;color:#8f8f8f;font-size:13px"><div style="font-size:22px;margin-bottom:15px">◇</div>'+esc(({overview:"Episode overview",adslots:"Ad slots",transcript:"Episode transcript"})[tab]||"Episode")+' is shown as a demo tab.<br><br><button type="button" class="subtle-action" data-action="tab-content">← Return to Content</button></div>';}
  function platformLabel(p){return p==="rss"?"RSS Feed":p==="youtube"?"YouTube":"Spotify";}
  function platformLogo(p){return '<span class="platform-logo '+p+'">'+(p==="youtube"?"▶":p==="spotify"?"≋":"◉")+'</span>';}
  function platformSection(p,kind){
    const enabled=state.platform[p];
    let inner="";
    if(enabled&&kind==="media")inner='<div class="platform-details">'+dropzone("override-"+p,"Select or drop "+(p==="youtube"?"video":"audio"),p==="youtube"?"MP4, MOV, AVI (max 60GB)":"MP3, WAV, M4A","video/*,audio/*")+'</div>';
    if(enabled&&kind==="title")inner='<div class="title-option"><div class="option-title">'+esc(titles[(Number(state.titleIndex)||0)%titles.length])+'</div><div class="option-controls"><button type="button" data-action="prev-title" aria-label="Previous title">‹</button><span class="option-count">'+((Number(state.titleIndex)||0)+1)+' of 10</span><button type="button" data-action="next-title" aria-label="Next title">›</button><span class="option-divider"></span><button class="accept" type="button" data-action="accept-title" title="Apply title">✓</button><button class="reject" type="button" data-action="reject-title" title="Skip title">×</button></div></div><button class="generated-link" type="button" data-action="next-title">✦ &nbsp; Generated 10 Titles</button>';
    return '<div class="platform-row"><div class="platform-head">'+platformLogo(p)+'<span class="platform-name">'+platformLabel(p)+'</span><label class="switch" aria-label="Enable '+platformLabel(p)+' override"><input type="checkbox" data-platform="'+p+'" '+(enabled?'checked':'')+'><span class="switch-track"></span></label></div>'+inner+'</div>';
  }
  function platformPanel(kind){
    return '<div class="panel-heading"><div><strong>'+ (kind==="media"?"Custom Media":"Custom Title")+'</strong><p>Give each platform its own '+(kind==="media"?"media by enabling the override and uploading a file for the platform.":"title by enabling the override and setting the title for the platform.")+'</p></div><button type="button" class="close-panel" data-action="close-panel" aria-label="Close panel">×</button></div>'+platforms.map(p=>platformSection(p,kind)).join("");
  }
  function analysisPanel(){
    return '<div class="analysis-panel-head"><div class="panel-heading"><div><span class="insight-spark">✧</span><strong>Fey AI analysis</strong><p>How your audience engages with this episode over time</p></div><button class="close-panel" data-action="close-panel" aria-label="Close analysis panel" type="button">×</button></div></div><div class="analysis-panel-body"><div class="analysis-block"><h3>Overview</h3><p>How many people are still watching or listening at each point of this 60-minute episode, on YouTube and Spotify.</p><p>Spotify holds its audience much longer. At 15 minutes, 68% of Spotify listeners are still there, against 41% of YouTube viewers. About 1 in 4 Spotify listeners reach the end.</p></div><div class="analysis-block"><h3>Insights</h3><p>YouTube loses viewers early: 30% leave in the first 4 minutes, and half are gone by minute 11, when Spotify still has 77%.</p><p>Both curves jump at 21 minutes, YouTube from 25% to 40%. People skip ahead or rewind to that moment, so it is the part of the episode they value most.</p></div><div class="analysis-block"><h3>Suggestions</h3><p>Tighten the first 5 minutes of the YouTube video, and open with a preview of the 21-minute moment so viewers know what is coming.</p><p>Share that moment as a clip too. It is the part people go back to, so it is the best bet to bring new viewers to the full episode.</p></div><div class="prompt-buttons"><button data-prompt="Why do YouTube viewers leave early?" type="button">✧ &nbsp; Why do YouTube viewers leave early?</button><button data-prompt="What happens at 21 minutes?" type="button">✧ &nbsp; What happens at 21 minutes?</button><button data-prompt="Compare with recent episodes" type="button">✧ &nbsp; Compare with recent episodes</button></div></div>';
  }
  function navigate(dest,opts={}){
    if(!screens.includes(dest))return;
    if(screen==="title"&&$("#episode-title"))state.title=$("#episode-title").value;
    if(screen==="title"&&$("#description-editor"))state.description=$("#description-editor").value;
    screen=dest;state.episodeTab=dest==="analysis"?"analytics":"content";
    panelOpen=dest!=="chat";chartMenuOpen=false;
    const url=new URL(location.href);url.searchParams.set("screen",dest);history.replaceState(null,"",url);
    render();if(!opts.silent)save();
  }
  function render(){
    const options={
      media:["Publishing","Platform Customization","Media","Use one video everywhere, or upload a separate video for YouTube, Spotify or the RSS feed. You can also upload a separate audio file for audio-only apps or use audio extracted from the video."],
      title:["Publishing","AI Generation","Fill in details with AI","Flightcast’s AI drafts titles, descriptions and chapters from the episode’s transcript. You can draft them as soon as the transcript is ready."],
      analysis:["","AI Insights","Chart Explanations","You can ask FEY to explain charts. Each explanation covers what the chart shows, the key insight and what to do next."],
      chat:["","AI Insights","",""]
    };
    const [parent,current,heading,subtitle]=options[screen];
    $("#breadcrumb-parent").textContent=parent;$("#breadcrumb-parent").hidden=!parent;
    $("#breadcrumb-arrow").hidden=!parent;$("#breadcrumb-current").textContent=current;
    $("#page-title").textContent=heading;$("#page-subtitle").textContent=subtitle;
    $("#app-shell").classList.toggle("chat-scene",screen==="chat");
    document.documentElement.classList.toggle("dark",state.theme==="dark");
    $$("[data-screen]").forEach(el=>{if(!el.classList.contains("side-link")&&!el.classList.contains("sub-link")&&!el.closest(".screens-menu"))return;el.classList.toggle("active",el.dataset.screen===screen||(screen==="chat"&&el.dataset.screen==="analysis"&&el.textContent.includes("Insights")));});
    $("#screens-menu").hidden=!menuOpen;$("#screens-toggle").setAttribute("aria-expanded",String(menuOpen));
    $("#episode-heading").textContent=screen==="chat"?"My Podcast":"My Episode";
    const tabs=$("#episode-tabs");
    tabs.innerHTML=(screen==="chat"?["overview","episodes","analytics","clips","feyai","settings"]:["overview","content","analytics","adslots","transcript"]).map(t=>'<button type="button" data-episode-tab="'+t+'" class="'+((screen==="chat"?t==="feyai":state.episodeTab===t)?"selected":"")+'">'+({overview:"Overview",content:"Content",analytics:"Analytics",adslots:"Ad Slots",transcript:"Transcript",episodes:"Episodes",clips:"Clips",feyai:"Fey AI",settings:"Settings"})[t]+'</button>').join("");
    $("#episode-body").innerHTML=screen==="chat"?chatBody():state.episodeTab==="content"?(screen==="title"?titleBody():mediaBody()):state.episodeTab==="analytics"?analyticsBody():placeholderTab(state.episodeTab);
    const panel=$("#floating-panel");panel.className="floating-panel"+(screen==="analysis"?" analysis-panel":"")+(panelOpen?"":" closed");
    panel.innerHTML=screen==="analysis"?analysisPanel():screen==="media"||screen==="title"?platformPanel(screen):"";
  }
  function download(text,name,type="text/csv"){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
  function requestUpload(button){
    const input=$("#hidden-upload"),id=button.dataset.upload;
    input.accept=button.dataset.accept||"*/*";
    input.value="";input.dataset.target=id;input.click();
  }
  function recordFile(id,file){
    if(!file)return;
    const max=60*1024**3;
    if(file.size>max){toast("File exceeds the 60 GB demo limit");return;}
    if(id==="thumbnail"&&!file.type.startsWith("image/")){toast("Choose a thumbnail image");return;}
    if(id==="audioTrack"&&!file.type.startsWith("audio/")&&!/\.(mp3|wav|m4a)$/i.test(file.name)){toast("Choose an audio file");return;}
    state.uploads[id]={name:file.name,size:file.size,type:file.type};
    save();render();toast("Selected "+file.name+" · local preview only");
  }
  function moveTitle(dir){state.titleIndex=(Number(state.titleIndex)+dir+titles.length)%titles.length;save();render();}
  function ask(prompt){
    state.activeChat=prompt;
    if(!chatHistory.some(g=>g.includes(prompt))&&!state.userChats.includes(prompt))state.userChats.unshift(prompt);
    save();navigate("chat");toast("Illustrative answer — no live AI request");
  }
  $("#publishing-toggle").addEventListener("click",()=>{
    const el=$("#publishing-subnav");el.hidden=!el.hidden;$("#publishing-toggle").setAttribute("aria-expanded",String(!el.hidden));
  });
  $("#screens-toggle").addEventListener("click",()=>{menuOpen=!menuOpen;$("#screens-menu").hidden=!menuOpen;$("#screens-toggle").setAttribute("aria-expanded",String(menuOpen));});
  $("#sidebar-toggle").addEventListener("click",()=>{const root=$("#app-shell");root.classList.toggle("sidebar-collapsed");root.classList.toggle("mobile-open",!root.classList.contains("sidebar-collapsed"));});
  $("#theme-toggle").addEventListener("click",()=>{state.theme=state.theme==="dark"?"light":"dark";save();render();});
  $("#hidden-upload").addEventListener("change",e=>recordFile(e.target.dataset.target,e.target.files?.[0]));
  document.addEventListener("dragover",e=>{const z=e.target.closest(".dropzone");if(!z)return;e.preventDefault();z.classList.add("dragover");});
  document.addEventListener("dragleave",e=>{const z=e.target.closest(".dropzone");if(z)z.classList.remove("dragover");});
  document.addEventListener("drop",e=>{const z=e.target.closest(".dropzone");if(!z)return;e.preventDefault();z.classList.remove("dragover");recordFile(z.dataset.upload,e.dataTransfer?.files?.[0]);});
  document.addEventListener("click",e=>{
    const n=e.target.closest("[data-screen]");
    if(n&&n.closest(".top-breadcrumb,.sidebar-nav")){
      e.preventDefault();menuOpen=false;navigate(n.dataset.screen);return;
    }
    if(e.target.closest("[data-alias]")){toast(e.target.closest("[data-alias]").dataset.alias+" · prototype navigation");return;}
    const upload=e.target.closest("[data-upload]");if(upload){requestUpload(upload);return;}
    const p=e.target.closest("[data-prompt]");if(p){ask(p.dataset.prompt);return;}
    const chat=e.target.closest("[data-chat]");if(chat){state.activeChat=chat.dataset.chat;save();render();return;}
    const a=e.target.closest("[data-action]");if(!a)return;
    switch(a.dataset.action){
      case "reopen-panel":case "explain":panelOpen=true;chartMenuOpen=false;render();break;
      case "close-panel":panelOpen=false;render();break;
      case "prev-title":moveTitle(-1);break;
      case "next-title":moveTitle(1);break;
      case "accept-title":state.title=titles[state.titleIndex];state.selectedTitle=state.titleIndex;save();render();toast("Title applied to episode");break;
      case "reject-title":state.rejected.push(state.titleIndex);moveTitle(1);toast("Skipped title suggestion");break;
      case "chart-menu":chartMenuOpen=!chartMenuOpen;render();break;
      case "export":chartMenuOpen=false;download("Minute,Spotify retention %,YouTube retention %\n"+makeSeries("retention")[0].map((v,i)=>[i,v.toFixed(1),makeSeries("retention")[1][i].toFixed(1)].join(",")).join("\n"),"sample-retention.csv");toast("Sample CSV exported");break;
      case "new-chat":state.activeChat="New podcast question";if(!state.userChats.includes(state.activeChat))state.userChats.unshift(state.activeChat);save();render();$("#chat-input")?.focus();break;
      case "add-chapter":{const rows=$("#chapters-body");const n=rows.rows.length+1;const tr=document.createElement("tr");tr.innerHTML='<td>'+n+'</td><td><input aria-label="Chapter start time" value="0:00"></td><td><input aria-label="Chapter title" placeholder="New chapter"></td>';rows.appendChild(tr);toast("Chapter row added");break;}
      case "tab-content":state.episodeTab="content";render();break;
      case "format-bold":case "format-italic":case "format-list":case "format-number":case "format-link":{
        const t=$("#description-editor");if(!t)return;const start=t.selectionStart,end=t.selectionEnd,sel=t.value.slice(start,end),mark=({"format-bold":"**","format-italic":"*","format-list":"- ","format-number":"1. ","format-link":"[link](https://example.com)"})[a.dataset.action];const value=a.dataset.action==="format-bold"||a.dataset.action==="format-italic"?mark+(sel||"text")+mark:mark+(sel||"");t.setRangeText(value,start,end,"end");state.description=t.value;save();t.focus();break;
      }
    }
  });
  document.addEventListener("change",e=>{
    if(e.target.matches("[data-platform]")){state.platform[e.target.dataset.platform]=e.target.checked;save();render();}
  });
  document.addEventListener("input",e=>{
    if(e.target.id==="episode-title"){state.title=e.target.value;$("#title-count").textContent=state.title.length;save();}
    if(e.target.id==="description-editor"){state.description=e.target.value;save();}
  });
  $("#episode-tabs").addEventListener("click",e=>{
    const btn=e.target.closest("[data-episode-tab]");if(!btn)return;
    const t=btn.dataset.episodeTab;
    if(screen==="chat"){if(t==="feyai"){render();return;}toast("This tab is a visual prototype · Fey AI remains available");return;}
    if(t==="content"&&screen==="analysis"){navigate("title");return;}
    if(t==="analytics"&&screen!=="analysis"){navigate("analysis");return;}
    state.episodeTab=t;render();
  });
  document.addEventListener("submit",e=>{
    if(e.target.id!=="chat-form")return;e.preventDefault();
    const input=$("#chat-input");const q=input.value.trim();if(q)ask(q);
  });
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(chartMenuOpen||menuOpen){chartMenuOpen=false;menuOpen=false;render();}else if(panelOpen){panelOpen=false;render();}}});
  window.addEventListener("popstate",()=>{const s=new URLSearchParams(location.search).get("screen");if(screens.includes(s)){screen=s;render();}});
  render();
})();