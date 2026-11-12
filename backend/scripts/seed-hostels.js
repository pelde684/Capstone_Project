// Run: npm run seed:hostels   (safe to re-run: only adds what is missing)
// Adds hostels, their rooms, NK kitchens, one storage room per hostel room, and the 10 programmes.
require("dotenv").config();
const db = require("../src/config/db");

// floors: [rooms on floor 1, floor 2, ...]; room number = floor * 100 + n
const HOSTELS = {
  HF: [24, 24, 24],
  HD: [24, 24, 24],
  HC: [24, 24, 24],
  HA: [13, 13, 13],
  HB: [13, 13, 13],
  NK: [8, 8, 8, 8],
  RKA: [12, 12, 12, 12],
  RKB: [12, 12, 12, 12],
  HE: [12, 33], // 101-112 and 201-233
};
const NK_KITCHENS = 8; // kitchens 1-8
const STORAGE_CAPACITY = 100; // luggage capacity of each storage room

const DEPARTMENTS = [
  "BE (Civil)", "BE (Electrical)", "BE (ECE)", "BE (IT)", "B (Architecture)",
  "BE (Engineering Geology)", "BE (ICE)", "BE (Water Resources Engineering)",
  "BE (Mechanical Engineering)", "BE (Software Engineering)",
];

(async () => {
  for (const [name, floors] of Object.entries(HOSTELS)) {
    await db.query("INSERT IGNORE INTO hostels (hostel_name) VALUES (?)", [name]);
    const [[h]] = await db.query("SELECT hostel_id FROM hostels WHERE hostel_name = ?", [name]);
    const rows = [];
    const storage = [];
    floors.forEach((count, f) => {
      for (let n = 1; n <= count; n++) {
        const roomNo = String((f + 1) * 100 + n);
        rows.push([h.hostel_id, roomNo, "ROOM"]);
        storage.push([`${name} - Room ${roomNo}`, `Storage room ${roomNo} in ${name}`, STORAGE_CAPACITY]);
      }
    });
    if (name === "NK") for (let k = 1; k <= NK_KITCHENS; k++) rows.push([h.hostel_id, String(k), "KITCHEN"]);
    await db.query("INSERT IGNORE INTO hostel_rooms (hostel_id, room_no, room_type) VALUES ?", [rows]);
    await db.query("INSERT IGNORE INTO storage_locations (location_name, description, capacity) VALUES ?", [storage]);
    console.log(`${name}: ${rows.length} rooms/kitchens, ${storage.length} storage rooms`);
  }

  // Programmes start with no storage room; the admin assigns one on the Programmes page.
  for (const d of DEPARTMENTS)
    await db.query("INSERT IGNORE INTO departments (department_name) VALUES (?)", [d]);

  console.log(`Departments: ${DEPARTMENTS.length}. Done.`);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });