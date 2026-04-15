/* ============================================================
   MinhQuy Travel – profile.js
   Trang "Tôi" – Kiểm tra đăng nhập, hiển thị thông tin user
   ============================================================ */

// Key lưu trong localStorage
const USER_KEY = "mq_user";

// Lấy thông tin user từ localStorage
function getUser() {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// Hiển thị giao diện phù hợp
function renderProfile() {
  const user = getUser();
  const notLogged = document.getElementById("profileNotLogged");
  const logged = document.getElementById("profileLogged");

  if (!user) {
    // Chưa đăng nhập → hiển thị nút đăng nhập
    notLogged.style.display = "block";
    logged.style.display = "none";
  } else {
    // Đã đăng nhập → hiển thị thông tin user
    notLogged.style.display = "none";
    logged.style.display = "block";

    // Cập nhật tên & email
    document.getElementById("profileUsername").textContent =
      user.fullname || user.username;
    document.getElementById("profileEmail").textContent =
      user.email || "Chưa cập nhật email";

    // Load thống kê đơn hàng
    loadOrderStats(user.id);
  }
}

// Gọi API lấy thống kê đơn hàng
async function loadOrderStats(userId) {
  const statOrders = document.getElementById("statOrders");
  const statPaid = document.getElementById("statPaid");
  const statPending = document.getElementById("statPending");

  try {
    // Lấy tất cả orders rồi lọc client-side (tránh lỗi json-server query)
    const res = await fetch(`${API_BASE}/orders`);
    if (!res.ok) throw new Error("API error");

    const allData = await res.json();
    const orders = allData.filter(
      (o) => String(o.userId) === String(userId)
    );

    // Cập nhật thống kê
    statOrders.textContent = orders.length;
    statPaid.textContent = orders.filter((o) => o.status === "paid").length;
    statPending.textContent = orders.filter(
      (o) => o.status === "pending"
    ).length;
  } catch (err) {
    // Nếu API lỗi, hiển thị 0
    statOrders.textContent = "0";
    statPaid.textContent = "0";
    statPending.textContent = "0";
    console.warn("Không thể tải thống kê đơn hàng:", err.message);
  }
}

// Xử lý đăng xuất
function handleLogout() {
  // Xóa thông tin user khỏi localStorage
  localStorage.removeItem(USER_KEY);

  // Reload lại trang
  location.reload();
}

// Khởi tạo khi trang load xong
document.addEventListener("DOMContentLoaded", () => {
  // Render giao diện profile
  renderProfile();

  // Gắn sự kiện nút đăng xuất
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", handleLogout);
  }
});
