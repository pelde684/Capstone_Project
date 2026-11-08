-- 001: the original tables (before drop-offs).
-- Run by `npm run migrate` - do not import this file by hand.
CREATE TABLE IF NOT EXISTS roles (
  role_id     INT AUTO_INCREMENT PRIMARY KEY,
  role_name   VARCHAR(30) NOT NULL UNIQUE,
  description VARCHAR(255),
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
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
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

CREATE TABLE IF NOT EXISTS items (
  item_id         INT AUTO_INCREMENT PRIMARY KEY,
  owner_id        INT NOT NULL,
  category_id     INT NOT NULL,
  location_id     INT,
  item_name       VARCHAR(150) NOT NULL,
  description     TEXT,
  quantity        INT NOT NULL DEFAULT 1,
  photograph_path VARCHAR(500),
  status          ENUM('REGISTERED','DEPOSITED','STORED','READY_FOR_COLLECTION','COLLECTED','CANCELLED') NOT NULL DEFAULT 'REGISTERED',
  registered_at   TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (item_name),
  CONSTRAINT fk_items_owner    FOREIGN KEY (owner_id)    REFERENCES users(user_id),
  CONSTRAINT fk_items_category FOREIGN KEY (category_id) REFERENCES categories(category_id),
  CONSTRAINT fk_items_location FOREIGN KEY (location_id) REFERENCES storage_locations(location_id)
);

CREATE TABLE IF NOT EXISTS qr_codes (
  qr_id        INT AUTO_INCREMENT PRIMARY KEY,
  item_id      INT NOT NULL UNIQUE,
  qr_value     VARCHAR(255) NOT NULL UNIQUE,
  generated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_qr_item FOREIGN KEY (item_id) REFERENCES items(item_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  transaction_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
  item_id             INT NOT NULL,
  operator_id         INT NOT NULL,
  action              ENUM('DEPOSIT','STORAGE_VERIFICATION','COLLECTION_REQUEST','COLLECTION','REJECTION','CANCELLATION') NOT NULL,
  verification_status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  remarks             VARCHAR(500),
  transaction_time    TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
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
  CONSTRAINT fk_hist_item FOREIGN KEY (item_id)    REFERENCES items(item_id),
  CONSTRAINT fk_hist_user FOREIGN KEY (changed_by) REFERENCES users(user_id)
);
