-- Usupovo Life Hall - PostgreSQL Schema
-- Для использования с Vercel Postgres (Neon)

-- ==================== ТАБЛИЦЫ ====================

-- Мероприятия
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    venue TEXT,
    duration INTEGER
);

-- Места (без FK)
CREATE TABLE IF NOT EXISTS seats (
    id SERIAL PRIMARY KEY,
    event_id INTEGER,
    seat_label TEXT NOT NULL,
    price INTEGER NOT NULL,
    category TEXT,
    status TEXT DEFAULT 'free'
);

-- Билеты (без FK)
CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    event_id INTEGER,
    seat_labels TEXT,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    total_amount INTEGER,
    booking_time TEXT,
    status TEXT DEFAULT 'active',
    discount_category_id INTEGER,
    payment_method TEXT DEFAULT 'card'
);

-- Ожидающие оплаты (без FK)
CREATE TABLE IF NOT EXISTS pending_bookings (
    payment_id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL,
    event_id INTEGER NOT NULL,
    seat_labels TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    total_amount INTEGER NOT NULL,
    discount_category_id INTEGER,
    payment_method TEXT DEFAULT 'card',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- Промокоды
CREATE TABLE IF NOT EXISTS promocodes (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount INTEGER NOT NULL,
    max_uses INTEGER,
    used INTEGER DEFAULT 0,
    expiry_date TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Льготные категории
CREATE TABLE IF NOT EXISTS discount_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    discount_percent INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Сессии посетителей
CREATE TABLE IF NOT EXISTS visitor_sessions (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    location TEXT,
    screen_width INTEGER,
    screen_height INTEGER,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP,
    duration INTEGER,
    pages_visited TEXT,
    referrer TEXT,
    language TEXT
);

-- Настройки
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Попытки входа администратора (для rate limiting)
CREATE TABLE IF NOT EXISTS admin_login_attempts (
    id SERIAL PRIMARY KEY,
    ip_address TEXT NOT NULL,
    success BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== ВНЕШНИЕ КЛЮЧИ ====================

ALTER TABLE seats 
ADD CONSTRAINT fk_seats_event 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE tickets 
ADD CONSTRAINT fk_tickets_event 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE tickets 
ADD CONSTRAINT fk_tickets_discount 
FOREIGN KEY (discount_category_id) REFERENCES discount_categories(id);

ALTER TABLE pending_bookings 
ADD CONSTRAINT fk_pending_bookings_event 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE pending_bookings 
ADD CONSTRAINT fk_pending_bookings_discount 
FOREIGN KEY (discount_category_id) REFERENCES discount_categories(id);

-- ==================== ИНДЕКСЫ ====================

CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_seats_event_id ON seats(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_pending_bookings_expires ON pending_bookings(expires_at);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_entry ON visitor_sessions(entry_time);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_session ON visitor_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_ip ON admin_login_attempts(ip_address, created_at);
