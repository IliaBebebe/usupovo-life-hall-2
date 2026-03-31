const API_BASE = '/api';

// Приветствие для Саши в консоль браузера
(function() {
    console.log('%c', 'font-size: 1px;');
    console.log('%c╔═════════════════════════════════════════════════╗', 'color: #e74c3c; font-weight: bold;');
    console.log('%c║                                                 ║', 'color: #e74c3c; font-weight: bold;');
    console.log('%c║    ██████╗ ██████╗ ██╗██╗   ██╗███████╗████████╗║', 'color: #e74c3c; font-weight: bold;');
    console.log('%c║    ██╔══██╗██╔══██╗██║██║   ██║██╔════╝╚══██╔══╝║', 'color: #e74c3c; font-weight: bold;');
    console.log('%c║    ██████╔╝██████╔╝██║██║   ██║█████╗     ██║   ║', 'color: #e74c3c; font-weight: bold;');
    console.log('%c║    ██╔═══╝ ██╔══██╗██║╚██╗ ██╔╝██╔══╝     ██║   ║', 'color: #e74c3c; font-weight: bold;');
    console.log('%c║    ██║     ██║  ██║██║ ╚████╔╝ ███████╗   ██║   ║', 'color: #e74c3c; font-weight: bold;');
    console.log('%c║    ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝  ╚══════╝   ╚═╝   ║', 'color: #e74c3c; font-weight: bold;');
    console.log('%c║                                                 ║', 'color: #e74c3c; font-weight: bold;');
    console.log('%c║    ███████╗ █████╗ ███████╗██╗  ██╗ █████╗      ║', 'color: #e74c3c; font-weight: bold;');
    console.log('%c║    ██╔════╝██╔══██╗██╔════╝██║  ██║██╔══██╗     ║', 'color: #e74c3c; font-weight: bold;');
    console.log('%c║    ███████╗███████║███████╗███████║███████║     ║', 'color: #e74c3c; font-weight: bold;');
    console.log('%c║    ╚════██║██╔══██║╚════██║██╔══██║██╔══██║     ║', 'color: #e74c3c; font-weight: bold;');
    console.log('%c║    ███████║██║  ██║███████║██║  ██║██║  ██║     ║', 'color: #e74c3c; font-weight: bold;');
    console.log('%c║    ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝     ║', 'color: #e74c3c; font-weight: bold;');
    console.log('%c║                                                 ║', 'color: #e74c3c; font-weight: bold;');
    console.log('%c╚═════════════════════════════════════════════════╝', 'color: #e74c3c; font-weight: bold;');
    console.log('');
    console.log('%c╔═══════════════════════════════════════════════╗', 'color: #9b59b6; font-weight: bold;');
    console.log('%c║                                               ║', 'color: #9b59b6; font-weight: bold;');
    console.log('%c║  ╔══════════════════════════════════════════╗ ║', 'color: #9b59b6; font-weight: bold;');
    console.log('%c║  ║                                          ║ ║', 'color: #9b59b6; font-weight: bold;');
    console.log('%c║  ║  Я знал, что ты сюда заглянешь... 🌐👀  ║ ║', 'color: #f39c12; font-size: 16px; font-weight: bold;');
    console.log('%c║  ║                                          ║ ║', 'color: #9b59b6; font-weight: bold;');
    console.log('%c║  ╚══════════════════════════════════════════╝ ║', 'color: #9b59b6; font-weight: bold;');
    console.log('%c║                                               ║', 'color: #9b59b6; font-weight: bold;');
    console.log('%c╚═══════════════════════════════════════════════╝', 'color: #9b59b6; font-weight: bold;');
    console.log('');
})();

const App = {
     lastBookingData: null,
     paymentButtonClicked: false,
     selectedDiscountCategory: null,
    init() {
        this.setupEventListeners();
        this.loadEventsFromAPI();
    },
    setupEventListeners() {
        const closeButton = document.querySelector('.close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.closeModal();
            });
        } 
        
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('bookingModal');
            if (event.target === modal) {
                this.closeModal();
            }
        });
    },
    
    async loadEventsFromAPI() {
        try {
            const response = await fetch(`${API_BASE}/events`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const events = await response.json();
            this.displayEvents(events);

        } catch (error) {
            console.error('Ошибка загрузки мероприятий:', error);
            // Показываем сообщение что мероприятий нет
            const container = document.getElementById('eventsContainer');
            if (container) {
                container.innerHTML = `
                    <div class="no-events">
                        <p>⚠️ В данный момент мероприятий нет</p>
                        <p class="no-events-subtitle">Заходите позже!</p>
                    </div>
                `;
            }
        }
    },
    displayEvents(events) {
        const container = document.getElementById('eventsContainer');
        if (!container) {
            console.error('Контейнер eventsContainer не найден!');
            return;
        }
        window.allEvents = events;
        if (!events || events.length === 0) {
            container.innerHTML = `
                <div class="loading">
                    <p>🎭 Мероприятий пока нет</p>
                    <p><small>Скоро появится что-то интересное!</small></p>
                </div>
            `;
            return;
        }
        container.innerHTML = events.map(event => `
            <div class="event-card" data-event-id="${event.id}">
                <div class="event-image">
                    ${event.image_url ?
                        `<img src="${event.image_url.startsWith('http://') || event.image_url.startsWith('https://') ? event.image_url : 'images/' + event.image_url}" alt="${this.escapeHtml(event.name)}"
                              style="width:100%;height:100%;object-fit:cover;"
                              onerror="this.style.display='none'">` :
                        '<div style="display:flex;align-items:center;justify-content:center;height:100%;">🎭</div>'
                    }
                </div>
                <div class="event-info">
                    <h3>${this.escapeHtml(event.name)}</h3>
                    <div class="event-date">${this.formatDate(event.date)}</div>
                    <p>${this.escapeHtml(event.description) || 'Описание скоро появится...'}</p>
                    <button class="book-button" onclick="App.showEventDetails(${event.id})">
                        🎫 Купить билет
                    </button>
                </div>
            </div>
        `).join('');
    },

    // XSS защита - экранирование HTML
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit', 
            minute: '2-digit'
        });

    },
    
    async openBookingModal(eventId) {
        this.currentEventId = eventId;
        if (!this.currentEventName) {
            try {
                const events = await fetch(`${API_BASE}/events`).then(r => r.json());
                const event = events.find(e => e.id === eventId);
                if (event) {
                    this.currentEventName = event.name;
                }
            } catch (error) {
                console.error('Ошибка загрузки названия мероприятия:', error);
            }
        }
        this.selectedSeats = new Map();
        this.selectedDiscountCategory = null;
        
        const modal = document.getElementById('bookingModal');
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 3rem;">⏳</div>
                <p>Загружаем схему зала...</p>
            </div>
        `;
        
        modal.style.display = 'block';
        
        try {
            const response = await fetch(`${API_BASE}/seats/event/${eventId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const seats = await response.json();
            const events = await fetch(`${API_BASE}/events`).then(r => r.json());
            const event = events.find(e => e.id === eventId);
            
            if (event) {
                this.currentEventName = event.name;
            }
            
            this.showBookingForm(event, seats);
            
        } catch (error) {
            console.error('Ошибка загрузки мест:', error);
            this.showBookingError('Не удалось загрузить схему зала. Попробуйте позже.');
        }
    },
    showBookingForm(event, seats) {
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = `
            <div style="max-height: 70vh; overflow-y: auto;">
                <h3 style="margin-bottom: 1rem;">🎭 ${event.name}</h3>
                
                <!-- Компактная схема зала -->
                <div class="seat-map">
                    <div class="stage">🎪 СЦЕНА</div>
                    <div class="seats-grid" id="seatMapContainer">
                        ${this.generateSeatMapFromAPI(seats)}
                    </div>
                    <div class="seat-legend">
                        <div class="legend-item"><div class="legend-color seat-free"></div><span>Свободно</span></div>
                        <div class="legend-item"><div class="legend-color seat-selected"></div><span>Выбрано</span></div>
                        <div class="legend-item"><div class="legend-color seat-vip"></div><span>VIP</span></div>
                        <div class="legend-item"><div class="legend-color seat-occupied"></div><span>Занято</span></div>
                    </div>
                </div>
                
                <!-- Информация о выборе -->
                <div class="selection-info">
                    <div id="selectedSeatsInfo">
                        <p>👆 Выберите места на схеме выше</p>
                    </div>
                    <div style="background: #fff3cd; border: 2px solid #f39c12; border-radius: 8px; padding: 0.75rem; margin-top: 1rem; color: #856404; font-size: 0.9rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="font-size: 1.1rem;">💵</span>
                            <strong>Важно:</strong> При оплате наличными можно выбрать только одно место
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Кнопки -->
            <div class="form-actions">
                <button onclick="App.closeModal()" class="btn-secondary">
                    ❌ Отмена
                </button>
                <button onclick="App.goToCustomerForm()" class="btn-primary" id="nextToStep2" disabled>
                    ✅ Далее ›
                </button>
            </div>
        `;
    },
    generateSeatMapFromAPI(seats) {
        const rows = {};
        seats.forEach(seat => {
            const row = seat.seat_label.charAt(0);
            if (!rows[row]) {
                rows[row] = [];
            }
            rows[row].push(seat);
        });
        
        const sortedRows = Object.keys(rows).sort();
        
        let html = '';
        sortedRows.forEach(row => {
            html += `<div class="seat-row">`;
            html += `<div class="row-label">${row}</div>`;
            
            rows[row].sort((a, b) => a.seat_number - b.seat_number);
            
            rows[row].forEach(seat => {
                const status = seat.status === 'occupied' ? 'seat-occupied' : 'seat-free';
                const vipClass = seat.category === 'vip' ? 'seat-vip' : '';
                const isOccupied = seat.status === 'occupied';
                
                html += `
                    <button class="seat ${status} ${vipClass}" 
                            onclick="App.selectSeatFromAPI('${seat.seat_label}', ${seat.id}, ${seat.price}, '${seat.category}')"
                            ${isOccupied ? 'disabled' : ''}
                            title="Место ${seat.seat_label} - ${seat.category === 'vip' ? 'VIP' : 'Стандарт'} - ${seat.price} ₽">
                        ${seat.seat_label || seat.label}
                    </button>
                `;
            });
            
            html += `</div>`;
        });
        
        return html;
    },
    selectSeatFromAPI(seatLabel, seatId, price, category) {
        const seatElement = document.querySelector(`.seat[onclick*="${seatLabel}"]`);
        if (!seatElement) return;
        
        const paymentMethod = document.getElementById('paymentMethod')?.value || 'card';
        
        // Проверка: при оплате наличными можно выбрать только одно место
        if (paymentMethod === 'cash' && !seatElement.classList.contains('seat-selected') && this.selectedSeats.size >= 1) {
            showError('💵 При оплате наличными можно выбрать только одно место');
            return;
        }
        
        const seatData = {
            id: seatId,
            label: seatLabel,
            price: price,
            category: category,
            type: category === 'vip' ? 'VIP' : 'Standard'
        };
        
        if (seatElement.classList.contains('seat-selected')) {
            seatElement.classList.remove('seat-selected');
            seatElement.classList.add('seat-free');
            if (category === 'vip') {
                seatElement.classList.add('seat-vip');
            }
            this.selectedSeats.delete(seatLabel);
        } else {
            seatElement.classList.remove('seat-free', 'seat-vip');
            seatElement.classList.add('seat-selected');
            this.selectedSeats.set(seatLabel, seatData);
        }
        
        this.updateSelectionInfo();
    },
updateSelectionInfo() {
    const infoElement = document.getElementById('selectedSeatsInfo');
    const nextButton = document.getElementById('nextToStep2');
    
    if (!this.selectedSeats || this.selectedSeats.size === 0) {
        infoElement.innerHTML = '<p>👆 Выберите места на схеме выше</p>';
        if (nextButton) nextButton.disabled = true;
        return;
    }
    
    let total = 0;
    const seatsList = Array.from(this.selectedSeats.values()).map(seat => {
        total += seat.price;
        return `<div>📍 ${seat.label} (${seat.type}) - ${seat.price} ₽</div>`; 
    }).join('');
    
    infoElement.innerHTML = `
        <h4>✅ Выбрано мест: ${this.selectedSeats.size}</h4>
        ${seatsList}
        <div style="margin-top: 1rem; font-weight: bold; border-top: 1px solid #ddd; padding-top: 0.5rem;">
            💰 Итого: ${total} ₽
        </div>
    `;
    
    if (nextButton) {
        nextButton.disabled = false;
    }
},
goToCustomerForm: async function() {
    if (!this.selectedSeats || this.selectedSeats.size === 0) {
        showError('Сначала выберите места');
        return;
    }
    
    // Загружаем категории с сервера
    let categories = [];
    try {
        const response = await fetch('/api/discount-categories');
        categories = await response.json();
    } catch (error) {
        console.error('❌ Ошибка загрузки категорий:', error);
        // Создаем базовые категории на случай ошибки
        categories = [
            { id: 1, name: 'Стандартный', discount_percent: 0 },
            { id: 2, name: 'Студент', discount_percent: 20 },
            { id: 3, name: 'Пенсионер', discount_percent: 25 }
        ];
    }
    
    const modalBody = document.getElementById('modalBody');
    const baseTotal = Array.from(this.selectedSeats.values()).reduce((sum, seat) => sum + seat.price, 0);
    
    // Создаем опции для выпадающего списка - СТАНДАРТНЫЙ по умолчанию
    let categoryOptions = '';
    categories.forEach(category => {
        const discountText = category.discount_percent > 0 ? ` (скидка ${category.discount_percent}%)` : '';
        // Устанавливаем "Стандартный" как выбранный по умолчанию
        const isSelected = category.name === 'Стандартный' || category.discount_percent === 0;
        categoryOptions += `<option value="${category.id}" ${isSelected ? 'selected' : ''}>${category.name}${discountText}</option>`;
    });
    
    modalBody.innerHTML = `
        <div style="max-height: 70vh; overflow-y: auto;">
            <h3>📝 Ваши данные</h3>
            
            <div style="background: #e8f4fd; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                <strong>Вы выбрали ${this.selectedSeats.size} мест</strong><br>
                💰 Базовая стоимость: <strong>${baseTotal} ₽</strong>
            </div>

            <!-- Выбор льготной категории -->
            <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; margin: 1rem 0; border: 1px solid #ffeaa7;">
                <h4>🎫 Льготная категория</h4>
                <div class="form-group">
                    <select id="discountCategory" onchange="App.updateCategoryDiscount()" style="width: 100%; padding: 0.75rem; border: 2px solid #bdc3c7; border-radius: 8px;">
                        ${categoryOptions}
                    </select>
                    <small style="color: #666;">Выберите вашу категорию для применения скидки</small>
                </div>
                
                <!-- Сообщение о документах для льготных категорий -->
                <div id="discountWarning" style="display: none; margin-top: 0.75rem; padding: 0.75rem; background: #fff3cd; border: 2px solid #f39c12; border-radius: 6px; color: #856404;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <span style="font-size: 1.2rem;">⚠️</span>
                        <strong>Важная информация</strong>
                    </div>
                    <p style="margin: 0; font-size: 0.9rem; line-height: 1.4;">
                        Для получения льготы необходимо предъявить соответствующий документ, 
                        подтверждающий право на льготу, при входе на мероприятие.
                    </p>
                </div>
            </div>

            <!-- Поле для промокода -->
            <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; margin: 1rem 0; border: 1px solid #ffeaa7;">
                <h4>🎁 Есть промокод?</h4>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                    <input type="text" id="promoCode" placeholder="Введите промокод" style="flex: 1; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                    <button onclick="App.applyPromoCode()" class="btn-secondary" style="white-space: nowrap;">
                        Применить
                    </button>
                </div>
            </div>

            <div id="paymentSummary">
                <!-- Здесь будет обновляемая информация о стоимости -->
            </div>
            
            <form id="customerForm">
                <div class="form-group">
                    <label for="customerName">
                        Ваше имя <span class="required">*</span>
                    </label>
                    <div class="input-wrapper">
                        <input type="text" id="customerName" name="customerName" required 
                               placeholder="Введите ваше имя" 
                               onblur="App.validateField('customerName')"
                               oninput="App.clearFieldError('customerName')">
                        <span class="field-icon" id="customerNameIcon"></span>
                    </div>
                    <span class="error-message" id="customerNameError"></span>
                </div>
                
                <div class="form-group">
                    <label for="customerEmail">
                        Email <span class="optional">(необязательно)</span>
                    </label>
                    <div class="input-wrapper">
                        <input type="email" id="customerEmail" name="customerEmail" 
                               placeholder="example@mail.com" 
                               onblur="App.validateField('customerEmail')"
                               oninput="App.clearFieldError('customerEmail')">
                        <span class="field-icon" id="customerEmailIcon"></span>
                    </div>
                    <span class="error-message" id="customerEmailError"></span>
                </div>
                
                <div class="form-group">
                    <label for="customerPhone">
                        Телефон <span class="required">*</span>
                    </label>
                    <div class="input-wrapper">
                        <input type="tel" id="customerPhone" name="customerPhone" required 
                               placeholder="+7 (999) 123-45-67" 
                               onblur="App.validateField('customerPhone')"
                               oninput="App.formatPhoneInput(event); App.clearFieldError('customerPhone')">
                        <span class="field-icon" id="customerPhoneIcon"></span>
                    </div>
                    <span class="error-message" id="customerPhoneError"></span>
                </div>
                
                <div class="form-group">
                    <label for="paymentMethod">
                        Способ оплаты <span class="required">*</span>
                    </label>
                    <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                        <label style="flex: 1; padding: 1rem; border: 2px solid #bdc3c7; border-radius: 8px; cursor: pointer; text-align: center; transition: all 0.3s;" 
                               onmouseover="this.style.borderColor='#3498db'; this.style.background='#ecf0f1';" 
                               onmouseout="if(document.getElementById('paymentMethod').value !== 'card') {this.style.borderColor='#bdc3c7'; this.style.background='transparent';}">
                            <input type="radio" name="paymentMethod" id="paymentMethodCard" value="card" checked 
                                   onchange="document.getElementById('paymentMethod').value='card'; App.updatePaymentMethodDisplay();"
                                   style="margin-right: 0.5rem;">
                            <div>💳 Картой</div>
                            <div style="font-size: 0.85rem; color: #27ae60; font-weight: bold; margin-top: 0.3rem;">-3% скидка</div>
                        </label>
                        <label style="flex: 1; padding: 1rem; border: 2px solid #bdc3c7; border-radius: 8px; cursor: pointer; text-align: center; transition: all 0.3s;" 
                               onmouseover="this.style.borderColor='#3498db'; this.style.background='#ecf0f1';" 
                               onmouseout="if(document.getElementById('paymentMethod').value !== 'cash') {this.style.borderColor='#bdc3c7'; this.style.background='transparent';}">
                            <input type="radio" name="paymentMethod" id="paymentMethodCash" value="cash" 
                                   onchange="document.getElementById('paymentMethod').value='cash'; App.updatePaymentMethodDisplay();"
                                   style="margin-right: 0.5rem;">
                            <div>💵 Наличными</div>
                        </label>
                    </div>
                    <input type="hidden" id="paymentMethod" value="card">
                </div>
            </form>
        </div>
        
        <div class="form-actions">
            <button onclick="App.backToSeatSelection()" class="btn-secondary">
                ‹ Назад к выбору мест
            </button>
            <button onclick="App.proceedToPayment()" class="btn-primary" id="proceedToPaymentButton">
                💳 Перейти к оплате
            </button>
        </div>
    `;
    
    // Инициализируем расчет стоимости
    this.updateCategoryDiscount();
    
    // Инициализируем валидацию формы
    this.initFormValidation();
    
    // Инициализируем отображение способа оплаты
    this.updatePaymentMethodDisplay();
},

updatePaymentMethodDisplay: function() {
    const paymentMethod = document.getElementById('paymentMethod')?.value || 'card';
    const proceedButton = document.getElementById('proceedToPaymentButton');
    
    // Если переключились на наличные и выбрано больше одного места, оставляем только первое
    if (paymentMethod === 'cash' && this.selectedSeats.size > 1) {
        const seatsArray = Array.from(this.selectedSeats.entries());
        // Оставляем только первое место
        const firstSeat = seatsArray[0];
        this.selectedSeats.clear();
        this.selectedSeats.set(firstSeat[0], firstSeat[1]);
        
        // Снимаем выделение с остальных мест
        for (let i = 1; i < seatsArray.length; i++) {
            const seatLabel = seatsArray[i][0];
            const seatElement = document.querySelector(`.seat[onclick*="${seatLabel}"]`);
            if (seatElement) {
                seatElement.classList.remove('seat-selected');
                seatElement.classList.add('seat-free');
                const seatData = seatsArray[i][1];
                if (seatData.category === 'vip') {
                    seatElement.classList.add('seat-vip');
                }
            }
        }
        
        this.updateSelectionInfo();
        showError('💵 При оплате наличными можно выбрать только одно место. Остальные места были сняты.');
    }
    
    if (proceedButton) {
        if (paymentMethod === 'cash') {
            proceedButton.innerHTML = '💵 Оформить заказ';
        } else {
            proceedButton.innerHTML = '💳 Перейти к оплате';
        }
    }
    
    // Обновляем стили выбранных радиокнопок
    const cardLabel = document.querySelector('label[for="paymentMethodCard"]');
    const cashLabel = document.querySelector('label[for="paymentMethodCash"]');
    
    if (cardLabel && cashLabel) {
        if (paymentMethod === 'card') {
            cardLabel.style.borderColor = '#3498db';
            cardLabel.style.background = '#e8f4fd';
            cashLabel.style.borderColor = '#bdc3c7';
            cashLabel.style.background = 'transparent';
        } else {
            cashLabel.style.borderColor = '#3498db';
            cashLabel.style.background = '#e8f4fd';
            cardLabel.style.borderColor = '#bdc3c7';
            cardLabel.style.background = 'transparent';
        }
    }
    
    // Обновляем итоговую сумму с учетом скидки для карты
    this.updateTotalWithDiscount();
},

updateTotalWithDiscount: function() {
    // Обновляем итоговую сумму с учетом способа оплаты
    const paymentMethod = document.getElementById('paymentMethod')?.value || 'card';
    const baseTotal = Array.from(this.selectedSeats.values()).reduce((sum, seat) => sum + seat.price, 0);
    
    let total = baseTotal;
    
    // Применяем скидку категории если есть
    if (this.selectedDiscountCategory && this.selectedDiscountCategory.id) {
        total = total - (total * this.selectedDiscountCategory.discountPercent / 100);
    }
    
    // Применяем скидку от промокода если есть
    if (this.currentPromo) {
        total = this.currentPromo.finalAmount;
    } else {
        // Применяем скидку 3% при оплате банковской картой
        if (paymentMethod === 'card') {
            total = total - (total * 0.03);
        }
    }
    
    // Обновляем отображение
    this.updatePaymentSummary(total, this.currentPromo);
},

// Обновленный метод для обновления стоимости с учетом категории и показа предупреждения
updateCategoryDiscount: async function() {
    const categorySelect = document.getElementById('discountCategory');
    const selectedCategoryId = categorySelect.value;
    const baseTotal = Array.from(this.selectedSeats.values()).reduce((sum, seat) => sum + seat.price, 0);
    
    let discountPercent = 0;
    let categoryName = 'Стандартный';
    let isStandardCategory = true;
    
    // Если выбрана категория, получаем информацию о скидке
    if (selectedCategoryId && selectedCategoryId !== '') {
        try {
            const response = await fetch('/api/discount-categories');
            const categories = await response.json();
            const selectedCategory = categories.find(cat => cat.id == selectedCategoryId);
            
            if (selectedCategory) {
                discountPercent = selectedCategory.discount_percent;
                categoryName = selectedCategory.name;
                // Проверяем, является ли категория стандартной (без скидки)
                isStandardCategory = selectedCategory.discount_percent === 0 || selectedCategory.name === 'Стандартный';
            }
        } catch (error) {
            console.error('❌ Ошибка получения информации о категории:', error);
        }
    }
    
    // Показываем или скрываем предупреждение о документах
    const warningElement = document.getElementById('discountWarning');
    if (warningElement) {
        if (isStandardCategory) {
            warningElement.style.display = 'none';
        } else {
            warningElement.style.display = 'block';
        }
    }
    
    // Применяем скидку категории
    let totalAfterCategory = baseTotal - (baseTotal * discountPercent / 100);
    
    // Сохраняем выбранную категорию
    this.selectedDiscountCategory = selectedCategoryId ? {
        id: selectedCategoryId,
        name: categoryName,
        discountPercent: discountPercent,
        isStandard: isStandardCategory
    } : null;
    
    // Применяем скидку 3% при оплате картой (если нет промокода)
    const paymentMethod = document.getElementById('paymentMethod')?.value || 'card';
    let finalTotal = totalAfterCategory;
    if (paymentMethod === 'card' && !this.currentPromo) {
        finalTotal = totalAfterCategory - (totalAfterCategory * 0.03);
    }
    
    // Обновляем отображение стоимости
    this.updatePaymentSummary(finalTotal, this.currentPromo);
},

async showEventDetails(eventId) {
    
    try {
        const response = await fetch(`${API_BASE}/events/${eventId}`);
        if (!response.ok) {
            throw new Error('Мероприятие не найдено');
        }
        
        const event = await response.json();
        this.showEventDetailsModal(event);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки мероприятия:', error);
        const events = await fetch(`${API_BASE}/events`).then(r => r.json());
        const event = events.find(e => e.id === eventId);
        if (event) {
            this.showEventDetailsModal(event);
        } else {
            showError('❌ Не удалось загрузить информацию о мероприятии');
        }
    }
},

showEventDetailsModal(event) {
    const modal = document.getElementById('bookingModal');
    const modalBody = document.getElementById('modalBody');
    this.currentEventId = event.id;
    this.currentEventName = event.name;
    const eventDate = this.formatDate(event.date);
    
    modalBody.innerHTML = `
        <div class="event-details-content" style="margin-bottom: 1rem;">
            <!-- Заголовок и изображение -->
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <h3 style="color: #2c3e50; margin-bottom: 1rem;">${event.name}</h3>
                <div style="width: 100%; height: 200px; border-radius: 10px; overflow: hidden; margin: 0 auto;">
                    ${event.image_url ? 
                        `<img src="${event.image_url.startsWith('http://') || event.image_url.startsWith('https://') ? event.image_url : 'images/' + event.image_url}" alt="${event.name}" 
                              style="width:100%;height:100%;object-fit:cover;">` : 
                        '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:linear-gradient(135deg, #667eea, #764ba2);color:white;font-size:2rem;">🎭</div>'
                    }
                </div>
            </div>
            
            <!-- Информация о мероприятии -->
            <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem;">
                <div style="display: grid; grid-template-columns: auto 1fr; gap: 1rem; align-items: start;">
                    <div style="font-weight: bold; color: #2c3e50;">📅 Дата:</div>
                    <div>${eventDate}</div>
                    
                    <div style="font-weight: bold; color: #2c3e50;">📍 Площадка:</div>
                    <div>${event.venue || 'Usupovo Life Hall'}</div>
                    
                    <div style="font-weight: bold; color: #2c3e50;">⏱️ Продолжительность:</div>
                    <div>${event.duration || '120'} минут</div>
                </div>
            </div>
            
            <!-- Описание -->
            <div style="margin-bottom: 1.5rem;">
                <h4 style="color: #2c3e50; margin-bottom: 0.5rem;">📝 Описание</h4>
                <p style="line-height: 1.6; color: #555;">${event.description || 'Подробное описание скоро появится...'}</p>
            </div>
            
            <!-- Дополнительная информация -->
            <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; border: 1px solid #ffeaa7; margin-bottom: 1rem;">
                <h5 style="color: #856404; margin-bottom: 0.5rem;">ℹ️ Важная информация</h5>
                <ul style="color: #856404; margin: 0; padding-left: 1.2rem;">
                    <li>Рекомендуем приходить за 5-10 минут до начала</li>
                    <li>Фото и видео съемка разрешена без вспышки</li>
                </ul>
            </div>
            
            <!-- Правила зала -->
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; border: 1px solid #dee2e6; margin-bottom: 1rem;">
                <h5 style="color: #495057; margin-bottom: 0.75rem; text-align: center;">🚫 Правила зала</h5>
                <div style="display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <img src="images/icons.png" alt="Правила зала" style="height: 32px; max-width: 100%;" title="Правила зала: Без еды и напитков, Без оружия, Без курения">
                </div>
                <p style="color: #6c757d; font-size: 0.85rem; text-align: center; margin: 0;">Соблюдайте правила зала для комфорта всех гостей</p>
            </div>
        </div>
        
        <!-- Кнопки - ВСЕГДА ВИДИМЫЕ -->
        <div class="form-actions" style="position: sticky; bottom: 0; background: white; padding: 1rem 0; border-top: 2px solid #eee; margin-top: 1rem;">
            <button onclick="App.closeModal()" class="btn-secondary">
                ❌ Закрыть
            </button>
            <button onclick="App.openBookingModal(${event.id})" class="btn-primary">
                🎫 Купить билеты
            </button>
        </div>
    `;
    
    modal.style.display = 'block';
},

// Валидация полей формы
validateField: function(fieldName) {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(fieldName + 'Error');
    const iconElement = document.getElementById(fieldName + 'Icon');
    
    if (!field || !errorElement || !iconElement) return true;
    
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Валидация имени
    if (fieldName === 'customerName') {
        if (!value) {
            isValid = false;
            errorMessage = 'Поле обязательно для заполнения';
        } else if (value.length < 2) {
            isValid = false;
            errorMessage = 'Имя должно содержать минимум 2 символа';
        } else if (!/^[а-яА-ЯёЁa-zA-Z\s\-]+$/.test(value)) {
            isValid = false;
            errorMessage = 'Имя может содержать только буквы, пробелы и дефисы';
        }
    }
    
    // Валидация email (только если введен)
    if (fieldName === 'customerEmail') {
        if (value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Введите корректный email адрес';
            }
        }
        // Если поле пустое - это валидно (необязательное поле)
    }
    
    // Валидация телефона
    if (fieldName === 'customerPhone') {
        if (!value) {
            isValid = false;
            errorMessage = 'Поле обязательно для заполнения';
        } else {
            // Убираем все нецифровые символы для проверки
            const phoneDigits = value.replace(/\D/g, '');
            if (phoneDigits.length < 10 || phoneDigits.length > 12) {
                isValid = false;
                errorMessage = 'Введите корректный номер телефона';
            } else if (!phoneDigits.startsWith('7') && !phoneDigits.startsWith('8')) {
                isValid = false;
                errorMessage = 'Номер должен начинаться с +7 или 8';
            }
        }
    }
    
    // Обновляем визуальное состояние
    if (isValid) {
        field.classList.remove('error');
        field.classList.add('valid');
        errorElement.textContent = '';
        iconElement.textContent = '✓';
        iconElement.className = 'field-icon valid';
    } else {
        field.classList.remove('valid');
        field.classList.add('error');
        errorElement.textContent = errorMessage;
        iconElement.textContent = '✕';
        iconElement.className = 'field-icon invalid';
    }
    
    return isValid;
},

clearFieldError: function(fieldName) {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(fieldName + 'Error');
    const iconElement = document.getElementById(fieldName + 'Icon');
    
    if (field) {
        field.classList.remove('error', 'valid');
    }
    if (errorElement) {
        errorElement.textContent = '';
    }
    if (iconElement) {
        iconElement.textContent = '';
        iconElement.className = 'field-icon';
    }
},

formatPhoneInput: function(event) {
    let value = event.target.value.replace(/\D/g, '');
    
    if (value.startsWith('8')) {
        value = '7' + value.substring(1);
    }
    
    if (value.startsWith('7')) {
        let formatted = '+7';
        if (value.length > 1) {
            formatted += ' (' + value.substring(1, 4);
        }
        if (value.length >= 4) {
            formatted += ') ' + value.substring(4, 7);
        }
        if (value.length >= 7) {
            formatted += '-' + value.substring(7, 9);
        }
        if (value.length >= 9) {
            formatted += '-' + value.substring(9, 11);
        }
        event.target.value = formatted;
    } else if (value.length > 0) {
        event.target.value = '+' + value;
    }
},

initFormValidation: function() {
    // Валидация при потере фокуса уже настроена через onblur
    // Здесь можно добавить дополнительную инициализацию если нужно
},

validateAllFields: function() {
    const nameValid = this.validateField('customerName');
    const emailValid = this.validateField('customerEmail');
    const phoneValid = this.validateField('customerPhone');
    
    return nameValid && emailValid && phoneValid;
},

proceedToPayment: async function() {
    // Валидируем все поля перед переходом к оплате
    if (!this.validateAllFields()) {
        // Прокручиваем к первой ошибке
        const firstError = document.querySelector('.form-group input.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstError.focus();
        }
        return;
    }
    
    const name = document.getElementById('customerName').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const paymentMethod = document.getElementById('paymentMethod')?.value || 'card';

    if (this.selectedSeats.size === 0) {
        showError('❌ Выберите хотя бы одно место');
        return;
    }

    const seatLabels = Array.from(this.selectedSeats.keys());
    let total = Array.from(this.selectedSeats.values()).reduce((sum, seat) => sum + seat.price, 0);
    
    // Проверка: при оплате наличными можно выбрать только одно место
    if (paymentMethod === 'cash' && this.selectedSeats.size > 1) {
        showError('💵 При оплате наличными можно выбрать только одно место');
        return;
    }
    
    // Применяем скидку категории если есть
    if (this.selectedDiscountCategory && this.selectedDiscountCategory.id) {
        total = total - (total * this.selectedDiscountCategory.discountPercent / 100);
    }
    
    // Применяем скидку от промокода если есть
    if (this.currentPromo) {
        total = this.currentPromo.finalAmount;
    }
    
    // Применяем скидку 3% при оплате банковской картой
    if (paymentMethod === 'card') {
        total = total - (total * 0.03);
    }
    
    try {
        
        const response = await fetch(`${API_BASE}/create-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                eventId: this.currentEventId,
                seats: seatLabels,
                customer: {
                    name: name,
                    email: email,
                    phone: phone
                },
                total: Math.round(total),
                discountCategoryId: this.selectedDiscountCategory ? this.selectedDiscountCategory.id : null,
                promoCode: this.currentPromo ? this.currentPromo.code : null,
                paymentMethod: paymentMethod
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Отмечаем промокод как использованный
            if (this.currentPromo) {
                await fetch(`${API_BASE}/promo/${this.currentPromo.id}/use`, {
                    method: 'POST'
                });
            }
            
            // Сохраняем способ оплаты для использования в confirmPayment
            this.currentPaymentMethod = paymentMethod;
            
            // Если оплата наличными - сразу подтверждаем
            if (paymentMethod === 'cash') {
                await this.confirmPayment(result.paymentId);
            } else {
                this.showPaymentPage(result);
            }
        } else {
            throw new Error(result.error || 'Ошибка создания платежа');
        }
        
    } catch (error) {
        console.error('❌ Ошибка создания платежа:', error);
        showError(`❌ Ошибка: ${error.message}`);
    }
},

showPaymentPage(paymentData) {
    const modalBody = document.getElementById('modalBody');
    this.paymentButtonClicked = false;
    
    // Если оплата наличными, не показываем эту страницу
    if (paymentData.paymentMethod === 'cash') {
        return;
    }
    
    modalBody.innerHTML = `
        <div style="text-align: center; max-height: 70vh; overflow-y: auto;">
            <h3>💳 Оплата билетов</h3>
            
            <div style="background: #fff3cd; padding: 1.5rem; border-radius: 10px; margin: 1rem 0; border: 1px solid #ffeaa7;">
                <h4>💰 Сумма к оплате: ${paymentData.total} ₽</h4>
                <p>ID бронирования: <strong>${paymentData.bookingId}</strong></p>
                ${this.selectedDiscountCategory ? `
                    <p>Категория: <strong>${this.selectedDiscountCategory.name}</strong></p>
                ` : ''}
            </div>
            
            <div style="margin: 2rem 0;">
                <p>Нажмите кнопку ниже для перехода к оплате через Тинькофф</p>
                <button onclick="App.openPaymentLink('${paymentData.paymentUrl}')" class="btn-primary" id="paymentLinkButton">
                    💳 Перейти к оплате
                </button>
                <div id="paymentStatus" style="margin-top: 1rem; display: none;">
                    <div style="color: #27ae60; font-weight: bold;">
                        ✅ Вы перешли к оплате
                    </div>
                    <small>Теперь можете подтвердить оплату</small>
                </div>
            </div>
            
            <div style="background: #e8f4fd; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                <h5>📋 Инструкция:</h5>
                <ol style="text-align: left; margin: 1rem;">
                    <li>Нажмите "Перейти к оплате"</li>
                    <li>Оплатите ${paymentData.total} ₽ в банке Тинькофф</li>
                    <li>Вернитесь на эту страницу</li>
                    <li>Нажмите "Подтвердить оплата"</li>
                </ol>
            </div>
            
            <div style="color: #666; font-size: 0.9rem; margin: 1rem 0;">
                ⏱️ У вас есть 30 минут для завершения оплаты
            </div>
        </div>
        
        <div class="form-actions">
            <button onclick="App.backToCustomerForm()" class="btn-secondary">
                ‹ Назад
            </button>
            <button onclick="App.confirmPayment('${paymentData.paymentId}')" class="btn-primary" id="confirmPaymentButton" disabled>
                ⏳ Подтвердить оплату
            </button>
        </div>
    `;
    
    this.currentPaymentId = paymentData.paymentId;
},

openPaymentLink(paymentUrl) {
    window.open(paymentUrl, '_blank');
    this.paymentButtonClicked = true;
    const confirmButton = document.getElementById('confirmPaymentButton');
    const paymentStatus = document.getElementById('paymentStatus');
    const paymentLinkButton = document.getElementById('paymentLinkButton');
    
    if (confirmButton) {
        confirmButton.disabled = false;
        confirmButton.innerHTML = '✅ Подтвердить оплату';
        confirmButton.style.background = '#27ae60';
    }
    
    if (paymentStatus) {
        paymentStatus.style.display = 'block';
    }
    
    if (paymentLinkButton) {
        paymentLinkButton.disabled = true;
        paymentLinkButton.innerHTML = '✅ Переход выполнен';
        paymentLinkButton.style.background = '#95a5a6';
    }
    this.showNotification('✅ Вы перешли к оплате. Теперь можете подтвердить оплату после завершения.', 'success');
},

showNotification(message, type = 'info') {
    if (window.toastManager) {
        window.toastManager.show(message, type);
    } else {
        // Fallback если toast.js еще не загружен
        console.warn('ToastManager not loaded, using console:', message);
    }
},

backToCustomerForm() {
    this.goToCustomerForm();
},

async confirmPayment(paymentId) {
    // Для наличных не требуется проверка нажатия кнопки перехода к оплате
    const paymentMethod = this.currentPaymentMethod || document.getElementById('paymentMethod')?.value || 'card';
    
    if (paymentMethod === 'card' && !this.paymentButtonClicked) {
        showError('❌ Сначала нажмите кнопку "Перейти к оплате", чтобы перейти в банк');
        return;
    }
    
    const confirmButton = document.getElementById('confirmPaymentButton');
    if (confirmButton) {
        confirmButton.disabled = true;
        confirmButton.innerHTML = paymentMethod === 'cash' ? '⏳ Оформляем заказ...' : '⏳ Проверяем оплату...';
        confirmButton.style.background = '#95a5a6';
    }
    
    try {
        
        const response = await fetch(`${API_BASE}/confirm-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paymentId: paymentId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            this.showBookingSuccess({
                bookingId: result.bookingId,
                customerName: result.customerName || 'Не указано',
                customerEmail: result.customerEmail || 'Не указано',
                customerPhone: result.customerPhone || 'Не указано',
                seats: Array.from(this.selectedSeats.values()),
                total: result.total,
                discountCategory: this.selectedDiscountCategory,
                paymentMethod: paymentMethod,
                message: result.message
            });
            
        } else {
            throw new Error(result.error || 'Ошибка подтверждения оплаты');
        }
        
    } catch (error) {
        console.error('❌ Ошибка подтверждения оплаты:', error);
        if (confirmButton) {
            confirmButton.disabled = false;
            confirmButton.innerHTML = paymentMethod === 'cash' ? '💵 Оформить заказ' : '✅ Подтвердить оплату';
            confirmButton.style.background = '#27ae60';
        }
        
        showError(`❌ Ошибка: ${error.message}`);
    }
},

backToSeatSelection() {
    this.closeModal();
    setTimeout(() => {
        this.openBookingModal(this.currentEventId);
    }, 300);
},
    async finalBooking() {
        // Валидируем все поля перед финальным бронированием
        if (!this.validateAllFields()) {
            const firstError = document.querySelector('.form-group input.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
            return;
        }
        
        const name = document.getElementById('customerName').value.trim();
        const email = document.getElementById('customerEmail').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        
        if (this.selectedSeats.size === 0) {
            showError('❌ Выберите хотя бы одно место');
            return;
        }
        
        const seatLabels = Array.from(this.selectedSeats.keys());
        
        try {
            
            const response = await fetch(`${API_BASE}/book`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    eventId: this.currentEventId,
                    seats: seatLabels,
                    customer: {
                        name: name,
                        email: email,
                        phone: phone
                    },
                    discountCategoryId: this.selectedDiscountCategory ? this.selectedDiscountCategory.id : null
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            this.showBookingSuccess({
                bookingId: result.bookingId,
                customerName: name,
                customerEmail: email,
                customerPhone: phone,
                seats: Array.from(this.selectedSeats.values()),
                total: result.total,
                discountCategory: this.selectedDiscountCategory,
                message: result.message
            });
            
        } catch (error) {
            console.error('❌ Ошибка бронирования:', error);
            showError(`❌ Ошибка бронирования: ${error.message}`);
        }
    },

    showBookingError(message) {
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 3rem; color: #e74c3c;">❌</div>
                <h4>Ошибка</h4>
                <p>${message}</p>
                <button onclick="App.closeModal()" class="btn-primary" style="margin-top: 1rem;">
                    Закрыть
                </button>
            </div>
        `;
    },

getCurrentEventName() {
    if (this.currentEventId && window.allEvents) {
        const event = window.allEvents.find(e => e.id == this.currentEventId);
        return event ? event.name : 'Мероприятие';
    }
    
    const eventCards = document.querySelectorAll('.event-card');
    for (let card of eventCards) {
        if (card.dataset.eventId == this.currentEventId) {
            const title = card.querySelector('h3');
            return title ? title.textContent : 'Мероприятие';
        }
    }
    
    return 'Мероприятие';
},

showBookingSuccess(bookingData) {
    const modalBody = document.getElementById('modalBody');
    this.lastBookingData = bookingData;
    
    const qrData = this.generateQRData(bookingData);
    
    // Улучшенная информация о категории с предупреждением для льготных билетов
    const hasDiscount = bookingData.discountCategory && bookingData.discountCategory.discountPercent > 0;
    const categoryInfo = bookingData.discountCategory ? 
        `<div>
            <strong style="color: #3498db;">Категория:</strong><br>
            <span style="${hasDiscount ? 'color: #e67e22; font-weight: bold;' : ''}">
                ${bookingData.discountCategory.name} ${hasDiscount ? `(скидка ${bookingData.discountCategory.discountPercent}%)` : ''}
            </span>
            ${hasDiscount ? `
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 0.5rem; margin-top: 0.5rem; color: #856404;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem;">
                        <span style="font-size: 1.2rem;">⚠️</span>
                        <strong>Льготный билет</strong>
                    </div>
                    <div style="font-size: 0.8rem; line-height: 1.3;">
                        Необходимо предъявить документ, подтверждающий право на льготу, при входе на мероприятие
                    </div>
                </div>
            ` : ''}
        </div>` : 
        `<div>
            <strong style="color: #3498db;">Категория:</strong><br>
            <span>Стандартный</span>
        </div>`;
    
    // Шапка билета с отметкой для льготных билетов
    const ticketHeader = `
        <div style="background: linear-gradient(135deg, #3498db, #2980b9); color: white; padding: 1rem; text-align: center; position: relative;">
            <h3 style="margin: 0; font-size: clamp(1.2rem, 4vw, 1.5rem);">🎭 Usupovo Life Hall</h3>
            <p style="margin: 0.5rem 0 0 0; opacity: 0.9; font-size: clamp(0.8rem, 3vw, 0.9rem);">ЭЛЕКТРОННЫЙ БИЛЕТ</p>
            ${hasDiscount ? 
                '<div style="position: absolute; top: 10px; right: 10px; background: #e67e22; color: white; padding: 0.2rem 0.5rem; border-radius: 1rem; font-size: 0.7rem; font-weight: bold;">🎫 ЛЬГОТА</div>' 
                : ''}
        </div>
    `;
    
    modalBody.innerHTML = `
        <div class="booking-success">
            <div style="text-align: center; color: #27ae60; font-size: 4rem;">✅</div>
            <h4 style="text-align: center; color: #27ae60;">🎉 Бронирование успешно!</h4>
            
            <!-- Подсказка про скриншот -->
            <div style="text-align: center; margin: 1rem 0; padding: 1rem; background: #e8f4fd; border-radius: 8px; border-left: 4px solid #3498db;">
                <p style="margin: 0; color: #2c3e50; font-weight: bold;">
                    📱 Вы можете сделать скриншот, чтобы не забыть
                </p>
            </div>
            
            <!-- Билет - АДАПТИВНЫЙ -->
            <div class="ticket" style="border: 3px solid #3498db; border-radius: 15px; padding: 0; margin: 1.5rem 0; background: white; color: #2c3e50; overflow: hidden; box-shadow: 0 8px 25px rgba(0,0,0,0.1); max-width: 100%;">
                ${ticketHeader}
                
                <!-- Основная информация - АДАПТИВНАЯ -->
                <div style="padding: 1rem;">
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <!-- QR-код - по центру на мобильных -->
                        <div style="text-align: center;">
                            <div id="qrcode" style="background: white; padding: 10px; border-radius: 8px; border: 2px solid #f0f0f0; display: inline-block; max-width: 100%;"></div>
                        </div>
                        
                        <!-- Информация о билете -->
                        <div>
                            <div style="margin-bottom: 0.8rem; padding-bottom: 0.5rem; border-bottom: 1px solid #f0f0f0;">
                                <strong style="color: #3498db; font-size: clamp(0.9rem, 3vw, 1rem);">МЕРОПРИЯТИЕ:</strong><br>
                                <span style="font-size: clamp(0.8rem, 3vw, 0.9rem);">${this.currentEventName || 'Мероприятие'}</span>
                            </div>
                            
                            <!-- Информация о покупателе - СТЕК на мобильных -->
                            <div style="display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 1rem;">
                                <!-- Имя -->
                                <div>
                                    <strong style="color: #3498db; font-size: clamp(0.9rem, 3vw, 1rem);">ИМЯ:</strong><br>
                                    <span style="font-size: clamp(0.8rem, 3vw, 0.9rem);">${bookingData.customerName || 'Не указано'}</span>
                                </div>
                                
                                <!-- Категория -->
                                ${categoryInfo}
                                
                                <!-- Телефон и Email в ряд на десктопе, в столбик на мобильных -->
                                <div style="display: grid; grid-template-columns: 1fr; gap: 0.8rem;">
                                    <div>
                                        <strong style="color: #3498db; font-size: clamp(0.9rem, 3vw, 1rem);">ТЕЛЕФОН:</strong><br>
                                        <span style="font-size: clamp(0.8rem, 3vw, 0.9rem);">${bookingData.customerPhone || 'Не указано'}</span>
                                    </div>
                                    
                                    ${bookingData.customerEmail ? `
                                    <div>
                                        <strong style="color: #3498db; font-size: clamp(0.9rem, 3vw, 1rem);">EMAIL:</strong><br>
                                        <span style="font-size: clamp(0.8rem, 3vw, 0.9rem);">${bookingData.customerEmail}</span>
                                    </div>
                                    ` : ''}
                                </div>
                                
                                <!-- Места -->
                                <div>
                                    <strong style="color: #3498db; font-size: clamp(0.9rem, 3vw, 1rem);">МЕСТА:</strong><br>
                                    <span style="font-size: clamp(0.8rem, 3vw, 0.9rem);">${bookingData.seats.map(seat => `${seat.label} (${seat.type})`).join(', ')}</span>
                                </div>
                                
                                <!-- Номер брони и сумма в ряд -->
                                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                                    <div>
                                        <strong style="color: #3498db; font-size: clamp(0.9rem, 3vw, 1rem);">НОМЕР БРОНИ:</strong><br>
                                        <span style="font-size: clamp(0.8rem, 3vw, 0.9rem);">${bookingData.bookingId}</span>
                                    </div>
                                    
                                    <!-- Сумма -->
                                    <div style="text-align: right;">
                                        <div style="font-size: clamp(1.2rem, 4vw, 1.4rem); font-weight: bold; color: #27ae60;">
                                            💰 ${bookingData.total} ₽
                                        </div>
                                        <small style="color: #7f8c8d; font-size: clamp(0.7rem, 2vw, 0.8rem);">
                                            ${bookingData.paymentMethod === 'cash' ? '💵 Оплата наличными' : '💳 Оплачено картой'}
                                        </small>
                                    </div>
                                </div>
                                
                                ${bookingData.paymentMethod === 'cash' ? `
                                <div style="background: #fff3cd; border: 2px solid #f39c12; border-radius: 8px; padding: 1rem; margin-top: 1rem; color: #856404;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <span style="font-size: 1.2rem;">💵</span>
                                        <strong>Оплата наличными</strong>
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Правила зала -->
                    <div style="text-align: center; margin-top: 1rem; padding-top: 1rem; border-top: 2px dashed #3498db;">
                        <div style="display: flex; justify-content: center; gap: 0.8rem; margin-bottom: 0.5rem;">
                            <img src="images/icons.png" alt="Правила зала" style="height: 24px; max-width: 100%;" title="Правила зала: Без еды и напитков, Без оружия, Без курения">
                        </div>
                        <small style="color: #7f8c8d; font-size: clamp(0.7rem, 2vw, 0.8rem);">Правила зала</small>
                    </div>
                </div>
                
                <!-- Подвал билета -->
                <div style="background: #f8f9fa; padding: 0.8rem; border-top: 1px solid #e9ecef;">
                    <div style="text-align: center; font-size: clamp(0.7rem, 2vw, 0.8rem); color: #6c757d; line-height: 1.4;">
                        <p style="margin: 0 0 0.3rem 0;">📍 г.о. Домодедово, КП "Юсупово Лайф Парк", ул. Рассветная, 8</p>
                        <p style="margin: 0 0 0.3rem 0;">📞 +7 (985) 834-94-94</p>
                        <p style="margin: 0; font-weight: bold;">Предъявите QR-код на входе</p>
                    </div>
                </div>
            </div>
            
            <div class="success-actions" style="text-align: center; margin-top: 2rem;">
                <button onclick="App.printTicket()" class="btn-secondary" style="margin-right: 0.5rem; margin-bottom: 0.5rem; padding: 0.8rem 1.2rem; font-size: clamp(0.9rem, 3vw, 1rem);">
                    🖨️ Распечатать
                </button>
                <!-- <button onclick="App.saveTicketAsPDF()" class="btn-primary" style="margin-right: 0.5rem; margin-bottom: 0.5rem; padding: 0.8rem 1.2rem; font-size: clamp(0.9rem, 3vw, 1rem);">
                    📄 Сохранить PDF
                </button> -->
                <button onclick="App.closeModal()" class="btn-primary" style="padding: 0.8rem 1.2rem; font-size: clamp(0.9rem, 3vw, 1rem);">
                    👍 Отлично!
                </button>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        this.generateQRCode(qrData);
    }, 100);
},

generateQRData(bookingData) {
    const verificationUrl = `${window.location.origin}/verify.html?ticket=${bookingData.bookingId}`;
    return verificationUrl;
},

generateQRCode(data) {
    const qrElement = document.getElementById('qrcode');
    if (!qrElement) return;

    qrElement.innerHTML = '';

    const qrcode = window.qrcode;
    
    if (!qrcode) {
        console.error('qrcode library not found');
        return;
    }

    try {
        const qr = qrcode(0, 'M');
        qr.addData(data);
        qr.make();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const size = 120;
        canvas.width = size;
        canvas.height = size;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        const cellSize = size / qr.getModuleCount();
        ctx.fillStyle = '#000000';
        for (let row = 0; row < qr.getModuleCount(); row++) {
            for (let col = 0; col < qr.getModuleCount(); col++) {
                if (qr.isDark(row, col)) {
                    ctx.fillRect(
                        col * cellSize,
                        row * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            }
        }
        
        qrElement.appendChild(canvas);

    } catch (error) {
        console.error('QR Code generation failed:', error);
        this.showQRFallback(qrElement, data);
    }
},
showQRFallback(qrElement, data) {
    const ticketId = data.split('?ticket=')[1] || 'Билет';
    
    qrElement.innerHTML = `
        <div style="
            width: 120px; 
            height: 120px; 
            background: white; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            border: 2px solid #3498db; 
            border-radius: 8px;
            text-align: center;
            padding: 10px;
            color: #000000;
        ">
            <div style="font-size: 24px;">📱</div>
            <div style="font-size: 10px; margin-top: 5px; color: #000000; font-weight: bold;">
                ${ticketId}
            </div>
        </div>
    `;
},

generateTicketHTML(ticketType, qrData) {
    const hasDiscount = this.lastBookingData.discountCategory && this.lastBookingData.discountCategory.discountPercent > 0;
    
    // Всегда используем старый дизайн
    if (false) {
        // Новый дизайн - более похожий на реальный билет
        return `
            <html>
                <head>
                    <title>Билет - Usupovo Life Hall</title>
                    <style>
                        @media print {
                            @page {
                                size: A5 landscape;
                                margin: 0.5cm;
                            }
                            body { 
                                margin: 0; 
                                padding: 0;
                                font-family: 'Arial', sans-serif;
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                            }
                        }
                        
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        
                        body { 
                            font-family: 'Arial', sans-serif; 
                            margin: 0;
                            padding: 0.5cm;
                            background: #f5f5f5;
                        }
                        
                        .ticket-wrapper {
                            background: white;
                            border: 3px solid #2c3e50;
                            border-radius: 12px;
                            overflow: hidden;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                            position: relative;
                            width: 100%;
                            max-width: 21cm;
                        }
                        
                        /* Перфорация */
                        .perforation {
                            position: absolute;
                            left: 50%;
                            top: 0;
                            bottom: 0;
                            width: 2px;
                            background: repeating-linear-gradient(
                                to bottom,
                                transparent 0,
                                transparent 8px,
                                #2c3e50 8px,
                                #2c3e50 10px
                            );
                            transform: translateX(-50%);
                            z-index: 10;
                            pointer-events: none;
                        }
                        
                        .ticket-left, .ticket-right {
                            padding: 0.6cm;
                            min-height: 7cm;
                            box-sizing: border-box;
                        }
                        
                        .ticket-left {
                            border-right: 2px dashed #2c3e50;
                            display: flex;
                            flex-direction: column;
                            justify-content: flex-start;
                            align-items: center;
                            flex: 0 0 auto;
                            width: 45%;
                        }
                        
                        .ticket-right {
                            display: flex;
                            flex-direction: column;
                            justify-content: flex-start;
                            flex: 1;
                            width: 55%;
                        }
                        
                        .ticket-header-new {
                            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                            color: white;
                            padding: 0.6cm;
                            text-align: center;
                            position: relative;
                        }
                        
                        .ticket-header-new h1 {
                            font-size: 20px;
                            margin: 0;
                            font-weight: bold;
                            letter-spacing: 1px;
                        }
                        
                        .ticket-header-new .subtitle {
                            font-size: 11px;
                            opacity: 0.9;
                            margin-top: 0.2cm;
                            text-transform: uppercase;
                            letter-spacing: 2px;
                        }
                        
                        .discount-badge-new {
                            position: absolute;
                            top: 0.3cm;
                            right: 0.3cm;
                            background: #e67e22;
                            color: white;
                            padding: 0.2cm 0.4cm;
                            border-radius: 4px;
                            font-size: 9px;
                            font-weight: bold;
                            text-transform: uppercase;
                        }
                        
                        .qr-section-new {
                            text-align: center;
                            margin-bottom: 0.4cm;
                            width: 100%;
                        }
                        
                        .qr-container-new {
                            background: white;
                            padding: 0.2cm;
                            border: 2px solid #ecf0f1;
                            border-radius: 8px;
                            display: inline-block;
                        }
                        
                        .info-section-new {
                            flex: 1;
                            width: 100%;
                        }
                        
                        .info-row {
                            margin-bottom: 0.3cm;
                            padding-bottom: 0.25cm;
                            border-bottom: 1px dotted #bdc3c7;
                            width: 100%;
                        }
                        
                        .info-row:last-child {
                            border-bottom: none;
                            margin-bottom: 0;
                        }
                        
                        .info-label-new {
                            font-size: 8px;
                            color: #7f8c8d;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            margin-bottom: 0.15cm;
                            font-weight: 600;
                            display: block;
                        }
                        
                        .info-value-new {
                            font-size: 11px;
                            color: #2c3e50;
                            font-weight: 500;
                            display: block;
                            word-wrap: break-word;
                        }
                        
                        .ticket-id-new {
                            background: #f8f9fa;
                            padding: 0.3cm;
                            border-radius: 6px;
                            text-align: center;
                            margin-top: 0.4cm;
                            width: 100%;
                        }
                        
                        .ticket-id-new .label {
                            font-size: 7px;
                            color: #7f8c8d;
                            text-transform: uppercase;
                            margin-bottom: 0.15cm;
                            display: block;
                        }
                        
                        .ticket-id-new .value {
                            font-size: 12px;
                            font-weight: bold;
                            color: #2c3e50;
                            font-family: monospace;
                            letter-spacing: 1px;
                            display: block;
                        }
                        
                        .ticket-footer-new {
                            background: #f8f9fa;
                            padding: 0.4cm;
                            text-align: center;
                            font-size: 8px;
                            color: #6c757d;
                            border-top: 1px solid #e9ecef;
                        }
                        
                        .warning-box {
                            background: #fff3cd;
                            border: 1px solid #ffeaa7;
                            border-left: 4px solid #f39c12;
                            padding: 0.3cm;
                            border-radius: 4px;
                            margin-top: 0.4cm;
                            font-size: 9px;
                            color: #856404;
                        }
                    </style>
                    <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"><\/script>
                </head>
                <body>
                    <div class="ticket-wrapper">
                        <div class="perforation"></div>
                        <div class="ticket-header-new">
                            ${hasDiscount ? '<div class="discount-badge-new">🎫 ЛЬГОТА</div>' : ''}
                            <h1>🎭 USUPOVO LIFE HALL</h1>
                            <div class="subtitle">ЭЛЕКТРОННЫЙ БИЛЕТ</div>
                        </div>
                        <div style="display: flex; width: 100%;">
                            <div class="ticket-left">
                                <div class="qr-section-new">
                                    <div class="qr-container-new">
                                        <div id="qrcode"></div>
                                    </div>
                                </div>
                                <div class="ticket-id-new">
                                    <div class="label">Номер билета</div>
                                    <div class="value">${this.lastBookingData.bookingId}</div>
                                </div>
                            </div>
                            <div class="ticket-right">
                                <div class="info-section-new">
                                    <div class="info-row">
                                        <span class="info-label-new">Мероприятие</span>
                                        <span class="info-value-new">${this.currentEventName || 'Не указано'}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="info-label-new">Имя гостя</span>
                                        <span class="info-value-new">${this.lastBookingData.customerName || 'Не указано'}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="info-label-new">Места</span>
                                        <span class="info-value-new">${this.lastBookingData.seats.map(seat => seat.label).join(', ')}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="info-label-new">Категория</span>
                                        <span class="info-value-new">
                                            ${this.lastBookingData.discountCategory ? this.lastBookingData.discountCategory.name : 'Стандартный'}
                                            ${hasDiscount ? ` (${this.lastBookingData.discountCategory.discountPercent}% скидка)` : ''}
                                        </span>
                                    </div>
                                    ${this.lastBookingData.customerPhone ? `
                                    <div class="info-row">
                                        <span class="info-label-new">Телефон</span>
                                        <span class="info-value-new">${this.lastBookingData.customerPhone}</span>
                                    </div>
                                    ` : ''}
                                    ${hasDiscount ? `
                                    <div class="warning-box" style="margin-top: 0.3cm;">
                                        ⚠️ Льготный билет: необходимо предъявить документ, подтверждающий право на льготу
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="ticket-footer-new">
                            <div>📍 г.о. Домодедово, КП "Юсупово Лайф Парк", ул. Рассветная, 8</div>
                            <div style="margin-top: 0.2cm;">📞 +7 (985) 834-94-94 | Предъявите QR-код на входе</div>
                        </div>
                    </div>
                    <script>
                        setTimeout(function() {
                            generateQRForPrint('${qrData}');
                        }, 100);
                        
                        function generateQRForPrint(data) {
                            const qrElement = document.getElementById('qrcode');
                            if (!qrElement || !window.qrcode) return;
                            
                            try {
                                const qr = qrcode(0, 'M');
                                qr.addData(data);
                                qr.make();
                                
                                const canvas = document.createElement('canvas');
                                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                                const size = 120;
                                canvas.width = size;
                                canvas.height = size;
                                
                                ctx.fillStyle = '#FFFFFF';
                                ctx.fillRect(0, 0, size, size);
                                
                                const cellSize = size / qr.getModuleCount();
                                ctx.fillStyle = '#000000';
                                
                                for (let row = 0; row < qr.getModuleCount(); row++) {
                                    for (let col = 0; col < qr.getModuleCount(); col++) {
                                        if (qr.isDark(row, col)) {
                                            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                                        }
                                    }
                                }
                                
                                qrElement.innerHTML = '';
                                qrElement.appendChild(canvas);
                            } catch (error) {
                                console.error('QR error:', error);
                            }
                        }
                    <\/script>
                </body>
            </html>
        `;
    } else {
        // Старый дизайн (оригинальный)
        return `
            <html>
                <head>
                    <title>Билет - Usupovo Life Hall</title>
                    <style>
                        @media print {
                            @page {
                                size: A5 landscape;
                                margin: 0.3cm;
                            }
                            body { 
                                margin: 0; 
                                padding: 0;
                                font-family: Arial, sans-serif;
                                -webkit-print-color-adjust: exact;
                            }
                        }
                        
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 0;
                            padding: 0.3cm;
                            background: white;
                            width: 100vw;
                            height: 100vh;
                        }
                        
                        .print-ticket { 
                            width: 100%;
                            height: 10.5cm;
                            border: 2px solid #3498db; 
                            border-radius: 8px; 
                            background: white;
                            color: #2c3e50;
                            overflow: hidden;
                            display: flex;
                            flex-direction: column;
                        }
                        
                        .ticket-header {
                            background: linear-gradient(135deg, #3498db, #2980b9); 
                            color: white; 
                            padding: 0.4rem 0.6rem;
                            text-align: center;
                            flex-shrink: 0;
                            position: relative;
                        }
                        
                        .discount-badge-print {
                            position: absolute;
                            top: 5px;
                            right: 5px;
                            background: #e67e22;
                            color: white;
                            padding: 0.2rem 0.4rem;
                            border-radius: 1rem;
                            font-size: 8px;
                            font-weight: bold;
                        }
                        
                        .ticket-main {
                            display: flex;
                            flex: 1;
                            min-height: 0;
                        }
                        
                        .qr-section {
                            flex: 0 0 4.5cm;
                            padding: 0.5rem;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            border-right: 1px dashed #3498db;
                        }
                        
                        .qr-container { 
                            background: white; 
                            padding: 5px; 
                            border-radius: 5px; 
                            border: 1px solid #f0f0f0;
                            margin-bottom: 0.5rem;
                        }
                        
                        .info-section {
                            flex: 1;
                            padding: 0.5rem;
                            font-size: 14px;
                            display: flex;
                            flex-direction: column;
                        }
                        
                        .info-grid {
                            flex: 1;
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 0.4rem;
                        }
                        
                        .info-item {
                            padding: 0.3rem;
                        }
                        
                        .info-label {
                            font-weight: bold;
                            color: #3498db;
                            font-size: 12px;
                            margin-bottom: 0.15rem;
                        }
                        
                        .info-value {
                            font-size: 13px;
                            line-height: 1.3;
                        }
                        
                        .discount-warning-print {
                            background: #fff3cd;
                            border: 1px solid #ffeaa7;
                            color: #856404;
                            padding: 0.3rem;
                            border-radius: 4px;
                            margin: 0.2rem 0;
                            font-size: 9px;
                            grid-column: span 2;
                        }
                        
                        .ticket-footer {
                            background: #f8f9fa; 
                            padding: 0.4rem 0.6rem;
                            border-top: 1px solid #e9ecef;
                            font-size: 9px;
                            text-align: center;
                            color: #6c757d;
                            flex-shrink: 0;
                        }
                        
                        .rules-amount {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-top: 0.3rem;
                            padding-top: 0.3rem;
                            border-top: 1px dashed #3498db;
                        }
                        
                        .amount {
                            font-size: 14px;
                            font-weight: bold;
                            color: #27ae60;
                        }
                        
                        .rules-icons img {
                            height: 18px;
                        }
                        
                        h2 {
                            font-size: 16px;
                            margin: 0;
                        }
                        
                        .header-subtitle {
                            font-size: 11px;
                            opacity: 0.9;
                            margin-top: 0.1rem;
                        }
                        
                        .amount-in-info {
                            font-size: 14px;
                            font-weight: bold;
                            color: #27ae60;
                            text-align: center;
                            margin-top: 0.3rem;
                        }
                    </style>
                    <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"><\/script>
                </head>
                <body>
                    <div class="print-ticket">
                        <div class="ticket-header">
                            <h2>🎭 Usupovo Life Hall</h2>
                            <div class="header-subtitle">ЭЛЕКТРОННЫЙ БИЛЕТ</div>
                            ${hasDiscount ? '<div class="discount-badge-print">🎫 ЛЬГОТА</div>' : ''}
                        </div>
                        <div class="ticket-main">
                            <div class="qr-section">
                                <div class="qr-container">
                                    <div id="qrcode"></div>
                                </div>
                            </div>
                            <div class="info-section">
                                <div class="info-grid">
                                    <div class="info-item">
                                        <div class="info-label">МЕРОПРИЯТИЕ</div>
                                        <div class="info-value">${this.currentEventName || 'Мероприятие не указано'}</div>
                                    </div>
                                    <div class="info-item">
                                        <div class="info-label">ИМЯ</div>
                                        <div class="info-value">${this.lastBookingData.customerName || 'Не указано'}</div>
                                    </div>
                                    <div class="info-item">
                                        <div class="info-label">КАТЕГОРИЯ</div>
                                        <div class="info-value">
                                            ${this.lastBookingData.discountCategory ? this.lastBookingData.discountCategory.name : 'Стандартный'}
                                            ${hasDiscount ? ` (скидка ${this.lastBookingData.discountCategory.discountPercent}%)` : ''}
                                        </div>
                                    </div>
                                    <div class="info-item">
                                        <div class="info-label">ТЕЛЕФОН</div>
                                        <div class="info-value">${this.lastBookingData.customerPhone || 'Не указано'}</div>
                                    </div>
                                    ${this.lastBookingData.customerEmail ? `
                                    <div class="info-item">
                                        <div class="info-label">EMAIL</div>
                                        <div class="info-value">${this.lastBookingData.customerEmail}</div>
                                    </div>
                                    ` : ''}
                                    <div class="info-item" style="grid-column: span 2;">
                                        <div class="info-label">МЕСТА</div>
                                        <div class="info-value">${this.lastBookingData.seats.map(seat => `${seat.label} (${seat.type})`).join(', ')}</div>
                                    </div>
                                    <div class="info-item" style="grid-column: span 2;">
                                        <div class="info-label">НОМЕР БРОНИ</div>
                                        <div class="info-value">${this.lastBookingData.bookingId}</div>
                                    </div>
                                    ${hasDiscount ? `
                                    <div class="discount-warning-print">
                                        <strong>⚠️ Льготный билет:</strong> Необходимо предъявить документ, подтверждающий право на льготу
                                    </div>
                                    ` : ''}
                                    <div class="info-item" style="grid-column: span 2; text-align: center; margin-top: 0.2rem;">
                                        <div class="amount-in-info">
                                            💰 ${this.lastBookingData.total} ₽<br>
                                            <small style="color: #7f8c8d; font-weight: normal;">Оплачено</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="rules-amount">
                                    <div class="rules-icons">
                                        <img src="${window.location.origin}/images/icons.png" alt="Правила зала">
                                    </div>
                                    <div style="font-size: 9px; color: #7f8c8d;">Правила зала</div>
                                </div>
                            </div>
                        </div>
                        <div class="ticket-footer">
                            <div>📍 г.о. Домодедово, КП "Юсупово Лайф Парк", ул. Рассветная, 8</div>
                            <div>📞 +7 (985) 834-94-94 | Предъявите QR-код на входе</div>
                        </div>
                    </div>
                    <script>
                        setTimeout(function() {
                            generateQRForPrint('${qrData}');
                        }, 100);
                        
                        function generateQRForPrint(data) {
                            const qrElement = document.getElementById('qrcode');
                            if (!qrElement || !window.qrcode) return;
                            
                            try {
                                const qr = qrcode(0, 'L');
                                qr.addData(data);
                                qr.make();
                                
                                const canvas = document.createElement('canvas');
                                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                                const size = 90;
                                canvas.width = size;
                                canvas.height = size;
                                
                                ctx.fillStyle = '#FFFFFF';
                                ctx.fillRect(0, 0, size, size);
                                
                                const cellSize = size / qr.getModuleCount();
                                ctx.fillStyle = '#000000';
                                
                                for (let row = 0; row < qr.getModuleCount(); row++) {
                                    for (let col = 0; col < qr.getModuleCount(); col++) {
                                        if (qr.isDark(row, col)) {
                                            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                                        }
                                    }
                                }
                                
                                qrElement.innerHTML = '';
                                qrElement.appendChild(canvas);
                            } catch (error) {
                                console.error('Print QR error:', error);
                            }
                        }
                    <\/script>
                </body>
            </html>
        `;
    }
},

async printTicket() {
    const ticket = document.querySelector('.ticket');
    if (!ticket) return;
    const qrData = this.generateQRData(this.lastBookingData);
    const ticketHTML = this.generateTicketHTML('old', qrData);
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(ticketHTML);
    printWindow.document.close();
    setTimeout(() => {
        printWindow.print();
        setTimeout(() => {
            printWindow.close();
        }, 500);
    }, 500);
},

async saveTicketAsPDF() {
    const ticket = document.querySelector('.ticket');
    if (!ticket) {
        showError('Билет не найден');
        return;
    }
    
    if (typeof html2pdf === 'undefined') {
        showError('Библиотека для создания PDF не загружена. Пожалуйста, обновите страницу.');
        return;
    }
    
    try {
        // Используем существующий билет на странице
        const ticketElement = ticket.cloneNode(true);
        
        // Конвертируем canvas с QR-кодом в изображение для надежного клонирования
        const originalQRCanvas = ticket.querySelector('#qrcode canvas');
        if (originalQRCanvas) {
            const qrElement = ticketElement.querySelector('#qrcode');
            if (qrElement) {
                // Конвертируем canvas в data URL изображения
                const canvasDataURL = originalQRCanvas.toDataURL('image/png');
                const img = document.createElement('img');
                img.src = canvasDataURL;
                img.style.width = originalQRCanvas.width + 'px';
                img.style.height = originalQRCanvas.height + 'px';
                img.style.display = 'block';
                qrElement.innerHTML = '';
                qrElement.appendChild(img);
            }
        }
        
        // Создаем временный контейнер для PDF
        // Размещаем его видимым, но за пределами видимой области экрана
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.top = '0';
        tempContainer.style.left = '0';
        tempContainer.style.width = '21cm';
        tempContainer.style.minHeight = '14.8cm';
        tempContainer.style.background = 'white';
        tempContainer.style.padding = '0.5cm';
        tempContainer.style.zIndex = '999999';
        // Используем transform вместо visibility для лучшей совместимости с html2canvas
        tempContainer.style.transform = 'translateX(-100%)';
        document.body.appendChild(tempContainer);
        
        // Клонируем билет в контейнер
        tempContainer.appendChild(ticketElement);
        
        // Ждем полной отрисовки
        await new Promise(resolve => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setTimeout(resolve, 800); // Увеличиваем время ожидания
                });
            });
        });
        
        // Настройки для PDF
        const opt = {
            margin: [0.3, 0.3, 0.3, 0.3],
            filename: `Билет_${this.lastBookingData.bookingId}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                width: tempContainer.scrollWidth,
                height: tempContainer.scrollHeight,
                windowWidth: tempContainer.scrollWidth,
                windowHeight: tempContainer.scrollHeight,
                allowTaint: true,
                removeContainer: false
            },
            jsPDF: { 
                unit: 'cm', 
                format: 'a5', 
                orientation: 'landscape' 
            }
        };
        
        // Генерируем PDF
        await html2pdf().set(opt).from(tempContainer).save();
        
        // Удаляем временный контейнер
        setTimeout(() => {
            if (tempContainer.parentNode) {
                document.body.removeChild(tempContainer);
            }
        }, 500);
        
        // Показываем уведомление
        showSuccess('Билет сохранен в PDF!');
    } catch (error) {
        console.error('Ошибка сохранения PDF:', error);
        showError('Ошибка при сохранении PDF: ' + error.message);
    }
},
    
    getEventById(eventId) {
        return {
            id: eventId,
            name: `Мероприятие #${eventId}`,
            date: new Date().toISOString()
        };
    },
    
    getRussianPlural(number) {
        if (number === 1) return '';
        if (number >= 2 && number <= 4) return 'а';
        return 'ов';
    },
    
    closeModal() {
        document.getElementById('bookingModal').style.display = 'none';
    },
    applyPromoCode: async function() {
        const promoCode = document.getElementById('promoCode').value.trim();
        let total = Array.from(this.selectedSeats.values()).reduce((sum, seat) => sum + seat.price, 0);
        
        // Учитываем скидку категории при расчете
        if (this.selectedDiscountCategory && this.selectedDiscountCategory.id) {
            total = total - (total * this.selectedDiscountCategory.discountPercent / 100);
        }
        
        if (!promoCode) {
            this.showNotification('Введите промокод', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/promo/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: promoCode,
                    totalAmount: total
                })
            });

            const result = await response.json();
            
            if (result.success && result.valid) {
                this.currentPromo = result.promo;
                // При применении промокода используем updateTotalWithDiscount для правильного расчета
                this.updateTotalWithDiscount();
                this.showNotification(result.message, 'success');
            } else {
                this.currentPromo = null;
                // При отмене промокода также используем updateTotalWithDiscount
                this.updateTotalWithDiscount();
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('❌ Ошибка применения промокода:', error);
            this.showNotification('Ошибка применения промокода', 'error');
        }
    },

    updatePaymentSummary: function(total, promo = null) {
        const summaryElement = document.getElementById('paymentSummary');
        if (!summaryElement) return;

        const paymentMethod = document.getElementById('paymentMethod')?.value || 'card';
        const baseTotal = Array.from(this.selectedSeats.values()).reduce((sum, seat) => sum + seat.price, 0);
        let categoryDiscount = 0;
        let categoryName = '';

        if (this.selectedDiscountCategory && this.selectedDiscountCategory.id) {
            categoryDiscount = this.selectedDiscountCategory.discountPercent;
            categoryName = this.selectedDiscountCategory.name;
        }

        // Рассчитываем промежуточную сумму после скидки категории
        let totalAfterCategory = baseTotal;
        if (categoryDiscount > 0) {
            totalAfterCategory = baseTotal - (baseTotal * categoryDiscount / 100);
        }

        // Рассчитываем скидку 3% для карты (если нет промокода)
        let cardDiscount = 0;
        let cardDiscountAmount = 0;
        if (paymentMethod === 'card' && !promo) {
            cardDiscount = 3;
            cardDiscountAmount = Math.round(totalAfterCategory * 0.03);
        }

        if (promo) {
            summaryElement.innerHTML = `
                <div style="background: #e8f4fd; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Стоимость билетов:</span>
                        <span>${baseTotal} ₽</span>
                    </div>
                    ${categoryDiscount > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: #3498db;">
                        <span>Скидка категории "${categoryName}" (${categoryDiscount}%):</span>
                        <span>-${Math.round(baseTotal * categoryDiscount / 100)} ₽</span>
                    </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: #27ae60;">
                        <span>Скидка по промокоду (${promo.discount}%):</span>
                        <span>-${promo.discountAmount} ₽</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.2rem; border-top: 1px solid #3498db; padding-top: 0.5rem;">
                        <span>Итого к оплате:</span>
                        <span>${promo.finalAmount} ₽</span>
                    </div>
                    <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
                        Промокод: <strong>${promo.code}</strong>
                        ${categoryDiscount > 0 ? ` | Категория: <strong>${categoryName}</strong>` : ''}
                    </div>
                </div>
            `;
        } else {
            summaryElement.innerHTML = `
                <div style="background: #e8f4fd; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                    ${categoryDiscount > 0 || cardDiscount > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Базовая стоимость:</span>
                        <span>${baseTotal} ₽</span>
                    </div>
                    ` : ''}
                    ${categoryDiscount > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: #3498db;">
                        <span>Скидка категории "${categoryName}" (${categoryDiscount}%):</span>
                        <span>-${Math.round(baseTotal * categoryDiscount / 100)} ₽</span>
                    </div>
                    ` : ''}
                    ${cardDiscount > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: #27ae60;">
                        <span>Скидка при оплате картой (${cardDiscount}%):</span>
                        <span>-${cardDiscountAmount} ₽</span>
                    </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.2rem; ${categoryDiscount > 0 || cardDiscount > 0 ? 'border-top: 1px solid #3498db; padding-top: 0.5rem;' : ''}">
                        <span>Итого к оплате:</span>
                        <span>${Math.round(total)} ₽</span>
                    </div>
                    ${categoryDiscount > 0 ? `
                    <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
                        Категория: <strong>${categoryName}</strong>
                    </div>
                    ` : ''}
                </div>
            `;
        }
    },
};

// Плавная прокрутка к секции (объединенная функция)
function scrollToEvents() {
    const eventsSection = document.getElementById('events') || document.querySelector('#events');
    if (eventsSection) {
        eventsSection.scrollIntoView({
            behavior: 'smooth'
        });
    }
}

// Анимация при прокрутке (оптимизировано с debounce)
let scrollTimeout;
function animateOnScroll() {
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }
    
    scrollTimeout = setTimeout(() => {
        const sections = document.querySelectorAll('.animated-section:not(.visible)');
        const viewportHeight = window.innerHeight * 0.8;
        
        sections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            if (sectionTop < viewportHeight) {
                section.classList.add('visible');
            }
        });
    }, 10);
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    App.init();
    animateOnScroll();
    window.addEventListener('scroll', animateOnScroll, { passive: true });
});

window.addEventListener('error', function(e) {
    console.error('Произошла ошибка:', e.error);
});

// Service Worker регистрация
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .catch(error => {
                console.error('Service Worker ошибка:', error);
            });
    });
}

// Функции для мобильного меню
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

function closeMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
        navLinks.classList.remove('active');
    }
}

// Закрытие меню при клике вне его
document.addEventListener('click', function(event) {
    const nav = document.querySelector('.nav');
    const navLinks = document.getElementById('navLinks');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (navLinks && navLinks.classList.contains('active')) {
        if (!nav.contains(event.target)) {
            closeMobileMenu();
        }
    }
});