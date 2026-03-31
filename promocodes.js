const sqlite3 = require('sqlite3');
const dbPath = process.env.DATABASE_URL || './usupovo-hall.db';
const db = new sqlite3.Database(dbPath);

const promoController = {
    createPromoCode: (req, res) => {
        const { code, discount, max_uses, expiry_date, is_active = 1 } = req.body;
        
        if (!code || !discount) {
            return res.status(400).json({ 
                success: false, 
                message: 'Код и скидка обязательны' 
            });
        }

        db.run(
            `INSERT INTO promocodes (code, discount, max_uses, expiry_date, is_active) 
             VALUES (?, ?, ?, ?, ?)`,
            [code.toUpperCase(), discount, max_uses || null, expiry_date || null, is_active],
            function(err) {
                if (err) {
                    if (err.code === 'SQLITE_CONSTRAINT') {
                        return res.status(400).json({ 
                            success: false, 
                            message: 'Промокод уже существует' 
                        });
                    }
                    console.error('❌ Error creating promo code:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Ошибка сервера' 
                    });
                }
                
                res.json({ 
                    success: true, 
                    message: 'Промокод создан',
                    promoId: this.lastID 
                });
            }
        );
    },

    validatePromoCode: (req, res) => {
        const { code, totalAmount } = req.body;
        
        if (!code) {
            return res.status(400).json({ 
                success: false, 
                message: 'Промокод обязателен' 
            });
        }

        db.get(
            `SELECT * FROM promocodes 
             WHERE code = ? AND is_active = 1 
             AND (expiry_date IS NULL OR expiry_date > datetime('now'))
             AND (max_uses IS NULL OR used < max_uses)`,
            [code.toUpperCase()],
            (err, promo) => {
                if (err) {
                    console.error('❌ Error validating promo code:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Ошибка сервера' 
                    });
                }

                if (!promo) {
                    return res.status(404).json({ 
                        success: false, 
                        message: 'Промокод не найден или недействителен' 
                    });
                }

                const discountAmount = Math.round(totalAmount * (promo.discount / 100));
                const finalAmount = totalAmount - discountAmount;

                res.json({
                    success: true,
                    valid: true,
                    promo: {
                        id: promo.id,
                        code: promo.code,
                        discount: promo.discount,
                        discountAmount: discountAmount,
                        finalAmount: finalAmount,
                        max_uses: promo.max_uses,
                        used: promo.used
                    },
                    message: `Промокод применен! Скидка: ${promo.discount}%`
                });
            }
        );
    },

    getAllPromoCodes: (req, res) => {
        db.all(
            `SELECT * FROM promocodes ORDER BY id DESC`,
            (err, promos) => {
                if (err) {
                    console.error('❌ Error fetching promo codes:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Ошибка сервера' 
                    });
                }

                res.json({ 
                    success: true, 
                    promoCodes: promos 
                });
            }
        );
    },

    updatePromoCode: (req, res) => {
        const { id } = req.params;
        const { discount, max_uses, expiry_date, is_active } = req.body;

        db.run(
            `UPDATE promocodes 
             SET discount = ?, max_uses = ?, expiry_date = ?, is_active = ?
             WHERE id = ?`,
            [discount, max_uses, expiry_date, is_active, id],
            function(err) {
                if (err) {
                    console.error('❌ Error updating promo code:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Ошибка сервера' 
                    });
                }

                if (this.changes === 0) {
                    return res.status(404).json({ 
                        success: false, 
                        message: 'Промокод не найден' 
                    });
                }

                res.json({ 
                    success: true, 
                    message: 'Промокод обновлен' 
                });
            }
        );
    },

    deletePromoCode: (req, res) => {
        const { id } = req.params;

        db.run(
            `DELETE FROM promocodes WHERE id = ?`,
            [id],
            function(err) {
                if (err) {
                    console.error('❌ Error deleting promo code:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Ошибка сервера' 
                    });
                }

                if (this.changes === 0) {
                    return res.status(404).json({ 
                        success: false, 
                        message: 'Промокод не найден' 
                    });
                }

                res.json({ 
                    success: true, 
                    message: 'Промокод удален' 
                });
            }
        );
    },

    markAsUsed: (req, res) => {
        const { id } = req.params;

        db.run(
            `UPDATE promocodes SET used = used + 1 WHERE id = ?`,
            [id],
            function(err) {
                if (err) {
                    console.error('❌ Error marking promo as used:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Ошибка сервера' 
                    });
                }

                res.json({ 
                    success: true, 
                    message: 'Промокод отмечен как использованный' 
                });
            }
        );
    }
};

module.exports = promoController;