-- 008: feedback/complaints get a proper type (category) and the page it is about,
-- instead of writing them inside the message text.
-- Feedback already sent with "Type: ...\nPage: ...\n\n<message>" at the top of the description is moved into the new columns.
-- Run by `npm run migrate` - do not import this file by hand.
ALTER TABLE complaints
  ADD COLUMN category ENUM('COMPLAINT','NOT_WORKING','SUGGESTION','OTHER') NOT NULL DEFAULT 'COMPLAINT' AFTER item_id,
  ADD COLUMN page     VARCHAR(50) NULL AFTER category,
  ADD INDEX idx_complaints_category (category, created_at);

UPDATE complaints
   SET category = CASE SUBSTRING(SUBSTRING_INDEX(description, '\n', 1), 7)
                    WHEN 'Complaint' THEN 'COMPLAINT'
                    WHEN 'Something isn''t working' THEN 'NOT_WORKING'
                    WHEN 'Suggestion' THEN 'SUGGESTION'
                    ELSE 'OTHER' END,
       page = NULLIF(SUBSTRING(SUBSTRING_INDEX(SUBSTRING_INDEX(description, '\n', 2), '\n', -1), 7), 'Not specified'),
       description = SUBSTRING(description, LOCATE('\n\n', description) + 2)
 WHERE description LIKE 'Type: %\nPage: %\n\n%';
