-- Rooms (and NK kitchens) inside each hostel, and the room a student lives in.
CREATE TABLE IF NOT EXISTS hostel_rooms (
  room_id   INT AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT NOT NULL,
  room_no   VARCHAR(10) NOT NULL,
  room_type ENUM('ROOM','KITCHEN') NOT NULL DEFAULT 'ROOM',
  UNIQUE KEY uq_hostel_room (hostel_id, room_type, room_no),
  CONSTRAINT fk_hostel_rooms_hostel FOREIGN KEY (hostel_id) REFERENCES hostels(hostel_id)
);

ALTER TABLE users ADD COLUMN room_id INT NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_room FOREIGN KEY (room_id) REFERENCES hostel_rooms(room_id);