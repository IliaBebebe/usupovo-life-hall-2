// Система отслеживания посетителей
(function() {
    'use strict';
    
    // Генерируем уникальный ID сессии
    function getSessionId() {
        let sessionId = sessionStorage.getItem('visitor_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('visitor_session_id', sessionId);
        }
        return sessionId;
    }
    
    // Определение типа устройства
    function getDeviceType() {
        const width = window.screen.width;
        if (width <= 480) return 'mobile';
        if (width <= 768) return 'tablet';
        return 'desktop';
    }
    
    // Парсинг User-Agent для определения браузера и ОС
    function parseUserAgent() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        let os = 'Unknown';
        
        // Определение браузера
        if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
        else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) browser = 'Chrome';
        else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) browser = 'Safari';
        else if (ua.indexOf('Edg') > -1) browser = 'Edge';
        else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera';
        
        // Определение ОС
        if (ua.indexOf('Windows') > -1) os = 'Windows';
        else if (ua.indexOf('Mac') > -1) os = 'macOS';
        else if (ua.indexOf('Linux') > -1) os = 'Linux';
        else if (ua.indexOf('Android') > -1) os = 'Android';
        else if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';
        
        return { browser, os };
    }
    
    // Получение IP адреса (будет получен на сервере)
    function getLocationFromIP(ip) {
        // В будущем можно использовать API для определения местоположения по IP
        // Пока оставляем пустым, сервер может определить примерное местоположение
        return null;
    }
    
    // Отслеживание посещенных страниц
    const pagesVisited = [];
    const MAX_PAGES_TRACKED = 100;

    function recordPageVisit(page) {
        pagesVisited.push({
            page: page,
            timestamp: new Date().toISOString()
        });
        if (pagesVisited.length > MAX_PAGES_TRACKED) {
            pagesVisited.shift();
        }
    }
    const sessionId = getSessionId();
    const entryTime = new Date();
    
    // Добавляем текущую страницу
    recordPageVisit(window.location.pathname);
    
    // Отслеживание переходов между страницами
    let lastPage = window.location.pathname;
    setInterval(() => {
        if (window.location.pathname !== lastPage) {
            lastPage = window.location.pathname;
            recordPageVisit(window.location.pathname);
        }
    }, 5000);
    
    // Сбор данных о посетителе
    function collectVisitorData() {
        const { browser, os } = parseUserAgent();
        
        return {
            session_id: sessionId,
            user_agent: navigator.userAgent,
            device_type: getDeviceType(),
            browser: browser,
            os: os,
            screen_width: window.screen.width,
            screen_height: window.screen.height,
            language: navigator.language || navigator.userLanguage,
            referrer: document.referrer || 'direct',
            pages_visited: JSON.stringify(pagesVisited),
            entry_time: entryTime.toISOString()
        };
    }
    
    // Отправка данных о начале сессии
    function trackSessionStart() {
        const data = collectVisitorData();
        
        fetch('/api/analytics/session-start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).catch(err => {
            console.error('Analytics tracking error:', err);
        });
    }
    
    // Отправка данных о завершении сессии
    function trackSessionEnd() {
        const exitTime = new Date();
        const duration = Math.floor((exitTime - entryTime) / 1000); // в секундах
        
        const data = {
            session_id: sessionId,
            exit_time: exitTime.toISOString(),
            duration: duration,
            pages_visited: JSON.stringify(pagesVisited)
        };
        
        // Используем sendBeacon для надежной отправки при закрытии страницы
        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            navigator.sendBeacon('/api/analytics/session-end', blob);
        } else {
            // Fallback для старых браузеров
            fetch('/api/analytics/session-end', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                keepalive: true
            }).catch(err => {
                console.error('Analytics tracking error:', err);
            });
        }
    }
    
    // Отслеживание времени на странице (периодическое обновление)
    let lastUpdateTime = Date.now();
    setInterval(() => {
        const currentTime = Date.now();
        const timeOnPage = Math.floor((currentTime - lastUpdateTime) / 1000);
        
        if (timeOnPage >= 30) { // Обновляем каждые 30 секунд
            lastUpdateTime = currentTime;
            const duration = Math.floor((currentTime - entryTime.getTime()) / 1000);
            
            fetch('/api/analytics/session-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    duration: duration,
                    pages_visited: JSON.stringify(pagesVisited)
                })
            }).catch(err => {
                console.error('Analytics update error:', err);
            });
        }
    }, 30000); // Проверяем каждые 30 секунд
    
    // Отслеживание закрытия страницы
    window.addEventListener('beforeunload', trackSessionEnd);
    window.addEventListener('pagehide', trackSessionEnd);
    
    // Отслеживание потери фокуса (вкладка неактивна)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Пользователь переключился на другую вкладку
        } else {
            // Пользователь вернулся на вкладку
        }
    });
    
    // Начало отслеживания при загрузке страницы
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', trackSessionStart);
    } else {
        trackSessionStart();
    }
    
    // Экспорт для использования в других скриптах
    window.VisitorAnalytics = {
        getSessionId: getSessionId,
        trackPageView: function(page) {
            recordPageVisit(page);
        }
    };
})();

