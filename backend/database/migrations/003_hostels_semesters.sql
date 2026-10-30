-- 003: hostels and semesters (meeting 9: link records to hostel and semester).
-- Run by `npm run migrate` - do not import this file by hand.

-- Hostels are managed by the admin; each student belongs to one (empty until the admin sets it).
CREATE TABLE hostels (
  hostel_id   INT AUTO_INCREMENT PRIMARY KEY,
  hostel_name VARCHAR(100) NOT NULL UNIQUE,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
  ADD COLUMN hostel_id INT NULL AFTER phone,
  ADD CONSTRAINT fk_users_hostel FOREIGN KEY (hostel_id) REFERENCES hostels(hostel_id);

-- Semesters are date ranges the admin creates (e.g. "Semester 1 2026").
-- A drop-off gets the semester whose dates include the day it was registered.
CREATE TABLE semesters (
  semester_id   INT AUTO_INCREMENT PRIMARY KEY,
  semester_name VARCHAR(50) NOT NULL UNIQUE,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  created_at    TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_semester_dates CHECK (end_date >= start_date)
);

ALTER TABLE drop_offs
  ADD COLUMN semester_id INT NULL AFTER owner_id,
  ADD CONSTRAINT fk_drop_offs_semester FOREIGN KEY (semester_id) REFERENCES semesters(semester_id);
