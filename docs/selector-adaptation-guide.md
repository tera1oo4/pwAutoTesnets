# Selector Adaptation Guide

Руководство по адаптации селекторов под разные версии Web3 кошельков.

## Общие принципы

### Версионирование селекторов

Каждый набор селекторов должен иметь комментарий с датой последней проверки и версией расширения:

```typescript
// VERSION: MetaMask 11.10+ (last verified: 2024-01-15)
// If selectors break after wallet update, check the version comment and update accordingly
const CONFIRM_BUTTON_SELECTORS = [
  'button[data-testid="page-container-footer-next"]', // primary
  'button:has-text("Confirm")',                        // fallback
  '.btn-primary'                                       // last resort
];
```

### Правило трех падежей

1. **Primary**: Используйте `data-testid` если доступен (наиболее стабилен)
2. **Fallback**: Текстовый селектор или атрибут класса (средняя стабильность)
3. **Last resort**: Структурный селектор (`div > button:nth-child(2)`) - используйте только если нет других вариантов

## MetaMask специфика

### Обновления селекторов

MetaMask часто меняет DOM при обновлениях:

```typescript
// GOOD: data-testid стабилен
const nextButton = page.locator('button[data-testid="page-container-footer-next"]');

// BAD: класс может исчезнуть при update
const nextButton = page.locator('button.btn-confirm-transaction');

// OK: текстовый селектор с языковой поддержкой
const nextButton = page.locator('button:has-text("Next")');
```

### Локализация

MetaMask может быть открыт на разных языках. Используйте текстовые селекторы осторожно:

```typescript
// Обработка разных языков
const confirmBtn = page.locator('button')
  .filter({ hasText: /^(Confirm|Подтвердить|确认)$/ });
```

### A/B тестирование

Некоторые версии MetaMask показывают разные UI:

```typescript
// Использование .or() для обработки обоих вариантов
const nextBtn = page.locator('button[data-testid="next-btn"]')
  .or(page.locator('button >> text="Continue"'));

await nextBtn.click();
```

### Структура попапа

```html
<!-- Обычная структура MetaMask popup -->
<div id="app-content">
  <div class="page-container">
    <div class="page-container-header">...</div>
    <div class="page-container-content">
      <!-- Main content here -->
    </div>
    <div class="page-container-footer">
      <button data-testid="page-container-footer-cancel">Reject</button>
      <button data-testid="page-container-footer-next">Confirm</button>
    </div>
  </div>
</div>
```

## Rabby специфика

### Shadow DOM и web-components

Rabby использует сложную структуру с web-components:

```typescript
// Rabby часто использует shadow DOM
// Playwright автоматически пробивает shadow boundaries
const confirmBtn = page.locator('button.rabby-btn-confirm');

// Если не работает, проверьте наличие shadow DOM:
// В PWDEBUG режиме смотрите в DevTools Elements
```

### Фокус и клики

Rabby требует явного управления фокусом:

```typescript
// Перед вводом пароля сбросить фокус
await page.click('body');
await page.waitForTimeout(200);

// Ввести пароль
await page.fill('input[type="password"]', password);
```

### Button variants

Rabby использует много типов кнопок. Привязывайтесь к семантике:

```typescript
// GOOD: привязка к функции
const approveBtn = page.locator('button.rabby-btn-primary:has-text("Approve")');

// BAD: привязка к стилю
const btn = page.locator('.btn-blue-500');
```

### Security warnings

Rabby часто показывает предупреждения безопасности. Обработайте их:

```typescript
// Проверить наличие предупреждения
const warning = page.locator('.rabby-security-warning');
const ignoreBtn = page.locator('button:has-text("Ignore")');

if (await warning.isVisible({ timeout: 1000 })) {
  await ignoreBtn.click();
  await page.waitForTimeout(500);
}

// Затем нажать основную кнопку
await approveBtn.click();
```

## Отладка селекторов

### Использование PWDEBUG

```bash
PWDEBUG=1 npm run worker
```

Откроется Playwright Inspector. Используйте для:
- Инспектирования DOM
- Проверки селекторов в реальном времени
- Паузы выполнения в нужных местах

### Скриншоты и HTML дампы

В коде автоматически сохраняются при ошибке:

```typescript
// Вручную сохранить скриншот перед проблемой
await page.screenshot({ path: `debug-${Date.now()}.png` });

// Дамп HTML
const html = await page.content();
console.log(html);
```

### Локальное тестирование селектора

```typescript
// Создайте простой тест-скрипт
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
await page.goto('chrome-extension://<id>/popup.html');

// Тестируйте селектор
const btn = page.locator('button[data-testid="confirm"]');
console.log('Button visible:', await btn.isVisible());
console.log('Button text:', await btn.textContent());

await browser.close();
```

## Fallback цепочки

### Паттерн 1: .or()

```typescript
const confirmBtn = page.locator('button[data-testid="confirm"]')
  .or(page.locator('button:has-text("Confirm")'))
  .or(page.locator('.btn-primary'));

await confirmBtn.click();
```

### Паттерн 2: Цикл с таймаутом

```typescript
const selectors = [
  'button[data-testid="confirm"]',
  'button:has-text("Confirm")',
  'button.btn-primary'
];

let clicked = false;
for (const sel of selectors) {
  try {
    const btn = page.locator(sel);
    if (await btn.isVisible({ timeout: 500 })) {
      await btn.click();
      clicked = true;
      break;
    }
  } catch (e) {
    // selector not found, try next
  }
}

if (!clicked) {
  throw new Error('Confirm button not found with any selector');
}
```

### Паттерн 3: Race между вариантами

```typescript
const primaryBtn = page.locator('button[data-testid="confirm"]');
const fallbackBtn = page.locator('button:has-text("Approve")');

// Нажмите первый который будет найден
await Promise.race([
  primaryBtn.click(),
  fallbackBtn.click()
]).catch(() => {
  // Ни один не был найден
});
```

## Обновление селекторов при changes

### Checklist перед коммитом

- [ ] Селекторы протестированы на текущей версии расширения
- [ ] Комментарий с датой и версией расширения добавлен
- [ ] Fallback цепочка покрывает известные варианты
- [ ] Текстовые селекторы учитывают локализацию где возможно
- [ ] Нет жестких структурных селекторов (nth-child и т.п.)
- [ ] `PWDEBUG=1` тестирование пройдено

### Безопасное обновление

1. **Не удаляйте старые селекторы сразу** - добавляйте новые в fallback:
   ```typescript
   // GOOD: Старый остается как fallback
   const btn = page.locator('button[data-testid="new-confirm"]')
     .or(page.locator('button[data-testid="old-confirm"]'));
   ```

2. **Используйте confidence scores** для детекции:
   ```typescript
   // Несколько признаков = больше уверенности
   let confidence = 0;
   if (await page.locator('button[data-testid="confirm"]').isVisible()) confidence += 0.6;
   if (await page.evaluate(() => typeof window.ethereum)) confidence += 0.4;

   if (confidence > 0.8) {
     // Это похоже на MetaMask
   }
   ```

3. **Изолированное тестирование** с сохраненным HTML:
   ```typescript
   // Сохраните HTML от старой версии
   const oldVersionHtml = fs.readFileSync('old-version.html');

   // Тестируйте новые селекторы на старом HTML
   const testPage = await browser.newPage();
   await testPage.setContent(oldVersionHtml);
   const btn = testPage.locator('button[data-testid="new"]');
   // Должен fallback работать?
   ```

## Неизвестное состояние кошелька

Когда кошелек находится в состоянии, не описанном в сценариях:

### Как логировать

```typescript
// Сохраните все данные для отладки
await page.screenshot({ path: `unknown-state-${Date.now()}.png` });
const html = await page.content();
fs.writeFileSync(`unknown-state-${Date.now()}.html`, html);

// Получите текст страницы
const text = await page.textContent('body');
logger.warn('wallet_unknown_state', 'Unexpected wallet state', {
  url: page.url(),
  pageText: text.substring(0, 500),
  timestamp: new Date().toISOString()
});

throw new NeedsReviewError('wallet_unknown_state', 'Unknown wallet state - see artifacts');
```

### Разбор ошибки в production

1. Получить run с ошибкой
2. Скачать артефакты (скриншот + HTML)
3. Открыть HTML в браузере для анализа состояния
4. Добавить новый селектор или логику обработки
5. Тестировать перед деплоем

## Чек-лист для maintenance

- [ ] Еженедельно проверять версии расширений в use
- [ ] При обновлении расширения: тестировать локально перед production
- [ ] Хранить сохраненные HTML от разных версий для тестирования
- [ ] Документировать все changes селекторов с датами
- [ ] Мониторить `wallet_unknown_state` ошибки для новых patterns
- [ ] Код review обязателен для всех changes селекторов
