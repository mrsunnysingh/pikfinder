// PikFinder extension popup — search the live API and act on results.
const BASE = "https://www.pikfinder.com";
const grid = document.getElementById("grid");
const input = document.getElementById("q");
let type = "photo";

function open(url) { chrome.tabs.create({ url }); }
function msg(text) { grid.innerHTML = '<div class="msg">' + text + "</div>"; }

function card(r) {
  const el = document.createElement("div");
  el.className = "card";
  const img = document.createElement("img");
  img.src = r.thumbnail || r.preview; img.alt = r.title || ""; img.loading = "lazy";
  el.appendChild(img);
  if (r.type === "video") {
    const b = document.createElement("span"); b.className = "vbadge"; b.textContent = "VIDEO"; el.appendChild(b);
  }
  if (r.creator || r.source) {
    const c = document.createElement("span"); c.className = "cred";
    c.textContent = r.source + (r.creator ? " · " + r.creator : ""); el.appendChild(c);
  }
  const ov = document.createElement("div"); ov.className = "ov";
  if (r.type === "photo") {
    const edit = document.createElement("button"); edit.className = "b-edit"; edit.textContent = "Edit in Studio";
    edit.onclick = () => open(BASE + "/studio?img=" + encodeURIComponent(r.downloadUrl || r.preview || r.thumbnail));
    ov.appendChild(edit);
  }
  const openBtn = document.createElement("button"); openBtn.className = "b-open";
  openBtn.textContent = r.type === "video" ? "Open video" : "Open full";
  openBtn.onclick = () => open(r.downloadUrl || r.originalUrl || r.preview);
  ov.appendChild(openBtn);
  el.appendChild(ov);
  return el;
}

function search() {
  const q = (input.value || "").trim();
  if (!q) { msg("Type something to search."); return; }
  msg("Searching…");
  fetch(BASE + "/api/search?q=" + encodeURIComponent(q) + "&type=" + type + "&per_page=24")
    .then((r) => r.json())
    .then((d) => {
      const items = (d && d.results) || [];
      if (!items.length) { msg("No results — try another search."); return; }
      grid.innerHTML = "";
      items.forEach((r) => grid.appendChild(card(r)));
    })
    .catch(() => msg("Search unavailable right now. Try again shortly."));
}

document.querySelectorAll(".tab").forEach((t) => {
  t.onclick = () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.remove("on"));
    t.classList.add("on");
    type = t.getAttribute("data-type");
    input.placeholder = type === "video" ? "Search free stock videos…" : "Search free stock photos…";
    if (input.value.trim()) search();
  };
});
document.getElementById("go").onclick = search;
input.addEventListener("keydown", (e) => { if (e.key === "Enter") search(); });
input.focus();
