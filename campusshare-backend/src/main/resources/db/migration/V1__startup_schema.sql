CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    study_year INTEGER NOT NULL,
    contact_number VARCHAR(255) NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_token_expiry TIMESTAMP,
    refresh_token_hash VARCHAR(255),
    refresh_token_expiry TIMESTAMP,
    password_reset_token_hash VARCHAR(255),
    password_reset_token_expiry TIMESTAMP,
    reputation_score DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    total_reviews INTEGER NOT NULL DEFAULT 0,
    role VARCHAR(255) NOT NULL DEFAULT 'USER',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    report_count INTEGER NOT NULL DEFAULT 0,
    hostel_block VARCHAR(255),
    room_number VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

CREATE TABLE items (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    category VARCHAR(255) NOT NULL,
    daily_price NUMERIC(10,2) NOT NULL,
    weekly_price NUMERIC(10,2),
    deposit_amount NUMERIC(10,2) DEFAULT 0,
    availability_status VARCHAR(255) NOT NULL DEFAULT 'AVAILABLE',
    owner_id BIGINT NOT NULL REFERENCES users(id),
    flagged BOOLEAN NOT NULL DEFAULT FALSE,
    flag_reason VARCHAR(500),
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT chk_item_daily_price CHECK (daily_price > 0),
    CONSTRAINT chk_item_weekly_price CHECK (weekly_price IS NULL OR weekly_price >= 0),
    CONSTRAINT chk_item_deposit CHECK (deposit_amount IS NULL OR deposit_amount >= 0)
);

CREATE TABLE item_images (
    item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    image_url VARCHAR(10000)
);

CREATE TABLE rental_transactions (
    id BIGSERIAL PRIMARY KEY,
    version BIGINT,
    item_id BIGINT NOT NULL REFERENCES items(id),
    borrower_id BIGINT NOT NULL REFERENCES users(id),
    owner_id BIGINT NOT NULL REFERENCES users(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days INTEGER NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    deposit_amount NUMERIC(10,2),
    status VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    payment_status VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    payment_verified_at TIMESTAMP,
    deposit_refunded BOOLEAN NOT NULL DEFAULT FALSE,
    deposit_refund_status VARCHAR(24) NOT NULL DEFAULT 'NOT_REQUESTED',
    razorpay_refund_id VARCHAR(100),
    deposit_refunded_at TIMESTAMP,
    handover_pin VARCHAR(6),
    accepted_at TIMESTAMP,
    declined_at TIMESTAMP,
    decline_reason VARCHAR(500),
    item_collected_at TIMESTAMP,
    item_returned_at TIMESTAMP,
    borrower_confirmed_return BOOLEAN NOT NULL DEFAULT FALSE,
    owner_confirmed_return BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT chk_rental_dates CHECK (end_date > start_date),
    CONSTRAINT chk_rental_parties CHECK (borrower_id <> owner_id),
    CONSTRAINT chk_rental_amount CHECK (total_amount > 0),
    CONSTRAINT chk_rental_deposit CHECK (deposit_amount IS NULL OR deposit_amount >= 0)
);

CREATE TABLE payment_attempts (
    id BIGSERIAL PRIMARY KEY,
    rental_id BIGINT NOT NULL REFERENCES rental_transactions(id) ON DELETE CASCADE,
    provider_order_id VARCHAR(100) NOT NULL UNIQUE,
    provider_payment_id VARCHAR(100) UNIQUE,
    amount NUMERIC(10,2) NOT NULL,
    amount_paise BIGINT NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    status VARCHAR(24) NOT NULL DEFAULT 'CREATED',
    failure_code VARCHAR(255),
    failure_message VARCHAR(1000),
    verified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT chk_payment_amount CHECK (amount > 0 AND amount_paise > 0)
);

CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT NOT NULL REFERENCES rental_transactions(id),
    reviewer_id BIGINT NOT NULL REFERENCES users(id),
    reviewee_id BIGINT NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL,
    comment VARCHAR(1000),
    flagged BOOLEAN NOT NULL DEFAULT FALSE,
    flag_reason VARCHAR(500),
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_review_transaction_reviewer UNIQUE(transaction_id, reviewer_id),
    CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_review_parties CHECK (reviewer_id <> reviewee_id)
);

CREATE TABLE reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_id BIGINT NOT NULL REFERENCES users(id),
    reported_user_id BIGINT REFERENCES users(id),
    reported_item_id BIGINT REFERENCES items(id),
    report_type VARCHAR(255) NOT NULL,
    reason VARCHAR(1000) NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    admin_notes VARCHAR(1000),
    resolved_at TIMESTAMP,
    resolved_by_admin_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT chk_report_target CHECK (
        (report_type = 'USER' AND reported_user_id IS NOT NULL AND reported_item_id IS NULL) OR
        (report_type = 'ITEM' AND reported_item_id IS NOT NULL AND reported_user_id IS NULL)
    )
);

CREATE TABLE wishlist_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_wishlist_user_item UNIQUE(user_id, item_id)
);

CREATE TABLE payment_webhook_events (
    id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(160) NOT NULL UNIQUE,
    event_type VARCHAR(80) NOT NULL,
    raw_payload TEXT NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'RECEIVED',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_error VARCHAR(1200),
    received_at TIMESTAMP NOT NULL,
    processing_started_at TIMESTAMP,
    processed_at TIMESTAMP
);

CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_availability ON items(availability_status);
CREATE INDEX idx_items_owner ON items(owner_id);
CREATE INDEX idx_rental_item_dates ON rental_transactions(item_id, start_date, end_date);
CREATE INDEX idx_rental_borrower ON rental_transactions(borrower_id);
CREATE INDEX idx_rental_owner ON rental_transactions(owner_id);
CREATE INDEX idx_rental_status ON rental_transactions(status);
CREATE INDEX idx_payment_attempt_rental ON payment_attempts(rental_id);
CREATE INDEX idx_payment_attempt_order ON payment_attempts(provider_order_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_webhook_status_received ON payment_webhook_events(status, received_at);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_user ON reports(reported_user_id);
CREATE INDEX idx_reports_item ON reports(reported_item_id);
