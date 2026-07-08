/* ============================================================
   MinhQuy Travel – signup.js
   Đăng ký tài khoản – lưu user vào JSON Server
   ============================================================ */

const API_BASE_URL = "http://localhost:3000";
const USER_KEY = "mq_user";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  // Nếu đã đăng nhập → chuyển về profile
  const existingUser = localStorage.getItem(USER_KEY);
  if (existingUser) {
    window.location.href = "profile.html";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullname = document.getElementById("hovaten").value.trim();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("sdt").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document
      .getElementById("confirm-password")
      .value.trim();

    // --- Validate ---
    if (!fullname || !username || !email || !phone || !password || !confirmPassword) {
      showMsg("Vui lòng nhập đầy đủ thông tin!", "error");
      return;
    }

    // Validate username: không dấu, không khoảng trắng, ít nhất 3 ký tự
    if (username.length < 3) {
      showMsg("Tên đăng nhập phải có ít nhất 3 ký tự!", "error");
      return;
    }

    if (/\s/.test(username)) {
      showMsg("Tên đăng nhập không được có khoảng trắng!", "error");
      return;
    }

    if (password.length < 4) {
      showMsg("Mật khẩu phải có ít nhất 4 ký tự!", "error");
      return;
    }

    if (password !== confirmPassword) {
      showMsg("Mật khẩu xác nhận không khớp!", "error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMsg("Email không hợp lệ!", "error");
      return;
    }

    if (!/^(0|\+84)[0-9]{8,10}$/.test(phone)) {
      showMsg("Số điện thoại không hợp lệ!", "error");
      return;
    }

    // Disable button
    const btn = form.querySelector(".submit-btn");
    const originalText = btn.textContent;
    btn.textContent = "⏳ Đang tạo tài khoản...";
    btn.disabled = true;

    try {
      // Kiểm tra username/email đã tồn tại chưa
      const checkRes = await fetch(`${API_BASE_URL}/users`);
      if (checkRes.ok) {
        const existingUsers = await checkRes.json();

        if (existingUsers.find((u) => u.username === username)) {
          showMsg("❌ Tên đăng nhập đã được sử dụng!", "error");
          btn.textContent = originalText;
          btn.disabled = false;
          return;
        }

        if (existingUsers.find((u) => u.email === email)) {
          showMsg("❌ Email này đã được đăng ký!", "error");
          btn.textContent = originalText;
          btn.disabled = false;
          return;
        }
      }

      // Tạo user mới – POST lên JSON Server
      const newUser = {
        username: username,
        password: password,
        fullname: fullname,
        email: email,
        phone: phone,
      };

      const res = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) throw new Error("Không thể tạo tài khoản");

      const createdUser = await res.json();

      // Lưu vào localStorage (tự động đăng nhập)
      const userData = {
        id: createdUser.id,
        username: createdUser.username,
        fullname: createdUser.fullname,
        email: createdUser.email,
        phone: createdUser.phone,
      };
      localStorage.setItem(USER_KEY, JSON.stringify(userData));

      showMsg("✅ Tạo tài khoản thành công! Đang chuyển hướng...", "success");
      setTimeout(() => {
        window.location.href = "profile.html";
      }, 1200);
    } catch (err) {
      console.error("Lỗi đăng ký:", err.message);
      showMsg(
        "⚠️ Không kết nối được server. Hãy chạy json-server!",
        "error"
      );
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
});

// Hiển thị thông báo
function showMsg(msg, type) {
  document.querySelectorAll(".signup-message").forEach((el) => el.remove());

  const el = document.createElement("div");
  el.className = `signup-message ${type}`;
  el.textContent = msg;

  const form = document.querySelector("form");
  form.insertBefore(el, form.firstChild);

  if (type === "error") {
    setTimeout(() => el.remove(), 4000);
  }
}
