// Values match the ENUMs in the team's database (luggage_management_system).
const STATUS = {
  REGISTERED: "REGISTERED",
  DEPOSITED: "DEPOSITED",
  STORED: "STORED",
  READY: "READY_FOR_COLLECTION",
  COLLECTED: "COLLECTED",
  CANCELLED: "CANCELLED",
};

const VERIFICATION = { PENDING: "PENDING", APPROVED: "APPROVED", REJECTED: "REJECTED" };

const OPEN = [STATUS.REGISTERED, STATUS.DEPOSITED, STATUS.STORED, STATUS.READY];

// Operator actions (transactions.action ENUM): where each may start, where it leads,
// and what verification_status it records.
const ACTIONS = {
  // Student hands the item in at the luggage room
  DEPOSIT: { from: [STATUS.REGISTERED], to: STATUS.DEPOSITED, verification: VERIFICATION.PENDING },
  // Operator checks the item against its photo and shelves it
  STORAGE_VERIFICATION: { from: [STATUS.DEPOSITED], to: STATUS.STORED, needsLocation: true, verification: VERIFICATION.APPROVED },
  // Item is being prepared for the student to pick up
  COLLECTION_REQUEST: { from: [STATUS.STORED], to: STATUS.READY, verification: VERIFICATION.PENDING },
  // Handover - operator must confirm ownership (verificationStatus must be APPROVED)
  COLLECTION: { from: [STATUS.STORED, STATUS.READY], to: STATUS.COLLECTED, requireApproved: true },
  // Ownership/item check failed - logged, status unchanged, remarks required
  REJECTION: { from: OPEN, to: null, verification: VERIFICATION.REJECTED, requireRemarks: true },
  // Registration withdrawn before/at deposit
  CANCELLATION: { from: [STATUS.REGISTERED, STATUS.DEPOSITED], to: STATUS.CANCELLED, verification: VERIFICATION.PENDING, deactivateQr: true },
};

const allowedActionsFor = (status) =>
  Object.entries(ACTIONS).filter(([, r]) => r.from.includes(status)).map(([name]) => name);

module.exports = { STATUS, VERIFICATION, ACTIONS, allowedActionsFor };
