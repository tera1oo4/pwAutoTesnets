# Runbook / Операционное руководство

Основные инструкции по эксплуатации приложения.

## Быстрый старт локально

### Требования
- Node.js v20+
- Docker (PostgreSQL, Redis)
- npm

### Поднять проект

```bash
# 1. Зависимости
npm install

# 2. Конфигурация
cp .env.example .env

# 3. Инфраструктура
docker-compose up -d

# 4. Запуск (API + Worker)
npm run dev
```

Проверить здоровье:
```bash
curl http://localhost:3000/health
```

## Запуск отдельных компонентов

```bash
# API только (без worker)
npm run dev  # Ctrl+C после запуска сервера

# Worker только (без API)
npm run worker

# Тесты
npm run test

# Type check
npm run lint
```

## Управление runs через API

### Создать новую run

```bash
curl -X POST http://localhost:3000/api/runs \
  -H "Content-Type: application/json" \
  -d '{
    "scenarioId": "connect_wallet",
    "profileId": "profile-1",
    "networkId": "ethereum-sepolia",
    "maxAttempts": 3
  }'
```

### Список всех runs

```bash
curl "http://localhost:3000/api/runs?status=running&limit=10"
```

### Получить детали run

```bash
curl http://localhost:3000/api/runs/<runId>
```

### Отменить run

```bash
curl -X POST http://localhost:3000/api/runs/<runId>/cancel
```

### Скачать артефакты

```bash
# Список
curl http://localhost:3000/api/runs/<runId>/artifacts

# Скачать конкретный файл
curl http://localhost:3000/api/runs/<runId>/artifacts/<filename> > artifact.zip
```

### Слушать обновления (polling)

```bash
curl "http://localhost:3000/api/runs/stream/updates?since=2024-01-01T00:00:00Z&limit=50"
```

## Профили браузера

### Создание нового профиля

1. Выберите директорию для профиля
2. Скопируйте расширение кошелька в профиль
3. Запустите браузер вручную для первичной настройки:
   ```bash
   # Откроется браузер для ручной конфигурации
   PWDEBUG=1 npm run worker
   ```
4. Закройте браузер
5. Используйте profileId в API запросах

### Восстановление сломанного профиля

Если профиль постоянно выдает ошибки:

```bash
# 1. Остановить все workers
# 2. Удалить lock файл профиля
rm ~/.testnets-locks/<profileId>.lock.json

# 3. Запустить в debug режиме и выполнить ручные действия
PWDEBUG=1 npm run worker

# 4. Закрыть браузер и проверить
```

## Ошибки и диагностика

### Найти ошибку

1. Получить детали run:
   ```bash
   curl http://localhost:3000/api/runs/<runId>
   ```

2. Посмотреть статус и `lastErrorCode`

3. Скачать артефакты:
   ```bash
   curl http://localhost:3000/api/runs/<runId>/artifacts
   ```

4. Просмотреть скриншоты и HTML для понимания состояния

### Типы ошибок

| Код | Описание | Действие |
|-----|---------|---------|
| `wallet_unknown_state` | Неожиданное состояние кошелька | Откройте профиль вручную, закройте модальные окна |
| `wallet_popup_missing` | Popup не появился | Проверьте селекторы в контроллере кошелька |
| `browser_launch_failed` | Браузер не запустился | Проверьте профиль, расширение установлено |
| `network_timeout` | Сеть недоступна | Подождите, запрос будет повторен |
| `rate_limit_exceeded` | Rate limit от dapp | Подождите, будет повторена попытка |
| `ui_element_missing` | Элемент на странице не найден | Обновите селекторы, скриншот в артефактах |
| `scenario_failed` | Сценарий упал | Смотрите логи и скриншоты |

### Статусы run

| Статус | Описание |
|--------|---------|
| `queued` | Ждет выполнения или повтора |
| `running` | Выполняется сейчас |
| `completed` | Успешно завершена |
| `failed` | Постоянная ошибка, не будет повторена |
| `needs_review` | Необычное состояние, нужна ручная проверка |
| `cancelled` | Отменена пользователем |

## Обновление расширений кошельков

### Когда обновляется MetaMask или Rabby

1. Скачайте новую версию расширения (crx или распакованное)

2. Локально тестируйте с новой версией:
   ```bash
   # Обновите селекторы в контроллере если нужно
   # Запустите тесты
   npm run test
   ```

3. Если селекторы изменились:
   - Обновите `MetaMaskSelectors.ts` или `RabbySelectors.ts`
   - Добавьте комментарий с датой последней проверки
   - Тестируйте перед деплоем

4. Разверните на production

## Логирование и мониторинг

### Формат логов

Логи в JSON формате с контекстом:
```json
{
  "level": "info",
  "name": "run_started",
  "message": "Starting scenario execution",
  "context": {
    "runId": "550e8400-e29b-41d4-a716-446655440000",
    "scenarioId": "connect_wallet",
    "profileId": "profile-1",
    "attempt": 1
  },
  "time": "2024-01-15T10:30:00.000Z"
}
```

### Фильтрация логов

По runId:
```bash
# Все логи для конкретной run
docker logs worker | grep '"runId":"<runId>"'
```

По сценарию:
```bash
# Все логи конкретного сценария
docker logs worker | grep '"scenarioId":"connect_wallet"'
```

### Сохранение логов

Логи по умолчанию в stdout. Для production настройте систему сбора логов (ELK, Datadog, CloudWatch).

## Безопасность

### Секреты (пароли кошельков)

Хранятся зашифрованными в `SecretService`:

```bash
# Проверить, что использует правильный ключ
grep MASTER_KEY .env
```

### Ротация мастер-ключа

1. Сгенерировать новый ключ
2. Создать миграционный скрипт
3. Расшифровать старым ключом, зашифровать новым
4. Обновить `.env`
5. Перезапустить приложение

### Управление доступом

- API не требует аутентификации (настройте если нужна)
- Worker запускает локально или в приватной сети
- Database доступна только локально или через VPN

## Развертывание (Production)

### Docker

```bash
# Сборка образа
docker build -t pw-auto-testnets:latest .

# Запуск с docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Масштабирование

```bash
# Запустить несколько workers для параллельного выполнения
docker-compose up -d --scale worker=3
```

### Откатывание

```bash
# Код
git revert <commitHash>
docker build -t pw-auto-testnets:latest .
docker-compose up -d

# Селекторы (только контроллер кошелька)
git checkout HEAD~1 src/core/wallet/metamask/MetaMaskController.ts
npm run lint && npm run build
# Перезапустить workers
```

## Troubleshooting

### Worker не подхватывает tasks

1. Проверьте Redis соединение: `docker exec redis redis-cli ping`
2. Проверьте логи worker на ошибки
3. Убедитесь что worker запущен: `ps aux | grep "npm run worker"`

### API возвращает 500

1. Проверьте логи: `docker logs <container>`
2. Убедитесь что PostgreSQL доступна: `docker exec postgres psql -U postgres -c "SELECT 1"`
3. Проверьте миграции: `docker logs postgres`

### Браузер не запускается

1. Убедитесь что Chromium установлен: `npx playwright install chromium`
2. Проверьте профиль: все ли расширения установлены
3. Убедитесь что профиль не заблокирован: `lsof +D ~/.testnets-profiles/<profileId>`

### Селектор не работает

1. Запустите в debug режиме: `PWDEBUG=1 npm run worker`
2. Инспектируйте DOM в Playwright inspector
3. Обновите селектор в контроллере кошелька
4. Добавьте комментарий с датой и версией расширения

## Контрольный список перед production

- [ ] `.env` заполнен, секреты в vault
- [ ] PostgreSQL backup настроен
- [ ] Redis persistence включен
- [ ] Логи собираются и мониторятся
- [ ] Здоровье worker'ов мониторится
- [ ] Артефакты хранятся на S3 или других persistent storage
- [ ] API защищена аутентификацией/авторизацией
- [ ] Рейт-лимиты настроены
- [ ] Алерты настроены на critical ошибки
- [ ] Runbook обновлен
