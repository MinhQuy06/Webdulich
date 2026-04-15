// alo alo
let adminTours = [];
let editingId = null;

const fmtV = (n) => parseInt(n || 0).toLocaleString("vi-VN") + "đ";

function setEl(id, v) {
  const el = document.getElementById(id);
  if (el) el.textContent = v;
}

function showToast(msg, type = "success") {
  const el = document.getElementById("adminToast");
  if (!el) return;
  el.textContent = msg;
  el.style.background = type === "error" ? "#e53935" : "#1a2340";
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 3000);
}

function setLoading(on) {
  const el = document.getElementById("loadingOverlay");
  if (el) el.classList.toggle("active", on);
}

function updateMiniStats(tours) {
  const vn = tours.filter((t) => t.category === "vn").length;
  const nn = tours.filter((t) => t.category === "nn").length;
  const dis = tours.filter((t) => (t.discount || 0) > 0).length;
  setEl("totalCount", tours.length);
  setEl("totalCount2", tours.length);
  setEl("countVN", vn);
  setEl("countNN", nn);
  setEl("countDiscount", dis);
}

function renderTable(tours) {
  const tbody = document.getElementById("adminTbody");
  if (!tbody) return;

  if (!tours || tours.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">
          <div style="font-size:2.5rem;margin-bottom:10px">🔍</div>
          Chưa có tour nào. Hãy thêm tour mới!
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = tours
    .map((t) => {
      const isVN = t.category === "vn";
      const badge = isVN
        ? `<span style="background:#e8f0fe;color:var(--primary);padding:3px 10px;border-radius:100px;font-size:.74rem;font-weight:700">🇻🇳 VN</span>`
        : `<span style="background:#fff3e8;color:var(--accent);padding:3px 10px;border-radius:100px;font-size:.74rem;font-weight:700">🌍 NN</span>`;

      return `
      <tr>
        <td style="color:var(--text-muted);font-size:.78rem;font-weight:600">#${t.id}</td>
        <td>
          <div style="display:flex;align-items:center;gap:11px">
            <img src="${t.image || "img/banahilljpg.jpg"}"
                 style="width:52px;height:38px;object-fit:cover;border-radius:8px;flex-shrink:0"
                 onerror="this.src='img/banahilljpg.jpg'"/>
            <div>
              <strong style="font-size:.87rem;color:var(--text)">${t.name}</strong>
              ${
                t.discount > 0
                  ? `<span style="display:block;font-size:.71rem;color:var(--danger);margin-top:2px">🔥 Giảm ${t.discount}%</span>`
                  : ""
              }
            </div>
          </div>
        </td>
        <td style="color:var(--text-muted);font-size:.84rem">${t.location || "—"}</td>
        <td style="color:var(--text-muted);font-size:.84rem">${t.duration || "—"}</td>
        <td style="color:var(--accent);font-weight:700;white-space:nowrap">${fmtV(t.price)}</td>
        <td>${badge}</td>
        <td style="white-space:nowrap">
          <button class="admin-btn edit-btn" onclick="openEdit('${t.id}')">✏️ Sửa</button>
          <button class="admin-btn del-btn"  onclick="handleDelete('${t.id}')">🗑 Xóa</button>
        </td>
      </tr>`;
    })
    .join("");
}

let _searchTimer = null;

async function loadAndRender(q = "") {
  setLoading(true);
  try {
    const tours = q ? await searchTours({ q }) : await getTours();
    adminTours = tours;
    renderTable(tours);
    updateMiniStats(tours);
    setEl("totalCount", tours.length);
  } catch (err) {
    console.error(err);
    showToast(
      "❌ Không kết nối API. Chạy: npx json-server --watch data/db.json --port 3000",
      "error",
    );
    const tbody = document.getElementById("adminTbody");
    if (tbody)
      tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:40px">
          <div style="color:var(--danger);font-size:1rem;font-weight:700;margin-bottom:10px">⚠️ Không kết nối được API</div>
          <code style="background:#1a2340;color:#7dd3fc;padding:8px 16px;border-radius:8px;font-size:.82rem">
            npx json-server --watch data/db.json --port 3000
          </code>
        </td>
      </tr>`;
  } finally {
    setLoading(false);
  }
}

function openAdd() {
  editingId = null;
  setEl("formTitle", "➕ Thêm Tour Mới");
  document.getElementById("tourForm").reset();
  document.getElementById("tourId").value = "";
  document.getElementById("fImagePreview").style.display = "none";
  openModal();
}

async function openEdit(id) {
  id = String(id);
  setLoading(true);
  try {
    const t = await getTourById(id);
    if (!t) {
      showToast("❌ Không tìm thấy tour!", "error");
      return;
    }
    editingId = id;
    setEl("formTitle", "✏️ Chỉnh sửa Tour");

    document.getElementById("tourId").value = t.id;
    document.getElementById("fName").value = t.name || "";
    document.getElementById("fLocation").value = t.location || "";
    document.getElementById("fCategory").value = t.category || "vn";
    document.getElementById("fPrice").value = t.price || "";
    document.getElementById("fDuration").value = t.duration || "";
    document.getElementById("fDiscount").value = t.discount || 0;
    document.getElementById("fSlots").value = t.slots || 0;
    document.getElementById("fPeople").value = t.people || 2;
    document.getElementById("fRating").value = t.rating || 4.5;
    document.getElementById("fImage").value = t.image || "";
    document.getElementById("fDesc").value = t.description || "";

    // Show image preview
    const prev = document.getElementById("fImagePreview");
    if (t.image) {
      prev.src = t.image;
      prev.style.display = "block";
    } else prev.style.display = "none";

    openModal();
  } catch (err) {
    showToast("❌ Lỗi tải tour: " + err.message, "error");
  } finally {
    setLoading(false);
  }
}

function openModal() {
  document.getElementById("formModal").classList.add("open");
  document.getElementById("formOverlay").classList.add("open");
  setTimeout(() => document.getElementById("fName")?.focus(), 100);
}

function closeModal() {
  document.getElementById("formModal").classList.remove("open");
  document.getElementById("formOverlay").classList.remove("open");
  editingId = null;
}

async function saveTour(e) {
  e.preventDefault();
  const name = document.getElementById("fName").value.trim();
  const location = document.getElementById("fLocation").value.trim();
  const category = document.getElementById("fCategory").value;
  const price = parseInt(document.getElementById("fPrice").value) || 0;
  const duration = document.getElementById("fDuration").value.trim();
  const discount = parseInt(document.getElementById("fDiscount").value) || 0;
  const slots = parseInt(document.getElementById("fSlots").value) || 0;
  const people = parseInt(document.getElementById("fPeople").value) || 2;
  const rating = parseFloat(document.getElementById("fRating").value) || 4.5;
  const image = document.getElementById("fImage").value.trim();
  const desc = document.getElementById("fDesc").value.trim();

  if (!name || !location || !price) {
    showToast("❌ Vui lòng điền: Tên, Địa điểm, Giá!", "error");
    return;
  }

  const btn = document.getElementById("saveBtn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "⏳ Đang lưu…";
  }

  const data = {
    name,
    location,
    category,
    price,
    duration,
    discount,
    slots,
    people,
    rating,
    image,
    description: desc,
    departure: "TP.HCM",
    transport: "Máy bay",
    itinerary: [],
    includes: [],
    excludes: [],
  };

  try {
    if (editingId !== null) {
      const existing =
        adminTours.find((x) => String(x.id) === String(editingId)) || {};
      await updateTour(editingId, { ...existing, ...data, id: editingId });
      showToast("✅ Cập nhật tour thành công!");
    } else {
      // Tạo id số tự tăng thay vì để json-server tạo string
      const allTours = await getTours();
      const maxId = allTours.reduce(
        (max, t) => Math.max(max, parseInt(t.id) || 0),
        0,
      );
      await addTour({ ...data, id: String(maxId + 1) });
      showToast("✅ Thêm tour mới thành công!");
    }
    closeModal();
    await loadAndRender(document.getElementById("adminSearch")?.value || "");
  } catch (err) {
    showToast("❌ Lỗi lưu: " + err.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "💾 Lưu tour";
    }
  }
}

async function handleDelete(id) {
  id = String(id);
  const t = adminTours.find((x) => String(x.id) === id);
  if (
    !confirm(
      `Xóa tour "${t?.name || "#" + id}"?\nHành động này không thể hoàn tác.`,
    )
  )
    return;
  setLoading(true);
  try {
    await deleteTour(id);
    showToast(`🗑 Đã xóa tour thành công!`);
    await loadAndRender(document.getElementById("adminSearch")?.value || "");
  } catch (err) {
    showToast("❌ Lỗi xóa: " + err.message, "error");
  } finally {
    setLoading(false);
  }
}

async function renderStatsPage() {
  try {
    const tours = await getTours();
    const total = tours.length;
    const vn = tours.filter((t) => t.category === "vn").length;
    const nn = tours.filter((t) => t.category === "nn").length;
    const discount = tours.filter((t) => (t.discount || 0) > 0).length;

    setEl("statTotal", total);
    setEl("statVN", vn);
    setEl("statNN", nn);
    setEl("statDiscount", discount);

    const setPct = (id, pct) => {
      const el = document.getElementById(id);
      if (el) el.style.width = Math.min(100, Math.max(4, pct)) + "%";
    };
    setPct("barTotal", 100);
    setPct("barVN", total > 0 ? (vn / total) * 100 : 0);
    setPct("barNN", total > 0 ? (nn / total) * 100 : 0);
    setPct("barDiscount", total > 0 ? (discount / total) * 100 : 0);

    const chartCat = document.getElementById("chartCategory");
    if (chartCat) {
      if (total === 0) {
        chartCat.innerHTML =
          '<p style="color:var(--text-muted);font-size:.84rem">Chưa có dữ liệu</p>';
      } else {
        chartCat.innerHTML = [
          { label: "🇻🇳 Việt Nam", count: vn, color: "var(--primary)" },
          { label: "🌍 Nước ngoài", count: nn, color: "var(--accent)" },
          { label: "🔥 Giảm giá", count: discount, color: "#e53935" },
        ]
          .map((r) => {
            const pct = Math.round((r.count / total) * 100);
            return `
            <div class="chart-row">
              <span class="chart-label">${r.label}</span>
              <div class="chart-bar-bg">
                <div class="chart-bar-fill" style="width:${pct}%;background:${r.color}"></div>
              </div>
              <span class="chart-pct">${r.count} / ${pct}%</span>
            </div>`;
          })
          .join("");
      }
    }

    const chartPrice = document.getElementById("chartPrice");
    if (chartPrice) {
      const ranges = [
        { label: "Dưới 1 triệu", min: 0, max: 1e6, color: "#22c55e" },
        { label: "1 – 5 triệu", min: 1e6, max: 5e6, color: "var(--primary)" },
        { label: "5 – 10 triệu", min: 5e6, max: 10e6, color: "var(--accent)" },
        { label: "Trên 10 triệu", min: 10e6, max: Infinity, color: "#e53935" },
      ];
      chartPrice.innerHTML = ranges
        .map((r) => {
          const count = tours.filter(
            (t) => t.price >= r.min && t.price < r.max,
          ).length;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return `
          <div class="chart-row">
            <span class="chart-label">${r.label}</span>
            <div class="chart-bar-bg">
              <div class="chart-bar-fill" style="width:${pct}%;background:${r.color}"></div>
            </div>
            <span class="chart-pct">${count} / ${pct}%</span>
          </div>`;
        })
        .join("");
    }

    const topBody = document.getElementById("statsTopBody");
    if (topBody) {
      const top5 = [...tours].sort((a, b) => b.price - a.price).slice(0, 5);
      const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
      topBody.innerHTML =
        top5.length === 0
          ? '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted)">Chưa có dữ liệu</td></tr>'
          : top5
              .map((t, i) => {
                const isVN = t.category === "vn";
                return `
              <tr>
                <td style="text-align:center;font-size:1.1rem">${medals[i]}</td>
                <td><strong style="font-size:.87rem">${t.name}</strong></td>
                <td style="color:var(--text-muted);font-size:.84rem">${t.location || "—"}</td>
                <td>
                  <span style="background:${isVN ? "#e8f0fe" : "#fff3e8"};color:${isVN ? "var(--primary)" : "var(--accent)"};padding:3px 10px;border-radius:100px;font-size:.74rem;font-weight:700">
                    ${isVN ? "🇻🇳 VN" : "🌍 NN"}
                  </span>
                </td>
                <td style="color:var(--accent);font-weight:700">${fmtV(t.price)}</td>
                <td>⭐ ${t.rating || "—"}</td>
              </tr>`;
              })
              .join("");
    }

    const discBody = document.getElementById("statsDiscountBody");
    if (discBody) {
      const disc = tours
        .filter((t) => (t.discount || 0) > 0)
        .sort((a, b) => b.discount - a.discount);
      discBody.innerHTML =
        disc.length === 0
          ? '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted)">Không có tour nào đang giảm giá</td></tr>'
          : disc
              .map((t) => {
                const fp = Math.round(t.price * (1 - t.discount / 100));
                return `
              <tr>
                <td><strong style="font-size:.87rem">${t.name}</strong></td>
                <td style="color:var(--text-muted);text-decoration:line-through;font-size:.84rem">${fmtV(t.price)}</td>
                <td>
                  <span style="background:#ffeaea;color:#e53935;padding:4px 12px;border-radius:100px;font-weight:700;font-size:.8rem">
                    -${t.discount}%
                  </span>
                </td>
                <td style="color:var(--accent);font-weight:700">${fmtV(fp)}</td>
                <td style="font-size:.84rem">${t.slots > 0 ? `⚡ Còn ${t.slots} chỗ` : "—"}</td>
              </tr>`;
              })
              .join("");
    }
  } catch (err) {
    console.error("Stats error:", err);
    showToast("❌ Lỗi tải thống kê: " + err.message, "error");
  }
}

function showSection(section, navItem) {
  // Hide all sections
  document.querySelectorAll(".admin-section").forEach((el) => {
    el.style.display = "none";
  });

  // Remove active class from all nav items
  document.querySelectorAll(".snav-item").forEach((el) => {
    el.classList.remove("active");
  });

  // Show the selected section
  const sectionEl = document.getElementById(`section-${section}`);
  if (sectionEl) sectionEl.style.display = "block";

  // Add active class to nav item
  if (navItem) navItem.classList.add("active");

  // Update topbar title
  const titles = {
    tours: "Quản lý Tour",
    orders: "Quản lý Khách hàng",
    messages: "Tin nhắn hỗ trợ",
    stats: "Thống kê",
  };
  const titleEl = document.getElementById("topbarTitle");
  if (titleEl) titleEl.textContent = titles[section] || section;

  // Load data if needed
  if (section === "orders") loadOrders();
  else if (section === "messages") loadMessages();
  else if (section === "stats") renderStatsPage();
}

// ════════════════════════════════════
//  ORDERS / CUSTOMERS MANAGEMENT
// ════════════════════════════════════

async function loadOrders() {
  setLoading(true);
  try {
    const orders = await getOrders();
    // Lấy thông tin users để có tên khách hàng (nếu cần)
    const users = await getUsers();
    renderOrdersTable(orders, users);
  } catch (err) {
    console.error(err);
    showToast("❌ Không thể tải danh sách khách hàng", "error");
  } finally {
    setLoading(false);
  }
}

function renderOrdersTable(orders, users) {
  const tbody = document.getElementById("ordersTableBody");
  if (!tbody) return;

  if (!orders || orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">
          <div style="font-size:2.5rem;margin-bottom:10px">📭</div>
          Chưa có đơn hàng nào
        </td>
      </tr>`;
    return;
  }

  // Create user map for quick lookup
  const userMap = {};
  if (users && Array.isArray(users)) {
    users.forEach((u) => {
      userMap[String(u.id)] = u;
    });
  }

  tbody.innerHTML = orders
    .map((order) => {
      const statusColors = {
        paid: { bg: "#d4edda", text: "#155724", label: "✅ Đã thanh toán" },
        pending: { bg: "#fff3cd", text: "#856404", label: "⏳ Chờ xử lý" },
        cancelled: { bg: "#f8d7da", text: "#721c24", label: "❌ Đã hủy" },
      };
      const status = statusColors[order.status] || {
        bg: "#e2e3e5",
        text: "#383d41",
        label: order.status,
      };

      // Get user info
      const user = userMap[String(order.userId)] || {
        fullname: `Khách #${order.userId}`,
        email: "—",
        phone: "—",
      };
      const date = new Date(order.createdAt || order.date);
      const dateStr = date.toLocaleDateString("vi-VN");

      return `
      <tr>
        <td style="color:var(--text-muted);font-size:.78rem;font-weight:600">#${order.id}</td>
        <td>
          <div style="font-size:.87rem;color:var(--text);font-weight:500">${user.fullname}</div>
          <small style="color:var(--text-muted);font-size:.72rem">${user.email || "—"}</small>
        </td>
        <td style="font-size:.84rem;color:var(--text-muted)">${order.tourName || "—"}</td>
        <td style="font-size:.84rem;color:var(--text-muted);text-align:center">${order.quantity || 0}</td>
        <td style="color:var(--accent);font-weight:700;white-space:nowrap">${fmtV(order.total)}</td>
        <td>
          <span style="background:${status.bg};color:${status.text};padding:4px 12px;border-radius:20px;font-size:.72rem;font-weight:600">
            ${status.label}
          </span>
        </td>
        <td style="color:var(--text-muted);font-size:.84rem">${dateStr}</td>
        <td style="white-space:nowrap">
          <button class="admin-btn edit-btn" onclick="openEditOrderModal('${order.id}')">
            ✏️ Sửa
          </button>
          <button class="admin-btn del-btn" onclick="deleteOrderRecord('${order.id}')">
            🗑 Xóa
          </button>
        </td>
      </tr>`;
    })
    .join("");
}

async function deleteOrderRecord(orderId) {
  if (!confirm("Xóa đơn hàng này? Hành động không thể hoàn tác.")) return;

  setLoading(true);
  try {
    await deleteOrder(orderId);
    showToast("✅ Xóa đơn hàng thành công!");
    await loadOrders();
  } catch (err) {
    showToast("❌ Lỗi xóa: " + err.message, "error");
  } finally {
    setLoading(false);
  }
}

let editingOrder = null;

async function openEditOrderModal(orderId) {
  setLoading(true);
  try {
    const orders = await getOrders();
    const users = await getUsers();
    const order = orders.find((o) => String(o.id) === String(orderId));

    if (!order) {
      showToast("❌ Không tìm thấy đơn hàng!", "error");
      return;
    }

    editingOrder = order;
    const user = users.find((u) => String(u.id) === String(order.userId)) || {
      fullname: "—",
    };

    // Set form values
    document.getElementById("eOrderId").textContent = order.id;
    document.getElementById("eCustomerName").textContent = user.fullname;
    document.getElementById("eTourName").textContent = order.tourName;
    document.getElementById("ePrice").textContent = fmtV(order.price);
    document.getElementById("eQuantity").value = order.quantity || 0;
    document.getElementById("eDate").value = order.date || "";
    document.getElementById("ePaymentMethod").value =
      order.paymentMethod || "bank";
    document.getElementById("eStatus").value = order.status || "pending";

    // Remove lại listener cũ nếu có
    const quantityEl = document.getElementById("eQuantity");
    const newQuantityEl = quantityEl.cloneNode(true);
    quantityEl.parentNode.replaceChild(newQuantityEl, quantityEl);

    // Thêm listener mới
    document
      .getElementById("eQuantity")
      .addEventListener("input", updateOrderTotal);

    // Tính tổng ban đầu
    updateOrderTotal();

    openOrderModal();
  } catch (err) {
    showToast("❌ Lỗi tải đơn hàng: " + err.message, "error");
  } finally {
    setLoading(false);
  }
}

function updateOrderTotal() {
  const quantity = parseInt(document.getElementById("eQuantity").value) || 0;
  const price = editingOrder?.price || 0;
  const total = quantity * price;
  document.getElementById("eTotal").textContent = fmtV(total);
}

function openOrderModal() {
  document.getElementById("orderEditModal").classList.add("open");
  document.getElementById("orderEditOverlay").classList.add("open");
}

function closeOrderModal() {
  document.getElementById("orderEditModal").classList.remove("open");
  document.getElementById("orderEditOverlay").classList.remove("open");
  editingOrder = null;
}

async function saveOrderChanges(e) {
  e.preventDefault();

  if (!editingOrder) return;

  const quantity = parseInt(document.getElementById("eQuantity").value) || 0;
  const date = document.getElementById("eDate").value || editingOrder.date;
  const paymentMethod = document.getElementById("ePaymentMethod").value;
  const status = document.getElementById("eStatus").value;
  const total = quantity * (editingOrder.price || 0);

  if (!quantity || !date) {
    showToast("❌ Vui lòng điền đủ thông tin!", "error");
    return;
  }

  setLoading(true);
  try {
    await patchOrder(editingOrder.id, {
      quantity,
      date,
      paymentMethod,
      status,
      total,
    });
    showToast("✅ Cập nhật đơn hàng thành công!");
    closeOrderModal();
    await loadOrders();
  } catch (err) {
    showToast("❌ Lỗi: " + err.message, "error");
  } finally {
    setLoading(false);
  }
}

// ════════════════════════════════════
//  MESSAGES / SUPPORT MANAGEMENT
// ════════════════════════════════════

async function loadMessages() {
  setLoading(true);
  try {
    const [messages, users] = await Promise.all([getContacts(), getUsers()]);
    renderMessagesTable(messages, users);
  } catch (err) {
    console.error(err);
    showToast("❌ Không thể tải tin nhắn", "error");
  } finally {
    setLoading(false);
  }
}

function renderMessagesTable(messages, users = []) {
  const tbody = document.getElementById("messagesTableBody");
  if (!tbody) return;

  if (!messages || messages.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">
          <div style="font-size:2.5rem;margin-bottom:10px">📭</div>
          Chưa có tin nhắn nào
        </td>
      </tr>`;
    return;
  }

  // Create user map for quick lookup
  const userMap = {};
  if (users && Array.isArray(users)) {
    users.forEach((u) => {
      userMap[String(u.id)] = u;
    });
  }

  tbody.innerHTML = messages
    .map((msg) => {
      const statusColors = {
        new: { bg: "#d4edda", text: "#155724", label: "🆕 Mới" },
        in_progress: { bg: "#cfe2ff", text: "#084298", label: "⏳ Đang xử lý" },
        done: { bg: "#d1e7dd", text: "#0f5132", label: "✅ Hoàn tất" },
      };
      const status = statusColors[msg.status] || {
        bg: "#e2e3e5",
        text: "#383d41",
        label: msg.status,
      };

      const msgPreview = (msg.message || "").substring(0, 50);
      const date = new Date(msg.createdAt);
      const dateStr = date.toLocaleDateString("vi-VN");

      // Nếu msg có userId, lấy thông tin từ user map, còn không dùng name/email từ msg
      const displayName =
        msg.userId && userMap[String(msg.userId)]
          ? userMap[String(msg.userId)].fullname
          : msg.name || "—";
      const displayEmail =
        msg.userId && userMap[String(msg.userId)]
          ? userMap[String(msg.userId)].email
          : msg.email || "—";

      return `
      <tr>
        <td style="color:var(--text-muted);font-size:.78rem;font-weight:600">#${msg.id}</td>
        <td style="font-size:.86rem;color:var(--text);font-weight:500">${displayName}</td>
        <td style="font-size:.84rem;color:var(--text-muted)">${displayEmail}</td>
        <td style="font-size:.84rem;color:var(--text-muted)">${msg.phone || "—"}</td>
        <td style="font-size:.84rem;color:var(--text)">${msg.subject || "—"}</td>
        <td style="font-size:.82rem;color:var(--text-muted)" title="${msg.message}">${msgPreview}${msg.message && msg.message.length > 50 ? "..." : ""}</td>
        <td>
          <span style="background:${status.bg};color:${status.text};padding:4px 12px;border-radius:20px;font-size:.72rem;font-weight:600">
            ${status.label}
          </span>
        </td>
        <td style="white-space:nowrap">
          <button class="admin-btn edit-btn" onclick="viewMessage('${msg.id}')">
            👁️ Xem
          </button>
          <button class="admin-btn del-btn" onclick="deleteMessage('${msg.id}')">
            🗑 Xóa
          </button>
        </td>
      </tr>`;
    })
    .join("");
}

async function viewMessage(messageId) {
  try {
    const messages = await getContacts();
    const msg = messages.find((m) => String(m.id) === String(messageId));
    if (!msg) {
      showToast("❌ Không tìm thấy tin nhắn", "error");
      return;
    }

    const detail = `
📧 Từ: ${msg.name}
✉️ Email: ${msg.email}
📱 Phone: ${msg.phone}
🎯 Chủ đề: ${msg.subject}
📅 Ngày: ${new Date(msg.createdAt).toLocaleString("vi-VN")}

📝 Nội dung:
${msg.message}

Trạng thái hiện tại: ${msg.status}
Chọn trạng thái mới: new | in_progress | done`;

    const userChoice = prompt(detail, msg.status);
    if (userChoice === null || userChoice === msg.status) return;

    setLoading(true);
    try {
      await patchContact(messageId, { status: userChoice });
      showToast("✅ Cập nhật trạng thái tin nhắn thành công!");
      await loadMessages();
    } finally {
      setLoading(false);
    }
  } catch (err) {
    setLoading(false);
    showToast("❌ Lỗi: " + err.message, "error");
  }
}

async function deleteMessage(messageId) {
  if (!confirm("Xóa tin nhắn này? Hành động không thể hoàn tác.")) return;

  setLoading(true);
  try {
    await deleteContact(messageId);
    showToast("✅ Xóa tin nhắn thành công!");
    await loadMessages();
  } catch (err) {
    showToast("❌ Lỗi xóa: " + err.message, "error");
  } finally {
    setLoading(false);
  }
}

function refreshAll() {
  const activeSection =
    document.getElementById("section-tours").style.display !== "none"
      ? "tours"
      : document.getElementById("section-orders").style.display !== "none"
        ? "orders"
        : document.getElementById("section-messages").style.display !== "none"
          ? "messages"
          : "stats";

  if (activeSection === "tours") {
    loadAndRender(document.getElementById("adminSearch")?.value || "");
  } else if (activeSection === "orders") {
    loadOrders();
  } else if (activeSection === "messages") {
    loadMessages();
  } else if (activeSection === "stats") {
    renderStatsPage();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadAndRender();

  document.getElementById("adminSearch")?.addEventListener("input", (e) => {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => loadAndRender(e.target.value), 350);
  });

  document.getElementById("tourForm")?.addEventListener("submit", saveTour);
  document.getElementById("addTourBtn")?.addEventListener("click", openAdd);
  document
    .getElementById("closeFormBtn")
    ?.addEventListener("click", closeModal);
  document
    .getElementById("cancelFormBtn")
    ?.addEventListener("click", closeModal);
  document.getElementById("formOverlay")?.addEventListener("click", closeModal);

  // Order edit form listeners
  document
    .getElementById("orderEditForm")
    ?.addEventListener("submit", saveOrderChanges);
  document
    .getElementById("closeOrderEditBtn")
    ?.addEventListener("click", closeOrderModal);
  document
    .getElementById("cancelOrderEditBtn")
    ?.addEventListener("click", closeOrderModal);
  document
    .getElementById("orderEditOverlay")
    ?.addEventListener("click", closeOrderModal);

  document.getElementById("sidebarToggle")?.addEventListener("click", () => {
    const sb = document.getElementById("sidebar");
    if (window.innerWidth <= 768) sb.classList.toggle("mobile-open");
    else {
      sb.classList.toggle("collapsed");
      document.getElementById("adminMain")?.classList.toggle("expanded");
    }
  });
});
