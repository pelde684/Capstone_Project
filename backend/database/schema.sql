-- Student Luggage Management System - full database structure, for READING only
-- (report, diagrams, reviewing tables). It is the result of all files in database/migrations.
--
-- To create or update a database, do NOT import this file. In the backend folder run:
--     npm run migrate
-- When you add a migration, update this file too so it stays accurate.
CREATE DATABASE IF NOT EXISTS luggage_management_system CHARACTER SET utf8mb4;
USE luggage_management_system;

CREATE TABLE IF NOT EXISTS roles (
  role_id     INT AUTO_INCREMENT PRIMARY KEY,
  role_name   VARCHAR(30) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hostels (
  hostel_id   INT AUTO_INCREMENT PRIMARY KEY,
  hostel_name VARCHAR(100) NOT NULL UNIQUE,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  role_id       INT NOT NULL,
  student_id    VARCHAR(30) UNIQUE,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  hostel_id     INT NULL,
  department_id INT NULL,  -- 009, foreign key added after the departments table below
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role   FOREIGN KEY (role_id)   REFERENCES roles(role_id),
  CONSTRAINT fk_users_hostel FOREIGN KEY (hostel_id) REFERENCES hostels(hostel_id)
);

-- Operator shift reports.
-- Source: 006_shift_reports.sql

CREATE TABLE IF NOT EXISTS shift_reports (
    shift_report_id INT AUTO_INCREMENT PRIMARY KEY,
    operator_id INT NOT NULL,
    shift_date DATE NOT NULL,

    shift ENUM(
        'WHOLE_DAY',
        'MORNING',
        'AFTERNOON'
    ) NOT NULL,

    deposited INT NOT NULL DEFAULT 0,
    stored_count INT NOT NULL DEFAULT 0,
    handed_back INT NOT NULL DEFAULT 0,
    rejected INT NOT NULL DEFAULT 0,
    total_actions INT NOT NULL DEFAULT 0,
    items_in_storage INT NOT NULL DEFAULT 0,
    items_waiting INT NOT NULL DEFAULT 0,

    notes TEXT NULL,

    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_shift_report (
        operator_id,
        shift_date,
        shift
    ),

    INDEX idx_shift_reports_date (shift_date),

    CONSTRAINT fk_shift_reports_operator
        FOREIGN KEY (operator_id)
        REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS categories (
  category_id   INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  description   VARCHAR(255),
  created_at    TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS storage_locations (
  location_id   INT AUTO_INCREMENT PRIMARY KEY,
  location_name VARCHAR(100) NOT NULL UNIQUE,
  description   VARCHAR(255),
  capacity      INT,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

-- Departments and the storage room allocated to each (009_departments.sql)
CREATE TABLE IF NOT EXISTS departments (
  department_id   INT AUTO_INCREMENT PRIMARY KEY,
  department_name VARCHAR(100) NOT NULL UNIQUE,
  location_id     INT NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_departments_location FOREIGN KEY (location_id) REFERENCES storage_locations(location_id)
);
ALTER TABLE users ADD CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(department_id);
-- 010_programmes.sql adds the 10 programmes: SWE, ME, EE, EG, ECE, CE, IT, Architecture, Water Resources, ICE

-- Individual shelves inside storage locations.
-- Source: 008_create_shelves.sql

CREATE TABLE IF NOT EXISTS shelves (
    shelf_id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    shelf_name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_shelf_location_name (
        location_id,
        shelf_name
    ),

    CONSTRAINT fk_shelves_location
        FOREIGN KEY (location_id)
        REFERENCES storage_locations(location_id),

    CONSTRAINT chk_shelf_capacity
        CHECK (capacity >= 0)
);

CREATE TABLE IF NOT EXISTS semesters (
  semester_id   INT AUTO_INCREMENT PRIMARY KEY,
  semester_name VARCHAR(50) NOT NULL UNIQUE,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  created_at    TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_semester_dates CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS drop_offs (
  drop_off_id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id    INT NOT NULL,
  semester_id INT NULL,
  created_at  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_drop_offs_owner    FOREIGN KEY (owner_id)    REFERENCES users(user_id),
  CONSTRAINT fk_drop_offs_semester FOREIGN KEY (semester_id) REFERENCES semesters(semester_id)
);

CREATE TABLE IF NOT EXISTS items (
  item_id         INT AUTO_INCREMENT PRIMARY KEY,
  owner_id        INT NOT NULL,
  category_id     INT NOT NULL,
  location_id     INT,
  drop_off_id     INT NULL,
  item_name       VARCHAR(150) NOT NULL,
  description     TEXT,
  quantity        INT NOT NULL DEFAULT 1,
  photograph_path VARCHAR(500),
  status          ENUM('REGISTERED','DEPOSITED','STORED','READY_FOR_COLLECTION','COLLECTED','CANCELLED') NOT NULL DEFAULT 'REGISTERED',
  registered_at   TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (item_name),
  INDEX idx_items_status_location (status, location_id),
  CONSTRAINT fk_items_owner    FOREIGN KEY (owner_id)    REFERENCES users(user_id),
  CONSTRAINT fk_items_category FOREIGN KEY (category_id) REFERENCES categories(category_id),
  CONSTRAINT fk_items_location FOREIGN KEY (location_id) REFERENCES storage_locations(location_id),
  CONSTRAINT fk_items_drop_off FOREIGN KEY (drop_off_id) REFERENCES drop_offs(drop_off_id)
);

-- Item photographs.
-- Source: 007_item_photos.sql

CREATE TABLE IF NOT EXISTS item_photos (
    photo_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    public_id VARCHAR(500) NOT NULL,
    position TINYINT NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_item_photo_position (
        item_id,
        position
    ),

    CONSTRAINT chk_item_photo_position
        CHECK (position BETWEEN 1 AND 4),

    CONSTRAINT fk_item_photos_item
        FOREIGN KEY (item_id)
        REFERENCES items(item_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS qr_codes (
  qr_id        INT AUTO_INCREMENT PRIMARY KEY,
  item_id      INT NULL UNIQUE,            -- legacy (one QR per item); new rows use drop_off_id
  drop_off_id  INT NULL UNIQUE,
  qr_value     VARCHAR(255) NOT NULL UNIQUE,
  generated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_qr_item FOREIGN KEY (item_id) REFERENCES items(item_id),
  CONSTRAINT fk_qr_drop_off FOREIGN KEY (drop_off_id) REFERENCES drop_offs(drop_off_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  transaction_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
  item_id             INT NOT NULL,
  operator_id         INT NOT NULL,
  action              ENUM('DEPOSIT','STORAGE_VERIFICATION','COLLECTION_REQUEST','COLLECTION','REJECTION','CANCELLATION') NOT NULL,
  verification_status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  remarks             VARCHAR(500),
  transaction_time    TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tx_operator_time (operator_id, transaction_time),
  CONSTRAINT fk_tx_item     FOREIGN KEY (item_id)     REFERENCES items(item_id),
  CONSTRAINT fk_tx_operator FOREIGN KEY (operator_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS item_status_history (
  history_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  item_id    INT NOT NULL,
  changed_by INT NOT NULL,
  old_status ENUM('REGISTERED','DEPOSITED','STORED','READY_FOR_COLLECTION','COLLECTED','CANCELLED'),
  new_status ENUM('REGISTERED','DEPOSITED','STORED','READY_FOR_COLLECTION','COLLECTED','CANCELLED') NOT NULL,
  remarks    VARCHAR(500),
  changed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_history_operator_date (changed_by, changed_at),
  CONSTRAINT fk_hist_item FOREIGN KEY (item_id)    REFERENCES items(item_id),
  CONSTRAINT fk_hist_user FOREIGN KEY (changed_by) REFERENCES users(user_id)
);

-- A student raises a complaint (optionally about one of their items);
-- the admin forwards it to a person or department and tracks it until it is resolved.
CREATE TABLE IF NOT EXISTS complaints (
  complaint_id   INT AUTO_INCREMENT PRIMARY KEY,
  complainant_id INT NOT NULL,
  item_id        INT NULL,
  category       ENUM('COMPLAINT','NOT_WORKING','SUGGESTION','OTHER') NOT NULL DEFAULT 'COMPLAINT',
  page           VARCHAR(50) NULL,
  subject        VARCHAR(150) NOT NULL,
  description    TEXT NOT NULL,
  status         ENUM('OPEN','FORWARDED','IN_PROGRESS','RESOLVED','CLOSED') NOT NULL DEFAULT 'OPEN',
  forwarded_to   VARCHAR(150) NULL,
  handled_by     INT NULL,
  resolution     TEXT NULL,
  created_at     TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at    TIMESTAMP NULL,
  INDEX idx_complaints_status (status, created_at),
  INDEX idx_complaints_category (category, created_at),
  CONSTRAINT fk_complaints_complainant FOREIGN KEY (complainant_id) REFERENCES users(user_id),
  CONSTRAINT fk_complaints_item        FOREIGN KEY (item_id)        REFERENCES items(item_id),
  CONSTRAINT fk_complaints_handler     FOREIGN KEY (handled_by)     REFERENCES users(user_id)
);

-- Lost or found belongings, reported by anyone and tracked until returned to the owner.
CREATE TABLE IF NOT EXISTS lost_found_items (
  lost_found_id   INT AUTO_INCREMENT PRIMARY KEY,
  report_type     ENUM('LOST','FOUND') NOT NULL,
  item_name       VARCHAR(150) NOT NULL,
  description     TEXT,
  category_id     INT NULL,
  location_text   VARCHAR(150) NULL,
  photo_public_id VARCHAR(500) NULL,
  reported_by     INT NOT NULL,
  related_item_id INT NULL,
  claimed_by      INT NULL,
  status          ENUM('OPEN','MATCHED','RETURNED','CLOSED') NOT NULL DEFAULT 'OPEN',
  reported_at     TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at     TIMESTAMP NULL,
  INDEX idx_lost_found_status (status, reported_at),
  CONSTRAINT fk_lf_category FOREIGN KEY (category_id)     REFERENCES categories(category_id),
  CONSTRAINT fk_lf_reporter FOREIGN KEY (reported_by)     REFERENCES users(user_id),
  CONSTRAINT fk_lf_item     FOREIGN KEY (related_item_id) REFERENCES items(item_id),
  CONSTRAINT fk_lf_claimer  FOREIGN KEY (claimed_by)      REFERENCES users(user_id)
);
