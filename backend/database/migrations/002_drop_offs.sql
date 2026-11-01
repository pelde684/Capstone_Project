-- 002: one QR per drop-off (several items share one QR).
-- Run by `npm run migrate` - do not import this file by hand.
-- It keeps all existing data: every existing item becomes its own drop-off, and its QR moves to that drop-off.

-- 1) New table: a drop-off groups the items a student hands in together
CREATE TABLE drop_offs (
  drop_off_id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id    INT NOT NULL,
  created_at  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_drop_offs_owner FOREIGN KEY (owner_id) REFERENCES users(user_id)
);

-- 2) Each item belongs to a drop-off
ALTER TABLE items ADD COLUMN drop_off_id INT NULL AFTER location_id;
ALTER TABLE items ADD CONSTRAINT fk_items_drop_off FOREIGN KEY (drop_off_id) REFERENCES drop_offs(drop_off_id);

-- 3) The QR belongs to the drop-off (item_id stays only for old rows, so it may now be empty)
ALTER TABLE qr_codes ADD COLUMN drop_off_id INT NULL;
ALTER TABLE qr_codes MODIFY item_id INT NULL;
ALTER TABLE qr_codes ADD CONSTRAINT uq_qr_drop_off UNIQUE (drop_off_id);
ALTER TABLE qr_codes ADD CONSTRAINT fk_qr_drop_off FOREIGN KEY (drop_off_id) REFERENCES drop_offs(drop_off_id);

-- 4) Keep existing data: one drop-off per existing item (same number as the item), QR re-pointed
INSERT INTO drop_offs (drop_off_id, owner_id, created_at, updated_at)
  SELECT item_id, owner_id, registered_at, NOW() FROM items;
UPDATE items SET drop_off_id = item_id WHERE drop_off_id IS NULL;
UPDATE qr_codes q JOIN items i ON i.item_id = q.item_id SET q.drop_off_id = i.drop_off_id WHERE q.drop_off_id IS NULL;
