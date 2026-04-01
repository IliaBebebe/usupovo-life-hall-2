/**
 * POST /api/admin/login
 * Аутентификация администратора с защитой от брутфорса
 */

const { sql } = require('../db');

export const config = {
  api: {
    bodyParser: true,
  },
};

// Константы для rate limiting
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 минут

/**
 * Получает IP адрес из запроса
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] || 
         req.socket?.remoteAddress || 
         'unknown';
}

/**
 * Проверяет и обновляет счетчик попыток входа для IP
 * Возвращает { allowed: boolean, remaining: number, resetAt: number }
 */
async function checkRateLimit(ip) {
  const now = new Date().toISOString();
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();

  try {
    // Получаем количество попыток за последние 15 минут
    const { rows } = await sql`
      SELECT COUNT(*) as count, MAX(created_at) as last_attempt
      FROM admin_login_attempts
      WHERE ip_address = ${ip}
      AND created_at > ${windowStart}
    `;

    const count = parseInt(rows[0].count) || 0;
    const lastAttempt = rows[0].last_attempt;

    if (count >= MAX_ATTEMPTS) {
      // Превышен лимит попыток
      const resetAt = lastAttempt ? new Date(lastAttempt).getTime() + WINDOW_MS : Date.now() + WINDOW_MS;
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: Math.ceil((resetAt - Date.now()) / 1000)
      };
    }

    return {
      allowed: true,
      remaining: MAX_ATTEMPTS - count,
      resetAt: Date.now() + WINDOW_MS
    };
  } catch (error) {
    console.error('Ошибка проверки rate limit:', error.message);
    // В случае ошибки БД, разрешаем вход (fail-open)
    return { allowed: true, remaining: MAX_ATTEMPTS, resetAt: Date.now() + WINDOW_MS };
  }
}

/**
 * Записывает попытку входа в БД
 */
async function logLoginAttempt(ip, success) {
  try {
    await sql`
      INSERT INTO admin_login_attempts (ip_address, success, created_at)
      VALUES (${ip}, ${success}, NOW())
    `;

    // Очищаем старые записи (старше 1 часа)
    await sql`
      DELETE FROM admin_login_attempts
      WHERE created_at < NOW() - INTERVAL '1 hour'
    `;
  } catch (error) {
    console.error('Ошибка логирования попытки входа:', error.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIP = getClientIP(req);
  console.log(`Login attempt from IP: ${clientIP}`);

  // Проверяем rate limit
  const rateLimit = await checkRateLimit(clientIP);

  if (!rateLimit.allowed) {
    // Записываем попытку даже при превышении лимита
    await logLoginAttempt(clientIP, false);

    return res.status(429).json({
      error: 'Слишком много попыток входа',
      message: `Превышено максимальное количество попыток (${MAX_ATTEMPTS}) за 15 минут`,
      retryAfter: rateLimit.retryAfter,
      retryAfterMinutes: Math.ceil(rateLimit.retryAfter / 60)
    });
  }

  const { password } = req.body;

  if (!password) {
    await logLoginAttempt(clientIP, false);
    return res.status(400).json({ error: 'Пароль обязателен' });
  }

  try {
    // Пароль хранится в переменной окружения Vercel
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    console.log('Login attempt - ADMIN_PASSWORD exists:', !!ADMIN_PASSWORD);

    if (!ADMIN_PASSWORD) {
      console.error('❌ ADMIN_PASSWORD не настроен в Vercel Environment Variables');
      await logLoginAttempt(clientIP, false);
      return res.status(500).json({
        error: 'Ошибка конфигурации сервера',
        debug: 'ADMIN_PASSWORD не установлен'
      });
    }

    // Сравниваем пароли
    if (password === ADMIN_PASSWORD) {
      // Успешный вход
      console.log('✅ Успешная аутентификация');
      await logLoginAttempt(clientIP, true);

      // Очищаем историю успешных входов для этого IP
      await sql`
        DELETE FROM admin_login_attempts
        WHERE ip_address = ${clientIP} AND success = true
      `;

      return res.status(200).json({
        success: true,
        message: 'Аутентификация успешна'
      });
    } else {
      // Неверный пароль
      console.log('❌ Неверный пароль');
      await logLoginAttempt(clientIP, false);

      return res.status(401).json({
        success: false,
        error: 'Неверный пароль'
      });
    }
  } catch (error) {
    console.error('❌ Ошибка аутентификации:', error.message);
    await logLoginAttempt(clientIP, false);
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера',
      debug: error.message
    });
  }
}
