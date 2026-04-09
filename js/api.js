/* ============================================================
   api.js – Giao tiếp với json-server
   Chạy server: npx json-server --watch data/db.json --port 3000
   API base: http://localhost:3000
   ============================================================ */

const API_BASE = "http://localhost:3000";
const TOURS_URL = `${API_BASE}/tours`;

// ---- Helper: xử lý lỗi chung ----
async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API lỗi ${res.status}: ${text}`);
  }
  // DELETE trả về 200 với body rỗng
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ============================================================
// GET – Lấy tất cả tours
// ============================================================
async function getTours() {
  const res = await fetch(TOURS_URL);
  return handleResponse(res);
}

// ============================================================
// GET – Lấy một tour theo ID
// ============================================================
async function getTourById(id) {
  const res = await fetch(`${TOURS_URL}/${id}`);
  return handleResponse(res);
}

// ============================================================
// GET – Tìm kiếm + lọc tours (dùng query params json-server)
// Params: { q, category, price_lte }
// ============================================================
async function searchTours({ q = "", category = "", price_lte = "" } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (price_lte) params.set("price_lte", price_lte);
  const url = `${TOURS_URL}${params.toString() ? "?" + params.toString() : ""}`;
  const res = await fetch(url);
  return handleResponse(res);
}

// ============================================================
// POST – Thêm tour mới
// ============================================================
async function addTour(tourData) {
  const res = await fetch(TOURS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tourData),
  });
  return handleResponse(res);
}

// ============================================================
// PUT – Cập nhật toàn bộ tour (thay thế)
// ============================================================
async function updateTour(id, tourData) {
  const res = await fetch(`${TOURS_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tourData),
  });
  return handleResponse(res);
}

// ============================================================
// PATCH – Cập nhật một phần tour
// ============================================================
async function patchTour(id, fields) {
  const res = await fetch(`${TOURS_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  return handleResponse(res);
}

// ============================================================
// DELETE – Xóa tour
// ============================================================
async function deleteTour(id) {
  const res = await fetch(`${TOURS_URL}/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

// ============================================================
// STATS – Tính thống kê từ danh sách
// ============================================================
function calcStats(tours) {
  return {
    total: tours.length,
    vn: tours.filter((t) => t.category === "vn").length,
    nn: tours.filter((t) => t.category === "nn").length,
    discount: tours.filter((t) => (t.discount || 0) > 0).length,
  };
}
