/**
 * Security Migration Script
 * Выполняет миграцию БД для добавления таблицы admin_login_attempts
 */

const fs = require('fs');
const path = require('path');

// Загружаем .env.local вручную
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/^["']|["']$/g, '').trim();
      process.env[key.trim()] = value;
    }
  });
  console.log('✅ .env.local загружен\n');
}

const { sql } = require('@vercel/postgres');

async function runMigration() {
  console.log('🚀 Запуск миграции безопасности...\n');

  try {
    // Проверка подключения
    console.log('📡 Проверка подключения к БД...');
    await sql`SELECT 1`;
    console.log('✅ Подключение успешно\n');

    // 1. Создание таблицы admin_login_attempts
    console.log('📦 Создание таблицы admin_login_attempts...');
    await sql`
      CREATE TABLE IF NOT EXISTS admin_login_attempts (
        id SERIAL PRIMARY KEY,
        ip_address TEXT NOT NULL,
        success BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Таблица создана\n');

    // 2. Создание индекса
    console.log('📊 Создание индекса idx_admin_login_attempts_ip...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_ip 
      ON admin_login_attempts(ip_address, created_at)
    `;
    console.log('✅ Индекс создан\n');

    // 3. Проверка структуры
    console.log('🔍 Проверка структуры таблицы...');
    const { rows } = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'admin_login_attempts'
      ORDER BY ordinal_position
    `;
    
    console.log('Структура таблицы:');
    rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // 4. Проверка индексов
    console.log('\n🔍 Проверка индексов...');
    const { rows: indexRows } = await sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'admin_login_attempts'
    `;
    
    indexRows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });

    console.log('\n✅ Миграция успешно завершена!\n');
    console.log('📋 Следующие шаги:');
    console.log('  1. Проверьте логи Vercel после деплоя');
    console.log('  2. Протестируйте rate limiting (5 попыток входа за 15 мин)');
    console.log('  3. Мониторьте таблицу admin_login_attempts\n');

  } catch (error) {
    console.error('❌ Ошибка миграции:', error.message);
    if (error.stack) {
      console.error('\nДетали:', error.stack);
    }
    process.exit(1);
  }
}

// Запуск
runMigration();
