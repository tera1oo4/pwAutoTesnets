# Ошибки компиляции и исправления (Stage 1)

## Статус

Основной код Stage 1 реализован. Есть несколько ошибок типизации в интеграции с существующими модулями.

## Нужные правки

### 1. ProfileLock - проверить конструктор

**Ошибка:**
```
main.ts:74: error TS2353: Object literal may only specify known properties, and 'redis' does not exist in type 'ProfileLockOptions'
```

**Исправить:**
- Посмотреть `src/core/browser/ProfileLock.ts`
- Использовать правильные параметры в конструкторе

### 2. BrowserManager - проверить параметры

**Ошибка:**
```
main.ts:87: error TS2353: Object literal may only specify known properties, and 'logger' does not exist in type 'BrowserManagerOptions'
```

**Исправить:**
- Посмотреть `src/core/browser/BrowserManager.ts`
- Обновить инициализацию в main.ts

### 3. ScenarioEngine - проверить инициализацию

**Ошибка:**
```
main.ts:103: error TS2353: Object literal may only specify known properties, and 'logger' does not exist in type 'ScenarioEngineOptions'
main.ts:107: error TS2554: Expected 0-1 arguments, but got 2
```

**Исправить:**
- Посмотреть как инициализируется ScenarioEngine
- Обновить вызов register() если нужно

### 4. PageHandle - добавить методы

**Ошибка:**
```
scenarios: Property 'goto' does not exist on type 'PageHandle'
scenarios: Property 'all' does not exist on type 'LocatorHandle'
```

**Исправить:**
- В `src/shared/types.ts` добавить в PageHandle:
  ```typescript
  goto(url: string, options?: { timeout?: number }): Promise<void>;
  evaluate<T>(fn: (arg: any) => T | Promise<T>, arg?: any): Promise<T>;
  ```
- В LocatorHandle добавить:
  ```typescript
  all(): Promise<LocatorHandle[]>;
  first(): LocatorHandle;
  ```

### 5. RunService и ArtifactsService - проверить интерфейсы

**Ошибка:**
```
server.ts:25: error TS2554: Expected 1 arguments, but got 2
server.ts:26: error TS2559: Type 'PostgresRunStore' has no properties in common with type 'ArtifactsServiceOptions'
```

**Исправить:**
- Посмотреть `src/api/services/RunService.ts` и `ArtifactsService.ts`
- Обновить инициализацию в server.ts

## Как это исправить

**Вариант 1 (быстро):** Просто посмотрите существующие сервисы и обновите вызовы в main.ts и server.ts

**Вариант 2 (правильно):** Обновите типы в types.ts чтобы они соответствовали тому как используются

**Рекомендуемый порядок:**

1. Откройте `src/core/browser/ProfileLock.ts` и посмотрите constructor
2. Откройте `src/core/browser/BrowserManager.ts` и посмотрите constructor
3. Откройте `src/core/scenario/ScenarioEngine.ts` и посмотрите как инициализируется
4. Обновите main.ts чтобы соответствовать
5. Обновите types.ts чтобы добавить недостающие методы
6. Обновите server.ts для RunService и ArtifactsService

После этих исправлений `npm run lint` должен пройти успешно.
