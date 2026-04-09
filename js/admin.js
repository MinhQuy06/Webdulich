// ============================================================
// CHUYỂN SECTION (Tours ↔ Thống kê)
// ============================================================
function showSection(name) {
  ["tours", "stats"].forEach((s) => {
    const el = document.getElementById(`section-${s}`);
    if (el) el.style.display = s === name ? "block" : "none";
  });

  // Active sidebar
  document
    .querySelectorAll(".snav-item")
    .forEach((el) => el.classList.remove("active"));
  const activeLink = document.querySelector(`.snav-item[onclick*="${name}"]`);
  if (activeLink) activeLink.classList.add("active");

  // Load thống kê khi chuyển sang
  if (name === "stats") renderStatsPage();
}

// ============================================================
// RENDER TRANG THỐNG KÊ ĐẦY ĐỦ
// ============================================================
function fmtVndStats(n) {
  return parseInt(n || 0).toLocaleString("vi-VN") + "đ";
}

async function renderStatsPage() {
  try {
    const tours = await getTours();
    const total = tours.length;
    const vn = tours.filter((t) => t.category === "vn").length;
    const nn = tours.filter((t) => t.category === "nn").length;
    const discount = tours.filter((t) => (t.discount || 0) > 0).length;

    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };
    set("statTotal", total);
    set("statVN", vn);
    set("statNN", nn);
    set("statDiscount", discount);

    // Biểu đồ phân bổ loại
    const chartCat = document.getElementById("chartCategory");
    if (chartCat && total > 0) {
      const rows = [
        { label: "🇻🇳 Việt Nam", count: vn, color: "var(--primary)" },
        { label: "🌍 Quốc tế", count: nn, color: "var(--accent)" },
        { label: "🔥 Giảm giá", count: discount, color: "#e53935" },
      ];
      chartCat.innerHTML = rows
        .map((r) => {
          const pct = Math.round((r.count / total) * 100);
          return `
          <div class="chart-row">
            <span class="chart-label">${r.label}</span>
            <div class="chart-bar-bg">
              <div class="chart-bar-fill" style="width:${pct}%;background:${r.color}"></div>
            </div>
            <span class="chart-pct">${r.count} tour (${pct}%)</span>
          </div>`;
        })
        .join("");
    }

    // Biểu đồ mức giá
    const chartPrice = document.getElementById("chartPrice");
    if (chartPrice) {
      const ranges = [
        { label: "Dưới 1 triệu", min: 0, max: 1000000, color: "#22c55e" },
        {
          label: "1 – 5 triệu",
          min: 1000000,
          max: 5000000,
          color: "var(--primary)",
        },
        {
          label: "5 – 10 triệu",
          min: 5000000,
          max: 10000000,
          color: "var(--accent)",
        },
        {
          label: "Trên 10 triệu",
          min: 10000000,
          max: Infinity,
          color: "#e53935",
        },
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
            <span class="chart-pct">${count} tour (${pct}%)</span>
          </div>`;
        })
        .join("");
    }

    // Top 5 đắt nhất
    const topBody = document.getElementById("statsTopBody");
    if (topBody) {
      const top5 = [...tours].sort((a, b) => b.price - a.price).slice(0, 5);
      topBody.innerHTML =
        top5
          .map((t, i) => {
            const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
            const isVN = t.category === "vn";
            return `
          <tr>
            <td style="text-align:center;font-size:1.1rem">${medals[i]}</td>
            <td><strong style="font-size:.87rem">${t.name}</strong></td>
            <td>${t.location || "—"}</td>
            <td>
              <span style="background:${isVN ? "#e8f0fe" : "#fff3e8"};color:${isVN ? "var(--primary)" : "var(--accent)"};
                           padding:3px 10px;border-radius:100px;font-size:.75rem;font-weight:700">
                ${isVN ? "🇻🇳 VN" : "🌍 NN"}
              </span>
            </td>
            <td style="color:var(--accent);font-weight:700">${fmtVndStats(t.price)}</td>
            <td>⭐ ${t.rating || "—"}</td>
          </tr>`;
          })
          .join("") ||
        '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted)">Chưa có dữ liệu</td></tr>';
    }

    // Bảng giảm giá
    const discBody = document.getElementById("statsDiscountBody");
    if (discBody) {
      const discTours = tours
        .filter((t) => (t.discount || 0) > 0)
        .sort((a, b) => b.discount - a.discount);
      discBody.innerHTML =
        discTours.length === 0
          ? '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted)">Không có tour nào đang giảm giá</td></tr>'
          : discTours
              .map((t) => {
                const fp = Math.round(t.price * (1 - t.discount / 100));
                return `
              <tr>
                <td><strong style="font-size:.87rem">${t.name}</strong></td>
                <td style="color:var(--text-muted);text-decoration:line-through">${fmtVndStats(t.price)}</td>
                <td><span style="background:#ffeaea;color:#e53935;padding:4px 12px;border-radius:100px;font-weight:700">-${t.discount}%</span></td>
                <td style="color:var(--accent);font-weight:700">${fmtVndStats(fp)}</td>
                <td>${t.slots > 0 ? "⚡ Còn " + t.slots + " chỗ" : "—"}</td>
              </tr>`;
              })
              .join("");
    }
  } catch (err) {
    console.error("Stats error:", err);
    showAdminToast("❌ Lỗi tải thống kê: " + err.message, "error");
  }
}

/* ============================================================
   admin.js – CRUD Admin Panel (dùng api.js / json-server)
   ============================================================ */

/* Lưu ý: file này load SAU api.js nên dùng trực tiếp
   các hàm: getTours, getTourById, addTour, updateTour,
            deleteTour, calcStats                          */

let adminTours = []; // cache danh sách hiện tại
let editingId = null; // null = thêm mới, số = đang sửa

// ============================================================
// HELPERS
// ============================================================
function fmtVndAdmin(n) {
  return parseInt(n || 0).toLocaleString("vi-VN") + "đ";
}

function showAdminToast(msg, type = "success") {
  const el = document.getElementById("adminToast");
  if (!el) return;
  el.textContent = msg;
  el.style.background = type === "error" ? "#e53935" : "#1a2340";
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 3200);
}

// Hiển thị / ẩn loading overlay
function setLoading(on) {
  const el = document.getElementById("loadingOverlay");
  if (el) el.style.display = on ? "flex" : "none";
}

// ============================================================
// STATS
// ============================================================
function renderStats(tours) {
  const s = calcStats(tours);
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };
  set("totalCount", s.total);
  set("totalCount2", s.total);
  set("countVN", s.vn);
  set("countNN", s.nn);
  set("countDiscount", s.discount);
}

// ============================================================
// RENDER TABLE
// ============================================================
function renderAdminTable(tours) {
  const tbody = document.getElementById("adminTbody");
  if (!tbody) return;

  if (!tours || tours.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:36px;color:var(--text-muted)">
          Chưa có tour nào. Hãy thêm tour mới!
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = tours
    .map((t) => {
      const isVN = t.category === "vn";
      const catBadge = isVN
        ? `<span style="background:#e8f0fe;color:var(--primary);
                      padding:3px 10px;border-radius:100px;
                      font-size:.76rem;font-weight:700">🇻🇳 VN</span>`
        : `<span style="background:#fff3e8;color:var(--accent);
                      padding:3px 10px;border-radius:100px;
                      font-size:.76rem;font-weight:700">🌍 NN</span>`;

      return `
      <tr>
        <td style="color:var(--text-muted);font-size:.8rem">#${t.id}</td>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <img src="${t.image || "img/banahilljpg.jpg"}"
                 style="width:48px;height:36px;object-fit:cover;border-radius:6px;flex-shrink:0"
                 onerror="this.src='img/banahilljpg.jpg'" />
            <div>
              <strong style="font-size:.88rem">${t.name}</strong>
              ${
                t.discount > 0
                  ? `<span style="display:block;font-size:.72rem;color:var(--danger)">
                     Giảm ${t.discount}%
                   </span>`
                  : ""
              }
            </div>
          </div>
        </td>
        <td>${t.location || "—"}</td>
        <td>${t.duration || "—"}</td>
        <td style="color:var(--accent);font-weight:700;white-space:nowrap">
          ${fmtVndAdmin(t.price)}
        </td>
        <td>${catBadge}</td>
        <td style="white-space:nowrap">
          <button class="admin-btn edit-btn" onclick="openEditForm(${t.id})">✏️ Sửa</button>
          <button class="admin-btn del-btn"  onclick="handleDelete(${t.id})">🗑 Xóa</button>
        </td>
      </tr>`;
    })
    .join("");
}

// ============================================================
// LOAD & REFRESH
// ============================================================
async function loadAndRender(filterText = "") {
  setLoading(true);
  try {
    // Dùng searchTours nếu có query, ngược lại lấy tất cả
    const tours = filterText.trim()
      ? await searchTours({ q: filterText })
      : await getTours();

    adminTours = tours; // cập nhật cache
    renderAdminTable(tours);
    renderStats(tours); // stats luôn tính từ TOÀN BỘ (không filter)
  } catch (err) {
    console.error(err);
    showAdminToast(
      "❌ Không kết nối được API. Chạy: npx json-server --watch db.json",
      "error",
    );
    const tbody = document.getElementById("adminTbody");
    if (tbody)
      tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:36px;color:var(--danger)">
          ⚠️ Không thể kết nối API.<br/>
          <small>Chạy lệnh: <code>npx json-server --watch db.json --port 3000</code></small>
        </td>
      </tr>`;
  } finally {
    setLoading(false);
  }
}

// Stats luôn lấy toàn bộ (không bị ảnh hưởng bởi filter)
async function refreshStats() {
  try {
    const all = await getTours();
    renderStats(all);
  } catch {
    /* ignore */
  }
}

// ============================================================
// FORM MODAL – MỞ / ĐÓNG
// ============================================================
function openAddForm() {
  editingId = null;
  document.getElementById("formTitle").textContent = "➕ Thêm Tour Mới";
  document.getElementById("tourForm").reset();
  document.getElementById("tourId").value = "";
  document.getElementById("formModal").classList.add("open");
  document.getElementById("formOverlay").classList.add("open");
  document.getElementById("fName")?.focus();
}

async function openEditForm(id) {
  setLoading(true);
  try {
    // Lấy dữ liệu mới nhất từ API
    const t = await getTourById(id);
    if (!t) {
      showAdminToast("❌ Không tìm thấy tour!", "error");
      return;
    }

    editingId = id;
    document.getElementById("formTitle").textContent = "✏️ Chỉnh sửa Tour";

    // Điền vào form
    document.getElementById("tourId").value = t.id;
    document.getElementById("fName").value = t.name || "";
    document.getElementById("fLocation").value = t.location || "";
    document.getElementById("fCategory").value = t.category || "vn";
    document.getElementById("fDuration").value = t.duration || "";
    document.getElementById("fPrice").value = t.price || "";
    document.getElementById("fDiscount").value = t.discount || 0;
    document.getElementById("fSlots").value = t.slots || 0;
    document.getElementById("fPeople").value = t.people || 2;
    document.getElementById("fRating").value = t.rating || 4.5;
    document.getElementById("fImage").value = t.image || "";
    document.getElementById("fDesc").value = t.description || "";

    document.getElementById("formModal").classList.add("open");
    document.getElementById("formOverlay").classList.add("open");
    document.getElementById("fName")?.focus();
  } catch (err) {
    showAdminToast("❌ Lỗi khi tải tour: " + err.message, "error");
  } finally {
    setLoading(false);
  }
}

function closeForm() {
  document.getElementById("formModal").classList.remove("open");
  document.getElementById("formOverlay").classList.remove("open");
  editingId = null;
}

// ============================================================
// LƯU FORM (THÊM / SỬA)
// ============================================================
async function saveTourForm(e) {
  e.preventDefault();

  // Đọc giá trị từ form
  const name = document.getElementById("fName").value.trim();
  const location = document.getElementById("fLocation").value.trim();
  const category = document.getElementById("fCategory").value;
  const duration = document.getElementById("fDuration").value.trim();
  const price = parseInt(document.getElementById("fPrice").value) || 0;
  const discount = parseInt(document.getElementById("fDiscount").value) || 0;
  const slots = parseInt(document.getElementById("fSlots").value) || 0;
  const people = parseInt(document.getElementById("fPeople").value) || 2;
  const rating = parseFloat(document.getElementById("fRating").value) || 4.5;
  const image = document.getElementById("fImage").value.trim();
  const desc = document.getElementById("fDesc").value.trim();

  // Validate
  if (!name || !location || !price) {
    showAdminToast("❌ Vui lòng điền: Tên, Địa điểm, Giá!", "error");
    return;
  }

  const tourData = {
    name,
    location,
    category,
    duration,
    price,
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

  // Disable nút để tránh double submit
  const saveBtn = document.querySelector(".btn-save");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Đang lưu…";
  }

  try {
    if (editingId !== null) {
      // ── SỬA: PUT /tours/:id ──
      // Giữ lại itinerary, includes, excludes cũ nếu có
      const existing = adminTours.find((x) => x.id === editingId) || {};
      await updateTour(editingId, {
        ...existing, // giữ các field cũ (itinerary, includes, excludes…)
        ...tourData, // ghi đè với dữ liệu mới
        id: editingId, // đảm bảo id không đổi
      });
      showAdminToast("✅ Cập nhật tour thành công!");
    } else {
      // ── THÊM MỚI: POST /tours ──
      await addTour(tourData);
      showAdminToast("✅ Thêm tour mới thành công!");
    }

    closeForm();
    await loadAndRender(document.getElementById("adminSearch")?.value || "");
  } catch (err) {
    showAdminToast("❌ Lỗi lưu tour: " + err.message, "error");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "💾 Lưu";
    }
  }
}

// ============================================================
// XÓA TOUR
// ============================================================
async function handleDelete(id) {
  const tour = adminTours.find((x) => x.id === id);
  const name = tour?.name || `#${id}`;

  if (
    !confirm(
      `Bạn có chắc muốn xóa tour "${name}" không?\nHành động này không thể hoàn tác.`,
    )
  )
    return;

  setLoading(true);
  try {
    await deleteTour(id);
    showAdminToast(`🗑 Đã xóa tour "${name}" thành công!`);
    await loadAndRender(document.getElementById("adminSearch")?.value || "");
  } catch (err) {
    showAdminToast("❌ Lỗi xóa tour: " + err.message, "error");
  } finally {
    setLoading(false);
  }
}

// ============================================================
// SEARCH (realtime)
// ============================================================
let _searchTimer = null;
function onSearchInput(e) {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => {
    loadAndRender(e.target.value);
  }, 350); // debounce 350ms
}

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  // Load dữ liệu
  await loadAndRender();

  // Search
  document
    .getElementById("adminSearch")
    ?.addEventListener("input", onSearchInput);

  // Form events
  document.getElementById("tourForm")?.addEventListener("submit", saveTourForm);
  document.getElementById("addTourBtn")?.addEventListener("click", openAddForm);
  document.getElementById("closeFormBtn")?.addEventListener("click", closeForm);
  document
    .getElementById("cancelFormBtn")
    ?.addEventListener("click", closeForm);
  document.getElementById("formOverlay")?.addEventListener("click", closeForm);
});
