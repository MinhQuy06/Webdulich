const SESSION_KEY = "mq_admin_logged";

function checkSession() {
  if (sessionStorage.getItem(SESSION_KEY) === "1") showAdmin();
}

function showAdmin() {
  document.getElementById("loginGate").style.display = "none";
  document.getElementById("adminLayout").style.display = "flex";
}

document.getElementById("loginBtn").addEventListener("click", () => {
  const u = document.getElementById("adminUser").value.trim();
  const p = document.getElementById("adminPass").value.trim();
  const e = document.getElementById("loginErr");
  if (u === "admin" && p === "admin123") {
    sessionStorage.setItem(SESSION_KEY, "1");
    e.textContent = "";
    showAdmin();
  } else {
    e.textContent = "❌ Sai tên đăng nhập hoặc mật khẩu!";
  }
});

["adminUser", "adminPass"].forEach((id) =>
  document.getElementById(id).addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("loginBtn").click();
  }),
);

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  location.reload();
});

document.getElementById("sidebarToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("collapsed");
  document.getElementById("adminMain").classList.toggle("expanded");
});

/* ─── IMAGE PREVIEW ─── */
document.getElementById("fImage").addEventListener("input", function () {
  const prev = document.getElementById("fImagePreview");
  if (this.value) {
    prev.src = this.value;
    prev.style.display = "block";
    prev.onerror = () => (prev.style.display = "none");
  } else {
    prev.style.display = "none";
  }
});

function refreshAll() {
  const cur =
    document.getElementById("section-stats").style.display !== "none"
      ? "stats"
      : "tours";
  if (cur === "stats") renderStatsPage();
  else loadAndRender(document.getElementById("adminSearch")?.value || "");
}

checkSession();
