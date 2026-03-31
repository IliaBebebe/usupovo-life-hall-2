# Usupovo Life Hall — Vercel Deployment Guide

Инструкция по переносу системы бронирования билетов Usupovo Life Hall с Render на Vercel с использованием Vercel Postgres (Neon).

## 📋 Что изменилось в версии 2.0

- ✅ **Миграция с SQLite на PostgreSQL** — теперь используется Neon PostgreSQL
- ✅ **Serverless архитектура** — API работает на Vercel Serverless Functions
- ✅ **Оптимизированная структура** — каждый API endpoint в отдельном файле
- ✅ **Автоматическое развертывание** — деплой через Git push в репозиторий

## 🚀 Быстрый старт

### Шаг 1: Установка зависимостей

```bash
npm install
```

### Шаг 2: Инициализация базы данных

База данных уже настроена! connection string находится в `.env.local`.

Для инициализации выполните:

```bash
# Создание всех таблиц
npm run init-db

# Добавление данных по умолчанию (льготные категории, настройки)
npm run seed-db
```

### Шаг 3: Локальная разработка

```bash
npm run dev
```

Откройте http://localhost:3000

### Шаг 4: Деплой на Vercel

```bash
# Установите Vercel CLI
npm i -g vercel

# Войдите в аккаунт
vercel login

# Деплой
vercel
```

Или подключите Git репозиторий к Vercel для автоматического деплоя.

## 📁 Структура API endpoints

| Метод | Endpoint | Файл | Описание |
|-------|----------|------|----------|
| GET | `/api/events` | `server/api/events.js` | Список мероприятий |
| GET | `/api/events/:id` | `server/api/events/[id].js` | Детали мероприятия |
| GET | `/api/seats/event/:eventId` | `server/api/seats/event/[eventId].js` | Схема мест |
| POST | `/api/book` | `server/api/book.js` | Создание бронирования |
| GET | `/api/ticket/:ticketId` | `server/api/ticket/[ticketId].js` | Проверка билета |
| POST | `/api/ticket/:ticketId/use` | `server/api/ticket/[ticketId]/use.js` | Отметить билет |
| GET | `/api/admin/bookings` | `server/api/admin/bookings.js` | Список бронирований |
| DELETE | `/api/admin/bookings/:id` | `server/api/admin/bookings/[id].js` | Удалить бронь |
| GET | `/api/admin/events` | `server/api/admin/events.js` | Мероприятия (админ) |
| POST | `/api/admin/events/:id/seats/bulk` | `server/api/admin/events/[id]/seats/bulk.js` | Места массово |
| GET | `/api/admin/discount-categories` | `server/api/admin/discount-categories.js` | Льготные категории |
| GET | `/api/admin/promocodes` | `server/api/admin/promocodes.js` | Промокоды |
| POST | `/api/admin/promocodes` | `server/api/admin/promocodes.js` | Создать промокод |
| PUT | `/api/admin/promocodes/:id` | `server/api/admin/promocodes/[id].js` | Обновить промокод |
| DELETE | `/api/admin/promocodes/:id` | `server/api/admin/promocodes/[id].js` | Удалить промокод |
| POST | `/api/analytics/session-start` | `server/api/analytics/session-start.js` | Начало сессии |
| GET | `/api/admin/visitor-stats/chart` | `server/api/admin/visitor-stats/chart.js` | Статистика |
| GET | `/api/admin/export` | `server/api/admin/export.js` | Экспорт данных |
| POST | `/api/admin/import` | `server/api/admin/import.js` | Импорт данных |

## 🔧 Конфигурация

### vercel.json

```json
{
  "framework": null,
  "installCommand": "npm install",
  "buildCommand": "echo 'No build step required'",
  "outputDirectory": "public",
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/api/$1.js"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ],
  "postgres": {
    "schema": "schema.sql"
  },
  "regions": ["fra1"]
}
```

### Переменные окружения

| Переменная | Описание | Где получить |
|------------|----------|--------------|
| `POSTGRES_URL` | Строка подключения к PostgreSQL | Vercel Storage / Neon |

## ⚠️ Важные замечания

### Отличия от Render

| Характеристика | Render | Vercel |
|----------------|--------|--------|
| Тип сервера | Постоянный | Serverless |
| База данных | SQLite (файл) | PostgreSQL (Neon) |
| Хранение файлов | Локальное | S3/CDN |
| Время выполнения | Без ограничений | 10 сек (Hobby), 60 сек (Pro) |
| Холодный старт | Нет | Есть (~1-2 сек) |

### Ограничения Vercel Serverless

- **Максимальное время выполнения**: 10 секунд (Hobby план)
- **Максимальный размер ответа**: 6 MB
- **Холодный старт**: Первая запрос может выполняться дольше

### Рекомендации

1. **Изображения**: Загружайте изображения в облачное хранилище (S3, Cloudinary), а не локально
2. **Тяжелые операции**: Для импорта больших объемов данных используйте фоновые задачи
3. **Кэширование**: Настройте кэширование статических ресурсов

## 🐛 Troubleshooting

### Ошибка: "Database connection failed"

**Решение:**
1. Проверьте переменную окружения `POSTGRES_URL`
2. Убедитесь, что БД создана и доступна
3. Проверьте права доступа

### Ошибка: "Table does not exist"

**Решение:**
1. Выполните `schema.sql` в базе данных
2. Проверьте подключение через Vercel Storage панель

### Ошибка: "Function invocation timed out"

**Решение:**
1. Оптимизируйте запросы к базе данных
2. Добавьте индексы на часто используемые поля
3. Рассмотрите переход на Pro план (60 сек вместо 10)

### Ошибка: "Module not found: @vercel/postgres"

**Решение:**
```bash
npm install @vercel/postgres
git add package.json package-lock.json
git commit -m "Add @vercel/postgres dependency"
git push
```

## 📊 Мониторинг

### Vercel Dashboard

- **Analytics**: Посещения, производительность
- **Logs**: Логи каждой serverless функции
- **Deployments**: История деплоев

### Neon Dashboard

- **Query Performance**: Медленные запросы
- **Connections**: Активные подключения
- **Storage**: Использование места

## 🔐 Безопасность

### Рекомендации

1. **HTTPS**: Vercel автоматически предоставляет HTTPS
2. **CORS**: Настройте CORS для продакшена
3. **Rate Limiting**: Добавьте ограничение запросов (upstash/ratelimit)
4. **Admin Auth**: Замените клиентскую авторизацию на серверную

## 📈 Планы и тарифы

### Vercel Hobby (Бесплатно)

- ✅ 100 GB bandwidth / месяц
- ✅ 100 GB-hours compute
- ✅ Serverless Functions (10 sec timeout)
- ✅ Vercel Postgres (10 MB storage, 10K rows)

### Vercel Pro ($20/мес)

- ✅ 1 TB bandwidth / месяц
- ✅ 500 GB-hours compute
- ✅ Serverless Functions (60 sec timeout)
- ✅ Vercel Postgres (1 GB storage, 1M rows)

## 📞 Поддержка

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Neon Docs**: [neon.tech/docs](https://neon.tech/docs)
- **Vercel Postgres**: [vercel.com/docs/storage/vercel-postgres](https://vercel.com/docs/storage/vercel-postgres)

---

**Версия**: 2.0.0  
**Дата**: Март 2026  
**Миграция выполнена**: Успешно ✅
