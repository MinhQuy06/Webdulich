let allTours = []; // cache toàn bộ tour đang hiển thị

function startCountdown(endMs) {
  const el = document.getElementById("countdown");
  if (!el) return;
  const tick = () => {
    const diff = endMs - Date.now();
    if (diff <= 0) {
      el.textContent = "Đã hết ưu đãi";
      return;
    }
    //
    const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
    el.textContent = `${h}:${m}:${s}`;
  };
  tick();
  setInterval(tick, 1000);
}

function showListStatus(html) {
  const c = document.getElementById("tourListContainer");
  if (c) c.innerHTML = html;
}

function renderTourList(tours) {
  const container = document.getElementById("tourListContainer");
  if (!container) return;

  if (!tours || tours.length === 0) {
    showListStatus(`
      <div style="text-align:center;padding:60px 20px;color:var(--text-muted)">
        <div style="font-size:3rem;margin-bottom:12px">🔍</div>
        <p style="font-size:1rem">Không tìm thấy tour phù hợp.</p>
      </div>`);
    return;
  }

  container.innerHTML = tours
    .map((t) => {
      const finalPrice =
        t.discount > 0 ? Math.round(t.price * (1 - t.discount / 100)) : t.price;

      const oldPrice =
        t.discount > 0
          ? `<s style="font-size:.76rem;color:var(--text-muted)">${fmtVnd(t.price)}</s> `
          : "";

      const discountBadge =
        t.discount > 0
          ? `<span class="badge-discount">-${t.discount}%</span>`
          : "";

      const slotBadge =
        t.slots > 0 && t.slots <= 6
          ? `<span class="badge-slots">⚡ Còn ${t.slots} chỗ</span>`
          : "";

      return `
      <div class="tour-card-dyn" data-id="${t.id}">
        <div class="tc-img">
          <img src="${t.image || "img/banahilljpg.jpg"}" alt="${t.name}"
               loading="lazy" onerror="this.src='img/banahilljpg.jpg'" />
          ${discountBadge}${slotBadge}
        </div>
        <div class="tc-body">
          <h3>${t.name}</h3>
          <div class="tc-meta">
            <span>🕐 ${t.duration || "—"}</span>
            <span>📍 ${t.location || "—"}</span>
            <span>⭐ ${t.rating || "—"}</span>
            <span>👥 ${t.people || 2} người</span>
          </div>
          <div class="tc-footer">
            <div class="tc-price">
              ${oldPrice}<strong>${fmtVnd(finalPrice)}</strong>
            </div>
            <div class="tc-btns">
              <button class="btn-detail"
                onclick="window.location='detail.html?id=${t.id}'">
                Chi tiết
              </button>
              <button class="btn-book-dyn"
                onclick="goToCheckoutById(${t.id})">
                Đặt ngay
              </button>
            </div>
          </div>
        </div>
      </div>`;
    })
    .join("");

  const countEl = document.getElementById("resultCount");
  if (countEl) countEl.textContent = tours.length;
}

function goToCheckoutById(id) {
  window.location.href = `checkout.html?id=${id}&qty=1`;
}

function applyFilters() {
  const q = (document.getElementById("searchInput")?.value || "").toLowerCase();
  const loc = document.getElementById("locationFilter")?.value || "";
  const price = parseInt(document.getElementById("priceFilter")?.value || "0");

  const filtered = allTours.filter((t) => {
    const matchQ =
      t.name.toLowerCase().includes(q) ||
      (t.location || "").toLowerCase().includes(q);
    const matchLoc = !loc || t.category === loc;
    const matchPrice = !price || t.price <= price;
    return matchQ && matchLoc && matchPrice;
  });

  renderTourList(filtered);
}

function initTourFilters() {
  document
    .getElementById("searchInput")
    ?.addEventListener("input", applyFilters);
  document
    .getElementById("locationFilter")
    ?.addEventListener("change", applyFilters);
  document
    .getElementById("priceFilter")
    ?.addEventListener("change", applyFilters);

  const container = document.getElementById("tourListContainer");
  const gridBtn = document.getElementById("btnGrid");
  const listBtn = document.getElementById("btnList");

  gridBtn?.addEventListener("click", () => {
    container.classList.remove("list-view");
    container.classList.add("grid-view");
    gridBtn.classList.add("active");
    listBtn?.classList.remove("active");
    applyFilters();
  });

  listBtn?.addEventListener("click", () => {
    container.classList.remove("grid-view");
    container.classList.add("list-view");
    listBtn.classList.add("active");
    gridBtn?.classList.remove("active");
    applyFilters();
  });
}

async function loadTourPage() {
  showListStatus(`
    <div style="text-align:center;padding:60px 20px;color:var(--text-muted)">
      <div style="
        width:36px;height:36px;border:3px solid var(--primary-light);
        border-top-color:var(--primary);border-radius:50%;
        animation:spin .7s linear infinite;margin:0 auto 14px;
      "></div>
      <p>Đang tải danh sách tour từ API…</p>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`);

  try {
    const tours = await getTours();
    allTours = tours;
    renderTourList(tours);
    initTourFilters();
  } catch (err) {
    showListStatus(`
      <div style="text-align:center;padding:60px 20px">
        <div style="font-size:3rem;margin-bottom:14px">⚠️</div>
        <h3 style="color:var(--danger);margin-bottom:8px">Không kết nối được API</h3>
        <p style="color:var(--text-muted);margin-bottom:20px">
          Hãy chạy json-server để tải dữ liệu tour.
        </p>
        <code style="
          display:block;background:#1a2340;color:#7dd3fc;
          padding:12px 20px;border-radius:8px;font-size:.88rem;
          max-width:420px;margin:0 auto;
        ">npx json-server --watch data/db.json --port 3000</code>
        <button onclick="loadTourPage()" style="
          margin-top:18px;background:var(--primary);color:#fff;
          border:none;padding:10px 24px;border-radius:8px;
          font-size:.9rem;font-weight:700;cursor:pointer;
        ">🔄 Thử lại</button>
      </div>`);
    console.error("API Error:", err.message);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const end = new Date();
  end.setHours(23, 59, 59, 0);
  startCountdown(end.getTime());

  if (document.getElementById("tourListContainer")) {
    await loadTourPage();
  }
});
