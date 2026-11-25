-- =====================================================================
--  CINEMA MANAGEMENT & ONLINE TICKETING SYSTEM  -  ENHANCED SCHEMA (v2, 20 tables)
--  Target : MySQL 8.x / MariaDB 10.4+ (XAMPP)   Engine: InnoDB  utf8mb4
--  Modules:
--    1 Users & Security      2 Movie Catalogue       3 Cinema Infrastructure
--    4 Scheduling & Pricing  5 Booking, Payment & Promotions   6 Food & Beverage
--  Import:  phpMyAdmin > Import,  or  mysql -u root < schema.sql
-- =====================================================================

-- To rebuild from scratch during development, uncomment the next line (DESTROYS all data):
-- DROP DATABASE IF EXISTS cinema_db;
CREATE DATABASE cinema_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cinema_db;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================================
-- 3a. CINEMA (created first because staff accounts can belong to a branch)
-- =====================================================================
CREATE TABLE cinema (
  cinema_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cinema_name    VARCHAR(120) NOT NULL,
  city           VARCHAR(80)  NOT NULL,
  address        VARCHAR(255) NOT NULL,
  contact_number VARCHAR(30)  NOT NULL,
  cinema_status  ENUM('ACTIVE','CLOSED') NOT NULL DEFAULT 'ACTIVE',
  UNIQUE KEY uq_cinema_city_name (city, cinema_name)
) ENGINE=InnoDB;

-- =====================================================================
-- 1. USERS & SECURITY
-- =====================================================================
-- One table for customers AND staff; the role decides what the user may do.
CREATE TABLE user_account (
  user_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role            ENUM('CUSTOMER','ADMIN','MANAGER','BOX_OFFICE') NOT NULL DEFAULT 'CUSTOMER',
  cinema_id       INT UNSIGNED NULL,                       -- branch of a staff member (NULL for customers)
  full_name       VARCHAR(120) NOT NULL,
  email           VARCHAR(150) NOT NULL UNIQUE,
  phone           VARCHAR(30)  NULL,
  password_hash   VARCHAR(255) NOT NULL,
  account_status  ENUM('ACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at   DATETIME NULL,
  CONSTRAINT ck_user_branch CHECK (role <> 'CUSTOMER' OR cinema_id IS NULL),
  CONSTRAINT fk_user_cinema FOREIGN KEY (cinema_id) REFERENCES cinema (cinema_id)
) ENGINE=InnoDB;

CREATE TABLE audit_log (
  audit_id    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NULL,
  action      VARCHAR(40)  NOT NULL,                       -- CREATE / UPDATE / DELETE / LOGIN / REFUND ...
  entity_name VARCHAR(60)  NOT NULL,
  entity_id   VARCHAR(40)  NULL,
  old_value   TEXT NULL,
  new_value   TEXT NULL,
  ip_address  VARCHAR(45) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_audit_entity (entity_name, entity_id),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES user_account (user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 2. MOVIE CATALOGUE
-- =====================================================================
CREATE TABLE genre (
  genre_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  genre_name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE movie (
  movie_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(200) NOT NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL,
  release_date     DATE NOT NULL,
  language         VARCHAR(30) NOT NULL,
  content_rating   ENUM('G','PG','PG-13','R') NOT NULL,
  director         VARCHAR(120) NULL,
  cast_members     VARCHAR(500) NULL,
  synopsis         TEXT NULL,
  poster_url       VARCHAR(500) NULL,
  trailer_url      VARCHAR(500) NULL,
  movie_status     ENUM('COMING_SOON','NOW_SHOWING','ARCHIVED') NOT NULL DEFAULT 'COMING_SOON',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_movie_duration CHECK (duration_minutes > 0),
  KEY ix_movie_status (movie_status, release_date)
) ENGINE=InnoDB;

CREATE TABLE movie_genre (
  movie_id INT UNSIGNED NOT NULL,
  genre_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (movie_id, genre_id),
  CONSTRAINT fk_mg_movie FOREIGN KEY (movie_id) REFERENCES movie (movie_id) ON DELETE CASCADE,
  CONSTRAINT fk_mg_genre FOREIGN KEY (genre_id) REFERENCES genre (genre_id)
) ENGINE=InnoDB;

CREATE TABLE movie_review (
  review_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  movie_id    INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  rating      TINYINT UNSIGNED NOT NULL,
  review_text VARCHAR(1000) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_review_once (movie_id, user_id),           -- one review per customer per movie
  CONSTRAINT ck_review_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_review_movie FOREIGN KEY (movie_id) REFERENCES movie (movie_id) ON DELETE CASCADE,
  CONSTRAINT fk_review_user  FOREIGN KEY (user_id)  REFERENCES user_account (user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 3b. SCREENS & SEATS
-- =====================================================================
CREATE TABLE screen (
  screen_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cinema_id     INT UNSIGNED NOT NULL,
  screen_name   VARCHAR(60) NOT NULL,
  screen_type   ENUM('STANDARD','3D','IMAX','VIP') NOT NULL DEFAULT 'STANDARD',
  screen_status ENUM('ACTIVE','MAINTENANCE','CLOSED') NOT NULL DEFAULT 'ACTIVE',
  rows_count    TINYINT UNSIGNED NOT NULL DEFAULT 8,
  columns_count TINYINT UNSIGNED NOT NULL DEFAULT 12,
  total_seats   INT UNSIGNED NOT NULL DEFAULT 96,
  UNIQUE KEY uq_screen_name (cinema_id, screen_name),
  CONSTRAINT fk_screen_cinema FOREIGN KEY (cinema_id) REFERENCES cinema (cinema_id)
) ENGINE=InnoDB;

CREATE TABLE seat_category (
  seat_category_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_name    VARCHAR(40) NOT NULL UNIQUE,            -- Standard, Premium, VIP
  price_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  CONSTRAINT ck_seatcat_mult CHECK (price_multiplier > 0)
) ENGINE=InnoDB;

CREATE TABLE seat (
  seat_id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  screen_id        INT UNSIGNED NOT NULL,
  seat_category_id INT UNSIGNED NOT NULL,
  row_label        VARCHAR(3)   NOT NULL,
  seat_number      TINYINT UNSIGNED NOT NULL,
  seat_status      ENUM('ACTIVE','BROKEN') NOT NULL DEFAULT 'ACTIVE',
  UNIQUE KEY uq_seat_position (screen_id, row_label, seat_number),
  UNIQUE KEY uq_seat_screen   (seat_id, screen_id),        -- target of composite FK
  CONSTRAINT fk_seat_screen   FOREIGN KEY (screen_id)        REFERENCES screen (screen_id),
  CONSTRAINT fk_seat_category FOREIGN KEY (seat_category_id) REFERENCES seat_category (seat_category_id)
) ENGINE=InnoDB;

-- =====================================================================
-- 4. SCHEDULING & PRICING          (SHOW is a reserved word -> table = showtime)
-- =====================================================================
CREATE TABLE showtime (
  showtime_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  movie_id          INT UNSIGNED NOT NULL,
  screen_id         INT UNSIGNED NOT NULL,
  start_time        DATETIME NOT NULL,
  end_time          DATETIME NOT NULL,
  audio_language    VARCHAR(30) NOT NULL,
  subtitle_language VARCHAR(30) NULL,
  base_price        DECIMAL(10,2) NOT NULL,
  show_status       ENUM('DRAFT','ON_SALE','SOLD_OUT','CANCELLED','COMPLETED') NOT NULL DEFAULT 'DRAFT',
  created_by        INT UNSIGNED NULL,                     -- admin / manager who scheduled it
  UNIQUE KEY uq_show_screen_start (screen_id, start_time),
  UNIQUE KEY uq_show_screen       (showtime_id, screen_id),  -- target of composite FK
  KEY ix_show_movie_start (movie_id, start_time),
  CONSTRAINT ck_show_time  CHECK (end_time > start_time),
  CONSTRAINT ck_show_price CHECK (base_price >= 0),
  CONSTRAINT fk_show_movie  FOREIGN KEY (movie_id)   REFERENCES movie (movie_id),
  CONSTRAINT fk_show_screen FOREIGN KEY (screen_id)  REFERENCES screen (screen_id),
  CONSTRAINT fk_show_user   FOREIGN KEY (created_by) REFERENCES user_account (user_id)
) ENGINE=InnoDB;

-- Final price of each seat category for one show (base_price x multiplier, editable per show)
CREATE TABLE showtime_price (
  showtime_id      INT UNSIGNED NOT NULL,
  seat_category_id INT UNSIGNED NOT NULL,
  price            DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (showtime_id, seat_category_id),
  CONSTRAINT ck_sp_price CHECK (price >= 0),
  CONSTRAINT fk_sp_show FOREIGN KEY (showtime_id)      REFERENCES showtime (showtime_id) ON DELETE CASCADE,
  CONSTRAINT fk_sp_cat  FOREIGN KEY (seat_category_id) REFERENCES seat_category (seat_category_id)
) ENGINE=InnoDB;

-- =====================================================================
-- 5. BOOKING, PAYMENT & PROMOTIONS
-- =====================================================================
CREATE TABLE promotion (
  promotion_id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  promo_code               VARCHAR(30)  NOT NULL UNIQUE,
  description              VARCHAR(255) NULL,
  discount_type            ENUM('PERCENT','FLAT') NOT NULL,
  discount_value           DECIMAL(10,2) NOT NULL,
  max_discount             DECIMAL(10,2) NULL,
  min_order_amount         DECIMAL(10,2) NOT NULL DEFAULT 0,
  valid_from               DATETIME NOT NULL,
  valid_to                 DATETIME NOT NULL,
  usage_limit_total        INT UNSIGNED NULL,
  is_active                TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT ck_promo_value CHECK (discount_value > 0),
  CONSTRAINT ck_promo_dates CHECK (valid_to > valid_from)
) ENGINE=InnoDB;

CREATE TABLE booking (
  booking_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_reference  CHAR(10) NOT NULL UNIQUE,             -- shown to customer e.g. CM7K2P9Q4X
  user_id            INT UNSIGNED NULL,                    -- customer; NULL for walk-in guest
  guest_phone        VARCHAR(30) NULL,
  showtime_id        INT UNSIGNED NOT NULL,
  booking_channel    ENUM('WEB','COUNTER') NOT NULL DEFAULT 'WEB',
  sold_by_user_id    INT UNSIGNED NULL,                    -- box-office staff for COUNTER sales
  promotion_id       INT UNSIGNED NULL,                    -- promo code used (max one per booking)
  ticket_subtotal    DECIMAL(10,2) NOT NULL DEFAULT 0,
  food_subtotal      DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount    DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount       DECIMAL(10,2) NOT NULL DEFAULT 0,
  booking_status     ENUM('PENDING','CONFIRMED','CANCELLED','EXPIRED') NOT NULL DEFAULT 'PENDING',
  booking_time       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payment_deadline   DATETIME NULL,                        -- PENDING bookings expire after ~10 min
  cancelled_at       DATETIME NULL,
  UNIQUE KEY uq_booking_show (booking_id, showtime_id),    -- target of composite FK
  KEY ix_booking_user (user_id, booking_time),
  KEY ix_booking_status (booking_status, payment_deadline),
  CONSTRAINT ck_booking_amounts CHECK (ticket_subtotal >= 0 AND food_subtotal >= 0 AND discount_amount >= 0 AND total_amount >= 0),
  CONSTRAINT ck_booking_who CHECK (user_id IS NOT NULL OR guest_phone IS NOT NULL),
  CONSTRAINT fk_booking_user  FOREIGN KEY (user_id)         REFERENCES user_account (user_id),
  CONSTRAINT fk_booking_show  FOREIGN KEY (showtime_id)     REFERENCES showtime (showtime_id),
  CONSTRAINT fk_booking_staff FOREIGN KEY (sold_by_user_id) REFERENCES user_account (user_id),
  CONSTRAINT fk_booking_promo FOREIGN KEY (promotion_id)    REFERENCES promotion (promotion_id)
) ENGINE=InnoDB;

CREATE TABLE booking_seat (
  booking_seat_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id      INT UNSIGNED NOT NULL,
  showtime_id     INT UNSIGNED NOT NULL,
  screen_id       INT UNSIGNED NOT NULL,
  seat_id         INT UNSIGNED NOT NULL,
  seat_price      DECIMAL(10,2) NOT NULL,                  -- price snapshot
  seat_status     ENUM('HELD','CONFIRMED','CANCELLED','EXPIRED') NOT NULL DEFAULT 'HELD',
  hold_expires_at DATETIME NULL,
  -- 1 while the seat is actively reserved, NULL once released -> keeps history but blocks double booking
  active_slot     TINYINT AS (CASE WHEN seat_status IN ('HELD','CONFIRMED') THEN 1 ELSE NULL END) STORED,
  UNIQUE KEY uq_active_show_seat (showtime_id, seat_id, active_slot),
  CONSTRAINT ck_bs_price CHECK (seat_price >= 0),
  CONSTRAINT fk_bs_booking FOREIGN KEY (booking_id, showtime_id) REFERENCES booking (booking_id, showtime_id),
  CONSTRAINT fk_bs_show    FOREIGN KEY (showtime_id, screen_id)  REFERENCES showtime (showtime_id, screen_id),
  CONSTRAINT fk_bs_seat    FOREIGN KEY (seat_id, screen_id)      REFERENCES seat (seat_id, screen_id)
) ENGINE=InnoDB;

CREATE TABLE ticket (
  ticket_id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_seat_id        INT UNSIGNED NOT NULL UNIQUE,     -- 1 ticket per reserved seat
  ticket_code            CHAR(16) NOT NULL UNIQUE,         -- encoded in the QR code
  ticket_status          ENUM('VALID','USED','CANCELLED') NOT NULL DEFAULT 'VALID',
  issued_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  checked_in_at          DATETIME NULL,
  checked_in_by_user_id  INT UNSIGNED NULL,
  CONSTRAINT fk_ticket_bs    FOREIGN KEY (booking_seat_id)       REFERENCES booking_seat (booking_seat_id),
  CONSTRAINT fk_ticket_staff FOREIGN KEY (checked_in_by_user_id) REFERENCES user_account (user_id)
) ENGINE=InnoDB;

-- Payment attempts AND refunds (payment_type). Revenue = SUCCESS payments - SUCCESS refunds.
CREATE TABLE payment (
  payment_id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id            INT UNSIGNED NOT NULL,
  payment_type          ENUM('PAYMENT','REFUND') NOT NULL DEFAULT 'PAYMENT',
  amount                DECIMAL(10,2) NOT NULL,
  payment_method        ENUM('CARD','EASYPAISA','JAZZCASH','CASH') NOT NULL,
  payment_status        ENUM('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'PENDING',
  transaction_reference VARCHAR(80) NULL UNIQUE,           -- gateway reference
  processed_by_user_id  INT UNSIGNED NULL,                 -- cashier / approver
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at               DATETIME NULL,
  KEY ix_payment_booking (booking_id, payment_status),
  CONSTRAINT ck_payment_amount CHECK (amount > 0),
  CONSTRAINT fk_pay_booking FOREIGN KEY (booking_id)           REFERENCES booking (booking_id),
  CONSTRAINT fk_pay_user    FOREIGN KEY (processed_by_user_id) REFERENCES user_account (user_id)
) ENGINE=InnoDB;

-- =====================================================================
-- 6. FOOD & BEVERAGE
-- =====================================================================
CREATE TABLE food_item (
  food_item_id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_name           VARCHAR(120) NOT NULL UNIQUE,
  category            ENUM('SNACKS','MEALS','DRINKS','DESSERTS','COMBOS') NOT NULL,
  description         VARCHAR(255) NULL,
  current_price       DECIMAL(10,2) NOT NULL,
  availability_status ENUM('AVAILABLE','UNAVAILABLE') NOT NULL DEFAULT 'AVAILABLE',
  CONSTRAINT ck_food_price CHECK (current_price >= 0)
) ENGINE=InnoDB;

CREATE TABLE food_order (
  food_order_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id    INT UNSIGNED NOT NULL,
  order_time    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  order_status  ENUM('PLACED','PREPARING','READY','COLLECTED','CANCELLED') NOT NULL DEFAULT 'PLACED',
  total_amount  DECIMAL(10,2) NOT NULL DEFAULT 0,
  CONSTRAINT ck_fo_total CHECK (total_amount >= 0),
  CONSTRAINT fk_fo_booking FOREIGN KEY (booking_id) REFERENCES booking (booking_id)
) ENGINE=InnoDB;

CREATE TABLE order_detail (
  order_detail_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  food_order_id   INT UNSIGNED NOT NULL,
  food_item_id    INT UNSIGNED NOT NULL,
  quantity        SMALLINT UNSIGNED NOT NULL,
  unit_price      DECIMAL(10,2) NOT NULL,                  -- price snapshot
  line_total      DECIMAL(12,2) AS (quantity * unit_price) STORED,
  UNIQUE KEY uq_order_item (food_order_id, food_item_id),
  CONSTRAINT ck_od_qty   CHECK (quantity > 0),
  CONSTRAINT ck_od_price CHECK (unit_price >= 0),
  CONSTRAINT fk_od_order FOREIGN KEY (food_order_id) REFERENCES food_order (food_order_id) ON DELETE CASCADE,
  CONSTRAINT fk_od_item  FOREIGN KEY (food_item_id)  REFERENCES food_item (food_item_id)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- TRIGGERS / PROCEDURE
-- =====================================================================
DELIMITER $$

-- No overlapping shows on the same screen
-- (UNIQUE(screen_id,start_time) alone cannot stop overlapping time ranges)
CREATE TRIGGER trg_showtime_no_overlap_ins BEFORE INSERT ON showtime
FOR EACH ROW
BEGIN
  IF NEW.show_status <> 'CANCELLED' AND EXISTS (
       SELECT 1 FROM showtime s
        WHERE s.screen_id = NEW.screen_id AND s.show_status <> 'CANCELLED'
          AND NEW.start_time < s.end_time AND NEW.end_time > s.start_time) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Show overlaps another show on the same screen';
  END IF;
END$$

CREATE TRIGGER trg_showtime_no_overlap_upd BEFORE UPDATE ON showtime
FOR EACH ROW
BEGIN
  IF NEW.show_status <> 'CANCELLED' AND EXISTS (
       SELECT 1 FROM showtime s
        WHERE s.screen_id = NEW.screen_id AND s.show_status <> 'CANCELLED'
          AND s.showtime_id <> NEW.showtime_id
          AND NEW.start_time < s.end_time AND NEW.end_time > s.start_time) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Show overlaps another show on the same screen';
  END IF;
END$$

-- Release seats of unpaid bookings (run from cron / the app / a MySQL event)
CREATE PROCEDURE sp_expire_unpaid_bookings()
BEGIN
  UPDATE booking_seat bs
    JOIN booking b ON b.booking_id = bs.booking_id
     SET bs.seat_status = 'EXPIRED'
   WHERE b.booking_status = 'PENDING' AND b.payment_deadline < NOW() AND bs.seat_status = 'HELD';
  UPDATE booking SET booking_status = 'EXPIRED'
   WHERE booking_status = 'PENDING' AND payment_deadline < NOW();
END$$

DELIMITER ;

-- =====================================================================
-- VIEWS (reports promised in the proposal)
-- =====================================================================
CREATE VIEW v_upcoming_shows AS
SELECT st.showtime_id, m.title, c.cinema_name, c.city, sc.screen_name, sc.screen_type,
       st.start_time, st.end_time, st.base_price, st.show_status
  FROM showtime st
  JOIN movie m   ON m.movie_id = st.movie_id
  JOIN screen sc ON sc.screen_id = st.screen_id
  JOIN cinema c  ON c.cinema_id = sc.cinema_id
 WHERE st.start_time > NOW() AND st.show_status IN ('ON_SALE','SOLD_OUT');

CREATE VIEW v_showtime_occupancy AS
SELECT st.showtime_id,
       (SELECT COUNT(*) FROM seat s WHERE s.screen_id = st.screen_id AND s.seat_status = 'ACTIVE') AS capacity,
       (SELECT COUNT(*) FROM booking_seat bs WHERE bs.showtime_id = st.showtime_id AND bs.seat_status IN ('HELD','CONFIRMED')) AS seats_taken
  FROM showtime st;

CREATE VIEW v_booking_summary AS
SELECT b.booking_id, b.booking_reference, COALESCE(u.full_name, 'Walk-in guest') AS customer_name,
       m.title, st.start_time, b.booking_channel, b.booking_status, b.total_amount,
       (SELECT COUNT(*) FROM booking_seat bs WHERE bs.booking_id = b.booking_id AND bs.seat_status = 'CONFIRMED') AS seats
  FROM booking b
  LEFT JOIN user_account u ON u.user_id = b.user_id
  JOIN showtime st ON st.showtime_id = b.showtime_id
  JOIN movie m     ON m.movie_id = st.movie_id;

CREATE VIEW v_revenue_by_cinema AS
SELECT c.cinema_id, c.cinema_name, COUNT(DISTINCT b.booking_id) AS bookings,
       SUM(CASE WHEN p.payment_type = 'PAYMENT' THEN p.amount ELSE -p.amount END) AS net_revenue
  FROM payment p
  JOIN booking b   ON b.booking_id = p.booking_id
  JOIN showtime st ON st.showtime_id = b.showtime_id
  JOIN screen sc   ON sc.screen_id = st.screen_id
  JOIN cinema c    ON c.cinema_id = sc.cinema_id
 WHERE p.payment_status = 'SUCCESS'
 GROUP BY c.cinema_id, c.cinema_name;

-- =====================================================================
-- REFERENCE DATA
-- =====================================================================
INSERT INTO genre (genre_name) VALUES ('Action'),('Comedy'),('Drama'),('Horror'),('Sci-Fi'),('Romance'),('Animation'),('Thriller');
INSERT INTO seat_category (category_name, price_multiplier) VALUES ('Standard',1.00),('Premium',1.25),('VIP',1.60);
