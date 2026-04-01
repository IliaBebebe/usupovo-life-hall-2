-- Usupovo Life Hall - Security Migration
-- Выполнить для обновления существующей БД

-- 1. Таблица для rate limiting (логин попытки)
CREATE TABLE IF NOT EXISTS admin_login_attempts (
    id SERIAL PRIMARY KEY,
    ip_address TEXT NOT NULL,
    success BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Индекс для производительности rate limiting
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_ip ON admin_login_attempts(ip_address, created_at);

-- 3. Очистка старых данных (автоматически при каждом логине)
-- DELETE FROM admin_login_attempts WHERE created_at < NOW() - INTERVAL '1 hour';

-- Проверка
SELECT 'Migration completed' as status;
