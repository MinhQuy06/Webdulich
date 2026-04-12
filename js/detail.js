/* ============================================================
   detail.js – Trang chi tiết tour
   Nguồn dữ liệu DUY NHẤT: API qua api.js (getTourById)
   ⚠️  api.js + cart.js phải load TRƯỚC detail.js
   ============================================================ */

const SESSION_ICONS = {
  morning: { icon: "🌅", label: "Sáng" },
  noon: { icon: "🍽", label: "Trưa" },
  afternoon: { icon: "🌆", label: "Chiều" },
  evening: { icon: "🌙", label: "Tối" },
};

// ============================================================
// LẤY TOUR THEO ID – CHỈ QUA API
// ============================================================
async function fetchTourById(id) {
  // Gọi thẳng API — hàm getTourById từ api.js
  const tour = await getTourById(id);
  return tour;
}

// ============================================================
// RENDER CHI TIẾT TOUR
// ============================================================
function renderTourDetail(tour) {
  const container = document.getElementById("detailContainer");
  if (!container) return;

  // Build itinerary HTML
  let itineraryHtml = "";
  if (Array.isArray(tour.itinerary) && tour.itinerary.length > 0) {
    const firstItem = tour.itinerary[0];

    if (typeof firstItem === "object" && firstItem.sessions) {
      // Dạng mới: có sessions theo buổi
      itineraryHtml = tour.itinerary
        .map(
          (day, idx) => `
        <div class="itinerary-day-card" id="day-card-${idx}">
          <div class="itinerary-day-header" onclick="toggleDay(${idx})">
            <span class="day-badge">Ngày ${day.day}</span>
            <h4 class="day-title">${day.title}</h4>
            <span class="day-toggle">▼</span>
          </div>
          <div class="itinerary-day-body">
            ${day.sessions
              .map((s) => {
                const meta = SESSION_ICONS[s.time] || {
                  icon: "📌",
                  label: s.time,
                };
                return `
                <div class="session-row ${s.time}">
                  <div class="session-time">
                    <span class="session-icon">${meta.icon}</span>
                    <span class="session-label">${meta.label}</span>
                  </div>
                  <div class="session-activities">
                    ${s.activities.map((a) => `<div class="activity-item">${a}</div>`).join("")}
                  </div>
                </div>`;
              })
              .join("")}
          </div>
        </div>`,
        )
        .join("");
    } else if (typeof firstItem === "string") {
      // Dạng cũ: mảng string
      itineraryHtml = `
        <div class="itinerary-day-card">
          <div class="itinerary-day-body">
            ${tour.itinerary
              .map(
                (item) => `
              <div class="session-row">
                <div class="session-time"><span class="session-icon">📌</span></div>
                <div class="session-activities"><div class="activity-item">${item}</div></div>
              </div>`,
              )
              .join("")}
          </div>
        </div>`;
    }
  } else {
    itineraryHtml = `
      <p style="color:var(--text-muted);padding:16px 0">
        Lịch trình chi tiết đang được cập nhật.
      </p>`;
  }

  // Includes / Excludes
  let ieHtml = "";
  if (
    (tour.includes && tour.includes.length > 0) ||
    (tour.excludes && tour.excludes.length > 0)
  ) {
    ieHtml = `
      <section class="tour-section">
        <h2 class="section-heading">📋 Bao gồm & Không bao gồm</h2>
        <div class="ie-grid">
          <div class="ie-col includes">
            <h4>✓ Dịch vụ bao gồm</h4>
            <ul class="ie-list inc">
              ${(tour.includes || []).map((i) => `<li>${i}</li>`).join("")}
            </ul>
          </div>
          <div class="ie-col excludes">
            <h4>✗ Không bao gồm</h4>
            <ul class="ie-list exc">
              ${(tour.excludes || []).map((i) => `<li>${i}</li>`).join("")}
            </ul>
          </div>
        </div>
      </section>`;
  }

  const finalPrice =
    tour.discount > 0
      ? Math.round(tour.price * (1 - tour.discount / 100))
      : tour.price;

  container.innerHTML = `
    <!-- Hình ảnh -->
    <div class="tour-image-section">
      <div class="tour-image-wrapper">
        <img src="${tour.image || "img/banahilljpg.jpg"}" alt="${tour.name}"
             class="tour-main-image" onerror="this.src='img/banahilljpg.jpg'" />
        ${
          tour.discount > 0
            ? `<div class="discount-badge">-${tour.discount}%<span>Giảm giá</span></div>`
            : ""
        }
      </div>
    </div>

    <!-- Thông tin cơ bản -->
    <div class="tour-header-info">
      <h1 class="tour-title">${tour.name}</h1>
      <div class="tour-rating-row">
        <div class="rating-box">
          <span class="star-icon">⭐</span>
          <span class="rating-value">${tour.rating || 4.5}/5</span>
          <span class="rating-text">(${((tour.id * 37 + 123) % 400) + 100} đánh giá)</span>
        </div>
        ${
          tour.slots > 0 && tour.slots <= 8
            ? `<span class="slots-badge">⚡ Còn ${tour.slots} chỗ</span>`
            : ""
        }
      </div>
      <div class="tour-meta-grid">
        <div class="meta-item">
          <span class="meta-icon">📍</span>
          <div class="meta-text">
            <p class="meta-label">Địa điểm</p>
            <p class="meta-value">${tour.location || "—"}</p>
          </div>
        </div>
        <div class="meta-item">
          <span class="meta-icon">🕐</span>
          <div class="meta-text">
            <p class="meta-label">Thời gian</p>
            <p class="meta-value">${tour.duration || "—"}</p>
          </div>
        </div>
        <div class="meta-item">
          <span class="meta-icon">👥</span>
          <div class="meta-text">
            <p class="meta-label">Tối thiểu</p>
            <p class="meta-value">${tour.people || 2} người</p>
          </div>
        </div>
        <div class="meta-item">
          <span class="meta-icon">✈️</span>
          <div class="meta-text">
            <p class="meta-label">Phương tiện</p>
            <p class="meta-value">${tour.transport || "Máy bay"}</p>
          </div>
        </div>
        <div class="meta-item">
          <span class="meta-icon">🚀</span>
          <div class="meta-text">
            <p class="meta-label">Khởi hành</p>
            <p class="meta-value">${tour.departure || "TP.HCM"}</p>
          </div>
        </div>
        <div class="meta-item">
          <span class="meta-icon">🏷️</span>
          <div class="meta-text">
            <p class="meta-label">Loại tour</p>
            <p class="meta-value">${tour.category === "vn" ? "🇻🇳 Việt Nam" : "🌍 Nước ngoài"}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Giới thiệu -->
    <section class="tour-section">
      <h2 class="section-heading">📖 Giới thiệu tour</h2>
      <p class="tour-description">${tour.description || "Đang cập nhật..."}</p>
      <div class="highlights-list">
        <div class="highlight-tag">✓ Hướng dẫn viên chuyên nghiệp</div>
        <div class="highlight-tag">✓ Khách sạn đạt chuẩn</div>
        <div class="highlight-tag">✓ Bảo hiểm du lịch</div>
        <div class="highlight-tag">✓ Hỗ trợ 24/7</div>
      </div>
    </section>

    <!-- Lịch trình -->
    <section class="tour-section">
      <h2 class="section-heading">📅 Lịch trình chi tiết</h2>
      <div class="itinerary-container">${itineraryHtml}</div>
    </section>

    <!-- Bao gồm / Không bao gồm -->
    ${ieHtml}

    <!-- Chính sách -->
    <section class="tour-section">
      <h2 class="section-heading">🛡️ Chính sách & Cam kết</h2>
      <div class="policies-grid">
        <div class="policy-card"><div class="policy-icon">🔄</div><p><strong>Miễn phí hủy</strong>Trước 7 ngày</p></div>
        <div class="policy-card"><div class="policy-icon">🛡️</div><p><strong>Bảo hiểm</strong>Du lịch toàn diện</p></div>
        <div class="policy-card"><div class="policy-icon">☎️</div><p><strong>Hỗ trợ 24/7</strong>Tiếng Việt</p></div>
        <div class="policy-card"><div class="policy-icon">💳</div><p><strong>Thanh toán</strong>Linh hoạt</p></div>
      </div>
    </section>
  `;
}

// ============================================================
// RENDER BOOKING BOX
// ============================================================
function renderBookingBox(tour) {
  const box = document.getElementById("bookingBox");
  if (!box) return;

  const finalPrice =
    tour.discount > 0
      ? Math.round(tour.price * (1 - tour.discount / 100))
      : tour.price;

  const discountLine =
    tour.discount > 0
      ? `<div class="old-price">${fmtVnd(tour.price)}</div>
       <span class="discount-info">Tiết kiệm ${fmtVnd(tour.price - finalPrice)}</span>`
      : "";

  // Lưu finalPrice vào window để updateSubtotal dùng
  window._detailFinalPrice = finalPrice;

  box.innerHTML = `
    <div class="booking-card">
      <p class="booking-label">Giá tour / người</p>
      <div class="price-section">
        ${discountLine}
        <div class="final-price">
          <span class="price-value">${fmtVnd(finalPrice)}</span>
          <span class="price-unit">/người</span>
        </div>
      </div>
      <div class="divider"></div>
      <div class="quantity-section">
        <label class="qty-label">👥 Số người tham gia</label>
        <div class="quantity-control">
          <button class="qty-btn" type="button" onclick="changePeople(-1)">−</button>
          <input type="number" id="peopleCount" value="1" min="1" max="20"
                 readonly class="qty-input" />
          <button class="qty-btn" type="button" onclick="changePeople(1)">+</button>
        </div>
      </div>
      <div class="subtotal-section">
        <p class="subtotal-label">Tổng cộng</p>
        <p class="subtotal-price" id="subtotalPrice">${fmtVnd(finalPrice)}</p>
      </div>
      <button class="btn-book" type="button"
        onclick="handleAddToCart(${tour.id}, '${tour.name.replace(/'/g, "\\'")}', ${finalPrice}, '${tour.image || ""}')">
        🛒 Thêm vào giỏ
      </button>
      <button class="btn-book-now" type="button"
        onclick="handleBookNow(${tour.id})">
        ⚡ Đặt ngay
      </button>
      <div class="booking-note">
        <p>💡 Tư vấn: <strong>0123 456 789</strong></p>
        <p>📧 <strong>info@minhquytravel.com</strong></p>
      </div>
      <div class="booking-badges">
        <span class="badge">✓ Giá tốt nhất – Cam kết hoàn tiền</span>
        <span class="badge">✓ Đặt online an toàn 100%</span>
      </div>
    </div>`;
}

// ============================================================
// CÁC HÀM TƯƠNG TÁC
// ============================================================
let _pCount = 1;

function changePeople(delta) {
  _pCount = Math.max(1, Math.min(20, _pCount + delta));
  const el = document.getElementById("peopleCount");
  if (el) el.value = _pCount;
  updateSubtotal();
}

function updateSubtotal() {
  const price = window._detailFinalPrice || 0;
  const el = document.getElementById("subtotalPrice");
  if (el) el.textContent = fmtVnd(price * _pCount);
}

function handleAddToCart(id, name, price, image) {
  const qty = parseInt(document.getElementById("peopleCount")?.value) || 1;
  addToCart({ id, name, price, image, qty });
  openCart();
}

function handleBookNow(id) {
  const qty = parseInt(document.getElementById("peopleCount")?.value) || 1;
  window.location.href = `checkout.html?id=${id}&qty=${qty}`;
}

function toggleDay(idx) {
  document.getElementById(`day-card-${idx}`)?.classList.toggle("collapsed");
}

// ============================================================
// RENDER LỖI / NOT FOUND
// ============================================================
function renderError(type, id) {
  const c = document.getElementById("detailContainer");
  const b = document.getElementById("bookingBox");

  if (type === "notfound") {
    if (c)
      c.innerHTML = `
      <div class="not-found-container">
        <div class="not-found-content">
          <div class="not-found-icon">😕</div>
          <h2>Không tìm thấy tour</h2>
          <p>Tour #${id} không tồn tại trong hệ thống.</p>
          <a href="tour.html" class="btn-back">← Quay lại danh sách</a>
        </div>
      </div>`;
  } else {
    // API error
    if (c)
      c.innerHTML = `
      <div class="not-found-container">
        <div class="not-found-content">
          <div class="not-found-icon">⚠️</div>
          <h2 style="color:var(--danger)">Không kết nối được API</h2>
          <p style="color:var(--text-muted);margin-bottom:18px">
            Hãy chạy json-server để tải dữ liệu.
          </p>
          <code style="display:block;background:#1a2340;color:#7dd3fc;
                       padding:10px 16px;border-radius:8px;font-size:.82rem;margin-bottom:16px">
            npx json-server --watch data/db.json --port 3000
          </code>
          <button onclick="location.reload()" style="
            background:var(--primary);color:#fff;border:none;
            padding:10px 22px;border-radius:8px;cursor:pointer;font-weight:700">
            🔄 Thử lại
          </button>
        </div>
      </div>`;
  }

  if (b) b.innerHTML = "";
}

// ============================================================
// INIT – Chỉ gọi API, không fallback gì cả
// ============================================================
async function initDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"));

  if (!id) {
    renderError("notfound", id);
    return;
  }

  // Loading state
  const c = document.getElementById("detailContainer");
  if (c)
    c.innerHTML = `
    <div style="text-align:center;padding:80px 20px;color:var(--text-muted)">
      <div style="width:36px;height:36px;border:3px solid var(--primary-light);
                  border-top-color:var(--primary);border-radius:50%;
                  animation:spin .7s linear infinite;margin:0 auto 14px">
      </div>
      <p>Đang tải thông tin tour…</p>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;

  try {
    // Gọi API — getTourById từ api.js → GET /tours/:id
    const tour = await fetchTourById(id);

    if (!tour) {
      renderError("notfound", id);
      return;
    }

    window._currentTour = tour;
    document.title = tour.name + " – MinhQuy Travel";

    renderTourDetail(tour);
    renderBookingBox(tour);
    window.scrollTo(0, 0);
  } catch (err) {
    console.error("Detail API error:", err.message);
    renderError("apierror", id);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initDetailPage();
});
