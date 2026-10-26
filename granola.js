(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const escapeText = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const storageKey = "popup-granola-sidebar-demo-v1";
  const workspaces = ["Granola","Ramp","Vercel","Stripe","Perplexity"];
  const navigation = [
    ["agent","AI Agent","sparkles"],["sheets","Sheets","table"],
    ["documents","Documents","file"],["analytics","Analytics","chart"],
    ["skills","Skills","bolt"],["more","More","more"]
  ];
  const initialChats = [
    {id:"launch",name:"Launch a marketing campaign",unread:true},
    {id:"interface",name:"Design a new user interface for...",unread:false}
  ];
  const initialActivities = [
    {id:"approve",group:"urgent",name:"Approve 3 changes",icon:"",unread:true},
    {id:"protect",group:"urgent",name:"Protect CPA or push?",icon:"",unread:true},
    {id:"ga4",group:"urgent",name:"GA4 disconnected",icon:"",unread:true},
    {id:"brief",group:"deliverables",name:"Project Brief",icon:"file",unread:true},
    {id:"monthly",group:"deliverables",name:"Monthly Analytics",icon:"chart",unread:true},
    {id:"budget",group:"deliverables",name:"Budget Sheet",icon:"table",unread:false},
    {id:"traffic",group:"deliverables",name:"Traffic Analytics",icon:"chart",unread:false},
    {id:"recent-launch",group:"recent",name:"Launch a marketing campaign",icon:"",unread:true},
    {id:"recent-design",group:"recent",name:"Design a new user interface for...",icon:"",unread:false}
  ];
  const initialPanels = () => [
    {tab:"home",open:false,search:false,compact:false,selection:"skills"},
    {tab:"home",open:true,search:false,compact:false,selection:"skills"},
    {tab:"activity",open:false,search:false,compact:false,selection:"skills"}
  ];
  let workspace="Granola";
  let chats=initialChats.map(x=>({...x}));
  let projects=["Client Growth","Product Launch"];
  let activities=initialActivities.map(x=>({...x}));
  let panels=initialPanels();
  let toastTimer=null;
  let activeModal=null;

  // Inline SVG icons keep the demo self-contained, with no external fonts or image requests.
  const icons={
    chevron:'<path d="m7 9 5-5 5 5M7 15l5 5 5-5"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4.5 4.5"/>',
    sidebar:'<rect x="3" y="4.5" width="18" height="15" rx="2.4"/><path d="M9 5v14"/>',
    sparkles:'<circle cx="12" cy="12" r="9"/><path d="m12 7 1.2 3.8L17 12l-3.8 1.2L12 17l-1.2-3.8L7 12l3.8-1.2z"/>',
    table:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M8 4v16"/>',
    file:'<path d="M5 3h9l5 5v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v6h5"/>',
    chart:'<path d="M3 19h18M5 19V10h5v9M10 19V5h5v14M15 19v-7h5v7"/>',
    bolt:'<path d="m13 2-9 11h7l-1 9 10-12h-7z"/>',
    more:'<circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/>',
    folder:'<path d="M3 8V6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 10h18"/>',
    plus:'<path d="M12 4v16M4 12h16"/>',
    addCircle:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    members:'<path d="M15 14a4 4 0 1 0-6 0M5 20v-2a6 6 0 0 1 12 0v2M19 5v6M16 8h6"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.5 2.5 0 1 1 4 2c-1 .8-1.8 1.3-1.8 3M12 17.5h.01"/>',
    integrations:'<rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="14" width="7" height="7" rx="1.2"/><path d="M17.5 3v7M14 6.5h7M6.5 14v7M3 17.5h7"/>',
    signout:'<path d="M10 4 4 7v10l6 3M10 12H2M15 8l5 4-5 4M20 12H9"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    back:'<path d="m14 6-6 6 6 6"/>',
    close:'<path d="M5 5 19 19M19 5 5 19"/>'
  };
  const icon=(name,size=22)=>'<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(icons[name]||icons.file)+'</svg>';
  function logo(name="Granola") {
    const label = name.toLowerCase();
    if(label==="granola") return '<span class="workspace-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M19.5 9.2C19.5 5.7 16.5 4 12.1 4c-5.2 0-8.2 3.4-8.2 8.2 0 5 3.1 8 8.1 8 4.6 0 7.6-2.9 7.6-7 0-3.7-2.3-6-6.3-6-3.7 0-5.8 2-5.8 5.2 0 2.8 1.8 4.5 4.2 4.5 2.2 0 3.7-1.1 3.7-2.9 0-1.4-1-2.2-2.5-2.2-1.2 0-2.1.6-2.1 1.8" stroke="#26301d" stroke-width="2.1" stroke-linecap="round"/></svg></span>';
    if(label==="ramp")return '<span class="workspace-symbol ramp" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 17c5.6 0 9-3.3 12-11l-1 7-3.5 4H5Z" fill="#171717"/><path d="M4 19c6 0 10-2 15-9" stroke="#171717" stroke-width="2" stroke-linecap="round"/></svg></span>';
    if(label==="vercel")return '<span class="workspace-symbol vercel" aria-hidden="true"><svg viewBox="0 0 24 24" fill="white"><path d="m12 4 9 15H3z"/></svg></span>';
    if(label==="stripe")return '<span class="workspace-symbol stripe" aria-hidden="true"><svg viewBox="0 0 24 24" fill="white"><path d="M6 7 18 4v12L6 19z"/></svg></span>';
    return '<span class="workspace-symbol perplexity" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.35"><path d="M12 2v20M5 6l7-4 7 4v12l-7 4-7-4zM5 11l7-5 7 5M5 18l7-7 7 7M8 4l8 16"/></svg></span>';
  }
  function save() {
    try {localStorage.setItem(storageKey,JSON.stringify({workspace,projects,chats,activities}));}catch{}
  }
  function restore() {
    try {
      const v=JSON.parse(localStorage.getItem(storageKey)||"null");
      if(!v || typeof v!=="object")return;
      if(workspaces.includes(v.workspace))workspace=v.workspace;
      if(Array.isArray(v.projects))projects=v.projects.filter(x=>typeof x==="string").slice(0,30);
      if(Array.isArray(v.chats))chats=v.chats.filter(x=>x&&typeof x.name==="string").slice(0,30);
      if(Array.isArray(v.activities)) {
        const saved=new Map(v.activities.filter(x=>x&&typeof x.id==="string").map(x=>[x.id,x]));
        activities=initialActivities.map(row=>saved.has(row.id)?{...row,unread:Boolean(saved.get(row.id).unread)}:row);
        for(const row of v.activities)if(row&&String(row.id).startsWith("local-")&&typeof row.name==="string")activities.push(row);
      }
    }catch{}
  }
  function notify(message) {
    const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2800);
  }
  function workspaceMenu(i) {
    const options=workspaces.map(w=>'<button type="button" class="menu-item" role="menuitemradio" aria-checked="'+(workspace===w)+'" data-action="workspace" data-name="'+escapeText(w)+'">'+logo(w)+'<span class="menu-item-label">'+escapeText(w)+'</span>'+(workspace===w?'<span class="menu-check">'+icon("check",14)+'</span>':"")+'</button>').join("");
    const actions=[
      ["members","Invite members"],["help","Support"],
      ["integrations","Integrations"],["signout","Sign out"]
    ];
    return '<div class="menu-popover" role="menu" id="menu-'+i+'" aria-label="Workspace menu">'+options+'<div class="menu-divider" role="separator"></div>'+actions.slice(0,2).map(([name,label])=>'<button type="button" class="menu-item" role="menuitem" data-action="'+name+'"><span class="menu-icon">'+icon(name)+'</span><span>'+label+'</span></button>').join("")+'<div class="menu-divider" role="separator"></div><button type="button" class="menu-item" role="menuitem" data-action="integrations"><span class="menu-icon">'+icon("integrations")+'</span>Integrations</button><div class="menu-divider" role="separator"></div><button type="button" class="menu-item" role="menuitem" data-action="signout"><span class="menu-icon">'+icon("signout")+'</span>Sign out</button></div>';
  }
  function header(i) {
    const state=panels[i];
    return '<header class="rail-header"><div class="header-actions"><button type="button" class="workspace-trigger" data-action="toggle-menu" aria-expanded="'+state.open+'" aria-haspopup="menu" aria-controls="menu-'+i+'">'+logo(workspace)+'<span class="workspace-label">'+escapeText(workspace)+'</span><span class="workspace-caret">'+icon("chevron",18)+'</span></button><div class="header-spacer"></div><button type="button" class="icon-button" data-action="search" title="Search" aria-label="Search workspace">'+icon("search")+'</button><button type="button" class="icon-button" data-action="compact" title="Toggle sidebar focus" aria-label="Toggle sidebar focus">'+icon("sidebar")+'</button></div><div class="rail-tabs" role="tablist" aria-label="Sidebar view"><button type="button" class="rail-tab'+(state.tab==="home"?" active":"")+'" data-action="tab" data-value="home" role="tab" aria-selected="'+(state.tab==="home")+'">Home</button><button type="button" class="rail-tab'+(state.tab==="activity"?" active":"")+'" data-action="tab" data-value="activity" role="tab" aria-selected="'+(state.tab==="activity")+'">Activity</button></div></header>';
  }
  function homeContent(i) {
    const state=panels[i];
    return '<div class="nav-list">'+navigation.map(([id,label,ico])=>'<button type="button" class="nav-row'+(state.selection===id?' selected':'')+'" data-action="nav" data-value="'+id+'"><span class="nav-icon">'+icon(ico)+'</span><span class="nav-label">'+label+'</span></button>').join("")+'</div>'+
      '<section class="rail-section"><h2 class="section-name">Projects</h2>'+projects.map((p,n)=>'<button type="button" class="item-row" data-action="project" data-item="'+n+'"><span class="row-icon">'+icon("folder")+'</span><span class="item-text">'+escapeText(p)+'</span></button>').join("")+'</section>'+
      '<section class="rail-section section-chat"><h2 class="section-name">Chat</h2>'+chats.map((c,n)=>'<button type="button" class="item-row chat-row'+(!c.unread?' muted':'')+'" data-action="chat" data-item="'+n+'"><span class="item-text" title="'+escapeText(c.name)+'">'+escapeText(c.name)+'</span>'+(c.unread?'<span class="indicator"></span>':'')+'</button>').join("")+'</section>';
  }
  function activityContent() {
    return [
      ["urgent","Urgent"],
      ["deliverables","Deliverables"],
      ["recent","Recent"]
    ].map(([key,title])=>'<section class="activity-group activity-'+key+'"><h2 class="sidebar-section-title">'+title+'</h2>'+activities.filter(x=>x.group===key).map(a=>'<button type="button" class="item-row'+(!a.unread&&key==="recent"?' subdued':'')+'" data-action="activity" data-id="'+escapeText(a.id)+'">'+(a.icon?'<span class="row-icon">'+icon(a.icon)+'</span>':'')+'<span class="item-text" title="'+escapeText(a.name)+'">'+escapeText(a.name)+'</span>'+(a.unread?'<span class="activity-dot '+(key==="urgent"?"orange":key==="recent"?"soft":"")+'"></span>':'')+'</button>').join("")+'</section>').join("");
  }
  function searchEntries() {
    return [
      ...navigation.map(([id,label])=>({label,kind:"Navigation",action:"nav",value:id})),
      ...projects.map((label,n)=>({label,kind:"Project",action:"project",value:String(n)})),
      ...chats.map((x,n)=>({label:x.name,kind:"Chat",action:"chat",value:String(n)})),
      ...activities.map(x=>({label:x.name,kind:"Activity",action:"activity",value:x.id}))
    ];
  }
  function searchResults(i,query="") {
    const matches=searchEntries().filter(x=>!query||x.label.toLowerCase().includes(query.toLowerCase())).slice(0,9);
    return matches.length?matches.map(x=>'<button type="button" class="search-result" data-action="search-result" data-type="'+x.action+'" data-value="'+escapeText(x.value)+'">'+icon(x.kind==="Activity"?"sparkles":x.kind==="Project"?"folder":x.kind==="Chat"?"file":"search",18)+'<span>'+escapeText(x.label)+'</span></button>').join(""):'<p class="search-empty">No results found</p>';
  }
  function searchPopup(i) {
    return '<div class="search-overlay" id="search-'+i+'"><label class="search-box">'+icon("search",18)+'<input type="search" placeholder="Search anything..." autocomplete="off" aria-label="Search workspace content" data-search-input="'+i+'"></label><div class="search-results">'+searchResults(i)+'</div></div>';
  }
  function renderPane(i) {
    const panel=$('[data-pane="'+i+'"]');
    const state=panels[i];
    panel.classList.toggle("is-compact",state.compact);
    panel.innerHTML=header(i)+'<div class="rail-content">'+(state.tab==="home"?homeContent(i):activityContent())+'</div><footer class="rail-footer"><button type="button" class="footer-icon" data-action="new" aria-label="New chat or project" title="Create item">'+icon("plus")+'</button><button type="button" class="footer-icon" data-action="new-activity" aria-label="New activity" title="Create activity">'+icon("addCircle")+'</button></footer>'+(state.open?workspaceMenu(i):"")+(state.search?searchPopup(i):"");
  }
  function renderAll() {panels.forEach((_,i)=>renderPane(i));}
  function openDialog(i,kind) {
    activeModal={i,kind};
    let dialog=$("#demo-dialog");
    if(!dialog){
      dialog=document.createElement("dialog");
      dialog.id="demo-dialog";
      dialog.className="demo-dialog";
      document.body.appendChild(dialog);
      dialog.addEventListener("close",()=>{activeModal=null;});
    }
    dialog.innerHTML='<form method="dialog" id="item-form"><h2>Create '+escapeText(kind==="chat"?"new chat":kind==="project"?"project":"activity")+'</h2><p>New items are saved only to this browser.</p><label for="item-name">Name</label><input type="text" id="item-name" name="name" required minlength="2" maxlength="65" placeholder="'+(kind==="project"?"Project name":kind==="activity"?"Activity title":"What are we working on?")+'"><div class="dialog-actions"><button type="button" class="dialog-cancel" id="dialog-cancel">Cancel</button><button type="submit" class="dialog-save">Create</button></div></form>';
    $("#dialog-cancel",dialog).addEventListener("click",()=>dialog.close());
    $("#item-form",dialog).addEventListener("submit",e=>{
      e.preventDefault();
      const name=$("#item-name",dialog).value.trim();
      if(name.length<2){$("#item-name",dialog).setCustomValidity("Enter at least 2 characters");$("#item-name",dialog).reportValidity();return;}
      $("#item-name",dialog).setCustomValidity("");
      if(kind==="project"){projects.push(name);}
      else if(kind==="chat"){chats.unshift({id:"local-"+Date.now(),name,unread:true});panels[i].tab="home";}
      else {activities.unshift({id:"local-"+Date.now(),group:"urgent",name,icon:"",unread:true});panels[i].tab="activity";}
      save();
      dialog.close();
      renderAll();
      notify("Created "+name+" · saved locally");
    });
    dialog.showModal();
    $("#item-name",dialog).focus();
  }
  function act(i,action,value,button) {
    const s=panels[i];
    if(action==="toggle-menu"){s.open=!s.open;s.search=false;renderPane(i);return;}
    if(action==="search"){s.search=!s.search;s.open=false;renderPane(i);if(s.search)$("[data-search-input]",$('[data-pane="'+i+'"]')).focus();return;}
    if(action==="compact"){s.compact=!s.compact;const content=$(".rail-content",$('[data-pane="'+i+'"]'));content.style.opacity=s.compact?".47":"1";notify(s.compact?"Focus mode on":"Focus mode off");return;}
    if(action==="tab"){s.tab=value;s.open=false;s.search=false;renderPane(i);return;}
    if(action==="workspace"){
      workspace=button.dataset.name;s.open=false;save();renderAll();notify("Switched to "+workspace);return;
    }
    if(action==="nav"){s.selection=value;s.open=false;s.search=false;renderPane(i);notify(navigation.find(x=>x[0]===value)?.[1]+" selected");return;}
    if(action==="project"){s.open=false;s.search=false;renderPane(i);notify("Opened "+projects[Number(value)]);return;}
    if(action==="chat"){
      const item=chats[Number(value)];if(!item)return;
      item.unread=false;s.open=false;s.search=false;save();renderAll();notify("Opened "+item.name);return;
    }
    if(action==="activity"){
      const item=activities.find(x=>x.id===value);if(!item)return;
      item.unread=false;s.open=false;s.search=false;save();renderAll();notify("Marked as read: "+item.name);return;
    }
    if(action==="new"){openDialog(i,"chat");return;}
    if(action==="new-activity"){openDialog(i,"activity");return;}
    if(action==="members"){s.open=false;renderPane(i);notify("Invitation settings · demo only");return;}
    if(action==="help"){s.open=false;renderPane(i);notify("Help & support · demo only");return;}
    if(action==="integrations"){s.open=false;renderPane(i);notify("Integrations · demo only");return;}
    if(action==="signout"){s.open=false;renderPane(i);notify("This is a local UI demo — no account to sign out");return;}
    if(action==="search-result"){
      const kind=button.dataset.type;const val=button.dataset.value;
      if(kind==="activity"){s.tab="activity";}
      if(["nav","project","chat"].includes(kind)){s.tab="home";}
      act(i,kind,val,button);return;
    }
  }
  $("#stage").addEventListener("click",e=>{
    const button=e.target.closest("button[data-action]");
    if(!button)return;
    const pane=button.closest("[data-pane]");
    if(!pane)return;
    const i=Number(pane.dataset.pane);
    const action=button.dataset.action;
    const value=button.dataset.value ?? button.dataset.id ?? button.dataset.item ?? "";
    act(i,action,value,button);
  });
  $("#stage").addEventListener("input",e=>{
    if(!e.target.matches("[data-search-input]"))return;
    const container=e.target.closest(".search-overlay");
    $(".search-results",container).innerHTML=searchResults(Number(e.target.dataset.searchInput),e.target.value.trim());
  });
  document.addEventListener("click",e=>{
    if(e.target.closest(".workspace-trigger,.menu-popover,.search-overlay,[data-action=search]"))return;
    let dirty=false;
    panels.forEach(s=>{if(s.open||s.search){s.open=false;s.search=false;dirty=true;}});
    if(dirty)renderAll();
  });
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape" && !$("#demo-dialog")?.open){
      if(panels.some(s=>s.search||s.open)){panels.forEach(s=>{s.open=false;s.search=false;});renderAll();}
    }
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){
      e.preventDefault();const i=0;panels[i].search=true;panels[i].open=false;renderPane(i);$("[data-search-input]",$('[data-pane="0"]')).focus();
    }
  });
  $("#reset-demo").addEventListener("click",()=>{
    try{localStorage.removeItem(storageKey);}catch{}
    workspace="Granola";chats=initialChats.map(x=>({...x}));projects=["Client Growth","Product Launch"];
    activities=initialActivities.map(x=>({...x}));panels=initialPanels();renderAll();notify("Demo reset");
  });
  restore();
  renderAll();
})();