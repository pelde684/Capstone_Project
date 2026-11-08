-- 010: the college's 10 programmes (stored in the departments table from 009).
-- The admin allocates a hostel room to each one on the Rooms page. Existing names are left untouched.
-- Run by `npm run migrate` - do not import this file by hand.
INSERT IGNORE INTO departments (department_name, is_active, created_at) VALUES
  ('SWE', 1, NOW()),
  ('ME', 1, NOW()),
  ('EE', 1, NOW()),
  ('EG', 1, NOW()),
  ('ECE', 1, NOW()),
  ('CE', 1, NOW()),
  ('IT', 1, NOW()),
  ('Architecture', 1, NOW()),
  ('Water Resources', 1, NOW()),
  ('ICE', 1, NOW());
