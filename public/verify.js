const API_BASE = '/api';

let html5QrcodeScanner = null;
let isScannerActive = false;
let isLibraryLoaded = false;

class TicketVerifier {
    constructor() {
        this.initManualInput();
        this.loadScannerLibrary();
    }

    // Загружаем библиотеку сканирования только с локального пути
    loadScannerLibrary() {
        if (typeof Html5Qrcode !== 'undefined') {
            isLibraryLoaded = true;
            console.log('✅ Библиотека сканирования уже загружена');
            this.updateScannerButton();
            return;
        }

        const script = document.createElement('script');
        script.src = '/lib/html5-qrcode.min.js';
        script.onload = () => {
            isLibraryLoaded = true;
            console.log('✅ Библиотека сканирования загружена с локального пути');
            this.updateScannerButton();
        };
        script.onerror = () => {
            console.error('❌ Не удалось загрузить локальную копию библиотеки');
            this.showScannerError('Библиотека сканирования не загружена. Проверьте наличие файла /lib/html5-qrcode.min.js');
        };
        document.head.appendChild(script);
    }

    updateScannerButton() {
        const startButton = document.getElementById('startScanner');
        if (startButton) {
            startButton.disabled = false;
            startButton.innerHTML = '📷 Запустить сканер QR-кодов';
            startButton.style.background = '#3498db';
        }
    }

    showScannerError(message) {
        const startButton = document.getElementById('startScanner');
        if (startButton) {
            startButton.disabled = true;
            startButton.innerHTML = '❌ Сканер недоступен';
            startButton.style.background = '#95a5a6';
        }
        
        const errorElement = document.getElementById('cameraError');
        if (errorElement) {
            errorElement.style.display = 'block';
            errorElement.innerHTML = message;
        }
    }

    initManualInput() {
        const input = document.getElementById('manualTicketInput');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.checkManualTicket();
                }
            });
        }
    }

    // Запуск сканера QR-кодов
    async startQRScanner() {
        if (!isLibraryLoaded || typeof Html5Qrcode === 'undefined') {
            this.showScannerError('Сканер QR-кодов еще загружается...');
            return;
        }

        const scannerElement = document.getElementById('reader');
        const startButton = document.getElementById('startScanner');
        const stopButton = document.getElementById('stopScanner');
        const errorElement = document.getElementById('cameraError');

        if (!scannerElement) {
            console.error('❌ Элемент сканера не найден');
            return;
        }

        // Очищаем предыдущий сканер
        if (html5QrcodeScanner && isScannerActive) {
            await this.stopQRScanner();
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Очищаем содержимое сканера
        scannerElement.innerHTML = '';
        scannerElement.style.position = 'relative';
        scannerElement.style.overflow = 'hidden';

        if (errorElement) errorElement.style.display = 'none';

        try {
            // Создаем сканер с правильными настройками
            html5QrcodeScanner = new Html5Qrcode("reader");
            
            // Оптимизированная конфигурация для мобильных устройств
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const readerElement = document.getElementById('reader');
            const readerWidth = readerElement ? readerElement.offsetWidth : 300;
            const readerHeight = readerElement ? readerElement.offsetHeight : 400;
            
            // Адаптивный размер QR-бокса для мобильных
            const qrBoxSize = isMobile ? Math.min(readerWidth * 0.8, readerHeight * 0.6, 300) : 250;
            
            const config = {
                fps: isMobile ? 15 : 10, // Больше FPS на мобильных для лучшей производительности
                qrbox: { width: qrBoxSize, height: qrBoxSize },
                aspectRatio: 1.0,
                disableFlip: false,
                videoConstraints: {
                    facingMode: "environment", // Задняя камера
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            console.log('🔄 Запускаем камеру...');

            // Запускаем камеру с отображением видео
            await html5QrcodeScanner.start(
                { facingMode: "environment" },
                config,
                (decodedText) => {
                    console.log('✅ QR-код распознан:', decodedText);
                    this.onQRCodeScanned(decodedText);
                },
                (error) => {
                    // Игнорируем обычные ошибки сканирования
                    if (!error.message?.includes('No QR code found')) {
                        console.log('🔍 Сканирование...');
                    }
                }
            );

            // Успешный запуск
            console.log('✅ Сканер QR-кодов запущен, видео должно отображаться');
            
            // Принудительно проверяем отображение видео
            setTimeout(() => {
                this.checkVideoDisplay();
            }, 1000);

            if (startButton) startButton.style.display = 'none';
            if (stopButton) stopButton.style.display = 'block';
            isScannerActive = true;

        } catch (error) {
            console.error('❌ Ошибка запуска сканера:', error);
            this.handleScannerError(error);
        }
    }

    // Проверяем отображение видео
    checkVideoDisplay() {
        const scannerElement = document.getElementById('reader');
        if (!scannerElement) return;

        // Ищем видео элемент внутри сканера
        const videoElement = scannerElement.querySelector('video');
        const canvasElement = scannerElement.querySelector('canvas');
        
        if (videoElement) {
            // Принудительно применяем стили для видео на мобильных
            videoElement.style.width = '100%';
            videoElement.style.height = '100%';
            videoElement.style.objectFit = 'cover';
            videoElement.style.borderRadius = '20px';
            // Убрано зеркальное отображение - для билетёра нормальное отображение удобнее
            videoElement.setAttribute('playsinline', 'true'); // Важно для iOS
            videoElement.setAttribute('webkit-playsinline', 'true');
        }
        
        if (canvasElement) {
            // На мобильных скрываем canvas, оставляем только видео
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) {
                canvasElement.style.display = 'none';
            }
        }
        
        // Показываем статус
        if (videoElement) {
            this.showScannerStatus('📷 Наведите камеру на QR-код');
        } else {
            this.showScannerStatus('📷 Камера активна');
        }
    }

    // Показываем статус сканера
    showScannerStatus(message) {
        const scannerElement = document.getElementById('reader');
        if (!scannerElement) return;

        // Удаляем предыдущий статус
        const existingStatus = document.getElementById('scannerStatus');
        if (existingStatus) {
            existingStatus.remove();
        }

        const statusElement = document.createElement('div');
        statusElement.id = 'scannerStatus';
        statusElement.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            background: rgba(46, 204, 113, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        statusElement.innerHTML = `🎯 ${message}`;
        
        scannerElement.appendChild(statusElement);
    }

    onQRCodeScanned(decodedText) {
        console.log('📷 QR-код распознан:', decodedText);
        
        // Извлекаем номер билета из QR-кода
        const ticketId = this.extractTicketIdFromQR(decodedText);
        
        if (ticketId) {
            console.log('🎫 Извлечен номер билета:', ticketId);
            setTimeout(() => {
                this.stopQRScanner();
                this.verifyTicket(ticketId);
            }, 100);
        } else {
            console.error('❌ Не удалось извлечь номер билета из QR-кода');
            this.showError('Неверный формат QR-кода');
        }
    }

    // Извлекаем номер билета из различных форматов QR-кода
    extractTicketIdFromQR(qrContent) {
        console.log('🔍 Анализируем QR-код:', qrContent);
        
        // Если это URL с параметром ticket
        if (qrContent.includes('ticket=')) {
            const urlParams = new URLSearchParams(new URL(qrContent).search);
            const ticketId = urlParams.get('ticket');
            if (ticketId) {
                return ticketId;
            }
        }
        
        // Если это просто номер билета (начинается с B и цифры)
        if (qrContent.match(/^B\d+$/)) {
            return qrContent;
        }
        
        // Если это URL без параметров, но содержит номер билета
        const ticketMatch = qrContent.match(/B\d+/);
        if (ticketMatch) {
            return ticketMatch[0];
        }
        
        // Если это JSON строка
        try {
            const jsonData = JSON.parse(qrContent);
            if (jsonData.ticket || jsonData.id) {
                return jsonData.ticket || jsonData.id;
            }
        } catch (e) {
            // Не JSON, продолжаем анализ
        }
        
        // Последняя попытка - ищем любой похожий на билет идентификатор
        const possibleTicket = qrContent.split('/').pop().split('?').pop().split('=').pop();
        if (possibleTicket && possibleTicket.match(/^[A-Za-z0-9]+$/)) {
            console.log('🎫 Предполагаемый номер билета:', possibleTicket);
            return possibleTicket;
        }
        
        return null;
    }

    handleScannerError(error) {
        const scannerElement = document.getElementById('reader');
        const errorElement = document.getElementById('cameraError');

        let errorMessage = 'Не удалось запустить камеру';
        const errorMsg = error.message || error.toString() || '';

        if (error.name === 'AbortError' || errorMsg.includes('AbortError')) {
            console.log('Сканер был прерван - это нормально');
            return;
        } else if (errorMsg.includes('Permission') || errorMsg.includes('NotAllowedError')) {
            errorMessage = 'Доступ к камере запрещен. Разрешите доступ к камере в настройках браузера.';
        } else if (errorMsg.includes('NotFound')) {
            errorMessage = 'Камера не найдена. Убедитесь, что камера подключена и доступна.';
        } else if (errorMsg.includes('NotSupported')) {
            errorMessage = 'Ваш браузер не поддерживает доступ к камере.';
        } else if (errorMsg.includes('NotAllowedError')) {
            errorMessage = 'Доступ к камере запрещен. Разрешите доступ к камере в настройках браузера.';
        }
        
        if (scannerElement) {
            scannerElement.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; padding: 2rem; text-align: center;">
                    <div>
                        <div style="font-size: 4rem; margin-bottom: 1rem;">❌</div>
                        <p style="font-size: 1rem; margin-bottom: 1.5rem; line-height: 1.6;">${errorMessage}</p>
                        <button onclick="startQRScanner()" style="background: #3498db; color: white; border: none; padding: 14px 24px; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; min-height: 52px; width: 100%; max-width: 300px;">
                            🔄 Попробовать снова
                        </button>
                    </div>
                </div>
            `;
        }
        
        if (errorElement) {
            errorElement.style.display = 'block';
            errorElement.innerHTML = `❌ ${errorMessage}`;
        }
        
        console.error('❌ Ошибка сканера:', error);
        
        this.resetScannerUI();
        isScannerActive = false;
    }

    // Остановка сканера
    async stopQRScanner() {
        if (html5QrcodeScanner && isScannerActive) {
            try {
                await html5QrcodeScanner.stop();
                console.log('⏹️ Сканер остановлен');
            } catch (err) {
                // Игнорируем ошибки остановки, связанные с AbortError
                if (err.name !== 'AbortError' && !err.message.includes('AbortError')) {
                    console.error('Ошибка остановки сканера:', err);
                } else {
                    console.log('Сканер остановлен (AbortError проигнорирована)');
                }
            }
        }
        
        this.resetScannerUI();
        isScannerActive = false;
    }

    resetScannerUI() {
        const startButton = document.getElementById('startScanner');
        const stopButton = document.getElementById('stopScanner');
        const scannerElement = document.getElementById('reader');
        
        if (startButton) {
            startButton.style.display = 'block';
            startButton.disabled = false;
            startButton.innerHTML = '📷 Запустить сканер';
        }
        if (stopButton) {
            stopButton.style.display = 'none';
        }
        if (scannerElement) {
            scannerElement.innerHTML = `
                <div class="loading">
                    <div class="loading-icon">📷</div>
                    <p>Нажмите кнопку для запуска камеры</p>
                </div>
            `;
        }
    }

    async verifyTicket(ticketId) {
        try {
            if (!ticketId) {
                this.showError('Введите номер билета');
                return;
            }

            const cleanTicketId = ticketId.trim().replace(/[^A-Za-z0-9]/g, '');
            
            if (!cleanTicketId) {
                this.showError('Неверный формат номера билета');
                return;
            }

            console.log('🔍 Начинаем проверку билета:', cleanTicketId);
            this.clearResults();

            this.showLoading('Проверка билета...');

            const response = await fetch(`${API_BASE}/ticket/${cleanTicketId}`);
            
            console.log('📊 Ответ при проверке:', {
                status: response.status,
                ok: response.ok,
                url: response.url
            });

            if (!response.ok) {
                if (response.status === 404) {
                    this.showError(`Билет "${cleanTicketId}" не найден`);
                } else if (response.status === 400) {
                    this.showError('Неверный формат номера билета');
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return;
            }
            
            const result = await response.json();
            console.log('📋 Данные билета:', result);

            if (result.valid) {
                console.log('✅ Билет действителен, статус:', result.ticket?.status);
                this.showTicketInfo(result.ticket);
            } else {
                console.log('❌ Билет недействителен:', result.message);
                this.showError(result.message || 'Билет не действителен');
            }
        } catch (error) {
            console.error('❌ Ошибка проверки билета:', error);
            this.showError('Ошибка при проверке билета: ' + error.message);
        }
    }

    // Метод для отображения загрузки
    showLoading(message) {
        const infoElement = document.getElementById('ticketInfo');
        if (!infoElement) return;

        infoElement.innerHTML = `
            <div class="loading">
                <div class="loading-icon">⏳</div>
                <p style="font-size: 1rem; color: #666;">${message}</p>
            </div>
        `;
        infoElement.className = 'ticket-info';
        infoElement.style.display = 'block';
    }

    showTicketInfo(ticket) {
        const infoElement = document.getElementById('ticketInfo');
        if (!infoElement) return;

        // Убедимся, что статус корректный
        const status = ticket.status || 'active';
        const isUsed = status === 'used';
        
        // Проверяем, есть ли льготная категория
        const hasDiscount = ticket.discount_category && ticket.discount_category.discount_percent > 0;
        const discountCategory = ticket.discount_category;
        
        const buttonHTML = isUsed 
            ? '<button disabled class="success" style="opacity: 0.6;">✅ Уже использован</button>'
            : `<button onclick="markAsUsed('${ticket.id}')" class="success">✅ Отметить как использованный</button>`;

        // Добавляем информацию о льготной категории
        const discountInfo = hasDiscount ? `
            <div class="discount-category">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                    <span style="font-size: 1.3rem;">🎫</span>
                    <strong style="font-size: 1.1rem;">Льготная категория</strong>
                </div>
                <div class="info-row">
                    <span class="info-label">Название:</span>
                    <span class="info-value">${discountCategory.name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Скидка:</span>
                    <span class="info-value">${discountCategory.discount_percent}%</span>
                </div>
            </div>
            
            <div class="discount-warning">
                <span style="font-size: 1.3rem;">⚠️</span>
                <div>
                    <strong style="display: block; margin-bottom: 0.5rem;">Требуется проверка документов</strong>
                    <div style="font-size: 0.9rem; line-height: 1.5;">
                        Необходимо убедиться, что гость имеет документ, подтверждающий право на льготу
                    </div>
                </div>
            </div>
        ` : '';

        const statusText = isUsed ? 'Использован' : 'Активен';
        const statusColor = isUsed ? '#95a5a6' : '#27ae60';

        infoElement.innerHTML = `
            <h4 style="color: ${statusColor}; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                ${isUsed ? '✅' : '✓'} Билет действителен
                ${hasDiscount ? '<span class="discount-badge">🎫 ЛЬГОТА</span>' : ''}
            </h4>
            
            <div class="info-row">
                <span class="info-label">Мероприятие:</span>
                <span class="info-value">${ticket.event || 'Не указано'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Дата:</span>
                <span class="info-value">${ticket.eventDate ? new Date(ticket.eventDate).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : 'Не указана'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Гость:</span>
                <span class="info-value">${ticket.customer || 'Не указан'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Места:</span>
                <span class="info-value">${ticket.seats || 'Не указаны'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Номер билета:</span>
                <span class="info-value" style="font-family: monospace; font-size: 0.9rem;">${ticket.id || 'Не указан'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Статус:</span>
                <span class="info-value" style="color: ${statusColor}; font-weight: 600;">${statusText}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Способ оплаты:</span>
                <span class="info-value">${ticket.payment_method === 'cash' ? '💵 Наличными' : '💳 Картой'}</span>
            </div>
            ${discountInfo}
            <div style="margin-top: 1.5rem;">
                ${buttonHTML}
            </div>
        `;
        
        // Добавляем специальный класс для льготных билетов
        infoElement.className = `ticket-info valid ${hasDiscount ? 'discount-ticket' : ''}`;
        infoElement.style.display = 'block';
        
        // Прокручиваем к информации о билете
        setTimeout(() => {
            infoElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
        
        console.log('🎫 Информация о билете обновлена, статус:', status, 'Льготная категория:', hasDiscount);
    }

    showError(message) {
        // Показываем toast-уведомление
        if (window.showError) {
            window.showError(message);
        }
        
        const infoElement = document.getElementById('ticketInfo');
        if (!infoElement) return;

        infoElement.innerHTML = `
            <h4 style="color: #e74c3c; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                ❌ Ошибка
            </h4>
            <div style="color: #e74c3c; margin-bottom: 1.5rem; line-height: 1.6;">
                ${message}
            </div>
            <button onclick="clearResults()" style="width: 100%;">
                🔄 Попробовать снова
            </button>
        `;
        infoElement.className = 'ticket-info invalid';
        infoElement.style.display = 'block';
        
        // Прокручиваем к ошибке
        setTimeout(() => {
            infoElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }

    checkManualTicket() {
        const ticketId = document.getElementById('manualTicketInput').value.trim();
        if (ticketId) {
            this.verifyTicket(ticketId);
        } else {
            this.showError('Введите номер билета');
        }
    }

    clearResults() {
        const infoElement = document.getElementById('ticketInfo');
        const inputElement = document.getElementById('manualTicketInput');
        
        if (infoElement) {
            infoElement.style.display = 'none';
            infoElement.innerHTML = '';
        }
        if (inputElement) {
            inputElement.value = '';
            inputElement.focus();
        }
    }
}

// Глобальные функции
function startQRScanner() {
    if (window.ticketVerifier) {
        window.ticketVerifier.startQRScanner();
    }
}

function stopQRScanner() {
    if (window.ticketVerifier) {
        window.ticketVerifier.stopQRScanner();
    }
}

function checkManualTicket() {
    if (window.ticketVerifier) {
        window.ticketVerifier.checkManualTicket();
    }
}

async function markAsUsed(ticketId) {
    try {
        console.log('🔄 Начинаем отметку билета:', ticketId);
        
        // Сохраняем оригинальный ticketId для повторной проверки
        const originalTicketId = ticketId;
        
        // Показываем загрузку
        const infoElement = document.getElementById('ticketInfo');
        if (infoElement) {
            const button = infoElement.querySelector('button');
            if (button) {
                button.disabled = true;
                button.innerHTML = '⏳ Обновление...';
                button.style.background = '#f39c12';
            }
        }

        // 1. Отправляем запрос на отметку как использованный
        console.log('📤 Отправляем POST запрос на:', `${API_BASE}/ticket/${ticketId}/use`);
        
        const response = await fetch(`${API_BASE}/ticket/${ticketId}/use`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log('📥 Ответ сервера:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        });

        const result = await response.json();
        console.log('📋 Тело ответа:', result);

        if (response.ok) {
            console.log('✅ Сервер подтвердил отметку билета');
            
            // 2. Немедленно обновляем UI на основе ответа сервера
            if (result.ticket && result.ticket.status === 'used') {
                console.log('🎫 Сервер вернул билет со статусом "used"');
                updateTicketStatusInUI(ticketId, 'used', result.ticket);
            } else {
                console.log('⚠️ Сервер не вернул обновленный билет, обновляем локально');
                updateTicketStatusInUI(ticketId, 'used');
            }
            
            // 3. Делаем дополнительную проверку через 2 секунды
            console.log('🔄 Запланирована проверка статуса через 2 секунды...');
            setTimeout(async () => {
                console.log('🔍 Выполняем проверку статуса билета:', originalTicketId);
                try {
                    const checkResponse = await fetch(`${API_BASE}/ticket/${originalTicketId}`);
                    console.log('📊 Результат проверки:', {
                        status: checkResponse.status,
                        ok: checkResponse.ok
                    });
                    
                    if (checkResponse.ok) {
                        const checkResult = await checkResponse.json();
                        console.log('📋 Данные проверки:', checkResult);
                        
                        if (checkResult.ticket && checkResult.ticket.status === 'used') {
                            console.log('✅ Проверка подтвердила: билет использован');
                            updateTicketStatusInUI(originalTicketId, 'used', checkResult.ticket);
                        } else {
                            console.warn('⚠️ Проверка показала: билет все еще active', checkResult);
                            showWarning('⚠️ Внимание: Билет может быть не сохранен как использованный. Проверьте сервер.');
                        }
                    } else {
                        console.error('❌ Ошибка при проверке статуса');
                    }
                } catch (checkError) {
                    console.error('❌ Ошибка проверки:', checkError);
                }
            }, 2000);

        } else {
            console.error('❌ Ошибка сервера при отметке билета');
            throw new Error(result.error || result.message || `HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Общая ошибка:', error);
        
        // Восстанавливаем кнопку при ошибке
        const infoElement = document.getElementById('ticketInfo');
        if (infoElement) {
            const button = infoElement.querySelector('button');
            if (button) {
                button.disabled = false;
                button.innerHTML = '✅ Отметить как использованный';
                button.style.background = '#27ae60';
            }
        }
        
        showError(`❌ Ошибка: ${error.message}`);
    }
}

// Обновленная функция обновления UI
function updateTicketStatusInUI(ticketId, newStatus, ticketData = null) {
    const infoElement = document.getElementById('ticketInfo');
    if (!infoElement) {
        console.warn('⚠️ Элемент ticketInfo не найден');
        return;
    }

    console.log('🎨 Обновляем UI, новый статус:', newStatus);
    
    // Обновляем кнопку
    const button = infoElement.querySelector('button');
    if (button) {
        if (newStatus === 'used') {
            button.disabled = true;
            button.innerHTML = '✅ Уже использован';
            button.style.background = '#95a5a6';
            console.log('✅ Кнопка обновлена: заблокирована');
        }
    }
    
    // Обновляем текстовый статус
    const allDivs = infoElement.querySelectorAll('div');
    let statusUpdated = false;
    
    allDivs.forEach(div => {
        if (div.innerHTML.includes('Статус:') || div.innerHTML.includes('Status:')) {
            div.innerHTML = `<strong>Статус:</strong> ${newStatus}`;
            statusUpdated = true;
            console.log('✅ Текстовый статус обновлен');
        }
    });
    
    // Если есть данные билета, полностью перерисовываем с учетом льготной категории
    if (ticketData) {
        console.log('🎫 Полное обновление UI с новыми данными');
        if (window.ticketVerifier) {
            window.ticketVerifier.showTicketInfo(ticketData);
        }
    }
    
    if (!statusUpdated) {
        console.warn('⚠️ Не удалось найти элемент статуса для обновления');
    }
}

function clearResults() {
    if (window.ticketVerifier) {
        window.ticketVerifier.clearResults();
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.ticketVerifier = new TicketVerifier();
    
    // Предотвращаем zoom при двойном тапе на iOS
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Фокус на поле ввода при загрузке (только на десктопе)
    if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        const inputElement = document.getElementById('manualTicketInput');
        if (inputElement) {
            setTimeout(() => inputElement.focus(), 300);
        }
    }
    
    const startButton = document.getElementById('startScanner');
    if (startButton) {
        startButton.disabled = true;
        startButton.innerHTML = '⏳ Загрузка сканера...';
    }
    
    // Регистрация Service Worker для PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(() => {
                console.log('✅ Service Worker зарегистрирован');
            })
            .catch((error) => {
                console.error('❌ Ошибка регистрации Service Worker:', error);
            });
    }
});

window.addEventListener('beforeunload', () => {
    if (window.ticketVerifier) {
        window.ticketVerifier.stopQRScanner();
    }
});