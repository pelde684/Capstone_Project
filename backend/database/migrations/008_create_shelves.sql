
-- 008: Create shelves inside storage locations.
-- Each storage location can contain multiple shelves.

CREATE TABLE shelves (
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
