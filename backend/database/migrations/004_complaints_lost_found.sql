-- 004: complaints and lost-and-found (meeting 9).
-- Run by `npm run migrate` - do not import this file by hand.

-- A student raises a complaint (optionally about one of their items);
-- the admin forwards it to a person or department and tracks it until it is resolved.
CREATE TABLE complaints (
  complaint_id   INT AUTO_INCREMENT PRIMARY KEY,
  complainant_id INT NOT NULL,
  item_id        INT NULL,
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
  CONSTRAINT fk_complaints_complainant FOREIGN KEY (complainant_id) REFERENCES users(user_id),
  CONSTRAINT fk_complaints_item        FOREIGN KEY (item_id)        REFERENCES items(item_id),
  CONSTRAINT fk_complaints_handler     FOREIGN KEY (handled_by)     REFERENCES users(user_id)
);

-- Lost or found belongings, reported by anyone and tracked until returned to the owner.
CREATE TABLE lost_found_items (
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
