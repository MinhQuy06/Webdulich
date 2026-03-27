/* ============================================================
   admin.js – CRUD Admin Panel
   ============================================================ */

const ADMIN_KEY = "mq_tours_admin";

// Seed from tours.json if localStorage is empty
async function initAdminData() {
  const stored = localStorage.getItem(ADMIN_KEY);
  if (stored) return JSON.parse(stored);
  try {
    const res = await fetch("tours.json");
    const data = await res.json();
    localStorage.setItem(ADMIN_KEY, JSON.stringify(data));
    return data;
  } catch {
    return [];
  }
}

function saveAdminData(data) {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(data));
}

function fmtVndAdmin(n) {
  return parseInt(n).toLocaleString("vi-VN") + "đ";
}

let adminTours = [];
let editingId = null;

// ---- Render table ----
function renderAdminTable(filter = "") {
  const tbody = document.getElementById("adminTbody");
  if (!tbody) return;
  const q = filter.toLowerCase();
  const shown = adminTours.filter(
    (t) =>
      t.name.toLowerCase().includes(q) || t.location.toLowerCase().includes(q),
  );
  tbody.innerHTML =
    shown.length === 0
      ? '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">Không tìm thấy tour nào.</td></tr>'
      : shown
          .map(
            (t) => `
    <tr>
      <td>${t.id}</td>
      <td><div style="display:flex;align-items:center;gap:10px"><img src="${t.image}" style="width:48px;height:36px;object-fit:cover;border-radius:6px" onerror="this.src='img/banahilljpg.jpg'" /><strong>${t.name}</strong></div></td>
      <td>${t.location}</td>
      <td>${t.duration}</td>
      <td style="color:var(--accent);font-weight:700">${fmtVndAdmin(t.price)}</td>
      <td><span style="background:${t.category === "vn" ? "#e8f0fe" : "#fff3e8"};color:${t.category === "vn" ? "var(--primary)" : "var(--accent)"};padding:3px 10px;border-radius:100px;font-size:.78rem;font-weight:700">${t.category === "vn" ? "🇻🇳 VN" : "🌍 NN"}</span></td>
      <td>
        <button class="admin-btn edit-btn" onclick="openEditForm(${t.id})">✏️ Sửa</button>
        <button class="admin-btn del-btn" onclick="deleteTour(${t.id})">🗑 Xóa</button>
      </td>
    </tr>`,
          )
          .join("");

  document.getElementById("totalCount").textContent = adminTours.length;
}

// ---- Open form ----
function openAddForm() {
  editingId = null;
  document.getElementById("formTitle").textContent = "➕ Thêm Tour Mới";
  document.getElementById("tourForm").reset();
  document.getElementById("tourId").value = "";
  document.getElementById("formModal").classList.add("open");
}

function openEditForm(id) {
  const t = adminTours.find((x) => x.id === id);
  if (!t) return;
  editingId = id;
  document.getElementById("formTitle").textContent = "✏️ Chỉnh sửa Tour";
  document.getElementById("tourId").value = t.id;
  document.getElementById("fName").value = t.name;
  document.getElementById("fLocation").value = t.location;
  document.getElementById("fCategory").value = t.category;
  document.getElementById("fDuration").value = t.duration;
  document.getElementById("fPrice").value = t.price;
  document.getElementById("fDiscount").value = t.discount || 0;
  document.getElementById("fSlots").value = t.slots || 0;
  document.getElementById("fPeople").value = t.people || 2;
  document.getElementById("fRating").value = t.rating || 4.5;
  document.getElementById("fImage").value = t.image;
  document.getElementById("fDesc").value = t.description;
  document.getElementById("formModal").classList.add("open");
}

function closeForm() {
  document.getElementById("formModal").classList.remove("open");
  editingId = null;
}

// ---- Save form ----
function saveTourForm(e) {
  e.preventDefault();
  const name = document.getElementById("fName").value.trim();
  const location = document.getElementById("fLocation").value.trim();
  const category = document.getElementById("fCategory").value;
  const duration = document.getElementById("fDuration").value.trim();
  const price = parseInt(document.getElementById("fPrice").value);
  const discount = parseInt(document.getElementById("fDiscount").value) || 0;
  const slots = parseInt(document.getElementById("fSlots").value) || 0;
  const people = parseInt(document.getElementById("fPeople").value) || 2;
  const rating = parseFloat(document.getElementById("fRating").value) || 4.5;
  const image = document.getElementById("fImage").value.trim();
  const desc = document.getElementById("fDesc").value.trim();

  if (!name || !location || !price) {
    showAdminToast("❌ Vui lòng điền đầy đủ thông tin bắt buộc!", "error");
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

// ---- Delete ----
function deleteTour(id) {
  if (!confirm("Bạn có chắc muốn xóa tour này không?")) return;
  adminTours = adminTours.filter((x) => x.id !== id);
  saveAdminData(adminTours);
  renderAdminTable(document.getElementById("adminSearch").value);
  showAdminToast("🗑 Đã xóa tour thành công!");
}

// ---- Toast ----
function showAdminToast(msg, type = "success") {
  const t = document.getElementById("adminToast");
  t.textContent = msg;
  t.style.background = type === "error" ? "#e53935" : "#1a2340";
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 3000);
}

// ---- Init ----
document.addEventListener("DOMContentLoaded", async () => {
  adminTours = await initAdminData();
  renderAdminTable();

  document
    .getElementById("adminSearch")
    .addEventListener("input", (e) => renderAdminTable(e.target.value));
  document.getElementById("tourForm").addEventListener("submit", saveTourForm);
  document.getElementById("addTourBtn").addEventListener("click", openAddForm);
  document.getElementById("closeFormBtn").addEventListener("click", closeForm);
  document.getElementById("cancelFormBtn").addEventListener("click", closeForm);
  document.getElementById("formOverlay").addEventListener("click", closeForm);
});
