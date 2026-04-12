/* ============================================================
   admin.js – CRUD + Stats  (dùng api.js / json-server)
   ⚠️  api.js phải load TRƯỚC admin.js
   ============================================================ */

let adminTours = [];
let editingId = null;

// ════════════════════════════════════
// HELPERS
// ════════════════════════════════════
const fmtV = (n) => parseInt(n || 0).toLocaleString("vi-VN") + "đ";

function setEl(id, v) {
  const el = document.getElementById(id);
  if (el) el.textContent = v;
}

function showToast(msg, type = "success") {
  const el = document.getElementById("adminToast");
  if (!el) return;
  el.textContent = msg;
  el.style.background = type === "error" ? "#e53935" : "#1a2340";
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 3000);
}

function setLoading(on) {
  const el = document.getElementById("loadingOverlay");
  if (el) el.classList.toggle("active", on);
}

// ════════════════════════════════════
// STATS (mini bar trên section tours)
// ════════════════════════════════════
function updateMiniStats(tours) {
  const vn = tours.filter((t) => t.category === "vn").length;
  const nn = tours.filter((t) => t.category === "nn").length;
  const dis = tours.filter((t) => (t.discount || 0) > 0).length;
  setEl("totalCount", tours.length);
  setEl("totalCount2", tours.length);
  setEl("countVN", vn);
  setEl("countNN", nn);
  setEl("countDiscount", dis);
}

// ════════════════════════════════════
// RENDER TABLE
// ════════════════════════════════════
function renderTable(tours) {
  const tbody = document.getElementById("adminTbody");
  if (!tbody) return;

  if (!tours || tours.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">
          <div style="font-size:2.5rem;margin-bottom:10px">🔍</div>
          Chưa có tour nào. Hãy thêm tour mới!
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = tours
    .map((t) => {
      const isVN = t.category === "vn";
      const badge = isVN
        ? `<span style="background:#e8f0fe;color:var(--primary);padding:3px 10px;border-radius:100px;font-size:.74rem;font-weight:700">🇻🇳 VN</span>`
        : `<span style="background:#fff3e8;color:var(--accent);padding:3px 10px;border-radius:100px;font-size:.74rem;font-weight:700">🌍 NN</span>`;

      return `
      <tr>
        <td style="color:var(--text-muted);font-size:.78rem;font-weight:600">#${t.id}</td>
        <td>
          <div style="display:flex;align-items:center;gap:11px">
            <img src="${t.image || "img/banahilljpg.jpg"}"
                 style="width:52px;height:38px;object-fit:cover;border-radius:8px;flex-shrink:0"
                 onerror="this.src='img/banahilljpg.jpg'"/>
            <div>
              <strong style="font-size:.87rem;color:var(--text)">${t.name}</strong>
              ${
                t.discount > 0
                  ? `<span style="display:block;font-size:.71rem;color:var(--danger);margin-top:2px">🔥 Giảm ${t.discount}%</span>`
                  : ""
              }
            </div>
          </div>
        </td>
        <td style="color:var(--text-muted);font-size:.84rem">${t.location || "—"}</td>
        <td style="color:var(--text-muted);font-size:.84rem">${t.duration || "—"}</td>
        <td style="color:var(--accent);font-weight:700;white-space:nowrap">${fmtV(t.price)}</td>
        <td>${badge}</td>
        <td style="white-space:nowrap">
          <button class="admin-btn edit-btn" onclick="openEdit(${t.id})">✏️ Sửa</button>
          <button class="admin-btn del-btn"  onclick="handleDelete(${t.id})">🗑 Xóa</button>
        </td>
      </tr>`;
    })
    .join("");
}

// ════════════════════════════════════
// LOAD & RENDER (tours section)
// ════════════════════════════════════
let _searchTimer = null;

async function loadAndRender(q = "") {
  setLoading(true);
  try {
    const tours = q ? await searchTours({ q }) : await getTours();
    adminTours = tours;
    renderTable(tours);
    updateMiniStats(tours);
    setEl("totalCount", tours.length);
  } catch (err) {
    console.error(err);
    showToast(
      "❌ Không kết nối API. Chạy: npx json-server --watch data/db.json --port 3000",
      "error",
    );
    const tbody = document.getElementById("adminTbody");
    if (tbody)
      tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:40px">
          <div style="color:var(--danger);font-size:1rem;font-weight:700;margin-bottom:10px">⚠️ Không kết nối được API</div>
          <code style="background:#1a2340;color:#7dd3fc;padding:8px 16px;border-radius:8px;font-size:.82rem">
            npx json-server --watch data/db.json --port 3000
          </code>
        </td>
      </tr>`;
  } finally {
    setLoading(false);
  }
}

// ════════════════════════════════════
// FORM MODAL
// ════════════════════════════════════
function openAdd() {
  editingId = null;
  setEl("formTitle", "➕ Thêm Tour Mới");
  document.getElementById("tourForm").reset();
  document.getElementById("tourId").value = "";
  document.getElementById("fImagePreview").style.display = "none";
  openModal();
}

async function openEdit(id) {
  setLoading(true);
  try {
    const t = await getTourById(id);
    if (!t) {
      showToast("❌ Không tìm thấy tour!", "error");
      return;
    }
    editingId = id;
    setEl("formTitle", "✏️ Chỉnh sửa Tour");

    document.getElementById("tourId").value = t.id;
    document.getElementById("fName").value = t.name || "";
    document.getElementById("fLocation").value = t.location || "";
    document.getElementById("fCategory").value = t.category || "vn";
    document.getElementById("fPrice").value = t.price || "";
    document.getElementById("fDuration").value = t.duration || "";
    document.getElementById("fDiscount").value = t.discount || 0;
    document.getElementById("fSlots").value = t.slots || 0;
    document.getElementById("fPeople").value = t.people || 2;
    document.getElementById("fRating").value = t.rating || 4.5;
    document.getElementById("fImage").value = t.image || "";
    document.getElementById("fDesc").value = t.description || "";

    // Show image preview
    const prev = document.getElementById("fImagePreview");
    if (t.image) {
      prev.src = t.image;
      prev.style.display = "block";
    } else prev.style.display = "none";

    openModal();
  } catch (err) {
    showToast("❌ Lỗi tải tour: " + err.message, "error");
  } finally {
    setLoading(false);
  }
}

function openModal() {
  document.getElementById("formModal").classList.add("open");
  document.getElementById("formOverlay").classList.add("open");
  setTimeout(() => document.getElementById("fName")?.focus(), 100);
}

function closeModal() {
  document.getElementById("formModal").classList.remove("open");
  document.getElementById("formOverlay").classList.remove("open");
  editingId = null;
}

// ════════════════════════════════════
// SAVE FORM
// ════════════════════════════════════
async function saveTour(e) {
  e.preventDefault();

  const name = document.getElementById("fName").value.trim();
  const location = document.getElementById("fLocation").value.trim();
  const category = document.getElementById("fCategory").value;
  const price = parseInt(document.getElementById("fPrice").value) || 0;
  const duration = document.getElementById("fDuration").value.trim();
  const discount = parseInt(document.getElementById("fDiscount").value) || 0;
  const slots = parseInt(document.getElementById("fSlots").value) || 0;
  const people = parseInt(document.getElementById("fPeople").value) || 2;
  const rating = parseFloat(document.getElementById("fRating").value) || 4.5;
  const image = document.getElementById("fImage").value.trim();
  const desc = document.getElementById("fDesc").value.trim();

  if (!name || !location || !price) {
    showToast("❌ Vui lòng điền: Tên, Địa điểm, Giá!", "error");
    return;
  }

  const btn = document.getElementById("saveBtn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "⏳ Đang lưu…";
  }

  const data = {
    name,
    location,
    category,
    price,
    duration,
    discount,
    slots,
    people,
    rating,
    image,
    description: desc,
    departure: "TP.HCM",
    transport: "Máy bay",
    itinerary: [],
    includes: [],
    excludes: [],
  };

  try {
    if (editingId !== null) {
      const existing = adminTours.find((x) => x.id === editingId) || {};
      await updateTour(editingId, { ...existing, ...data, id: editingId });
      showToast("✅ Cập nhật tour thành công!");
    } else {
      await addTour(data);
      showToast("✅ Thêm tour mới thành công!");
    }
    closeModal();
    await loadAndRender(document.getElementById("adminSearch")?.value || "");
  } catch (err) {
    showToast("❌ Lỗi lưu: " + err.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "💾 Lưu tour";
    }
  }
}

// ════════════════════════════════════
// DELETE
// ════════════════════════════════════
async function handleDelete(id) {
  const t = adminTours.find((x) => x.id === id);
  if (
    !confirm(
      `Xóa tour "${t?.name || "#" + id}"?\nHành động này không thể hoàn tác.`,
    )
  )
    return;
  setLoading(true);
  try {
    await deleteTour(id);
    showToast(`🗑 Đã xóa tour thành công!`);
    await loadAndRender(document.getElementById("adminSearch")?.value || "");
  } catch (err) {
    showToast("❌ Lỗi xóa: " + err.message, "error");
  } finally {
    setLoading(false);
  }
}

// ════════════════════════════════════
// STATS PAGE
// ════════════════════════════════════
async function renderStatsPage() {
  try {
    const tours = await getTours();
    const total = tours.length;
    const vn = tours.filter((t) => t.category === "vn").length;
    const nn = tours.filter((t) => t.category === "nn").length;
    const discount = tours.filter((t) => (t.discount || 0) > 0).length;

    // Big cards
    setEl("statTotal", total);
    setEl("statVN", vn);
    setEl("statNN", nn);
    setEl("statDiscount", discount);

    // Progress bars on cards
    const setPct = (id, pct) => {
      const el = document.getElementById(id);
      if (el) el.style.width = Math.min(100, Math.max(4, pct)) + "%";
    };
    setPct("barTotal", 100);
    setPct("barVN", total > 0 ? (vn / total) * 100 : 0);
    setPct("barNN", total > 0 ? (nn / total) * 100 : 0);
    setPct("barDiscount", total > 0 ? (discount / total) * 100 : 0);

    // Chart: loại tour
    const chartCat = document.getElementById("chartCategory");
    if (chartCat) {
      if (total === 0) {
        chartCat.innerHTML =
          '<p style="color:var(--text-muted);font-size:.84rem">Chưa có dữ liệu</p>';
      } else {
        chartCat.innerHTML = [
          { label: "🇻🇳 Việt Nam", count: vn, color: "var(--primary)" },
          { label: "🌍 Nước ngoài", count: nn, color: "var(--accent)" },
          { label: "🔥 Giảm giá", count: discount, color: "#e53935" },
        ]
          .map((r) => {
            const pct = Math.round((r.count / total) * 100);
            return `
            <div class="chart-row">
              <span class="chart-label">${r.label}</span>
              <div class="chart-bar-bg">
                <div class="chart-bar-fill" style="width:${pct}%;background:${r.color}"></div>
              </div>
              <span class="chart-pct">${r.count} / ${pct}%</span>
            </div>`;
          })
          .join("");
      }
    }

    // Chart: mức giá
    const chartPrice = document.getElementById("chartPrice");
    if (chartPrice) {
      const ranges = [
        { label: "Dưới 1 triệu", min: 0, max: 1e6, color: "#22c55e" },
        { label: "1 – 5 triệu", min: 1e6, max: 5e6, color: "var(--primary)" },
        { label: "5 – 10 triệu", min: 5e6, max: 10e6, color: "var(--accent)" },
        { label: "Trên 10 triệu", min: 10e6, max: Infinity, color: "#e53935" },
      ];
      chartPrice.innerHTML = ranges
        .map((r) => {
          const count = tours.filter(
            (t) => t.price >= r.min && t.price < r.max,
          ).length;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return `
          <div class="chart-row">
            <span class="chart-label">${r.label}</span>
            <div class="chart-bar-bg">
              <div class="chart-bar-fill" style="width:${pct}%;background:${r.color}"></div>
            </div>
            <span class="chart-pct">${count} / ${pct}%</span>
          </div>`;
        })
        .join("");
    }

    // Top 5 đắt nhất
    const topBody = document.getElementById("statsTopBody");
    if (topBody) {
      const top5 = [...tours].sort((a, b) => b.price - a.price).slice(0, 5);
      const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
      topBody.innerHTML =
        top5.length === 0
          ? '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted)">Chưa có dữ liệu</td></tr>'
          : top5
              .map((t, i) => {
                const isVN = t.category === "vn";
                return `
              <tr>
                <td style="text-align:center;font-size:1.1rem">${medals[i]}</td>
                <td><strong style="font-size:.87rem">${t.name}</strong></td>
                <td style="color:var(--text-muted);font-size:.84rem">${t.location || "—"}</td>
                <td>
                  <span style="background:${isVN ? "#e8f0fe" : "#fff3e8"};color:${isVN ? "var(--primary)" : "var(--accent)"};padding:3px 10px;border-radius:100px;font-size:.74rem;font-weight:700">
                    ${isVN ? "🇻🇳 VN" : "🌍 NN"}
                  </span>
                </td>
                <td style="color:var(--accent);font-weight:700">${fmtV(t.price)}</td>
                <td>⭐ ${t.rating || "—"}</td>
              </tr>`;
              })
              .join("");
    }

    // Tour giảm giá
    const discBody = document.getElementById("statsDiscountBody");
    if (discBody) {
      const disc = tours
        .filter((t) => (t.discount || 0) > 0)
        .sort((a, b) => b.discount - a.discount);
      discBody.innerHTML =
        disc.length === 0
          ? '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted)">Không có tour nào đang giảm giá</td></tr>'
          : disc
              .map((t) => {
                const fp = Math.round(t.price * (1 - t.discount / 100));
                return `
              <tr>
                <td><strong style="font-size:.87rem">${t.name}</strong></td>
                <td style="color:var(--text-muted);text-decoration:line-through;font-size:.84rem">${fmtV(t.price)}</td>
                <td>
                  <span style="background:#ffeaea;color:#e53935;padding:4px 12px;border-radius:100px;font-weight:700;font-size:.8rem">
                    -${t.discount}%
                  </span>
                </td>
                <td style="color:var(--accent);font-weight:700">${fmtV(fp)}</td>
                <td style="font-size:.84rem">${t.slots > 0 ? `⚡ Còn ${t.slots} chỗ` : "—"}</td>
              </tr>`;
              })
              .join("");
    }
  } catch (err) {
    console.error("Stats error:", err);
    showToast("❌ Lỗi tải thống kê: " + err.message, "error");
  }
}

// ════════════════════════════════════
// INIT
// ════════════════════════════════════
document.addEventListener("DOMContentLoaded", async () => {
  // Load dữ liệu tours
  await loadAndRender();

  // Search (debounce)
  document.getElementById("adminSearch")?.addEventListener("input", (e) => {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => loadAndRender(e.target.value), 350);
  });

  // Form
  document.getElementById("tourForm")?.addEventListener("submit", saveTour);
  document.getElementById("addTourBtn")?.addEventListener("click", openAdd);
  document
    .getElementById("closeFormBtn")
    ?.addEventListener("click", closeModal);
  document
    .getElementById("cancelFormBtn")
    ?.addEventListener("click", closeModal);
  document.getElementById("formOverlay")?.addEventListener("click", closeModal);

  // Sidebar mobile toggle
  document.getElementById("sidebarToggle")?.addEventListener("click", () => {
    const sb = document.getElementById("sidebar");
    // Mobile: dùng class mobile-open; Desktop: dùng collapsed
    if (window.innerWidth <= 768) sb.classList.toggle("mobile-open");
    else {
      sb.classList.toggle("collapsed");
      document.getElementById("adminMain")?.classList.toggle("expanded");
    }
  });
});
