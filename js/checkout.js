let _mode = "single"; // 'single' | 'cart'
let _singleTour = null;
let _singleQty = 1;
let _singlePrice = 0;
let _currentStep = 1;

function goToStep(step) {
  _currentStep = step;
  document.querySelectorAll(".step").forEach((el, i) => {
    el.classList.toggle("active", i + 1 <= step);
    el.classList.toggle("done", i + 1 < step);
  });
}

async function loadSingleTour(id) {
  try {
    return await getTourById(id);
  } catch {
    /* fallback */
  }
  const stored = localStorage.getItem("mq_tours_admin");
  if (stored) {
    try {
      const all = JSON.parse(stored);
      return all.find((t) => t.id === id) || null;
    } catch {
      /* ignore */
    }
  }
  for (const p of ["data/tours.json", "tours.json"]) {
    try {
      const r = await fetch(p);
      if (!r.ok) continue;
      const all = await r.json();
      return all.find((t) => t.id === id) || null;
    } catch {
      /* next */
    }
  }
  return null;
}

function renderSummary() {
  const box = document.getElementById("summaryContent");
  if (!box) return;

  if (_mode === "cart") {
    renderCartSummary(box);
  } else {
    renderSingleSummary(box);
  }
}

function renderCartSummary(box) {
  const cart = getCart();
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  if (cart.length === 0) {
    box.innerHTML = `
      <div style="text-align:center;padding:30px;color:var(--text-muted)">
        🛒 Giỏ hàng trống.
        <br/><a href="tour.html" style="color:var(--primary);font-weight:700">← Xem tour</a>
      </div>`;
    return;
  }

  const items = cart
    .map(
      (item) => `
    <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)">
      <img src="${item.image || "img/banahilljpg.jpg"}"
           style="width:56px;height:42px;object-fit:cover;border-radius:8px;flex-shrink:0"
           onerror="this.src='img/banahilljpg.jpg'"/>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name}</div>
        <div style="font-size:.78rem;color:var(--text-muted);margin-top:2px">${item.qty} người × ${fmtVnd(item.price)}</div>
      </div>
      <div style="font-weight:700;color:var(--accent);white-space:nowrap">${fmtVnd(item.price * item.qty)}</div>
    </div>`,
    )
    .join("");

  box.innerHTML = `
    <div style="padding:0 20px">
      ${items}
      <div style="display:flex;justify-content:space-between;align-items:center;
                  margin-top:14px;padding:14px 0;border-top:2px solid var(--border)">
        <strong style="font-size:.9rem;color:var(--primary)">Tổng cộng</strong>
        <strong style="font-size:1.3rem;color:var(--primary);font-family:var(--font-display)">${fmtVnd(total)}</strong>
      </div>
    </div>`;

  const totalEl = document.getElementById("summaryTotalPrice");
  if (totalEl) totalEl.textContent = fmtVnd(total);
}

function renderSingleSummary(box) {
  const tour = _singleTour;
  if (!tour) return;

  const unit = _singlePrice;
  const saved = tour.discount > 0 ? (tour.price - unit) * _singleQty : 0;
  const total = unit * _singleQty;

  const bcEl = document.getElementById("bcTourName");
  if (bcEl) bcEl.textContent = tour.name;

  box.innerHTML = `
    <img src="${tour.image}" alt="${tour.name}" class="summary-tour-img"
         onerror="this.src='img/banahilljpg.jpg'"/>
    <div class="summary-tour-info">
      <h4 class="summary-tour-name">${tour.name}</h4>
      <div class="summary-meta">
        <span>🕐 ${tour.duration || "—"}</span>
        <span>📍 ${tour.location || "—"}</span>
        <span>⭐ ${tour.rating || "—"}/5</span>
      </div>
    </div>
    <div class="summary-line-items">
      <div class="line-item">
        <span class="line-label">Giá / người</span>
        <span class="line-value">${fmtVnd(unit)}</span>
      </div>
      <div class="line-item">
        <span class="line-label">Số người</span>
        <span class="line-value" id="summaryQtyDisplay">${_singleQty} người</span>
      </div>
      ${
        saved > 0
          ? `
      <div class="line-item discount">
        <span class="line-label">🎉 Tiết kiệm (-${tour.discount}%)</span>
        <span class="line-value">-${fmtVnd(saved)}</span>
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
    </div>`;
}

function changeCheckoutQty(delta) {
  if (_mode !== "single") return;
  _singleQty = Math.max(1, Math.min(20, _singleQty + delta));
  const el = document.getElementById("co_qty");
  if (el) el.value = _singleQty;
  updateTotals();
}

function updateTotals() {
  const total =
    _mode === "cart"
      ? getCart().reduce((s, i) => s + i.price * i.qty, 0)
      : _singlePrice * _singleQty;

  const el = document.getElementById("summaryTotalPrice");
  if (el) el.textContent = fmtVnd(total);

  const qtyEl = document.getElementById("summaryQtyDisplay");
  if (qtyEl && _mode === "single") qtyEl.textContent = _singleQty + " người";
}

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

  setErr("co_nameErr", name.length < 2 ? "Vui lòng nhập họ tên." : "");
  setErr(
    "co_phoneErr",
    !/^(0|\+84)[0-9]{8,10}$/.test(phone) ? "SĐT không hợp lệ." : "",
  );
  setErr(
    "co_emailErr",
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Email không hợp lệ." : "",
  );
  setErr("co_dateErr", !date ? "Vui lòng chọn ngày khởi hành." : "");
  if (date && new Date(date) <= new Date())
    setErr("co_dateErr", "Ngày phải sau hôm nay.");

  return valid;
}

function showConfirmStep() {
  const name = document.getElementById("co_name").value.trim();
  const phone = document.getElementById("co_phone").value.trim();
  const email = document.getElementById("co_email").value.trim();
  const date = document.getElementById("co_date").value;
  const payment =
    document.querySelector('input[name="payment"]:checked')?.value || "bank";
  const payLabels = {
    bank: "Chuyển khoản",
    momo: "Ví MoMo",
    cash: "Tiền mặt",
    card: "Thẻ quốc tế",
  };
  const total =
    _mode === "cart"
      ? getCart().reduce((s, i) => s + i.price * i.qty, 0)
      : _singlePrice * _singleQty;
  const dateLabel = date
    ? new Date(date).toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  // Xóa review box cũ nếu có
  document.getElementById("reviewBox")?.remove();

  const box = document.createElement("div");
  box.id = "reviewBox";
  box.style.cssText = `
    background:#f0f7ff;border:1.5px solid var(--primary);border-radius:var(--radius-sm);
    padding:18px 20px;margin-bottom:20px;font-size:.88rem;line-height:2;`;
  box.innerHTML = `
    <div style="font-weight:700;font-size:.95rem;color:var(--primary);margin-bottom:10px">
      📋 Xác nhận thông tin trước khi đặt
    </div>
    <div><strong>👤 Họ tên:</strong> ${name}</div>
    <div><strong>📞 SĐT:</strong> ${phone}</div>
    <div><strong>✉️ Email:</strong> ${email}</div>
    <div><strong>📅 Ngày đi:</strong> ${dateLabel}</div>
    ${
      _mode === "single"
        ? `<div><strong>👥 Số người:</strong> ${_singleQty} người</div>`
        : `<div><strong>🛒 Số tour:</strong> ${getCart().length} tour</div>`
    }
    <div><strong>💳 Thanh toán:</strong> ${payLabels[payment]}</div>
    <div style="margin-top:8px;padding-top:8px;border-top:1px solid #c8e0ff">
      <strong>💰 Tổng tiền:
        <span style="color:var(--primary);font-size:1.05rem"> ${fmtVnd(total)}</span>
      </strong>
    </div>
    <button type="button" onclick="backToStep1()"
      style="margin-top:12px;background:none;border:1px solid var(--border);
             padding:7px 16px;border-radius:var(--radius-sm);cursor:pointer;
             font-size:.82rem;color:var(--text-muted)">
      ← Quay lại chỉnh sửa
    </button>`;

  document.getElementById("checkoutForm").prepend(box);

  const btn = document.querySelector(".btn-confirm");
  if (btn) {
    btn.textContent = "✅ Xác nhận & Hoàn tất";
    btn.style.background = "linear-gradient(135deg,#16a34a,#15803d)";
    btn.style.boxShadow = "0 4px 14px rgba(22,163,74,.4)";
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

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

async function handleSubmit(e) {
  e.preventDefault();

  if (_currentStep === 1) {
    if (!validateForm()) return;
    goToStep(2);
    showConfirmStep();
    return;
  }

  const name = document.getElementById("co_name").value.trim();
  const phone = document.getElementById("co_phone").value.trim();
  const email = document.getElementById("co_email").value.trim();
  const date = document.getElementById("co_date").value;
  const payment =
    document.querySelector('input[name="payment"]:checked')?.value || "bank";
  const note = document.getElementById("co_note").value.trim();
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

  let total, tourInfo;

  if (_mode === "cart") {
    const cart = getCart();

    // Kiểm tra slots cho từng tour trong giỏ
    for (const item of cart) {
      try {
        const tourData = await getTourById(item.id);
        if (tourData && tourData.slots > 0 && item.qty > tourData.slots) {
          showToast(
            `⚠️ Tour "${item.name}" chỉ còn ${tourData.slots} chỗ! Vui lòng giảm số lượng.`,
          );
          return;
        }
      } catch (e) {
        /* bỏ qua nếu không lấy được */
      }
    }

    total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    tourInfo = `${cart.length} tour (${cart.map((i) => i.name).join(", ")})`;
  } else {
    // Kiểm tra slots cho tour đơn
    if (
      _singleTour &&
      _singleTour.slots > 0 &&
      _singleQty > _singleTour.slots
    ) {
      showToast(
        `⚠️ Tour này chỉ còn ${_singleTour.slots} chỗ! Vui lòng giảm số người.`,
      );
      return;
    }

    total = _singlePrice * _singleQty;
    tourInfo = _singleTour?.name || "—";
  }

  const booking = {
    id: Date.now(),
    mode: _mode,
    tourInfo,
    qty: _mode === "cart" ? getCart() : _singleQty,
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

  // ──── Lưu đơn hàng vào JSON Server (để hiện trong trang "Đã mua") ────
  try {
    const loggedUser = JSON.parse(localStorage.getItem("mq_user") || "null");
    const userId = loggedUser ? loggedUser.id : null;

    if (_mode === "cart") {
      const cart = getCart();
      for (const item of cart) {
        const order = {
          userId: userId,
          tourName: item.name,
          tourImage: item.image || "",
          price: item.price,
          quantity: item.qty,
          total: item.price * item.qty,
          status: payment === "cash" ? "pending" : "paid",
          date: date,
          createdAt: new Date().toISOString(),
        };
        await fetch(`${API_BASE}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order),
        }).catch(() => {});
      }
    } else if (_singleTour) {
      const order = {
        userId: userId,
        tourName: _singleTour.name,
        tourImage: _singleTour.image || "",
        price: _singlePrice,
        quantity: _singleQty,
        total: total,
        status: payment === "cash" ? "pending" : "paid",
        date: date,
        createdAt: new Date().toISOString(),
      };
      await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      }).catch(() => {});
    }
  } catch (e) {
    console.warn("Không thể lưu order vào server:", e.message);
  }

  // Cập nhật slots sau khi đặt thành công
  try {
    if (_mode === "cart") {
      const cart = getCart();
      for (const item of cart) {
        try {
          const tourData = await getTourById(item.id);
          if (tourData && tourData.slots > 0) {
            const newSlots = Math.max(0, tourData.slots - item.qty);
            await patchTour(item.id, { slots: newSlots });
          }
        } catch (e) {
          /* bỏ qua nếu lỗi API */
        }
      }
    } else if (_singleTour && _singleTour.slots > 0) {
      const newSlots = Math.max(0, _singleTour.slots - _singleQty);
      await patchTour(_singleTour.id, { slots: newSlots });
    }
  } catch (e) {
    /* bỏ qua nếu lỗi */
  }

  if (_mode === "cart") {
    saveCart([]);
    document
      .querySelectorAll(".cart-badge")
      .forEach((el) => (el.textContent = "0"));
  }

  document.getElementById("successInfo").innerHTML = `
    <div><strong>🗺️ Tour:</strong> ${tourInfo}</div>
    <div><strong>📅 Ngày đi:</strong> ${dateLabel}</div>
    ${
      _mode === "single"
        ? `<div><strong>👥 Số người:</strong> ${_singleQty} người</div>`
        : `<div><strong>🛒 Số tour đặt:</strong> ${JSON.parse(localStorage.getItem("mq_bookings")).at(-1)?.qty?.length || 1} tour</div>`
    }
    <div><strong>💰 Tổng tiền:</strong> <span style="color:var(--primary);font-weight:700">${fmtVnd(total)}</span></div>
    <div><strong>💳 Thanh toán:</strong> ${payLabels[payment]}</div>
    <div><strong>📞 Liên hệ:</strong> ${name} – ${phone}</div>`;

  goToStep(3);
  document.getElementById("successOverlay").classList.add("open");

  const btn = document.querySelector(".btn-confirm");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "✅ Đã đặt thành công";
  }
}

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

async function initCheckout() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  const id = parseInt(params.get("id"));
  const qty = parseInt(params.get("qty")) || 1;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateEl = document.getElementById("co_date");
  if (dateEl) dateEl.min = tomorrow.toISOString().split("T")[0];

  if (mode === "cart") {
    _mode = "cart";
    const cart = getCart();

    if (cart.length === 0) {
      alert("Giỏ hàng đang trống. Hãy thêm tour trước!");
      window.location.href = "tour.html";
      return;
    }

    document.title = "Thanh toán giỏ hàng – MinhQuy Travel";

    const qtySection = document.querySelector(".form-group:has(#co_qty)");
    if (qtySection) qtySection.style.display = "none";

    const bcEl = document.getElementById("bcTourName");
    if (bcEl) bcEl.textContent = `Giỏ hàng (${cart.length} tour)`;

    renderSummary();
  } else if (id) {
    _mode = "single";
    _singleQty = qty;

    const qtyInput = document.getElementById("co_qty");
    if (qtyInput) qtyInput.value = qty;

    const tour = await loadSingleTour(id);
    if (!tour) {
      alert("Không tìm thấy tour. Quay lại danh sách.");
      window.location.href = "tour.html";
      return;
    }

    _singleTour = tour;
    _singlePrice =
      tour.discount > 0
        ? Math.round(tour.price * (1 - tour.discount / 100))
        : tour.price;

    document.title = `Đặt tour: ${tour.name} – MinhQuy Travel`;
    renderSummary();
  } else {
    window.location.href = "tour.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initCheckout();
  initPaymentOptions();

  document
    .getElementById("checkoutForm")
    ?.addEventListener("submit", handleSubmit);
});
