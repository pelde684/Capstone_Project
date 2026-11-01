-- 007: up to 4 photos per item (meeting 9), photographed from different sides.
-- Each existing item's single photo becomes its photo number 1.
-- items.photograph_path is kept and always holds photo 1, so older code keeps working.
-- Run by `npm run migrate` - do not import this file by hand.
CREATE TABLE item_photos (
  photo_id   INT AUTO_INCREMENT PRIMARY KEY,
  item_id    INT NOT NULL,
  public_id  VARCHAR(500) NOT NULL,
  position   TINYINT NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_item_photo_position (item_id, position),
  CONSTRAINT chk_item_photo_position CHECK (position BETWEEN 1 AND 4),
  CONSTRAINT fk_item_photos_item FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE
);

INSERT INTO item_photos (item_id, public_id, position)
  SELECT item_id, photograph_path, 1 FROM items WHERE photograph_path IS NOT NULL;
