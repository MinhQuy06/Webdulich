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

// --- Badge update ---
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
    drawer.innerHTML = cart
      .map(
        (item) => `
      <div class="cart-item">
        <img class="cart-item-img" src="${item.image || "img/banahilljpg.jpg"}" alt="${item.name}" onerror="this.src='img/banahilljpg.jpg'" />
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${fmtVnd(item.price * item.qty)}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
            <button class="cart-remove" onclick="removeFromCart(${item.id})">✕ Xóa</button>
          </div>
        </div>
      </div>
    `,
      )
      .join("");
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
function initNavbar() {
  const nav = document.getElementById("navbar");
  if (!nav) return;
  window.addEventListener("scroll", () =>
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
});

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
