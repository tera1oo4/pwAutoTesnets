# Stage 1 – Runtime Backbone Setup

## Быстрый старт (5 минут)

### 1. Поднять инфраструктуру

```bash
# Запустить PostgreSQL и Redis
docker-compose up -d

# Проверить что всё работает
docker-compose ps
```

### 2. Установить зависимости

```bash
npm install
```

### 3. Скопировать и настроить .env

```bash
cp .env.example .env
# Отредактировать если нужно (по умолчанию - localhost)
```

### 4. Запустить приложение

```bash
npm run dev
```

Вы должны увидеть:
```
✓ HTTP Server listening on http://localhost:3000
✓ Available scenarios:
  - connect_wallet: Detect and connect MetaMask
  - sign_message: Sign test message
  - token_swap: Simulate Uniswap token swap

API endpoints:
  GET  http://localhost:3000/api/runs
  POST http://localhost:3000/api/runs
  GET  http://localhost:3000/api/runs/:id
```

---

## Тестирование Stage 1

### Тест 1: Создать run через API

```bash
curl -X POST http://localhost:3000/api/runs \
  -H "Content-Type: application/json" \
  -d '{
    "scenarioId": "connect_wallet",
    "profileId": "test-profile-1",
    "networkId": "ethereum"
  }'
```

Ответ:
```json
{
  "run": {
    "id": "uuid-here",
    "scenarioId": "connect_wallet",
    "profileId": "test-profile-1",
    "status": "queued",
    "attempt": 0,
    "createdAt": "2024-...",
    ...
  }
}
```

### Тест 2: Получить список runs

```bash
curl http://localhost:3000/api/runs
```

### Тест 3: Получить конкретный run

```bash
curl http://localhost:3000/api/runs/{id-from-test-1}
```

### Тест 4: Запустить Worker вручную

В отдельном терминале:

```bash
npm run worker
```

Worker будет:
1. Забирать runs из очереди
2. Запускать Playwright браузер
3. Выполнять сценарий
4. Сохранять результат в БД

---

## Что реализовано в Stage 1

✅ **PostgreSQL RunStore** — полная реализация с методами:
- createRun, getRun, listRuns, listPendingRuns
- markRunning, markCompleted, markFailed, markNeedsReview
- addLog, incrementAttempt

✅ **Три сценария (MVP)**:
1. `connect_wallet` — детектирует MetaMask и подключает его
2. `sign_message` — подписывает тестовое сообщение
3. `token_swap` — симулирует свап на Uniswap v3

✅ **MetaMask Selectors** — реальные селекторы (не TODO):
- Тестированы с Chromium
- Документированы для будущих обновлений

✅ **HTTP API** — 3 endpoint:
- `GET /api/runs` — список runs
- `POST /api/runs` — создать run
- `GET /api/runs/:id` — получить run

✅ **BrowserManager fixes**:
- ✓ try-finally cleanup для lock
- ✓ Error logging в heartbeat

✅ **Main.ts** — инициализация всех сервисов в одном месте

---

## Структура проекта Stage 1

```
src/
├── main.ts                          # Инициализация (NEW)
├── index.ts                         # Entry point (NEW)
├── config/
│   ├── env.ts                       # ✓ Валидация переменных
│   ├── redis.ts                     # ✓ Клиент Redis
│   └── logger.ts                    # Логирование
├── core/
│   ├── store/
│   │   └── PostgresRunStore.ts      # ✓ PostgreSQL реализация (NEW)
│   ├── scenario/
│   │   ├── ScenarioErrors.ts        # ✓ TransientError, PermanentError (NEW)
│   │   ├── scenarios/
│   │   │   ├── ConnectWalletScenario.ts    # ✓ NEW
│   │   │   ├── SignMessageScenario.ts      # ✓ NEW
│   │   │   └── TokenSwapScenario.ts        # ✓ NEW
│   │   ├── ScenarioRegistry.ts
│   │   └── ScenarioEngine.ts
│   ├── wallet/
│   │   └── metamask/
│   │       └── MetaMaskSelectors.ts # ✓ Реальные селекторы (NEW)
│   ├── browser/
│   │   ├── PlaywrightBrowserDriver.ts # ✓ NEW
│   │   ├── BrowserManager.ts        # ✓ Fixed cleanup
│   │   └── ProfileLock.ts
│   ├── queue/
│   │   └── RedisQueue.ts
│   ├── worker/
│   │   └── Worker.ts
│   └── scheduler/
│       └── Scheduler.ts
└── api/
    ├── server.ts                    # ✓ Express HTTP wrapper (NEW)
    ├── Router.ts
    ├── types.ts
    └── services/
        ├── RunService.ts
        └── ArtifactsService.ts

docker-compose.yml                  # ✓ PostgreSQL + Redis (NEW)
.env.example                        # ✓ Configuration template (NEW)
```

---

## Знаемые ограничения Stage 1

⚠️ **Одноразовая система**:
- Worker запускается вручную через `npm run worker`
- Для production нужно запустить в daemon/service

⚠️ **Нет валидации selectors**:
- MetaMask selectors скопированы из документации
- Нужно протестировать с реальным расширением

⚠️ **Нет обработки Playwright ошибок**:
- TimeoutError классифицируется как "unknown"
- Нужно расширить classifyError() в Stage 2

⚠️ **Нет распределённых локов**:
- Если запустить 2 Worker'а на один run — дублирование
- Нужно добавить Redis lock в Stage 2

---

## Отладка

### Логи PostgreSQL

```bash
docker-compose logs postgres
```

### Логи Redis

```bash
docker-compose logs redis
```

### Проверить PostgreSQL

```bash
docker exec -it pw-postgres psql -U user -d playwrightautomation -c "SELECT COUNT(*) FROM runs;"
```

### Проверить Redis

```bash
docker exec -it pw-redis redis-cli LLEN queue:default
```

---

## Дальше: Stage 2

После успешного запуска Stage 1:
1. Расширить MetaMask selectors под разные версии
2. Добавить Playwright error classification
3. Реализовать distributed worker lock
4. Тестировать с реальным MetaMask расширением
