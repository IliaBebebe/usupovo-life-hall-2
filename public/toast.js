/**
 * Современная система Toast-уведомлений
 * Поддерживает очередь, правильное позиционирование и анимации
 */
class ToastManager {
    constructor() {
        this.toasts = [];
        this.container = null;
        this.maxToasts = 5;
        this.defaultDuration = 5000;
        this.init();
    }

    init() {
        // Проверяем готовность DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createContainer());
        } else {
            this.createContainer();
        }
    }
    
    createContainer() {
        // Проверяем, что body существует
        if (!document.body) {
            setTimeout(() => this.createContainer(), 10);
            return;
        }
        
        // Проверяем, не создан ли уже контейнер
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        this.container = container;
        
        // Добавляем стили если их еще нет
        this.injectStyles();
    }

    injectStyles() {
        if (document.getElementById('toast-styles')) return;

        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
                max-width: 400px;
                width: calc(100% - 40px);
                align-items: flex-end;
            }

            .toast {
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                padding: 16px 20px;
                display: flex;
                align-items: flex-start;
                gap: 12px;
                min-width: 300px;
                max-width: 100%;
                width: 100%;
                pointer-events: auto;
                position: relative;
                border-left: 4px solid #3498db;
                animation: toastSlideIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                transition: all 0.3s ease;
                margin-bottom: 0;
            }

            .toast:hover {
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
                transform: translateX(-4px);
            }

            .toast.toast-success {
                border-left-color: #27ae60;
                background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
            }

            .toast.toast-error {
                border-left-color: #e74c3c;
                background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
            }

            .toast.toast-warning {
                border-left-color: #f39c12;
                background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
            }

            .toast.toast-info {
                border-left-color: #3498db;
                background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
            }

            .toast-icon {
                flex-shrink: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                line-height: 1;
            }

            .toast.toast-success .toast-icon {
                color: #27ae60;
            }

            .toast.toast-error .toast-icon {
                color: #e74c3c;
            }

            .toast.toast-warning .toast-icon {
                color: #f39c12;
            }

            .toast.toast-info .toast-icon {
                color: #3498db;
            }

            .toast-content {
                flex: 1;
                min-width: 0;
            }

            .toast-message {
                color: #2c3e50;
                font-size: 14px;
                line-height: 1.5;
                font-weight: 500;
                word-wrap: break-word;
            }

            .toast-close {
                flex-shrink: 0;
                background: none;
                border: none;
                color: #7f8c8d;
                font-size: 20px;
                line-height: 1;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s ease;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .toast-close:hover {
                background: rgba(0, 0, 0, 0.05);
                color: #2c3e50;
            }

            .toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: rgba(0, 0, 0, 0.1);
                border-radius: 0 0 12px 12px;
                overflow: hidden;
            }

            .toast-progress-bar {
                height: 100%;
                background: currentColor;
                width: 100%;
                animation: toastProgress linear;
                transform-origin: left;
            }

            .toast.toast-success .toast-progress-bar {
                background: #27ae60;
            }

            .toast.toast-error .toast-progress-bar {
                background: #e74c3c;
            }

            .toast.toast-warning .toast-progress-bar {
                background: #f39c12;
            }

            .toast.toast-info .toast-progress-bar {
                background: #3498db;
            }

            @keyframes toastSlideIn {
                from {
                    transform: translateX(calc(100% + 20px));
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes toastSlideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(calc(100% + 20px));
                    opacity: 0;
                }
            }

            @keyframes toastProgress {
                from {
                    transform: scaleX(1);
                }
                to {
                    transform: scaleX(0);
                }
            }

            .toast.toast-removing {
                animation: toastSlideOut 0.3s ease forwards;
            }

            @media (max-width: 768px) {
                .toast-container {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                    width: auto;
                    align-items: stretch;
                }

                .toast {
                    min-width: auto;
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }

    show(message, type = 'info', duration = null) {
        const toast = {
            id: Date.now() + Math.random(),
            message,
            type,
            duration: duration !== null ? duration : this.defaultDuration,
            element: null,
            timeout: null,
            progressAnimation: null
        };

        // Если достигнут максимум, удаляем самое старое
        if (this.toasts.length >= this.maxToasts) {
            this.remove(this.toasts[0].id);
        }

        this.toasts.push(toast);
        this.render(toast);

        // Автоматическое удаление
        if (toast.duration > 0) {
            toast.timeout = setTimeout(() => {
                this.remove(toast.id);
            }, toast.duration);
        }

        return toast.id;
    }

    render(toast) {
        const toastElement = document.createElement('div');
        toastElement.className = `toast toast-${toast.type}`;
        toastElement.dataset.toastId = toast.id;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toastElement.innerHTML = `
            <div class="toast-icon">${icons[toast.type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-message">${this.escapeHtml(toast.message)}</div>
            </div>
            <button class="toast-close" aria-label="Закрыть">×</button>
            ${toast.duration > 0 ? `
                <div class="toast-progress">
                    <div class="toast-progress-bar" style="animation-duration: ${toast.duration}ms;"></div>
                </div>
            ` : ''}
        `;

        // Обработчик закрытия
        const closeBtn = toastElement.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.remove(toast.id);
        });

        this.container.appendChild(toastElement);
        toast.element = toastElement;

        // Анимация появления
        requestAnimationFrame(() => {
            toastElement.style.opacity = '1';
        });
    }

    remove(id) {
        const index = this.toasts.findIndex(t => t.id === id);
        if (index === -1) return;

        const toast = this.toasts[index];
        
        // Очищаем таймер
        if (toast.timeout) {
            clearTimeout(toast.timeout);
        }

        // Анимация удаления
        if (toast.element) {
            toast.element.classList.add('toast-removing');
            setTimeout(() => {
                if (toast.element && toast.element.parentNode) {
                    toast.element.remove();
                }
            }, 300);
        }

        this.toasts.splice(index, 1);
    }

    clear() {
        const ids = this.toasts.map(t => t.id);
        ids.forEach(id => this.remove(id));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Удобные методы
    success(message, duration = null) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = null) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = null) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = null) {
        return this.show(message, 'info', duration);
    }
}

// Создаем глобальный экземпляр (с задержкой для гарантии готовности DOM)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.toastManager = new ToastManager();
    });
} else {
    window.toastManager = new ToastManager();
}

// Глобальные функции для обратной совместимости
window.showToast = (message, type = 'info', duration = null) => {
    if (!window.toastManager) {
        console.error('ToastManager не инициализирован');
        return;
    }
    return window.toastManager.show(message, type, duration);
};

window.showSuccess = (message, duration = null) => {
    if (!window.toastManager) {
        console.error('ToastManager не инициализирован');
        return;
    }
    return window.toastManager.success(message, duration);
};

window.showError = (message, duration = null) => {
    if (!window.toastManager) {
        console.error('ToastManager не инициализирован');
        return;
    }
    return window.toastManager.error(message, duration);
};

window.showWarning = (message, duration = null) => {
    if (!window.toastManager) {
        console.error('ToastManager не инициализирован');
        return;
    }
    return window.toastManager.warning(message, duration);
};

window.showInfo = (message, duration = null) => {
    if (!window.toastManager) {
        console.error('ToastManager не инициализирован');
        return;
    }
    return window.toastManager.info(message, duration);
};

