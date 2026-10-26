(() => {
  "use strict";

  const root = document.documentElement;
  const cards = [...document.querySelectorAll(".piece[data-id]")];
  const filters = [...document.querySelectorAll("[data-filter]")];
  const search = document.querySelector("#search");
  const grid = document.querySelector("#card-grid");
  const visibleCount = document.querySelector("#visible-count");
  const savedCount = document.querySelector("#saved-count");
  const empty = document.querySelector("#empty-results");
  const commandDialog = document.querySelector("#command-palette");
  const commandInput = document.querySelector("#command-input");
  const commandResults = document.querySelector("#command-results");
  const storagePrefix = "popup-gallery-v2-";
  const entries = cards.map(card => ({
    card,
    id: card.dataset.id,
    category: card.dataset.category,
    title: card.querySelector("h3")?.textContent.trim() || "",
    subtitle: card.querySelector(".piece-eyebrow")?.textContent.trim() || "",
    href: card.querySelector(".piece-link")?.getAttribute("href") || "",
    terms: (card.dataset.search + " " + card.textContent).toLocaleLowerCase()
  }));

  const readSetting = (name, fallback) => {
    try { return JSON.parse(localStorage.getItem(storagePrefix + name)) ?? fallback; }
    catch { return fallback; }
  };
  const writeSetting = (name, value) => {
    try { localStorage.setItem(storagePrefix + name, JSON.stringify(value)); }
    catch { /* Browser privacy mode can disable storage; interactions still work. */ }
  };

  let currentFilter = "all";
  let view = readSetting("view", "grid") === "list" ? "list" : "grid";
  let saved = new Set((Array.isArray(readSetting("saved", [])) ? readSetting("saved", []) : []).filter(id => entries.some(entry => entry.id === id)));
  let selectedCommandIndex = 0;
  let commandMatches = [];
  let toastTimer;
  let previousFocus = null;

  function toast(message) {
    const el = document.querySelector("#toast");
    el.textContent = message;
    el.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("visible"), 2600);
  }

  function applyTheme(theme) {
    const isDark = theme === "dark";
    root.dataset.theme = isDark ? "dark" : "light";
    const button = document.querySelector("#theme-button");
    button.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    button.setAttribute("title", isDark ? "Light appearance" : "Dark appearance");
    button.innerHTML = isDark
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.5 1.5m11.2 11.2 1.5 1.5M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20 16.8A8.5 8.5 0 0 1 7.2 4 8.5 8.5 0 1 0 20 16.8Z"/></svg>';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = isDark ? "#151619" : "#f7f7f5";
  }

  function renderFavorites() {
    savedCount.textContent = String(saved.size);
    for (const entry of entries) {
      const button = entry.card.querySelector("[data-favorite]");
      if (!button) continue;
      const marked = saved.has(entry.id);
      button.setAttribute("aria-pressed", String(marked));
      button.setAttribute("aria-label", (marked ? "Remove " : "Save ") + entry.title + (marked ? " from saved studies" : " to saved studies"));
      button.title = marked ? "Remove from saved" : "Save for later";
    }
  }

  function applyView() {
    const list = view === "list";
    grid.classList.toggle("list-view", list);
    for (const button of document.querySelectorAll("[data-view]")) {
      const active = button.dataset.view === view;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    }
  }

  function refresh() {
    const query = search.value.trim().toLocaleLowerCase();
    let count = 0;
    for (const entry of entries) {
      const categoryMatches = currentFilter === "all" || (currentFilter === "favorites" ? saved.has(entry.id) : currentFilter === entry.category);
      const queryMatches = !query || entry.terms.includes(query);
      const show = categoryMatches && queryMatches;
      entry.card.hidden = !show;
      if (show) count++;
    }
    visibleCount.textContent = String(count).padStart(2, "0");
    empty.hidden = count !== 0;
    empty.querySelector("h3").textContent = currentFilter === "favorites" && !search.value.trim() ? "No saved studies yet" : "No interfaces found";
    empty.querySelector("p").textContent = currentFilter === "favorites" && !search.value.trim() ? "Use the bookmark icon on any card to build your own shortlist." : "Try another keyword, or return to the full collection.";
  }

  function selectFilter(value) {
    currentFilter = ["all", "modal", "dashboard", "sidebar", "demo", "favorites"].includes(value) ? value : "all";
    filters.forEach(button => {
      const active = button.dataset.filter === currentFilter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    refresh();
  }

  function renderCommand(query = "") {
    const text = query.trim().toLocaleLowerCase();
    commandMatches = entries.filter(entry => !text || entry.terms.includes(text)).slice(0, 12);
    selectedCommandIndex = Math.min(selectedCommandIndex, Math.max(0, commandMatches.length - 1));
    commandResults.replaceChildren();
    if (!commandMatches.length) {
      const message = document.createElement("div");
      message.className = "command-empty";
      message.textContent = "No matches. Try a design name or category.";
      commandResults.append(message);
      return;
    }
    commandMatches.forEach((entry, index) => {
      const result = document.createElement("button");
      result.type = "button";
      result.className = "command-result" + (index === selectedCommandIndex ? " selected" : "");
      result.id = "command-option-" + index;
      result.setAttribute("role", "option");
      result.setAttribute("aria-selected", String(index === selectedCommandIndex));
      result.innerHTML = '<span class="result-mark" aria-hidden="true">✳</span><span class="result-copy"><strong></strong><small></small></span><span class="result-arrow" aria-hidden="true">↗</span>';
      result.querySelector("strong").textContent = entry.title;
      result.querySelector("small").textContent = entry.subtitle;
      result.addEventListener("click", () => { location.href = entry.href; });
      commandResults.append(result);
    });
    commandInput.setAttribute("aria-activedescendant", "command-option-" + selectedCommandIndex);
  }

  function openCommand() {
    if (commandDialog.open) return;
    previousFocus = document.activeElement;
    selectedCommandIndex = 0;
    commandInput.value = "";
    renderCommand();
    commandDialog.showModal();
    commandInput.focus();
  }
  function closeCommand() {
    if (commandDialog.open) commandDialog.close();
    if (previousFocus?.isConnected) previousFocus.focus();
  }
  function navigateSelection() {
    const target = commandMatches[selectedCommandIndex];
    if (target) location.href = target.href;
  }

  filters.forEach(button => button.addEventListener("click", () => selectFilter(button.dataset.filter)));
  search.addEventListener("input", refresh);
  search.addEventListener("keydown", event => {
    if (event.key === "Escape" && search.value) {
      search.value = "";
      refresh();
      search.blur();
    }
  });
  document.querySelector("#reset-filters").addEventListener("click", () => {
    search.value = "";
    selectFilter("all");
    search.focus();
  });
  for (const button of document.querySelectorAll("[data-view]")) {
    button.addEventListener("click", () => {
      view = button.dataset.view === "list" ? "list" : "grid";
      writeSetting("view", view);
      applyView();
    });
  }
  for (const button of document.querySelectorAll("[data-favorite]")) {
    button.addEventListener("click", event => {
      event.stopPropagation();
      const id = button.dataset.favorite;
      if (saved.has(id)) { saved.delete(id); toast("Removed from saved studies"); }
      else { saved.add(id); toast("Saved to your collection"); }
      writeSetting("saved", [...saved]);
      renderFavorites();
      refresh();
    });
  }
  document.querySelector("#theme-button").addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    writeSetting("theme", nextTheme);
  });
  document.querySelector("#open-command").addEventListener("click", openCommand);
  document.querySelector("#close-command").addEventListener("click", closeCommand);
  commandDialog.addEventListener("click", event => {
    if (event.target === commandDialog) closeCommand();
  });
  commandInput.addEventListener("input", () => {
    selectedCommandIndex = 0;
    renderCommand(commandInput.value);
  });
  commandInput.addEventListener("keydown", event => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!commandMatches.length) return;
      selectedCommandIndex = (selectedCommandIndex + (event.key === "ArrowDown" ? 1 : -1) + commandMatches.length) % commandMatches.length;
      renderCommand(commandInput.value);
      commandResults.querySelector(".command-result.selected")?.scrollIntoView({block:"nearest"});
    } else if (event.key === "Enter") {
      event.preventDefault();
      navigateSelection();
    }
  });
  document.addEventListener("keydown", event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openCommand();
      return;
    }
    if (event.key === "/" && !commandDialog.open) {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (!["input", "textarea", "select"].includes(tag) && !document.activeElement?.isContentEditable) {
        event.preventDefault();
        search.focus();
      }
    }
  });
  commandDialog.addEventListener("close", () => {
    if (previousFocus?.isConnected) previousFocus.focus();
  });
  const theme = readSetting("theme", null) ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(theme);
  renderFavorites();
  applyView();
  selectFilter("all");
})();
