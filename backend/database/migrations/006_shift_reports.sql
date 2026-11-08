-- 006: shift reports submitted by operators (one per operator, date and shift).
-- The counts are worked out by the backend from the transactions table when the report is submitted.
-- Run by `npm run migrate` - do not import this file by hand.
CREATE TABLE shift_reports (
  shift_report_id  INT AUTO_INCREMENT PRIMARY KEY,
  operator_id      INT NOT NULL,
  shift_date       DATE NOT NULL,
  shift            ENUM('WHOLE_DAY','MORNING','AFTERNOON') NOT NULL,
  deposited        INT NOT NULL DEFAULT 0,
  stored_count     INT NOT NULL DEFAULT 0,  -- "stored" is a reserved word in MySQL 8
  handed_back      INT NOT NULL DEFAULT 0,
  rejected         INT NOT NULL DEFAULT 0,
  total_actions    INT NOT NULL DEFAULT 0,
  items_in_storage INT NOT NULL DEFAULT 0,
  items_waiting    INT NOT NULL DEFAULT 0,
  notes            TEXT NULL,
  submitted_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_shift_report (operator_id, shift_date, shift),
  INDEX idx_shift_reports_date (shift_date),
  CONSTRAINT fk_shift_reports_operator FOREIGN KEY (operator_id) REFERENCES users(user_id)
);
