/**
 * POST /api/admin/login
 * Аутентификация администратора
 */

const { sql } = require('../db');

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Пароль обязателен' });
  }

  // Пароль хранится в переменной окружения Vercel
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!ADMIN_PASSWORD) {
    console.error('❌ ADMIN_PASSWORD не настроен в Vercel Environment Variables');
    return res.status(500).json({ error: 'Ошибка конфигурации сервера' });
  }

  // Сравниваем пароли
  if (password === ADMIN_PASSWORD) {
    // Успешный вход
    return res.status(200).json({ 
      success: true, 
      message: 'Аутентификация успешна'
    });
  } else {
    // Неверный пароль
    return res.status(401).json({ 
      success: false, 
      error: 'Неверный пароль'
    });
  }
}
