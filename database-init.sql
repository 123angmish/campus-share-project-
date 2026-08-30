-- CampusShare database helper file
--
-- IMPORTANT: application tables are NOT created here.
-- Production schema ownership belongs to Flyway migrations under:
-- campusshare-backend/src/main/resources/db/migration/
--
-- Docker Compose creates the `campusshare` database automatically.
-- For a manually-created PostgreSQL database, create an empty database/user first,
-- configure DATABASE_URL / DATABASE_USERNAME / DATABASE_PASSWORD, then start the
-- backend with the `prod` profile. Flyway applies V1__startup_schema.sql.

-- Safe diagnostics (run after the app has started successfully):
SELECT current_database() AS database_name, current_user AS database_user;

-- Marketplace health snapshot:
SELECT COUNT(*) AS users FROM users;
SELECT COUNT(*) AS items FROM items;
SELECT status, COUNT(*) AS rentals FROM rental_transactions GROUP BY status ORDER BY status;
SELECT payment_status, COUNT(*) AS payments FROM rental_transactions GROUP BY payment_status ORDER BY payment_status;
SELECT status, COUNT(*) AS payment_attempts FROM payment_attempts GROUP BY status ORDER BY status;
SELECT status, COUNT(*) AS webhook_inbox FROM payment_webhook_events GROUP BY status ORDER BY status;

-- Revenue volume from completed, captured rentals (gross rent only; excludes deposits):
SELECT COALESCE(SUM(total_amount), 0) AS completed_rental_gmv
FROM rental_transactions
WHERE status = 'COMPLETED' AND payment_status = 'PAID';

-- Never put production passwords, API secrets, or live payment credentials in SQL files.
