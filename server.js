const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3');
const multer = require('multer');
const fs = require('fs');
const promoController = require('./promocodes');
const dbPath = process.env.DATABASE_URL || './usupovo-hall.db';

const app = express();
const PORT = 3000;
const serverStartTime = new Date();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Настройка multer для загрузки изображений
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'public', 'images');
        // Создаем папку если её нет
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Генерируем уникальное имя файла: timestamp + оригинальное имя
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, name + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB максимум
    },
    fileFilter: function (req, file, cb) {
        // Разрешаем только изображения
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Разрешены только изображения (jpeg, jpg, png, gif, webp)'));
        }
    }
});
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    } else {
        initializeDatabase();
    }
});

function initializeDatabase() {
    const tables = [
        `CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            date TEXT NOT NULL,
            description TEXT,
            image_url TEXT,
            venue TEXT,
            duration INTEGER
        )`,
        `CREATE TABLE IF NOT EXISTS seats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER,
            seat_label TEXT NOT NULL,
            price INTEGER NOT NULL,
            category TEXT,
            status TEXT DEFAULT 'free'
        )`,
        `CREATE TABLE IF NOT EXISTS tickets (
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
        )`,
        
        `CREATE TABLE IF NOT EXISTS pending_bookings (
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL
        )`,

        `CREATE TABLE IF NOT EXISTS promocodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL UNIQUE,
            discount INTEGER NOT NULL,
            max_uses INTEGER,
            used INTEGER DEFAULT 0,
            expiry_date DATETIME,
            is_active BOOLEAN DEFAULT 1
        )`,

        `CREATE TABLE IF NOT EXISTS discount_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            discount_percent INTEGER NOT NULL DEFAULT 0,
            description TEXT,
            is_active BOOLEAN DEFAULT 1
        )`,

        `CREATE TABLE IF NOT EXISTS visitor_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL UNIQUE,
            ip_address TEXT,
            user_agent TEXT,
            device_type TEXT,
            browser TEXT,
            os TEXT,
            location TEXT,
            screen_width INTEGER,
            screen_height INTEGER,
            entry_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            exit_time DATETIME,
            duration INTEGER,
            pages_visited TEXT,
            referrer TEXT,
            language TEXT
        )`,

        `CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    let currentIndex = 0;
    
    function createNextTable() {
        if (currentIndex >= tables.length) {
            migrateDatabase();
            // checkAndInsertSampleData(); // Removed test events
            initializeDiscountCategories();
            initializeSettings();
            return;
        }
        
        const sql = tables[currentIndex];
        db.run(sql, function(err) {
            if (err && !err.message.includes('already exists')) {
                console.error(`❌ Error creating table ${currentIndex + 1}:`, err);
                console.error('SQL:', sql);
            }
            currentIndex++;
            createNextTable();
        });
    }
    
    createNextTable();
}

function migrateDatabase() {
    // Добавляем поле payment_method в pending_bookings если его нет
    db.run(`ALTER TABLE pending_bookings ADD COLUMN payment_method TEXT DEFAULT 'card'`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('❌ Error adding payment_method to pending_bookings:', err);
        }
    });
    
    // Добавляем поле payment_method в tickets если его нет
    db.run(`ALTER TABLE tickets ADD COLUMN payment_method TEXT DEFAULT 'card'`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('❌ Error adding payment_method to tickets:', err);
        }
    });
}

function initializeSettings() {
    // Инициализируем настройки по умолчанию
    db.get("SELECT COUNT(*) as count FROM settings WHERE key = 'ticket_type'", (err, row) => {
        if (err) {
            console.error('Error checking settings:', err);
            return;
        }
        
        if (row.count === 0) {
            db.run(
                "INSERT INTO settings (key, value) VALUES ('ticket_type', 'old')",
                function(err) {
                    if (err) {
                        console.error('Error inserting default ticket type:', err);
                    } else {
                        console.log('✅ Default ticket type set to "old"');
                    }
                }
            );
        }
    });

    // Store server restart time
    db.run(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('last_server_restart', ?, datetime('now'))",
        [serverStartTime.toISOString()],
        function(err) {
            if (err) {
                console.error('Error storing server restart time:', err);
            } else {
                console.log('✅ Server restart time recorded');
            }
        }
    );

    // Check if backup was loaded
    db.get("SELECT value FROM settings WHERE key = 'last_backup_import'", (err, row) => {
        if (err) {
            console.error('Error checking backup status:', err);
            return;
        }
        
        if (!row) {
            console.log('⚠️  No backup has been imported yet');
            // Store notification flag
            db.run(
                "INSERT OR REPLACE INTO settings (key, value) VALUES ('backup_notification_pending', 'true')",
                function(err) {
                    if (err) {
                        console.error('Error setting backup notification:', err);
                    }
                }
            );
        } else {
            console.log('✅ Backup was previously imported');
            // Clear notification flag
            db.run(
                "DELETE FROM settings WHERE key = 'backup_notification_pending'",
                function(err) {
                    if (err) {
                        console.error('Error clearing backup notification:', err);
                    }
                }
            );
        }
    });
}

function initializeDiscountCategories() {
    db.get("SELECT COUNT(*) as count FROM discount_categories", (err, row) => {
        if (err) {
            console.error('Error checking discount categories:', err);
            return;
        }
        
        if (row.count === 0) {
            const categories = [
                ['Стандартный', 0, 'Полная стоимость без скидок'],
                ['Инвалид I группы', 50, 'Инвалиды I группы'],
                ['Инвалид II группы', 40, 'Инвалиды II группы'],
                ['Инвалид III группы', 30, 'Инвалиды III группы'],
                ['Пенсионер', 25, 'Пенсионеры по возрасту'],
                ['Ветеран труда', 35, 'Ветераны труда'],
                ['Студент', 20, 'Студенты очной формы обучения']
            ];
            
            let inserted = 0;
            categories.forEach(category => {
                db.run(
                    'INSERT INTO discount_categories (name, discount_percent, description) VALUES (?, ?, ?)',
                    category,
                    function(err) {
                        if (err) {
                            console.error('Error inserting category:', err);
                        } else {
                            inserted++;
                        }
                        
                    }
                );
            });
        }
    });
}

function checkAndInsertSampleData() {
    db.get("SELECT COUNT(*) as count FROM events", (err, row) => {
        if (err) {
            console.error('Error checking events:', err);
            return;
        }
        if (row.count === 0) {
            insertSampleData();
        } else {
        }
    });
}

function insertSampleData() {
    const events = [
        ['Джазовый вечер с Ансамблем "Ностальжи"', '2025-12-15 19:00:00', 'Незабываемый вечер классического джаза', 'jazz.jpg', 'Usupovo Life Hall', 120],
        ['Стендап шоу "Смех до слёз"', '2025-12-20 20:00:00', 'Топовые комики страны в одном шоу', 'comedy.jpg', 'Usupovo Life Hall', 90],
        ['Рок-фестиваль "Осенний гром"', '2025-11-30 18:00:00', 'Целый день живой музыки', 'rock.jpg', 'Usupovo Life Hall', 180]
    ];
    
    let eventsInserted = 0;
    
    events.forEach(event => {
        db.run(
            'INSERT INTO events (name, date, description, image_url, venue, duration) VALUES (?, ?, ?, ?, ?, ?)',
            event,
            function(err) {
                if (err) {
                    console.error('Error inserting event:', err);
                } else {
                    eventsInserted++;
                    createSeatsForEvent(this.lastID);
                }
                if (eventsInserted === events.length) {
                }
            }
        );
    });
}

function createSeatsForEvent(eventId) {
    
    const rows = ['A', 'B', 'C', 'D'];
    let seatsCreated = 0;
    const totalSeats = rows.length * 6;
    
    rows.forEach(row => {
        for (let i = 1; i <= 6; i++) {
            const isVip = row === 'A' || row === 'B';
            const price = isVip ? 2500 : 1500;
            const category = isVip ? 'vip' : 'standard';
            
            db.run(
                'INSERT INTO seats (event_id, seat_label, price, category) VALUES (?, ?, ?, ?)',
                [eventId, `${row}${i}`, price, category],
                function(err) {
                    if (err) {
                        console.error('Error creating seat:', err);
                    } else {
                        seatsCreated++;
                    }
                    
                    if (seatsCreated === totalSeats) {
                    }
                }
            );
        }
    });
}

// ==================== API ROUTES ====================

app.get('/api/events', (req, res) => {
    db.all('SELECT * FROM events ORDER BY date', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/seats/event/:eventId', (req, res) => {
    const eventId = req.params.eventId;
    db.all(
        'SELECT * FROM seats WHERE event_id = ? ORDER BY seat_label',
        [eventId],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

app.post('/api/book', (req, res) => {
    const { seats, eventId, customerName, customerEmail, customerPhone, discountCategoryId } = req.body; 
    if (!seats || !eventId || !customerName || seats.length === 0) {
        return res.status(400).json({ success: false, message: 'Отсутствуют необходимые данные (выбранные места, имя, ID мероприятия).' });
    }
    const placeholders = seats.map(() => '?').join(',');
    db.all(
        `SELECT SUM(price) as total FROM seats WHERE seat_label IN (${placeholders}) AND event_id = ?`,
        [...seats, eventId],
        (err, result) => {
            if (err) {
                console.error('❌ Error summing total:', err.message);
                res.status(500).json({ error: err.message });
                return;
            }
            const total = result[0].total;
            if (total === null || total === undefined) {
                 return res.status(404).json({ success: false, message: 'Не удалось найти места для расчета суммы.' });
            }
            
            let finalTotal = total;
            if (discountCategoryId && discountCategoryId !== '') {
                db.get('SELECT discount_percent FROM discount_categories WHERE id = ?', [discountCategoryId], (err, category) => {
                    if (!err && category) {
                        finalTotal = total - (total * category.discount_percent / 100);
                        completeBooking();
                    } else {
                        completeBooking();
                    }
                });
            } else {
                completeBooking();
            }
            
            function completeBooking() {
                const bookingId = 'B' + Date.now();
                db.run(
                    `INSERT INTO tickets (id, event_id, seat_labels, customer_name, customer_email, customer_phone, total_amount, discount_category_id, booking_time) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                    [
                        bookingId, 
                        eventId, 
                        seats.join(','), 
                        customerName, 
                        customerEmail || null,
                        customerPhone,
                        Math.round(finalTotal),
                        discountCategoryId || null,
                    ],
                    function(err) {
                        if (err) {
                            console.error('❌ Error inserting ticket:', err);
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        seats.forEach(seat => {
                            db.run(
                                'UPDATE seats SET status = "occupied" WHERE seat_label = ? AND event_id = ?',
                                [seat, eventId]
                            );
                        });
                        res.json({
                            success: true,
                            bookingId: bookingId,
                            total: Math.round(finalTotal),
                            message: 'Booking successful!'
                        });
                    }
                );
            }
        }
    );
});

app.get('/api/events/:eventId', (req, res) => {
    const eventId = req.params.eventId;
    db.get('SELECT * FROM events WHERE id = ?', [eventId], (err, row) => {
        if (err) {
            console.error('❌ Error fetching event:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!row) {
            res.status(404).json({ error: 'Мероприятие не найдено' });
            return;
        }
        
        res.json(row);
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

app.get('/api/ticket/:ticketId', (req, res) => {
    const ticketId = req.params.ticketId;
    
    
    db.get(`
        SELECT t.*, e.name as event_name, e.date as event_date, dc.name as category_name, dc.discount_percent
        FROM tickets t 
        LEFT JOIN events e ON t.event_id = e.id 
        LEFT JOIN discount_categories dc ON t.discount_category_id = dc.id
        WHERE t.id = ?
    `, [ticketId], (err, ticket) => {
        if (err) {
            console.error('❌ Database error:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!ticket) {
            res.status(404).json({ 
                valid: false, 
                message: 'Билет не найден' 
            });
            return;
        }
        
        
        const discountCategory = ticket.category_name && ticket.category_name !== 'Стандартный' ? {
            name: ticket.category_name,
            discount_percent: ticket.discount_percent || 0
        } : null;
        
        res.json({
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
    });
});

app.post('/api/ticket/:ticketId/use', (req, res) => {
    const ticketId = req.params.ticketId;
    
    db.run(
        'UPDATE tickets SET status = "used" WHERE id = ?',
        [ticketId],
        function(err) {
            if (err) {
                console.error('❌ Database error:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (this.changes === 0) {
                res.status(404).json({ error: 'Билет не найден' });
                return;
            }
            
            db.get(`
                SELECT t.*, e.name as event_name, e.date as event_date, dc.name as category_name, dc.discount_percent
                FROM tickets t 
                LEFT JOIN events e ON t.event_id = e.id 
                LEFT JOIN discount_categories dc ON t.discount_category_id = dc.id
                WHERE t.id = ?
            `, [ticketId], (err, ticket) => {
                if (err) {
                    console.error('❌ Error fetching updated ticket:', err);
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                if (!ticket) {
                    res.status(404).json({ error: 'Билет не найден после обновления' });
                    return;
                }
                
                const discountCategory = ticket.category_name && ticket.category_name !== 'Стандартный' ? {
                    name: ticket.category_name,
                    discount_percent: ticket.discount_percent || 0
                } : null;
                
                res.json({
                    success: true,
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
                    },
                    message: 'Билет отмечен как использованный'
                });
            });
        }
    );
});

app.get('/verify.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/verify.html'));
});

// ==================== АДМИНСКИЕ РОУТЫ ====================
app.get('/api/admin/bookings', (req, res) => {
    db.all(`
        SELECT t.*, e.name as event_name, e.date as event_date, dc.name as category_name
        FROM tickets t 
        LEFT JOIN events e ON t.event_id = e.id 
        LEFT JOIN discount_categories dc ON t.discount_category_id = dc.id
        ORDER BY t.booking_time DESC
    `, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // Добавляем способ оплаты по умолчанию для старых записей
        const rowsWithPayment = rows.map(row => ({
            ...row,
            payment_method: row.payment_method || 'card'
        }));
        res.json(rowsWithPayment);
    });
});

app.delete('/api/admin/bookings/:bookingId', (req, res) => {
    const bookingId = req.params.bookingId;
    
    db.get('SELECT * FROM tickets WHERE id = ?', [bookingId], (err, ticket) => {
        if (err) {
            console.error('❌ Error fetching ticket:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (!ticket) {
            return res.status(404).json({ error: 'Бронирование не найдено' });
        }
        
        const eventId = ticket.event_id;
        const seatLabels = ticket.seat_labels ? ticket.seat_labels.split(',') : [];
        
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            db.run('DELETE FROM tickets WHERE id = ?', [bookingId], function(err) {
                if (err) {
                    console.error('❌ Error deleting ticket:', err);
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }
                
                if (this.changes === 0) {
                    db.run('ROLLBACK');
                    return res.status(404).json({ error: 'Бронирование не найдено' });
                }
                
                let seatsUpdated = 0;
                const totalSeats = seatLabels.length;
                
                if (totalSeats === 0) {
                    db.run('COMMIT', (err) => {
                        if (err) {
                            console.error('❌ Error committing transaction:', err);
                            return res.status(500).json({ error: err.message });
                        }
                        res.json({ success: true, message: 'Бронирование удалено' });
                    });
                    return;
                }
                
                seatLabels.forEach(seatLabel => {
                    db.run(
                        'UPDATE seats SET status = "free" WHERE seat_label = ? AND event_id = ?',
                        [seatLabel.trim(), eventId],
                        function(err) {
                            if (err) {
                                console.error('❌ Error updating seat:', err);
                            } else {
                                seatsUpdated++;
                            }
                            
                            if (seatsUpdated === totalSeats) {
                                db.run('COMMIT', (err) => {
                                    if (err) {
                                        console.error('❌ Error committing transaction:', err);
                                        return res.status(500).json({ error: err.message });
                                    }
                                    res.json({ success: true, message: 'Бронирование удалено, места освобождены' });
                                });
                            }
                        }
                    );
                });
            });
        });
    });
});

app.get('/api/admin/events', (req, res) => {
    db.all(`
        SELECT e.*, 
               (SELECT COUNT(*) FROM tickets t WHERE t.event_id = e.id) as tickets_sold,
               (SELECT SUM(t.total_amount) FROM tickets t WHERE t.event_id = e.id) as total_revenue
        FROM events e 
        ORDER BY e.date DESC
    `, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/admin/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' });
    }
    
    res.json({ 
        success: true, 
        filename: req.file.filename,
        path: `/images/${req.file.filename}`
    });
});

app.post('/api/admin/events', upload.single('image'), (req, res) => {
    const { name, date, description, image_url, venue, duration } = req.body;
    
    if (!name || !date) {
        return res.status(400).json({ error: 'Название и дата обязательны' });
    }

    let finalImageUrl = 'default.jpg';
    if (req.file) {
        finalImageUrl = req.file.filename;
    } else if (image_url && image_url.trim()) {
        finalImageUrl = image_url.trim();
    }
    
    db.run(
        'INSERT INTO events (name, date, description, image_url, venue, duration) VALUES (?, ?, ?, ?, ?, ?)',
        [name, date, description, finalImageUrl, venue, duration],
        function(err) {
            if (err) {
                console.error('❌ Error creating event:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            
            const eventId = this.lastID;
            createSeatsForEvent(eventId); 
            
            res.json({ 
                success: true, 
                eventId: eventId,
                message: 'Мероприятие создано' 
            });
        }
    );
});

app.put('/api/admin/events/:eventId', upload.single('image'), (req, res) => {
    const eventId = req.params.eventId;
    const { name, date, description, image_url, venue, duration } = req.body;
    
    if (!name || !date) {
        return res.status(400).json({ error: 'Название и дата обязательны' });
    }

    let finalImageUrl = 'default.jpg';
    if (req.file) {
        finalImageUrl = req.file.filename;
    } else if (image_url && image_url.trim()) {
        finalImageUrl = image_url.trim();
    }
    
    db.run(
        'UPDATE events SET name = ?, date = ?, description = ?, image_url = ?, venue = ?, duration = ? WHERE id = ?',
        [name, date, description, finalImageUrl, venue, duration, eventId],
        function(err) {
            if (err) {
                console.error('❌ Error updating event:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (this.changes === 0) {
                res.status(404).json({ error: 'Мероприятие не найдено' });
                return;
            }
            
            res.json({ 
                success: true, 
                message: 'Мероприятие обновлено' 
            });
        }
    );
});

app.delete('/api/admin/events/:eventId', (req, res) => {
    const eventId = req.params.eventId;
    
    db.run('DELETE FROM events WHERE id = ?', [eventId], function(err) {
        if (err) {
            console.error('❌ Error deleting event:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Мероприятие не найдено' });
            return;
        }
        db.run('DELETE FROM seats WHERE event_id = ?', [eventId]);
        res.json({ 
            success: true, 
            message: 'Мероприятие удалено' 
        });
    });
});

app.get('/api/admin/stats', (req, res) => {
    db.get(`
        SELECT 
            (SELECT COUNT(*) FROM tickets) as total_bookings,
            (SELECT SUM(total_amount) FROM tickets) as total_revenue,
            (SELECT COUNT(*) FROM events) as total_events,
            (SELECT COUNT(*) FROM tickets WHERE status = 'used') as used_tickets
    `, (err, stats) => {
        if (err) {
            console.error('❌ Error getting stats:', err);
            res.status(500).json({ error: err.message });
            return;
        }

        res.json(stats || {});
    });
});

app.get('/api/admin/system-info', (req, res) => {
    const uptimeSeconds = Math.floor((Date.now() - serverStartTime.getTime()) / 1000);
    res.json({
        server_start_time: serverStartTime.toISOString(),
        uptime_seconds: uptimeSeconds
    });
});

app.get('/admin.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.js'));
});

app.get('/api/admin/events/:eventId/seats', (req, res) => {
    const eventId = req.params.eventId;
    
    db.all(`
        SELECT * FROM seats 
        WHERE event_id = ? 
        ORDER BY seat_label
    `, [eventId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.put('/api/admin/seats/:seatId', (req, res) => {
    const seatId = req.params.seatId;
    const { price, category, status } = req.body;
    
    db.run(
        'UPDATE seats SET price = ?, category = ?, status = ? WHERE id = ?',
        [price, category, status, seatId],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (this.changes === 0) {
                res.status(404).json({ error: 'Место не найдено' });
                return;
            }
            
            res.json({ 
                success: true, 
                message: 'Место обновлено' 
            });
        }
    );
});

// ==================== ПЛАТЕЖНЫЕ РОУТЫ ====================
app.post('/api/create-payment', (req, res) => {
    const { eventId, seats, customer, total, discountCategoryId, paymentMethod = 'card' } = req.body;
    
    if (!seats || seats.length === 0) {
        return res.status(400).json({ error: 'No seats selected' });
    }

    const bookingId = 'B' + Date.now();
    const paymentId = 'P' + Date.now();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    
    db.run(
        `INSERT INTO pending_bookings 
         (payment_id, booking_id, event_id, seat_labels, customer_name, customer_email, customer_phone, total_amount, discount_category_id, payment_method, expires_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            paymentId, 
            bookingId, 
            eventId, 
            seats.join(','), 
            customer.name || 'Не указано',
            customer.email || 'Не указано',
            customer.phone || 'Не указано',
            total, 
            discountCategoryId || null,
            paymentMethod,
            expiresAt
        ],
        function(err) {
            if (err) {
                console.error('❌ Error creating pending booking:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({
                success: true,
                paymentId: paymentId,
                bookingId: bookingId,
                total: total,
                paymentMethod: paymentMethod,
                paymentUrl: paymentMethod === 'card' ? `https://www.tinkoff.ru/rm/r_uofdonvrKc.jQDChgrcqD/qSx3R63723?amount=${total}` : null,
                message: paymentMethod === 'cash' ? 'Оплата наличными' : 'Перейдите по ссылке для оплаты'
            });
        }
    );
});

app.post('/api/confirm-payment', (req, res) => {
    const { paymentId } = req.body;
    db.get(
        `SELECT * FROM pending_bookings 
         WHERE payment_id = ? AND datetime(expires_at) > datetime('now')`,
        [paymentId],
        (err, pendingBooking) => {
            if (err) {
                console.error('❌ Database error:', err);
                return res.status(500).json({ error: err.message });
            }
            
            if (!pendingBooking) {
                return res.status(404).json({ 
                    error: 'Бронирование не найдено или время оплаты истекло' 
                });
            }

            const { booking_id, event_id, seat_labels, customer_name, customer_email, customer_phone, total_amount, discount_category_id, payment_method } = pendingBooking;
            db.run(
                `INSERT INTO tickets (id, event_id, seat_labels, customer_name, customer_email, customer_phone, total_amount, discount_category_id, payment_method, booking_time, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 'active')`,
                [booking_id, event_id, seat_labels, customer_name, customer_email, customer_phone, total_amount, discount_category_id, payment_method || 'card'],
                function(err) {
                    if (err) {
                        console.error('❌ Error creating ticket:', err);
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    const seats = seat_labels.split(',');
                    seats.forEach(seat => {
                        db.run(
                            'UPDATE seats SET status = "occupied" WHERE seat_label = ? AND event_id = ?',
                            [seat, event_id]
                        );
                    });
                    db.run('DELETE FROM pending_bookings WHERE payment_id = ?', [paymentId]);
                    res.json({
                        success: true,
                        bookingId: booking_id,
                        total: total_amount,
                        customerName: customer_name,
                        customerEmail: customer_email,
                        customerPhone: customer_phone,
                        discountCategoryId: discount_category_id
                    });
                }
            );
        }
    );
});

app.post('/api/admin/events/:eventId/seats/bulk', (req, res) => {
    const eventId = req.params.eventId;
    const { rows, seatsPerRow, basePrice, vipRows } = req.body;
    db.run('DELETE FROM seats WHERE event_id = ?', [eventId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        let seatsCreated = 0;
        const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        
        for (let i = 0; i < rows; i++) {
            const row = rowLetters[i];
            const isVip = vipRows.includes(i);
            
            for (let j = 1; j <= seatsPerRow; j++) {
                const price = isVip ? basePrice * 1.5 : basePrice;
                const category = isVip ? 'vip' : 'standard';
                
                db.run(
                    'INSERT INTO seats (event_id, seat_label, price, category, status) VALUES (?, ?, ?, ?, ?)',
                    [eventId, `${row}${j}`, Math.round(price), category, 'free'],
                    function(err) {
                        if (err) {
                            console.error('Error creating seat:', err);
                        } else {
                            seatsCreated++;
                        }
                    }
                );
            }
        }
        setTimeout(() => {
            res.json({ 
                success: true, 
                message: `Создано ${seatsCreated} мест`,
                seatsCreated: seatsCreated
            });
        }, 500);
    });
});

// ==================== ПРОМОКОДЫ API ====================
app.post('/api/promo/create', promoController.createPromoCode);
app.post('/api/promo/validate', promoController.validatePromoCode);
app.get('/api/promo/all', promoController.getAllPromoCodes);
app.put('/api/promo/:id', promoController.updatePromoCode);
app.delete('/api/promo/:id', promoController.deletePromoCode);
app.post('/api/promo/:id/use', promoController.markAsUsed);

// ==================== ЛЬГОТНЫЕ КАТЕГОРИИ API ====================

app.get('/api/discount-categories', (req, res) => {
    db.all('SELECT * FROM discount_categories WHERE is_active = 1 ORDER BY name', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/admin/discount-categories', (req, res) => {
    db.all('SELECT * FROM discount_categories ORDER BY name', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/admin/discount-categories', (req, res) => {
    const { name, discount_percent, description } = req.body;
    
    if (!name || discount_percent === undefined) {
        return res.status(400).json({ error: 'Название и скидка обязательны' });
    }
    
    db.run(
        'INSERT INTO discount_categories (name, discount_percent, description) VALUES (?, ?, ?)',
        [name, discount_percent, description || ''],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({ 
                success: true, 
                categoryId: this.lastID,
                message: 'Категория создана' 
            });
        }
    );
});

app.put('/api/admin/discount-categories/:id', (req, res) => {
    const categoryId = req.params.id;
    const { name, discount_percent, description, is_active } = req.body;
    
    db.run(
        'UPDATE discount_categories SET name = ?, discount_percent = ?, description = ?, is_active = ? WHERE id = ?',
        [name, discount_percent, description, is_active, categoryId],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (this.changes === 0) {
                res.status(404).json({ error: 'Категория не найдена' });
                return;
            }
            
            res.json({ success: true, message: 'Категория обновлена' });
        }
    );
});

app.delete('/api/admin/discount-categories/:id', (req, res) => {
    const categoryId = req.params.id;
    
    db.run('DELETE FROM discount_categories WHERE id = ?', [categoryId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Категория не найдена' });
            return;
        }
        
        res.json({ success: true, message: 'Категория удалена' });
    });
});

// ==================== АНАЛИТИКА И СТАТИСТИКА ====================

function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           'unknown';
}

app.post('/api/analytics/session-start', (req, res) => {
    const {
        session_id,
        user_agent,
        device_type,
        browser,
        os,
        screen_width,
        screen_height,
        language,
        referrer,
        pages_visited,
        entry_time
    } = req.body;
    
    const ip_address = getClientIP(req);
    
    let location = 'Unknown';
    if (ip_address && ip_address !== 'unknown' && ip_address !== '::1' && !ip_address.startsWith('127.')) {
        location = 'Определяется...';
    } else {
        location = 'Локальный';
    }
    
    db.run(
        `INSERT OR IGNORE INTO visitor_sessions 
         (session_id, ip_address, user_agent, device_type, browser, os, location, 
          screen_width, screen_height, entry_time, pages_visited, referrer, language)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [session_id, ip_address, user_agent, device_type, browser, os, location,
         screen_width, screen_height, entry_time, pages_visited, referrer, language],
        function(err) {
            if (err) {
                console.error('❌ Error tracking session start:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true });
        }
    );
});

app.post('/api/analytics/session-update', (req, res) => {
    const { session_id, duration, pages_visited } = req.body;
    
    db.run(
        `UPDATE visitor_sessions 
         SET duration = ?, pages_visited = ?
         WHERE session_id = ?`,
        [duration, pages_visited, session_id],
        function(err) {
            if (err) {
                console.error('❌ Error updating session:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true });
        }
    );
});

app.post('/api/analytics/session-end', express.raw({ type: 'application/json', limit: '10mb' }), (req, res) => {
    let body;
    try {
        if (Buffer.isBuffer(req.body)) {
            body = JSON.parse(req.body.toString('utf8'));
        } else if (typeof req.body === 'string') {
            body = JSON.parse(req.body);
        } else {
            body = req.body;
        }
    } catch (e) {
        console.error('❌ Error parsing session-end data:', e);
        return res.status(400).json({ error: 'Invalid JSON' });
    }
    
    const { session_id, exit_time, duration, pages_visited } = body;
    
    db.run(
        `UPDATE visitor_sessions 
         SET exit_time = ?, duration = ?, pages_visited = ?
         WHERE session_id = ?`,
        [exit_time, duration, pages_visited, session_id],
        function(err) {
            if (err) {
                console.error('❌ Error tracking session end:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true });
        }
    );
});

app.get('/api/admin/visitor-stats/chart', (req, res) => {
    const { days = 30 } = req.query;
    
    db.all(`
        SELECT 
            strftime('%Y-%m-%d', entry_time) as date,
            COUNT(DISTINCT ip_address) as unique_visitors,
            COUNT(*) as total_sessions
        FROM visitor_sessions
        WHERE entry_time >= datetime('now', '-' || ? || ' days')
        GROUP BY strftime('%Y-%m-%d', entry_time)
        ORDER BY date ASC
    `, [days], (err, data) => {
        if (err) {
            console.error('❌ Error fetching chart data:', err);
            return res.status(500).json({ error: err.message });
        }
        
        res.json(data);
    });
});

app.get('/api/admin/ticket-type', (req, res) => {
    db.get("SELECT value FROM settings WHERE key = 'ticket_type'", (err, row) => {
        if (err) {
            console.error('❌ Error getting ticket type:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ 
            success: true, 
            ticketType: row ? row.value : 'old' 
        });
    });
});

app.post('/api/admin/ticket-type', (req, res) => {
    const { ticketType } = req.body;
    
    if (!ticketType || (ticketType !== 'old' && ticketType !== 'new')) {
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid ticket type. Must be "old" or "new"' 
        });
    }
    
    db.run(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('ticket_type', ?, datetime('now'))",
        [ticketType],
        function(err) {
            if (err) {
                console.error('❌ Error updating ticket type:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ 
                success: true, 
                ticketType: ticketType,
                message: 'Ticket type updated successfully' 
            });
        }
    );
});

app.get('/api/ticket-type', (req, res) => {
    db.get("SELECT value FROM settings WHERE key = 'ticket_type'", (err, row) => {
        if (err) {
            console.error('❌ Error getting ticket type:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ 
            success: true, 
            ticketType: row ? row.value : 'old' 
        });
    });
});

app.get('/api/admin/restart-status', (req, res) => {
    db.get("SELECT value, updated_at FROM settings WHERE key = 'last_server_restart'", (err, restartRow) => {
        if (err) {
            console.error('❌ Error getting restart status:', err);
            return res.status(500).json({ error: err.message });
        }
        
        db.get("SELECT value FROM settings WHERE key = 'backup_notification_pending'", (err, backupRow) => {
            if (err) {
                console.error('❌ Error getting backup notification:', err);
                return res.status(500).json({ error: err.message });
            }
            
            res.json({
                success: true,
                lastRestart: restartRow ? new Date(restartRow.value).toLocaleString('ru-RU') : null,
                backupNotLoaded: !!backupRow,
                serverUptime: Math.floor((new Date() - serverStartTime) / 1000) // uptime in seconds
            });
        });
    });
});

app.get('/api/admin/last-backup-info', (req, res) => {
    db.get("SELECT value, updated_at FROM settings WHERE key = 'last_backup_import'", (err, row) => {
        if (err) {
            console.error('❌ Error getting last backup info:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (row && row.value) {
            try {
                const backupInfo = JSON.parse(row.value);
                res.json({
                    success: true,
                    backupInfo: {
                        ...backupInfo,
                        importDate: backupInfo.importDate || row.updated_at
                    }
                });
            } catch (e) {
                res.json({
                    success: true,
                    backupInfo: null
                });
            }
        } else {
            res.json({
                success: true,
                backupInfo: null
            });
        }
    });
});

// ==================== ЭКСПОРТ/ИМПОРТ ДАННЫХ ====================

app.get('/api/admin/export', (req, res) => {
    const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        tables: {}
    };
    
    const tables = [
        'events',
        'seats',
        'tickets',
        'pending_bookings',
        'promocodes',
        'discount_categories',
        'visitor_sessions',
        'settings'
    ];
    
    let completed = 0;
    const total = tables.length;
    
    tables.forEach(tableName => {
        db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
            if (err) {
                console.error(`❌ Ошибка экспорта таблицы ${tableName}:`, err);
                exportData.tables[tableName] = [];
            } else {
                exportData.tables[tableName] = rows || [];
            }
            
            completed++;
            if (completed === total) {
                const filename = `usupovo-hall-backup-${new Date().toISOString().split('T')[0]}.json`;
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.json(exportData);
            }
        });
    });
});

app.post('/api/admin/import', (req, res) => {
    const importData = req.body;
    
    if (!importData || !importData.tables) {
        return res.status(400).json({ 
            success: false, 
            message: 'Неверный формат данных для импорта' 
        });
    }
    
    const idMapping = {
        events: {},
        seats: {},
        promocodes: {},
        discount_categories: {},
        visitor_sessions: {}
    };
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        const errors = [];
        
        // Импортируем events (нужно для связей)
        const eventsData = importData.tables.events || [];
        let eventsCompleted = 0;
        
        if (eventsData.length === 0) {
            importNextTable();
        } else {
            db.run('DELETE FROM events', (err) => {
                if (err) {
                    errors.push(`Ошибка очистки events: ${err.message}`);
                    return finishImport();
                }
                
                eventsData.forEach((row) => {
                    const oldId = row.id;
                    const columns = Object.keys(row).filter(col => col !== 'id');
                    const values = columns.map(col => row[col]);
                    const placeholders = columns.map(() => '?').join(', ');
                    const columnNames = columns.join(', ');
                    
                    db.run(
                        `INSERT INTO events (${columnNames}) VALUES (${placeholders})`,
                        values,
                        function(err) {
                            if (err) {
                                errors.push(`Ошибка вставки в events: ${err.message}`);
                            } else {
                                idMapping.events[oldId] = this.lastID;
                            }
                            
                            eventsCompleted++;
                            if (eventsCompleted === eventsData.length) {
                                importNextTable();
                            }
                        }
                    );
                });
            });
        }
        
        function importNextTable() {
            // Импортируем discount_categories (нужно для связей)
            const categoriesData = importData.tables.discount_categories || [];
            let categoriesCompleted = 0;
            
            if (categoriesData.length === 0) {
                importSeats();
            } else {
                db.run('DELETE FROM discount_categories', (err) => {
                    if (err) {
                        errors.push(`Ошибка очистки discount_categories: ${err.message}`);
                        return importSeats();
                    }
                    
                    categoriesData.forEach((row) => {
                        const oldId = row.id;
                        const columns = Object.keys(row).filter(col => col !== 'id');
                        const values = columns.map(col => row[col]);
                        const placeholders = columns.map(() => '?').join(', ');
                        const columnNames = columns.join(', ');
                        
                        db.run(
                            `INSERT INTO discount_categories (${columnNames}) VALUES (${placeholders})`,
                            values,
                            function(err) {
                                if (err) {
                                    errors.push(`Ошибка вставки в discount_categories: ${err.message}`);
                                } else {
                                    idMapping.discount_categories[oldId] = this.lastID;
                                }
                                
                                categoriesCompleted++;
                                if (categoriesCompleted === categoriesData.length) {
                                    importSeats();
                                }
                            }
                        );
                    });
                });
            }
        }
        
        function importSeats() {
            // Импортируем seats (с обновлением event_id)
            const seatsData = importData.tables.seats || [];
            let seatsCompleted = 0;
            
            if (seatsData.length === 0) {
                importRemainingTables();
            } else {
                db.run('DELETE FROM seats', (err) => {
                    if (err) {
                        errors.push(`Ошибка очистки seats: ${err.message}`);
                        return importRemainingTables();
                    }
                    
                    seatsData.forEach((row) => {
                        const oldId = row.id;
                        const oldEventId = row.event_id;
                        const newEventId = idMapping.events[oldEventId] || oldEventId;
                        
                        const columns = Object.keys(row).filter(col => col !== 'id');
                        const values = columns.map(col => {
                            if (col === 'event_id') {
                                return newEventId;
                            }
                            return row[col];
                        });
                        const placeholders = columns.map(() => '?').join(', ');
                        const columnNames = columns.join(', ');
                        
                        db.run(
                            `INSERT INTO seats (${columnNames}) VALUES (${placeholders})`,
                            values,
                            function(err) {
                                if (err) {
                                    errors.push(`Ошибка вставки в seats: ${err.message}`);
                                } else {
                                    idMapping.seats[oldId] = this.lastID;
                                }
                                
                                seatsCompleted++;
                                if (seatsCompleted === seatsData.length) {
                                    importRemainingTables();
                                }
                            }
                        );
                    });
                });
            }
        }
        
        function importRemainingTables() {
            // Импортируем остальные таблицы
            const remainingTables = [
                { name: 'tickets', hasAutoIncrement: false },
                { name: 'pending_bookings', hasAutoIncrement: false },
                { name: 'promocodes', hasAutoIncrement: true },
                { name: 'visitor_sessions', hasAutoIncrement: true },
                { name: 'settings', hasAutoIncrement: false }
            ];
            
            let tablesCompleted = 0;
            
            remainingTables.forEach(({ name, hasAutoIncrement }) => {
                const tableData = importData.tables[name] || [];
                
                if (tableData.length === 0) {
                    tablesCompleted++;
                    if (tablesCompleted === remainingTables.length) {
                        finishImport();
                    }
                    return;
                }
                
                db.run(`DELETE FROM ${name}`, (err) => {
                    if (err) {
                        errors.push(`Ошибка очистки ${name}: ${err.message}`);
                        tablesCompleted++;
                        if (tablesCompleted === remainingTables.length) {
                            finishImport();
                        }
                        return;
                    }
                    
                    let inserted = 0;
                    let failed = 0;
                    const totalRows = tableData.length;
                    
                    if (totalRows === 0) {
                        tablesCompleted++;
                        if (tablesCompleted === remainingTables.length) {
                            finishImport();
                        }
                        return;
                    }
                    
                    tableData.forEach((row) => {
                        let columns = Object.keys(row);
                        let values = columns.map(col => {
                            if (name === 'tickets' && col === 'event_id') {
                                return idMapping.events[row[col]] || row[col];
                            }
                            if (name === 'pending_bookings' && col === 'event_id') {
                                return idMapping.events[row[col]] || row[col];
                            }
                            if ((name === 'tickets' || name === 'pending_bookings') && col === 'discount_category_id' && row[col]) {
                                return idMapping.discount_categories[row[col]] || row[col];
                            }
                            return row[col];
                        });
                        
                        if (hasAutoIncrement) {
                            const idIndex = columns.indexOf('id');
                            if (idIndex !== -1) {
                                columns = columns.filter((_, i) => i !== idIndex);
                                values = values.filter((_, i) => i !== idIndex);
                            }
                        }
                        
                        const placeholders = columns.map(() => '?').join(', ');
                        const columnNames = columns.join(', ');
                        
                        db.run(
                            `INSERT INTO ${name} (${columnNames}) VALUES (${placeholders})`,
                            values,
                            function(err) {
                                if (err) {
                                    errors.push(`Ошибка вставки в ${name}: ${err.message}`);
                                    failed++;
                                } else {
                                    inserted++;
                                }
                                
                                if (inserted + failed === totalRows) {
                                    tablesCompleted++;
                                    if (tablesCompleted === remainingTables.length) {
                                        finishImport();
                                    }
                                }
                            }
                        );
                    });
                    
                    if (totalRows === 0) {
                        tablesCompleted++;
                        if (tablesCompleted === remainingTables.length) {
                            finishImport();
                        }
                    }
                });
            });
        }
        
        function finishImport() {
            if (errors.length > 0) {
                db.run('ROLLBACK', () => {
                    res.status(500).json({
                        success: false,
                        message: 'Ошибки при импорте',
                        errors: errors.slice(0, 10) // Показываем первые 10 ошибок
                    });
                });
            } else {
                db.run('COMMIT', (err) => {
                    if (err) {
                        console.error('❌ Ошибка коммита транзакции:', err);
                        res.status(500).json({
                            success: false,
                            message: 'Ошибка сохранения данных: ' + err.message
                        });
                    } else {
                        const backupInfo = {
                            filename: importData.backupFilename || 'Неизвестно',
                            importDate: new Date().toISOString(),
                            exportDate: importData.exportDate || null
                        };
                        
                        db.run(
                            `INSERT OR REPLACE INTO settings (key, value, updated_at) 
                             VALUES ('last_backup_import', ?, datetime('now'))`,
                            [JSON.stringify(backupInfo)],
                            (err) => {
                                if (err) {
                                    console.error('❌ Ошибка сохранения информации о бэкапе:', err);
                                }
                            }
                        );
                        
                        res.json({
                            success: true,
                            message: 'Данные успешно импортированы'
                        });
                    }
                });
            }
        }
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log('🎭 Usupovo Life Hall Server running!');
    console.log(`📍 Локально: http://localhost:${PORT}`);
});