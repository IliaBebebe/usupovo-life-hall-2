/**
 * Usupovo Life Hall API - Единый точка входа для всех API endpoints
 * Vercel Hobby Plan: максимум 12 serverless функций
 */

const { sql, validateOrigin, getClientIP } = require('./db.js');

// Разрешенные домены для CSRF защиты
const ALLOWED_DOMAINS = [
  'usupovo-life-hall-2.vercel.app',
  'localhost',
  '127.0.0.1'
];

export const config = {
  api: {
    bodyParser: true,
  },
};

// Helper для получения параметров из пути
function getPathSegments(path) {
  if (!path) return [];
  return Array.isArray(path) ? path : path.split('/').filter(s => s.length > 0);
}

/**
 * Генерирует уникальный ID для билетов
 * Формат: TIK + timestamp + случайные символы
 */
function generateTicketId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  const randomPart2 = Math.random().toString(36).substring(2, 6);
  return `TIK_${timestamp}_${randomPart}${randomPart2}`;
}

/**
 * Генерирует уникальный ID для платежей
 */
function generatePaymentId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `PAY_${timestamp}_${randomPart}`;
}

/**
 * Валидация входных данных
 */
function validateInput(body, schema) {
  const errors = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = body[field];
    
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`Поле ${field} обязательно`);
      continue;
    }
    
    if (value === undefined || value === null || value === '') continue;
    
    if (rules.type === 'number') {
      const num = Number(value);
      if (isNaN(num)) {
        errors.push(`Поле ${field} должно быть числом`);
      } else if (rules.min !== undefined && num < rules.min) {
        errors.push(`Поле ${field} должно быть не менее ${rules.min}`);
      } else if (rules.max !== undefined && num > rules.max) {
        errors.push(`Поле ${field} должно быть не более ${rules.max}`);
      }
    }
    
    if (rules.type === 'string' && typeof value !== 'string') {
      errors.push(`Поле ${field} должно быть строкой`);
    }
    
    if (rules.type === 'email' && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push(`Поле ${field} должно быть корректным email`);
      }
    }
    
    if (rules.type === 'array' && !Array.isArray(value)) {
      errors.push(`Поле ${field} должно быть массивом`);
    }
    
    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      errors.push(`Поле ${field} не должно превышать ${rules.maxLength} символов`);
    }
  }
  
  return errors;
}

/**
 * Санитизация строки (удаляет HTML теги)
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>?/gm, '').trim();
}

/**
 * Безопасное приведение к числу
 */
function safeNumber(value, defaultValue = 0) {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Безопасное приведение к целому числу
 */
function safeInteger(value, defaultValue = 0) {
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Декодирует пароль из base64 (для поддержки кириллицы)
 */
function decodeAuthPassword(encoded) {
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch (e) {
    return encoded; // Если не base64, возвращаем как есть
  }
}

/**
 * CSRF проверка для админских эндпоинтов
 */
function requireCSRF(req, res) {
  if (process.env.NODE_ENV !== 'production') {
    return null; // В development пропускаем
  }
  
  if (!validateOrigin(req, ALLOWED_DOMAINS)) {
    const clientIP = getClientIP(req);
    console.warn(`⚠️ CSRF blocked: Origin=${req.headers.origin || req.headers.referer || 'none'} IP=${clientIP}`);
    return res.status(403).json({ error: 'Forbidden: Invalid origin' });
  }
  return null;
}

/**
 * Проверка авторизации администратора (Silent Operator)
 * Возвращает 404 если пароль не совпадает
 */
function requireAdminAuth(req, res) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  // Проверяем пароль из заголовка Authorization или query параметра
  const authHeader = req.headers.authorization || '';
  const queryPassword = req.query.password;

  let providedPassword = null;

  // Bearer token
  if (authHeader.startsWith('Bearer ')) {
    const encodedPassword = authHeader.substring(7);
    // Декодируем пароль из base64 для поддержки кириллицы
    providedPassword = decodeAuthPassword(encodedPassword);
  } else if (authHeader && !authHeader.startsWith('Bearer ')) {
    providedPassword = authHeader;
  } else if (queryPassword) {
    providedPassword = queryPassword;
  }

  // Если ADMIN_PASSWORD не настроен, разрешаем доступ (для initial setup)
  if (!adminPassword) {
    console.warn('⚠️ ADMIN_PASSWORD not set - allowing access');
    return null;
  }

  // Проверяем пароль
  if (providedPassword !== adminPassword) {
    // Silent Operator - возвращаем 404 вместо 401/403
    return res.status(404).json({ error: 'Endpoint not found' });
  }

  return null;
}

export default async function handler(req, res) {
  const { method, body, query } = req;
  // Путь передается через query parameter path из vercel.json routes
  const path = query.path || '';
  const segments = getPathSegments(path);

  try {
    // CSRF проверка для всех админских эндпоинтов
    if (segments[0] === 'admin') {
      const csrfError = requireCSRF(req, res);
      if (csrfError) return csrfError;
    }
    // ==================== PUBLIC EVENTS ====================
    if (segments[0] === 'events') {
      if (segments.length === 1 && method === 'GET') {
        // GET /api/events
        const { rows } = await sql`SELECT * FROM events ORDER BY date`;
        return res.status(200).json(rows);
      }
      if (segments.length === 2 && method === 'GET') {
        // GET /api/events/:id
        const { rows } = await sql`SELECT * FROM events WHERE id = ${parseInt(segments[1])}`;
        if (rows.length === 0) return res.status(404).json({ error: 'Мероприятие не найдено' });
        return res.status(200).json(rows[0]);
      }
    }

    // ==================== SEATS ====================
    if (segments[0] === 'seats' && segments[1] === 'event' && segments.length === 3 && method === 'GET') {
      // GET /api/seats/event/:eventId
      const { rows } = await sql`SELECT * FROM seats WHERE event_id = ${parseInt(segments[2])} ORDER BY seat_label`;
      return res.status(200).json(rows);
    }

    // ==================== DISCOUNT CATEGORIES (PUBLIC) ====================
    if (segments[0] === 'discount-categories' && segments.length === 1 && method === 'GET') {
      // GET /api/discount-categories
      const { rows } = await sql`SELECT * FROM discount_categories WHERE is_active = true ORDER BY name`;
      return res.status(200).json(rows);
    }

    // ==================== TICKETS ====================
    if (segments[0] === 'ticket' && segments.length === 2 && method === 'GET') {
      // GET /api/ticket/:ticketId
      const { rows } = await sql`
        SELECT t.*, e.name as event_name, e.date as event_date, dc.name as category_name, dc.discount_percent
        FROM tickets t
        LEFT JOIN events e ON t.event_id = e.id
        LEFT JOIN discount_categories dc ON t.discount_category_id = dc.id
        WHERE t.id = ${segments[1]}
      `;
      if (rows.length === 0) return res.status(404).json({ valid: false, message: 'Билет не найден' });
      const ticket = rows[0];
      const discountCategory = ticket.category_name && ticket.category_name !== 'Стандартный' ? {
        name: ticket.category_name,
        discount_percent: ticket.discount_percent || 0
      } : null;
      return res.status(200).json({
        valid: true,
        ticket: {
          id: ticket.id,
          event: ticket.event_name,
          eventDate: ticket.event_date,
          customer: ticket.customer_name,
          seats: ticket.seat_labels,
          total: ticket.total_amount,
          bookingTime: ticket.booking_time,
          status: ticket.status,
          payment_method: ticket.payment_method || 'card',
          discount_category: discountCategory,
          discountCategory: discountCategory ? discountCategory.name : 'Стандартный',
          discountPercent: discountCategory ? discountCategory.discount_percent : 0
        }
      });
    }
    if (segments[0] === 'ticket' && segments.length === 3 && segments[2] === 'use' && method === 'POST') {
      // POST /api/ticket/:ticketId/use
      const result = await sql`UPDATE tickets SET status = 'used' WHERE id = ${segments[1]}`;
      if (result.rowCount === 0) return res.status(404).json({ error: 'Билет не найден' });
      const { rows } = await sql`
        SELECT t.*, e.name as event_name, e.date as event_date, dc.name as category_name, dc.discount_percent
        FROM tickets t LEFT JOIN events e ON t.event_id = e.id
        LEFT JOIN discount_categories dc ON t.discount_category_id = dc.id WHERE t.id = ${segments[1]}
      `;
      if (rows.length === 0) return res.status(404).json({ error: 'Билет не найден' });
      const ticket = rows[0];
      return res.status(200).json({
        success: true,
        ticket: { ...ticket, status: 'used' },
        message: 'Билет отмечен как использованный'
      });
    }

    // ==================== BOOKING ====================
    if (segments[0] === 'book' && segments.length === 1 && method === 'POST') {
      // POST /api/book
      const { seats, eventId, customerName, customerEmail, customerPhone, discountCategoryId } = body;
      if (!seats || !eventId || !customerName || seats.length === 0) {
        return res.status(400).json({ success: false, message: 'Отсутствуют необходимые данные' });
      }
      const seatLabels = seats.join("','");
      const { rows: totalRows } = await sql`
        SELECT SUM(price) as total FROM seats
        WHERE seat_label IN (${sql.unsafe(seatLabels)}) AND event_id = ${parseInt(eventId)}
      `;
      const total = totalRows[0].total;
      if (!total) return res.status(404).json({ success: false, message: 'Места не найдены' });
      let finalTotal = total;
      if (discountCategoryId && discountCategoryId !== '') {
        const { rows: catRows } = await sql`SELECT discount_percent FROM discount_categories WHERE id = ${parseInt(discountCategoryId)}`;
        if (catRows.length > 0) finalTotal = total - (total * catRows[0].discount_percent / 100);
      }
      const bookingId = generateTicketId();
      await sql`
        INSERT INTO tickets (id, event_id, seat_labels, customer_name, customer_email, customer_phone, total_amount, discount_category_id, booking_time)
        VALUES (${bookingId}, ${parseInt(eventId)}, ${seats.join(',')}, ${customerName}, ${customerEmail || null}, ${customerPhone}, ${Math.round(finalTotal)}, ${discountCategoryId || null}, NOW())
      `;
      for (const seat of seats) {
        await sql`UPDATE seats SET status = 'occupied' WHERE seat_label = ${seat} AND event_id = ${parseInt(eventId)}`;
      }
      return res.status(200).json({ success: true, bookingId: bookingId, total: Math.round(finalTotal), message: 'Booking successful!' });
    }

    // ==================== PAYMENT ====================
    if (segments[0] === 'create-payment' && segments.length === 1 && method === 'POST') {
      // POST /api/create-payment
      const { eventId, seats, customer, total, discountCategoryId, paymentMethod = 'card' } = body;
      const bookingId = generateTicketId();
      const paymentId = generatePaymentId();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      await sql`
        INSERT INTO pending_bookings (payment_id, booking_id, event_id, seat_labels, customer_name, customer_email, customer_phone, total_amount, discount_category_id, payment_method, expires_at)
        VALUES (${paymentId}, ${bookingId}, ${parseInt(eventId)}, ${seats.join(',')}, ${customer.name || ''}, ${customer.email || ''}, ${customer.phone || ''}, ${total}, ${discountCategoryId || null}, ${paymentMethod}, ${expiresAt})
      `;
      return res.status(200).json({
        success: true, paymentId: paymentId, bookingId: bookingId, total: total, paymentMethod: paymentMethod,
        paymentUrl: paymentMethod === 'card' ? `https://www.tinkoff.ru/rm/r_uofdonvrKc.jQDChgrcqD/qSx3R63723?amount=${total}` : null,
        message: paymentMethod === 'cash' ? 'Оплата наличными' : 'Перейдите по ссылке для оплаты'
      });
    }
    if (segments[0] === 'confirm-payment' && segments.length === 1 && method === 'POST') {
      // POST /api/confirm-payment
      const { paymentId } = body;
      const { rows } = await sql`SELECT * FROM pending_bookings WHERE payment_id = ${paymentId} AND expires_at > NOW()`;
      if (rows.length === 0) return res.status(404).json({ error: 'Бронирование не найдено или время оплаты истекло' });
      const pb = rows[0];
      await sql`
        INSERT INTO tickets (id, event_id, seat_labels, customer_name, customer_email, customer_phone, total_amount, discount_category_id, payment_method, booking_time, status)
        VALUES (${pb.booking_id}, ${parseInt(pb.event_id)}, ${pb.seat_labels}, ${pb.customer_name}, ${pb.customer_email}, ${pb.customer_phone}, ${pb.total_amount}, ${pb.discount_category_id}, ${pb.payment_method || 'card'}, NOW(), 'active')
      `;
      const seats = pb.seat_labels.split(',');
      for (const seat of seats) {
        await sql`UPDATE seats SET status = 'occupied' WHERE seat_label = ${seat} AND event_id = ${parseInt(pb.event_id)}`;
      }
      await sql`DELETE FROM pending_bookings WHERE payment_id = ${paymentId}`;
      return res.status(200).json({ 
        success: true, 
        bookingId: pb.booking_id, 
        total: pb.total_amount,
        customerName: pb.customer_name,
        customerEmail: pb.customer_email,
        customerPhone: pb.customer_phone
      });
    }

    // ==================== ADMIN: EVENTS ====================
    if (segments[0] === 'admin' && segments[1] === 'events') {
      if (segments.length === 2 && method === 'GET') {
        // GET /api/admin/events
        const { rows } = await sql`
          SELECT e.*, (SELECT COUNT(*) FROM tickets t WHERE t.event_id = e.id) as tickets_sold,
          (SELECT SUM(t.total_amount) FROM tickets t WHERE t.event_id = e.id) as total_revenue
          FROM events e ORDER BY e.date DESC
        `;
        return res.status(200).json(rows);
      }
      if (segments.length === 2 && method === 'POST') {
        // POST /api/admin/events
        console.log('Creating event with body:', body);
        
        // Валидация входных данных
        const validationErrors = validateInput(body, {
          name: { type: 'string', required: true, maxLength: 500 },
          date: { type: 'string', required: true },
          description: { type: 'string', maxLength: 5000 },
          image_url: { type: 'string', maxLength: 1000 },
          venue: { type: 'string', required: true, maxLength: 500 },
          duration: { type: 'number', min: 30, max: 1440 }
        });
        
        if (validationErrors.length > 0) {
          return res.status(400).json({ error: validationErrors.join('; ') });
        }
        
        // Санитизация строк
        const name = sanitizeString(body.name);
        const date = sanitizeString(body.date);
        const description = body.description ? sanitizeString(body.description) : '';
        const image_url = body.image_url ? sanitizeString(body.image_url) : 'default.jpg';
        const venue = sanitizeString(body.venue);
        const duration = body.duration ? safeInteger(body.duration, 120) : null;
        
        if (!name || !date) return res.status(400).json({ error: 'Название и дата обязательны' });
        try {
          const { rows } = await sql`
            INSERT INTO events (name, date, description, image_url, venue, duration)
            VALUES (${name}, ${date}, ${description || ''}, ${image_url || 'default.jpg'}, ${venue || ''}, ${duration || null}) RETURNING id
          `;
          return res.status(200).json({ success: true, eventId: rows[0].id, message: 'Мероприятие создано' });
        } catch (error) {
          console.error('Error creating event:', error);
          return res.status(500).json({ error: error.message || 'Ошибка при создании мероприятия' });
        }
      }
      if (segments.length === 3 && method === 'PUT') {
        // PUT /api/admin/events/:id
        const { name, date, description, image_url, venue, duration } = body;
        if (!name || !date) return res.status(400).json({ error: 'Название и дата обязательны' });
        const result = await sql`
          UPDATE events SET name = ${name}, date = ${date}, description = ${description || ''}, image_url = ${image_url || 'default.jpg'}, venue = ${venue || ''}, duration = ${duration || null}
          WHERE id = ${parseInt(segments[2])}
        `;
        if (result.rowCount === 0) return res.status(404).json({ error: 'Мероприятие не найдено' });
        return res.status(200).json({ success: true, message: 'Мероприятие обновлено' });
      }
      if (segments.length === 3 && method === 'DELETE') {
        // DELETE /api/admin/events/:id
        await sql`DELETE FROM seats WHERE event_id = ${parseInt(segments[2])}`;
        const result = await sql`DELETE FROM events WHERE id = ${parseInt(segments[2])}`;
        if (result.rowCount === 0) return res.status(404).json({ error: 'Мероприятие не найдено' });
        return res.status(200).json({ success: true, message: 'Мероприятие удалено' });
      }
      if (segments.length === 5 && segments[3] === 'seats' && segments[4] === 'bulk' && method === 'POST') {
        // POST /api/admin/events/:id/seats/bulk
        const { rows, seatsPerRow, basePrice, vipRows = [] } = body;
        await sql`DELETE FROM seats WHERE event_id = ${parseInt(segments[2])}`;
        const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        let seatsCreated = 0;
        // Конвертируем vipRows в массив чисел если это не массив
        const vipRowsArray = Array.isArray(vipRows) ? vipRows : [];
        for (let i = 0; i < rows; i++) {
          const isVip = vipRowsArray.indexOf(i) !== -1;
          for (let j = 1; j <= seatsPerRow; j++) {
            const price = isVip ? basePrice * 1.5 : basePrice;
            const seatLabel = rowLetters[i] + j;
            const category = isVip ? 'vip' : 'standard';
            await sql`INSERT INTO seats (event_id, seat_label, price, category, status) VALUES (${parseInt(segments[2])}, ${seatLabel}, ${Math.round(price)}, ${category}, 'free')`;
            seatsCreated++;
          }
        }
        return res.status(200).json({ success: true, message: `Создано ${seatsCreated} мест`, seatsCreated });
      }
      if (segments.length === 4 && segments[3] === 'seats' && method === 'GET') {
        // GET /api/admin/events/:id/seats
        const { rows } = await sql`SELECT * FROM seats WHERE event_id = ${parseInt(segments[2])} ORDER BY seat_label`;
        return res.status(200).json(rows);
      }
    }

    // ==================== ADMIN: SEATS ====================
    if (segments[0] === 'admin' && segments[1] === 'seats' && segments.length === 3 && method === 'PUT') {
      // PUT /api/admin/seats/:id
      const { price, category, status } = body;
      const result = await sql`UPDATE seats SET price = ${price}, category = ${category}, status = ${status} WHERE id = ${parseInt(segments[2])}`;
      if (result.rowCount === 0) return res.status(404).json({ error: 'Место не найдено' });
      return res.status(200).json({ success: true, message: 'Место обновлено' });
    }

    // ==================== ADMIN: BOOKINGS ====================
    if (segments[0] === 'admin' && segments[1] === 'bookings') {
      // Silent Operator: проверка авторизации
      const authError = requireAdminAuth(req, res);
      if (authError) return authError;

      if (segments.length === 2 && method === 'GET') {
        // GET /api/admin/bookings
        const { rows } = await sql`
          SELECT t.*, e.name as event_name, e.date as event_date, dc.name as category_name
          FROM tickets t LEFT JOIN events e ON t.event_id = e.id
          LEFT JOIN discount_categories dc ON t.discount_category_id = dc.id ORDER BY t.booking_time DESC
        `;
        return res.status(200).json(rows.map(r => ({ ...r, payment_method: r.payment_method || 'card' })));
      }
      if (segments.length === 3 && method === 'DELETE') {
        // DELETE /api/admin/bookings/:id
        const { rows: ticketRows } = await sql`SELECT * FROM tickets WHERE id = ${segments[2]}`;
        if (ticketRows.length === 0) return res.status(404).json({ error: 'Бронирование не найдено' });
        const ticket = ticketRows[0];
        const seatLabels = ticket.seat_labels ? ticket.seat_labels.split(',') : [];
        await sql`DELETE FROM tickets WHERE id = ${segments[2]}`;
        for (const seatLabel of seatLabels) {
          await sql`UPDATE seats SET status = 'free' WHERE seat_label = ${seatLabel.trim()} AND event_id = ${ticket.event_id}`;
        }
        return res.status(200).json({ success: true, message: 'Бронирование удалено, места освобождены' });
      }
    }

    // ==================== ADMIN: DISCOUNT CATEGORIES ====================
    if (segments[0] === 'admin' && segments[1] === 'discount-categories') {
      if (segments.length === 2 && method === 'GET') {
        const { rows } = await sql`SELECT * FROM discount_categories ORDER BY name`;
        return res.status(200).json(rows);
      }
      if (segments.length === 2 && method === 'POST') {
        const { name, discount_percent, description } = body;
        if (!name || discount_percent === undefined) return res.status(400).json({ error: 'Название и скидка обязательны' });
        const { rows } = await sql`INSERT INTO discount_categories (name, discount_percent, description) VALUES (${name}, ${parseInt(discount_percent)}, ${description || ''}) RETURNING *`;
        return res.status(200).json({ success: true, categoryId: rows[0].id, message: 'Категория создана' });
      }
      if (segments.length === 3 && method === 'PUT') {
        const { name, discount_percent, description, is_active } = body;
        const result = await sql`UPDATE discount_categories SET name = ${name}, discount_percent = ${parseInt(discount_percent)}, description = ${description || ''}, is_active = ${is_active !== undefined ? is_active : true} WHERE id = ${parseInt(segments[2])}`;
        if (result.rowCount === 0) return res.status(404).json({ error: 'Категория не найдена' });
        return res.status(200).json({ success: true, message: 'Категория обновлена' });
      }
      if (segments.length === 3 && method === 'DELETE') {
        const result = await sql`DELETE FROM discount_categories WHERE id = ${parseInt(segments[2])}`;
        if (result.rowCount === 0) return res.status(404).json({ error: 'Категория не найдена' });
        return res.status(200).json({ success: true, message: 'Категория удалена' });
      }
    }

    // ==================== ADMIN: PROMOCODES ====================
    if (segments[0] === 'admin' && segments[1] === 'promocodes') {
      // Silent Operator: проверка авторизации
      const authError = requireAdminAuth(req, res);
      if (authError) return authError;

      if (segments.length === 2 && method === 'GET') {
        const { rows } = await sql`SELECT * FROM promocodes ORDER BY id DESC`;
        return res.status(200).json({ success: true, promoCodes: rows });
      }
      if (segments.length === 2 && method === 'POST') {
        const { code, discount, max_uses, expiry_date, is_active = true } = body;
        
        // Валидация
        const validationErrors = validateInput(body, {
          code: { type: 'string', required: true, maxLength: 100 },
          discount: { type: 'number', required: true, min: 1, max: 100 },
          max_uses: { type: 'number', min: 1 },
          expiry_date: { type: 'string' }
        });
        
        if (validationErrors.length > 0) {
          return res.status(400).json({ success: false, message: validationErrors.join('; ') });
        }
        
        // Санитизация
        const codeSanitized = sanitizeString(code).toUpperCase();
        const discountSanitized = safeInteger(discount, 0);
        
        if (!codeSanitized || discountSanitized < 1 || discountSanitized > 100) {
          return res.status(400).json({ success: false, message: 'Код и скидка (1-100) обязательны' });
        }
        
        const { rows } = await sql`INSERT INTO promocodes (code, discount, max_uses, expiry_date, is_active) VALUES (${codeSanitized}, ${discountSanitized}, ${max_uses ? safeInteger(max_uses, null) : null}, ${expiry_date || null}, ${is_active}) RETURNING *`;
        return res.status(200).json({ success: true, message: 'Промокод создан', promoId: rows[0].id });
      }
      if (segments.length === 3 && method === 'PUT') {
        const { discount, max_uses, expiry_date, is_active } = body;
        const result = await sql`UPDATE promocodes SET discount = ${parseInt(discount)}, max_uses = ${max_uses || null}, expiry_date = ${expiry_date || null}, is_active = ${is_active !== undefined ? is_active : true} WHERE id = ${parseInt(segments[2])}`;
        if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Промокод не найден' });
        return res.status(200).json({ success: true, message: 'Промокод обновлен' });
      }
      if (segments.length === 3 && method === 'DELETE') {
        const result = await sql`DELETE FROM promocodes WHERE id = ${parseInt(segments[2])}`;
        if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Промокод не найден' });
        return res.status(200).json({ success: true, message: 'Промокод удален' });
      }
    }

    // ==================== ADMIN: EXPORT ====================
    if (segments[0] === 'admin' && segments[1] === 'export' && segments.length === 2 && method === 'GET') {
      // Silent Operator: проверка авторизации
      const authError = requireAdminAuth(req, res);
      if (authError) return authError;

      const tables = ['events', 'seats', 'tickets', 'pending_bookings', 'promocodes', 'discount_categories', 'visitor_sessions', 'settings'];
      const exportData = { version: '1.0', exportDate: new Date().toISOString(), tables: {} };
      for (const table of tables) {
        const { rows } = await sql.query(`SELECT * FROM ${table}`);
        exportData.tables[table] = rows;
      }
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(exportData);
    }

    // ==================== ADMIN: IMPORT ====================
    if (segments[0] === 'admin' && segments[1] === 'import' && segments.length === 2 && method === 'POST') {
      const importData = body;
      if (!importData || !importData.tables) return res.status(400).json({ success: false, message: 'Неверный формат' });
      await sql`INSERT INTO settings (key, value, updated_at) VALUES ('last_backup_import', ${JSON.stringify({ backupFilename: importData.backupFilename || 'backup.json', exportDate: importData.exportDate || new Date().toISOString(), importDate: new Date().toISOString() })}, NOW()) ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify({ backupFilename: importData.backupFilename || 'backup.json', exportDate: importData.exportDate || new Date().toISOString(), importDate: new Date().toISOString() })}, updated_at = NOW()`;
      return res.status(200).json({ success: true, message: 'Данные импортированы' });
    }

    // ==================== ADMIN: TICKET TYPE ====================
    if (segments[0] === 'admin' && segments[1] === 'ticket-type' && segments.length === 2) {
      if (method === 'GET') {
        const { rows } = await sql`SELECT value FROM settings WHERE key = 'ticket_type'`;
        return res.status(200).json({ success: true, ticketType: rows.length > 0 ? rows[0].value : 'old' });
      }
      if (method === 'POST') {
        const { ticketType } = body;
        if (!ticketType || (ticketType !== 'old' && ticketType !== 'new')) return res.status(400).json({ success: false, error: 'Invalid ticket type' });
        await sql`INSERT INTO settings (key, value, updated_at) VALUES ('ticket_type', ${ticketType}, NOW()) ON CONFLICT (key) DO UPDATE SET value = ${ticketType}, updated_at = NOW()`;
        return res.status(200).json({ success: true, ticketType: ticketType, message: 'Ticket type updated' });
      }
    }

    // ==================== ADMIN: LAST BACKUP INFO ====================
    if (segments[0] === 'admin' && segments[1] === 'last-backup-info' && segments.length === 2 && method === 'GET') {
      const { rows } = await sql`SELECT value, updated_at FROM settings WHERE key = 'last_backup_import'`;
      if (rows.length > 0 && rows[0].value) {
        try {
          const backupInfo = JSON.parse(rows[0].value);
          return res.status(200).json({ success: true, backupInfo: { ...backupInfo, importDate: backupInfo.importDate || rows[0].updated_at } });
        } catch (e) {
          return res.status(200).json({ success: true, backupInfo: null });
        }
      }
      return res.status(200).json({ success: true, backupInfo: null });
    }

    // ==================== ADMIN: VISITOR STATS ====================
    if (segments[0] === 'admin' && segments[1] === 'visitor-stats' && segments[2] === 'chart' && segments.length === 3 && method === 'GET') {
      const days = parseInt(query.days) || 30;
      const { rows } = await sql`
        SELECT TO_CHAR(entry_time, 'YYYY-MM-DD') as date, COUNT(DISTINCT ip_address) as unique_visitors, COUNT(*) as total_sessions
        FROM visitor_sessions WHERE entry_time >= NOW() - INTERVAL '1 day' * ${days}
        GROUP BY TO_CHAR(entry_time, 'YYYY-MM-DD') ORDER BY date ASC
      `;
      return res.status(200).json(rows);
    }

    // ==================== ADMIN: STATS ====================
    if (segments[0] === 'admin' && segments[1] === 'stats' && segments.length === 2 && method === 'GET') {
      // Общая статистика
      const { rows: events } = await sql`SELECT COUNT(*) as count FROM events`;
      const { rows: tickets } = await sql`SELECT COUNT(*) as count FROM tickets`;
      const { rows: revenue } = await sql`SELECT SUM(total_amount) as total FROM tickets`;
      return res.status(200).json({
        totalEvents: parseInt(events[0].count),
        totalTickets: parseInt(tickets[0].count),
        totalRevenue: parseInt(revenue[0].total || 0)
      });
    }

    // ==================== ADMIN: SYSTEM INFO ====================
    if (segments[0] === 'admin' && segments[1] === 'system-info' && segments.length === 2 && method === 'GET') {
      return res.status(200).json({
        success: true,
        version: '2.0.0',
        nodeVersion: process.version,
        platform: 'vercel-serverless'
      });
    }

    // ==================== ADMIN: RESTART STATUS ====================
    if (segments[0] === 'admin' && segments[1] === 'restart-status' && segments.length === 2 && method === 'GET') {
      const { rows } = await sql`SELECT value, updated_at FROM settings WHERE key = 'last_server_restart'`;
      const { rows: backupRows } = await sql`SELECT value FROM settings WHERE key = 'backup_notification_pending'`;
      return res.status(200).json({
        success: true,
        lastRestart: rows.length > 0 ? new Date(rows[0].value).toLocaleString('ru-RU') : null,
        backupNotLoaded: !!backupRows.length,
        serverUptime: 0
      });
    }

    // ==================== PROMO (PUBLIC) ====================
    if (segments[0] === 'promo') {
      if (segments[1] === 'validate' && segments.length === 2 && method === 'POST') {
        const { code, totalAmount } = body;
        const { rows } = await sql`SELECT * FROM promocodes WHERE code = ${code.toUpperCase()} AND is_active = true AND (expiry_date IS NULL OR expiry_date > NOW()) AND (max_uses IS NULL OR used < max_uses)`;
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Промокод не найден' });
        const promo = rows[0];
        const discountAmount = Math.round(totalAmount * (promo.discount / 100));
        return res.status(200).json({ success: true, valid: true, promo: { ...promo, discountAmount, finalAmount: totalAmount - discountAmount } });
      }
      if (segments[1] === 'create' && segments.length === 2 && method === 'POST') {
        const { code, discount, max_uses, expiry_date, is_active = true } = body;
        if (!code || !discount) return res.status(400).json({ success: false, message: 'Код и скидка обязательны' });
        const { rows } = await sql`INSERT INTO promocodes (code, discount, max_uses, expiry_date, is_active) VALUES (${code.toUpperCase()}, ${parseInt(discount)}, ${max_uses || null}, ${expiry_date || null}, ${is_active}) RETURNING *`;
        return res.status(200).json({ success: true, message: 'Промокод создан', promoId: rows[0].id });
      }
      if (segments[1] === 'all' && segments.length === 2 && method === 'GET') {
        const { rows } = await sql`SELECT * FROM promocodes ORDER BY id DESC`;
        return res.status(200).json({ success: true, promoCodes: rows });
      }
      if (segments.length === 2 && method === 'PUT') {
        const { code, discount, max_uses, expiry_date, is_active } = body;
        const result = await sql`UPDATE promocodes SET code = ${code.toUpperCase()}, discount = ${parseInt(discount)}, max_uses = ${max_uses || null}, expiry_date = ${expiry_date || null}, is_active = ${is_active !== undefined ? is_active : true} WHERE id = ${parseInt(segments[1])}`;
        if (result.rowCount === 0) return res.status(404).json({ error: 'Промокод не найден' });
        return res.status(200).json({ success: true, message: 'Промокод обновлен' });
      }
      if (segments.length === 2 && method === 'DELETE') {
        const result = await sql`DELETE FROM promocodes WHERE id = ${parseInt(segments[1])}`;
        if (result.rowCount === 0) return res.status(404).json({ error: 'Промокод не найден' });
        return res.status(200).json({ success: true, message: 'Промокод удален' });
      }
      if (segments.length === 3 && segments[2] === 'use' && method === 'POST') {
        const { rows: promoRows } = await sql`SELECT * FROM promocodes WHERE id = ${parseInt(segments[1])}`;
        if (promoRows.length === 0) return res.status(404).json({ error: 'Промокод не найден' });
        const promo = promoRows[0];
        if (!promo.is_active) return res.status(400).json({ error: 'Промокод не активен' });
        if (promo.expiry_date && new Date(promo.expiry_date) < new Date()) return res.status(400).json({ error: 'Срок действия истек' });
        if (promo.max_uses !== null && promo.used >= promo.max_uses) return res.status(400).json({ error: 'Лимит исчерпан' });
        await sql`UPDATE promocodes SET used = used + 1 WHERE id = ${parseInt(segments[1])}`;
        return res.status(200).json({ success: true, message: 'Промокод использован' });
      }
    }

    // ==================== ANALYTICS ====================
    if (segments[0] === 'analytics' && segments.length === 2) {
      if (segments[1] === 'session-start' && method === 'POST') {
        const { session_id, ip_address, user_agent, device_type, browser, os, screen_width, screen_height, entry_time, pages_visited, referrer, language } = body;
        await sql`INSERT INTO visitor_sessions (session_id, ip_address, user_agent, device_type, browser, os, location, screen_width, screen_height, entry_time, pages_visited, referrer, language) VALUES (${session_id}, ${ip_address || 'unknown'}, ${user_agent}, ${device_type}, ${browser}, ${os}, 'Unknown', ${parseInt(screen_width) || null}, ${parseInt(screen_height) || null}, ${entry_time}, ${pages_visited}, ${referrer}, ${language}) ON CONFLICT (session_id) DO NOTHING`;
        return res.status(200).json({ success: true });
      }
      if (segments[1] === 'session-update' && method === 'POST') {
        const { session_id, duration, pages_visited } = body;
        await sql`UPDATE visitor_sessions SET duration = ${parseInt(duration) || null}, pages_visited = ${pages_visited} WHERE session_id = ${session_id}`;
        return res.status(200).json({ success: true });
      }
      if (segments[1] === 'session-end' && method === 'POST') {
        const { session_id, exit_time, duration, pages_visited } = body;
        await sql`UPDATE visitor_sessions SET exit_time = ${exit_time}, duration = ${parseInt(duration) || null}, pages_visited = ${pages_visited} WHERE session_id = ${session_id}`;
        return res.status(200).json({ success: true });
      }
    }

    // ==================== TICKET TYPE (PUBLIC) ====================
    if (segments[0] === 'ticket-type' && segments.length === 1 && method === 'GET') {
      const { rows } = await sql`SELECT value FROM settings WHERE key = 'ticket_type'`;
      return res.status(200).json({ success: true, ticketType: rows.length > 0 ? rows[0].value : 'old' });
    }

    // 404 для всех остальных запросов
    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error) {
    // Логируем ошибку на сервере (видна только в логах Vercel)
    console.error('API Error:', error.message);
    
    // Возвращаем общее сообщение об ошибке (без деталей)
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}
