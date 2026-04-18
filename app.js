// ── CONFIG ──────────────────────────────────────────────────
const API_URL = "https://royaleapi.github.io/cr-api-data/json/cards.json";
const IMG_BASE = "https://cdn.royaleapi.com/static/img/cards-150/";

// ── STATE ────────────────────────────────────────────────────
let cards = [];
let filterR = "all"; // rarity filter
let filterT = "all"; // type filter
let sortMode = "name";
let query = "";

// ── DOM REFS ─────────────────────────────────────────────────
const grid = document.getElementById("card-grid");
const loading = document.getElementById("loading");
const empty = document.getElementById("empty");
const overlay = document.getElementById("overlay");

function rarityEs(rarity) {
  const map = {
    Common: "Común",
    Rare: "Rara",
    Epic: "Épica",
    Legendary: "Legendaria",
    Champion: "Campeón",
  };
  return map[rarity] || rarity;
}

function typeEs(type) {
  const map = {
    Troop: "Tropa",
    Building: "Estructura",
    Spell: "Hechizo",
  };
  return map[type] || type;
}

// ── FETCH (REST GET) ─────────────────────────────────────────
fetch(API_URL)
  .then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then((data) => {
    cards = data;
    document.getElementById("count").textContent = data.length;
    loading.style.display = "none";
    render();
  })
  .catch(() => {
    loading.textContent = "Error al cargar los datos.";
  });

// ── Filtrar y organizar ────────────────────────────────────────────
function filtered() {
  let list = cards.slice();

  if (filterR !== "all") list = list.filter((c) => c.rarity === filterR);
  if (filterT !== "all") list = list.filter((c) => c.type === filterT);
  if (query) list = list.filter((c) => c.name.toLowerCase().includes(query));

  const sorters = {
    name: (a, b) => a.name.localeCompare(b.name),
    elixir: (a, b) => (a.elixir || 0) - (b.elixir || 0),
    "elixir-d": (a, b) => (b.elixir || 0) - (a.elixir || 0),
    arena: (a, b) => (a.arena || 0) - (b.arena || 0),
  };

  if (sorters[sortMode]) list.sort(sorters[sortMode]);
  return list;
}

// ── Url imagen ──
function imgUrl(key) {
  return `${IMG_BASE}${key}.png`;
}

// ── RENDER  ───
function render() {
  const list = filtered();
  empty.style.display = list.length ? "none" : "block";
  grid.innerHTML = "";

  list.forEach((card, i) => {
    const rarityLabel = rarityEs(card.rarity);
    const typeLabel = typeEs(card.type);

    const el = document.createElement("div");
    el.className = "card";
    el.dataset.r = card.rarity;
    el.style.animationDelay = `${Math.min(i * 12, 300)}ms`;

    el.innerHTML = `
      <div class="img-wrap">
        <img src="${imgUrl(card.key)}" alt="${card.name}"
             onerror="this.style.opacity='.1'"/>
      </div>
      <div class="card-body">
        <div class="card-name">${card.name}</div>
        <div class="card-line"></div>
        <div class="card-meta">
          <span>${rarityLabel.slice(0, 3).toUpperCase()} · ${typeLabel.slice(0, 3).toUpperCase()}</span>
          <div class="card-elixir">${card.elixir ?? "—"}</div>
        </div>
      </div>`;

    el.addEventListener("click", () => openModal(card));
    grid.appendChild(el);
  });
}

// ── MODAL ─────────────────────────────────────────────────────
function openModal(card) {
  const arena = card.arena === 0 ? "Entrenamiento" : `Arena ${card.arena}`;
  const rarityLabel = rarityEs(card.rarity);
  const typeLabel = typeEs(card.type);

  const mImg = document.getElementById("m-img");
  mImg.src = imgUrl(card.key);
  mImg.onerror = () => {
    mImg.style.opacity = ".1";
  };

  document.getElementById("m-eye").textContent =
    `${rarityLabel} · ${typeLabel}`;
  document.getElementById("m-name").textContent = card.name;
  document.getElementById("m-desc").textContent = card.description;

  document.getElementById("m-tags").innerHTML = `
    <span class="modal-tag">${rarityLabel}</span>
    <span class="modal-tag">${typeLabel}</span>
    ${card.is_evolved ? '<span class="modal-tag acid">Evolucionada</span>' : ""}`;

  document.getElementById("m-stats").innerHTML = `
    <div class="mstat">
      <div class="mstat-label">Elixir</div>
      <div class="mstat-val">${card.elixir ?? "—"}</div>
    </div>
    <div class="mstat">
      <div class="mstat-label">Arena</div>
      <div class="mstat-val" style="font-size:.9rem;padding-top:5px">${arena}</div>
    </div>
    <div class="mstat">
      <div class="mstat-label">ID de carta</div>
      <div class="mstat-val" style="font-size:.8rem;padding-top:7px">${card.id}</div>
    </div>`;

  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  overlay.classList.remove("open");
  document.body.style.overflow = "";
}

// ── MODAL EVENTS ─────────────────────────────────────────────
document.getElementById("close").addEventListener("click", closeModal);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// ── FILTER EVENTS ─────────────────────────────────────────────
document.querySelectorAll("[data-r]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll("[data-r]")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filterR = btn.dataset.r;
    render();
  });
});

document.querySelectorAll("[data-t]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll("[data-t]")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filterT = btn.dataset.t;
    render();
  });
});

document.getElementById("search").addEventListener("input", (e) => {
  query = e.target.value.toLowerCase().trim();
  render();
});

document.getElementById("sort").addEventListener("change", (e) => {
  sortMode = e.target.value;
  render();
});
