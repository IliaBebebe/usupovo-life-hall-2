const API_BASE = '/api';
console.log('🎯 admin_new.js initialized');

class AdminPanel {
    constructor() {
        console.log('🔄 AdminPanel constructor called');
        try {
            this.visitorChart = null;
            this.isSubmitting = false;
            this.init();
            console.log('✅ AdminPanel initialized successfully');
        } catch (error) {
            console.error('❌ AdminPanel initialization error:', error);
        }
    }

    init() {
        console.log('🔄 init method called');
        this.updateTime();
        this.timeInterval = setInterval(() => this.updateTime(), 1000);
        this.registerServiceWorker();
        this.setupEventListeners();
        this.loadDashboard();
        this.loadEventsForSelect();
        console.log('✅ All init methods completed');
    }

    destroy() {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
            this.timeInterval = null;
        }
    }

    updateTime() {
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleString('ru-RU');
        }
    }

    setupEventListeners() {
        // Create event form
        const createEventForm = document.getElementById('createEventForm');
        if (createEventForm) {
            createEventForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.isSubmitting) {
                    console.log('⚠️ Already submitting event');
                    return;
                }
                this.createEvent();
            });

            // Image preview
            const eventImageFile = document.getElementById('eventImageFile');
            if (eventImageFile) {
                eventImageFile.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const preview = document.getElementById('eventImagePreview');
                            const previewImg = document.getElementById('eventImagePreviewImg');
                            if (preview && previewImg) {
                                previewImg.src = e.target.result;
                                preview.style.display = 'block';
                            }
                        };
                        reader.readAsDataURL(file);
                    } else {
                        const preview = document.getElementById('eventImagePreview');
                        if (preview) preview.style.display = 'none';
                    }
                });
            }
        }

        // Bulk seats form
        const createSeatsForm = document.getElementById('createSeatsForm');
        if (createSeatsForm) {
            createSeatsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createBulkSeats();
            });
        }

        // Event select for seats
        const eventSelect = document.getElementById('eventSelect');
        if (eventSelect) {
            eventSelect.addEventListener('change', (e) => {
                this.loadEventSeats(e.target.value);
            });
        }

        // Search bookings
        const searchBookings = document.getElementById('searchBookings');
        if (searchBookings) {
            searchBookings.addEventListener('input', (e) => {
                this.searchBookings(e.target.value);
            });
        }

        // Filter events
        const filterEvents = document.getElementById('filterEvents');
        if (filterEvents) {
            filterEvents.addEventListener('change', (e) => {
                this.filterEvents(e.target.value);
            });
        }

        // Promo codes
        const createPromoButton = document.getElementById('createPromoButton');
        if (createPromoButton) {
            createPromoButton.addEventListener('click', () => {
                this.createPromoCode();
            });
        }

        const createPromoForm = document.getElementById('createPromoForm');
        if (createPromoForm) {
            createPromoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createPromoCode();
            });
        }

        // Discount categories
        const createCategoryButton = document.getElementById('createCategoryButton');
        if (createCategoryButton) {
            createCategoryButton.addEventListener('click', () => {
                this.createDiscountCategory();
            });
        }

        const createDiscountCategoryForm = document.getElementById('createDiscountCategoryForm');
        if (createDiscountCategoryForm) {
            createDiscountCategoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createDiscountCategory();
            });
        }

        // Delegated events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-promo-btn')) {
                const promoId = e.target.getAttribute('data-id');
                this.editPromoCode(promoId);
            }
            if (e.target.classList.contains('delete-promo-btn')) {
                const promoId = e.target.getAttribute('data-id');
                this.deletePromoCode(promoId);
            }
            if (e.target.classList.contains('edit-category-btn')) {
                const categoryId = e.target.getAttribute('data-id');
                this.editDiscountCategory(categoryId);
            }
            if (e.target.classList.contains('delete-category-btn')) {
                const categoryId = e.target.getAttribute('data-id');
                this.deleteDiscountCategory(categoryId);
            }
            if (e.target.classList.contains('delete-event-btn')) {
                const eventId = e.target.getAttribute('data-id');
                this.deleteEvent(eventId);
            }
            if (e.target.classList.contains('edit-event-btn')) {
                const eventId = e.target.getAttribute('data-id');
                this.editEvent(eventId);
            }
            if (e.target.classList.contains('view-event-btn')) {
                const eventId = e.target.getAttribute('data-id');
                this.viewEventDetails(eventId);
            }
            if (e.target.classList.contains('view-booking-btn')) {
                const bookingId = e.target.getAttribute('data-id');
                this.viewBookingDetails(bookingId);
            }
            if (e.target.classList.contains('cancel-booking-btn')) {
                const bookingId = e.target.getAttribute('data-id');
                this.cancelBooking(bookingId);
            }
        });
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('✅ Service Worker registered', reg))
                .catch(err => console.error('❌ Service Worker registration failed', err));
        }
    }

    // ==================== API METHODS ====================

    async apiRequest(endpoint, options = {}) {
        try {
            console.log(`📡 API Request: ${endpoint}`, options);

            const adminPassword = sessionStorage.getItem('adminPassword');

            const headers = {
                'Content-Type': 'application/json',
                ...options.headers,
            };

            if (endpoint.includes('/api/admin/') && adminPassword) {
                const encodedPassword = btoa(unescape(encodeURIComponent(adminPassword)));
                headers['Authorization'] = `Bearer ${encodedPassword}`;
            }

            const response = await fetch(endpoint, {
                headers: headers,
                ...options,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ API Response from ${endpoint}:`, data);
            return data;
        } catch (error) {
            console.error(`❌ API error for ${endpoint}:`, error);
            throw error;
        }
    }

    // ==================== HELPER METHODS ====================

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeCSV(value) {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }

    showSuccess(message) {
        if (window.toastManager) {
            window.toastManager.success(message);
        } else {
            console.log('✅', message);
            alert('✅ ' + message);
        }
    }

    showError(message) {
        if (window.toastManager) {
            window.toastManager.error(message);
        } else {
            console.error('❌', message);
            alert('❌ ' + message);
        }
    }

    getCategoryName(category) {
        const names = {
            'standard': 'Стандарт',
            'vip': 'VIP',
            'premium': 'Премиум'
        };
        return names[category] || category;
    }

    getStatusName(status) {
        const names = {
            'free': 'Свободно',
            'occupied': 'Занято',
            'blocked': 'Заблокировано'
        };
        return names[status] || status;
    }

    getBookingStatusName(status) {
        const names = {
            'pending': 'Ожидает',
            'confirmed': 'Подтверждено',
            'used': 'Использован',
            'cancelled': 'Отменено'
        };
        return names[status] || status;
    }

    // ==================== DASHBOARD ====================

    async loadDashboard() {
        try {
            const [stats, bookings, events] = await Promise.all([
                this.apiRequest('/api/admin/stats').catch(() => ({})),
                this.apiRequest('/api/admin/bookings').catch(() => []),
                this.apiRequest('/api/admin/events').catch(() => [])
            ]);

            this.renderStats(stats || {});
            this.renderRecentBookings(Array.isArray(bookings) ? bookings.slice(0, 5) : []);
            this.renderUpcomingEvents(Array.isArray(events) ? events.filter(e => new Date(e.date) > new Date()).slice(0, 3) : []);
            this.loadVisitorChart(30);
        } catch (error) {
            console.error('Dashboard load error:', error);
            this.showError('Ошибка загрузки дашборда');
            const statsGrid = document.getElementById('statsGrid');
            if (statsGrid) {
                statsGrid.innerHTML = '<div class="error-message">Данные временно недоступны</div>';
            }
        }
    }

    renderStats(stats) {
        const container = document.getElementById('statsGrid');
        if (!container) return;

        const statsHtml = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${stats.totalBookings || 0}</div>
                    <div class="stat-label">Всего бронирований</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${(stats.totalRevenue || 0).toLocaleString('ru-RU')} ₽</div>
                    <div class="stat-label">Общий доход</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.totalEvents || 0}</div>
                    <div class="stat-label">Мероприятий</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.usedTickets || 0}</div>
                    <div class="stat-label">Использовано билетов</div>
                </div>
            </div>
        `;
        container.innerHTML = statsHtml;
    }

    renderRecentBookings(bookings) {
        const container = document.getElementById('recentBookings');
        if (!container) return;

        if (!bookings || bookings.length === 0) {
            container.innerHTML = '<div class="no-data">Бронирований пока нет</div>';
            return;
        }

        const html = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Гость</th>
                        <th>Мероприятие</th>
                        <th>Места</th>
                        <th>Сумма</th>
                        <th>Статус</th>
                    </tr>
                </thead>
                <tbody>
                    ${bookings.map(b => `
                        <tr>
                            <td>#${b.id}</td>
                            <td>${this.escapeHtml(b.customer_name || 'Не указано')}</td>
                            <td>${this.escapeHtml(b.event_name || 'Не указано')}</td>
                            <td>${b.seats_count || 0}</td>
                            <td>${(b.total_price || 0).toLocaleString('ru-RU')} ₽</td>
                            <td><span class="status-badge status-${b.status || 'pending'}">${this.getBookingStatusName(b.status)}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        container.innerHTML = html;
    }

    renderUpcomingEvents(events) {
        const container = document.getElementById('upcomingEvents');
        if (!container) return;

        if (!events || events.length === 0) {
            container.innerHTML = '<div class="no-data">Предстоящих мероприятий нет</div>';
            return;
        }

        const html = `
            <table>
                <thead>
                    <tr>
                        <th>Название</th>
                        <th>Дата</th>
                        <th>Продано</th>
                        <th>Доход</th>
                    </tr>
                </thead>
                <tbody>
                    ${events.map(e => `
                        <tr>
                            <td>${this.escapeHtml(e.name)}</td>
                            <td>${new Date(e.date).toLocaleDateString('ru-RU')}</td>
                            <td>${e.tickets_sold || 0}</td>
                            <td>${(e.revenue || 0).toLocaleString('ru-RU')} ₽</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        container.innerHTML = html;
    }

    async loadVisitorChart(days = 30) {
        try {
            const chartData = await this.apiRequest(`/api/admin/visitor-stats/chart?days=${days}`);

            const canvas = document.getElementById('visitorChart');
            if (!canvas) return;

            // Проверяем, есть ли уже график на этом канвасе
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                existingChart.destroy();
            }

            if (this.visitorChart) {
                this.visitorChart.destroy();
                this.visitorChart = null;
            }

            // API возвращает массив объектов: [{ date, unique_visitors, total_sessions }, ...]
            if (!Array.isArray(chartData) || chartData.length === 0) {
                console.warn('No chart data available');
                return;
            }

            const labels = chartData.map(item => {
                const date = new Date(item.date);
                return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
            });

            const uniqueVisitors = chartData.map(item => item.unique_visitors || 0);
            const totalSessions = chartData.map(item => item.total_sessions || 0);

            const ctx = canvas.getContext('2d');

            this.visitorChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Уникальные посетители',
                            data: uniqueVisitors,
                            borderColor: '#006666',
                            backgroundColor: 'rgba(0, 102, 102, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            pointBackgroundColor: '#006666',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2
                        },
                        {
                            label: 'Всего сессий',
                            data: totalSessions,
                            borderColor: '#27ae60',
                            backgroundColor: 'rgba(39, 174, 96, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 3,
                            pointHoverRadius: 5,
                            pointBackgroundColor: '#27ae60',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 15,
                                font: {
                                    size: 13,
                                    weight: '600'
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                font: {
                                    size: 11
                                }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    size: 11
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Visitor chart error:', error);
        }
    }

    // ==================== EVENTS ====================

    async loadEventsForSelect() {
        try {
            const events = await this.apiRequest('/api/events');
            const select = document.getElementById('eventSelect');
            if (!select) return;

            select.innerHTML = '<option value="">-- Выберите --</option>';
            events.forEach(event => {
                const option = document.createElement('option');
                option.value = event.id;
                option.textContent = `${event.name} (${new Date(event.date).toLocaleDateString('ru-RU')})`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Load events for select error:', error);
        }
    }

    async loadEvents() {
        try {
            const container = document.getElementById('allEvents');
            if (!container) return;

            container.innerHTML = '<div class="loading">Загрузка...</div>';
            const events = await this.apiRequest('/api/admin/events');
            this.renderAllEvents(events || []);
        } catch (error) {
            console.error('Load events error:', error);
            const container = document.getElementById('allEvents');
            if (container) {
                container.innerHTML = '<div class="error-message">Ошибка загрузки</div>';
            }
        }
    }

    filterEvents(filter) {
        const allRows = document.querySelectorAll('#allEvents table tbody tr');
        allRows.forEach(row => {
            const dateCell = row.querySelector('td:nth-child(2)');
            if (!dateCell) return;
            
            const dateStr = dateCell.textContent;
            const eventDate = new Date(dateStr.split('.').reverse().join('-'));
            const now = new Date();
            const isUpcoming = eventDate > now;
            
            if (!filter || 
                (filter === 'upcoming' && isUpcoming) || 
                (filter === 'past' && !isUpcoming)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    renderAllEvents(events) {
        const container = document.getElementById('allEvents');
        if (!container) return;

        if (!events || events.length === 0) {
            container.innerHTML = '<div class="no-data">Мероприятий пока нет</div>';
            return;
        }

        const html = `
            <table>
                <thead>
                    <tr>
                        <th>Название</th>
                        <th>Дата</th>
                        <th>Площадка</th>
                        <th>Продано</th>
                        <th>Доход</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${events.map(e => `
                        <tr>
                            <td><strong>${this.escapeHtml(e.name)}</strong></td>
                            <td>${new Date(e.date).toLocaleDateString('ru-RU')}</td>
                            <td>${this.escapeHtml(e.venue || 'Не указано')}</td>
                            <td>${e.tickets_sold || 0}</td>
                            <td>${(e.revenue || 0).toLocaleString('ru-RU')} ₽</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-info view-event-btn" data-id="${e.id}">👁️</button>
                                    <button class="btn btn-sm btn-secondary edit-event-btn" data-id="${e.id}">✏️</button>
                                    <button class="btn btn-sm btn-danger delete-event-btn" data-id="${e.id}">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        container.innerHTML = html;
    }

    createEvent() {
        // Implementation for creating event
        const formData = {
            name: document.getElementById('eventName')?.value.trim(),
            date: document.getElementById('eventDate')?.value,
            venue: document.getElementById('eventVenue')?.value.trim(),
            duration: parseInt(document.getElementById('eventDuration')?.value) || 120,
            description: document.getElementById('eventDescription')?.value.trim() || '',
            image_url: document.getElementById('eventImage')?.value.trim() || ''
        };

        if (!formData.name || !formData.date || !formData.venue) {
            this.showError('Заполните обязательные поля');
            return;
        }

        // TODO: Add image upload logic
        this.apiRequest('/api/admin/events', {
            method: 'POST',
            body: JSON.stringify(formData)
        }).then(result => {
            if (result.success) {
                this.showSuccess('Мероприятие создано!');
                document.getElementById('createEventForm').reset();
                document.getElementById('eventImagePreview').style.display = 'none';
                this.loadEvents();
                this.loadDashboard();
            } else {
                this.showError('Ошибка: ' + (result.message || 'Неизвестная ошибка'));
            }
        }).catch(error => {
            console.error('Create event error:', error);
            this.showError('Ошибка создания мероприятия');
        });
    }

    async deleteEvent(eventId) {
        if (!confirm('Удалить мероприятие? Это действие нельзя отменить.')) return;

        try {
            const result = await this.apiRequest(`/api/admin/events/${eventId}`, {
                method: 'DELETE'
            });

            if (result.success) {
                this.showSuccess('Мероприятие удалено');
                this.loadEvents();
                this.loadDashboard();
            } else {
                this.showError('Ошибка: ' + result.message);
            }
        } catch (error) {
            console.error('Delete event error:', error);
            this.showError('Ошибка удаления мероприятия');
        }
    }

    async viewEventDetails(eventId) {
        // TODO: Implement event details modal
        console.log('View event:', eventId);
    }

    async editEvent(eventId) {
        // TODO: Implement event edit modal
        console.log('Edit event:', eventId);
    }

    // ==================== SEATS ====================

    async loadEventSeats(eventId) {
        console.log('🔄 loadEventSeats вызван с eventId:', eventId);
        
        if (!eventId) {
            const container = document.getElementById('seatsContainer');
            if (container) container.innerHTML = '<div class="loading">Выберите мероприятие</div>';
            return;
        }

        try {
            const container = document.getElementById('seatsContainer');
            if (!container) return;

            container.innerHTML = '<div class="loading">Загрузка мест...</div>';
            
            const url = `/api/seats/event/${eventId}`;
            console.log('📡 Запрос мест:', url);
            
            const seats = await this.apiRequest(url);
            
            console.log('✅ Получено мест:', seats ? seats.length : 0, seats);
            
            if (!seats || seats.length === 0) {
                container.innerHTML = '<div class="no-data">Мест пока нет. Создайте схему зала.</div>';
                return;
            }
            
            this.renderSeatsGrid(seats, eventId);
        } catch (error) {
            console.error('❌ Load seats error:', error);
            const container = document.getElementById('seatsContainer');
            if (container) {
                container.innerHTML = '<div class="error-message">Ошибка загрузки мест: ' + error.message + '</div>';
            }
        }
    }

    renderSeatsGrid(seats, eventId) {
        console.log('🔄 renderSeatsGrid вызван с мест:', seats ? seats.length : 0, seats);
        
        const container = document.getElementById('seatsContainer');
        if (!container) {
            console.error('❌ Контейнер seatsContainer не найден');
            return;
        }

        if (!seats || seats.length === 0) {
            container.innerHTML = '<div class="no-data">Мест пока нет. Создайте схему зала.</div>';
            return;
        }

        // Group seats by row (используем seat_label вместо label)
        const rowsMap = new Map();
        seats.forEach((seat, index) => {
            console.log(`Seat ${index}:`, seat);
            if (!seat.seat_label) {
                console.warn('⚠️ Seat without seat_label:', seat);
                return;
            }
            const rowLabel = seat.seat_label.charAt(0);
            if (!rowsMap.has(rowLabel)) {
                rowsMap.set(rowLabel, []);
            }
            rowsMap.get(rowLabel).push(seat);
        });

        const rows = Array.from(rowsMap.entries()).sort((a, b) =>
            a[0].localeCompare(b[0])
        );
        
        console.log('📊 Рядов найдено:', rows.length, rows);

        let html = `
            <div class="seat-legend">
                <div class="legend-item">
                    <div class="legend-color legend-standard"></div>
                    <span>Стандарт</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color legend-vip"></div>
                    <span>VIP</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color legend-occupied"></div>
                    <span>Занято</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color legend-blocked"></div>
                    <span>Заблокировано</span>
                </div>
            </div>

            <div class="stage">🎭 СЦЕНА</div>

            <div class="seats-grid">
                ${rows.map(([rowLabel, rowSeats]) => `
                    <div class="seat-row">
                        <div class="row-label">${rowLabel}</div>
                        ${rowSeats.map(seat => `
                            <button class="seat seat-${seat.category === 'vip' ? 'vip' : 'standard'} seat-${seat.status || 'free'}"
                                    title="${seat.seat_label} - ${this.getCategoryName(seat.category || 'standard')} - ${seat.price}₽"
                                    onclick="admin.editSeat(${seat.id}, '${this.escapeHtml(seat.seat_label)}', ${seat.price}, '${seat.category || 'standard'}', '${seat.status || 'free'}')">
                                ${seat.price}
                            </button>
                        `).join('')}
                    </div>
                `).join('')}
            </div>

            <div class="seat-editor">
                <h3>💺 Редактирование места</h3>
                <div id="seatEditForm" style="display: none;">
                    <input type="hidden" id="editSeatId">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Место</label>
                            <input type="text" id="editSeatLabel" readonly>
                        </div>
                        <div class="form-group">
                            <label>Цена (₽)</label>
                            <input type="number" id="editSeatPrice" min="0">
                        </div>
                        <div class="form-group">
                            <label>Категория</label>
                            <select id="editSeatCategory">
                                <option value="standard">Стандарт</option>
                                <option value="vip">VIP</option>
                                <option value="premium">Премиум</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Статус</label>
                            <select id="editSeatStatus">
                                <option value="free">Свободно</option>
                                <option value="blocked">Заблокировано</option>
                            </select>
                        </div>
                    </div>
                    <div class="action-buttons">
                        <button class="btn btn-success" onclick="admin.updateSeat()">💾 Сохранить</button>
                        <button class="btn btn-danger" onclick="admin.deleteSeat()">🗑️ Заблокировать</button>
                        <button class="btn btn-secondary" onclick="document.getElementById('seatEditForm').style.display='none'">❌ Отмена</button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    editSeat(seatId, label, price, category, status) {
        document.getElementById('editSeatId').value = seatId;
        document.getElementById('editSeatLabel').value = label;
        document.getElementById('editSeatPrice').value = price;
        document.getElementById('editSeatCategory').value = category;
        document.getElementById('editSeatStatus').value = status;
        document.getElementById('seatEditForm').style.display = 'block';
    }

    updateSeat() {
        const seatId = document.getElementById('editSeatId').value;
        const seatData = {
            price: parseInt(document.getElementById('editSeatPrice').value),
            category: document.getElementById('editSeatCategory').value,
            status: document.getElementById('editSeatStatus').value
        };

        this.apiRequest(`/api/admin/seats/${seatId}`, {
            method: 'PUT',
            body: JSON.stringify(seatData)
        }).then(result => {
            if (result.success) {
                this.showSuccess('Место обновлено');
                const eventSelect = document.getElementById('eventSelect');
                if (eventSelect.value) {
                    this.loadEventSeats(eventSelect.value);
                }
            } else {
                this.showError('Ошибка: ' + result.message);
            }
        }).catch(error => {
            console.error('Update seat error:', error);
            this.showError('Ошибка обновления места');
        });
    }

    deleteSeat() {
        const seatId = document.getElementById('editSeatId').value;
        
        if (!confirm('Заблокировать это место?')) return;

        this.apiRequest(`/api/admin/seats/${seatId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'blocked' })
        }).then(result => {
            if (result.success) {
                this.showSuccess('Место заблокировано');
                const eventSelect = document.getElementById('eventSelect');
                if (eventSelect.value) {
                    this.loadEventSeats(eventSelect.value);
                }
            } else {
                this.showError('Ошибка: ' + result.message);
            }
        }).catch(error => {
            console.error('Delete seat error:', error);
            this.showError('Ошибка блокировки места');
        });
    }

    createBulkSeats() {
        const eventSelect = document.getElementById('eventSelect');
        const eventId = eventSelect.value;

        console.log('🔧 createBulkSeats вызван, eventId:', eventId);

        if (!eventId) {
            this.showError('Выберите мероприятие');
            return;
        }

        const config = {
            rows: parseInt(document.getElementById('rowsCount').value),
            seatsPerRow: parseInt(document.getElementById('seatsPerRow').value),
            basePrice: parseInt(document.getElementById('basePrice').value),
            vipRows: document.getElementById('vipRows').value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
        };

        console.log('📦 Конфигурация:', config);

        if (config.rows < 1 || config.rows > 20 || config.seatsPerRow < 1 || config.seatsPerRow > 20) {
            this.showError('Количество рядов и мест должно быть от 1 до 20');
            return;
        }

        const url = `/api/admin/events/${eventId}/seats/bulk`;
        console.log('📡 Запрос создания мест:', url);

        this.apiRequest(url, {
            method: 'POST',
            body: JSON.stringify(config)
        }).then(result => {
            console.log('✅ Результат создания мест:', result);
            if (result.success) {
                this.showSuccess('Схема зала создана!');
                this.loadEventSeats(eventId);
            } else {
                console.error('❌ Ошибка в ответе API:', result);
                this.showError('Ошибка: ' + result.message);
            }
        }).catch(error => {
            console.error('❌ Create bulk seats error:', error);
            this.showError('Ошибка создания схемы зала');
        });
    }

    // ==================== BOOKINGS ====================

    async loadBookings() {
        try {
            const container = document.getElementById('allBookings');
            if (!container) return;

            container.innerHTML = '<div class="loading">Загрузка...</div>';
            const bookings = await this.apiRequest('/api/admin/bookings');
            this.renderAllBookings(bookings || []);
        } catch (error) {
            console.error('Load bookings error:', error);
            const container = document.getElementById('allBookings');
            if (container) {
                container.innerHTML = '<div class="error-message">Ошибка загрузки</div>';
            }
        }
    }

    searchBookings(query) {
        const allRows = document.querySelectorAll('#allBookings table tbody tr');
        const searchLower = query.toLowerCase();
        
        allRows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchLower) ? '' : 'none';
        });
    }

    renderAllBookings(bookings) {
        const container = document.getElementById('allBookings');
        if (!container) return;

        if (!bookings || bookings.length === 0) {
            container.innerHTML = '<div class="no-data">Бронирований пока нет</div>';
            return;
        }

        const html = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Гость</th>
                        <th>Телефон</th>
                        <th>Мероприятие</th>
                        <th>Дата</th>
                        <th>Места</th>
                        <th>Сумма</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${bookings.map(b => `
                        <tr>
                            <td>#${b.id}</td>
                            <td>${this.escapeHtml(b.customer_name || 'Не указано')}</td>
                            <td>${this.escapeHtml(b.customer_phone || 'Не указано')}</td>
                            <td>${this.escapeHtml(b.event_name || 'Не указано')}</td>
                            <td>${b.event_date ? new Date(b.event_date).toLocaleDateString('ru-RU') : '-'}</td>
                            <td>${b.seats_count || 0}</td>
                            <td>${(b.total_price || 0).toLocaleString('ru-RU')} ₽</td>
                            <td><span class="status-badge status-${b.status || 'pending'}">${this.getBookingStatusName(b.status)}</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-info view-booking-btn" data-id="${b.id}">👁️</button>
                                    <button class="btn btn-sm btn-danger cancel-booking-btn" data-id="${b.id}">❌</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        container.innerHTML = html;
    }

    async viewBookingDetails(bookingId) {
        // TODO: Implement booking details modal
        console.log('View booking:', bookingId);
    }

    async cancelBooking(bookingId) {
        if (!confirm('Отменить бронирование? Места будут освобождены.')) return;

        try {
            const result = await this.apiRequest(`/api/admin/bookings/${bookingId}`, {
                method: 'DELETE'
            });

            if (result.success) {
                this.showSuccess('Бронирование отменено');
                this.loadBookings();
                this.loadDashboard();
            } else {
                this.showError('Ошибка: ' + result.message);
            }
        } catch (error) {
            console.error('Cancel booking error:', error);
            this.showError('Ошибка отмены бронирования');
        }
    }

    exportBookings(format) {
        // TODO: Implement CSV/Excel export
        this.showError('Функция экспорта в разработке');
    }

    exportEvents(format) {
        // TODO: Implement CSV/Excel export
        this.showError('Функция экспорта в разработке');
    }

    // ==================== PROMO CODES ====================

    async loadPromoCodes() {
        try {
            const container = document.getElementById('promoCodesContainer');
            if (!container) return;

            container.innerHTML = '<div class="loading">Загрузка...</div>';
            const result = await this.apiRequest('/api/promo/all');

            if (result.success) {
                this.displayPromoCodes(result.promoCodes || []);
            } else {
                throw new Error(result.message || 'Ошибка загрузки');
            }
        } catch (error) {
            console.error('Load promo codes error:', error);
            this.showError('Ошибка загрузки промокодов');
            const container = document.getElementById('promoCodesContainer');
            if (container) {
                container.innerHTML = '<div class="error-message">Ошибка загрузки</div>';
            }
        }
    }

    displayPromoCodes(promos) {
        const container = document.getElementById('promoCodesContainer');
        if (!container) return;

        if (!promos || promos.length === 0) {
            container.innerHTML = '<div class="no-data">🎁 Промокодов пока нет</div>';
            return;
        }

        const stats = this.calculatePromoStats(promos);
        
        const html = `
            <div style="background: var(--surface); padding: 1.5rem; border-radius: var(--radius-md); margin-bottom: 1.5rem; border-left: 4px solid var(--primary); box-shadow: var(--shadow-inner);">
                <h4 style="margin: 0 0 1rem 0; color: var(--text);">📊 Статистика</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary);">${stats.total}</div>
                        <div style="font-size: 0.75rem; color: var(--text-light);">Всего</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--success);">${stats.active}</div>
                        <div style="font-size: 0.75rem; color: var(--text-light);">Активных</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--warning);">${stats.used}</div>
                        <div style="font-size: 0.75rem; color: var(--text-light);">Использовано</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--info);">${stats.avgDiscount}%</div>
                        <div style="font-size: 0.75rem; color: var(--text-light);">Средняя скидка</div>
                    </div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Код</th>
                        <th>Скидка</th>
                        <th>Использовано</th>
                        <th>Действует до</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${promos.map(p => `
                        <tr>
                            <td><strong style="font-family: monospace;">${this.escapeHtml(p.code)}</strong></td>
                            <td><span class="status-badge status-active">${p.discount}%</span></td>
                            <td>${p.used || 0}${p.max_uses ? ` / ${p.max_uses}` : ' / ∞'}</td>
                            <td>${p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('ru-RU') : 'Бессрочно'}</td>
                            <td><span class="status-badge ${p.is_active ? 'status-active' : 'status-cancelled'}">${p.is_active ? 'Активен' : 'Неактивен'}</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-secondary edit-promo-btn" data-id="${p.id}">✏️</button>
                                    <button class="btn btn-sm btn-danger delete-promo-btn" data-id="${p.id}">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        container.innerHTML = html;
    }

    calculatePromoStats(promos) {
        const total = promos.length;
        const active = promos.filter(p => p.is_active).length;
        const used = promos.reduce((sum, p) => sum + (p.used || 0), 0);
        const avgDiscount = promos.length > 0
            ? Math.round(promos.reduce((sum, p) => sum + p.discount, 0) / promos.length)
            : 0;
        return { total, active, used, avgDiscount };
    }

    createPromoCode() {
        const formData = {
            code: document.getElementById('promoCode')?.value.trim().toUpperCase(),
            discount: parseInt(document.getElementById('promoDiscount')?.value),
            max_uses: document.getElementById('promoMaxUses')?.value ? parseInt(document.getElementById('promoMaxUses').value) : null,
            expiry_date: document.getElementById('promoExpiry')?.value || null,
            is_active: document.getElementById('promoActive')?.checked ? 1 : 0
        };

        if (!formData.code || !formData.discount) {
            this.showError('Заполните код и скидку');
            return;
        }

        this.apiRequest('/api/promo/create', {
            method: 'POST',
            body: JSON.stringify(formData)
        }).then(result => {
            if (result.success) {
                this.showSuccess('🎁 Промокод создан!');
                document.getElementById('createPromoForm').reset();
                this.loadPromoCodes();
            } else {
                this.showError('Ошибка: ' + (result.message || 'Неизвестная ошибка'));
            }
        }).catch(error => {
            console.error('Create promo code error:', error);
            this.showError('Ошибка создания промокода');
        });
    }

    async deletePromoCode(id) {
        if (!confirm('Удалить промокод?')) return;

        try {
            const result = await this.apiRequest(`/api/promo/${id}`, {
                method: 'DELETE'
            });

            if (result.success) {
                this.showSuccess('Промокод удален');
                this.loadPromoCodes();
            } else {
                this.showError('Ошибка: ' + result.message);
            }
        } catch (error) {
            console.error('Delete promo code error:', error);
            this.showError('Ошибка удаления промокода');
        }
    }

    async editPromoCode(id) {
        try {
            const result = await this.apiRequest('/api/promo/all');
            if (!result.success || !result.promoCodes) {
                throw new Error('Не удалось загрузить промокоды');
            }

            const promo = result.promoCodes.find(p => p.id == id);
            if (!promo) {
                throw new Error('Промокод не найден');
            }

            let formattedDate = '';
            if (promo.expiry_date) {
                const expiryDate = new Date(promo.expiry_date);
                formattedDate = new Date(expiryDate.getTime() - expiryDate.getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16);
            }

            const modalHtml = `
                <div class="modal-overlay" id="editPromoModal" onclick="if(event.target === this) this.remove()">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title">✏️ Редактирование промокода</h3>
                            <button class="modal-close" onclick="document.getElementById('editPromoModal').remove()">×</button>
                        </div>
                        <div class="modal-body">
                            <form id="editPromoForm">
                                <div class="form-group">
                                    <label>Код</label>
                                    <input type="text" value="${this.escapeHtml(promo.code)}" readonly style="font-family: monospace; text-transform: uppercase;">
                                </div>
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label>Скидка (%) *</label>
                                        <input type="number" id="editPromoDiscount" value="${promo.discount}" required min="1" max="100">
                                    </div>
                                    <div class="form-group">
                                        <label>Макс. использований</label>
                                        <input type="number" id="editPromoMaxUses" value="${promo.max_uses || ''}" min="1" placeholder="Безлимита">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Действует до</label>
                                    <input type="datetime-local" id="editPromoExpiry" value="${formattedDate}">
                                </div>
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="editPromoActive" ${promo.is_active ? 'checked' : ''}>
                                        <span>Активен</span>
                                    </label>
                                </div>
                                <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
                                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('editPromoModal').remove()">❌ Отмена</button>
                                    <button type="submit" class="btn btn-success">💾 Сохранить</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;

            const existingModal = document.getElementById('editPromoModal');
            if (existingModal) existingModal.remove();

            document.body.insertAdjacentHTML('beforeend', modalHtml);

            const editForm = document.getElementById('editPromoForm');
            if (editForm) {
                editForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.updatePromoCode(id);
                });
            }
        } catch (error) {
            console.error('Edit promo code error:', error);
            this.showError('Ошибка: ' + error.message);
        }
    }

    async updatePromoCode(id) {
        const promoData = {
            discount: parseInt(document.getElementById('editPromoDiscount').value),
            max_uses: document.getElementById('editPromoMaxUses').value ? parseInt(document.getElementById('editPromoMaxUses').value) : null,
            expiry_date: document.getElementById('editPromoExpiry').value || null,
            is_active: document.getElementById('editPromoActive').checked ? 1 : 0
        };

        if (!promoData.discount || promoData.discount < 1 || promoData.discount > 100) {
            this.showError('Скидка должна быть от 1% до 100%');
            return;
        }

        this.apiRequest(`/api/promo/${id}`, {
            method: 'PUT',
            body: JSON.stringify(promoData)
        }).then(result => {
            if (result.success) {
                this.showSuccess('Промокод обновлен!');
                const modal = document.getElementById('editPromoModal');
                if (modal) modal.remove();
                this.loadPromoCodes();
            } else {
                this.showError('Ошибка: ' + (result.message || 'Неизвестная ошибка'));
            }
        }).catch(error => {
            console.error('Update promo code error:', error);
            this.showError('Ошибка обновления промокода');
        });
    }

    // ==================== DISCOUNT CATEGORIES ====================

    async loadDiscountCategories() {
        try {
            const container = document.getElementById('discountCategoriesContainer');
            if (!container) return;

            container.innerHTML = '<div class="loading">Загрузка...</div>';
            const result = await this.apiRequest('/api/admin/discount-categories');

            if (Array.isArray(result)) {
                this.displayDiscountCategories(result);
            } else {
                throw new Error('Некорректный формат данных');
            }
        } catch (error) {
            console.error('Load discount categories error:', error);
            this.showError('Ошибка загрузки категорий');
            const container = document.getElementById('discountCategoriesContainer');
            if (container) {
                container.innerHTML = '<div class="error-message">Ошибка загрузки</div>';
            }
        }
    }

    displayDiscountCategories(categories) {
        const container = document.getElementById('discountCategoriesContainer');
        if (!container) return;

        if (!categories || categories.length === 0) {
            container.innerHTML = '<div class="no-data">🎫 Льготных категорий пока нет</div>';
            return;
        }

        const stats = this.calculateCategoryStats(categories);

        const html = `
            <div style="background: var(--surface); padding: 1.5rem; border-radius: var(--radius-md); margin-bottom: 1.5rem; border-left: 4px solid var(--primary); box-shadow: var(--shadow-inner);">
                <h4 style="margin: 0 0 1rem 0; color: var(--text);">📊 Статистика</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary);">${stats.total}</div>
                        <div style="font-size: 0.75rem; color: var(--text-light);">Всего</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--success);">${stats.active}</div>
                        <div style="font-size: 0.75rem; color: var(--text-light);">Активных</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--info);">${stats.avgDiscount}%</div>
                        <div style="font-size: 0.75rem; color: var(--text-light);">Средняя скидка</div>
                    </div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Название</th>
                        <th>Скидка</th>
                        <th>Описание</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${categories.map(c => `
                        <tr>
                            <td><strong>${this.escapeHtml(c.name)}</strong></td>
                            <td><span class="status-badge ${c.is_active ? 'status-active' : 'status-cancelled'}">${c.discount_percent}%</span></td>
                            <td>${this.escapeHtml(c.description || 'Нет описания')}</td>
                            <td><span class="status-badge ${c.is_active ? 'status-active' : 'status-cancelled'}">${c.is_active ? 'Активна' : 'Неактивна'}</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-secondary edit-category-btn" data-id="${c.id}">✏️</button>
                                    <button class="btn btn-sm btn-danger delete-category-btn" data-id="${c.id}">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        container.innerHTML = html;
    }

    calculateCategoryStats(categories) {
        const total = categories.length;
        const active = categories.filter(c => c.is_active).length;
        const avgDiscount = categories.length > 0
            ? Math.round(categories.reduce((sum, c) => sum + c.discount_percent, 0) / categories.length)
            : 0;
        return { total, active, avgDiscount };
    }

    createDiscountCategory() {
        const formData = {
            name: document.getElementById('categoryName')?.value.trim(),
            discount_percent: parseInt(document.getElementById('categoryDiscount')?.value),
            description: document.getElementById('categoryDescription')?.value.trim() || ''
        };

        if (!formData.name || formData.discount_percent === undefined) {
            this.showError('Заполните название и размер скидки');
            return;
        }

        if (formData.discount_percent < 0 || formData.discount_percent > 100) {
            this.showError('Скидка должна быть от 0% до 100%');
            return;
        }

        this.apiRequest('/api/admin/discount-categories', {
            method: 'POST',
            body: JSON.stringify(formData)
        }).then(result => {
            if (result.success) {
                this.showSuccess('🎫 Категория создана!');
                document.getElementById('createDiscountCategoryForm').reset();
                this.loadDiscountCategories();
            } else {
                this.showError('Ошибка: ' + (result.message || 'Неизвестная ошибка'));
            }
        }).catch(error => {
            console.error('Create category error:', error);
            this.showError('Ошибка создания категории');
        });
    }

    async deleteDiscountCategory(id) {
        if (!confirm('Удалить категорию?')) return;

        try {
            const result = await this.apiRequest(`/api/admin/discount-categories/${id}`, {
                method: 'DELETE'
            });

            if (result.success) {
                this.showSuccess('Категория удалена');
                this.loadDiscountCategories();
            } else {
                this.showError('Ошибка: ' + result.message);
            }
        } catch (error) {
            console.error('Delete category error:', error);
            this.showError('Ошибка удаления категории');
        }
    }

    async editDiscountCategory(id) {
        try {
            const categories = await this.apiRequest('/api/admin/discount-categories');
            if (!Array.isArray(categories)) {
                throw new Error('Не удалось загрузить категории');
            }

            const category = categories.find(c => c.id == id);
            if (!category) {
                throw new Error('Категория не найдена');
            }

            const modalHtml = `
                <div class="modal-overlay" id="editCategoryModal" onclick="if(event.target === this) this.remove()">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title">✏️ Редактирование категории</h3>
                            <button class="modal-close" onclick="document.getElementById('editCategoryModal').remove()">×</button>
                        </div>
                        <div class="modal-body">
                            <form id="editCategoryForm">
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label>Название *</label>
                                        <input type="text" id="editCategoryName" value="${this.escapeHtml(category.name)}" required>
                                    </div>
                                    <div class="form-group">
                                        <label>Скидка (%) *</label>
                                        <input type="number" id="editCategoryDiscount" value="${category.discount_percent}" required min="0" max="100">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Описание</label>
                                    <textarea id="editCategoryDescription" rows="3">${this.escapeHtml(category.description || '')}</textarea>
                                </div>
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="editCategoryActive" ${category.is_active ? 'checked' : ''}>
                                        <span>Активна</span>
                                    </label>
                                </div>
                                <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
                                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('editCategoryModal').remove()">❌ Отмена</button>
                                    <button type="submit" class="btn btn-success">💾 Сохранить</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;

            const existingModal = document.getElementById('editCategoryModal');
            if (existingModal) existingModal.remove();

            document.body.insertAdjacentHTML('beforeend', modalHtml);

            const editForm = document.getElementById('editCategoryForm');
            if (editForm) {
                editForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.updateDiscountCategory(id);
                });
            }
        } catch (error) {
            console.error('Edit category error:', error);
            this.showError('Ошибка: ' + error.message);
        }
    }

    async updateDiscountCategory(id) {
        const categoryData = {
            name: document.getElementById('editCategoryName').value.trim(),
            discount_percent: parseInt(document.getElementById('editCategoryDiscount').value),
            description: document.getElementById('editCategoryDescription').value.trim() || '',
            is_active: document.getElementById('editCategoryActive').checked ? 1 : 0
        };

        if (!categoryData.name || categoryData.discount_percent === undefined) {
            this.showError('Заполните название и размер скидки');
            return;
        }

        if (categoryData.discount_percent < 0 || categoryData.discount_percent > 100) {
            this.showError('Скидка должна быть от 0% до 100%');
            return;
        }

        this.apiRequest(`/api/admin/discount-categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData)
        }).then(result => {
            if (result.success) {
                this.showSuccess('Категория обновлена!');
                const modal = document.getElementById('editCategoryModal');
                if (modal) modal.remove();
                this.loadDiscountCategories();
            } else {
                this.showError('Ошибка: ' + (result.message || 'Неизвестная ошибка'));
            }
        }).catch(error => {
            console.error('Update category error:', error);
            this.showError('Ошибка обновления категории');
        });
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showSuccess('Уведомления включены');
                    document.getElementById('notificationBtn').style.display = 'none';
                }
            });
        }
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOMContentLoaded - admin_new.js ready');
});
