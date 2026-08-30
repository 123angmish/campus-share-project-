-- V2: Enhanced Peer-to-Peer Features (Notifications, Status History, Enhanced Item Fields)

ALTER TABLE items ADD COLUMN IF NOT EXISTS item_condition VARCHAR(50) DEFAULT 'GOOD';
ALTER TABLE items ADD COLUMN IF NOT EXISTS campus_location VARCHAR(255);
ALTER TABLE items ADD COLUMN IF NOT EXISTS pickup_location VARCHAR(255);
ALTER TABLE items ADD COLUMN IF NOT EXISTS avail_start_date DATE;
ALTER TABLE items ADD COLUMN IF NOT EXISTS avail_end_date DATE;
ALTER TABLE items ADD COLUMN IF NOT EXISTS min_rental_days INTEGER DEFAULT 1;
ALTER TABLE items ADD COLUMN IF NOT EXISTS max_rental_days INTEGER DEFAULT 30;
ALTER TABLE items ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE items ADD COLUMN IF NOT EXISTS model VARCHAR(100);
ALTER TABLE items ADD COLUMN IF NOT EXISTS replacement_value NUMERIC(10,2);
ALTER TABLE items ADD COLUMN IF NOT EXISTS listing_type VARCHAR(50) DEFAULT 'RENT';
ALTER TABLE items ADD COLUMN IF NOT EXISTS buy_price NUMERIC(10,2);

ALTER TABLE rental_transactions ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50) DEFAULT 'RENTAL';

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    type VARCHAR(80),
    link VARCHAR(255),
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    read_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rental_status_history (
    id BIGSERIAL PRIMARY KEY,
    rental_id BIGINT NOT NULL REFERENCES rental_transactions(id) ON DELETE CASCADE,
    from_status VARCHAR(80),
    to_status VARCHAR(80) NOT NULL,
    changed_by_id BIGINT REFERENCES users(id),
    note VARCHAR(500),
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_rental_status_history_rental ON rental_status_history(rental_id);
