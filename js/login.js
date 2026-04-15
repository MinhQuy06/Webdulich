/* ============================================================
   MinhQuy Travel – login.js
   Xử lý đăng nhập – lưu user vào localStorage
   ============================================================ */

const API_BASE_URL = "http://localhost:3000";
const USER_KEY = "mq_user";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const passwordToggle = document.querySelector(".password-toggle");

  // Kiểm tra nếu đã đăng nhập → chuyển về profile
  const existingUser = localStorage.getItem(USER_KEY);
  if (existingUser) {
    window.location.href = "profile.html";
    return;
  }

  // Toggle hiển thị mật khẩu
  if (passwordToggle) {
    passwordToggle.addEventListener("click", () => {
      const type = passwordInput.type === "password" ? "text" : "password";
      passwordInput.type = type;
      passwordToggle.textContent = type === "password" ? "👁️" : "🙈";
    });
  }

  // Xử lý submit form
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Validate
    if (!username || !password) {
      showError("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    // Disable button
    const btn = form.querySelector(".login-btn");
    const originalText = btn.textContent;
    btn.textContent = "⏳ Đang đăng nhập...";
    btn.disabled = true;

    try {
      // Gọi API lấy tất cả users rồi tìm client-side
      // (json-server query params không ổn định giữa các phiên bản)
      const res = await fetch(`${API_BASE_URL}/users`);

      if (!res.ok) throw new Error("API Error");

      const users = await res.json();

      // Tìm user khớp (username HOẶC email) + password
      const found = users.find(
        (u) =>
          (u.username === username || u.email === username) &&
          u.password === password
      );

      if (found) {
        // Đăng nhập thành công
        const userData = {
          id: found.id,
          username: found.username,
          fullname: found.fullname,
          email: found.email,
          phone: found.phone,
        };
        localStorage.setItem(USER_KEY, JSON.stringify(userData));

        // Chuyển sang trang profile
        showSuccess("✅ Đăng nhập thành công!");
        setTimeout(() => {
          window.location.href = "profile.html";
        }, 800);
      } else {
        // Sai thông tin
        showError("❌ Sai tên đăng nhập hoặc mật khẩu!");
        btn.textContent = originalText;
        btn.disabled = false;
      }
    } catch (err) {
      // API lỗi → fallback đăng nhập demo
      console.warn("API lỗi, dùng đăng nhập demo:", err.message);

      // Demo accounts
      const demoUsers = [
        {
          id: 1,
          username: "minhquy",
          password: "123456",
          fullname: "Minh Quy",
          email: "minhquy@gmail.com",
          phone: "0901234567",
        },
        {
          id: 2,
          username: "ngochan",
          password: "123456",
          fullname: "Ngọc Hân",
          email: "ngochan@gmail.com",
          phone: "0912345678",
        },
      ];

      const found = demoUsers.find(
        (u) =>
          (u.username === username || u.email === username) &&
          u.password === password
      );

      if (found) {
        const userData = {
          id: found.id,
          username: found.username,
          fullname: found.fullname,
          email: found.email,
          phone: found.phone,
        };
        localStorage.setItem(USER_KEY, JSON.stringify(userData));

        showSuccess("✅ Đăng nhập thành công!");
        setTimeout(() => {
          window.location.href = "profile.html";
        }, 800);
      } else {
        showError("❌ Sai tên đăng nhập hoặc mật khẩu!");
        btn.textContent = originalText;
        btn.disabled = false;
      }
    }
  });
});

// Hiển thị lỗi
function showError(msg) {
  removeMessages();
  const el = document.createElement("div");
  el.className = "login-message error";
  el.textContent = msg;
  const form = document.querySelector("form");
  form.insertBefore(el, form.firstChild);

  setTimeout(() => el.remove(), 4000);
}

// Hiển thị thành công
function showSuccess(msg) {
  removeMessages();
  const el = document.createElement("div");
  el.className = "login-message success";
  el.textContent = msg;
  const form = document.querySelector("form");
  form.insertBefore(el, form.firstChild);
}

// Xóa message cũ
function removeMessages() {
  document.querySelectorAll(".login-message").forEach((el) => el.remove());
}
