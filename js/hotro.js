// ============================================================
// hotro.js – Xử lý form hỗ trợ khách hàng
// Tự động lấy thông tin user đã đăng nhập (nếu có)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("supportForm");
  if (!form) return;

  // Load thông tin user từ localStorage nếu đã đăng nhập
  loadUserInfo();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await submitSupportForm();
  });
});

function loadUserInfo() {
  const userStr = localStorage.getItem("currentUser");
  if (!userStr) return;

  try {
    const user = JSON.parse(userStr);
    document.getElementById("fname").value = user.fullname || "";
    document.getElementById("femail").value = user.email || "";
    document.getElementById("fphone").value = user.phone || "";
  } catch (err) {
    console.error("Error loading user info:", err);
  }
}

async function submitSupportForm() {
  const name = document.getElementById("fname").value.trim();
  const email = document.getElementById("femail").value.trim();
  const phone = document.getElementById("fphone").value.trim();
  const subject = document.getElementById("fsubject").value.trim();
  const message = document.getElementById("fmessage").value.trim();

  // Validate
  let valid = true;
  if (!name) {
    document.getElementById("fnameErr").textContent = "Vui lòng nhập tên";
    valid = false;
  } else {
    document.getElementById("fnameErr").textContent = "";
  }

  if (!email) {
    document.getElementById("femailErr").textContent = "Vui lòng nhập email";
    valid = false;
  } else {
    document.getElementById("femailErr").textContent = "";
  }

  if (!phone) {
    document.getElementById("fphoneErr").textContent = "Vui lòng nhập SĐT";
    valid = false;
  } else {
    document.getElementById("fphoneErr").textContent = "";
  }

  if (!message) {
    document.getElementById("fmessageErr").textContent =
      "Vui lòng nhập nội dung";
    valid = false;
  } else {
    document.getElementById("fmessageErr").textContent = "";
  }

  if (!valid) return;

  // Get current user ID (nếu có)
  let userId = null;
  const userStr = localStorage.getItem("currentUser");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      userId = user.id;
    } catch (e) {}
  }

  const contactData = {
    name,
    email,
    phone,
    subject: subject || "Khác",
    message,
    status: "new",
    createdAt: new Date().toISOString(),
  };

  // Thêm userId nếu user đã đăng nhập
  if (userId) {
    contactData.userId = userId;
  }

  try {
    const btn = document.querySelector("#supportForm button[type='submit']");
    btn.disabled = true;
    btn.textContent = "⏳ Đang gửi…";

    const res = await fetch("http://localhost:3000/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contactData),
    });

    if (!res.ok) {
      throw new Error(`Lỗi ${res.status}`);
    }

    showNotification(
      "✅ Gửi tin nhắn thành công! Chúng tôi sẽ liên hệ trong 24h.",
      "success",
    );
    document.getElementById("supportForm").reset();
    loadUserInfo(); // Reload user info sau khi reset
  } catch (err) {
    console.error(err);
    showNotification(
      "❌ Lỗi gửi tin nhắn. Chắc chắn server chạy trên \\:3000?",
      "error",
    );
  } finally {
    const btn = document.querySelector("#supportForm button[type='submit']");
    btn.disabled = false;
    btn.textContent = "Gửi tin nhắn ✉️";
  }
}

function showNotification(msg, type = "success") {
  // Tạo element notification nếu chưa có
  let notif = document.getElementById("supportNotification");
  if (!notif) {
    notif = document.createElement("div");
    notif.id = "supportNotification";
    notif.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 9999;
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notif);
  }

  notif.textContent = msg;
  notif.style.background = type === "error" ? "#e53935" : "#2e7d32";
  notif.style.color = "white";
  notif.style.display = "block";

  clearTimeout(notif._timer);
  notif._timer = setTimeout(() => {
    notif.style.display = "none";
  }, 4000);
}

// Add slide animation
if (!document.querySelector("style[data-hotro]")) {
  const style = document.createElement("style");
  style.setAttribute("data-hotro", "1");
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
}
