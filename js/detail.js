/* ============================================================
   detail.js – Chi tiết tour (upgraded)
   - Itinerary theo buổi (sáng/trưa/chiều/tối)
   - "Thêm vào giỏ" → localStorage
   - "Đặt ngay" → checkout.html?id=X&qty=Y
   ============================================================ */

const SESSION_ICONS = {
  morning: { icon: "🌅", label: "Sáng" },
  noon: { icon: "🍽", label: "Trưa" },
  afternoon: { icon: "🌆", label: "Chiều" },
  evening: { icon: "🌙", label: "Tối" },
};

// --- Fetch tour theo ID ---
async function getTourById(id) {
  // Thử localStorage (Admin có thể đã sửa)
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
  // Fallback: đọc từ file JSON
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

function fmtVnd(n) {
  return parseInt(n).toLocaleString("vi-VN") + "đ";
}

// --- Render chi tiết bên trái ---
function renderTourDetail(tour) {
  const container = document.getElementById("detailContainer");
  if (!container) return;

  const finalPrice =
    tour.discount > 0
      ? Math.round(tour.price * (1 - tour.discount / 100))
      : tour.price;

  // Build itinerary HTML
  let itineraryHtml = "";
  if (Array.isArray(tour.itinerary) && tour.itinerary.length > 0) {
    const firstItem = tour.itinerary[0];

    if (typeof firstItem === "object" && firstItem.sessions) {
      // ✅ Dạng mới: có sessions theo buổi
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
                  ${s.activities
                    .map(
                      (a) => `
                    <div class="activity-item">${a}</div>
                  `,
                    )
                    .join("")}
                </div>
              </div>`;
              })
              .join("")}
          </div>
        </div>
      `,
        )
        .join("");
    } else {
      // Fallback: dạng cũ (mảng string)
      itineraryHtml = `
        <div class="itinerary-day-card">
          <div class="itinerary-day-body">
            ${tour.itinerary
              .map(
                (item) => `
              <div class="session-row">
                <div class="session-time">
                  <span class="session-icon">📌</span>
                </div>
                <div class="session-activities">
                  <div class="activity-item">${item}</div>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>`;
    }
  }

  // Build includes/excludes HTML
  let ieHtml = "";
  if (tour.includes || tour.excludes) {
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

  container.innerHTML = `
    <!-- Hình ảnh -->
    <div class="tour-image-section">
      <div class="tour-image-wrapper">
        <img src="${tour.image}" alt="${tour.name}" class="tour-main-image"
             onerror="this.src='img/banahilljpg.jpg'" />
        ${
          tour.discount > 0
            ? `
          <div class="discount-badge">-${tour.discount}%<span>Giảm giá</span></div>
        `
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
          <span class="rating-value">${tour.rating}/5</span>
          <span class="rating-text">(${Math.floor(Math.random() * 400 + 100)} đánh giá)</span>
        </div>
        ${tour.slots <= 8 ? `<span class="slots-badge">⚡ Còn ${tour.slots} chỗ</span>` : ""}
      </div>
      <div class="tour-meta-grid">
        <div class="meta-item">
          <span class="meta-icon">📍</span>
          <div class="meta-text"><p class="meta-label">Địa điểm</p><p class="meta-value">${tour.location}</p></div>
        </div>
        <div class="meta-item">
          <span class="meta-icon">🕐</span>
          <div class="meta-text"><p class="meta-label">Thời gian</p><p class="meta-value">${tour.duration}</p></div>
        </div>
        <div class="meta-item">
          <span class="meta-icon">👥</span>
          <div class="meta-text"><p class="meta-label">Tối thiểu</p><p class="meta-value">${tour.people} người</p></div>
        </div>
        <div class="meta-item">
          <span class="meta-icon">✈️</span>
          <div class="meta-text"><p class="meta-label">Phương tiện</p><p class="meta-value">${tour.transport}</p></div>
        </div>
        <div class="meta-item">
          <span class="meta-icon">📍</span>
          <div class="meta-text"><p class="meta-label">Khởi hành</p><p class="meta-value">${tour.departure}</p></div>
        </div>
        <div class="meta-item">
          <span class="meta-icon">🏷️</span>
          <div class="meta-text"><p class="meta-label">Loại tour</p><p class="meta-value">${tour.category === "vn" ? "🇻🇳 Việt Nam" : "🌍 Nước ngoài"}</p></div>
        </div>
      </div>
    </div>

    <!-- Giới thiệu -->
    <section class="tour-section">
      <h2 class="section-heading">📖 Giới thiệu tour</h2>
      <p class="tour-description">${tour.description}</p>
      <div class="highlights-list">
        <div class="highlight-tag">✓ Hướng dẫn viên chuyên nghiệp</div>
        <div class="highlight-tag">✓ Khách sạn đạt chuẩn</div>
        <div class="highlight-tag">✓ Bảo hiểm du lịch</div>
        <div class="highlight-tag">✓ Hỗ trợ 24/7</div>
      </div>
    </section>

    <!-- Lịch trình chi tiết -->
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

// --- Toggle ngày trong lịch trình ---
function toggleDay(idx) {
  const card = document.getElementById(`day-card-${idx}`);
  if (card) card.classList.toggle("collapsed");
}

// --- Render booking box bên phải ---
function renderBookingBox(tour, finalPrice) {
  const box = document.getElementById("bookingBox");
  if (!box) return;

  const discountLine =
    tour.discount > 0
      ? `<div class="old-price">${fmtVnd(tour.price)}</div>
       <span class="discount-info">Tiết kiệm ${fmtVnd(tour.price - finalPrice)}</span>`
      : "";

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
          <button class="qty-btn" onclick="changePeople(-1)" type="button">−</button>
          <input type="number" id="peopleCount" value="1" min="1" max="20" readonly class="qty-input" />
          <button class="qty-btn" onclick="changePeople(1)" type="button">+</button>
        </div>
      </div>

      <div class="subtotal-section">
        <p class="subtotal-label">Tổng cộng</p>
        <p class="subtotal-price" id="subtotalPrice">${fmtVnd(finalPrice)}</p>
      </div>

      <!-- ✅ FIX: 2 nút với đúng hành vi -->
      <button class="btn-book" type="button"
        onclick="handleAddToCart(${tour.id}, '${tour.name.replace(/'/g, "\\'")}', ${finalPrice}, '${tour.image}')">
        🛒 Thêm vào giỏ
      </button>

      <button class="btn-book-now" type="button"
        onclick="handleBookNow(${tour.id})">
        ⚡ Đặt ngay
      </button>

      <div class="booking-note">
        <p>💡 Tư vấn miễn phí: <strong>0123 456 789</strong></p>
        <p>📧 <strong>info@minhquytravel.com</strong></p>
      </div>

      <div class="booking-badges">
        <span class="badge">✓ Giá tốt nhất – Cam kết hoàn tiền</span>
        <span class="badge">✓ Đặt online an toàn 100%</span>
      </div>
    </div>
  `;
}

// --- Cập nhật subtotal ---
function updateSubtotal() {
  const count = parseInt(document.getElementById("peopleCount")?.value) || 1;
  const tour = window._currentTour;
  if (!tour) return;
  const finalPrice =
    tour.discount > 0
      ? Math.round(tour.price * (1 - tour.discount / 100))
      : tour.price;
  const el = document.getElementById("subtotalPrice");
  if (el) el.textContent = fmtVnd(finalPrice * count);
}

// --- Quản lý số người ---
let _pCount = 1;
function changePeople(delta) {
  _pCount = Math.max(1, Math.min(20, _pCount + delta));
  const el = document.getElementById("peopleCount");
  if (el) el.value = _pCount;
  updateSubtotal();
}

// --- ✅ Thêm vào giỏ ---
function handleAddToCart(id, name, price, image) {
  const qty = parseInt(document.getElementById("peopleCount")?.value) || 1;
  addToCart({ id, name, price, image, qty });
  // addToCart đã gọi showToast, chỉ cần mở drawer
  openCart();
}

// --- ✅ Đặt ngay → chuyển tới checkout ---
function handleBookNow(id) {
  const qty = parseInt(document.getElementById("peopleCount")?.value) || 1;
  window.location.href = `checkout.html?id=${id}&qty=${qty}`;
}

// --- Not found ---
function renderNotFound() {
  const c = document.getElementById("detailContainer");
  if (c)
    c.innerHTML = `
    <div class="not-found-container">
      <div class="not-found-content">
        <div class="not-found-icon">😕</div>
        <h2>Không tìm thấy tour</h2>
        <p>Tour bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        <a href="tour.html" class="btn-back">← Quay lại danh sách tours</a>
      </div>
    </div>`;
  const b = document.getElementById("bookingBox");
  if (b) b.innerHTML = "";
}

// --- Init ---
async function initDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"));
  if (!id) {
    renderNotFound();
    return;
  }

  const tour = await getTourById(id);
  if (!tour) {
    renderNotFound();
    return;
  }

  window._currentTour = tour;
  document.title = tour.name + " – MinhQuy Travel";

  const finalPrice =
    tour.discount > 0
      ? Math.round(tour.price * (1 - tour.discount / 100))
      : tour.price;

  renderTourDetail(tour);
  renderBookingBox(tour, finalPrice);
  window.scrollTo(0, 0);
}

document.addEventListener("DOMContentLoaded", () => {
  initDetailPage();
});
