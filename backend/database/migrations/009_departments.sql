-- 009: departments, and the storage room allocated to each department.
-- Students belong to a department; the admin allocates a storage room (storage_locations) to each department,
-- e.g. SWE and ME -> HF 210. Students see their department's room, operators store items there by default.
-- Run by `npm run migrate` - do not import this file by hand.
CREATE TABLE IF NOT EXISTS departments (
  department_id   INT AUTO_INCREMENT PRIMARY KEY,
  department_name VARCHAR(100) NOT NULL UNIQUE,
  location_id     INT NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_departments_location FOREIGN KEY (location_id) REFERENCES storage_locations(location_id)
);

ALTER TABLE users
  ADD COLUMN department_id INT NULL AFTER hostel_id,
  ADD CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(department_id);
