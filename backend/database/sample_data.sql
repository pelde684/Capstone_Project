
-- =====================================================
-- Student Luggage Management System
-- File: sample_data.sql
-- Purpose: Insert demonstration data
-- =====================================================

USE luggage_management_system;


-- =====================================================
-- 1. HOSTELS
-- =====================================================

INSERT IGNORE INTO hostels (hostel_name, is_active)
VALUES
('RK-A', 1),
('RK-B', 1),
('H-A', 1),
('H-B', 1);


-- =====================================================
-- 2. SEMESTERS
-- Sample academic periods for demonstration.
-- Replace dates with your college's actual calendar.
-- =====================================================

INSERT IGNORE INTO semesters
    (semester_name, start_date, end_date)
VALUES
('Semester 1 - 2026', '2026-01-01', '2026-06-30'),
('Semester 2 - 2026', '2026-07-01', '2026-12-31');


-- =====================================================
-- 3. CATEGORIES
-- =====================================================

INSERT IGNORE INTO categories
    (category_name, description)
VALUES
('Bags', 'Backpacks, suitcases and travel bags'),
('Electronics', 'Laptops, chargers and electronic devices'),
('Clothing', 'Clothes, jackets and uniforms'),
('Books', 'Textbooks, notebooks and study materials'),
('Personal Items', 'Personal belongings and accessories'),
('Sports Equipment', 'Sports bags and sporting equipment');


-- =====================================================
-- 4. STORAGE LOCATIONS
-- Required because shelves reference storage_locations.
-- =====================================================

INSERT IGNORE INTO storage_locations
    (location_name, description, capacity, is_active)
VALUES
('Main Storage Room', 'Primary luggage storage area', 200, 1),
('Secondary Storage Room', 'Additional luggage storage area', 100, 1);


-- =====================================================
-- 5. SHELVES
-- Each shelf belongs to an existing storage location.
-- =====================================================

INSERT IGNORE INTO shelves
    (location_id, shelf_name, capacity, is_active)
SELECT location_id, 'Shelf A1', 30, 1
FROM storage_locations
WHERE location_name = 'Main Storage Room';

INSERT IGNORE INTO shelves
    (location_id, shelf_name, capacity, is_active)
SELECT location_id, 'Shelf A2', 30, 1
FROM storage_locations
WHERE location_name = 'Main Storage Room';

INSERT IGNORE INTO shelves
    (location_id, shelf_name, capacity, is_active)
SELECT location_id, 'Shelf A3', 30, 1
FROM storage_locations
WHERE location_name = 'Main Storage Room';

INSERT IGNORE INTO shelves
    (location_id, shelf_name, capacity, is_active)
SELECT location_id, 'Shelf B1', 25, 1
FROM storage_locations
WHERE location_name = 'Secondary Storage Room';

INSERT IGNORE INTO shelves
    (location_id, shelf_name, capacity, is_active)
SELECT location_id, 'Shelf B2', 25, 1
FROM storage_locations
WHERE location_name = 'Secondary Storage Room';


-- =====================================================
-- END OF SAMPLE DATA
-- =====================================================
