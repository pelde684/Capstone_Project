// Mock data. Replace with REST API calls (Tandin's backend) later.
export const initialItems = [
  { id: 'QR-2026-001', name: 'Blue Trolley Bag', category: 'Bag', owner: 'Dorji Wangchuk', studentId: '02250101', status: 'Stored', date: '2026-10-12', description: 'Blue trolley bag with a yellow ribbon on the zip.', verifiedBy: 'operator@gmail.com', verifiedOn: '2026-10-12' },
  { id: 'QR-2026-002', name: 'Laptop Backpack', category: 'Bag', owner: 'Sonam Choden', studentId: '02250114', status: 'Stored', date: '2026-10-12', description: 'Grey backpack with a laptop and charger inside.', verifiedBy: 'operator2@gmail.com', verifiedOn: '2026-10-12' },
  { id: 'QR-2026-003', name: 'Rice Cooker', category: 'Appliance', owner: 'Tshering Dema', studentId: '02250122', status: 'Stored', date: '2026-10-13', description: 'White rice cooker in its original box.', verifiedBy: 'operator@gmail.com', verifiedOn: '2026-10-13' },
  { id: 'QR-2026-004', name: 'Sleeping Bag', category: 'Bedding', owner: 'Ugyen Tenzin', studentId: '02250130', status: 'Stored', date: '2026-10-13', description: 'Green sleeping bag tied with a rope.', verifiedBy: 'operator2@gmail.com', verifiedOn: '2026-10-13' },
  { id: 'QR-2026-005', name: 'Study Lamp Box', category: 'Box', owner: 'Pema Lhamo', studentId: '02250145', status: 'Returned', date: '2026-10-10', description: 'Small cardboard box with a study lamp.', verifiedBy: 'operator@gmail.com', verifiedOn: '2026-10-10' },
  { id: 'QR-2026-006', name: 'Duffel Bag', category: 'Bag', owner: 'Karma Dorji', studentId: '02250152', status: 'Returned', date: '2026-10-09', description: 'Black duffel bag with a red name tag.', verifiedBy: 'operator2@gmail.com', verifiedOn: '2026-10-09' },
  { id: 'QR-2026-007', name: 'Maroon Suitcase', category: 'Bag', owner: 'Ugyen Namgay', studentId: '02250742', status: 'Pending', date: '2026-10-14', description: 'Large maroon suitcase with a name tag on the handle.' },
  { id: 'QR-2026-008', name: 'Black Sports Bag', category: 'Bag', owner: 'Yangchen Pelden', studentId: '02250815', status: 'Pending', date: '2026-10-14', description: 'Black sports bag with a badminton racket and a water bottle.' },
]
export const staff = [
  { name: 'Phub Zam', email: 'operator@gmail.com', role: 'Operator', shift: 'Morning', active: true },
  { name: 'Jigme Norbu', email: 'operator2@gmail.com', role: 'Operator', shift: 'Evening', active: true },
  { name: 'CST Admin', email: 'admin@gmail.com', role: 'Admin', shift: '-', active: true },
]
export const students = [
  { studentId: '02250101', name: 'Dorji Wangchuk', programme: 'BE IT', items: 1 },
  { studentId: '02250114', name: 'Sonam Choden', programme: 'BE EE', items: 1 },
  { studentId: '02250122', name: 'Tshering Dema', programme: 'BE CE', items: 1 },
  { studentId: '02250130', name: 'Ugyen Tenzin', programme: 'BE IT', items: 1 },
  { studentId: '02250145', name: 'Pema Lhamo', programme: 'BE Arch', items: 1 },
  { studentId: '02250152', name: 'Karma Dorji', programme: 'BE ME', items: 1 },
  { studentId: '02250742', name: 'Ugyen Namgay', programme: 'BE IT', items: 1 },
  { studentId: '02250815', name: 'Yangchen Pelden', programme: 'BE CE', items: 1 },
]