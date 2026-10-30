const crypto = require("crypto");
const db = require("../config/db");
const HttpError = require("../utils/httpError");
const { STATUS } = require("../utils/status");
const { uploadItemPhoto, destroyPhoto, MAX_PHOTOS } = require("../utils/photo");
const { ITEM_SELECT, present } = require("./itemService");

const MAX_ITEMS = 20;

// ---------- input parsing ----------
function cleanSpec(raw, index) {
  const n = index + 1;
  const name = typeof raw?.name === "string" ? raw.name.trim() : "";
  const quantity = parseInt(raw?.quantity ?? 1, 10);
  const description = raw?.description == null || raw.description === "" ? null : String(raw.description);
  if (!name || name.length > 150) throw new HttpError(400, `Item ${n}: name is required (max 150 characters)`);
  if (!raw?.categoryId) throw new HttpError(400, `Item ${n}: categoryId is required`);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) throw new HttpError(400, `Item ${n}: quantity must be between 1 and 100`);
  let photoIds = null; // editing only: existing photos to keep, in this order (omit = keep them all)
  if (raw?.photoIds !== undefined && raw.photoIds !== null) {
    if (!Array.isArray(raw.photoIds) || raw.photoIds.length > MAX_PHOTOS || raw.photoIds.some((x) => !Number.isInteger(Number(x)) || Number(x) < 1))
      throw new HttpError(400, `Item ${n}: photoIds must be a list of up to ${MAX_PHOTOS} photo ids`);
    photoIds = raw.photoIds.map(Number);
    if (new Set(photoIds).size !== photoIds.length) throw new HttpError(400, `Item ${n}: the same photo is listed twice`);
  }
  return { id: raw.id ? Number(raw.id) : null, name, categoryId: raw.categoryId, quantity, description, photoIds };
}

// multipart field "items" = JSON list; photos are files named photo_0, photo_1 ... (same order as the list).
// Each item can have up to 4 photos: send the same field name up to 4 times (photo_0, photo_0, ...), first = main photo.
function parseItems(req) {
  let list;
  try { list = typeof req.body?.items === "string" ? JSON.parse(req.body.items) : req.body?.items; }
  catch { throw new HttpError(400, "items must be valid JSON"); }
  if (!Array.isArray(list) || !list.length || list.length > MAX_ITEMS)
    throw new HttpError(400, `items must be a list of 1 to ${MAX_ITEMS} items`);
  return list.map(cleanSpec);
}

function photosByIndex(req) {
  const map = {};
  for (const f of req.files || []) {
    const m = /^photo_(\d+)$/.exec(f.fieldname);
    if (m) (map[Number(m[1])] ||= []).push(f.buffer);
  }
  for (const [i, list] of Object.entries(map))
    if (list.length > MAX_PHOTOS) throw new HttpError(400, `Item ${Number(i) + 1}: at most ${MAX_PHOTOS} photos per item`);
  return map;
}

// ---------- writes ----------
// Uploads the files to Cloudinary; their ids go in `uploaded` so they can be removed if saving fails.
async function uploadAll(buffers, itemId, uploaded) {
  const ids = [];
  for (const b of buffers) {
    const up = await uploadItemPhoto(b, itemId);
    uploaded.push(up.public_id);
    ids.push(up.public_id);
  }
  return ids;
}

// Replaces an item's photo list with these Cloudinary ids, in order (position 1 = main photo).
// items.photograph_path always holds photo 1 so older code keeps working.
async function setItemPhotos(conn, itemId, publicIds) {
  await conn.query("DELETE FROM item_photos WHERE item_id = ?", [itemId]);
  if (publicIds.length)
    await conn.query("INSERT INTO item_photos (item_id, public_id, position) VALUES ?",
      [publicIds.map((id, i) => [itemId, id, i + 1])]);
  await conn.query("UPDATE items SET photograph_path = ? WHERE item_id = ?", [publicIds[0] || null, itemId]);
}

async function insertItem(conn, ownerId, changedBy, dropOffId, spec, buffers, uploaded) {
  const [ins] = await conn.query(
    `INSERT INTO items (owner_id, category_id, drop_off_id, item_name, description, quantity, status, registered_at, updated_at)
     VALUES (?,?,?,?,?,?,?,NOW(),NOW())`,
    [ownerId, spec.categoryId, dropOffId, spec.name, spec.description, spec.quantity, STATUS.REGISTERED]);
  const itemId = ins.insertId;
  await setItemPhotos(conn, itemId, await uploadAll(buffers, itemId, uploaded));
  await addHistory(conn, itemId, changedBy, null, STATUS.REGISTERED, "Item registered by student");
  return itemId;
}

const addHistory = (conn, itemId, changedBy, oldS, newS, remarks) =>
  conn.query(
    "INSERT INTO item_status_history (item_id, changed_by, old_status, new_status, remarks, changed_at) VALUES (?,?,?,?,?,NOW())",
    [itemId, changedBy, oldS, newS, remarks]);

// One drop-off = one QR shared by all its items. Everything succeeds or nothing is saved.
async function createDropOff(user, specs, photos) {
  specs.forEach((s, i) => { if (!photos[i]?.length) throw new HttpError(400, `Item ${i + 1}: at least one photograph is required (field name: photo_${i})`); });
  const conn = await db.getConnection();
  const uploaded = [];
  try {
    await conn.beginTransaction();
    // semester = the one whose dates include today (stays empty if the admin has not created it yet)
    const [d] = await conn.query(
      `INSERT INTO drop_offs (owner_id, semester_id, created_at, updated_at)
       VALUES (?, (SELECT semester_id FROM semesters WHERE CURDATE() BETWEEN start_date AND end_date LIMIT 1), NOW(), NOW())`,
      [user.id]);
    const qrValue = crypto.randomUUID(); // random token only - no personal data in the QR
    await conn.query("INSERT INTO qr_codes (drop_off_id, qr_value, generated_at, is_active) VALUES (?,?,NOW(),1)", [d.insertId, qrValue]);
    const itemIds = [];
    for (let i = 0; i < specs.length; i++) itemIds.push(await insertItem(conn, user.id, user.id, d.insertId, specs[i], photos[i], uploaded));
    await conn.commit();
    return { dropOffId: d.insertId, qrValue, itemIds };
  } catch (err) {
    await conn.rollback();
    await Promise.all(uploaded.map((p) => destroyPhoto(p).catch(() => {})));
    throw err;
  } finally {
    conn.release();
  }
}

// Lock the drop-off, check the caller may change it, and return its active (non-cancelled) items.
async function lockEditable(conn, user, dropOffId) {
  const [[d]] = await conn.query("SELECT drop_off_id, owner_id FROM drop_offs WHERE drop_off_id = ? FOR UPDATE", [dropOffId]);
  if (!d) throw new HttpError(404, "Drop-off not found");
  if (user.role !== "Admin" && d.owner_id !== user.id) throw new HttpError(403, "This drop-off belongs to another student");
  const [active] = await conn.query("SELECT item_id, status FROM items WHERE drop_off_id = ? AND status <> ? FOR UPDATE", [dropOffId, STATUS.CANCELLED]);
  if (!active.length) throw new HttpError(409, "This drop-off has been cancelled");
  if (active.some((i) => i.status !== STATUS.REGISTERED))
    throw new HttpError(409, "This drop-off can no longer be changed because some items were already handed in");
  return { d, active };
}

// Edit while every item is still REGISTERED. The QR stays the same (the printed label remains valid).
// Entries with an `id` update that item; entries without `id` are added; existing items left out are removed (CANCELLED).
async function updateDropOff(user, dropOffId, specs, photos) {
  const conn = await db.getConnection();
  const uploaded = [];
  const replaced = []; // old photos no longer used; removed from Cloudinary after saving
  try {
    await conn.beginTransaction();
    const { d, active } = await lockEditable(conn, user, dropOffId);
    const activeIds = new Set(active.map((i) => i.item_id));
    const keep = new Set();
    specs.forEach((s, i) => {
      if (s.id) {
        if (!activeIds.has(s.id)) throw new HttpError(400, `Item ${i + 1}: id ${s.id} is not part of this drop-off`);
        if (keep.has(s.id)) throw new HttpError(400, `Item ${i + 1}: id ${s.id} appears twice`);
        keep.add(s.id);
      } else if (!photos[i]?.length) throw new HttpError(400, `Item ${i + 1}: at least one photograph is required for a new item (field name: photo_${i})`);
    });

    for (let i = 0; i < specs.length; i++) {
      const s = specs[i];
      if (s.id) {
        await conn.query("UPDATE items SET item_name = ?, category_id = ?, description = ?, quantity = ?, updated_at = NOW() WHERE item_id = ?",
          [s.name, s.categoryId, s.description, s.quantity, s.id]);
        await editPhotos(conn, s, photos[i] || [], i, uploaded, replaced);
        await addHistory(conn, s.id, user.id, STATUS.REGISTERED, STATUS.REGISTERED, "Item details edited");
      } else {
        await insertItem(conn, d.owner_id, user.id, dropOffId, s, photos[i], uploaded);
      }
    }
    for (const id of activeIds) {
      if (keep.has(id)) continue;
      await conn.query("UPDATE items SET status = ?, updated_at = NOW() WHERE item_id = ?", [STATUS.CANCELLED, id]);
      await addHistory(conn, id, user.id, STATUS.REGISTERED, STATUS.CANCELLED, "Removed from drop-off");
    }
    await conn.query("UPDATE drop_offs SET updated_at = NOW() WHERE drop_off_id = ?", [dropOffId]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    await Promise.all(uploaded.map((p) => destroyPhoto(p).catch(() => {})));
    throw err;
  } finally {
    conn.release();
  }
  await Promise.all(replaced.map((p) => destroyPhoto(p).catch(() => {})));
}

// Photos of an existing item while editing:
//   photoIds given -> keep exactly those (in that order), then add the new files
//   photoIds left out + new files -> the new files replace all old photos (one-photo pages work as before)
//   photoIds left out + no files -> photos stay as they are
async function editPhotos(conn, spec, files, index, uploaded, replaced) {
  const n = index + 1;
  const [rows] = await conn.query("SELECT photo_id, public_id FROM item_photos WHERE item_id = ? ORDER BY position FOR UPDATE", [spec.id]);
  if (spec.photoIds === null && !files.length) return;

  let kept = [];
  if (spec.photoIds) {
    const byId = new Map(rows.map((r) => [r.photo_id, r.public_id]));
    for (const id of spec.photoIds) {
      if (!byId.has(id)) throw new HttpError(400, `Item ${n}: photo ${id} does not belong to this item`);
      kept.push(byId.get(id));
    }
  }
  if (kept.length + files.length < 1) throw new HttpError(400, `Item ${n}: an item needs at least one photo`);
  if (kept.length + files.length > MAX_PHOTOS) throw new HttpError(400, `Item ${n}: at most ${MAX_PHOTOS} photos per item`);

  const finalIds = [...kept, ...(await uploadAll(files, spec.id, uploaded))];
  await setItemPhotos(conn, spec.id, finalIds);
  replaced.push(...rows.map((r) => r.public_id).filter((p) => !finalIds.includes(p)));
}

async function cancelDropOff(user, dropOffId) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { active } = await lockEditable(conn, user, dropOffId);
    for (const i of active) {
      await conn.query("UPDATE items SET status = ?, updated_at = NOW() WHERE item_id = ?", [STATUS.CANCELLED, i.item_id]);
      await addHistory(conn, i.item_id, user.id, STATUS.REGISTERED, STATUS.CANCELLED, "Drop-off cancelled");
    }
    await conn.query("UPDATE qr_codes SET is_active = 0 WHERE drop_off_id = ?", [dropOffId]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ---------- reads ----------
async function loadDropOffs(whereSql, params, includeCancelled = false) {
  const [rows] = await db.query(
    `SELECT d.drop_off_id AS id, d.owner_id AS ownerId, u.full_name AS ownerName, u.student_id AS ownerStudentId,
            h.hostel_name AS ownerHostel, d.semester_id AS semesterId, s.semester_name AS semesterName,
            d.created_at AS createdAt, d.updated_at AS updatedAt, q.qr_value AS qrValue, q.is_active AS qrActive
       FROM drop_offs d JOIN users u ON u.user_id = d.owner_id
       LEFT JOIN hostels h ON h.hostel_id = u.hostel_id
       LEFT JOIN semesters s ON s.semester_id = d.semester_id
       LEFT JOIN qr_codes q ON q.drop_off_id = d.drop_off_id
       ${whereSql} ORDER BY d.created_at DESC, d.drop_off_id DESC`, params);
  if (!rows.length) return [];
  const [items] = await db.query(
    `${ITEM_SELECT} WHERE i.drop_off_id IN (?) ${includeCancelled ? "" : "AND i.status <> 'CANCELLED'"} ORDER BY i.item_id`,
    [rows.map((r) => r.id)]);
  const byDrop = {};
  for (const it of items) (byDrop[it.dropOffId] ||= []).push(present(it));
  return rows.map((r) => ({ ...r, qrActive: !!r.qrActive, items: byDrop[r.id] || [] }));
}

module.exports = { parseItems, photosByIndex, createDropOff, updateDropOff, cancelDropOff, loadDropOffs };
