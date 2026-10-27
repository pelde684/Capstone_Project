-- 005: indexes for the admin reports (meeting 9: filter by operator, date, status, location).
-- Operator activity is already recorded in item_status_history and transactions; these make it fast to filter.
-- Run by `npm run migrate` - do not import this file by hand.
CREATE INDEX idx_history_operator_date ON item_status_history (changed_by, changed_at);
CREATE INDEX idx_tx_operator_time      ON transactions (operator_id, transaction_time);
CREATE INDEX idx_items_status_location ON items (status, location_id);
