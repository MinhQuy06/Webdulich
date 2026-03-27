/* ============================================================
   main.js – Index page logic (load tours from JSON, render)
   ============================================================ */

const API_URL = "tours.json";

async function fetchTours() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Network error");
    return await res.json();
  } catch (e) {
    console.warn("Fetch failed, using embedded data:", e.message);
    return null; // page falls back to static HTML
  }
}

// ---- Index page: hot tours countdown ----
function startCountdown(endMs) {
  const el = document.getElementById("countdown");
  if (!el) return;
  const tick = () => {
    const diff = endMs - Date.now();
    if (diff <= 0) {
      el.textContent = "Đã hết ưu đãi";
      return;
    }
    const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
    el.textContent = `${h}:${m}:${s}`;
  };
  tick();
  setInterval(tick, 1000);
}

// ---- Tour page: search + filter ----
let allTours = [];

function renderTourList(tours) {
  const container = document.getElementById("tourListContainer");
  if (!container) return;
  if (tours.length === 0) {
    container.innerHTML =
      '<p style="text-align:center;color:var(--text-muted);padding:40px">Không tìm thấy tour phù hợp.</p>';
    return;
  }
  const isGrid = container.classList.contains("grid-view");
  container.innerHTML = tours
    .map((t) => {
      const discountBadge =
        t.discount > 0
          ? `<span class="badge-discount">-${t.discount}%</span>`
          : "";
      const slotBadge =
        t.slots <= 6
          ? `<span class="badge-slots">⚡ Còn ${t.slots} chỗ</span>`
          : "";
      const finalPrice =
        t.discount > 0 ? Math.round(t.price * (1 - t.discount / 100)) : t.price;
      const oldPrice =
        t.discount > 0
          ? `<s style="font-size:.78rem;color:var(--text-muted)">${fmtVnd(t.price)}</s> `
          : "";
      return `
    <div class="tour-card-dyn" data-id="${t.id}">
      <div class="tc-img">
        <img src="${t.image}" alt="${t.name}" loading="lazy" onerror="this.src='img/banahilljpg.jpg'" />
        ${discountBadge}${slotBadge}
      </div>
      <div class="tc-body">
        <h3>${t.name}</h3>
        <div class="tc-meta">
          <span>🕐 ${t.duration}</span>
          <span>📍 ${t.location}</span>
          <span>⭐ ${t.rating}</span>
          <span>👥 ${t.people} người</span>
        </div>
        <div class="tc-footer">
          <div class="tc-price">${oldPrice}<strong>${fmtVnd(finalPrice)}</strong></div>
          <div class="tc-btns">
            <button class="btn-detail" onclick="window.location='detail.html?id=${t.id}'">Chi tiết</button>
            <button class="btn-book-dyn" onclick="addToCartById(${t.id})">🛒 Đặt</button>
          </div>
        </div>
      </div>
    </div>`;
    })
    .join("");
}

function addToCartById(id) {
  const t = allTours.find((x) => x.id === id);
  if (t) addToCart(t);
}

function initTourFilters() {
  const searchInput = document.getElementById("searchInput");
  const locationFilter = document.getElementById("locationFilter");
  const priceFilter = document.getElementById("priceFilter");
  const gridBtn = document.getElementById("btnGrid");
  const listBtn = document.getElementById("btnList");
  const container = document.getElementById("tourListContainer");

  function applyFilters() {
    const q = (searchInput?.value || "").toLowerCase();
    const loc = locationFilter?.value || "";
    const price = parseInt(priceFilter?.value || "0");
    let filtered = allTours.filter((t) => {
      const matchQ =
        t.name.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q);
      const matchLoc = !loc || t.category === loc;
      const matchPrice = !price || t.price <= price;
      return matchQ && matchLoc && matchPrice;
    });
    renderTourList(filtered);
  }

  searchInput?.addEventListener("input", applyFilters);
  locationFilter?.addEventListener("change", applyFilters);
  priceFilter?.addEventListener("change", applyFilters);

  gridBtn?.addEventListener("click", () => {
    container.classList.remove("list-view");
    container.classList.add("grid-view");
    gridBtn.classList.add("active");
    listBtn?.classList.remove("active");
    renderTourList(allTours);
  });
  listBtn?.addEventListener("click", () => {
    container.classList.remove("grid-view");
    container.classList.add("list-view");
    listBtn.classList.add("active");
    gridBtn?.classList.remove("active");
    renderTourList(allTours);
  });
}

// ---- Detail page ----
async function initDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"));
  if (!id) return;
  const tours = await fetchTours();
  if (!tours) return;
  const t = tours.find((x) => x.id === id);
  if (!t) return;

  document.title = t.name + " – MinhQuy Travel";
  const container = document.getElementById("detailContainer");
  if (!container) return;
  const finalPrice =
    t.discount > 0 ? Math.round(t.price * (1 - t.discount / 100)) : t.price;
  container.innerHTML = `
    <div class="detail-grid">
      <div class="detail-img-wrap">
        <img src="${t.image}" alt="${t.name}" onerror="this.src='img/banahilljpg.jpg'" />
        ${t.discount > 0 ? `<span class="badge-discount">-${t.discount}%</span>` : ""}
      </div>
      <div class="detail-info">
        <h1>${t.name}</h1>
        <div class="detail-meta">
          <span>📍 ${t.location}</span>
          <span>🕐 ${t.duration}</span>
          <span>👥 ${t.people} người</span>
          <span>⭐ ${t.rating}/5</span>
          <span>✈️ ${t.transport}</span>
        </div>
        <p class="detail-desc">${t.description}</p>
        <div class="detail-itinerary">
          <h3>🗓 Lịch trình</h3>
          <ul>${t.itinerary.map((d) => `<li>${d}</li>`).join("")}</ul>
        </div>
        <div class="detail-book">
          <div class="detail-price">
            ${t.discount > 0 ? `<s>${fmtVnd(t.price)}</s>` : ""}
            <strong>${fmtVnd(finalPrice)}</strong><span>/người</span>
          </div>
          <div class="detail-qty-wrap">
            <label>Số người:</label>
            <div class="qty-ctrl">
              <button onclick="changePeople(-1)">−</button>
              <span id="peopleCount">1</span>
              <button onclick="changePeople(1)">+</button>
            </div>
          </div>
          <button class="btn-primary" onclick="addToCart({id:${t.id},name:'${t.name.replace(/'/g, "\\'")}',price:${finalPrice},image:'${t.image}',qty:1})">🛒 Thêm vào giỏ</button>
        </div>
      </div>
    </div>`;
}

let peopleCount = 1;
function changePeople(d) {
  peopleCount = Math.max(1, peopleCount + d);
  const el = document.getElementById("peopleCount");
  if (el) el.textContent = peopleCount;
}

// ---- DOMContentLoaded ----
document.addEventListener("DOMContentLoaded", async () => {
  // Countdown for hot section
  const end = new Date();
  end.setHours(23, 59, 59, 0);
  startCountdown(end.getTime());

  // Tour list page
  if (document.getElementById("tourListContainer")) {
    const tours = await fetchTours();
    if (tours) {
      allTours = tours;
      renderTourList(tours);
    }
    initTourFilters();
  }

  // Detail page
  if (document.getElementById("detailContainer")) {
    await initDetailPage();
  }
});
