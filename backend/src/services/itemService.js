const db = require("../config/db");
const { signedPhotoUrl } = require("../utils/photo");

// FROM + joins shared by item lists and their COUNT(*) queries, so filters work in both.
// qr_codes has one row per drop-off (drop_off_id is UNIQUE), so this join never duplicates items.
const ITEM_JOINS = `
    FROM items i
    JOIN users u ON u.user_id = i.owner_id
    JOIN categories c ON c.category_id = i.category_id
    LEFT JOIN storage_locations l ON l.location_id = i.location_id
    LEFT JOIN hostels h ON h.hostel_id = u.hostel_id
    LEFT JOIN drop_offs d ON d.drop_off_id = i.drop_off_id
    LEFT JOIN semesters s ON s.semester_id = d.semester_id
    LEFT JOIN qr_codes q ON q.drop_off_id = i.drop_off_id`;

// Column aliases keep the JSON the frontend sees stable (id, name, ownerName ...)
const ITEM_SELECT = `
  SELECT i.item_id AS id, i.item_name AS name, i.description, i.quantity, i.status,
         i.registered_at AS registeredAt, i.updated_at AS updatedAt,
         i.photograph_path AS photographPath,
         (SELECT GROUP_CONCAT(CONCAT(p.photo_id, ':', p.public_id) ORDER BY p.position SEPARATOR '|')
            FROM item_photos p WHERE p.item_id = i.item_id) AS photoList,
         i.owner_id AS ownerId, i.drop_off_id AS dropOffId, q.qr_value AS qrValue,
         u.full_name AS ownerName, u.student_id AS ownerStudentId,
         u.hostel_id AS ownerHostelId, h.hostel_name AS ownerHostel,
         d.semester_id AS semesterId, s.semester_name AS semesterName,
         i.category_id AS categoryId, c.category_name AS categoryName,
         i.location_id AS locationId, l.location_name AS locationName
  ${ITEM_JOINS}`;

// Turns "12:luggage/items/a|13:luggage/items/b" into [{ id: 12, publicId: "luggage/items/a" }, ...] (photo order)
function parsePhotoList(list) {
  if (!list) return [];
  return list.split("|").map((part) => {
    const at = part.indexOf(":");
    return { id: Number(part.slice(0, at)), publicId: part.slice(at + 1) };
  });
}

// Swap the stored Cloudinary public ids for signed URLs.
// photos = all photos in order (up to 4), photoIds = their ids (used when editing),
// photographUrl = photo 1 (kept so older pages keep working).
function present(row) {
  if (!row) return null;
  const { photographPath, photoList, ...rest } = row;
  let list = parsePhotoList(photoList);
  if (!list.length && photographPath) list = [{ id: null, publicId: photographPath }];
  const photos = list.map((p) => signedPhotoUrl(p.publicId));
  return { ...rest, photographUrl: photos[0] || null, photos, photoIds: list.map((p) => p.id) };
}

async function getItemById(id) {
  const [rows] = await db.query(`${ITEM_SELECT} WHERE i.item_id = ?`, [id]);
  return rows[0] || null;
}

module.exports = { ITEM_SELECT, ITEM_JOINS, present, getItemById };
