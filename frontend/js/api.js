// ============================================================
// api.js – Tất cả hàm gọi API (Tours, Orders, Contacts, Users)
// Dùng fetch API + JSON Server (port 3000)
// ============================================================

const API_BASE = "http://localhost:3000";
const TOURS_URL = `${API_BASE}/tours`;
const ORDERS_URL = `${API_BASE}/orders`;
const USERS_URL = `${API_BASE}/users`;
const CONTACTS_URL = `${API_BASE}/contacts`;

// ── Xử lý response chung ──
async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API lỗi ${res.status}: ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ════════════════════════════════════
//  TOURS API
// ════════════════════════════════════
async function getTours() {
  const res = await fetch(TOURS_URL);
  return handleResponse(res);
}

async function getTourById(id) {
  const res = await fetch(`${TOURS_URL}/${id}`);
  return handleResponse(res);
}

async function searchTours({ q = "", category = "", price_lte = "" } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (price_lte) params.set("price_lte", price_lte);
  const url = `${TOURS_URL}${params.toString() ? "?" + params.toString() : ""}`;
  const res = await fetch(url);
  return handleResponse(res);
}

async function addTour(tourData) {
  const res = await fetch(TOURS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tourData),
  });
  return handleResponse(res);
}

async function updateTour(id, tourData) {
  const res = await fetch(`${TOURS_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tourData),
  });
  return handleResponse(res);
}

async function patchTour(id, fields) {
  const res = await fetch(`${TOURS_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  return handleResponse(res);
}

async function deleteTour(id) {
  const res = await fetch(`${TOURS_URL}/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

function calcStats(tours) {
  return {
    total: tours.length,
    vn: tours.filter((t) => t.category === "vn").length,
    nn: tours.filter((t) => t.category === "nn").length,
    discount: tours.filter((t) => (t.discount || 0) > 0).length,
  };
}

// ════════════════════════════════════
//  ORDERS API – Quản lý đơn hàng
// ════════════════════════════════════

// Lấy tất cả đơn hàng
async function getOrders() {
  const res = await fetch(ORDERS_URL);
  return handleResponse(res);
}

// Cập nhật 1 phần đơn hàng (dùng PATCH)
async function patchOrder(id, fields) {
  const res = await fetch(`${ORDERS_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  return handleResponse(res);
}

// Xóa đơn hàng
async function deleteOrder(id) {
  const res = await fetch(`${ORDERS_URL}/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

// ════════════════════════════════════
//  USERS API – Lấy thông tin người dùng
// ════════════════════════════════════

// Lấy tất cả users
async function getUsers() {
  const res = await fetch(USERS_URL);
  return handleResponse(res);
}

// ════════════════════════════════════
//  CONTACTS API – Quản lý liên hệ / phản hồi
// ════════════════════════════════════

// Lấy tất cả liên hệ
async function getContacts() {
  const res = await fetch(CONTACTS_URL);
  return handleResponse(res);
}

// Tạo liên hệ mới (gửi từ trang hotro.html)
async function createContact(data) {
  const res = await fetch(CONTACTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// Cập nhật trạng thái liên hệ (PATCH)
async function patchContact(id, fields) {
  const res = await fetch(`${CONTACTS_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  return handleResponse(res);
}

// Xóa liên hệ
async function deleteContact(id) {
  const res = await fetch(`${CONTACTS_URL}/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}
