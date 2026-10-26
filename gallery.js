(() => {
  "use strict";

  const cards = [...document.querySelectorAll(".design-card")];
  const filters = [...document.querySelectorAll("[data-filter]")];
  const search = document.querySelector("#search");
  const count = document.querySelector("#visible-count");
  const empty = document.querySelector("#empty-results");
  const reset = document.querySelector("#reset-filters");
  let category = "all";

  function refresh() {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const card of cards) {
      const categoryMatch = category === "all" || card.dataset.category === category;
      const textMatch = !query || (card.dataset.search + " " + card.textContent).toLocaleLowerCase().includes(query);
      const match = categoryMatch && textMatch;
      card.hidden = !match;
      if (match) visible++;
    }
    count.textContent = String(visible).padStart(2, "0");
    empty.hidden = visible !== 0;
  }

  function selectFilter(value) {
    category = ["all", "modal", "sidebar", "dashboard", "demo"].includes(value) ? value : "all";
    for (const button of filters) {
      const selected = button.dataset.filter === category;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    }
    refresh();
  }

  filters.forEach(button => button.addEventListener("click", () => selectFilter(button.dataset.filter)));
  search.addEventListener("input", refresh);
  search.addEventListener("keydown", e => {
    if (e.key === "Escape" && search.value) {
      search.value = "";
      refresh();
      search.blur();
    }
  });
  reset.addEventListener("click", () => {
    search.value = "";
    selectFilter("all");
    search.focus();
  });

  selectFilter("all");
})();
