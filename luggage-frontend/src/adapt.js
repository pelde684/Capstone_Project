// Turns backend records into the shapes these pages were designed with
// (the same fields the old mock data in data.js had), so the pages barely change.

// Calendar day in the browser's time zone, e.g. 2026-10-22
export const localDay = (s) => (s ? new Date(s).toLocaleDateString('en-CA') : null)

// The short code printed under a QR (its first 8 characters). Operators can type it.
export const shortCode = (qrValue) => (qrValue ? qrValue.slice(0, 8).toUpperCase() : '')

const OPEN_PENDING = ['REGISTERED', 'DEPOSITED']
const STORED = ['STORED', 'READY_FOR_COLLECTION']

// Backend status (+ the item's operator history) -> the four labels the pages use
function label(item, lastTx) {
  if (OPEN_PENDING.includes(item.status)) return lastTx?.action === 'REJECTION' ? 'Rejected' : 'Pending'
  if (STORED.includes(item.status)) return 'Stored'
  if (item.status === 'COLLECTED') return 'Returned'
  return null // CANCELLED: withdrawn by the student, not shown to staff
}

// apiItems: GET /items, txs: GET /transactions, emailById: operator id -> email (admins only, may be empty)
export function buildItems(apiItems, txs, emailById = {}) {
  const byItem = {}
  for (const t of [...txs].sort((a, b) => a.transactionTime.localeCompare(b.transactionTime) || a.id - b.id))
    (byItem[t.itemId] ||= []).push(t)

  return apiItems.map((i) => {
    const history = byItem[i.id] || []
    const last = history[history.length - 1]
    const status = label(i, last)
    if (!status) return null
    const decided = [...history].reverse().find((t) => t.action === 'STORAGE_VERIFICATION' || t.action === 'REJECTION')
    const returned = [...history].reverse().find((t) => t.action === 'COLLECTION')
    return {
      id: String(i.id), // unique per item (one drop-off/QR can hold several items)
      itemId: i.id,
      dropOffId: i.dropOffId,
      tag: shortCode(i.qrValue) || `#${i.dropOffId}`,
      name: i.name,
      category: i.categoryName,
      description: i.description || '',
      photo: i.photographUrl,
      owner: i.ownerName,
      studentId: i.ownerStudentId,
      hostel: i.ownerHostel || '',
      semester: i.semesterName || '',
      location: i.locationName || '',
      status,
      apiStatus: i.status,
      date: localDay(i.registeredAt),
      verifiedBy: decided ? emailById[decided.operatorId] || decided.operatorName : undefined,
      verifiedOn: decided ? localDay(decided.transactionTime) : undefined,
      rejectReason: last?.action === 'REJECTION' ? last.remarks : undefined,
      returnedOn: returned ? localDay(returned.transactionTime) : undefined,
    }
  }).filter(Boolean)
}

// GET /users -> the students and staff lists the admin pages use
export function buildPeople(users) {
  const students = users.filter((u) => u.role === 'Student').map((u) => ({
    userId: u.id,
    studentId: u.studentId || '',
    name: u.name,
    email: u.email,
    hostel: u.hostel || '',
    active: u.isActive,
  }))
  const staff = users.filter((u) => u.role !== 'Student').map((u) => ({
    userId: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    shift: '-',
    active: u.isActive,
  }))
  const emailById = Object.fromEntries(staff.map((s) => [s.userId, s.email]))
  return { students, staff, emailById }
}
