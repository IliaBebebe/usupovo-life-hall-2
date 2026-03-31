/**
 * Конфигурация базы данных для Vercel Postgres
 * Использует @vercel/postgres для подключения к Neon PostgreSQL
 */

const { sql } = require('@vercel/postgres');

// Проверка подключения к БД
async function checkConnection() {
  try {
    await sql`SELECT 1`;
    console.log('✅ Database connected');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Инициализация таблиц
async function initializeDatabase() {
  try {
    // Таблица events
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        venue TEXT,
        duration INTEGER
      )
    `;
    console.log('✅ Table: events');

    // Таблица seats
    await sql`
      CREATE TABLE IF NOT EXISTS seats (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        seat_label TEXT NOT NULL,
        price INTEGER NOT NULL,
        category TEXT,
        status TEXT DEFAULT 'free'
      )
    `;
    console.log('✅ Table: seats');

    // Таблица tickets
    await sql`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        seat_labels TEXT,
        customer_name TEXT,
        customer_email TEXT,
        customer_phone TEXT,
        total_amount INTEGER,
        booking_time TEXT,
        status TEXT DEFAULT 'active',
        discount_category_id INTEGER,
        payment_method TEXT DEFAULT 'card'
      )
    `;
    console.log('✅ Table: tickets');

    // Таблица pending_bookings
    await sql`
      CREATE TABLE IF NOT EXISTS pending_bookings (
        payment_id TEXT PRIMARY KEY,
        booking_id TEXT NOT NULL,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        seat_labels TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT,
        total_amount INTEGER NOT NULL,
        discount_category_id INTEGER,
        payment_method TEXT DEFAULT 'card',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      )
    `;
    console.log('✅ Table: pending_bookings');

    // Таблица promocodes
    await sql`
      CREATE TABLE IF NOT EXISTS promocodes (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        discount INTEGER NOT NULL,
        max_uses INTEGER,
        used INTEGER DEFAULT 0,
        expiry_date TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `;
    console.log('✅ Table: promocodes');

    // Таблица discount_categories
    await sql`
      CREATE TABLE IF NOT EXISTS discount_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        discount_percent INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        is_active BOOLEAN DEFAULT true
      )
    `;
    console.log('✅ Table: discount_categories');

    // Таблица visitor_sessions
    await sql`
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
      )
    `;
    console.log('✅ Table: visitor_sessions');

    // Таблица settings
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Table: settings');

    // Создаем индексы
    await sql`CREATE INDEX IF NOT EXISTS idx_events_date ON events(date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_seats_event_id ON seats(event_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pending_bookings_expires ON pending_bookings(expires_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_visitor_sessions_entry ON visitor_sessions(entry_time)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_visitor_sessions_session ON visitor_sessions(session_id)`;
    console.log('✅ Indexes created');

    // Инициализация льготных категорий по умолчанию
    const { rows } = await sql`SELECT COUNT(*) as count FROM discount_categories`;
    if (rows[0].count === 0) {
      const categories = [
        ['Стандартный', 0, 'Полная стоимость без скидок'],
        ['Инвалид I группы', 50, 'Инвалиды I группы'],
        ['Инвалид II группы', 40, 'Инвалиды II группы'],
        ['Инвалид III группы', 30, 'Инвалиды III группы'],
        ['Пенсионер', 25, 'Пенсионеры по возрасту'],
        ['Ветеран труда', 35, 'Ветераны труда'],
        ['Студент', 20, 'Студенты очной формы обучения']
      ];

      for (const [name, discount_percent, description] of categories) {
        await sql`
          INSERT INTO discount_categories (name, discount_percent, description)
          VALUES (${name}, ${discount_percent}, ${description})
        `;
      }
      console.log('✅ Default discount categories inserted');
    }

    // Инициализация настроек по умолчанию
    const { rows: settingsRows } = await sql`SELECT COUNT(*) as count FROM settings WHERE key = 'ticket_type'`;
    if (settingsRows.count === 0) {
      await sql`
        INSERT INTO settings (key, value) VALUES ('ticket_type', 'old')
      `;
      console.log('✅ Default ticket type set');
    }

    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    return false;
  }
}

module.exports = {
  sql,
  checkConnection,
  initializeDatabase
};
