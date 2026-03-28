/* ============================================================
   admin.js – CRUD Admin Panel  (fixed)
   ============================================================ */

const ADMIN_KEY = "mq_tours_admin";

// --- Load dữ liệu: ưu tiên localStorage, fallback data/tours.json ---
async function initAdminData() {
  const stored = localStorage.getItem(ADMIN_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      /* bad JSON – reload from file */
    }
  }
  // Thử data/tours.json trước, sau đó tours.json
  for (const path of ["data/tours.json", "tours.json"]) {
    try {
      const res = await fetch(path);
      if (!res.ok) continue;
      const data = await res.json();
      localStorage.setItem(ADMIN_KEY, JSON.stringify(data));
      return data;
    } catch {
      /* try next */
    }
  }
  return []; // trả mảng rỗng nếu không load được
}

function saveAdminData(data) {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(data));
}

function fmtVndAdmin(n) {
  return parseInt(n).toLocaleString("vi-VN") + "đ";
}

let adminTours = [];
let editingId = null;

// ---- Cập nhật tất cả stat cards ----
function updateStats() {
  const total = adminTours.length;
  const vn = adminTours.filter((t) => t.category === "vn").length;
  const nn = adminTours.filter((t) => t.category === "nn").length;
  const discount = adminTours.filter((t) => (t.discount || 0) > 0).length;

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  set("totalCount", total);
  set("totalCount2", total);
  set("countVN", vn);
  set("countNN", nn);
  set("countDiscount", discount);
}

// ---- Render bảng ----
function renderAdminTable(filter = "") {
  const tbody = document.getElementById("adminTbody");
  if (!tbody) return;

  const q = filter.toLowerCase();
  const shown = adminTours.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      (t.location || "").toLowerCase().includes(q),
  );

  if (shown.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align:center;padding:28px;color:var(--text-muted)">Không tìm thấy tour nào.</td></tr>';
  } else {
    tbody.innerHTML = shown
      .map((t) => {
        const isVN = t.category === "vn";
        const catBadge = isVN
          ? '<span style="background:#e8f0fe;color:var(--primary);padding:3px 10px;border-radius:100px;font-size:.76rem;font-weight:700">🇻🇳 VN</span>'
          : '<span style="background:#fff3e8;color:var(--accent);padding:3px 10px;border-radius:100px;font-size:.76rem;font-weight:700">🌍 NN</span>';
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
              ${t.discount > 0 ? `<span style="display:block;font-size:.72rem;color:var(--danger)">Giảm ${t.discount}%</span>` : ""}
            </div>
          </div>
        </td>
        <td>${t.location || "—"}</td>
        <td>${t.duration || "—"}</td>
        <td style="color:var(--accent);font-weight:700;white-space:nowrap">${fmtVndAdmin(t.price)}</td>
        <td>${catBadge}</td>
        <td style="white-space:nowrap">
          <button class="admin-btn edit-btn" onclick="openEditForm(${t.id})">✏️ Sửa</button>
          <button class="admin-btn del-btn"  onclick="deleteTour(${t.id})">🗑 Xóa</button>
        </td>
      </tr>`;
      })
      .join("");
  }

  updateStats();
}

// ---- Mở form thêm ----
function openAddForm() {
  editingId = null;
  document.getElementById("formTitle").textContent = "➕ Thêm Tour Mới";
  document.getElementById("tourForm").reset();
  document.getElementById("tourId").value = "";
  document.getElementById("formModal").classList.add("open");
  document.getElementById("formOverlay").classList.add("open");
}

// ---- Mở form sửa ----
function openEditForm(id) {
  const t = adminTours.find((x) => x.id === id);
  if (!t) return;
  editingId = id;
  document.getElementById("formTitle").textContent = "✏️ Chỉnh sửa Tour";
  document.getElementById("tourId").value = t.id;
  document.getElementById("fName").value = t.name;
  document.getElementById("fLocation").value = t.location || "";
  document.getElementById("fCategory").value = t.category || "vn";
  document.getElementById("fDuration").value = t.duration || "";
  document.getElementById("fPrice").value = t.price;
  document.getElementById("fDiscount").value = t.discount || 0;
  document.getElementById("fSlots").value = t.slots || 0;
  document.getElementById("fPeople").value = t.people || 2;
  document.getElementById("fRating").value = t.rating || 4.5;
  document.getElementById("fImage").value = t.image || "";
  document.getElementById("fDesc").value = t.description || "";
  document.getElementById("formModal").classList.add("open");
  document.getElementById("formOverlay").classList.add("open");
}

// ---- Đóng form ----
function closeForm() {
  document.getElementById("formModal").classList.remove("open");
  document.getElementById("formOverlay").classList.remove("open");
  editingId = null;
}

// ---- Lưu form ----
function saveTourForm(e) {
  e.preventDefault();

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

  if (!name || !location || !price) {
    showAdminToast("❌ Vui lòng điền đầy đủ: Tên, Địa điểm, Giá!", "error");
    return;
  }

  if (editingId !== null) {
    const idx = adminTours.findIndex((x) => x.id === editingId);
    if (idx > -1) {
      adminTours[idx] = {
        ...adminTours[idx],
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
      };
      showAdminToast("✅ Cập nhật tour thành công!");
    }
  } else {
    const newId =
      adminTours.length > 0 ? Math.max(...adminTours.map((x) => x.id)) + 1 : 1;
    adminTours.push({
      id: newId,
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
      itinerary: [],
      departure: "TP.HCM",
      transport: "Máy bay",
    });
    showAdminToast("✅ Thêm tour mới thành công!");
  }

  saveAdminData(adminTours);
  closeForm();
  renderAdminTable(document.getElementById("adminSearch").value);
}

// ---- Xóa tour ----
function deleteTour(id) {
  const t = adminTours.find((x) => x.id === id);
  if (!t) return;
  if (!confirm(`Bạn có chắc muốn xóa tour "${t.name}" không?`)) return;
  adminTours = adminTours.filter((x) => x.id !== id);
  saveAdminData(adminTours);
  renderAdminTable(document.getElementById("adminSearch").value);
  showAdminToast("🗑 Đã xóa tour thành công!");
}

// ---- Toast ----
function showAdminToast(msg, type = "success") {
  const el = document.getElementById("adminToast");
  if (!el) return;
  el.textContent = msg;
  el.style.background = type === "error" ? "#e53935" : "#1a2340";
  el.classList.add("show");
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove("show"), 3200);
}

// ---- Init ----
document.addEventListener("DOMContentLoaded", async () => {
  adminTours = await initAdminData();
  renderAdminTable();

  // Search
  document
    .getElementById("adminSearch")
    ?.addEventListener("input", (e) => renderAdminTable(e.target.value));

  // Form
  document.getElementById("tourForm")?.addEventListener("submit", saveTourForm);
  document.getElementById("addTourBtn")?.addEventListener("click", openAddForm);
  document.getElementById("closeFormBtn")?.addEventListener("click", closeForm);
  document
    .getElementById("cancelFormBtn")
    ?.addEventListener("click", closeForm);
  document.getElementById("formOverlay")?.addEventListener("click", closeForm);
});
