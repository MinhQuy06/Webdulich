/* ============================================================
   checkout.js – Trang thanh toán
   Nhận: checkout.html?id=X&qty=Y
   ============================================================ */

let _checkoutTour = null;
let _checkoutQty = 1;
let _finalPrice = 0;
let _currentStep = 1; // ← Thêm dòng này: theo dõi bước hiện tại

function fmtVnd(n) {
  return parseInt(n).toLocaleString("vi-VN") + "đ";
}

// --- Load tour ---
async function loadCheckoutTour(id) {
  // Thử localStorage trước
  const stored = localStorage.getItem("mq_tours_admin");
  if (stored) {
    try {
      const tours = JSON.parse(stored);
      const found = tours.find((t) => t.id === id);
      if (found) return found;
    } catch {
      /* ignore */
    }
  }
  for (const path of ["data/tours.json", "tours.json"]) {
    try {
      const res = await fetch(path);
      if (!res.ok) continue;
      const tours = await res.json();
      return tours.find((t) => t.id === id) || null;
    } catch {
      /* try next */
    }
  }
  return null;
}

// --- Render order summary ---
function renderSummary() {
  const tour = _checkoutTour;
  if (!tour) return;

  const unitPrice = _finalPrice;
  const total = unitPrice * _checkoutQty;
  const savedAmount =
    tour.discount > 0 ? (tour.price - unitPrice) * _checkoutQty : 0;

  // Breadcrumb
  const bcEl = document.getElementById("bcTourName");
  if (bcEl) bcEl.textContent = tour.name;

  document.getElementById("summaryContent").innerHTML = `
    <img src="${tour.image}" alt="${tour.name}" class="summary-tour-img"
         onerror="this.src='img/banahilljpg.jpg'" />
    <div class="summary-tour-info">
      <h4 class="summary-tour-name">${tour.name}</h4>
      <div class="summary-meta">
        <span>🕐 ${tour.duration}</span>
        <span>📍 ${tour.location}</span>
        <span>⭐ ${tour.rating}/5</span>
      </div>
    </div>
    <div class="summary-line-items">
      <div class="line-item">
        <span class="line-label">Giá / người</span>
        <span class="line-value">${fmtVnd(unitPrice)}</span>
      </div>
      <div class="line-item">
        <span class="line-label">Số người</span>
        <span class="line-value" id="summaryQtyDisplay">${_checkoutQty} người</span>
      </div>
      ${
        savedAmount > 0
          ? `
      <div class="line-item discount">
        <span class="line-label">🎉 Tiết kiệm (-${tour.discount}%)</span>
        <span class="line-value">-${fmtVnd(savedAmount)}</span>
      </div>`
          : ""
      }
      <div class="line-item divider-line">
        <span class="line-label">Phí dịch vụ</span>
        <span class="line-value" style="color:var(--success)">Miễn phí</span>
      </div>
    </div>
    <div class="summary-total">
      <span class="total-label">Tổng thanh toán</span>
      <span class="total-value" id="summaryTotalPrice">${fmtVnd(total)}</span>
    </div>
  `;
}

// --- Update summary khi thay đổi qty ---
function updateSummaryTotal() {
  const total = _finalPrice * _checkoutQty;
  const el = document.getElementById("summaryTotalPrice");
  if (el) el.textContent = fmtVnd(total);
  const qtyEl = document.getElementById("summaryQtyDisplay");
  if (qtyEl) qtyEl.textContent = _checkoutQty + " người";
}

// --- Quản lý số người ---
function changeCheckoutQty(delta) {
  _checkoutQty = Math.max(1, Math.min(20, _checkoutQty + delta));
  const el = document.getElementById("co_qty");
  if (el) el.value = _checkoutQty;
  updateSummaryTotal();
}

// --- Validate form ---
function validateForm() {
  let valid = true;
  const setErr = (id, msg) => {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
    if (msg) valid = false;
  };

  const name = document.getElementById("co_name")?.value.trim() || "";
  const phone = document.getElementById("co_phone")?.value.trim() || "";
  const email = document.getElementById("co_email")?.value.trim() || "";
  const date = document.getElementById("co_date")?.value || "";

  setErr(
    "co_nameErr",
    name.length < 2 ? "Vui lòng nhập họ tên (tối thiểu 2 ký tự)." : "",
  );
  setErr(
    "co_phoneErr",
    !/^(0|\+84)[0-9]{8,10}$/.test(phone) ? "Số điện thoại không hợp lệ." : "",
  );
  setErr(
    "co_emailErr",
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Email không hợp lệ." : "",
  );
  setErr("co_dateErr", !date ? "Vui lòng chọn ngày khởi hành." : "");

  // Validate date is in the future
  if (date && new Date(date) <= new Date()) {
    setErr("co_dateErr", "Ngày khởi hành phải sau ngày hôm nay.");
  }

  return valid;
}

// --- Chuyển bước (1→2→3) ---
function goToStep(step) {
  _currentStep = step;
  document.querySelectorAll(".step").forEach((el, idx) => {
    el.classList.toggle("active", idx + 1 <= step);
    el.classList.toggle("done", idx + 1 < step);
  });
}

// --- Bước 2: Hiển thị thông tin để review trước khi xác nhận ---
function showConfirmStep() {
  const name = document.getElementById("co_name").value.trim();
  const phone = document.getElementById("co_phone").value.trim();
  const email = document.getElementById("co_email").value.trim();
  const date = document.getElementById("co_date").value;
  const payment =
    document.querySelector('input[name="payment"]:checked')?.value || "bank";
  const total = _finalPrice * _checkoutQty;

  const dateLabel = new Date(date).toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const payLabels = {
    bank: "Chuyển khoản ngân hàng",
    momo: "Ví MoMo",
    cash: "Tiền mặt khi đi tour",
    card: "Thẻ quốc tế",
  };

  // Tạo review box chèn vào đầu form
  const old = document.getElementById("reviewBox");
  if (old) old.remove();

  const reviewBox = document.createElement("div");
  reviewBox.id = "reviewBox";
  reviewBox.style.cssText = `
    background:#f0f7ff; border:1.5px solid var(--primary); border-radius:var(--radius-sm);
    padding:18px 20px; margin-bottom:20px; font-size:.9rem; line-height:2;
  `;
  reviewBox.innerHTML = `
    <div style="font-weight:700;font-size:1rem;color:var(--primary);margin-bottom:10px">
      📋 Xác nhận lại thông tin trước khi đặt
    </div>
    <div><strong>👤 Họ tên:</strong> ${name}</div>
    <div><strong>📞 SĐT:</strong> ${phone}</div>
    <div><strong>✉️ Email:</strong> ${email}</div>
    <div><strong>📅 Ngày đi:</strong> ${dateLabel}</div>
    <div><strong>👥 Số người:</strong> ${_checkoutQty} người</div>
    <div><strong>💳 Thanh toán:</strong> ${payLabels[payment]}</div>
    <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
      <strong>💰 Tổng tiền: 
        <span style="color:var(--primary);font-size:1.1rem">${fmtVnd(total)}</span>
      </strong>
    </div>
    <button type="button" onclick="backToStep1()"
      style="margin-top:12px;background:none;border:1px solid var(--border);padding:7px 16px;
             border-radius:var(--radius-sm);cursor:pointer;font-size:.84rem;color:var(--text-muted)">
      ← Quay lại chỉnh sửa
    </button>
  `;

  // Chèn review box vào đầu form
  const form = document.getElementById("checkoutForm");
  form.prepend(reviewBox);

  // Đổi nút submit
  const btn = document.querySelector(".btn-confirm");
  if (btn) {
    btn.textContent = "✅ Xác nhận & Hoàn tất đặt tour";
    btn.style.background = "linear-gradient(135deg, #16a34a, #15803d)";
    btn.style.boxShadow = "0 4px 14px rgba(22,163,74,.4)";
  }

  // Cuộn lên đầu
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// --- Quay lại bước 1 ---
function backToStep1() {
  goToStep(1);
  document.getElementById("reviewBox")?.remove();
  const btn = document.querySelector(".btn-confirm");
  if (btn) {
    btn.textContent = "✅ Xác nhận đặt tour";
    btn.style.background = "";
    btn.style.boxShadow = "";
  }
}

// --- Submit → show success modal ---
function handleSubmit(e) {
  e.preventDefault();

  // ── BƯỚC 1: Validate → chuyển sang bước 2 (Xác nhận) ──
  if (_currentStep === 1) {
    if (!validateForm()) return; // dừng nếu form lỗi
    goToStep(2);
    showConfirmStep(); // hiện review box
    return; // ← return ở đây, KHÔNG chạy tiếp
  }

  // ── BƯỚC 2: Người dùng đã review → xác nhận → hoàn tất ──
  const name = document.getElementById("co_name").value.trim();
  const phone = document.getElementById("co_phone").value.trim();
  const email = document.getElementById("co_email").value.trim();
  const date = document.getElementById("co_date").value;
  const payment =
    document.querySelector('input[name="payment"]:checked')?.value || "bank";
  const note = document.getElementById("co_note").value.trim();
  const total = _finalPrice * _checkoutQty;

  const dateLabel = new Date(date).toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const payLabels = {
    bank: "Chuyển khoản ngân hàng",
    momo: "Ví MoMo",
    cash: "Tiền mặt khi đi tour",
    card: "Thẻ quốc tế",
  };

  // Lưu đơn đặt vào localStorage
  const booking = {
    id: Date.now(),
    tourId: _checkoutTour?.id,
    tourName: _checkoutTour?.name,
    qty: _checkoutQty,
    unitPrice: _finalPrice,
    total,
    name,
    phone,
    email,
    date,
    payment,
    note,
    createdAt: new Date().toISOString(),
  };
  const bookings = JSON.parse(localStorage.getItem("mq_bookings") || "[]");
  bookings.push(booking);
  localStorage.setItem("mq_bookings", JSON.stringify(bookings));

  // Điền thông tin vào modal thành công
  document.getElementById("successInfo").innerHTML = `
    <div><strong>🗺️ Tour:</strong> ${_checkoutTour?.name || "—"}</div>
    <div><strong>📅 Ngày đi:</strong> ${dateLabel}</div>
    <div><strong>👥 Số người:</strong> ${_checkoutQty} người</div>
    <div><strong>💰 Tổng tiền:</strong> <span style="color:var(--primary);font-weight:700">${fmtVnd(total)}</span></div>
    <div><strong>💳 Thanh toán:</strong> ${payLabels[payment]}</div>
    <div><strong>📞 Liên hệ:</strong> ${name} – ${phone}</div>
  `;

  // Chuyển bước 3 + hiện modal
  goToStep(3);
  document.getElementById("successOverlay").classList.add("open");

  // Disable nút
  const btn = document.querySelector(".btn-confirm");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "✅ Đã đặt thành công";
  }
}

// --- Payment option click ---
function initPaymentOptions() {
  document.querySelectorAll(".pay-opt").forEach((opt) => {
    opt.addEventListener("click", function () {
      document
        .querySelectorAll(".pay-opt")
        .forEach((o) => o.classList.remove("active"));
      this.classList.add("active");
      this.querySelector('input[type="radio"]').checked = true;
    });
  });
}

// --- Set min date for date input (tomorrow) ---
function initDateInput() {
  const dateInput = document.getElementById("co_date");
  if (!dateInput) return;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  dateInput.min = tomorrow.toISOString().split("T")[0];
}

// --- Init page ---
async function initCheckout() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"));
  const qty = parseInt(params.get("qty")) || 1;

  if (!id) {
    window.location.href = "tour.html";
    return;
  }

  _checkoutQty = qty;

  // Set qty in form
  const qtyInput = document.getElementById("co_qty");
  if (qtyInput) qtyInput.value = qty;

  const tour = await loadCheckoutTour(id);
  if (!tour) {
    window.location.href = "tour.html";
    return;
  }

  _checkoutTour = tour;
  _finalPrice =
    tour.discount > 0
      ? Math.round(tour.price * (1 - tour.discount / 100))
      : tour.price;

  document.title = `Đặt tour: ${tour.name} – MinhQuy Travel`;
  renderSummary();
}

// --- DOMContentLoaded ---
document.addEventListener("DOMContentLoaded", () => {
  initCheckout();
  initPaymentOptions();
  initDateInput();

  document
    .getElementById("checkoutForm")
    ?.addEventListener("submit", handleSubmit);
});
