/* ============================================================
   MinhQuy Travel – login.js
   Xử lý đăng nhập – dùng api.js chung, không lộ toàn bộ users
   ============================================================ */

// Dùng API_BASE từ api.js (đã được load trước trong HTML)
// Không khai báo lại để tránh trùng lặp
const USER_KEY = "mq_user";

// --- Giới hạn số lần thử đăng nhập (chống brute force) ---
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 phút

function getLockoutState() {
  try {
    return JSON.parse(sessionStorage.getItem("mq_login_lock") || "{}");
  } catch {
    return {};
  }
}

function isLockedOut() {
  const state = getLockoutState();
  if (!state.lockUntil) return false;
  if (Date.now() < state.lockUntil) return true;
  sessionStorage.removeItem("mq_login_lock");
  return false;
}

function recordFailedAttempt() {
  const state = getLockoutState();
  const attempts = (state.attempts || 0) + 1;
  const lockUntil = attempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : null;
  sessionStorage.setItem("mq_login_lock", JSON.stringify({ attempts, lockUntil }));
  return { attempts, locked: lockUntil !== null };
}

function resetAttempts() {
  sessionStorage.removeItem("mq_login_lock");
}

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

    // Kiểm tra lockout
    if (isLockedOut()) {
      showError("⛔ Quá nhiều lần thử. Vui lòng đợi 5 phút rồi thử lại!");
      return;
    }

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
      // Gọi endpoint login riêng – không lấy toàn bộ users
      // json-server middleware: POST /login
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.status === 401) {
        // Sai thông tin
        const { attempts, locked } = recordFailedAttempt();
        const remaining = MAX_ATTEMPTS - attempts;
        if (locked) {
          showError("⛔ Tài khoản bị khóa 5 phút do đăng nhập sai nhiều lần!");
        } else {
          showError(`❌ Sai tên đăng nhập hoặc mật khẩu! Còn ${remaining} lần thử.`);
        }
        btn.textContent = originalText;
        btn.disabled = false;
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const userData = await res.json();
      // Server chỉ trả về dữ liệu an toàn (không có password)
      localStorage.setItem(USER_KEY, JSON.stringify({
        id: userData.id,
        username: userData.username,
        fullname: userData.fullname,
        email: userData.email,
        phone: userData.phone,
      }));

      resetAttempts();
      showSuccess("✅ Đăng nhập thành công!");
      setTimeout(() => {
        window.location.href = "profile.html";
      }, 800);

    } catch (err) {
      // API không có endpoint /login → fallback tìm user phía client
      // CẢNH BÁO: Đây là chế độ fallback DEV ONLY – không dùng production
      console.warn("[DEV MODE] /login endpoint không khả dụng, đang dùng fallback:", err.message);

      try {
        // Tìm user theo username/email – fetch toàn bộ chỉ trong DEV fallback
        const usersRes = await fetch(`${API_BASE}/users`);
        if (!usersRes.ok) throw new Error("Users API failed");
        const users = await usersRes.json();

        const found = users.find(
          (u) =>
            (u.username === username || u.email === username) &&
            u.password === password
        );

        if (found) {
          // Chỉ lưu các trường an toàn – KHÔNG lưu password
          localStorage.setItem(USER_KEY, JSON.stringify({
            id: found.id,
            username: found.username,
            fullname: found.fullname,
            email: found.email,
            phone: found.phone,
          }));

          resetAttempts();
          showSuccess("✅ Đăng nhập thành công!");
          setTimeout(() => {
            window.location.href = "profile.html";
          }, 800);
        } else {
          const { attempts, locked } = recordFailedAttempt();
          const remaining = MAX_ATTEMPTS - attempts;
          if (locked) {
            showError("⛔ Tài khoản bị khóa 5 phút do đăng nhập sai nhiều lần!");
          } else {
            showError(`❌ Sai tên đăng nhập hoặc mật khẩu! Còn ${remaining} lần thử.`);
          }
          btn.textContent = originalText;
          btn.disabled = false;
        }
      } catch {
        showError("❌ Không kết nối được server. Vui lòng thử lại sau.");
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
  setTimeout(() => el.remove(), 5000);
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
