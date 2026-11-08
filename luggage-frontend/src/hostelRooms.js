// The college's hostel rooms that can be used as storage rooms, picked as hostel + room number.
// RKA: 101-112 on each of 4 floors, RKB: 113-124 on each of 4 floors,
// HA, HB, HC, HD, HF: 101-124 on each of 3 floors, HE: 101-108 on each of 4 floors.
const range = (floors, from, to) => {
  const rooms = []
  for (let f = 1; f <= floors; f++) for (let n = from; n <= to; n++) rooms.push(String(f * 100 + n))
  return rooms
}

export const HOSTEL_ROOMS = {
  RKA: range(4, 1, 12),
  RKB: range(4, 13, 24),
  HA: range(3, 1, 24),
  HB: range(3, 1, 24),
  HC: range(3, 1, 24),
  HD: range(3, 1, 24),
  HE: range(4, 1, 8),
  HF: range(3, 1, 24),
}
export const HOSTELS = Object.keys(HOSTEL_ROOMS)

// "HA 101" -> { hostel: 'HA', room: '101' }; anything else (e.g. "Luggage Room") -> null
export function splitRoom(name) {
  const m = /^([A-Z]+) (\d{3})$/.exec(name || '')
  return m && HOSTEL_ROOMS[m[1]]?.includes(m[2]) ? { hostel: m[1], room: m[2] } : null
}
