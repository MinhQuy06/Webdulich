/* ============================================================
   MinhQuy Travel – orders.js
   Trang "Đã mua" – Gọi API hiển thị đơn hàng
   ============================================================ */

const USER_KEY = "mq_user";

// Lấy user từ localStorage
function getUser() {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// Format tiền Việt
function formatVND(n) {
  return Number(n).toLocaleString("vi-VN") + "đ";
}

// Format ngày
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Biến lưu tất cả orders
let allOrders = [];

// Render danh sách đơn hàng
function renderOrders(orders) {
  const container = document.getElementById("ordersList");

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="orders-empty">
        <div class="orders-empty-icon">📦</div>
        <h3>Chưa có đơn hàng</h3>
        <p>Bạn chưa đặt tour nào. Hãy khám phá ngay!</p>
        <a href="tour.html">🔍 Tìm tour ngay</a>
      </div>`;
    return;
  }

  container.innerHTML = orders
    .map(
      (order, index) => `
    <div class="order-card" style="animation-delay: ${index * 0.08}s">
      <div class="order-card-header">
        <span class="order-date">🗓️ ${formatDate(order.createdAt)}</span>
        <span class="order-status ${order.status}">
          ${order.status === "paid" ? "✅ Đã thanh toán" : "⏳ Chờ thanh toán"}
        </span>
      </div>
      <div class="order-card-body">
        <img 
          class="order-tour-img" 
          src="${order.tourImage || "img/banahilljpg.jpg"}" 
          alt="${order.tourName}"
          onerror="this.src='img/banahilljpg.jpg'"
        />
        <div class="order-info">
          <div class="order-tour-name">${order.tourName}</div>
          <div class="order-detail-row">
            <span>💰 ${formatVND(order.price)}/người</span>
            <span>👥 ${order.quantity || 1} người</span>
            <span>📅 Ngày đi: ${formatDate(order.date)}</span>
          </div>
        </div>
      </div>
      <div class="order-card-footer">
        <span class="order-total-label">Tổng tiền:</span>
        <span class="order-total-value">${formatVND(order.total || order.price)}</span>
      </div>
    </div>`
    )
    .join("");
}

// Gọi API lấy đơn hàng theo userId
async function loadOrders(userId) {
  const container = document.getElementById("ordersList");

  // Hiển thị loading
  container.innerHTML = `
    <div class="orders-loading">
      <div class="orders-spinner"></div>
      <p>Đang tải đơn hàng...</p>
    </div>`;

  try {
    // Lấy tất cả orders rồi lọc client-side (tránh lỗi json-server query)
    const res = await fetch(`${API_BASE}/orders`);
    if (!res.ok) throw new Error(`API lỗi ${res.status}`);

    const allData = await res.json();

    // So sánh userId linh hoạt (string hoặc number)
    const orders = allData.filter(
      (o) => String(o.userId) === String(userId)
    );
    allOrders = orders;

    // Render danh sách
    renderOrders(orders);
  } catch (err) {
    container.innerHTML = `
      <div class="orders-error">
        <div class="orders-error-icon">⚠️</div>
        <h3>Không kết nối được API</h3>
        <p>Hãy chạy json-server để tải dữ liệu đơn hàng.</p>
        <code>npx json-server --watch data/db.json --port 3000</code>
      </div>`;
    console.error("Lỗi tải đơn hàng:", err.message);
  }
}

// Lọc đơn hàng theo trạng thái
function filterOrders(status) {
  if (status === "all") {
    renderOrders(allOrders);
  } else {
    const filtered = allOrders.filter((o) => o.status === status);
    renderOrders(filtered);
  }
}

// Khởi tạo tabs
function initTabs() {
  const tabs = document.querySelectorAll(".order-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Cập nhật active tab
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      // Lọc đơn hàng
      const filter = tab.getAttribute("data-filter");
      filterOrders(filter);
    });
  });
}

// Khởi tạo khi trang load xong
document.addEventListener("DOMContentLoaded", () => {
  const user = getUser();

  if (!user) {
    // Chưa đăng nhập → chuyển về login
    alert("Bạn chưa đăng nhập! Vui lòng đăng nhập trước.");
    window.location.href = "login.html";
    return;
  }

  // Đã đăng nhập → load đơn hàng
  loadOrders(user.id);

  // Khởi tạo tabs
  initTabs();
});
