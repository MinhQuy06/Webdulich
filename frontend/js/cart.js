/* ============================================================
   cart.js – Giỏ hàng dùng LocalStorage
   ============================================================ */

const CART_KEY = "mq_cart";

// --- Helpers ---
const getCart = () => JSON.parse(localStorage.getItem(CART_KEY) || "[]");
const saveCart = (cart) => localStorage.setItem(CART_KEY, JSON.stringify(cart));

// --- Add item ---
function addToCart(tour) {
  const cart = getCart();
  const idx = cart.findIndex((i) => i.id === tour.id);
  const qty = tour.qty || 1;
  if (idx > -1) {
    cart[idx].qty += qty;
  } else {
    cart.push({ ...tour, qty: qty });
  }
  saveCart(cart);
  updateCartBadge();
  showToast(`✅ Đã thêm "${tour.name}" vào giỏ!`);
  renderCartDrawer();
}

// --- Remove item ---
function removeFromCart(id) {
  const cart = getCart().filter((i) => i.id !== id);
  saveCart(cart);
  updateCartBadge();
  renderCartDrawer();
}

// --- Change qty ---
function changeQty(id, delta) {
  const cart = getCart();
  const idx = cart.findIndex((i) => i.id === id);
  if (idx === -1) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  saveCart(cart);
  updateCartBadge();
  renderCartDrawer();
}

function updateCartBadge() {
  const total = getCart().reduce((s, i) => s + i.qty, 0);
  document
    .querySelectorAll(".cart-badge")
    .forEach((el) => (el.textContent = total));
}

// --- Total ---
function getCartTotal() {
  return getCart().reduce((s, i) => s + i.price * i.qty, 0);
}

// --- Format VND ---
function fmtVnd(n) {
  return n.toLocaleString("vi-VN") + "đ";
}

// --- Escape HTML – ngăn XSS khi inject vào DOM ---
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// --- Render Cart Drawer ---
function renderCartDrawer() {
  const drawer = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  if (!drawer) return;
  const cart = getCart();
  if (cart.length === 0) {
    drawer.innerHTML =
      '<p class="cart-empty">🛒 Giỏ hàng trống.<br/>Hãy thêm tour bạn thích!</p>';
  } else {
    // Dùng createElement thay innerHTML để tránh XSS từ dữ liệu localStorage
    drawer.innerHTML = "";
    cart.forEach((item) => {
      const safeId = Number(item.id);
      const wrap = document.createElement("div");
      wrap.className = "cart-item";

      const img = document.createElement("img");
      img.className = "cart-item-img";
      img.src = item.image || "img/banahilljpg.jpg";
      img.alt = escapeHtml(item.name);
      img.onerror = function () { this.src = "img/banahilljpg.jpg"; };

      const info = document.createElement("div");
      info.className = "cart-item-info";

      const nameEl = document.createElement("div");
      nameEl.className = "cart-item-name";
      nameEl.textContent = item.name; // textContent tự escape HTML

      const priceEl = document.createElement("div");
      priceEl.className = "cart-item-price";
      priceEl.textContent = fmtVnd(item.price * item.qty);

      const qtyWrap = document.createElement("div");
      qtyWrap.className = "cart-item-qty";
      qtyWrap.innerHTML = `
        <button class="qty-btn" onclick="changeQty(${safeId}, -1)">−</button>
        <span class="qty-val">${escapeHtml(String(item.qty))}</span>
        <button class="qty-btn" onclick="changeQty(${safeId}, 1)">+</button>
        <button class="cart-remove" onclick="removeFromCart(${safeId})">✕ Xóa</button>
      `;

      info.append(nameEl, priceEl, qtyWrap);
      wrap.append(img, info);
      drawer.appendChild(wrap);
    });
  }
  if (totalEl) totalEl.textContent = fmtVnd(getCartTotal());
}

// --- Open / Close Cart ---
function openCart() {
  document.getElementById("cartOverlay")?.classList.add("open");
  document.getElementById("cartDrawer")?.classList.add("open");
  renderCartDrawer();
}
function closeCart() {
  document.getElementById("cartOverlay")?.classList.remove("open");
  document.getElementById("cartDrawer")?.classList.remove("open");
}

// --- Toast ---
function showToast(msg) {
  const t =
    document.getElementById("toast") || document.querySelector(".toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 3000);
}

// --- Chat ---
function initChat() {
  const toggle = document.getElementById("chatToggle");
  const box = document.getElementById("chatBox");
  const close = document.getElementById("chatClose");
  const send = document.getElementById("chatSend");
  const input = document.getElementById("chatInput");
  const msgs = document.getElementById("chatMessages");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    box.classList.toggle("open");
    document.querySelector(".chat-dot")?.remove();
  });
  close?.addEventListener("click", () => box.classList.remove("open"));

  function appendMsg(text, type) {
    const d = document.createElement("div");
    d.className = `msg ${type}`;
    d.innerHTML = `<span>${text}</span>`;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function sendMsg() {
    const t = input.value.trim();
    if (!t) return;
    appendMsg(t, "user");
    input.value = "";
    const replies = [
      "😊 Cảm ơn bạn! Tư vấn viên sẽ phản hồi trong 5 phút.",
      "📞 Hotline: 1900 1234 – Luôn sẵn sàng hỗ trợ bạn!",
      "🔥 Hiện có nhiều tour đang giảm giá hấp dẫn!",
      "✈️ Chúng tôi có hơn 200 điểm đến cho bạn khám phá!",
      "💡 Bạn có thể xem thêm tour hot tại trang chủ nhé!",
    ];
    setTimeout(
      () =>
        appendMsg(replies[Math.floor(Math.random() * replies.length)], "bot"),
      800,
    );
  }

  send?.addEventListener("click", sendMsg);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMsg();
  });
}

// --- Navbar scroll ---
//
function initNavbar() {
  const nav = document.getElementById("navbar");
  if (!nav) return;
  window.addEventListener("scroll", () =>
    // toggle thêm class "scrolled" vào navbar khi scrollY > 50, nếu scrollY <= 50 thì sẽ xóa class "scrolled" khỏi navbar
    nav.classList.toggle("scrolled", window.scrollY > 50),
  );
}

// --- Hamburger ---
function initHamburger() {
  const btn = document.getElementById("hamburger");
  const links = document.getElementById("navLinks");
  if (!btn || !links) return;
  btn.addEventListener("click", () => {
    btn.classList.toggle("open");
    links.classList.toggle("open");
  });
}

// --- Init all ---
document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initHamburger();
  initChat();
  updateCartBadge();
  renderCartDrawer();

  // Cart open/close
  document.querySelector(".cart-btn")?.addEventListener("click", openCart);
  document.getElementById("cartOverlay")?.addEventListener("click", closeCart);
  document.getElementById("cartCloseBtn")?.addEventListener("click", closeCart);

  // Cập nhật nút đăng nhập/Tôi trên navbar
  updateNavAuth();
});

// --- Cập nhật nút auth trên navbar ---
function updateNavAuth() {
  const btn = document.getElementById("navAuthBtn") || document.querySelector(".btn-login[href='login.html']");
  if (!btn) return;

  try {
    const user = JSON.parse(localStorage.getItem("mq_user") || "null");
    if (user) {
      btn.textContent = "👤 " + (user.fullname || user.username);
      btn.href = "profile.html";
    }
  } catch {
    // ignore
  }
}

// ============================================================
// goToCheckout – Nút Thanh toán trong giỏ hàng
// ============================================================
function goToCheckout() {
  const cart = getCart();
  if (cart.length === 0) {
    showToast("🛒 Giỏ hàng đang trống!");
    return;
  }
  // Chuyển sang checkout với mode=cart (không cần id)
  window.location.href = "checkout.html?mode=cart";
}
