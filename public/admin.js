const API_BASE = '/api';
console.log('🎯 admin.js начал выполнение');

class AdminPanel {
    constructor() {
        console.log('🔄 Конструктор AdminPanel вызван');
        try {
            this.visitorChart = null;
            this.isSubmitting = false;
            this.init();
            console.log('✅ AdminPanel инициализирован успешно');
        } catch (error) {
            console.error('❌ Ошибка инициализации AdminPanel:', error);
        }
    }

    init() {
        console.log('🔄 Метод init вызван');
        this.updateTime();
        // Сохраняем ID интервала для возможной очистки
        this.timeInterval = setInterval(() => this.updateTime(), 1000);

        this.registerServiceWorker();
        this.setupEventListeners();
        this.loadDashboard();
        this.loadEventsForSelect();
        console.log('✅ Все методы init выполнены');
    }
    
    // Метод для очистки ресурсов (если понадобится)
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
        // Форма создания мероприятия
        const createEventForm = document.getElementById('createEventForm');
        if (createEventForm) {
            createEventForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createEvent();
            });
            
            // Обработчик предпросмотра изображения при выборе файла
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

        // Форма массового создания мест
        const createSeatsForm = document.getElementById('createSeatsForm');
        if (createSeatsForm) {
            createSeatsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createBulkSeats();
            });
        }

        // Выбор мероприятия для управления местами
        const eventSelect = document.getElementById('eventSelect');
        if (eventSelect) {
            eventSelect.addEventListener('change', (e) => {
                this.loadEventSeats(e.target.value);
            });
        }

        // Поиск бронирований
        const searchBookings = document.getElementById('searchBookings');
        if (searchBookings) {
            searchBookings.addEventListener('input', (e) => {
                this.searchBookings(e.target.value);
            });
        }

        // Фильтр мероприятий
        const filterEvents = document.getElementById('filterEvents');
        if (filterEvents) {
            filterEvents.addEventListener('change', (e) => {
                this.filterEvents(e.target.value);
            });
        }

        // Промокоды
        const createPromoButton = document.getElementById('createPromoButton');
        if (createPromoButton) {
            createPromoButton.addEventListener('click', () => {
                this.createPromoCode();
            });
        }

        // Форма создания промокода
        const createPromoForm = document.getElementById('createPromoForm');
        if (createPromoForm) {
            createPromoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createPromoCode();
            });
        }

        // Льготные категории
        const createCategoryButton = document.getElementById('createCategoryButton');
        if (createCategoryButton) {
            createCategoryButton.addEventListener('click', () => {
                this.createDiscountCategory();
            });
        }

        // Форма создания льготной категории
        const createDiscountCategoryForm = document.getElementById('createDiscountCategoryForm');
        if (createDiscountCategoryForm) {
            createDiscountCategoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createDiscountCategory();
            });
        }

        // Делегирование событий для кнопок
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
        });
    }

    // ==================== API МЕТОДЫ ====================
    
    async apiRequest(endpoint, options = {}) {
        try {
            console.log(`📡 API запрос: ${endpoint}`, options);
            const response = await fetch(endpoint, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ API ответ от ${endpoint}:`, data);
            return data;
        } catch (error) {
            console.error(`❌ API ошибка для ${endpoint}:`, error);
            throw error;
        }
    }

    // ==================== ЛЬГОТНЫЕ КАТЕГОРИИ ====================
    
    async loadDiscountCategories() {
        try {
            console.log('🔄 Загрузка льготных категорий...');
            const container = document.getElementById('discountCategoriesContainer');
            
            if (!container) {
                console.error('❌ Контейнер льготных категорий не найден');
                return;
            }

            container.innerHTML = '<div class="loading">Загрузка категорий...</div>';

            const result = await this.apiRequest('/api/admin/discount-categories');
            
            if (result && Array.isArray(result)) {
                console.log('✅ Категории загружены:', result);
                this.displayDiscountCategories(result);
            } else {
                throw new Error('Некорректный формат данных');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки льготных категорий:', error);
            this.showError('Ошибка загрузки льготных категорий: ' + error.message);
            
            const container = document.getElementById('discountCategoriesContainer');
            if (container) {
                container.innerHTML = '<div class="error-message">Ошибка загрузки: ' + error.message + '</div>';
            }
        }
    }

    displayDiscountCategories(categories) {
        const container = document.getElementById('discountCategoriesContainer');
        if (!container) {
            console.error('❌ Контейнер льготных категорий не найден');
            return;
        }

        if (!categories || categories.length === 0) {
            container.innerHTML = '<div class="no-data">🎫 Льготных категорий пока нет</div>';
            return;
        }

        // Статистика
        const stats = this.calculateCategoryStats(categories);
        const statsHtml = `
            <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #3498db;">
                <h4 style="margin: 0 0 1rem 0; color: #2c3e50;">📊 Статистика льготных категорий</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #3498db;">${stats.total}</div>
                        <div style="font-size: 0.85rem; color: #7f8c8d;">Всего</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #27ae60;">${stats.active}</div>
                        <div style="font-size: 0.85rem; color: #7f8c8d;">Активных</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #e67e22;">${stats.avgDiscount}%</div>
                        <div style="font-size: 0.85rem; color: #7f8c8d;">Средняя скидка</div>
                    </div>
                </div>
            </div>
        `;

        const tableHtml = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Название</th>
                        <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Скидка</th>
                        <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Описание</th>
                        <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Статус</th>
                        <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${categories.map(category => `
                        <tr style="border-bottom: 1px solid #ecf0f1;">
                            <td style="padding: 1rem;">
                                <strong style="color: #2c3e50;">${category.name}</strong>
                            </td>
                            <td style="padding: 1rem;">
                                <span style="padding: 0.4rem 0.8rem; border-radius: 20px; background: #27ae60; color: white; font-size: 0.85rem; font-weight: 600;">
                                    ${category.discount_percent}%
                                </span>
                            </td>
                            <td style="padding: 1rem;">
                                ${category.description || 'Нет описания'}
                            </td>
                            <td style="padding: 1rem;">
                                <span style="padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600; ${category.is_active ? 'background: #27ae60; color: white;' : 'background: #e74c3c; color: white;'}">
                                    ${category.is_active ? 'Активна' : 'Неактивна'}
                                </span>
                            </td>
                            <td style="padding: 1rem;">
                                <div style="display: flex; gap: 0.5rem;">
                                    <button class="edit-category-btn" data-id="${category.id}" style="padding: 0.5rem; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#2980b9'" onmouseout="this.style.background='#3498db'">✏️</button>
                                    <button class="delete-category-btn" data-id="${category.id}" style="padding: 0.5rem; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#c0392b'" onmouseout="this.style.background='#e74c3c'">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = statsHtml + tableHtml;
    }

    calculateCategoryStats(categories) {
        const total = categories.length;
        const active = categories.filter(c => c.is_active).length;
        const avgDiscount = categories.length > 0 
            ? Math.round(categories.reduce((sum, c) => sum + c.discount_percent, 0) / categories.length)
            : 0;
            
        return { total, active, avgDiscount };
    }

    async createDiscountCategory() {
        try {
            console.log('🔧 Создание льготной категории...');
            
            const formData = {
                name: document.getElementById('categoryName')?.value.trim(),
                discount_percent: parseInt(document.getElementById('categoryDiscount')?.value),
                description: document.getElementById('categoryDescription')?.value.trim() || ''
            };

            console.log('📦 Данные формы:', formData);

            // Валидация
            if (!formData.name || formData.discount_percent === undefined) {
                this.showError('Заполните название и размер скидки');
                return;
            }

            if (formData.discount_percent < 0 || formData.discount_percent > 100) {
                this.showError('Скидка должна быть от 0% до 100%');
                return;
            }

            const result = await this.apiRequest('/api/admin/discount-categories', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            
            if (result.success) {
                this.showSuccess('🎫 Льготная категория создана!');
                
                // Очищаем форму
                document.getElementById('categoryName').value = '';
                document.getElementById('categoryDiscount').value = '';
                document.getElementById('categoryDescription').value = '';
                
                // Перезагружаем список категорий
                setTimeout(() => {
                    this.loadDiscountCategories();
                }, 500);
            } else {
                this.showError('Ошибка: ' + (result.message || 'Неизвестная ошибка'));
            }
        } catch (error) {
            console.error('❌ Ошибка создания льготной категории:', error);
            this.showError('Ошибка создания льготной категории: ' + error.message);
        }
    }

    async deleteDiscountCategory(id) {
        if (!confirm('Удалить льготную категорию? Это действие нельзя отменить.')) return;

        try {
            const result = await this.apiRequest(`/api/admin/discount-categories/${id}`, {
                method: 'DELETE'
            });
            
            if (result.success) {
                this.showSuccess('Льготная категория удалена');
                this.loadDiscountCategories();
            } else {
                this.showError('Ошибка: ' + result.message);
            }
        } catch (error) {
            console.error('❌ Ошибка удаления льготной категории:', error);
            this.showError('Ошибка удаления льготной категории');
        }
    }

    async editDiscountCategory(id) {
        try {
            console.log('🔄 Редактирование льготной категории:', id);
            
            // Загружаем все категории и находим нужную
            const categories = await this.apiRequest('/api/admin/discount-categories');
            
            if (!Array.isArray(categories)) {
                throw new Error('Не удалось загрузить категории');
            }
            
            const category = categories.find(c => c.id == id);
            
            if (!category) {
                throw new Error('Категория не найдена');
            }
            
            // Создаем модальное окно с формой редактирования
            const modalHtml = `
                <div class="modal-overlay" id="editCategoryModal" onclick="if(event.target === this) this.remove()">
                    <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 600px;">
                        <div class="modal-header">
                            <h3>✏️ Редактирование льготной категории</h3>
                            <button class="modal-close" onclick="document.getElementById('editCategoryModal').remove()">×</button>
                        </div>
                        <div class="modal-body">
                            <form id="editCategoryForm">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                                    <div class="form-group">
                                        <label for="editCategoryName">Название категории *</label>
                                        <input type="text" id="editCategoryName" value="${this.escapeHtml(category.name)}" required>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="editCategoryDiscount">Скидка (%) *</label>
                                        <input type="number" id="editCategoryDiscount" value="${category.discount_percent}" required min="0" max="100">
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="editCategoryDescription">Описание</label>
                                    <textarea id="editCategoryDescription" rows="3">${this.escapeHtml(category.description || '')}</textarea>
                                </div>
                                
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="editCategoryActive" ${category.is_active ? 'checked' : ''}>
                                        <span>Активна</span>
                                    </label>
                                </div>
                                
                                <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: flex-end;">
                                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('editCategoryModal').remove()">❌ Отмена</button>
                                    <button type="submit" class="btn btn-success">💾 Сохранить изменения</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            
            // Удаляем предыдущее модальное окно если есть
            const existingModal = document.getElementById('editCategoryModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Добавляем модальное окно
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Назначаем обработчик формы
            const editForm = document.getElementById('editCategoryForm');
            if (editForm) {
                editForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.updateDiscountCategory(id);
                });
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки категории для редактирования:', error);
            this.showError('Ошибка загрузки категории: ' + error.message);
        }
    }

    async updateDiscountCategory(id) {
        try {
            const categoryData = {
                name: document.getElementById('editCategoryName').value.trim(),
                discount_percent: parseInt(document.getElementById('editCategoryDiscount').value),
                description: document.getElementById('editCategoryDescription').value.trim() || '',
                is_active: document.getElementById('editCategoryActive').checked ? 1 : 0
            };

            // Валидация
            if (!categoryData.name || categoryData.discount_percent === undefined) {
                this.showError('❌ Заполните название и размер скидки');
                return;
            }

            if (categoryData.discount_percent < 0 || categoryData.discount_percent > 100) {
                this.showError('❌ Скидка должна быть от 0% до 100%');
                return;
            }

            const result = await this.apiRequest(`/api/admin/discount-categories/${id}`, {
                method: 'PUT',
                body: JSON.stringify(categoryData)
            });

            if (result.success) {
                this.showSuccess('Льготная категория обновлена!');
                // Закрываем модальное окно
                const modal = document.getElementById('editCategoryModal');
                if (modal) {
                    modal.remove();
                }
                // Перезагружаем список категорий
                this.loadDiscountCategories();
            } else {
                this.showError('❌ Ошибка обновления категории: ' + (result.message || 'Неизвестная ошибка'));
            }
        } catch (error) {
            console.error('Ошибка обновления категории:', error);
            this.showError('❌ Ошибка обновления категории: ' + error.message);
        }
    }

    // ==================== ПРОМОКОДЫ ====================

    async loadPromoCodes() {
        try {
            console.log('🔄 Загрузка промокодов...');
            const container = document.getElementById('promoCodesContainer');
            
            if (!container) {
                console.error('❌ Контейнер промокодов не найден');
                return;
            }

            container.innerHTML = '<div class="loading">Загрузка промокодов...</div>';

            const result = await this.apiRequest('/api/promo/all');
            
            if (result.success) {
                console.log('✅ Промокоды загружены:', result.promoCodes);
                this.displayPromoCodes(result.promoCodes);
            } else {
                throw new Error(result.message || 'Ошибка загрузки промокодов');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки промокодов:', error);
            this.showError('Ошибка загрузки промокодов: ' + error.message);
            
            const container = document.getElementById('promoCodesContainer');
            if (container) {
                container.innerHTML = '<div class="error-message">Ошибка загрузки: ' + error.message + '</div>';
            }
        }
    }

    displayPromoCodes(promos) {
        const container = document.getElementById('promoCodesContainer');
        if (!container) {
            console.error('❌ Контейнер промокодов не найден');
            return;
        }

        if (!promos || promos.length === 0) {
            container.innerHTML = '<div class="no-data">🎁 Промокодов пока нет</div>';
            return;
        }

        // Статистика
        const stats = this.calculatePromoStats(promos);
        const statsHtml = `
            <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #3498db;">
                <h4 style="margin: 0 0 1rem 0; color: #2c3e50;">📊 Статистика промокодов</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #3498db;">${stats.total}</div>
                        <div style="font-size: 0.85rem; color: #7f8c8d;">Всего</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #27ae60;">${stats.active}</div>
                        <div style="font-size: 0.85rem; color: #7f8c8d;">Активных</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #e67e22;">${stats.used}</div>
                        <div style="font-size: 0.85rem; color: #7f8c8d;">Использовано</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #9b59b6;">${stats.avgDiscount}%</div>
                        <div style="font-size: 0.85rem; color: #7f8c8d;">Средняя скидка</div>
                    </div>
                </div>
            </div>
        `;

        const tableHtml = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Код</th>
                        <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Скидка</th>
                        <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Использовано</th>
                        <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Действует до</th>
                        <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Статус</th>
                        <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${promos.map(promo => `
                        <tr style="border-bottom: 1px solid #ecf0f1;">
                            <td style="padding: 1rem;">
                                <strong style="font-family: monospace; font-size: 1.1rem; color: #2c3e50;">${promo.code}</strong>
                            </td>
                            <td style="padding: 1rem;">
                                <span style="padding: 0.4rem 0.8rem; border-radius: 20px; background: #27ae60; color: white; font-size: 0.85rem; font-weight: 600;">
                                    ${promo.discount}%
                                </span>
                            </td>
                            <td style="padding: 1rem;">
                                ${promo.used || 0}${promo.max_uses ? ` / ${promo.max_uses}` : ' / ∞'}
                            </td>
                            <td style="padding: 1rem;">
                                ${promo.expiry_date ? new Date(promo.expiry_date).toLocaleDateString('ru-RU') : 'Бессрочно'}
                            </td>
                            <td style="padding: 1rem;">
                                <span style="padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600; ${promo.is_active ? 'background: #27ae60; color: white;' : 'background: #e74c3c; color: white;'}">
                                    ${promo.is_active ? 'Активен' : 'Неактивен'}
                                </span>
                            </td>
                            <td style="padding: 1rem;">
                                <div style="display: flex; gap: 0.5rem;">
                                    <button class="edit-promo-btn" data-id="${promo.id}" style="padding: 0.5rem; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#2980b9'" onmouseout="this.style.background='#3498db'">✏️</button>
                                    <button class="delete-promo-btn" data-id="${promo.id}" style="padding: 0.5rem; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#c0392b'" onmouseout="this.style.background='#e74c3c'">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = statsHtml + tableHtml;
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

    async createPromoCode() {
        try {
            console.log('🔧 Метод createPromoCode вызван');
            
            const formData = {
                code: document.getElementById('promoCode')?.value.trim().toUpperCase(),
                discount: parseInt(document.getElementById('promoDiscount')?.value),
                max_uses: document.getElementById('promoMaxUses')?.value ? parseInt(document.getElementById('promoMaxUses').value) : null,
                expiry_date: document.getElementById('promoExpiry')?.value || null,
                is_active: document.getElementById('promoActive')?.checked ? 1 : 0
            };

            console.log('📦 Данные формы:', formData);

            // Валидация
            if (!formData.code || !formData.discount) {
                this.showError('Заполните код и скидку');
                return;
            }

            const result = await this.apiRequest('/api/promo/create', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            
            if (result.success) {
                this.showSuccess('🎁 Промокод создан!');
                // Очищаем форму
                document.getElementById('promoCode').value = '';
                document.getElementById('promoDiscount').value = '';
                document.getElementById('promoMaxUses').value = '';
                document.getElementById('promoExpiry').value = '';
                document.getElementById('promoActive').checked = true;
                
                // Перезагружаем список промокодов
                setTimeout(() => {
                    this.loadPromoCodes();
                }, 500);
            } else {
                this.showError('Ошибка: ' + (result.message || 'Неизвестная ошибка'));
            }
        } catch (error) {
            console.error('❌ Ошибка создания промокода:', error);
            this.showError('Ошибка создания промокода: ' + error.message);
        }
    }

    async deletePromoCode(id) {
        if (!confirm('Удалить промокод? Это действие нельзя отменить.')) return;

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
            console.error('❌ Ошибка удаления промокода:', error);
            this.showError('Ошибка удаления промокода');
        }
    }

    async editPromoCode(id) {
        try {
            console.log('🔄 Редактирование промокода:', id);
            
            // Загружаем все промокоды и находим нужный
            const result = await this.apiRequest('/api/promo/all');
            
            if (!result.success || !result.promoCodes) {
                throw new Error('Не удалось загрузить промокоды');
            }
            
            const promo = result.promoCodes.find(p => p.id == id);
            
            if (!promo) {
                throw new Error('Промокод не найден');
            }
            
            // Форматируем дату для datetime-local input
            let formattedDate = '';
            if (promo.expiry_date) {
                const expiryDate = new Date(promo.expiry_date);
                formattedDate = new Date(expiryDate.getTime() - expiryDate.getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16);
            }
            
            // Создаем модальное окно с формой редактирования
            const modalHtml = `
                <div class="modal-overlay" id="editPromoModal" onclick="if(event.target === this) this.remove()">
                    <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 600px;">
                        <div class="modal-header">
                            <h3>✏️ Редактирование промокода</h3>
                            <button class="modal-close" onclick="document.getElementById('editPromoModal').remove()">×</button>
                        </div>
                        <div class="modal-body">
                            <form id="editPromoForm">
                                <div class="form-group">
                                    <label for="editPromoCode">Код промокода *</label>
                                    <input type="text" id="editPromoCode" value="${this.escapeHtml(promo.code)}" required style="font-family: monospace; text-transform: uppercase;" readonly>
                                    <small style="color: #7f8c8d;">Код промокода нельзя изменить</small>
                                </div>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                                    <div class="form-group">
                                        <label for="editPromoDiscount">Скидка (%) *</label>
                                        <input type="number" id="editPromoDiscount" value="${promo.discount}" required min="1" max="100">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="editPromoMaxUses">Макс. использований</label>
                                        <input type="number" id="editPromoMaxUses" value="${promo.max_uses || ''}" min="1" placeholder="Оставьте пустым для безлимита">
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="editPromoExpiry">Действует до</label>
                                    <input type="datetime-local" id="editPromoExpiry" value="${formattedDate}">
                                    <small style="color: #7f8c8d;">Оставьте пустым для бессрочного действия</small>
                                </div>
                                
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="editPromoActive" ${promo.is_active ? 'checked' : ''}>
                                        <span>Активен</span>
                                    </label>
                                </div>
                                
                                <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: flex-end;">
                                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('editPromoModal').remove()">❌ Отмена</button>
                                    <button type="submit" class="btn btn-success">💾 Сохранить изменения</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            
            // Удаляем предыдущее модальное окно если есть
            const existingModal = document.getElementById('editPromoModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Добавляем модальное окно
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Назначаем обработчик формы
            const editForm = document.getElementById('editPromoForm');
            if (editForm) {
                editForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.updatePromoCode(id);
                });
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки промокода для редактирования:', error);
            this.showError('Ошибка загрузки промокода: ' + error.message);
        }
    }

    async updatePromoCode(id) {
        try {
            const promoData = {
                discount: parseInt(document.getElementById('editPromoDiscount').value),
                max_uses: document.getElementById('editPromoMaxUses').value ? parseInt(document.getElementById('editPromoMaxUses').value) : null,
                expiry_date: document.getElementById('editPromoExpiry').value || null,
                is_active: document.getElementById('editPromoActive').checked ? 1 : 0
            };

            // Валидация
            if (!promoData.discount || promoData.discount < 1 || promoData.discount > 100) {
                this.showError('❌ Скидка должна быть от 1% до 100%');
                return;
            }

            const result = await this.apiRequest(`/api/promo/${id}`, {
                method: 'PUT',
                body: JSON.stringify(promoData)
            });

            if (result.success) {
                this.showSuccess('Промокод обновлен!');
                // Закрываем модальное окно
                const modal = document.getElementById('editPromoModal');
                if (modal) {
                    modal.remove();
                }
                // Перезагружаем список промокодов
                this.loadPromoCodes();
            } else {
                this.showError('❌ Ошибка обновления промокода: ' + (result.message || 'Неизвестная ошибка'));
            }
        } catch (error) {
            console.error('Ошибка обновления промокода:', error);
            this.showError('❌ Ошибка обновления промокода: ' + error.message);
        }
    }

    // ==================== ОСНОВНЫЕ ФУНКЦИИ ====================

    async loadDashboard() {
        try {
            const [stats, bookings, events, systemInfo, backupInfo] = await Promise.all([
                this.apiRequest('/api/admin/stats').catch(() => ({})),
                this.apiRequest('/api/admin/bookings').catch(() => []),
                this.apiRequest('/api/admin/events').catch(() => []),
                this.apiRequest('/api/admin/system-info').catch(() => ({})),
                this.apiRequest('/api/admin/last-backup-info').catch(() => ({ success: true, backupInfo: null }))
            ]);

            const dashboardStats = { ...(stats || {}), ...(systemInfo || {}) };
            this.renderStats(dashboardStats);
            this.renderRecentBookings(Array.isArray(bookings) ? bookings.slice(0, 5) : []);
            this.renderUpcomingEvents(Array.isArray(events) ? events.filter(e => new Date(e.date) > new Date()).slice(0, 3) : []);
            this.renderBackupInfo(backupInfo?.backupInfo || null);
            
            // Загружаем график посетителей
            this.loadVisitorChart(30);

        } catch (error) {
            console.error('Ошибка загрузки дашборда:', error);
            this.showError('Ошибка загрузки дашборда');
            
            // Показываем заглушки при ошибке
            const statsGrid = document.getElementById('statsGrid');
            if (statsGrid) {
                statsGrid.innerHTML = '<div class="error-message">Данные временно недоступны</div>';
            }
        }
    }

    async loadEventsForSelect() {
        try {
            const events = await this.apiRequest('/api/events');
            
            const select = document.getElementById('eventSelect');
            
            if (!select) return;

            select.innerHTML = '<option value="">-- Выберите мероприятие --</option>';
            events.forEach(event => {
                const option = document.createElement('option');
                option.value = event.id;
                option.textContent = `${event.name} (${new Date(event.date).toLocaleDateString('ru-RU')})`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Ошибка загрузки мероприятий:', error);
            this.showError('Ошибка загрузки мероприятий');
        }
    }

    async loadEventSeats(eventId) {
        const container = document.getElementById('seatsContainer');
        
        if (!container) return;

        if (!eventId) {
            container.innerHTML = '<div class="loading">Выберите мероприятие для управления местами</div>';
            return;
        }

        container.innerHTML = '<div class="loading">Загрузка схемы зала...</div>';

        try {
            const seats = await this.apiRequest(`/api/seats/event/${eventId}`);
            this.renderSeatsGrid(seats, eventId);
        } catch (error) {
            console.error('Ошибка загрузки мест:', error);
            container.innerHTML = '<div class="error-message">❌ Ошибка загрузки мест</div>';
        }
    }

    renderSeatsGrid(seats, eventId) {
        const container = document.getElementById('seatsContainer');
        if (!container) return;
        
        if (!seats || seats.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #7f8c8d;">
                    🎪 Места не настроены
                    <br><small>Используйте форму выше для создания схемы зала</small>
                </div>
            `;
            return;
        }

        // Группируем места по рядам
        const rows = {};
        seats.forEach(seat => {
            const row = seat.seat_label.charAt(0);
            if (!rows[row]) {
                rows[row] = [];
            }
            rows[row].push(seat);
        });

        // Сортируем ряды
        const sortedRows = Object.keys(rows).sort();

        let html = `
            <div class="seats-controls">
                <button class="btn btn-secondary" onclick="admin.regenerateSeats(${eventId})">
                    🔄 Перегенерировать места
                </button>
                <button class="btn btn-warning" onclick="admin.clearAllSeats(${eventId})">
                    🗑️ Очистить все места
                </button>
            </div>

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
            
            <div style="text-align: center; margin: 1rem 0;">
                <div class="stage">
                    🎪 СЦЕНА
                </div>
            </div>
            
            <div class="seats-grid">
        `;

        sortedRows.forEach(row => {
            html += `<div class="seat-row">`;
            html += `<div class="row-label">Ряд ${row}</div>`;
            
            // Сортируем места в ряду
            rows[row].sort((a, b) => {
                const aNum = parseInt(a.seat_label.substring(1));
                const bNum = parseInt(b.seat_label.substring(1));
                return aNum - bNum;
            });
            
            rows[row].forEach(seat => {
                let statusClass = 'seat-standard';
                if (seat.status === 'occupied') {
                    statusClass = 'seat-occupied';
                } else if (seat.status === 'blocked') {
                    statusClass = 'seat-blocked';
                } else if (seat.category === 'vip') {
                    statusClass = 'seat-vip';
                }
                
                html += `
                    <div class="seat ${statusClass}" 
                         onclick="admin.editSeat(${seat.id}, '${seat.seat_label}', ${seat.price}, '${seat.category}', '${seat.status}')"
                         title="Место ${seat.seat_label} - ${this.getCategoryName(seat.category)} - ${seat.price} ₽ - ${this.getStatusName(seat.status)}">
                        ${seat.seat_label.substring(1)}
                    </div>
                `;
            });
            
            html += `</div>`;
        });

        html += `</div>`;
        
        // Сохраняем eventId для формы создания мест
        container.innerHTML = html;
        container.dataset.eventId = eventId;
    }

    getCategoryName(category) {
        const categories = {
            'standard': 'Стандарт',
            'vip': 'VIP'
        };
        return categories[category] || category;
    }

    getStatusName(status) {
        const statuses = {
            'free': 'Свободно',
            'occupied': 'Занято',
            'blocked': 'Заблокировано'
        };
        return statuses[status] || status;
    }

    formatDuration(seconds) {
        if (seconds === undefined || seconds === null || Number.isNaN(seconds)) {
            return 'Нет данных';
        }

        const totalSeconds = Math.max(0, Math.floor(seconds));
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        const parts = [];
        if (days > 0) {
            parts.push(`${days} д.`);
        }
        if (hours > 0) {
            parts.push(`${hours} ч.`);
        }

        if (minutes > 0 || parts.length === 0) {
            parts.push(`${minutes} мин.`);
        }

        return parts.join(' ');
    }

    editSeat(seatId, seatLabel, currentPrice, currentCategory, currentStatus) {
        const container = document.getElementById('seatsContainer');
        if (!container) return;
        
        const editorHtml = `
            <div class="seat-editor">
                <h4>✏️ Редактирование места ${seatLabel}</h4>
                <form id="editSeatForm">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div class="form-group">
                            <label for="editPrice">Цена (₽):</label>
                            <input type="number" id="editPrice" value="${currentPrice}" min="100" step="50" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="editCategory">Категория:</label>
                            <select id="editCategory" required>
                                <option value="standard" ${currentCategory === 'standard' ? 'selected' : ''}>Стандарт</option>
                                <option value="vip" ${currentCategory === 'vip' ? 'selected' : ''}>VIP</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="editStatus">Статус:</label>
                            <select id="editStatus" required>
                                <option value="free" ${currentStatus === 'free' ? 'selected' : ''}>Свободно</option>
                                <option value="occupied" ${currentStatus === 'occupied' ? 'selected' : ''}>Занято</option>
                                <option value="blocked" ${currentStatus === 'blocked' ? 'selected' : ''}>Заблокировано</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="margin-top: 1rem; display: flex; gap: 1rem; flex-wrap: wrap;">
                        <button type="submit" class="btn btn-success">💾 Сохранить</button>
                        <button type="button" class="btn btn-danger" onclick="admin.deleteSeat(${seatId})">🗑️ Удалить место</button>
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.seat-editor').remove()">❌ Отмена</button>
                    </div>
                </form>
            </div>
        `;
        
        // Удаляем предыдущий редактор
        const existingEditor = container.querySelector('.seat-editor');
        if (existingEditor) {
            existingEditor.remove();
        }
        
        container.insertAdjacentHTML('beforeend', editorHtml);
        
        // Назначаем обработчик формы
        const editForm = document.getElementById('editSeatForm');
        if (editForm) {
            editForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.updateSeat(seatId);
            });
        }
    }

    async updateSeat(seatId) {
        const editPrice = document.getElementById('editPrice');
        const editCategory = document.getElementById('editCategory');
        const editStatus = document.getElementById('editStatus');

        if (!editPrice || !editCategory || !editStatus) {
            this.showError('❌ Не найдены элементы формы редактирования');
            return;
        }

        const formData = {
            price: parseInt(editPrice.value),
            category: editCategory.value,
            status: editStatus.value
        };

        try {
            const result = await this.apiRequest(`/api/admin/seats/${seatId}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });

            if (result.success) {
                this.showSuccess('Место обновлено!');
                // Перезагружаем схему зала
                const eventSelect = document.getElementById('eventSelect');
                const eventId = eventSelect ? eventSelect.value : null;
                if (eventId) {
                    this.loadEventSeats(eventId);
                }
            } else {
                this.showError('❌ Ошибка обновления места');
            }
        } catch (error) {
            console.error('Ошибка обновления места:', error);
            this.showError('❌ Ошибка обновления места');
        }
    }

    async deleteSeat(seatId) {
        if (!confirm('Удалить это место? Это действие нельзя отменить.')) {
            return;
        }

        try {
            // Note: В вашем server.js нет эндпоинта для удаления отдельных мест
            // Вместо этого мы установим статус 'blocked'
            const result = await this.apiRequest(`/api/admin/seats/${seatId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    status: 'blocked',
                    price: 0
                })
            });

            if (result.success) {
                this.showSuccess('Место заблокировано!');
                const eventSelect = document.getElementById('eventSelect');
                const eventId = eventSelect ? eventSelect.value : null;
                if (eventId) {
                    this.loadEventSeats(eventId);
                }
            } else {
                this.showError('❌ Ошибка блокировки места');
            }
        } catch (error) {
            console.error('Ошибка блокировки места:', error);
            this.showError('❌ Ошибка блокировки места');
        }
    }

    async regenerateSeats(eventId) {
        if (!confirm('Перегенерировать все места? Текущая схема будет полностью удалена и создана заново.')) {
            return;
        }

        this.showSuccess('Места пересозданы!');
        this.loadEventSeats(eventId);
    }

    async clearAllSeats(eventId) {
        if (!confirm('Очистить все места? Все данные о местах и бронированиях будут удалены.')) {
            return;
        }

        try {
            // Note: В server.js нет прямого эндпоинта для очистки мест
            // Вместо этого создадим новую схему с 0 рядов
            const result = await this.apiRequest(`/api/admin/events/${eventId}/seats/bulk`, {
                method: 'POST',
                body: JSON.stringify({
                    rows: 0,
                    seatsPerRow: 0,
                    basePrice: 0,
                    vipRows: []
                })
            });

            if (result.success) {
                this.showSuccess('Все места очищены!');
                this.loadEventSeats(eventId);
            } else {
                this.showError('❌ Ошибка очистки мест');
            }
        } catch (error) {
            console.error('Ошибка очистки мест:', error);
            this.showError('❌ Ошибка очистки мест');
        }
    }

    async createBulkSeats() {
        const seatsContainer = document.getElementById('seatsContainer');
        const eventId = seatsContainer ? seatsContainer.dataset.eventId : null;
        
        if (!eventId) {
            this.showError('❌ Сначала выберите мероприятие');
            return;
        }

        const rowsCount = document.getElementById('rowsCount');
        const seatsPerRow = document.getElementById('seatsPerRow');
        const basePrice = document.getElementById('basePrice');
        const vipRows = document.getElementById('vipRows');

        if (!rowsCount || !seatsPerRow || !basePrice) {
            this.showError('❌ Не найдены необходимые элементы формы');
            return;
        }

        const seatsConfig = {
            rows: parseInt(rowsCount.value),
            seatsPerRow: parseInt(seatsPerRow.value),
            basePrice: parseInt(basePrice.value),
            vipRows: vipRows ? vipRows.value.split(',').map(Number).filter(n => !isNaN(n)) : [],
            vipMultiplier: 1.5
        };

        // Валидация
        if (!seatsConfig.rows || !seatsConfig.seatsPerRow || !seatsConfig.basePrice) {
            this.showError('❌ Заполните все обязательные поля');
            return;
        }

        if (seatsConfig.rows > 20 || seatsConfig.seatsPerRow > 20) {
            this.showError('❌ Слишком большое количество рядов или мест в ряду (максимум 20)');
            return;
        }

        await this.createSeatsBulk(eventId, seatsConfig);
    }

    async createSeatsBulk(eventId, seatsConfig) {
        try {
            const result = await this.apiRequest(`/api/admin/events/${eventId}/seats/bulk`, {
                method: 'POST',
                body: JSON.stringify(seatsConfig)
            });

            if (result.success) {
                this.showSuccess(result.message || 'Места успешно созданы!');
                // Перезагружаем схему зала
                this.loadEventSeats(eventId);
            } else {
                this.showError('❌ Ошибка создания мест');
            }
        } catch (error) {
            console.error('Ошибка создания мест:', error);
            this.showError('❌ Ошибка создания мест');
        }
    }

    async loadBookings() {
        try {
            const bookings = await this.apiRequest('/api/admin/bookings');
            this.renderAllBookings(bookings);
        } catch (error) {
            console.error('Ошибка загрузки бронирований:', error);
            this.showError('Ошибка загрузки бронирований');
        }
    }

    async loadEvents() {
        try {
            const events = await this.apiRequest('/api/admin/events');
            this.renderAllEvents(events);
        } catch (error) {
            console.error('Ошибка загрузки мероприятий:', error);
            this.showError('Ошибка загрузки мероприятий');
        }
    }

    async searchBookings(query) {
        try {
            const bookings = await this.apiRequest('/api/admin/bookings');
            const filteredBookings = bookings.filter(booking => 
                booking.customer_name.toLowerCase().includes(query.toLowerCase()) ||
                booking.event_name.toLowerCase().includes(query.toLowerCase()) ||
                booking.customer_phone.includes(query)
            );
            this.renderAllBookings(filteredBookings);
        } catch (error) {
            console.error('Ошибка поиска бронирований:', error);
        }
    }

    async filterEvents(filter) {
        try {
            const events = await this.apiRequest('/api/admin/events');
            const now = new Date();
            
            const filteredEvents = events.filter(event => {
                const eventDate = new Date(event.date);
                if (filter === 'upcoming') return eventDate > now;
                if (filter === 'past') return eventDate < now;
                return true;
            });

            this.renderAllEvents(filteredEvents);
        } catch (error) {
            console.error('Ошибка фильтрации мероприятий:', error);
        }
    }

    async createEvent() {
        const eventName = document.getElementById('eventName');
        const eventDate = document.getElementById('eventDate');
        const eventDescription = document.getElementById('eventDescription');
        const eventImage = document.getElementById('eventImage');
        const eventImageFile = document.getElementById('eventImageFile');
        const eventVenue = document.getElementById('eventVenue');
        const eventDuration = document.getElementById('eventDuration');

        if (!eventName || !eventDate || !eventVenue) {
            this.showError('❌ Не найдены необходимые элементы формы');
            return;
        }

        // Валидация
        if (!eventName.value || !eventDate.value || !eventVenue.value) {
            this.showError('❌ Заполните все обязательные поля');
            return;
        }

        // Защита от повторной отправки
        if (this.isSubmitting) {
            console.log('Уже выполняется отправка, игнорируем повторный вызов');
            return;
        }

        try {
            this.isSubmitting = true;

            // Формируем данные для отправки
            const eventData = {
                name: eventName.value,
                date: eventDate.value.replace('T', ' ') + ':00',
                description: eventDescription ? eventDescription.value : '',
                venue: eventVenue.value,
                duration: eventDuration ? parseInt(eventDuration.value) || 120 : 120
            };

            // Если указана ссылка на изображение, добавляем её
            if (eventImage && eventImage.value.trim()) {
                eventData.image_url = eventImage.value.trim();
            }

            const response = await fetch('/api/admin/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || result.message || `HTTP ${response.status}`);
            }

            if (result.success) {
                this.showSuccess('Мероприятие создано!');
                const createEventForm = document.getElementById('createEventForm');
                if (createEventForm) {
                    createEventForm.reset();
                    // Скрываем предпросмотр
                    const preview = document.getElementById('eventImagePreview');
                    if (preview) preview.style.display = 'none';
                }
                this.loadEvents();
                this.loadEventsForSelect();
                showSection('events');
            } else {
                this.showError('❌ Ошибка создания мероприятия: ' + (result.error || ''));
            }
        } catch (error) {
            console.error('Ошибка создания мероприятия:', error);
            this.showError('❌ Ошибка создания мероприятия: ' + error.message);
        } finally {
            this.isSubmitting = false;
        }
    }

    async deleteEvent(eventId) {
        if (!confirm('Удалить это мероприятие? Все связанные бронирования также будут удалены.')) {
            return;
        }

        try {
            const result = await this.apiRequest(`/api/admin/events/${eventId}`, {
                method: 'DELETE'
            });

            if (result.success) {
                this.showSuccess('Мероприятие удалено!');
                this.loadEvents();
                this.loadEventsForSelect();
            } else {
                this.showError('❌ Ошибка удаления мероприятия');
            }
        } catch (error) {
            console.error('Ошибка удаления мероприятия:', error);
            this.showError('❌ Ошибка удаления мероприятия');
        }
    }

    async exportBookings(format = 'csv') {
        try {
            const bookings = await this.apiRequest('/api/admin/bookings');
            
            if (!bookings || bookings.length === 0) {
                this.showError('❌ Нет данных для экспорта');
                return;
            }

            if (format === 'csv') {
                this.exportToCSV(bookings, 'bookings', [
                    'ID', 'Мероприятие', 'Гость', 'Телефон', 'Места', 'Сумма', 'Дата бронирования', 'Статус'
                ], (booking) => [
                    booking.id,
                    booking.event_name || 'Не указано',
                    booking.customer_name,
                    booking.customer_phone || 'Не указан',
                    booking.seat_labels,
                    booking.total_amount,
                    new Date(booking.booking_time).toLocaleString('ru-RU'),
                    this.getBookingStatusName(booking.status)
                ]);
            } else if (format === 'excel') {
                this.exportToExcel(bookings, 'bookings', [
                    'ID', 'Мероприятие', 'Гость', 'Телефон', 'Места', 'Сумма', 'Дата бронирования', 'Статус'
                ], (booking) => [
                    booking.id,
                    booking.event_name || 'Не указано',
                    booking.customer_name,
                    booking.customer_phone || 'Не указан',
                    booking.seat_labels,
                    booking.total_amount,
                    new Date(booking.booking_time).toLocaleString('ru-RU'),
                    this.getBookingStatusName(booking.status)
                ]);
            }
            
            this.showSuccess(`Экспорт завершен! (${format.toUpperCase()})`);
        } catch (error) {
            console.error('Ошибка экспорта:', error);
            this.showError('❌ Ошибка экспорта: ' + error.message);
        }
    }

    async exportEvents(format = 'csv') {
        try {
            const events = await this.apiRequest('/api/admin/events');
            
            if (!events || events.length === 0) {
                this.showError('❌ Нет данных для экспорта');
                return;
            }

            if (format === 'csv') {
                this.exportToCSV(events, 'events', [
                    'ID', 'Название', 'Дата и время', 'Площадка', 'Продано билетов', 'Выручка', 'Статус'
                ], (event) => {
                    const eventDate = new Date(event.date);
                    const now = new Date();
                    const status = eventDate > now ? 'Предстоящее' : 'Завершенное';
                    return [
                        event.id,
                        event.name,
                        new Date(event.date).toLocaleString('ru-RU'),
                        event.venue || 'Не указано',
                        event.tickets_sold || 0,
                        (event.total_revenue || 0).toLocaleString('ru-RU'),
                        status
                    ];
                });
            } else if (format === 'excel') {
                this.exportToExcel(events, 'events', [
                    'ID', 'Название', 'Дата и время', 'Площадка', 'Продано билетов', 'Выручка', 'Статус'
                ], (event) => {
                    const eventDate = new Date(event.date);
                    const now = new Date();
                    const status = eventDate > now ? 'Предстоящее' : 'Завершенное';
                    return [
                        event.id,
                        event.name,
                        new Date(event.date).toLocaleString('ru-RU'),
                        event.venue || 'Не указано',
                        event.tickets_sold || 0,
                        (event.total_revenue || 0).toLocaleString('ru-RU'),
                        status
                    ];
                });
            }
            
            this.showSuccess(`Экспорт завершен! (${format.toUpperCase()})`);
        } catch (error) {
            console.error('Ошибка экспорта:', error);
            this.showError('❌ Ошибка экспорта: ' + error.message);
        }
    }

    exportToCSV(data, filename, headers, rowMapper) {
        const csvRows = [];
        
        // Добавляем заголовки
        csvRows.push(headers.map(h => this.escapeCSV(h)).join(','));
        
        // Добавляем данные
        data.forEach(item => {
            const row = rowMapper(item);
            csvRows.push(row.map(cell => this.escapeCSV(cell)).join(','));
        });
        
        // Создаем BOM для правильного отображения кириллицы в Excel
        const csvContent = '\uFEFF' + csvRows.join('\n');
        
        // Создаем и скачиваем файл
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    exportToExcel(data, filename, headers, rowMapper) {
        // Используем библиотеку SheetJS для экспорта в Excel
        if (typeof XLSX === 'undefined') {
            // Если библиотека не загружена, загружаем её
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            script.onload = () => this.exportToExcel(data, filename, headers, rowMapper);
            script.onerror = () => {
                this.showError('❌ Не удалось загрузить библиотеку для экспорта в Excel. Попробуйте экспорт в CSV.');
            };
            document.head.appendChild(script);
            return;
        }

        // Создаем рабочую книгу
        const wb = XLSX.utils.book_new();
        
        // Подготавливаем данные
        const wsData = [];
        wsData.push(headers);
        
        data.forEach(item => {
            wsData.push(rowMapper(item));
        });
        
        // Создаем лист
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Настраиваем ширину колонок
        const colWidths = headers.map((_, i) => {
            const maxLength = Math.max(
                headers[i].length,
                ...data.map(item => {
                    const row = rowMapper(item);
                    return String(row[i] || '').length;
                })
            );
            return { wch: Math.min(maxLength + 2, 50) };
        });
        ws['!cols'] = colWidths;
        
        // Добавляем лист в книгу
        XLSX.utils.book_append_sheet(wb, ws, 'Данные');
        
        // Скачиваем файл
        XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    escapeCSV(value) {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Если значение содержит запятую, кавычки или перенос строки, оборачиваем в кавычки
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return '"' + stringValue.replace(/"/g, '""') + '"';
        }
        return stringValue;
    }

    renderStats(stats = {}) {
        const statsGrid = document.getElementById('statsGrid');
        if (!statsGrid) return;

        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${stats.total_bookings || 0}</div>
                <div class="stat-label">Всего бронирований</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${(stats.total_revenue || 0).toLocaleString()} ₽</div>
                <div class="stat-label">Общая выручка</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.total_events || 0}</div>
                <div class="stat-label">Мероприятий</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.used_tickets || 0}</div>
                <div class="stat-label">Использовано билетов</div>
            </div>
        `;
    }

    renderRecentBookings(bookings) {
        const container = document.getElementById('recentBookings');
        if (container) {
            this.renderBookingsTable(bookings.slice(0, 5), container);
        }
    }

    renderUpcomingEvents(events) {
        const container = document.getElementById('upcomingEvents');
        if (!container) return;
        
        if (!events || events.length === 0) {
            container.innerHTML = '<div class="no-data">Нет предстоящих мероприятий</div>';
            return;
        }

        container.innerHTML = `
            <div class="table-container">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Название</th>
                            <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Дата</th>
                            <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Продано билетов</th>
                            <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Выручка</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${events.map(event => `
                            <tr style="border-bottom: 1px solid #ecf0f1;">
                                <td style="padding: 1rem;">${event.name}</td>
                                <td style="padding: 1rem;">${new Date(event.date).toLocaleDateString('ru-RU')}</td>
                                <td style="padding: 1rem;">${event.tickets_sold || 0}</td>
                                <td style="padding: 1rem;">${(event.total_revenue || 0).toLocaleString()} ₽</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderBackupInfo(backupInfo) {
        const container = document.getElementById('backupInfo');
        if (!container) return;
        
        if (!backupInfo) {
            container.innerHTML = `
                <div class="table-container" style="background: #fff3cd; border-left: 4px solid #ffc107;">
                    <div style="padding: 1.5rem;">
                        <h3 style="margin: 0 0 0.5rem 0; color: #856404;">💾 Резервное копирование</h3>
                        <p style="margin: 0; color: #856404;">Бэкап еще не был загружен</p>
                    </div>
                </div>
            `;
            return;
        }

        const importDate = backupInfo.importDate ? new Date(backupInfo.importDate) : null;
        const exportDate = backupInfo.exportDate ? new Date(backupInfo.exportDate) : null;
        
        const importDateStr = importDate ? importDate.toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Неизвестно';
        
        const exportDateStr = exportDate ? exportDate.toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'Неизвестно';

        container.innerHTML = `
            <div class="table-container" style="background: #d4edda; border-left: 4px solid #27ae60;">
                <div style="padding: 1.5rem;">
                    <h3 style="margin: 0 0 1rem 0; color: #155724; display: flex; align-items: center; gap: 0.5rem;">
                        💾 Последний загруженный бэкап
                    </h3>
                    <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.75rem 1rem; color: #155724;">
                        <div style="font-weight: 600;">Файл:</div>
                        <div style="font-family: monospace; background: rgba(255,255,255,0.7); padding: 0.25rem 0.5rem; border-radius: 4px;">${backupInfo.filename || 'Неизвестно'}</div>
                        
                        <div style="font-weight: 600;">Загружен:</div>
                        <div>${importDateStr}</div>
                        
                        ${exportDate ? `
                            <div style="font-weight: 600;">Дата экспорта:</div>
                            <div>${exportDateStr}</div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderAllBookings(bookings) {
        const container = document.getElementById('allBookings');
        if (container) {
            this.renderBookingsTable(bookings, container);
        }
    }

    renderBookingsTable(bookings, container) {
        if (!bookings || bookings.length === 0) {
            container.innerHTML = '<div class="no-data">Бронирований нет</div>';
            return;
        }

        container.innerHTML = `
            <div class="table-container">
                <table class="data-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">ID</th>
                            <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Мероприятие</th>
                            <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Гость</th>
                            <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Телефон</th>
                            <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Места</th>
                            <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Сумма</th>
                            <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Оплата</th>
                            <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Дата брони</th>
                            <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Статус</th>
                            <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bookings.map(booking => `
                            <tr style="border-bottom: 1px solid #ecf0f1;">
                                <td style="padding: 1rem;">${booking.id}</td>
                                <td style="padding: 1rem;">${booking.event_name || 'Не указано'}</td>
                                <td style="padding: 1rem;">${booking.customer_name}</td>
                                <td style="padding: 1rem;">${booking.customer_phone || 'Не указан'}</td>
                                <td style="padding: 1rem;">${booking.seat_labels}</td>
                                <td style="padding: 1rem;">${booking.total_amount} ₽</td>
                                <td style="padding: 1rem;">
                                    ${(booking.payment_method || 'card') === 'cash' ? '💵 Наличные' : '💳 Карта'}
                                </td>
                                <td style="padding: 1rem;">${new Date(booking.booking_time).toLocaleString('ru-RU')}</td>
                                <td style="padding: 1rem;">
                                    <span class="status-badge status-${booking.status || 'active'}">
                                        ${this.getBookingStatusName(booking.status)}
                                    </span>
                                </td>
                                <td style="padding: 1rem;">
                                    <div class="action-buttons">
                                        <button class="btn btn-sm btn-info" onclick="admin.viewBookingDetails('${booking.id}')">
                                            👁️
                                        </button>
                                        ${booking.status === 'active' ? `
                                            <button class="btn btn-sm btn-success" onclick="admin.markBookingUsed('${booking.id}')">
                                                ✅
                                            </button>
                                        ` : ''}
                                        <button class="btn btn-sm btn-danger" onclick="admin.cancelBooking('${booking.id}')">
                                            ❌
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="mobile-cards" style="display: none;">
                ${bookings.map(booking => `
                    <div class="mobile-card" style="background: white; border: 1px solid #ecf0f1; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <strong style="color: #2c3e50;">Бронирование #${booking.id}</strong>
                            <span class="status-badge status-${booking.status || 'active'}" style="font-size: 0.8rem;">
                                ${this.getBookingStatusName(booking.status)}
                            </span>
                        </div>
                        <div style="margin-bottom: 0.5rem;"><strong>Мероприятие:</strong> ${booking.event_name || 'Не указано'}</div>
                        <div style="margin-bottom: 0.5rem;"><strong>Гость:</strong> ${booking.customer_name}</div>
                        <div style="margin-bottom: 0.5rem;"><strong>Телефон:</strong> ${booking.customer_phone || 'Не указан'}</div>
                        <div style="margin-bottom: 0.5rem;"><strong>Места:</strong> ${booking.seat_labels}</div>
                        <div style="margin-bottom: 0.5rem;"><strong>Сумма:</strong> ${booking.total_amount} ₽</div>
                        <div style="margin-bottom: 0.5rem;"><strong>Оплата:</strong> ${(booking.payment_method || 'card') === 'cash' ? '💵 Наличные' : '💳 Карта'}</div>
                        <div style="margin-bottom: 1rem;"><strong>Дата:</strong> ${new Date(booking.booking_time).toLocaleString('ru-RU')}</div>
                        <div class="action-buttons" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <button class="btn btn-sm btn-info" onclick="admin.viewBookingDetails('${booking.id}')">
                                👁️ Просмотр
                            </button>
                            ${booking.status === 'active' ? `
                                <button class="btn btn-sm btn-success" onclick="admin.markBookingUsed('${booking.id}')">
                                    ✅ Использовать
                                </button>
                            ` : ''}
                            <button class="btn btn-sm btn-danger" onclick="admin.cancelBooking('${booking.id}')">
                                ❌ Отменить
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getBookingStatusName(status) {
        const statuses = {
            'active': 'Активен',
            'used': 'Использован',
            'cancelled': 'Отменен'
        };
        return statuses[status] || status;
    }

    renderAllEvents(events) {
        const container = document.getElementById('allEvents');
        if (!container) return;
        
        if (!events || events.length === 0) {
            container.innerHTML = '<div class="no-data">Мероприятий нет</div>';
            return;
        }

        container.innerHTML = `
            <div class="table-container">
                <table class="data-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Название</th>
                            <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Дата и время</th>
                            <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Площадка</th>
                            <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Продано билетов</th>
                            <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Выручка</th>
                            <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Статус</th>
                            <th style="padding: 1rem; text-align: left; background: #2c3e50; color: white;">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${events.map(event => {
                            const eventDate = new Date(event.date);
                            const now = new Date();
                            const isPast = eventDate < now;
                            const status = isPast ? 'past' : 'upcoming';
                            
                            return `
                                <tr style="border-bottom: 1px solid #ecf0f1;">
                                    <td style="padding: 1rem;">
                                        <div class="event-title">${event.name}</div>
                                        <div class="event-description">${event.description || 'Нет описания'}</div>
                                    </td>
                                    <td style="padding: 1rem;">${eventDate.toLocaleString('ru-RU')}</td>
                                    <td style="padding: 1rem;">${event.venue || 'Не указана'}</td>
                                    <td style="padding: 1rem;">
                                        <div>${event.tickets_sold || 0}</div>
                                    </td>
                                    <td style="padding: 1rem;">${(event.total_revenue || 0).toLocaleString()} ₽</td>
                                    <td style="padding: 1rem;">
                                        <span class="status-badge status-${status}">
                                            ${status === 'past' ? 'Завершено' : 'Предстоящее'}
                                        </span>
                                    </td>
                                    <td style="padding: 1rem;">
                                        <div class="action-buttons">
                                            <button class="btn btn-sm btn-info" onclick="admin.viewEventDetails(${event.id})">
                                                👁️
                                            </button>
                                            <button class="btn btn-sm btn-warning" onclick="admin.editEvent(${event.id})">
                                                ✏️
                                            </button>
                                            <button class="btn btn-sm btn-danger delete-event-btn" data-id="${event.id}">
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async viewBookingDetails(bookingId) {
        try {
            const booking = await this.apiRequest(`/api/ticket/${bookingId}`);
            
            if (booking.valid) {
                this.showBookingModal(booking.ticket);
            } else {
                this.showError('Бронирование не найдено');
            }
        } catch (error) {
            console.error('Ошибка загрузки деталей бронирования:', error);
            this.showError('Ошибка загрузки деталей бронирования');
        }
    }

    async markBookingUsed(bookingId) {
        try {
            const result = await this.apiRequest(`/api/ticket/${bookingId}/use`, {
                method: 'POST'
            });

            if (result.success) {
                this.showSuccess('Бронирование отмечено как использованное!');
                this.loadBookings();
                this.loadDashboard();
            } else {
                this.showError('❌ Ошибка обновления бронирования');
            }
        } catch (error) {
            console.error('Ошибка обновления бронирования:', error);
            this.showError('❌ Ошибка обновления бронирования');
        }
    }

    async cancelBooking(bookingId) {
        if (!confirm('Удалить это бронирование? Места будут освобождены. Это действие нельзя отменить.')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/bookings/${bookingId}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('✅ Бронирование удалено!');
                this.loadBookings();
                this.loadDashboard();
            } else {
                this.showError('❌ Ошибка: ' + (result.error || result.message || 'Не удалось удалить бронирование'));
            }
        } catch (error) {
            console.error('Ошибка удаления бронирования:', error);
            this.showError('❌ Ошибка удаления бронирования');
        }
    }

    async viewEventDetails(eventId) {
        try {
            const event = await this.apiRequest(`/api/events/${eventId}`);
            this.showEventModal(event);
        } catch (error) {
            console.error('Ошибка загрузки деталей мероприятия:', error);
            this.showError('Ошибка загрузки деталей мероприятия');
        }
    }

    async editEvent(eventId) {
        try {
            console.log('🔄 Редактирование мероприятия:', eventId);
            
            // Загружаем данные мероприятия
            const event = await this.apiRequest(`/api/events/${eventId}`);
            
            // Форматируем дату для datetime-local input
            const eventDate = new Date(event.date);
            const formattedDate = new Date(eventDate.getTime() - eventDate.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            
            // Создаем модальное окно с формой редактирования
            const modalHtml = `
                <div class="modal-overlay" id="editEventModal" onclick="if(event.target === this) this.remove()">
                    <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 700px;">
                        <div class="modal-header">
                            <h3>✏️ Редактирование мероприятия</h3>
                            <button class="modal-close" onclick="document.getElementById('editEventModal').remove()">×</button>
                        </div>
                        <div class="modal-body">
                            <form id="editEventForm">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                                    <div class="form-group">
                                        <label for="editEventName">Название мероприятия *</label>
                                        <input type="text" id="editEventName" value="${this.escapeHtml(event.name)}" required>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="editEventDate">Дата и время *</label>
                                        <input type="datetime-local" id="editEventDate" value="${formattedDate}" required>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="editEventVenue">Площадка *</label>
                                        <input type="text" id="editEventVenue" value="${this.escapeHtml(event.venue || '')}" required>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="editEventDuration">Продолжительность (минуты)</label>
                                        <input type="number" id="editEventDuration" value="${event.duration || 120}" min="30" max="480">
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="editEventDescription">Описание мероприятия</label>
                                    <textarea id="editEventDescription" rows="4">${this.escapeHtml(event.description || '')}</textarea>
                                </div>
                                
                                <div class="form-group">
                                    <label for="editEventImageFile">Загрузить новое изображение</label>
                                    <input type="file" id="editEventImageFile" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp">
                                    <small style="color: #666; display: block; margin-top: 0.5rem;">Или укажите ссылку/название файла ниже</small>
                                </div>
                                <div class="form-group">
                                    <label for="editEventImage">Ссылка на изображение или название файла</label>
                                    <input type="text" id="editEventImage" value="${this.escapeHtml(event.image_url || '')}" placeholder="https://example.com/image.jpg или concert.jpg">
                                    <small style="color: #666;">Можно указать URL из интернета (https://...) или название файла из /public/images/. Если загружаете файл выше, это поле можно оставить пустым.</small>
                                </div>
                                <div id="editEventImagePreview" style="margin-top: 1rem; display: ${event.image_url ? 'block' : 'none'};">
                                    <label>Текущее изображение:</label>
                                    <img id="editEventImagePreviewImg" src="${event.image_url && event.image_url.startsWith('http') ? event.image_url : '/images/' + event.image_url}" alt="Текущее изображение" style="max-width: 300px; max-height: 200px; border-radius: 8px; margin-top: 0.5rem; border: 2px solid #ddd;" onerror="this.style.display='none'">
                                </div>
                                
                                <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: flex-end;">
                                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('editEventModal').remove()">❌ Отмена</button>
                                    <button type="submit" class="btn btn-success">💾 Сохранить изменения</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            
            // Удаляем предыдущее модальное окно если есть
            const existingModal = document.getElementById('editEventModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Добавляем модальное окно
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Назначаем обработчик формы
            const editForm = document.getElementById('editEventForm');
            if (editForm) {
                editForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.updateEvent(eventId);
                });
            }
            
            // Обработчик предпросмотра изображения при выборе файла
            const editEventImageFile = document.getElementById('editEventImageFile');
            if (editEventImageFile) {
                editEventImageFile.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const preview = document.getElementById('editEventImagePreview');
                            const previewImg = document.getElementById('editEventImagePreviewImg');
                            if (preview && previewImg) {
                                previewImg.src = e.target.result;
                                preview.style.display = 'block';
                                preview.querySelector('label').textContent = 'Новое изображение:';
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки мероприятия для редактирования:', error);
            this.showError('Ошибка загрузки мероприятия: ' + error.message);
        }
    }

    async updateEvent(eventId) {
        try {
            const eventName = document.getElementById('editEventName');
            const eventDate = document.getElementById('editEventDate');
            const eventDescription = document.getElementById('editEventDescription');
            const eventImage = document.getElementById('editEventImage');
            const eventImageFile = document.getElementById('editEventImageFile');
            const eventVenue = document.getElementById('editEventVenue');
            const eventDuration = document.getElementById('editEventDuration');

            // Валидация
            if (!eventName.value || !eventDate.value || !eventVenue.value) {
                this.showError('❌ Заполните все обязательные поля');
                return;
            }

            // Создаем FormData для поддержки загрузки файлов
            const formData = new FormData();
            formData.append('name', eventName.value);
            formData.append('date', eventDate.value.replace('T', ' ') + ':00');
            formData.append('description', eventDescription ? eventDescription.value : '');
            formData.append('venue', eventVenue.value);
            formData.append('duration', parseInt(eventDuration.value) || 120);
            
            // Если выбран новый файл, добавляем его
            if (eventImageFile && eventImageFile.files.length > 0) {
                formData.append('image', eventImageFile.files[0]);
            }
            
            // Если указана ссылка на изображение, добавляем её
            if (eventImage && eventImage.value.trim()) {
                formData.append('image_url', eventImage.value.trim());
            }

            const response = await fetch(`/api/admin/events/${eventId}`, {
                method: 'PUT',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Мероприятие обновлено!');
                // Закрываем модальное окно
                const modal = document.getElementById('editEventModal');
                if (modal) {
                    modal.remove();
                }
                // Перезагружаем список мероприятий
                this.loadEvents();
                this.loadEventsForSelect();
            } else {
                this.showError('❌ Ошибка обновления мероприятия');
            }
        } catch (error) {
            console.error('Ошибка обновления мероприятия:', error);
            this.showError('❌ Ошибка обновления мероприятия: ' + error.message);
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==================== НАСТРОЙКИ БИЛЕТОВ ====================
    
    async loadTicketSettings() {
        try {
            const result = await this.apiRequest('/api/admin/ticket-type');
            if (result.success) {
                const ticketTypeOld = document.getElementById('ticketTypeOld');
                const ticketTypeNew = document.getElementById('ticketTypeNew');
                
                if (ticketTypeOld && ticketTypeNew) {
                    if (result.ticketType === 'old') {
                        ticketTypeOld.checked = true;
                    } else {
                        ticketTypeNew.checked = true;
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки настроек билетов:', error);
            this.showError('Ошибка загрузки настроек билетов');
        }
    }

    async saveTicketType() {
        try {
            const ticketTypeOld = document.getElementById('ticketTypeOld');
            const ticketTypeNew = document.getElementById('ticketTypeNew');
            const statusDiv = document.getElementById('ticketTypeStatus');
            
            let selectedType = null;
            if (ticketTypeOld && ticketTypeOld.checked) {
                selectedType = 'old';
            } else if (ticketTypeNew && ticketTypeNew.checked) {
                selectedType = 'new';
            }
            
            if (!selectedType) {
                if (statusDiv) {
                    statusDiv.innerHTML = '<div class="error-message">Выберите тип билета</div>';
                }
                return;
            }
            
            const result = await this.apiRequest('/api/admin/ticket-type', {
                method: 'POST',
                body: JSON.stringify({ ticketType: selectedType })
            });
            
            if (result.success) {
                this.showSuccess('Тип билета успешно сохранен!');
                if (statusDiv) {
                    statusDiv.innerHTML = `<div style="color: #27ae60; padding: 0.5rem; background: #d4edda; border-radius: 4px; border: 1px solid #c3e6cb;">
                        ✅ Тип билета установлен: ${selectedType === 'old' ? 'Старый дизайн' : 'Новый дизайн'}
                    </div>`;
                }
            } else {
                throw new Error(result.error || 'Ошибка сохранения');
            }
        } catch (error) {
            console.error('Ошибка сохранения типа билета:', error);
            this.showError('Ошибка сохранения типа билета: ' + error.message);
        }
    }

    // ==================== СТАТИСТИКА ПОСЕТИТЕЛЕЙ ====================

    async loadVisitorChart(days = 30) {
        try {
            const chartData = await this.apiRequest(`/api/admin/visitor-stats/chart?days=${days}`);

            const canvas = document.getElementById('visitorChart');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');

            // Уничтожаем предыдущий график если есть
            if (this.visitorChart) {
                this.visitorChart.destroy();
                this.visitorChart = null;
            }

            // Проверяем, есть ли уже график на этом канвасе
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                existingChart.destroy();
            }

            const labels = chartData.map(item => {
                const date = new Date(item.date);
                return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
            });
            
            const uniqueVisitors = chartData.map(item => item.unique_visitors || 0);
            const totalSessions = chartData.map(item => item.total_sessions || 0);

            this.visitorChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Уникальные посетители',
                            data: uniqueVisitors,
                            borderColor: '#3498db',
                            backgroundColor: 'rgba(52, 152, 219, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            pointBackgroundColor: '#3498db',
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
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            titleFont: {
                                size: 14,
                                weight: 'bold'
                            },
                            bodyFont: {
                                size: 13
                            },
                            displayColors: true,
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.parsed.y + ' чел.';
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
                                    size: 12
                                }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            title: {
                                display: true,
                                text: 'Количество посетителей',
                                font: {
                                    size: 13,
                                    weight: '600'
                                }
                            }
                        },
                        x: {
                            ticks: {
                                font: {
                                    size: 11
                                },
                                maxRotation: 45,
                                minRotation: 45
                            },
                            grid: {
                                display: false
                            },
                            title: {
                                display: true,
                                text: 'Дата',
                                font: {
                                    size: 13,
                                    weight: '600'
                                }
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
        } catch (error) {
            console.error('❌ Ошибка загрузки графика:', error);
            this.showError('Ошибка загрузки графика: ' + error.message);
        }
    }

    showBookingModal(booking) {
        const modalHtml = `
            <div class="modal-overlay" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>Детали бронирования #${booking.id}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Мероприятие:</label>
                                <span>${booking.event}</span>
                            </div>
                            <div class="info-item">
                                <label>Гость:</label>
                                <span>${booking.customer}</span>
                            </div>
                            <div class="info-item">
                                <label>Дата мероприятия:</label>
                                <span>${new Date(booking.eventDate).toLocaleString('ru-RU')}</span>
                            </div>
                            <div class="info-item">
                                <label>Места:</label>
                                <span>${booking.seats}</span>
                            </div>
                            <div class="info-item">
                                <label>Общая сумма:</label>
                                <span>${booking.total} ₽</span>
                            </div>
                            <div class="info-item">
                                <label>Дата бронирования:</label>
                                <span>${new Date(booking.bookingTime).toLocaleString('ru-RU')}</span>
                            </div>
                            <div class="info-item">
                                <label>Статус:</label>
                                <span class="status-badge status-${booking.status}">${this.getBookingStatusName(booking.status)}</span>
                            </div>
                            <div class="info-item">
                                <label>Льготная категория:</label>
                                <span>${booking.discountCategory || 'Стандартный'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    showEventModal(event) {
        const eventDate = new Date(event.date);
        const modalHtml = `
            <div class="modal-overlay" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>${event.name}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Дата и время:</label>
                                <span>${eventDate.toLocaleString('ru-RU')}</span>
                            </div>
                            <div class="info-item">
                                <label>Площадка:</label>
                                <span>${event.venue || 'Не указана'}</span>
                            </div>
                            <div class="info-item">
                                <label>Продолжительность:</label>
                                <span>${event.duration || 120} минут</span>
                            </div>
                            <div class="info-item full-width">
                                <label>Описание:</label>
                                <p>${event.description || 'Нет описания'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // Утилиты для уведомлений
    showSuccess(message) {
        if (window.toastManager) {
            window.toastManager.success(message);
        } else {
            this.showNotification(message, 'success');
        }
    }

    showError(message) {
        if (window.toastManager) {
            window.toastManager.error(message);
        } else {
            this.showNotification(message, 'error');
        }
    }

    showNotification(message, type = 'info') {
        if (window.toastManager) {
            window.toastManager.show(message, type);
        } else {
            // Fallback для старых уведомлений
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <span class="notification-message">${message}</span>
                    <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // Автоматическое удаление через 5 секунд
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 5000);
        }
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('✅ Service Worker зарегистрирован:', registration);
                    // После регистрации, добавим обработчик для запроса уведомлений при первом взаимодействии
                    this.setupNotificationRequest();
                })
                .catch(error => {
                    console.error('❌ Ошибка регистрации Service Worker:', error);
                });
        } else {
            console.log('❌ Service Worker не поддерживается');
        }
    }

    setupNotificationRequest() {
        // Показываем кнопку уведомлений, если разрешение не получено
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn && Notification.permission === 'default') {
            notificationBtn.style.display = 'block';
        }

        // Запрашиваем разрешение при первом взаимодействии пользователя (для iOS)
        const requestPermission = async () => {
            console.log('🔄 Запрос разрешения на уведомления...');
            if ('Notification' in window && Notification.permission === 'default') {
                try {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        console.log('✅ Разрешение на уведомления получено');
                        this.showNotification('✅ Уведомления включены', 'info');
                        if (notificationBtn) notificationBtn.style.display = 'none';
                    } else {
                        console.log('❌ Разрешение на уведомления отклонено');
                        this.showNotification('❌ Уведомления отклонены', 'warning');
                    }
                } catch (error) {
                    console.error('Ошибка запроса разрешения на уведомления:', error);
                }
            }
            // Удаляем обработчик после первого запроса
            document.removeEventListener('click', requestPermission);
            document.removeEventListener('touchstart', requestPermission);
        };

        if (Notification.permission === 'default') {
            document.addEventListener('click', requestPermission, { once: true });
            document.addEventListener('touchstart', requestPermission, { once: true });
        }
    }

    async requestNotificationPermission() {
        console.log('🔄 Ручной запрос разрешения на уведомления...');
        if ('Notification' in window) {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    console.log('✅ Разрешение на уведомления получено');
                    this.showNotification('✅ Уведомления включены', 'info');
                    const notificationBtn = document.getElementById('notificationBtn');
                    if (notificationBtn) notificationBtn.style.display = 'none';
                } else {
                    console.log('❌ Разрешение на уведомления отклонено');
                    this.showNotification('❌ Уведомления отклонены', 'warning');
                }
            } catch (error) {
                console.error('Ошибка запроса разрешения на уведомления:', error);
            }
        } else {
            this.showNotification('❌ Уведомления не поддерживаются', 'error');
        }
    }

    showPushNotification(title, body, data = {}) {
        if ('serviceWorker' in navigator && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                navigator.serviceWorker.ready.then(registration => {
                    registration.active.postMessage({
                        type: 'SHOW_NOTIFICATION',
                        title: title,
                        body: body,
                        data: data
                    });
                });
            } else {
                console.log('Разрешение на уведомления не получено');
            }
        }
    }
}

// Глобальные функции
function showSection(sectionId) {
    // Скрыть все секции
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Убрать активный класс со всех кнопок
    document.querySelectorAll('.admin-nav button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Показать выбранную секцию
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Добавить активный класс к кнопке (если есть event)
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Находим кнопку по data-section или onclick
        const button = document.querySelector(`button[onclick*="showSection('${sectionId}')"], button[data-section="${sectionId}"]`);
        if (button) {
            button.classList.add('active');
        }
    }
    
    // Загрузить данные для конкретной секции
    if (window.admin) {
        switch(sectionId) {
            case 'dashboard':
                admin.loadDashboard();
                break;
            case 'bookings':
                admin.loadBookings();
                break;
            case 'events':
                admin.loadEvents();
                break;
            case 'promoCodes':
                console.log('🔄 Загрузка секции промокодов...');
                admin.loadPromoCodes();
                break;
            case 'discountCategories':
                console.log('🔄 Загрузка секции льготных категорий...');
                admin.loadDiscountCategories();
                break;
            case 'seatsManagement':
                admin.loadEventsForSelect();
                break;
        }
    }
}

// Инициализация при загрузке страницы
console.log('🎯 Начало инициализации AdminPanel');
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM загружен, создаем AdminPanel');
    try {
        window.admin = new AdminPanel();
        console.log('✅ AdminPanel создан:', window.admin);
    } catch (error) {
        console.error('❌ Ошибка создания AdminPanel:', error);
    }
});

console.log('✅ admin.js полностью загружен');