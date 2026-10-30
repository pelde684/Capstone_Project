const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
async function api(path, { method = "GET", body, form } = {}) {
  const headers = {}, t = localStorage.getItem("token");
  if (t) headers.Authorization = "Bearer " + t;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch("/api" + path, { method, headers, body: form ?? (body ? JSON.stringify(body) : undefined) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
const msg = (t, bad) => { $("#msg").textContent = t; $("#msg").className = bad ? "bad" : "ok"; };
const run = (fn) => async (...a) => { try { await fn(...a); } catch (e) { msg(e.message, true); } };
let me = null, current = null;

function show() {
  $("#login").hidden = !!me; $("#app").hidden = !me; $("#logout").hidden = !me;
  $("#who").textContent = me ? `${me.name} (${me.role})` : "";
  if (!me) return;
  $("#student").hidden = me.role !== "Student";
  $("#operator").hidden = me.role === "Student";
  $("#admin").hidden = me.role !== "Admin";
  run(me.role === "Student" ? loadStudent : loadOperator)();
  if (me.role === "Admin") run(loadUsers)();
}
$("#loginBtn").onclick = run(async () => {
  const r = await api("/auth/login", { method: "POST", body: { identifier: $("#id").value.trim(), password: $("#pw").value } });
  localStorage.setItem("token", r.token); me = r.user; msg(""); show();
});
$("#logout").onclick = () => { localStorage.removeItem("token"); me = null; show(); };

// ---- Student ----
async function loadStudent() {
  $("#cat").innerHTML = (await api("/categories")).data.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("");
  const items = (await api("/items/mine")).data;
  $("#mine").innerHTML = items.map((i) => `<div class="card">${i.photographUrl ? `<img class="thumb" src="${esc(i.photographUrl)}">` : ""}
    <b>${esc(i.name)}</b> x${i.quantity} <span class="tag">${i.status}</span><br>
    <button data-qr="${i.id}">Show QR</button>${i.status === "REGISTERED" ? ` <button data-cancel="${i.id}">Cancel</button>` : ""}<div id="qr${i.id}"></div></div>`).join("") || "<p>No items yet.</p>";
}
$("#reg").onclick = run(async () => {
  const f = new FormData();
  f.append("name", $("#name").value); f.append("categoryId", $("#cat").value);
  f.append("quantity", $("#qty").value); f.append("description", $("#desc").value);
  if ($("#photo").files[0]) f.append("photo", $("#photo").files[0]);
  await api("/items", { method: "POST", form: f });
  msg("Item registered - press Show QR on it."); await loadStudent();
});
$("#mine").onclick = run(async (e) => {
  const { qr, cancel } = e.target.dataset;
  if (qr) { const q = await api(`/items/${qr}/qr`); $("#qr" + qr).innerHTML = `<img src="${q.dataUrl}" width="200"><br><small>${esc(q.qrValue)}</small>`; }
  if (cancel && confirm("Cancel this item?")) { await api(`/items/${cancel}/cancel`, { method: "POST" }); await loadStudent(); }
});

// ---- Operator / Admin ----
async function loadOperator() {
  $("#loc").innerHTML = (await api("/locations")).data.map((l) => `<option value="${l.id}">${esc(l.location)} (${l.used}/${l.capacity ?? "no limit"})</option>`).join("");
}
$("#scan").onclick = run(async () => {
  const r = await api("/scan", { method: "POST", body: { qrValue: $("#qrv").value.trim() } });
  current = r;
  const thumb = (i) => (i.photographUrl ? `<img class="thumb" src="${esc(i.photographUrl)}">` : "");
  $("#result").innerHTML = `<div class="card"><b>Owner:</b> ${esc(r.dropOff.ownerName)} (${esc(r.dropOff.ownerStudentId)}) - ${r.items.length} item(s) in this drop-off</div>` +
    r.items.map((i) => `<div class="card">${thumb(i)}<b>${esc(i.name)}</b> x${i.quantity} <span class="tag">${i.status}</span><br>
      Category: ${esc(i.categoryName)} - Location: ${esc(i.locationName || "-")}<br>
      ${i.allowedActions.map((a) => `<button data-item="${i.id}" data-act="${a}">${a}</button>`).join(" ") || "<i>No actions</i>"}</div>`).join("");
  $("#actions").innerHTML = r.allowedActions.length
    ? "<b>Apply to all items that can:</b> " + r.allowedActions.map((a) => `<button data-act="${a}">${a} (all)</button>`).join(" ")
    : "<i>No actions available</i>";
  const hs = await Promise.all(r.items.map((i) => api("/items/" + i.id)));
  $("#hist").innerHTML = hs.flatMap((it) => (it.history || []).map((x) =>
    `<li><b>${esc(it.name)}</b>: ${esc(x.oldStatus || "-")} &rarr; ${esc(x.newStatus)} by ${esc(x.changedByName)} (${new Date(x.changedAt).toLocaleString()})</li>`)).join("");
});
$("#operator").onclick = run(async (e) => {
  const action = e.target.dataset.act; if (!action) return;
  const body = { action };
  if (e.target.dataset.item) body.itemId = Number(e.target.dataset.item); else body.dropOffId = current.dropOff.id;
  if (action === "STORAGE_VERIFICATION") body.locationId = $("#loc").value;
  if (action === "COLLECTION") body.verificationStatus = "APPROVED";
  if (action === "REJECTION") { body.remarks = prompt("Reason for rejection?"); if (!body.remarks) return; }
  const r = await api("/transactions", { method: "POST", body });
  msg(`${action} recorded for ${r.results.length} item(s)` + (r.skipped.length ? `, ${r.skipped.length} skipped (not eligible)` : "")); $("#scan").click(); loadOperator();
});

// ---- Admin ----
async function loadUsers() {
  $("#users").innerHTML = (await api("/users?limit=100")).data.map((u) =>
    `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${u.role}</td><td>${esc(u.studentId || "")}</td><td>${u.isActive ? "active" : "disabled"}</td></tr>`).join("");
}
$("#mkuser").onclick = run(async () => {
  await api("/users", { method: "POST", body: { name: $("#uname").value, email: $("#uemail").value, password: $("#upass").value, role: $("#urole").value, studentId: $("#usid").value || undefined } });
  msg("User created"); loadUsers();
});

if (localStorage.getItem("token")) api("/auth/me").then((r) => { me = r.user; show(); }).catch(() => show()); else show();
