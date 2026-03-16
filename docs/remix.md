This file is a merged representation of the entire codebase, combined into a single document by Repomix.
The content has been processed where security check has been disabled.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Security check has been disabled - content may contain sensitive information
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
architecture/
  overview.json
database/
  schema.sql
docs/
  ai-promts/
    master-prompt.md
  new-wallet-adapter-guide.md
  runbook.md
  selector-adaptation-guide.md
scripts/
  seed.ts
src/
  api/
    services/
      ArtifactsService.ts
      RunService.ts
    dto.ts
    examples.ts
    Router.ts
    routes.ts
    types.ts
  config/
    env.ts
  core/
    browser/
      BrowserManager.ts
      ProfileLock.ts
    queue/
      InMemoryQueue.ts
      Queue.ts
      RedisQueue.ts
    scenario/
      examples/
        BalanceCheckScenario.ts
        ConnectWalletScenario.ts
      ScenarioEngine.ts
      ScenarioRegistry.ts
    scheduler/
      Scheduler.ts
    wallet/
      metamask/
        MetaMaskController.ts
      rabby/
        RabbyController.ts
      WalletDetector.ts
      WalletManager.ts
    worker/
      FileArtifactWriter.ts
      Worker.ts
  dashboard/
    components/
      RunArtifacts.ts
      RunStatusBadge.ts
      RunTable.ts
    hooks/
      useRunDetail.ts
      useRuns.ts
    pages/
      RunDetailPage.ts
      RunsPage.ts
    services/
      runService.ts
      runUpdates.ts
    structure.ts
  data/
    repositories/
      RunRepository.ts
      RunStoreRepository.ts
  shared/
    security/
      SecretService.ts
    constants.ts
    errors.ts
    logger.ts
    observability.ts
    retry.ts
    types.ts
tests/
  scheduler-queue.test.ts
  wallet-detector.test.ts
.env.example
.gitignore
docker-compose.yml
Dockerfile
package.json
production-hardening.txt
project-tree.txt
README.md
run-guide.txt
selector_guide.md
tsconfig.json
```

# Files

## File: architecture/overview.json
````json
{
  "app": "pwAutoTestnets",
  "layers": {
    "core": ["browser", "locks"],
    "shared": ["types", "constants"],
    "data": ["database/schema.sql"]
  },
  "flows": [
    {
      "name": "browser_session",
      "steps": [
        "acquire_profile_lock",
        "launch_driver_session",
        "record_session_metadata",
        "release_profile_lock"
      ]
    }
  ],
  "storage": {
    "database": "sqlite",
    "schema": "/Users/tera/code/pwAutoTestnets/database/schema.sql"
  }
}
````

## File: database/schema.sql
````sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS networks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rpc_url TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS browser_profiles (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  user_data_dir TEXT NOT NULL,
  proxy_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profile_locks (
  profile_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  acquired_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES browser_profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS test_runs (
  id TEXT PRIMARY KEY,
  network_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (network_id) REFERENCES networks(id),
  FOREIGN KEY (profile_id) REFERENCES browser_profiles(id)
);
````

## File: docs/ai-promts/master-prompt.md
````markdown

````

## File: docs/new-wallet-adapter-guide.md
````markdown
# New Wallet Adapter Guide

Р”Р°РЅРЅРѕРµ СЂСѓРєРѕРІРѕРґСЃС‚РІРѕ РѕРїРёСЃС‹РІР°РµС‚ РїСЂРѕС†РµСЃСЃ РґРѕР±Р°РІР»РµРЅРёСЏ РїРѕРґРґРµСЂР¶РєРё РЅРѕРІРѕРіРѕ web3 РєРѕС€РµР»СЊРєР° РІ РїСЂРѕРµРєС‚. Р’СЃРµ РєРѕС€РµР»СЊРєРё РІ СЃРёСЃС‚РµРјРµ Р°Р±СЃС‚СЂР°РіРёСЂСѓСЋС‚СЃСЏ С‡РµСЂРµР· РµРґРёРЅС‹Р№ РёРЅС‚РµСЂС„РµР№СЃ, С‡С‚Рѕ РїРѕР·РІРѕР»СЏРµС‚ СЃС†РµРЅР°СЂРёСЏРј СЂР°Р±РѕС‚Р°С‚СЊ СЃ Р»СЋР±С‹Рј РєРѕС€РµР»СЊРєРѕРј (MetaMask, Rabby Рё С‚.Рґ.) Р±РµР· РёР·РјРµРЅРµРЅРёСЏ Р±РёР·РЅРµСЃ-Р»РѕРіРёРєРё.

## РљР°Рє РґРѕР±Р°РІРёС‚СЊ РЅРѕРІС‹Р№ wallet adapter
1. РЎРѕР·РґР°Р№С‚Рµ РЅРѕРІСѓСЋ РґРёСЂРµРєС‚РѕСЂРёСЋ РІ `src/core/wallet/<wallet-name>`.
2. РЎРѕР·РґР°Р№С‚Рµ РєР»Р°СЃСЃ-РєРѕРЅС‚СЂРѕР»Р»РµСЂ, РЅР°РїСЂРёРјРµСЂ, `PhantomController.ts` РёР»Рё `OkxWalletController.ts`.
3. Р РµР°Р·СѓР№С‚Рµ Р»РѕРіРёРєСѓ РІР·Р°РёРјРѕРґРµР№СЃС‚РІРёСЏ СЃРѕ РІСЃРїР»С‹РІР°СЋС‰РёРјРё РѕРєРЅР°РјРё СЌС‚РѕРіРѕ РєРѕС€РµР»СЊРєР°, РёСЃРїРѕР»СЊР·СѓСЏ Playwright `PageHandle` РёР»Рё `BrowserContext`.
4. РћР±РЅРѕРІРёС‚Рµ С‚РёРїС‹ Рё РєРѕРЅСЃС‚Р°РЅС‚С‹ WalletKind, С‡С‚РѕР±С‹ СЃРёСЃС‚РµРјР° Р·РЅР°Р»Р° Рѕ РЅРѕРІРѕРј РєРѕС€РµР»СЊРєРµ.

## РљР°РєРёРµ РёРЅС‚РµСЂС„РµР№СЃС‹ СЂРµР°Р»РёР·РѕРІР°С‚СЊ
Р’Р°С€ РЅРѕРІС‹Р№ РєРѕРЅС‚СЂРѕР»Р»РµСЂ РґРѕР»Р¶РµРЅ РёРјРїР»РµРјРµРЅС‚РёСЂРѕРІР°С‚СЊ РёРЅС‚РµСЂС„РµР№СЃ `WalletController` (РёР· `src/shared/types.ts`):

```typescript
export type WalletController = {
  kind: WalletKind; // РќР°РїСЂРёРјРµСЂ, "phantom"
  detect(page: PageHandle, context: WalletContext): Promise<WalletDetection | null>;
  unlock(page: PageHandle, password: string, context: WalletContext): Promise<void>;
  connect(page: PageHandle, context: WalletContext): Promise<void>;
  ensureNetwork(page: PageHandle, request: WalletConnectionRequest, context: WalletContext): Promise<void>;
};
```

- **`detect`**: РћРїСЂРµРґРµР»СЏРµС‚, РЅР°С…РѕРґРёС‚СЃСЏ Р»Рё С†РµР»РµРІР°СЏ СЃС‚СЂР°РЅРёС†Р° РІ РєРѕРЅС‚РµРєСЃС‚Рµ Р·Р°РїСЂРѕСЃР° РѕС‚ СЌС‚РѕРіРѕ РєРѕС€РµР»СЊРєР°.
- **`unlock`**: Р’РІРѕРґ РїР°СЂРѕР»СЏ РґР»СЏ СЂР°Р·Р±Р»РѕРєРёСЂРѕРІРєРё РєРѕС€РµР»СЊРєР° (РµСЃР»Рё РѕРЅ Р·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅ).
- **`connect`**: РџРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ Р·Р°РїСЂРѕСЃР° РЅР° РїРѕРґРєР»СЋС‡РµРЅРёРµ СЃР°Р№С‚Р° Рє РєРѕС€РµР»СЊРєСѓ (Approve connection).
- **`ensureNetwork`**: РЎРјРµРЅР° РёР»Рё РґРѕР±Р°РІР»РµРЅРёРµ СЃРµС‚Рё (Switch/Add Network).

## РљР°РєРёРµ detector rules РЅСѓР¶РЅС‹
РњРµС‚РѕРґ `detect` РґРѕР»Р¶РµРЅ РІРѕР·РІСЂР°С‰Р°С‚СЊ РѕР±СЉРµРєС‚ `WalletDetection` СЃ СѓСЂРѕРІРЅРµРј СѓРІРµСЂРµРЅРЅРѕСЃС‚Рё (`confidence` РѕС‚ 0 РґРѕ 1).
РџСЂРёР·РЅР°РєРё РґР»СЏ РґРµС‚РµРєС‚РёСЂРѕРІР°РЅРёСЏ:
1. **URL СЃС‚СЂР°РЅРёС†С‹**: Р•СЃР»Рё СЌС‚Рѕ РѕРєРЅРѕ СЂР°СЃС€РёСЂРµРЅРёСЏ, РїСЂРѕРІРµСЂСЊС‚Рµ `page.url()`. РќР°С‡РёРЅР°РµС‚СЃСЏ Р»Рё РѕРЅ СЃ РїСЂРѕС‚РѕРєРѕР»Р° СЂР°СЃС€РёСЂРµРЅРёСЏ (`chrome-extension://`) Рё СЃРѕРІРїР°РґР°РµС‚ Р»Рё ID СЂР°СЃС€РёСЂРµРЅРёСЏ РёР»Рё РїСѓС‚СЊ.
2. **РЎРїРµС†РёС„РёС‡РЅС‹Рµ DOM СЌР»РµРјРµРЅС‚С‹**: РќР°Р»РёС‡РёРµ СѓРЅРёРєР°Р»СЊРЅС‹С… ID РёР»Рё data-Р°С‚СЂРёР±СѓС‚РѕРІ РІ HTML (РЅР°РїСЂРёРјРµСЂ, `<div id="app-content">` + Р»РѕРіРѕС‚РёРї РєРѕС€РµР»СЊРєР°).
3. **Р“Р»РѕР±Р°Р»СЊРЅС‹Рµ РїРµСЂРµРјРµРЅРЅС‹Рµ**: Р’ РєРѕРЅС‚РµРєСЃС‚Рµ РѕР±С‹С‡РЅС‹С… СЃС‚СЂР°РЅРёС† РјРѕР¶РЅРѕ РїСЂРѕРІРµСЂРёС‚СЊ `await page.evaluate(() => !!window.phantom)`.

РџСЂРёРјРµСЂ:
```typescript
if (url.includes('chrome-extension://') && url.includes('popup.html')) {
    const hasLogo = await page.locator('.wallet-logo-class').isVisible();
    if (hasLogo) return { kind: WalletKind.Phantom, confidence: 0.9 };
}
```

## РљР°Рє РІСЃС‚СЂРѕРёС‚СЊ РЅРѕРІС‹Р№ РєРѕС€РµР»РµРє РІ factory
(Р’ С‚РµРєСѓС‰РµР№ Р°СЂС…РёС‚РµРєС‚СѓСЂРµ СЂРѕР»СЊ factory РѕР±С‹С‡РЅРѕ РёРіСЂР°РµС‚ РјРµС…Р°РЅРёР·Рј РѕСЂРєРµСЃС‚СЂР°С†РёРё РєРѕС€РµР»СЊРєРѕРІ РёР»Рё `WalletManager`, РєРѕС‚РѕСЂС‹Р№ РјРѕР¶РµС‚ РїСЂРёРЅРёРјР°С‚СЊ РЅР° РІС…РѕРґ РјР°СЃСЃРёРІ РєРѕРЅС‚СЂРѕР»Р»РµСЂРѕРІ.)
1. Р”РѕР±Р°РІСЊС‚Рµ РЅРѕРІС‹Р№ `WalletKind` РІ `src/shared/types.ts`:
   ```typescript
   export const WalletKind = {
     MetaMask: "metamask",
     Rabby: "rabby",
     Phantom: "phantom" // <---
   } as const;
   ```
2. Р•СЃР»Рё РІ СЃРёСЃС‚РµРјРµ РµСЃС‚СЊ РјРµСЃС‚Рѕ РёРЅРёС†РёР°Р»РёР·Р°С†РёРё `WalletManager` (РЅР°РїСЂРёРјРµСЂ, РІ D&I РєРѕРЅС‚РµР№РЅРµСЂРµ РёР»Рё РїСЂРё СЃС‚Р°СЂС‚Рµ Worker/Scenario), РїСЂРѕРєРёРЅСЊС‚Рµ СЌРєР·РµРјРїР»СЏСЂ РЅРѕРІРѕРіРѕ РєРѕРЅС‚СЂРѕР»Р»РµСЂР° РІ СЃРїРёСЃРѕРє РґРѕСЃС‚СѓРїРЅС‹С… РґР»СЏ РґРµС‚РµРєС†РёРё.
3. РЈР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ Р»РѕРіРёРєР° РјСѓР»СЊС‚Рё-РґРµС‚РµРєС‚РёСЂРѕРІР°РЅРёСЏ СЃРїРѕСЃРѕР±РЅР° РѕРїСЂРѕСЃРёС‚СЊ РІСЃРµ РєРѕРЅС‚СЂРѕР»Р»РµСЂС‹ Рё РІС‹Р±СЂР°С‚СЊ С‚РѕС‚, Сѓ РєРѕС‚РѕСЂРѕРіРѕ `confidence` РІС‹С€Рµ.

## РљР°Рє РїСЂРѕС‚РµСЃС‚РёСЂРѕРІР°С‚СЊ РЅРѕРІС‹Р№ adapter
1. **Р›РѕРєР°Р»СЊРЅС‹Р№ С‚РµСЃС‚**: РСЃРїРѕР»СЊР·СѓР№С‚Рµ `scripts/local-test.ts` СЃ РїСЂРѕС„РёР»РµРј Р±СЂР°СѓР·РµСЂР°, РІ РєРѕС‚РѕСЂС‹Р№ СѓСЃС‚Р°РЅРѕРІР»РµРЅРѕ СЂР°СЃС€РёСЂРµРЅРёРµ РЅРѕРІРѕРіРѕ РєРѕС€РµР»СЊРєР°.
2. **РРЅС‚РµСЂР°РєС‚РёРІРЅС‹Р№ РґРµР±Р°Рі**: Р’РєР»СЋС‡РёС‚Рµ `PWDEBUG=1`. РџСЂРѕР№РґРёС‚Рµ С„Р»РѕСѓ РІСЂСѓС‡РЅСѓСЋ, С‡С‚РѕР±С‹ СЃРѕР±СЂР°С‚СЊ Р»РѕРєР°С‚РѕСЂС‹ РґР»СЏ РєРЅРѕРїРѕРє Confirm, Unlock, Switch Network.
3. **РњРѕРєРёСЂРѕРІР°РЅРЅС‹Рµ С‚РµСЃС‚С‹**: РЎРѕС…СЂР°РЅРёС‚Рµ HTML-РєРѕРґ СЃС‚СЂР°РЅРёС†С‹ РєРѕС€РµР»СЊРєР° РёР· Playwright (РЅР°РїСЂРёРјРµСЂ, СЃС‚СЂР°РЅРёС†Сѓ РІРІРѕРґР° РїР°СЂРѕР»СЏ) Рё РЅР°РїРёС€РёС‚Рµ unit-С‚РµСЃС‚ РґР»СЏ `detect` Рё `unlock` РјРµС‚РѕРґРѕРІ, "СЃРєР°СЂРјР»РёРІР°СЏ" РёРј Р·Р°РјРѕРєР°РЅРЅС‹Р№ `PageHandle`.
4. Р—Р°РїСѓСЃС‚РёС‚Рµ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёР№ Р±Р°Р·РѕРІС‹Р№ СЃС†РµРЅР°СЂРёР№ `ConnectWalletScenario` СЃ РїСЂРѕС„РёР»РµРј, РЅР°СЃС‚СЂРѕРµРЅРЅС‹Рј РЅР° РЅРѕРІС‹Р№ РєРѕС€РµР»РµРє.

## РљР°РєРёРµ edge cases СѓС‡РёС‚С‹РІР°С‚СЊ
1. **РћРЅР±РѕСЂРґРёРЅРі (First Time Setup)**: Р§С‚Рѕ РґРµР»Р°С‚СЊ, РµСЃР»Рё РєРѕС€РµР»РµРє РЅРµ РёРЅРёС†РёР°Р»РёР·РёСЂРѕРІР°РЅ? РљРѕРЅС‚СЂРѕР»Р»РµСЂ РґРѕР»Р¶РµРЅ РїРѕРЅРёРјР°С‚СЊ СЌС‚Рѕ СЃРѕСЃС‚РѕСЏРЅРёРµ Рё СЃР±СЂР°СЃС‹РІР°С‚СЊ Р·Р°РґР°С‡Сѓ РІ `NeedsReviewError` СЃ РєРѕРґРѕРј `wallet_unknown_state`.
2. **Р РµРєР»Р°РјРЅС‹Рµ Р±Р°РЅРЅРµСЂС‹ (What's New)**: РќРµРєРѕС‚РѕСЂС‹Рµ РєРѕС€РµР»СЊРєРё РїРѕРєР°Р·С‹РІР°СЋС‚ РїРѕР»РЅРѕСЌРєСЂР°РЅРЅС‹Рµ РїРѕРїР°РїС‹ "Р§С‚Рѕ РЅРѕРІРѕРіРѕ" РїРѕСЃР»Рµ РѕР±РЅРѕРІР»РµРЅРёСЏ. Р”РѕР±Р°РІСЊС‚Рµ РїСЂРѕРІРµСЂРєСѓ Рё Р·Р°РєСЂС‹С‚РёРµ С‚Р°РєРёС… РѕРєРѕРЅ РїРµСЂРµРґ РѕСЃРЅРѕРІРЅС‹Рј РґРµР№СЃС‚РёРІРёРµРј.
3. **РџР°СЂР°Р»Р»РµР»СЊРЅС‹Рµ Р·Р°РїСЂРѕСЃС‹**: Р•СЃР»Рё dApp РґРµР»Р°РµС‚ РґРІР° Р·Р°РїСЂРѕСЃР° РЅР° РїРѕРґРїРёСЃСЊ РѕРґРЅРѕРІСЂРµРјРµРЅРЅРѕ, РєРѕС€РµР»РµРє РјРѕР¶РµС‚ РїРѕРєР°Р·Р°С‚СЊ РѕС‡РµСЂРµРґСЊ.
4. **РћРєРЅРѕ СѓР¶Рµ СЂР°Р·Р±Р»РѕРєРёСЂРѕРІР°РЅРѕ**: РњРµС‚РѕРґ `unlock` РЅРµ РґРѕР»Р¶РµРЅ РїР°РґР°С‚СЊ, РµСЃР»Рё РєРѕС€РµР»РµРє СѓР¶Рµ СЂР°Р·Р±Р»РѕРєРёСЂРѕРІР°РЅ. РџСЂРѕРІРµСЂСЊС‚Рµ РІР°Р»РёРґРЅРѕСЃС‚СЊ СЃРѕСЃС‚РѕСЏРЅРёСЏ РїРµСЂРµРґ РґРµР№СЃС‚РІРёРµРј.

## РљР°Рє РЅРµ Р»РѕРјР°С‚СЊ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёРµ СЃС†РµРЅР°СЂРёРё
1. **РђР±СЃС‚СЂР°РєС†РёСЏ**: РЎС†РµРЅР°СЂРёРё РґРµР»Р°СЋС‚ РІС‹Р·РѕРІС‹ РІРёРґР° `walletManager.connect(page)` РёР»Рё `walletManager.ensureNetwork(...)`. РЈР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ РІР°С€ Р°РґР°РїС‚РµСЂ РїРѕР»РЅРѕСЃС‚СЊСЋ РёРЅРєР°РїСЃСѓР»РёСЂСѓРµС‚ Р»РѕРіРёРєСѓ СЃРµР»РµРєС‚РѕСЂРѕРІ. РЎС†РµРЅР°СЂРёР№ РЅРёС‡РµРіРѕ РЅРµ РґРѕР»Р¶РµРЅ Р·РЅР°С‚СЊ Рѕ СЃС‚СЂСѓРєС‚СѓСЂРµ DOM РєРѕС€РµР»СЊРєР°.
2. **РЎРѕР±Р»СЋРґРµРЅРёРµ РєРѕРЅС‚СЂР°РєС‚Р°**: Р•СЃР»Рё Р°РґР°РїС‚РµСЂ Р·Р°РІРµСЂС€Р°РµС‚ РјРµС‚РѕРґ (РЅР°РїСЂРёРјРµСЂ, `connect()`), СЃС†РµРЅР°СЂРёР№ РѕР¶РёРґР°РµС‚, С‡С‚Рѕ РѕРєРЅРѕ РєРѕС€РµР»СЊРєР° Р·Р°РєСЂС‹Р»РѕСЃСЊ РёР»Рё РїРµСЂРµС€Р»Рѕ РІ С„РѕРЅРѕРІРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ, Р° dApp РїРѕР»СѓС‡РёР» РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ. РќРµ РѕСЃС‚Р°РІР»СЏР№С‚Рµ РІРёСЃСЏС‰РёРµ РґРёР°Р»РѕРіРё Рё СЏРІРЅС‹Рј РѕР±СЂР°Р·РѕРј РѕР¶РёРґР°Р№С‚Рµ Р·Р°РєСЂС‹С‚РёСЏ РёР»Рё РІС‹РїРѕР»РЅРµРЅРёСЏ РґРµР№СЃС‚РІРёСЏ (`page.waitForURL`, `page.waitForEvent('close')` Рё С‚.Рї., РµСЃР»Рё РїСЂРёРјРµРЅРёРјРѕ).
3. **РќРµ С‚СЂРѕРіР°Р№С‚Рµ С‡СѓР¶РёРµ Р°РґР°РїС‚РµСЂС‹**: РЎС‚Р°СЂР°Р№С‚РµСЃСЊ РЅРµ СЃРѕР·РґР°РІР°С‚СЊ РѕР±С‰РёС… Р±Р°Р·РѕРІС‹С… РєР»Р°СЃСЃРѕРІ СЃ СЃРёРЅРіР»С‚РѕРЅР°РјРё РёР»Рё СЂР°Р·РґРµР»СЏРµРјС‹Рј СЃРѕСЃС‚РѕСЏРЅРёРµРј, РєРѕС‚РѕСЂРѕРµ РјРѕР¶РµС‚ РїРѕРІР»РёСЏС‚СЊ РЅР° РїРѕРІРµРґРµРЅРёРµ `MetaMaskController` РёР»Рё `RabbyController`.
````

## File: docs/runbook.md
````markdown
# Runbook / РћРїРµСЂР°С†РёРѕРЅРЅРѕРµ СЂСѓРєРѕРІРѕРґСЃС‚РІРѕ

Р’ СЌС‚РѕРј РґРѕРєСѓРјРµРЅС‚Рµ СЃРѕР±СЂР°РЅС‹ РѕСЃРЅРѕРІРЅС‹Рµ РёРЅСЃС‚СЂСѓРєС†РёРё РїРѕ СЌРєСЃРїР»СѓР°С‚Р°С†РёРё РїСЂРёР»РѕР¶РµРЅРёСЏ Р°РІС‚Рѕ-С‚РµСЃС‚РЅРµС‚РѕРІ.

## РљР°Рє РїРѕРґРЅРёРјР°С‚СЊ РїСЂРѕРµРєС‚ Р»РѕРєР°Р»СЊРЅРѕ
1. РЈР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ СѓСЃС‚Р°РЅРѕРІР»РµРЅ Node.js (СЂРµРєРѕРјРµРЅРґСѓРµС‚СЃСЏ v20+) Рё Yarn/npm.
2. РЎРєРѕРїРёСЂСѓР№С‚Рµ С„Р°Р№Р» РєРѕРЅС„РёРіСѓСЂР°С†РёРё:
   ```bash
   cp .env.example .env
   ```
3. РЈСЃС‚Р°РЅРѕРІРёС‚Рµ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё:
   ```bash
   npm install
   ```
4. Р—Р°РїСѓСЃС‚РёС‚Рµ РЅРµРѕР±С…РѕРґРёРјС‹Рµ СЃРµСЂРІРёСЃС‹ (РЅР°РїСЂРёРјРµСЂ, Redis, РµСЃР»Рё РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ `RedisQueue`). РњРѕР¶РЅРѕ РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ Docker:
   ```bash
   docker-compose up -d redis
   ```
5. Р—Р°РїСѓСЃС‚РёС‚Рµ РїСЂРѕРµРєС‚ РІ СЂРµР¶РёРјРµ СЂР°Р·СЂР°Р±РѕС‚РєРё (API + Worker):
   ```bash
   npm run dev
   ```

## РљР°Рє РґРѕР±Р°РІР»СЏС‚СЊ РЅРѕРІС‹Р№ Р°РєРєР°СѓРЅС‚
1. РЎРѕР·РґР°Р№С‚Рµ РЅРѕРІСѓСЋ СЃРёРґ-С„СЂР°Р·Сѓ (РёР»Рё РїСЂРёРІР°С‚РЅС‹Р№ РєР»СЋС‡) РІ РЅР°РґРµР¶РЅРѕРј РјРµСЃС‚Рµ.
2. РџРѕРґРіРѕС‚РѕРІСЊС‚Рµ РЅРѕРІС‹Р№ Р±СЂР°СѓР·РµСЂРЅС‹Р№ РїСЂРѕС„РёР»СЊ. РњРѕР¶РЅРѕ РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РІСЃС‚СЂРѕРµРЅРЅС‹Р№ СЃРєСЂРёРїС‚ РґР»СЏ РёРЅРёС†РёР°Р»РёР·Р°С†РёРё.
3. Р”РѕР±Р°РІСЊС‚Рµ Р·Р°РїРёСЃСЊ РѕР± Р°РєРєР°СѓРЅС‚Рµ РІ Р±Р°Р·Сѓ РґР°РЅРЅС‹С… РёР»Рё РєРѕРЅС„РёРіСѓСЂР°С†РёСЋ.
4. (Р РµРєРѕРјРµРЅРґСѓРµС‚СЃСЏ) Р—Р°РїСѓСЃС‚РёС‚Рµ СЃРєСЂРёРїС‚ `scripts/init-profile.ts` РґР»СЏ РїРµСЂРІРѕРЅР°С‡Р°Р»СЊРЅРѕРіРѕ РёРјРїРѕСЂС‚Р° СЃРёРґ-С„СЂР°Р·С‹ РІ РєРѕС€РµР»РµРє РІ РІРёР·СѓР°Р»СЊРЅРѕРј СЂРµР¶РёРјРµ (`PWDEBUG=1`), С‡С‚РѕР±С‹ РёР·Р±РµР¶Р°С‚СЊ РєР°РїС‡Рё РёР»Рё СЂСѓС‡РЅС‹С… РїСЂРѕРІРµСЂРѕРє РЅР° РїРµСЂРІРѕРј СЌС‚Р°РїРµ.

## РљР°Рє СЃРѕР·РґР°РІР°С‚СЊ РЅРѕРІСѓСЋ Р·Р°РґР°С‡Сѓ
1. РџРµСЂРµР№РґРёС‚Рµ РІ РІРµР±-РёРЅС‚РµСЂС„РµР№СЃ РґР°С€Р±РѕСЂРґР°.
2. РќР°Р¶РјРёС‚Рµ "Create Run" (РЎРѕР·РґР°С‚СЊ Р·Р°РґР°С‡Сѓ).
3. Р’С‹Р±РµСЂРёС‚Рµ РЅСѓР¶РЅС‹Р№ СЃС†РµРЅР°СЂРёР№ (Scenario), РїСЂРѕС„РёР»СЊ Р±СЂР°СѓР·РµСЂР° (Profile ID) Рё СЃРµС‚СЊ (Network).
4. Р—Р°РґР°Р№С‚Рµ `maxAttempts`, РµСЃР»Рё С‚СЂРµР±СѓРµС‚СЃСЏ Р±РѕР»СЊС€Рµ/РјРµРЅСЊС€Рµ РїРѕРІС‚РѕСЂРѕРІ РїСЂРё СЃР±РѕСЏС….
5. РќР°Р¶РјРёС‚Рµ "Submit". Р—Р°РґР°С‡Р° РїРѕСЏРІРёС‚СЃСЏ РІ СЃС‚Р°С‚СѓСЃРµ `queued`.

## РљР°Рє Р·Р°РїСѓСЃРєР°С‚СЊ Р·Р°РґР°С‡Сѓ РІСЂСѓС‡РЅСѓСЋ
- РћР±С‹С‡РЅРѕ Р·Р°РґР°С‡Рё РїРѕРґС…РІР°С‚С‹РІР°СЋС‚СЃСЏ Worker'РѕРј Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё РёР· РѕС‡РµСЂРµРґРё.
- Р•СЃР»Рё РЅСѓР¶РЅРѕ Р·Р°РїСѓСЃС‚РёС‚СЊ РєРѕРЅРєСЂРµС‚РЅС‹Р№ СЃС†РµРЅР°СЂРёР№ РјРёРЅСѓСЏ РѕС‡РµСЂРµРґСЊ, РёСЃРїРѕР»СЊР·СѓР№С‚Рµ CLI СѓС‚РёР»РёС‚Сѓ (РµСЃР»Рё СЂРµР°Р»РёР·РѕРІР°РЅРѕ РІ РїСЂРѕРµРєС‚Рµ):
  ```bash
  npm run cli -- run-scenario <scenarioId> <profileId> <networkId>
  ```
- Р”Р»СЏ РїРѕРІС‚РѕСЂРЅРѕРіРѕ Р·Р°РїСѓСЃРєР° `failed` Р·Р°РґР°С‡Рё, С‡РµСЂРµР· API РёР»Рё РёРЅС‚РµСЂС„РµР№СЃ РґР°С€Р±РѕСЂРґР° РЅСѓР¶РЅРѕ СЃРѕР·РґР°С‚СЊ РЅРѕРІСѓСЋ Р·Р°РґР°С‡Сѓ (РєР»РѕРЅ) СЃ С‚РµРј Р¶Рµ СЃС†РµРЅР°СЂРёРµРј Рё РїР°СЂР°РјРµС‚СЂР°РјРё.

## РљР°Рє СЃРјРѕС‚СЂРµС‚СЊ Р»РѕРіРё
- РџРѕ СѓРјРѕР»С‡Р°РЅРёСЋ Р»РѕРіРё РІС‹РІРѕРґСЏС‚СЃСЏ РІ `stdout`. Р’ production РёСЃРїРѕР»СЊР·СѓР№С‚Рµ `pm2 logs` РёР»Рё РЅР°СЃС‚СЂРѕРµРЅРЅСѓСЋ СЃРёСЃС‚РµРјСѓ СЃР±РѕСЂРєРё Р»РѕРіРѕРІ (ELK, Datadog).
- РљР°Р¶РґР°СЏ Р»РѕРі-Р·Р°РїРёСЃСЊ СЃРѕРґРµСЂР¶РёС‚ JSON С„РѕСЂРјР°С‚ (РµСЃР»Рё РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ `pino` РёР»Рё Р°РЅР°Р»РѕРі) Рё С‚СЌРіРё `runId`, `attempt`, `scenarioId` РґР»СЏ СѓРґРѕР±РЅРѕР№ С„РёР»СЊС‚СЂР°С†РёРё.
- РђСЂС‚РµС„Р°РєС‚С‹ (СЃРєСЂРёРЅС€РѕС‚С‹ Рё HTML РґРµСЂРµРІР° СЃС‚СЂР°РЅРёС†С‹) РґР»СЏ СѓРїР°РІС€РёС… Р·Р°РґР°С‡ СЃРѕС…СЂР°РЅСЏСЋС‚СЃСЏ Р»РѕРєР°Р»СЊРЅРѕ. РџСѓС‚Рё РґРѕ РЅРёС… РјРѕР¶РЅРѕ РЅР°Р№С‚Рё РІ Р»РѕРіР°С… РёР»Рё РІ РґР°С€Р±РѕСЂРґРµ (РїРѕР»Рµ `artifacts`).

## РљР°Рє СЂР°Р·Р±РёСЂР°С‚СЊ РѕС€РёР±РєРё
1. **РќР°Р№РґРёС‚Рµ РѕС€РёР±РєСѓ РІ РґР°С€Р±РѕСЂРґРµ РёР»Рё Р»РѕРіР°С…**, РѕР±СЂР°С‚РёС‚Рµ РІРЅРёРјР°РЅРёРµ РЅР° `status` (`failed` РёР»Рё `needs_review`) Рё `code` (РЅР°РїСЂРёРјРµСЂ, `wallet_unknown_state`).
2. РџСЂРѕРІРµСЂСЊС‚Рµ СЃРѕС…СЂР°РЅРµРЅРЅС‹Рµ СЃРєСЂРёРЅС€РѕС‚С‹ Рё HTML. Р­С‚Рѕ СЃР°РјС‹Р№ Р±С‹СЃС‚СЂС‹Р№ СЃРїРѕСЃРѕР± РїРѕРЅСЏС‚СЊ, РіРґРµ СЃРєСЂРёРїС‚ Р·Р°СЃС‚СЂСЏР».
3. Р•СЃР»Рё РѕС€РёР±РєР° `transient` (РЅР°РїСЂРёРјРµСЂ, С‚Р°Р№РјР°СѓС‚ СЃРµС‚Рё РёР»Рё rate limit), СЃРєСЂРёРїС‚ СѓР¶Рµ РґРѕР»Р¶РµРЅ Р±С‹Р» РїРѕРїСЂРѕР±РѕРІР°С‚СЊ РїРµСЂРµР·Р°РїСѓСЃС‚РёС‚СЊСЃСЏ. РџСЂРѕРІРµСЂСЊС‚Рµ РєРѕР»РёС‡РµСЃС‚РІРѕ `attempt`.
4. Р’ СЃР»СѓС‡Р°Рµ `needs_review` РёР»Рё `wallet_unknown_state`, РєРѕС€РµР»РµРє РѕРєР°Р·Р°Р»СЃСЏ РІ РЅРµРїСЂРµРґРІРёРґРµРЅРЅРѕРј РёРЅС‚РµСЂС„РµР№СЃРЅРѕРј СЃРѕСЃС‚РѕСЏРЅРёРё (СЂРµРєР»Р°РјРЅС‹Р№ Р±Р°РЅРЅРµСЂ, РѕР±РЅРѕРІР»РµРЅРёРµ СЃРѕРіР»Р°С€РµРЅРёР№). Р’РѕР№РґРёС‚Рµ РІ РїСЂРѕС„РёР»СЊ РІСЂСѓС‡РЅСѓСЋ (СЃРј. СЃР»РµРґСѓСЋС‰РёР№ РїСѓРЅРєС‚) Рё Р·Р°РєСЂРѕР№С‚Рµ РјРѕРґР°Р»СЊРЅС‹Рµ РѕРєРЅР°.

## РљР°Рє РІРѕСЃСЃС‚Р°РЅР°РІР»РёРІР°С‚СЊ СЃР»РѕРјР°РЅРЅС‹Р№ browser profile
Р•СЃР»Рё РїСЂРѕС„РёР»СЊ РїРѕСЃС‚РѕСЏРЅРЅРѕ РІС‹РґР°РµС‚ РѕС€РёР±РєРё РёР»Рё СЂР°СЃС€РёСЂРµРЅРёРµ РєРѕС€РµР»СЊРєР° РєСЂР°С€РЅСѓР»РѕСЃСЊ:
1. Р—Р°РІРµСЂС€РёС‚Рµ РІСЃРµ РІРѕСЂРєРµСЂС‹, С‡С‚РѕР±С‹ СЃРЅСЏС‚СЊ Р»РѕРєРё (РёР»Рё СѓРґР°Р»РёС‚Рµ stale `.lock.json` С„Р°Р№Р»С‹ РїСЂРѕС„РёР»СЏ РІ РґРёСЂРµРєС‚РѕСЂРёРё `~/.testnets-locks`).
2. Р—Р°РїСѓСЃС‚РёС‚Рµ СЃРєСЂРёРїС‚ РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёСЏ РІ СЂСѓС‡РЅРѕРј СЂРµР¶РёРјРµ:
   ```bash
   npm run cli -- open-profile <profileId>
   ```
3. РћС‚РєСЂРѕРµС‚СЃСЏ Р±СЂР°СѓР·РµСЂ. Р’С‹РїРѕР»РЅРёС‚Рµ РЅРµРѕР±С…РѕРґРёРјС‹Рµ СЂСѓС‡РЅС‹Рµ РґРµР№СЃС‚РІРёСЏ (РІРІРµРґРёС‚Рµ РїР°СЂРѕР»СЊ, Р·Р°РєСЂРѕР№С‚Рµ СЃРїР°Рј-РјРѕРґР°Р»РєРё, РїРµСЂРµСѓСЃС‚Р°РЅРѕРІРёС‚Рµ СЂР°СЃС€РёСЂРµРЅРёРµ РїСЂРё РЅРµРѕР±С…РѕРґРёРјРѕСЃС‚Рё).
4. Р—Р°РєСЂРѕР№С‚Рµ Р±СЂР°СѓР·РµСЂ. РџРѕСЃР»Рµ СЌС‚РѕРіРѕ РјРѕР¶РЅРѕ Р·Р°РїСѓСЃРєР°С‚СЊ Р·Р°РґР°С‡Рё РЅР° СЌС‚РѕРј РїСЂРѕС„РёР»Рµ Р·Р°РЅРѕРІРѕ.

## РљР°Рє РѕР±РЅРѕРІР»СЏС‚СЊ СЂР°СЃС€РёСЂРµРЅРёСЏ РєРѕС€РµР»СЊРєРѕРІ
1. РЎРєР°С‡Р°Р№С‚Рµ РЅРѕРІСѓСЋ РІРµСЂСЃРёСЋ СЂР°СЃС€РёСЂРµРЅРёСЏ (crx С„Р°Р№Р») РёР»Рё РѕР±РЅРѕРІРёС‚Рµ РїР°РїРєСѓ СЃ СЂР°СЃРїР°РєРѕРІР°РЅРЅС‹Рј СЂР°СЃС€РёСЂРµРЅРёРµРј.
2. РџРѕРјРµСЃС‚РёС‚Рµ РЅРѕРІСѓСЋ РІРµСЂСЃРёСЋ СЂР°СЃС€РёСЂРµРЅРёСЏ РІ РїР°РїРєСѓ, РѕС‚РєСѓРґР° Р±РµСЂСѓС‚СЃСЏ base extensions РґР»СЏ РїСЂРѕС„РёР»РµР№.
3. **РћР±СЏР·Р°С‚РµР»СЊРЅРѕ** Р»РѕРєР°Р»СЊРЅРѕ РїСЂРѕРіРѕРЅРёС‚Рµ С‚РµСЃС‚С‹ (`npm run test:wallet`) СЃ РЅРѕРІРѕР№ РІРµСЂСЃРёРµР№, С‡С‚РѕР±С‹ СѓР±РµРґРёС‚СЊСЃСЏ, С‡С‚Рѕ СЃРµР»РµРєС‚РѕСЂС‹ РёР· `docs/selector-adaptation-guide.md` РІСЃРµ РµС‰Рµ СЂР°Р±РѕС‚Р°СЋС‚.
4. Р•СЃР»Рё СЃРµР»РµРєС‚РѕСЂС‹ РїРѕРјРµРЅСЏР»РёСЃСЊ, РѕР±РЅРѕРІРёС‚Рµ РєРѕРЅС‚СЂРѕР»Р»РµСЂС‹ РєРѕС€РµР»СЊРєРѕРІ (РЅР°РїСЂРёРјРµСЂ, `MetaMaskController`).
5. Р—Р°РґРµРїР»РѕР№С‚Рµ Р°РїРґРµР№С‚. РќРѕРІС‹Рµ РёР»Рё РїРµСЂРµСЃРѕР±СЂР°РЅРЅС‹Рµ РїСЂРѕС„РёР»Рё Р±СѓРґСѓС‚ РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РЅРѕРІСѓСЋ РІРµСЂСЃРёСЋ.

## РљР°Рє Р±РµР·РѕРїР°СЃРЅРѕ СЂРѕС‚РёСЂРѕРІР°С‚СЊ СЃРµРєСЂРµС‚С‹
РЎРµРєСЂРµС‚С‹ (РїР°СЂРѕР»Рё РѕС‚ РєРѕС€РµР»СЊРєРѕРІ) С…СЂР°РЅСЏС‚СЃСЏ РІ Р·Р°С€РёС„СЂРѕРІР°РЅРЅРѕРј РІРёРґРµ.
1. РЎРіРµРЅРµСЂРёСЂСѓР№С‚Рµ РЅРѕРІС‹Р№ РјР°СЃС‚РµСЂ-РєР»СЋС‡: `SecretService.generateKey()`.
2. РќР°РїРёС€РёС‚Рµ РјРёРіСЂР°С†РёРѕРЅРЅС‹Р№ СЃРєСЂРёРїС‚, РєРѕС‚РѕСЂС‹Р№:
   - РЎРѕР·РґР°РµС‚ СЌРєР·РµРјРїР»СЏСЂ `SecretService` СЃРѕ СЃС‚Р°СЂС‹Рј РєР»СЋС‡РѕРј (РґР»СЏ СЂР°СЃС€РёС„СЂРѕРІРєРё).
   - РЎРѕР·РґР°РµС‚ СЌРєР·РµРјРїР»СЏСЂ `SecretService` СЃ РЅРѕРІС‹Рј РєР»СЋС‡РѕРј.
   - Р§РёС‚Р°РµС‚ РІСЃРµ РїР°СЂРѕР»Рё РёР· Р‘Р”/РѕРєСЂСѓР¶РµРЅРёСЏ, СЂР°СЃС€РёС„СЂРѕРІС‹РІР°РµС‚ СЃС‚Р°СЂС‹Рј, С€РёС„СЂСѓРµС‚ РЅРѕРІС‹Рј РєР»СЋС‡РѕРј Рё СЃРѕС…СЂР°РЅСЏРµС‚ РѕР±СЂР°С‚РЅРѕ.
3. РћР±РЅРѕРІРёС‚Рµ РјР°СЃС‚РµСЂ-РєР»СЋС‡ РІ РїРµСЂРµРјРµРЅРЅС‹С… РѕРєСЂСѓР¶РµРЅРёСЏ (`.env` РёР»Рё СЃРµРєСЂРµС‚-РјРµРЅРµРґР¶РµСЂ).
4. РџРµСЂРµР·Р°РїСѓСЃС‚РёС‚Рµ РїСЂРёР»РѕР¶РµРЅРёРµ.

## РљР°Рє РѕС‚РєР°С‚С‹РІР°С‚СЊ РЅРµСѓРґР°С‡РЅС‹Рµ РёР·РјРµРЅРµРЅРёСЏ
1. **РљРѕРґ**: Р’С‹РїРѕР»РЅРёС‚Рµ git revert РєРѕРјРјРёС‚Р° Рё СЃРґРµР»Р°Р№С‚Рµ redeploy.
2. **РЎРµР»РµРєС‚РѕСЂС‹**: Р•СЃР»Рё РЅРѕРІС‹Рµ СЃРµР»РµРєС‚РѕСЂС‹ РЅРµ СЂР°Р±РѕС‚Р°СЋС‚ РЅР° production СЂР°СЃС€РёСЂРµРЅРёСЏС…, РѕС‚РєР°С‚РёС‚Рµ С„Р°Р№Р» РєРѕРЅС‚СЂРѕР»Р»РµСЂР° РєРѕС€РµР»СЊРєР° Рє РїСЂРµРґС‹РґСѓС‰РµР№ РІРµСЂСЃРёРё:
   ```bash
   git checkout HEAD~1 src/core/wallet/metamask/MetaMaskController.ts
   ```
3. **Р‘Р°Р·Р° РґР°РЅРЅС‹С…/РјРёРіСЂР°С†РёРё**: РР·Р±РµРіР°Р№С‚Рµ РґРµСЃС‚СЂСѓРєС‚РёРІРЅС‹С… РјРёРіСЂР°С†РёР№. Р•СЃР»Рё СЃС‚СЂСѓРєС‚СѓСЂР° RunStore РїРѕРјРµРЅСЏР»Р°СЃСЊ РЅРµСѓРґР°С‡РЅРѕ, РІРѕСЃСЃС‚Р°РЅРѕРІРёС‚Рµ РґР°РјРї Р‘Р” (РµСЃР»Рё РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ) РёР»Рё РѕС‡РёСЃС‚РёС‚Рµ Р·Р°РІРёСЃС€РёРµ Р·Р°РґР°С‡Рё С‡РµСЂРµР· Р‘Р”.
4. **РџСЂРѕС„РёР»Рё**: Р•СЃР»Рё СЂРµР»РёР· "РїРѕРІСЂРµРґРёР»" РїСЂРѕС„РёР»Рё Р±СЂР°СѓР·РµСЂР° (РЅР°РїСЂРёРјРµСЂ, СЃРєСЂРёРїС‚ РЅР°Р¶Р°Р» РЅРµ С‚Сѓ РєРЅРѕРїРєСѓ РІ РєРѕС€РµР»СЊРєРµ Рё СЃР±СЂРѕСЃРёР» РЅР°СЃС‚СЂРѕР№РєРё), РїРѕС‚СЂРµР±СѓРµС‚СЃСЏ СЂСѓС‡РЅРѕРµ РІРјРµС€Р°С‚РµР»СЊСЃС‚РІРѕ РёР»Рё РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёРµ РёС… РёР· Р±СЌРєР°РїР° (РµСЃР»Рё РґРёСЂРµРєС‚РѕСЂРёРё РїСЂРѕС„РёР»РµР№ Р±СЌРєР°РїРёСЂСѓСЋС‚СЃСЏ).
````

## File: docs/selector-adaptation-guide.md
````markdown
# Selector Adaptation Guide

Р­С‚РѕС‚ РґРѕРєСѓРјРµРЅС‚ РѕРїРёСЃС‹РІР°РµС‚ Р»СѓС‡С€РёРµ РїСЂР°РєС‚РёРєРё Рё РїРѕРґС…РѕРґС‹ Рє СЂР°Р±РѕС‚Рµ СЃ СЃРµР»РµРєС‚РѕСЂР°РјРё РґР»СЏ СЂР°Р·Р»РёС‡РЅС‹С… web3 РєРѕС€РµР»СЊРєРѕРІ, РјРµС‚РѕРґС‹ РёС… РѕС‚Р»Р°РґРєРё Рё РѕР±РЅРѕРІР»РµРЅРёСЏ.

## РљР°Рє Р°РґР°РїС‚РёСЂРѕРІР°С‚СЊ СЃРµР»РµРєС‚РѕСЂС‹ РїРѕРґ СЂР°Р·РЅС‹Рµ РІРµСЂСЃРёРё MetaMask
MetaMask С‡Р°СЃС‚Рѕ РѕР±РЅРѕРІР»СЏРµС‚ DOM, С‡С‚Рѕ РјРѕР¶РµС‚ РїСЂРёРІРѕРґРёС‚СЊ Рє РїРѕР»РѕРјРєР°Рј Р¶РµСЃС‚РєРёС… (xpath/СЃС‚СЂСѓРєС‚СѓСЂРЅС‹С…) СЃРµР»РµРєС‚РѕСЂРѕРІ.
1. **РСЃРїРѕР»СЊР·СѓР№С‚Рµ `data-testid`**: Р•СЃР»Рё СЂР°Р·СЂР°Р±РѕС‚С‡РёРєРё MetaMask РґРѕР±Р°РІР»СЏСЋС‚ С‚РµСЃС‚РѕРІС‹Рµ Р°С‚СЂРёР±СѓС‚С‹ (`data-testid`), РІСЃРµРіРґР° РёСЃРїРѕР»СЊР·СѓР№С‚Рµ РёС… (`[data-testid="page-container-footer-next"]`).
2. **РўРµРєСЃС‚РѕРІС‹Рµ СЃРµР»РµРєС‚РѕСЂС‹ РєР°Рє fallback**: РСЃРїРѕР»СЊР·СѓР№С‚Рµ РїРѕРёСЃРє РїРѕ С‚РµРєСЃС‚Сѓ (`hasText: "Next"`, `text="Confirm"`) РѕСЃС‚РѕСЂРѕР¶РЅРѕ, РѕР±СЂР°С‰Р°Р№С‚Рµ РІРЅРёРјР°РЅРёРµ РЅР° Р»РѕРєР°Р»РёР·Р°С†РёСЋ. Р•СЃР»Рё РєРѕС€РµР»РµРє РѕС‚РєСЂС‹РІР°РµС‚СЃСЏ РЅР° РґСЂСѓРіРѕРј СЏР·С‹РєРµ, С‚РµРєСЃС‚РѕРІС‹Р№ СЃРµР»РµРєС‚РѕСЂ СѓРїР°РґРµС‚.
3. **РР·Р±РµРіР°Р№С‚Рµ Р¶РµСЃС‚РєРёС… СЃС‚СЂСѓРєС‚СѓСЂРЅС‹С… РїСЂРёРІСЏР·РѕРє**: РСЃРєР»СЋС‡РёС‚Рµ СЃРµР»РµРєС‚РѕСЂС‹ РІСЂРѕРґРµ `div > div > span:nth-child(2)`. РС‰РёС‚Рµ СЌР»РµРјРµРЅС‚ РїРѕ СЂРѕР»Рё, РЅР°РїСЂРёРјРµСЂ: `button:has-text("Connect")`.
4. **РЈС‡РёС‚С‹РІР°Р№С‚Рµ Рђ/Р’ С‚РµСЃС‚С‹**: РЎСѓС‰РµСЃС‚РІСѓСЋС‚ РІРµСЂСЃРёРё, РіРґРµ СЌРєСЂР°РЅ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ РјРѕР¶РµС‚ Р±С‹С‚СЊ СЂР°Р·РґРµР»РµРЅ РЅР° РґРІР° С€Р°РіР°. РћР¶РёРґР°Р№С‚Рµ РѕР±Р° РІР°СЂРёР°РЅС‚Р° С‡РµСЂРµР· `Promise.race` РёР»Рё РјРµС‚РѕРґ `.or()` РІ Playwright.

## РљР°Рє Р°РґР°РїС‚РёСЂРѕРІР°С‚СЊ СЃРµР»РµРєС‚РѕСЂС‹ РїРѕРґ СЂР°Р·РЅС‹Рµ РІРµСЂСЃРёРё Rabby
Rabby Wallet РёРјРµРµС‚ СЃР»РѕР¶РЅС‹Р№ UI СЃ Р±РѕР»СЊС€РёРј РєРѕР»РёС‡РµСЃС‚РІРѕРј РІСЃРїР»С‹РІР°СЋС‰РёС… РѕРєРѕРЅ Рё РјРѕРґР°Р»РѕРє РІРЅСѓС‚СЂРё СЃР°РјРѕРіРѕ СЂР°СЃС€РёСЂРµРЅРёСЏ.
1. **РўРµРЅРё Рё Shadow DOM**: РЈР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ СЃРµР»РµРєС‚РѕСЂС‹ СЃРїРѕСЃРѕР±РЅС‹ РїСЂРѕРЅРёРєР°С‚СЊ РІ РІРѕР·РјРѕР¶РЅС‹Рµ web-components, РµСЃР»Рё Rabby РЅР°С‡РЅРµС‚ РёС… РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ.
2. **Р Р°Р±РѕС‚Р° СЃ С„РѕРєСѓСЃРѕРј**: Rabby С‡Р°СЃС‚Рѕ С‚СЂРµР±СѓРµС‚ СЏРІРЅРѕРіРѕ СЃР±СЂРѕСЃР° С„РѕРєСѓСЃР° РёР»Рё РєР»РёРєР° РІ СЂР°Р±РѕС‡СѓСЋ РѕР±Р»Р°СЃС‚СЊ РїРµСЂРµРґ РІРІРѕРґРѕРј РїР°СЂРѕР»СЏ.
3. **Button variants**: Rabby РёСЃРїРѕР»СЊР·СѓРµС‚ РјРЅРѕРіРѕ СЃС‚РёР»РёР·РѕРІР°РЅРЅС‹С… РєРЅРѕРїРѕРє. Р›СѓС‡С€Рµ РІСЃРµРіРѕ РїСЂРёРІСЏР·С‹РІР°С‚СЊСЃСЏ Рє СѓРЅРёРєР°Р»СЊРЅС‹Рј РёРєРѕРЅРєР°Рј РёР»Рё РєР»Р°СЃСЃР°Рј, РЅРµРїРѕСЃСЂРµРґСЃС‚РІРµРЅРЅРѕ РѕС‚РІРµС‡Р°СЋС‰РёРј Р·Р° Р»РѕРіРёРєСѓ (РЅР°РїСЂРёРјРµСЂ, `button.rabby-btn-primary`).
4. **Р’СЃРїР»С‹РІР°СЋС‰РёРµ РїСЂРµРґСѓРїСЂРµР¶РґРµРЅРёСЏ**: Rabby Р»СЋР±РёС‚ РїРѕРєР°Р·С‹РІР°С‚СЊ СЃРµРєСЊСЋСЂРёС‚Рё-РїСЂРµРґСѓРїСЂРµР¶РґРµРЅРёСЏ. Р’Р°С€ СЃРєСЂРёРїС‚ РґРѕР»Р¶РµРЅ РїСЂРѕРІРµСЂСЏС‚СЊ РЅР°Р»РёС‡РёРµ РєРЅРѕРїРєРё "Ignore" РёР»Рё "Proceed anyway" РїРµСЂРµРґ С‚РµРј, РєР°Рє РЅР°Р¶Р°С‚СЊ РѕСЃРЅРѕРІРЅСѓСЋ РєРЅРѕРїРєСѓ "Confirm".

## РљР°Рє РґРµР±Р°Р¶РёС‚СЊ popup pages
РћС‚Р»Р°РґРєР° СЃС‚СЂР°РЅРёС† СЂР°СЃС€РёСЂРµРЅРёР№ (popup) РѕС‚Р»РёС‡Р°РµС‚СЃСЏ РѕС‚ РѕР±С‹С‡РЅС‹С… РІРµР±-СЃС‚СЂР°РЅРёС†.
1. **РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ Playwright Inspector**: Р—Р°РїСѓСЃРєР°Р№С‚Рµ РІС‹РїРѕР»РЅРµРЅРёРµ СЃ `PWDEBUG=1`.
2. **РџРѕР»СѓС‡РµРЅРёРµ URL СЂР°СЃС€РёСЂРµРЅРёСЏ**: Р’ Playwright РІС‹ РјРѕР¶РµС‚Рµ РЅР°Р№С‚Рё background page РёР»Рё service worker СЂР°СЃС€РёСЂРµРЅРёСЏ Рё РїРµСЂРµР№С‚Рё РЅР° РµРіРѕ URL (РЅР°РїСЂРёРјРµСЂ, `chrome-extension://<id>/popup.html`). Р­С‚Рѕ РїРѕР·РІРѕР»РёС‚ РѕС‚РєСЂС‹С‚СЊ popup РєР°Рє РѕР±С‹С‡РЅСѓСЋ РІРєР»Р°РґРєСѓ РЅР° РІРµСЃСЊ СЌРєСЂР°РЅ, С‡С‚Рѕ СѓРїСЂРѕС‰Р°РµС‚ РёРЅСЃРїРµРєС‚РёСЂРѕРІР°РЅРёРµ С‡РµСЂРµР· DevTools.
3. **РџР°СѓР·С‹ РІ РєРѕРґРµ**: Р’СЃС‚Р°РІР»СЏР№С‚Рµ `await page.pause()` РїСЂСЏРјРѕ РїРµСЂРµРґ РјРѕРјРµРЅС‚РѕРј, РіРґРµ СЃРµР»РµРєС‚РѕСЂ РїР°РґР°РµС‚, С‡С‚РѕР±С‹ РёСЃСЃР»РµРґРѕРІР°С‚СЊ DOM РІСЂСѓС‡РЅСѓСЋ.
4. **РЎРєСЂРёРЅС€РѕС‚С‹ Рё HTML-РґР°РјРїС‹**: РќР°СЃС‚СЂРѕР№С‚Рµ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёР№ РґР°РјРї DOM Рё СЃРєСЂРёРЅС€РѕС‚, РµСЃР»Рё СЌР»РµРјРµРЅС‚ РЅРµ РЅР°Р№РґРµРЅ Р·Р° РѕС‚РІРµРґРµРЅРЅС‹Р№ С‚Р°Р№РјР°СѓС‚.

## РљР°Рє Р»РѕРіРёСЂРѕРІР°С‚СЊ unknown wallet states
РљРѕРіРґР° РєРѕС€РµР»РµРє РїРµСЂРµС…РѕРґРёС‚ РІ СЃРѕСЃС‚РѕСЏРЅРёРµ, РЅРµ РѕРїРёСЃР°РЅРЅРѕРµ РІ РІР°С€РёС… СЃС†РµРЅР°СЂРёСЏС… (РЅР°РїСЂРёРјРµСЂ, РЅРѕРІС‹Р№ СЌРєСЂР°РЅ РѕРЅР±РѕСЂРґРёРЅРіР° РёР»Рё РєСЂРёС‚РёС‡РµСЃРєР°СЏ РѕС€РёР±РєР° РЅРѕРґС‹):
1. Р’С‹Р±СЂР°СЃС‹РІР°Р№С‚Рµ `NeedsReviewError` СЃ РєРѕРґРѕРј `wallet_unknown_state`.
2. РћР±СЏР·Р°С‚РµР»СЊРЅРѕ СЃРѕС…СЂР°РЅСЏР№С‚Рµ СЃРєСЂРёРЅС€РѕС‚ Рё РґР°РјРї HTML РґРµСЂРµРІР° СЃС‚СЂР°РЅРёС†С‹ РїРµСЂРµРґ Р·Р°РєСЂС‹С‚РёРµРј Р±СЂР°СѓР·РµСЂР°. РђСЂС‚РµС„Р°РєС‚С‹ РґРѕР»Р¶РЅС‹ Р±С‹С‚СЊ РїСЂРёРІСЏР·Р°РЅС‹ Рє `runId`.
3. Р’ Р»РѕРіР°С… С„РёРєСЃРёСЂСѓР№С‚Рµ URL СЃС‚СЂР°РЅРёС†С‹ РєРѕС€РµР»СЊРєР° Рё С‚РµРєСЃС‚С‹ РЅРµСЃРєРѕР»СЊРєРёС… РєР»СЋС‡РµРІС‹С… СЌР»РµРјРµРЅС‚РѕРІ РЅР° СЌРєСЂР°РЅРµ, С‡С‚РѕР±С‹ РїРѕРЅСЏС‚СЊ РєРѕРЅС‚РµРєСЃС‚ РїРѕ Р»РѕРіР°Рј Р±РµР· РїСЂРѕРІРµСЂРєРё СЃРєСЂРёРЅС€РѕС‚РѕРІ.

## РљР°Рє Р±РµР·РѕРїР°СЃРЅРѕ РѕР±РЅРѕРІР»СЏС‚СЊ detector rules
1. **РќРµ СѓРґР°Р»СЏР№С‚Рµ СЃС‚Р°СЂС‹Рµ СЃРµР»РµРєС‚РѕСЂС‹ СЃСЂР°Р·Сѓ**: Р”РѕР±Р°РІР»СЏР№С‚Рµ РЅРѕРІС‹Рµ СЃРµР»РµРєС‚РѕСЂС‹ РєР°Рє РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕРµ СѓСЃР»РѕРІРёРµ. Р•СЃР»Рё СЃС‚СЂСѓРєС‚СѓСЂР° РёР·РјРµРЅРёР»Р°СЃСЊ, СЃС‚Р°СЂС‹Р№ СЃРµР»РµРєС‚РѕСЂ РїСЂРѕСЃС‚Рѕ РЅРµ СЃСЂР°Р±РѕС‚Р°РµС‚ СЃРѕ РІСЂРµРјРµРЅРµРј, Р° РЅРѕРІС‹Р№ РїРѕРґС…РІР°С‚РёС‚ СЂР°Р±РѕС‚Сѓ.
2. **РћС†РµРЅРєР° Confidence Score**: Р’ `WalletDetector` РёСЃРїРѕР»СЊР·СѓР№С‚Рµ РЅРµСЃРєРѕР»СЊРєРѕ РїСЂРёР·РЅР°РєРѕРІ РґР»СЏ СѓРІРµСЂРµРЅРЅРѕСЃС‚Рё. РќР°РїСЂРёРјРµСЂ, РЅР°Р»РёС‡РёРµ РіР»РѕР±Р°Р»СЊРЅРѕРіРѕ РѕР±СЉРµРєС‚Р° `window.ethereum` РґР°РµС‚ 0.5 Рє СѓРІРµСЂРµРЅРЅРѕСЃС‚Рё, Р° РЅР°Р»РёС‡РёРµ СЃРїРµС†РёС„РёС‡РЅРѕРіРѕ DOM СЌР»РµРјРµРЅС‚Р° РІРЅСѓС‚СЂРё РїСЂРѕРІР°Р№РґРµСЂР° РёР»Рё URL вЂ“ РµС‰Рµ 0.5.
3. **РР·РѕР»РёСЂРѕРІР°РЅРЅРѕРµ С‚РµСЃС‚РёСЂРѕРІР°РЅРёРµ**: РџРµСЂРµРґ РєРѕРјРјРёС‚РѕРј РїСЂРѕРІРµСЂСЊС‚Рµ РЅРѕРІС‹Рµ РїСЂР°РІРёР»Р° РЅР° СЃРѕС…СЂР°РЅРµРЅРЅС‹С… HTML-РґР°РјРїР°С… РѕС‚ СЃС‚Р°СЂС‹С… РІРµСЂСЃРёР№ (РјРѕРєРёСЂРѕРІР°РЅРёРµ).

## РљР°Рє РїРёСЃР°С‚СЊ fallback rules
Playwright РїСЂРµРґРѕСЃС‚Р°РІР»СЏРµС‚ СѓРґРѕР±РЅС‹Рµ РјРµС…Р°РЅРёР·РјС‹ РґР»СЏ СЃРѕР·РґР°РЅРёСЏ fallback С†РµРїРѕС‡РµРє.
1. РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ РєРѕРјР±РёРЅР°С†РёР№ `locator.or()`:
    ```typescript
    const confirmBtn = page.locator('button[data-testid="confirm-btn"]')
        .or(page.locator('button:has-text("Approve")'))
        .or(page.locator('.primary-button.confirm'));
    await confirmBtn.click();
    ```
2. РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ РјР°СЃСЃРёРІРѕРІ СЃ РєРѕСЂРѕС‚РєРёРј С‚Р°Р№РјР°СѓС‚РѕРј:
    ```typescript
    const selectors = ['#next', '.btn-next', 'button >> text="Next"'];
    for (const sel of selectors) {
      if (await page.locator(sel).isVisible({ timeout: 1000 })) {
         await page.locator(sel).click();
         break;
      }
    }
    ```

## РљР°Рє С‚РµСЃС‚РёСЂРѕРІР°С‚СЊ detector Р»РѕРєР°Р»СЊРЅРѕ
1. РџРѕРґРЅРёРјРёС‚Рµ С‡РёСЃС‚С‹Р№ РїСЂРѕС„РёР»СЊ Р±СЂР°СѓР·РµСЂР° РїСЂРѕРіСЂР°РјРјРЅРѕ (С‡РµСЂРµР· СЃРєСЂРёРїС‚ `scripts/local-test.ts`).
2. РџРѕРјРµСЃС‚РёС‚Рµ РІ РїСЂРѕС„РёР»СЊ РЅСѓР¶РЅС‹Рµ РІРµСЂСЃРёРё СЂР°СЃРїР°РєРѕРІР°РЅРЅС‹С… СЂР°СЃС€РёСЂРµРЅРёР№.
3. РќР°РїРёС€РёС‚Рµ РїСЂРѕСЃС‚РѕР№ CLI РёРЅС‚РµСЂС„РµР№СЃ, РєРѕС‚РѕСЂС‹Р№ Р±СѓРґРµС‚ РІС‹Р·С‹РІР°С‚СЊ РјРµС‚РѕРґС‹ РґРµС‚РµРєС‚РёСЂРѕРІР°РЅРёСЏ (`WalletManager.detect()`) Рё РїС‹С‚Р°С‚СЊСЃСЏ СЂР°Р·Р±Р»РѕРєРёСЂРѕРІР°С‚СЊ РєРѕС€РµР»РµРє, РїРµСЂРµРґР°РІ С‚РµСЃС‚РѕРІС‹Р№ РїР°СЂРѕР»СЊ.
4. РќР°СЃС‚СЂРѕР№С‚Рµ Р»РѕРєР°Р»СЊРЅС‹Р№ СЃРµСЂРІРµСЂ, РІРѕР·РІСЂР°С‰Р°СЋС‰РёР№ С„РёРєС‚РёРІРЅС‹Рµ dapp СЃС‚СЂР°РЅРёС†С‹, С‡С‚РѕР±С‹ СЃРєСЂРёРїС‚ РІС‹Р·С‹РІР°Р» РїРѕСЏРІР»РµРЅРёРµ popup, Рё РїСЂРѕРіРѕРЅРёС‚Рµ workflow РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ С‚СЂР°РЅР·Р°РєС†РёРё.
````

## File: scripts/seed.ts
````typescript
type SeedNetwork = {
  id: string;
  name: string;
  rpcUrl: string;
  chainId: number;
};

type SeedProfile = {
  id: string;
  label: string;
  userDataDir: string;
  proxyUrl?: string;
};

const networks: SeedNetwork[] = [
  { id: "sepolia", name: "Sepolia", rpcUrl: "https://rpc.sepolia.example", chainId: 11155111 },
  { id: "holesky", name: "Holesky", rpcUrl: "https://rpc.holesky.example", chainId: 17000 }
];

const profiles: SeedProfile[] = [
  { id: "profile-1", label: "Profile 1", userDataDir: "/tmp/pw-auto/profile-1" },
  { id: "profile-2", label: "Profile 2", userDataDir: "/tmp/pw-auto/profile-2" }
];

const now = new Date().toISOString();

const sql = [
  "BEGIN TRANSACTION;",
  ...networks.map(
    (network) =>
      `INSERT INTO networks (id, name, rpc_url, chain_id, is_active, created_at, updated_at) VALUES ('${network.id}', '${network.name}', '${network.rpcUrl}', ${network.chainId}, 1, '${now}', '${now}');`
  ),
  ...profiles.map(
    (profile) =>
      `INSERT INTO browser_profiles (id, label, user_data_dir, proxy_url, created_at, updated_at) VALUES ('${profile.id}', '${profile.label}', '${profile.userDataDir}', ${profile.proxyUrl ? `'${profile.proxyUrl}'` : "NULL"}, '${now}', '${now}');`
  ),
  "COMMIT;"
];

for (const line of sql) {
  console.log(line);
}
````

## File: src/api/services/ArtifactsService.ts
````typescript
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { DEFAULT_ARTIFACTS_DIR } from "../../shared/constants.ts";

type ArtifactsServiceOptions = {
    baseDir?: string;
};

export class ArtifactsService {
    private readonly baseDir: string;

    constructor(options: ArtifactsServiceOptions = {}) {
        this.baseDir = options.baseDir ?? path.join(os.homedir(), DEFAULT_ARTIFACTS_DIR);
    }

    async getArtifactStream(runId: string, filename: string): Promise<string | null> {
        const filePath = path.join(this.baseDir, runId, filename);
        const normalized = path.normalize(filePath);

        // Prevent directory traversal attacks
        if (!normalized.startsWith(path.resolve(this.baseDir))) {
            return null;
        }

        try {
            const stat = await fs.stat(normalized);
            if (!stat.isFile()) {
                return null;
            }
            return normalized;
        } catch {
            return null;
        }
    }

    getMimeType(filename: string): string {
        const ext = path.extname(filename).toLowerCase();
        switch (ext) {
            case ".png": return "image/png";
            case ".html": return "text/html";
            case ".zip": return "application/zip";
            case ".json": return "application/json";
            case ".txt": return "text/plain";
            default: return "application/octet-stream";
        }
    }
}
````

## File: src/api/services/RunService.ts
````typescript
import crypto from "node:crypto";
import { DEFAULT_RUN_MAX_ATTEMPTS } from "../../shared/constants.ts";
import type { RunRecord, RunStatus } from "../../shared/types.ts";
import type { RunRepository } from "../../data/repositories/RunRepository.ts";

type CreateRunInput = {
  scenarioId: string;
  networkId: string;
  profileId: string;
  maxAttempts?: number;
};

export class RunService {
  private readonly store: RunRepository;

  constructor(store: RunRepository) {
    this.store = store;
  }

  async createRun(input: CreateRunInput): Promise<RunRecord> {
    const now = new Date().toISOString();
    const run: RunRecord = {
      id: crypto.randomUUID(),
      scenarioId: input.scenarioId,
      networkId: input.networkId,
      profileId: input.profileId,
      status: "queued",
      attempt: 0,
      maxAttempts: input.maxAttempts ?? DEFAULT_RUN_MAX_ATTEMPTS,
      createdAt: now,
      updatedAt: now
    };
    await this.store.createRun(run);
    return run;
  }

  async listRuns(status?: RunStatus, limit?: number): Promise<RunRecord[]> {
    return this.store.listRuns({ status, limit });
  }

  async getRun(id: string): Promise<RunRecord | null> {
    return this.store.getRun(id);
  }

  async cancelRun(id: string): Promise<RunRecord | null> {
    const run = await this.store.getRun(id);
    if (!run) {
      return null;
    }
    if (run.status === "completed" || run.status === "failed" || run.status === "cancelled") {
      return run;
    }
    await this.store.markCancelled(id, "CancelledByUser");
    return this.store.getRun(id);
  }
}
````

## File: src/api/dto.ts
````typescript
import type { RunRecord, RunStatus } from "../shared/types.ts";

export type CreateRunRequest = {
  scenarioId: string;
  networkId: string;
  profileId: string;
  maxAttempts?: number;
};

export type ListRunsQuery = {
  status?: RunStatus;
  limit?: number;
};

export type RunResponse = {
  run: RunRecord;
};

export type RunsResponse = {
  runs: RunRecord[];
};

export type CancelRunResponse = {
  run: RunRecord;
};

export const parseCreateRunRequest = (input: unknown): CreateRunRequest => {
  const body = ensureObject(input);
  return {
    scenarioId: requireString(body, "scenarioId"),
    networkId: requireString(body, "networkId"),
    profileId: requireString(body, "profileId"),
    maxAttempts: optionalNumber(body, "maxAttempts")
  };
};

export const parseListRunsQuery = (input: Record<string, string> | undefined): ListRunsQuery => {
  if (!input) {
    return {};
  }
  const limit = input.limit ? Number(input.limit) : undefined;
  if (limit !== undefined && Number.isNaN(limit)) {
    throw new Error("InvalidQuery: limit");
  }
  const status = input.status as RunStatus | undefined;
  if (status && !["queued", "running", "completed", "failed", "cancelled", "needs_review"].includes(status)) {
    throw new Error("InvalidQuery: status");
  }
  return {
    limit,
    status
  };
};

const ensureObject = (input: unknown): Record<string, unknown> => {
  if (!input || typeof input !== "object") {
    throw new Error("InvalidBody");
  }
  return input as Record<string, unknown>;
};

const requireString = (input: Record<string, unknown>, key: string): string => {
  const value = input[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`InvalidBody: ${key}`);
  }
  return value;
};

const optionalNumber = (input: Record<string, unknown>, key: string): number | undefined => {
  const value = input[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`InvalidBody: ${key}`);
  }
  return value;
};
````

## File: src/api/examples.ts
````typescript
import type { RunRecord } from "../shared/types.ts";

export const createRunRequestExample = {
  scenarioId: "connect-wallet",
  networkId: "sepolia",
  profileId: "profile-1",
  maxAttempts: 3
};

export const createRunResponseExample = {
  run: {
    id: "run-1",
    scenarioId: "connect-wallet",
    networkId: "sepolia",
    profileId: "profile-1",
    status: "queued",
    attempt: 0,
    maxAttempts: 3,
    createdAt: "2026-03-05T10:00:00.000Z",
    updatedAt: "2026-03-05T10:00:00.000Z"
  } satisfies RunRecord
};

export const listRunsResponseExample = {
  runs: [createRunResponseExample.run]
};

export const cancelRunResponseExample = {
  run: {
    ...createRunResponseExample.run,
    status: "cancelled"
  }
};
````

## File: src/api/Router.ts
````typescript
import type { ApiContext, ApiHandler, ApiRequest, ApiResponse, RouteDefinition } from "./types.ts";

type MatchResult = {
  handler: ApiHandler;
  params: Record<string, string>;
};

export class Router {
  private readonly routes: RouteDefinition[];

  constructor(routes: RouteDefinition[]) {
    this.routes = routes;
  }

  async handle(request: ApiRequest, context: ApiContext): Promise<ApiResponse> {
    const match = this.match(request.method, request.path);
    if (!match) {
      return { status: 404, body: { error: "NotFound" } };
    }
    return match.handler(
      {
        ...request,
        params: match.params
      },
      context
    );
  }

  private match(method: string, path: string): MatchResult | null {
    for (const route of this.routes) {
      if (route.method !== method) {
        continue;
      }
      const params = matchPath(route.path, path);
      if (params) {
        return { handler: route.handler, params };
      }
    }
    return null;
  }
}

const matchPath = (pattern: string, path: string): Record<string, string> | null => {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) {
    return null;
  }
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];
    if (patternPart.startsWith(":")) {
      params[patternPart.slice(1)] = pathPart;
    } else if (patternPart !== pathPart) {
      return null;
    }
  }
  return params;
};
````

## File: src/api/routes.ts
````typescript
import { parseCreateRunRequest, parseListRunsQuery } from "./dto.ts";
import type { ApiResponse, RouteDefinition } from "./types.ts";

export const routes: RouteDefinition[] = [
  {
    method: "GET",
    path: "/runs",
    handler: async (request, context): Promise<ApiResponse> => {
      const query = parseListRunsQuery(request.query);
      const runs = await context.services.runService.listRuns(query.status, query.limit);
      return { status: 200, body: { runs } };
    }
  },
  {
    method: "GET",
    path: "/runs/:id",
    handler: async (request, context): Promise<ApiResponse> => {
      const run = await context.services.runService.getRun(request.params?.id ?? "");
      if (!run) {
        return { status: 404, body: { error: "RunNotFound" } };
      }
      return { status: 200, body: { run } };
    }
  },
  {
    method: "POST",
    path: "/runs",
    handler: async (request, context): Promise<ApiResponse> => {
      const body = parseCreateRunRequest(request.body);
      const run = await context.services.runService.createRun(body);
      return { status: 201, body: { run } };
    }
  },
  {
    method: "POST",
    path: "/runs/:id/cancel",
    handler: async (request, context): Promise<ApiResponse> => {
      const run = await context.services.runService.cancelRun(request.params?.id ?? "");
      if (!run) {
        return { status: 404, body: { error: "RunNotFound" } };
      }
      return { status: 200, body: { run } };
    }
  },
  {
    method: "GET",
    path: "/runs/:id/artifacts/:filename",
    handler: async (request, context): Promise<ApiResponse> => {
      const runId = request.params?.id;
      const filename = request.params?.filename;
      if (!runId || !filename) {
        return { status: 400, body: { error: "MissingParameters" } };
      }
      const filePath = await context.services.artifactsService.getArtifactStream(runId, filename);
      if (!filePath) {
        return { status: 404, body: { error: "ArtifactNotFound" } };
      }
      return {
        status: 200,
        body: filePath,
        headers: {
          "Content-Type": context.services.artifactsService.getMimeType(filename),
          "Content-Disposition": `attachment; filename="${filename}"`
        }
      } as any; // Cast needed because our ApiResponse type usually only expects JSON body in this strict subset, though real apps need headers.
    }
  }
];
````

## File: src/api/types.ts
````typescript
import type { Logger } from "../shared/types.ts";
import { RunService } from "./services/RunService.ts";
import { ArtifactsService } from "./services/ArtifactsService.ts";

export type ApiMethod = "GET" | "POST";

export type ApiRequest = {
  method: ApiMethod;
  path: string;
  query?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string>;
};

export type ApiResponse<T = unknown> = {
  status: number;
  body: T;
};

export type ApiHandler = (request: ApiRequest, context: ApiContext) => Promise<ApiResponse>;

export type ApiContext = {
  logger: Logger;
  services: {
    runService: RunService;
    artifactsService: ArtifactsService;
  };
};

export type RouteDefinition = {
  method: ApiMethod;
  path: string;
  handler: ApiHandler;
};
````

## File: src/config/env.ts
````typescript
export type AppEnv = {
  port: number;
  baseUrl: string;
  logLevel: string;
  secretKey?: string;
};

export const loadEnv = (env: Record<string, string | undefined>): AppEnv => {
  const port = parseNumber(env.APP_PORT, 3000);
  const baseUrl = env.APP_BASE_URL ?? "http://localhost:3000";
  const logLevel = env.APP_LOG_LEVEL ?? "info";
  const secretKey = env.APP_SECRET_KEY;
  return { port, baseUrl, logLevel, secretKey };
};

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return parsed;
};
````

## File: src/core/browser/BrowserManager.ts
````typescript
import crypto from "node:crypto";
import type { BrowserDriver, BrowserProfile, BrowserSession } from "../../shared/types.ts";
import { ProfileLock } from "./ProfileLock.ts";

type BrowserManagerOptions = {
  driver: BrowserDriver;
  lock: ProfileLock;
  lockHeartbeatMs?: number;
};

export class BrowserManager {
  private readonly driver: BrowserDriver;
  private readonly lock: ProfileLock;
  private readonly sessions: Map<string, BrowserSession>;
  private readonly lockHeartbeatMs?: number;
  private readonly lockHeartbeats: Map<string, ReturnType<typeof setInterval>>;

  constructor(options: BrowserManagerOptions) {
    this.driver = options.driver;
    this.lock = options.lock;
    this.sessions = new Map();
    this.lockHeartbeatMs = options.lockHeartbeatMs;
    this.lockHeartbeats = new Map();
  }

  async open(profile: BrowserProfile): Promise<BrowserSession> {
    if (this.sessions.has(profile.id)) {
      throw new Error(`SessionAlreadyActive: profile ${profile.id}`);
    }

    await this.lock.acquire(profile.id);
    this.startHeartbeat(profile.id);

    try {
      const session = await this.driver.launch(profile, {
        proxyUrl: profile.proxyUrl
      });
      const enriched = {
        ...session,
        id: session.id || crypto.randomUUID(),
        profileId: profile.id
      };
      this.sessions.set(profile.id, enriched);
      return enriched;
    } catch (error) {
      this.stopHeartbeat(profile.id);
      await this.lock.release(profile.id);
      throw error;
    }
  }

  async close(profileId: string): Promise<void> {
    const session = this.sessions.get(profileId);
    if (!session) {
      return;
    }
    await this.driver.close(session);
    this.sessions.delete(profileId);
    this.stopHeartbeat(profileId);
    await this.lock.release(profileId);
  }

  async closeAll(): Promise<void> {
    const entries = Array.from(this.sessions.entries());
    for (const [profileId, session] of entries) {
      await this.driver.close(session);
      this.sessions.delete(profileId);
      this.stopHeartbeat(profileId);
      await this.lock.release(profileId);
    }
  }

  private startHeartbeat(profileId: string) {
    if (!this.lockHeartbeatMs || this.lockHeartbeats.has(profileId)) {
      return;
    }
    const timer = setInterval(() => {
      this.lock.refresh(profileId).catch(() => {});
    }, this.lockHeartbeatMs);
    this.lockHeartbeats.set(profileId, timer);
  }

  private stopHeartbeat(profileId: string) {
    const timer = this.lockHeartbeats.get(profileId);
    if (timer) {
      clearInterval(timer);
      this.lockHeartbeats.delete(profileId);
    }
  }
}
````

## File: src/core/browser/ProfileLock.ts
````typescript
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import {
  DEFAULT_LOCK_DIR,
  DEFAULT_LOCK_RETRY_ATTEMPTS,
  DEFAULT_LOCK_RETRY_DELAY_MS,
  DEFAULT_LOCK_TTL_MS
} from "../../shared/constants.ts";
import type { ProfileId, ProfileLockState } from "../../shared/types.ts";

type ProfileLockOptions = {
  ownerId?: string;
  lockDir?: string;
  ttlMs?: number;
  retryDelayMs?: number;
  retryAttempts?: number;
};

export class ProfileLock {
  private readonly ownerId: string;
  private readonly lockDir: string;
  private readonly ttlMs: number;
  private readonly retryDelayMs: number;
  private readonly retryAttempts: number;
  private readonly lockTokens: Map<ProfileId, string>;

  constructor(options: ProfileLockOptions = {}) {
    this.ownerId = options.ownerId ?? crypto.randomUUID();
    this.lockDir = options.lockDir ?? path.join(os.homedir(), DEFAULT_LOCK_DIR);
    this.ttlMs = options.ttlMs ?? DEFAULT_LOCK_TTL_MS;
    this.retryDelayMs = options.retryDelayMs ?? DEFAULT_LOCK_RETRY_DELAY_MS;
    this.retryAttempts = options.retryAttempts ?? DEFAULT_LOCK_RETRY_ATTEMPTS;
    this.lockTokens = new Map();
  }

  getOwnerId() {
    return this.ownerId;
  }

  async acquire(profileId: ProfileId): Promise<ProfileLockState> {
    await fs.mkdir(this.lockDir, { recursive: true });
    const lockPath = this.getLockPath(profileId);

    for (let attempt = 0; attempt < this.retryAttempts; attempt += 1) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.ttlMs);
      const lockToken = crypto.randomUUID();
      const state: ProfileLockState = {
        profileId,
        ownerId: this.ownerId,
        lockToken,
        host: os.hostname(),
        pid: process.pid,
        acquiredAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        updatedAt: now.toISOString()
      };

      try {
        const handle = await fs.open(lockPath, "wx");
        await handle.writeFile(JSON.stringify(state));
        await handle.close();
        this.lockTokens.set(profileId, lockToken);
        return state;
      } catch (error) {
        const resolved = await this.tryResolveStaleLock(lockPath);
        if (resolved) {
          continue;
        }
      }

      await this.delay(this.retryDelayMs);
    }

    throw new Error(`LockBusy: profile ${profileId}`);
  }

  async release(profileId: ProfileId): Promise<void> {
    const lockPath = this.getLockPath(profileId);
    const state = await this.readLock(lockPath);
    if (!state) {
      this.lockTokens.delete(profileId);
      return;
    }
    if (state.ownerId !== this.ownerId || state.lockToken !== this.lockTokens.get(profileId)) {
      throw new Error(`LockOwnerMismatch: profile ${profileId}`);
    }
    await fs.unlink(lockPath);
    this.lockTokens.delete(profileId);
  }

  async refresh(profileId: ProfileId): Promise<ProfileLockState> {
    const lockPath = this.getLockPath(profileId);
    const state = await this.readLock(lockPath);
    if (!state) {
      throw new Error(`LockMissing: profile ${profileId}`);
    }
    const token = this.lockTokens.get(profileId);
    if (state.ownerId !== this.ownerId || state.lockToken !== token) {
      throw new Error(`LockOwnerMismatch: profile ${profileId}`);
    }
    const now = new Date();
    const refreshed: ProfileLockState = {
      ...state,
      expiresAt: new Date(now.getTime() + this.ttlMs).toISOString(),
      updatedAt: now.toISOString()
    };
    await fs.writeFile(lockPath, JSON.stringify(refreshed));
    return refreshed;
  }

  async read(profileId: ProfileId): Promise<ProfileLockState | null> {
    return this.readLock(this.getLockPath(profileId));
  }

  private getLockPath(profileId: ProfileId) {
    return path.join(this.lockDir, `${profileId}.lock.json`);
  }

  private async readLock(lockPath: string): Promise<ProfileLockState | null> {
    try {
      const content = await fs.readFile(lockPath, "utf-8");
      return JSON.parse(content) as ProfileLockState;
    } catch (error) {
      return null;
    }
  }

  private async tryResolveStaleLock(lockPath: string): Promise<boolean> {
    const state = await this.readLock(lockPath);
    if (!state) {
      return false;
    }
    const expiresAt = new Date(state.expiresAt).getTime();
    if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
      await fs.unlink(lockPath).catch(() => {});
      return true;
    }
    // Check if the holding process is still alive locally
    if (state.host === os.hostname() && state.pid) {
      try {
        process.kill(state.pid, 0);
      } catch (e: any) {
        if (e.code === "ESRCH") {
          // Process does not exist, lock is stale
          await fs.unlink(lockPath).catch(() => {});
          return true;
        }
      }
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
````

## File: src/core/queue/InMemoryQueue.ts
````typescript
import crypto from "node:crypto";
import { DEFAULT_QUEUE_POLL_INTERVAL_MS, QUEUE_LOG_EVENTS } from "../../shared/constants.ts";
import type { Logger, Queue, QueueDequeueOptions, QueueEnqueueOptions, QueueItem } from "../../shared/types.ts";

type InMemoryQueueOptions = {
  logger: Logger;
  pollIntervalMs?: number;
};

export class InMemoryQueue<T> implements Queue<T> {
  private readonly logger: Logger;
  private readonly pollIntervalMs: number;
  private readonly items: QueueItem<T>[];

  constructor(options: InMemoryQueueOptions) {
    this.logger = options.logger;
    this.pollIntervalMs = options.pollIntervalMs ?? DEFAULT_QUEUE_POLL_INTERVAL_MS;
    this.items = [];
  }

  async enqueue(payload: T, options: QueueEnqueueOptions = {}): Promise<QueueItem<T>> {
    const now = Date.now();
    const availableAt = new Date(now + (options.delayMs ?? 0)).toISOString();
    const item: QueueItem<T> = {
      id: crypto.randomUUID(),
      payload,
      enqueuedAt: new Date(now).toISOString(),
      availableAt
    };
    this.items.push(item);
    this.logger.info(QUEUE_LOG_EVENTS.enqueue, "queue enqueue", {
      itemId: item.id,
      availableAt: item.availableAt
    });
    return item;
  }

  async dequeue(options: QueueDequeueOptions = {}): Promise<QueueItem<T> | null> {
    const waitMs = options.waitMs ?? 0;
    const start = Date.now();
    while (true) {
      const index = this.items.findIndex((item) => new Date(item.availableAt).getTime() <= Date.now());
      if (index >= 0) {
        const [item] = this.items.splice(index, 1);
        this.logger.info(QUEUE_LOG_EVENTS.dequeue, "queue dequeue", {
          itemId: item.id
        });
        return item;
      }
      if (Date.now() - start >= waitMs) {
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs));
    }
  }

  async ack(itemId: string): Promise<void> {
    this.logger.info(QUEUE_LOG_EVENTS.ack, "queue ack", {
      itemId
    });
  }
}
````

## File: src/core/queue/Queue.ts
````typescript
export type {
  Queue,
  QueueDequeueOptions,
  QueueEnqueueOptions,
  QueueItem
} from "../../shared/types.ts";
````

## File: src/core/queue/RedisQueue.ts
````typescript
import crypto from "node:crypto";
import { QUEUE_LOG_EVENTS } from "../../shared/constants.ts";
import type {
  Logger,
  Queue,
  QueueDequeueOptions,
  QueueEnqueueOptions,
  QueueItem,
  RedisQueueClient
} from "../../shared/types.ts";

type RedisQueueOptions = {
  client: RedisQueueClient;
  logger: Logger;
  keyPrefix?: string;
};

export class RedisQueue<T> implements Queue<T> {
  private readonly client: RedisQueueClient;
  private readonly logger: Logger;
  private readonly key: string;

  constructor(options: RedisQueueOptions) {
    this.client = options.client;
    this.logger = options.logger;
    this.key = `${options.keyPrefix ?? "pwAutoTestnets"}:queue`;
  }

  async enqueue(payload: T, options: QueueEnqueueOptions = {}): Promise<QueueItem<T>> {
    const item: QueueItem<T> = {
      id: crypto.randomUUID(),
      payload,
      enqueuedAt: new Date().toISOString(),
      availableAt: new Date(Date.now() + (options.delayMs ?? 0)).toISOString()
    };
    await this.client.lpush(this.key, JSON.stringify(item));
    this.logger.info(QUEUE_LOG_EVENTS.enqueue, "queue enqueue", {
      itemId: item.id
    });
    return item;
  }

  async dequeue(_options: QueueDequeueOptions = {}): Promise<QueueItem<T> | null> {
    const value = await this.client.rpop(this.key);
    if (!value) {
      return null;
    }
    const item = JSON.parse(value) as QueueItem<T>;
    if (new Date(item.availableAt).getTime() > Date.now()) {
      await this.client.lpush(this.key, JSON.stringify(item));
      return null;
    }
    this.logger.info(QUEUE_LOG_EVENTS.dequeue, "queue dequeue", {
      itemId: item.id
    });
    return item;
  }

  async ack(itemId: string): Promise<void> {
    this.logger.info(QUEUE_LOG_EVENTS.ack, "queue ack", {
      itemId
    });
  }
}
````

## File: src/core/scenario/examples/BalanceCheckScenario.ts
````typescript
import type { Scenario } from "../../../shared/types.ts";

export const BalanceCheckScenario: Scenario = {
  id: "balance-check",
  title: "Balance check flow",
  async run(context) {
    context.logger.info("scenario.step", "balance check start", {
      runId: context.run.id
    });
    await context.page.waitForTimeout(200);
    await context.page.evaluate(() => true);
    context.logger.info("scenario.step", "balance check done", {
      runId: context.run.id
    });
  }
};
````

## File: src/core/scenario/examples/ConnectWalletScenario.ts
````typescript
import type { Scenario } from "../../../shared/types.ts";

export const ConnectWalletScenario: Scenario = {
  id: "connect-wallet",
  title: "Connect wallet flow",
  async run(context) {
    context.logger.info("scenario.step", "connect wallet start", {
      runId: context.run.id
    });
    await context.page.waitForTimeout(300);
    await context.page.evaluate(() => true);
    context.logger.info("scenario.step", "connect wallet done", {
      runId: context.run.id
    });
  }
};
````

## File: src/core/scenario/ScenarioEngine.ts
````typescript
import { SCENARIO_LOG_EVENTS } from "../../shared/constants.ts";
import type { ScenarioContext, ScenarioId } from "../../shared/types.ts";
import { ScenarioRegistry } from "./ScenarioRegistry.ts";

type ScenarioEngineOptions = {
  registry: ScenarioRegistry;
};

export class ScenarioEngine {
  private readonly registry: ScenarioRegistry;

  constructor(options: ScenarioEngineOptions) {
    this.registry = options.registry;
  }

  async runById(scenarioId: ScenarioId, context: ScenarioContext): Promise<void> {
    const scenario = this.registry.get(scenarioId);
    context.logger.info(SCENARIO_LOG_EVENTS.start, "scenario start", {
      scenarioId: scenario.id,
      runId: context.run.id,
      attempt: context.run.attempt
    });
    try {
      await scenario.run(context);
      context.logger.info(SCENARIO_LOG_EVENTS.success, "scenario success", {
        scenarioId: scenario.id,
        runId: context.run.id,
        attempt: context.run.attempt
      });
    } catch (error) {
      context.logger.error(SCENARIO_LOG_EVENTS.failure, "scenario failure", {
        scenarioId: scenario.id,
        runId: context.run.id,
        attempt: context.run.attempt,
        error: String(error)
      });
      throw error;
    }
  }
}
````

## File: src/core/scenario/ScenarioRegistry.ts
````typescript
import type { Scenario, ScenarioId } from "../../shared/types.ts";

export class ScenarioRegistry {
  private readonly scenarios: Map<ScenarioId, Scenario>;

  constructor() {
    this.scenarios = new Map();
  }

  register(scenario: Scenario): void {
    this.scenarios.set(scenario.id, scenario);
  }

  get(id: ScenarioId): Scenario {
    const scenario = this.scenarios.get(id);
    if (!scenario) {
      throw new Error(`ScenarioNotFound: ${id}`);
    }
    return scenario;
  }

  list(): Scenario[] {
    return Array.from(this.scenarios.values());
  }
}
````

## File: src/core/scheduler/Scheduler.ts
````typescript
import { DEFAULT_RUN_MAX_ATTEMPTS, SCHEDULER_LOG_EVENTS } from "../../shared/constants.ts";
import type { ObservabilityHooks } from "../../shared/observability.ts";
import type { Logger, Queue, RunQueuePayload } from "../../shared/types.ts";
import type { RunRepository } from "../../data/repositories/RunRepository.ts";

type SchedulerOptions = {
  store: RunRepository;
  queue: Queue<RunQueuePayload>;
  logger: Logger;
  hooks?: ObservabilityHooks;
  batchSize?: number;
  maxAttempts?: number;
};

export class Scheduler {
  private readonly store: RunRepository;
  private readonly queue: Queue<RunQueuePayload>;
  private readonly logger: Logger;
  private readonly hooks?: ObservabilityHooks;
  private readonly batchSize: number;
  private readonly maxAttempts: number;

  constructor(options: SchedulerOptions) {
    this.store = options.store;
    this.queue = options.queue;
    this.logger = options.logger;
    this.hooks = options.hooks;
    this.batchSize = options.batchSize ?? 50;
    this.maxAttempts = options.maxAttempts ?? DEFAULT_RUN_MAX_ATTEMPTS;
  }

  async promotePendingRuns(): Promise<number> {
    this.logger.info(SCHEDULER_LOG_EVENTS.promoteStart, "scheduler promote start", {
      batchSize: this.batchSize
    });
    const now = new Date().toISOString();
    const pending = await this.store.listPendingRuns(this.batchSize, now);
    let promoted = 0;

    for (const run of pending) {
      if (run.status !== "queued") {
        continue;
      }
      if (run.nextAttemptAt && new Date(run.nextAttemptAt).getTime() > Date.now()) {
        continue;
      }
      if (run.attempt >= Math.min(run.maxAttempts, this.maxAttempts)) {
        await this.store.markFailed(run.id, "MaxAttemptsReached");
        this.logger.warn(SCHEDULER_LOG_EVENTS.promoteSkip, "scheduler promote skip", {
          runId: run.id,
          attempt: run.attempt
        });
        continue;
      }
      const attempt = await this.store.incrementAttempt(run.id);
      await this.store.markRunning(run.id);
      try {
        await this.queue.enqueue({
          runId: run.id,
          scenarioId: run.scenarioId,
          attempt
        });
      } catch (error) {
        await this.store.markQueued(run.id, "EnqueueFailed");
        this.logger.warn(SCHEDULER_LOG_EVENTS.promoteSkip, "scheduler enqueue failed", {
          runId: run.id,
          attempt,
          error: String(error)
        });
        continue;
      }
      promoted += 1;
      this.logger.info(SCHEDULER_LOG_EVENTS.promoteEnqueue, "scheduler promote enqueue", {
        runId: run.id,
        attempt
      });
      this.hooks?.onEvent({
        name: "scheduler.promote.enqueue",
        time: new Date().toISOString(),
        payload: { runId: run.id, attempt }
      });
    }

    this.logger.info(SCHEDULER_LOG_EVENTS.promoteDone, "scheduler promote done", {
      promoted
    });
    this.hooks?.onEvent({
      name: "scheduler.promote.done",
      time: new Date().toISOString(),
      payload: { promoted }
    });
    return promoted;
  }
}
````

## File: src/core/wallet/metamask/MetaMaskController.ts
````typescript
import { WALLET_ACTION_TIMEOUT_MS, WALLET_DETECTION_TIMEOUT_MS, WALLET_LOG_EVENTS } from "../../../shared/constants.ts";
import { NeedsReviewError } from "../../../shared/errors.ts";
import { WalletKind } from "../../../shared/types.ts";
import type {
  PageHandle,
  WalletConnectionRequest,
  WalletContext,
  WalletController,
  WalletDetection
} from "../../../shared/types.ts";

const METAMASK_SELECTORS = {
  extensionIcon: "TODO: version-sensitive",
  unlockPasswordInput: "TODO: version-sensitive",
  unlockButton: "TODO: version-sensitive",
  connectButton: "TODO: version-sensitive",
  approveButton: "TODO: version-sensitive",
  networkMenu: "TODO: version-sensitive",
  networkItem: "TODO: version-sensitive"
} as const;

export class MetaMaskController implements WalletController {
  kind = WalletKind.MetaMask;

  async detect(page: PageHandle, context: WalletContext): Promise<WalletDetection | null> {
    context.logger.info(WALLET_LOG_EVENTS.detectStart, "metamask detect start", {
      kind: this.kind
    });
    if (this.isTodoSelector(METAMASK_SELECTORS.extensionIcon)) {
      throw new NeedsReviewError("WalletSelectorTodo", "wallet_selector_todo");
    }
    const visible = await page
      .locator(METAMASK_SELECTORS.extensionIcon)
      .isVisible({ timeout: context.timeoutMs ?? WALLET_DETECTION_TIMEOUT_MS });
    if (!visible) {
      context.logger.warn(WALLET_LOG_EVENTS.detectFailure, "metamask not visible", {
        kind: this.kind
      });
      return null;
    }
    const detection = { kind: this.kind, confidence: 0.9 };
    context.logger.info(WALLET_LOG_EVENTS.detectSuccess, "metamask detect success", detection);
    return detection;
  }

  async unlock(page: PageHandle, password: string, context: WalletContext): Promise<void> {
    context.logger.info(WALLET_LOG_EVENTS.unlockStart, "metamask unlock start", {
      kind: this.kind
    });
    this.assertSelectorReady(METAMASK_SELECTORS.unlockPasswordInput);
    this.assertSelectorReady(METAMASK_SELECTORS.unlockButton);
    await page
      .locator(METAMASK_SELECTORS.unlockPasswordInput)
      .fill(password, { timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    await page
      .locator(METAMASK_SELECTORS.unlockButton)
      .click({ timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    context.logger.info(WALLET_LOG_EVENTS.unlockSuccess, "metamask unlock success", {
      kind: this.kind
    });
  }

  async connect(page: PageHandle, context: WalletContext): Promise<void> {
    context.logger.info(WALLET_LOG_EVENTS.connectStart, "metamask connect start", {
      kind: this.kind
    });
    this.assertSelectorReady(METAMASK_SELECTORS.connectButton);
    this.assertSelectorReady(METAMASK_SELECTORS.approveButton);
    await page
      .locator(METAMASK_SELECTORS.connectButton)
      .click({ timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    await page
      .locator(METAMASK_SELECTORS.approveButton)
      .click({ timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    context.logger.info(WALLET_LOG_EVENTS.connectSuccess, "metamask connect success", {
      kind: this.kind
    });
  }

  async ensureNetwork(
    page: PageHandle,
    request: WalletConnectionRequest,
    context: WalletContext
  ): Promise<void> {
    context.logger.info(WALLET_LOG_EVENTS.networkStart, "metamask network start", {
      kind: this.kind,
      chainId: request.chainId
    });
    this.assertSelectorReady(METAMASK_SELECTORS.networkMenu);
    this.assertSelectorReady(METAMASK_SELECTORS.networkItem);
    await page
      .locator(METAMASK_SELECTORS.networkMenu)
      .click({ timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    await page
      .locator(this.withNetworkSelector(METAMASK_SELECTORS.networkItem, request.chainId))
      .click({ timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    context.logger.info(WALLET_LOG_EVENTS.networkSuccess, "metamask network success", {
      kind: this.kind,
      chainId: request.chainId
    });
  }

  private withNetworkSelector(template: string, chainId: number) {
    return template.replace("{chainId}", String(chainId));
  }

  private isTodoSelector(selector: string) {
    return selector.includes("TODO");
  }

  private assertSelectorReady(selector: string) {
    if (this.isTodoSelector(selector)) {
      throw new Error(`SelectorTODO: ${selector}`);
    }
  }
}
````

## File: src/core/wallet/rabby/RabbyController.ts
````typescript
import { WALLET_ACTION_TIMEOUT_MS, WALLET_DETECTION_TIMEOUT_MS, WALLET_LOG_EVENTS } from "../../../shared/constants.ts";
import { NeedsReviewError } from "../../../shared/errors.ts";
import { WalletKind } from "../../../shared/types.ts";
import type {
  PageHandle,
  WalletConnectionRequest,
  WalletContext,
  WalletController,
  WalletDetection
} from "../../../shared/types.ts";

const RABBY_SELECTORS = {
  extensionIcon: "TODO: version-sensitive",
  unlockPasswordInput: "TODO: version-sensitive",
  unlockButton: "TODO: version-sensitive",
  connectButton: "TODO: version-sensitive",
  approveButton: "TODO: version-sensitive",
  networkMenu: "TODO: version-sensitive",
  networkItem: "TODO: version-sensitive"
} as const;

export class RabbyController implements WalletController {
  kind = WalletKind.Rabby;

  async detect(page: PageHandle, context: WalletContext): Promise<WalletDetection | null> {
    context.logger.info(WALLET_LOG_EVENTS.detectStart, "rabby detect start", {
      kind: this.kind
    });
    if (this.isTodoSelector(RABBY_SELECTORS.extensionIcon)) {
      throw new NeedsReviewError("WalletSelectorTodo", "wallet_selector_todo");
    }
    const visible = await page
      .locator(RABBY_SELECTORS.extensionIcon)
      .isVisible({ timeout: context.timeoutMs ?? WALLET_DETECTION_TIMEOUT_MS });
    if (!visible) {
      context.logger.warn(WALLET_LOG_EVENTS.detectFailure, "rabby not visible", {
        kind: this.kind
      });
      return null;
    }
    const detection = { kind: this.kind, confidence: 0.85 };
    context.logger.info(WALLET_LOG_EVENTS.detectSuccess, "rabby detect success", detection);
    return detection;
  }

  async unlock(page: PageHandle, password: string, context: WalletContext): Promise<void> {
    context.logger.info(WALLET_LOG_EVENTS.unlockStart, "rabby unlock start", {
      kind: this.kind
    });
    this.assertSelectorReady(RABBY_SELECTORS.unlockPasswordInput);
    this.assertSelectorReady(RABBY_SELECTORS.unlockButton);
    await page
      .locator(RABBY_SELECTORS.unlockPasswordInput)
      .fill(password, { timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    await page
      .locator(RABBY_SELECTORS.unlockButton)
      .click({ timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    context.logger.info(WALLET_LOG_EVENTS.unlockSuccess, "rabby unlock success", {
      kind: this.kind
    });
  }

  async connect(page: PageHandle, context: WalletContext): Promise<void> {
    context.logger.info(WALLET_LOG_EVENTS.connectStart, "rabby connect start", {
      kind: this.kind
    });
    this.assertSelectorReady(RABBY_SELECTORS.connectButton);
    this.assertSelectorReady(RABBY_SELECTORS.approveButton);
    await page
      .locator(RABBY_SELECTORS.connectButton)
      .click({ timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    await page
      .locator(RABBY_SELECTORS.approveButton)
      .click({ timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    context.logger.info(WALLET_LOG_EVENTS.connectSuccess, "rabby connect success", {
      kind: this.kind
    });
  }

  async ensureNetwork(
    page: PageHandle,
    request: WalletConnectionRequest,
    context: WalletContext
  ): Promise<void> {
    context.logger.info(WALLET_LOG_EVENTS.networkStart, "rabby network start", {
      kind: this.kind,
      chainId: request.chainId
    });
    this.assertSelectorReady(RABBY_SELECTORS.networkMenu);
    this.assertSelectorReady(RABBY_SELECTORS.networkItem);
    await page
      .locator(RABBY_SELECTORS.networkMenu)
      .click({ timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    await page
      .locator(this.withNetworkSelector(RABBY_SELECTORS.networkItem, request.chainId))
      .click({ timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    context.logger.info(WALLET_LOG_EVENTS.networkSuccess, "rabby network success", {
      kind: this.kind,
      chainId: request.chainId
    });
  }

  private withNetworkSelector(template: string, chainId: number) {
    return template.replace("{chainId}", String(chainId));
  }

  private isTodoSelector(selector: string) {
    return selector.includes("TODO");
  }

  private assertSelectorReady(selector: string) {
    if (this.isTodoSelector(selector)) {
      throw new Error(`SelectorTODO: ${selector}`);
    }
  }
}
````

## File: src/core/wallet/WalletDetector.ts
````typescript
import { WALLET_DETECTION_TIMEOUT_MS, WALLET_LOG_EVENTS } from "../../shared/constants.ts";
import { NeedsReviewError } from "../../shared/errors.ts";
import type { PageHandle, WalletContext, WalletController, WalletDetection } from "../../shared/types.ts";

export class WalletDetector {
  private readonly controllers: WalletController[];
  private readonly context: WalletContext;

  constructor(controllers: WalletController[], context: WalletContext) {
    this.controllers = controllers;
    this.context = context;
  }

  async detect(page: PageHandle): Promise<WalletDetection | null> {
    this.context.logger.info(WALLET_LOG_EVENTS.detectStart, "wallet detector start", {
      controllers: this.controllers.map((controller) => controller.kind)
    });
    const timeoutMs = this.context.timeoutMs ?? WALLET_DETECTION_TIMEOUT_MS;
    let best: WalletDetection | null = null;

    for (const controller of this.controllers) {
      try {
        const detection = await this.withTimeout(
          controller.detect(page, this.context),
          timeoutMs
        );
        if (detection && (!best || detection.confidence > best.confidence)) {
          best = detection;
        }
      } catch (error) {
        this.context.logger.warn(WALLET_LOG_EVENTS.detectFailure, "wallet detector controller error", {
          kind: controller.kind,
          error: String(error)
        });
      }
    }

    if (best) {
      this.context.logger.info(WALLET_LOG_EVENTS.detectSuccess, "wallet detector success", {
        kind: best.kind,
        confidence: best.confidence
      });
      return best;
    }

    this.context.logger.warn(WALLET_LOG_EVENTS.detectFailure, "wallet detector empty", {});
    throw new NeedsReviewError("WalletUnknownState", "wallet_unknown_state");
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutId: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("DetectTimeout")), timeoutMs);
    });
    try {
      return await Promise.race([promise, timeout]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
}
````

## File: src/core/wallet/WalletManager.ts
````typescript
import type {
  PageHandle,
  WalletConnectionRequest,
  WalletContext,
  WalletController,
  WalletDetection
} from "../../shared/types.ts";
import { WALLET_LOG_EVENTS } from "../../shared/constants.ts";
import { NeedsReviewError } from "../../shared/errors.ts";

export class WalletManager {
  private readonly controller: WalletController;
  private readonly context: WalletContext;

  constructor(controller: WalletController, context: WalletContext) {
    this.controller = controller;
    this.context = context;
  }

  async detect(page: PageHandle): Promise<WalletDetection | null> {
    this.context.logger.info(WALLET_LOG_EVENTS.detectStart, "wallet detect start", {
      kind: this.controller.kind
    });
    try {
      const detection = await this.controller.detect(page, this.context);
      if (detection) {
        this.context.logger.info(WALLET_LOG_EVENTS.detectSuccess, "wallet detect success", {
          kind: detection.kind,
          confidence: detection.confidence
        });
      } else {
        this.context.logger.warn(WALLET_LOG_EVENTS.detectFailure, "wallet detect empty", {
          kind: this.controller.kind
        });
        throw new NeedsReviewError(`Wallet ${this.controller.kind} detect empty or failed.`, "wallet_unknown_state");
      }
      return detection;
    } catch (error) {
      this.context.logger.error(WALLET_LOG_EVENTS.detectFailure, "wallet detect error", {
        kind: this.controller.kind,
        error: String(error)
      });
      if (error instanceof NeedsReviewError) {
        throw error;
      }
      throw new NeedsReviewError(`Wallet ${this.controller.kind} unknown state: ${error}`, "wallet_unknown_state", error);
    }
  }

  async unlock(page: PageHandle, password: string): Promise<void> {
    this.context.logger.info(WALLET_LOG_EVENTS.unlockStart, "wallet unlock start", {
      kind: this.controller.kind
    });
    try {
      await this.controller.unlock(page, password, this.context);
      this.context.logger.info(WALLET_LOG_EVENTS.unlockSuccess, "wallet unlock success", {
        kind: this.controller.kind
      });
    } catch (error) {
      this.context.logger.error(WALLET_LOG_EVENTS.unlockFailure, "wallet unlock error", {
        kind: this.controller.kind,
        error: String(error)
      });
      throw error;
    }
  }

  async connect(page: PageHandle): Promise<void> {
    this.context.logger.info(WALLET_LOG_EVENTS.connectStart, "wallet connect start", {
      kind: this.controller.kind
    });
    try {
      await this.controller.connect(page, this.context);
      this.context.logger.info(WALLET_LOG_EVENTS.connectSuccess, "wallet connect success", {
        kind: this.controller.kind
      });
    } catch (error) {
      this.context.logger.error(WALLET_LOG_EVENTS.connectFailure, "wallet connect error", {
        kind: this.controller.kind,
        error: String(error)
      });
      throw error;
    }
  }

  async ensureNetwork(page: PageHandle, request: WalletConnectionRequest): Promise<void> {
    this.context.logger.info(WALLET_LOG_EVENTS.networkStart, "wallet network start", {
      kind: this.controller.kind,
      chainId: request.chainId
    });
    try {
      await this.controller.ensureNetwork(page, request, this.context);
      this.context.logger.info(WALLET_LOG_EVENTS.networkSuccess, "wallet network success", {
        kind: this.controller.kind,
        chainId: request.chainId
      });
    } catch (error) {
      this.context.logger.error(WALLET_LOG_EVENTS.networkFailure, "wallet network error", {
        kind: this.controller.kind,
        chainId: request.chainId,
        error: String(error)
      });
      throw error;
    }
  }
}
````

## File: src/core/worker/FileArtifactWriter.ts
````typescript
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { DEFAULT_ARTIFACTS_DIR } from "../../shared/constants.ts";
import type { ArtifactWriter, PageHandle, RunId } from "../../shared/types.ts";

type FileArtifactWriterOptions = {
  baseDir?: string;
};

export class FileArtifactWriter implements ArtifactWriter {
  private readonly baseDir: string;

  constructor(options: FileArtifactWriterOptions = {}) {
    this.baseDir = options.baseDir ?? path.join(os.homedir(), DEFAULT_ARTIFACTS_DIR);
  }

  async captureScreenshot(page: PageHandle, runId: RunId, name: string): Promise<string> {
    const dir = await this.ensureDir(runId);
    const filePath = path.join(dir, `${name}.png`);
    await page.screenshot({ path: filePath });
    return filePath;
  }

  async captureHtml(page: PageHandle, runId: RunId, name: string): Promise<string> {
    const dir = await this.ensureDir(runId);
    const filePath = path.join(dir, `${name}.html`);
    const html = await page.content();
    await fs.writeFile(filePath, html, "utf-8");
    return filePath;
  }

  async captureTrace(page: PageHandle, runId: RunId, name: string): Promise<string> {
    const dir = await this.ensureDir(runId);
    const filePath = path.join(dir, `${name}-trace.zip`);
    await page.stopTracing(filePath);
    return filePath;
  }

  async captureLogs(page: PageHandle, runId: RunId, name: string): Promise<{ consolePath: string; networkPath: string }> {
    const dir = await this.ensureDir(runId);
    const consolePath = path.join(dir, `${name}-console.json`);
    const networkPath = path.join(dir, `${name}-network.json`);

    await fs.writeFile(consolePath, JSON.stringify(page.getConsoleLogs(), null, 2), "utf-8");
    await fs.writeFile(networkPath, JSON.stringify(page.getNetworkLogs(), null, 2), "utf-8");

    return { consolePath, networkPath };
  }

  async captureMetadata(runId: RunId, name: string, metadata: Record<string, unknown>): Promise<string> {
    const dir = await this.ensureDir(runId);
    const filePath = path.join(dir, `${name}-metadata.json`);
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2), "utf-8");
    return filePath;
  }

  private async ensureDir(runId: RunId): Promise<string> {
    const dir = path.join(this.baseDir, runId);
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }
}
````

## File: src/core/worker/Worker.ts
````typescript
import { DEFAULT_QUEUE_WAIT_MS, WORKER_LOG_EVENTS } from "../../shared/constants.ts";
import { classifyError } from "../../shared/errors.ts";
import type { ObservabilityHooks } from "../../shared/observability.ts";
import { computeRetryDelayMs } from "../../shared/retry.ts";
import type {
  ArtifactWriter,
  Logger,
  PageFactory,
  PageHandle,
  Queue,
  RunQueuePayload,
  ScenarioRun
} from "../../shared/types.ts";
import type { RunRepository } from "../../data/repositories/RunRepository.ts";
import { ScenarioEngine } from "../scenario/ScenarioEngine.ts";

type WorkerOptions = {
  queue: Queue<RunQueuePayload>;
  store: RunRepository;
  engine: ScenarioEngine;
  pageFactory: PageFactory;
  artifacts: ArtifactWriter;
  logger: Logger;
  hooks?: ObservabilityHooks;
};

export class Worker {
  private readonly queue: Queue<RunQueuePayload>;
  private readonly store: RunRepository;
  private readonly engine: ScenarioEngine;
  private readonly pageFactory: PageFactory;
  private readonly artifacts: ArtifactWriter;
  private readonly logger: Logger;
  private readonly hooks?: ObservabilityHooks;
  private readonly activeRuns = new Map<string, AbortController>();

  constructor(options: WorkerOptions) {
    this.queue = options.queue;
    this.store = options.store;
    this.engine = options.engine;
    this.pageFactory = options.pageFactory;
    this.artifacts = options.artifacts;
    this.logger = options.logger;
    this.hooks = options.hooks;
  }

  async runOnce(): Promise<boolean> {
    const item = await this.queue.dequeue({ waitMs: DEFAULT_QUEUE_WAIT_MS });
    if (!item) {
      return false;
    }

    if (this.activeRuns.has(item.payload.runId)) {
      this.logger.warn(WORKER_LOG_EVENTS.runStart, "idempotency constraint: run already active", {
        runId: item.payload.runId
      });
      await this.queue.ack(item.id);
      return true;
    }

    const run = await this.store.getRun(item.payload.runId);
    if (!run) {
      await this.queue.ack(item.id);
      return true;
    }
    if (run.status === "completed" || run.status === "failed") {
      await this.queue.ack(item.id);
      return true;
    }
    if (run.status === "cancelled") {
      this.logger.info(WORKER_LOG_EVENTS.runCancelled, "worker run cancelled", {
        runId: run.id
      });
      await this.queue.ack(item.id);
      return true;
    }
    if (run.status === "needs_review") {
      this.logger.info(WORKER_LOG_EVENTS.needsReview, "worker run needs review", {
        runId: run.id
      });
      await this.queue.ack(item.id);
      return true;
    }
    if (run.status !== "running" || run.attempt !== item.payload.attempt) {
      await this.queue.ack(item.id);
      return true;
    }
    const scenarioRun: ScenarioRun = {
      id: run.id,
      scenarioId: run.scenarioId,
      networkId: run.networkId,
      profileId: run.profileId,
      attempt: item.payload.attempt
    };
    let page: PageHandle | null = null;
    try {
      page = await this.pageFactory.create(run.profileId);
    } catch (error) {
      const classified = classifyError(error);
      if (classified.category === "needs_review") {
        await this.store.markNeedsReview(run.id, classified.message, undefined, classified.code);
        this.logger.info(WORKER_LOG_EVENTS.needsReview, "worker run needs review", {
          runId: run.id,
          attempt: scenarioRun.attempt,
          error: classified.message,
          code: classified.code
        });
      } else if (classified.category === "transient" && scenarioRun.attempt < run.maxAttempts) {
        const delayMs = computeRetryDelayMs(scenarioRun.attempt);
        await this.store.markQueued(
          run.id,
          classified.message,
          undefined,
          new Date(Date.now() + delayMs).toISOString(),
          classified.code
        );
        this.logger.info(WORKER_LOG_EVENTS.retryScheduled, "worker retry scheduled", {
          runId: run.id,
          nextAttempt: scenarioRun.attempt + 1,
          delayMs
        });
      } else {
        await this.store.markFailed(run.id, classified.message);
        this.logger.error(WORKER_LOG_EVENTS.runFailure, "worker run failure", {
          runId: run.id,
          attempt: scenarioRun.attempt,
          error: classified.message,
          code: classified.code
        });
      }
      await this.queue.ack(item.id);
      return true;
    }

    this.logger.info(WORKER_LOG_EVENTS.runStart, "worker run start", {
      runId: run.id,
      attempt: scenarioRun.attempt
    });
    this.hooks?.onEvent({
      name: "worker.run.start",
      time: new Date().toISOString(),
      payload: { runId: run.id, attempt: scenarioRun.attempt }
    });

    const controller = new AbortController();
    this.activeRuns.set(run.id, controller);

    await page.startTracing().catch(() => { });

    try {
      await this.engine.runById(run.scenarioId, {
        logger: this.logger,
        page,
        run: scenarioRun,
        artifacts: this.artifacts,
        abortSignal: controller.signal
      });
      await this.store.markCompleted(run.id);
      await this.queue.ack(item.id);
      this.logger.info(WORKER_LOG_EVENTS.runSuccess, "worker run success", {
        runId: run.id,
        attempt: scenarioRun.attempt
      });
      this.hooks?.onEvent({
        name: "worker.run.success",
        time: new Date().toISOString(),
        payload: { runId: run.id, attempt: scenarioRun.attempt }
      });
      await page.stopTracing("").catch(() => { }); // Cleanup trace casually
      return true;
    } catch (error) {
      const screenshotPath = await this.artifacts.captureScreenshot(page, run.id, `failure-${scenarioRun.attempt}`).catch(() => undefined);
      const htmlPath = await this.artifacts.captureHtml(page, run.id, `failure-${scenarioRun.attempt}`).catch(() => undefined);
      const tracePath = await this.artifacts.captureTrace(page, run.id, `failure-${scenarioRun.attempt}`).catch(() => undefined);

      let consoleLogsPath: string | undefined;
      let networkLogsPath: string | undefined;
      try {
        const logs = await this.artifacts.captureLogs(page, run.id, `failure-${scenarioRun.attempt}`);
        consoleLogsPath = logs.consolePath;
        networkLogsPath = logs.networkPath;
      } catch (e) { }

      const classified = classifyError(error);
      const metadataPath = await this.artifacts.captureMetadata(run.id, `metadata-${scenarioRun.attempt}`, {
        error: classified.message,
        code: classified.code,
        category: classified.category,
        attempt: scenarioRun.attempt,
        time: new Date().toISOString()
      }).catch(() => undefined);

      this.logger.info(WORKER_LOG_EVENTS.artifactsCaptured, "worker artifacts captured", {
        runId: run.id,
        screenshotPath,
        htmlPath,
        tracePath
      });
      const artifacts = { screenshotPath, htmlPath, tracePath, consoleLogsPath, networkLogsPath, metadataPath };

      if (classified.category === "needs_review") {
        await this.store.markNeedsReview(run.id, classified.message, artifacts, classified.code);
        this.logger.info(WORKER_LOG_EVENTS.needsReview, "worker run needs review", {
          runId: run.id,
          attempt: scenarioRun.attempt,
          error: classified.message,
          code: classified.code
        });
      } else if (classified.category === "transient" && scenarioRun.attempt < run.maxAttempts) {
        const delayMs = computeRetryDelayMs(scenarioRun.attempt);
        await this.store.markQueued(
          run.id,
          classified.message,
          artifacts,
          new Date(Date.now() + delayMs).toISOString(),
          classified.code
        );
        this.logger.info(WORKER_LOG_EVENTS.retryScheduled, "worker retry scheduled", {
          runId: run.id,
          nextAttempt: scenarioRun.attempt + 1,
          delayMs
        });
      } else {
        await this.store.markFailed(run.id, classified.message, artifacts);
        this.logger.error(WORKER_LOG_EVENTS.runFailure, "worker run failure", {
          runId: run.id,
          attempt: scenarioRun.attempt,
          error: classified.message,
          code: classified.code
        });
      }
      await this.queue.ack(item.id);
      this.hooks?.onEvent({
        name: "worker.run.failure",
        time: new Date().toISOString(),
        payload: { runId: run.id, attempt: scenarioRun.attempt, error: classified.message, code: classified.code }
      });
      return true;
    } finally {
      this.activeRuns.delete(run.id);
      if (page) {
        await this.pageFactory.close(page);
      }
    }
  }

  cancelActiveRun(runId: string): boolean {
    const controller = this.activeRuns.get(runId);
    if (controller) {
      controller.abort(new Error("RunCancelled"));
      return true;
    }
    return false;
  }
}
````

## File: src/dashboard/components/RunArtifacts.ts
````typescript
import type { ArtifactRecord } from "../../shared/types.ts";

export const renderRunArtifacts = (runId: string, artifacts?: ArtifactRecord) => {
    if (!artifacts) {
        return {
            type: "div",
            props: { className: "text-gray-500 italic text-sm" },
            children: ["No artifacts captured for this run."]
        };
    }

    const links = [];

    if (artifacts.screenshotPath) {
        const filename = artifacts.screenshotPath.split("/").pop() || "screenshot.png";
        links.push({
            label: "Screenshot",
            url: `/api/runs/${runId}/artifacts/${filename}`,
            icon: "рџ–јпёЏ"
        });
    }

    if (artifacts.htmlPath) {
        const filename = artifacts.htmlPath.split("/").pop() || "page.html";
        links.push({
            label: "DOM Dump",
            url: `/api/runs/${runId}/artifacts/${filename}`,
            icon: "рџ“„"
        });
    }

    if (artifacts.tracePath) {
        const filename = artifacts.tracePath.split("/").pop() || "trace.zip";
        links.push({
            label: "Playwright Trace",
            url: `/api/runs/${runId}/artifacts/${filename}`,
            icon: "рџ”Ќ"
        });
    }

    if (artifacts.consoleLogsPath) {
        const filename = artifacts.consoleLogsPath.split("/").pop() || "console.json";
        links.push({
            label: "Console Logs",
            url: `/api/runs/${runId}/artifacts/${filename}`,
            icon: "рџ“ќ"
        });
    }

    if (artifacts.networkLogsPath) {
        const filename = artifacts.networkLogsPath.split("/").pop() || "network.json";
        links.push({
            label: "Network Logs",
            url: `/api/runs/${runId}/artifacts/${filename}`,
            icon: "рџЊђ"
        });
    }

    if (artifacts.metadataPath) {
        const filename = artifacts.metadataPath.split("/").pop() || "metadata.json";
        links.push({
            label: "Detector Metadata",
            url: `/api/runs/${runId}/artifacts/${filename}`,
            icon: "рџ“Љ"
        });
    }

    return {
        type: "div",
        props: { className: "flex flex-col gap-2 mt-4" },
        children: [
            {
                type: "h3",
                props: { className: "text-lg font-medium text-gray-900" },
                children: ["Artifacts"]
            },
            {
                type: "div",
                props: { className: "flex flex-wrap gap-2" },
                children: links.map(link => ({
                    type: "a",
                    props: {
                        href: link.url,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    },
                    children: [
                        {
                            type: "span",
                            props: { className: "mr-2" },
                            children: [link.icon]
                        },
                        link.label
                    ]
                }))
            }
        ]
    };
};
````

## File: src/dashboard/components/RunStatusBadge.ts
````typescript
import type { RunStatus } from "../../shared/types.ts";

export const renderRunStatusBadge = (status: RunStatus) => {
  return {
    text: status,
    tone:
      status === "failed"
        ? "critical"
        : status === "completed"
          ? "success"
          : status === "needs_review"
            ? "warning"
            : status === "cancelled"
              ? "subdued"
              : "neutral"
  };
};
````

## File: src/dashboard/components/RunTable.ts
````typescript
import type { RunRecord } from "../../shared/types.ts";
import { renderRunStatusBadge } from "./RunStatusBadge.ts";

export const renderRunTable = (runs: RunRecord[]) => {
  return runs.map((run) => ({
    id: run.id,
    scenarioId: run.scenarioId,
    networkId: run.networkId,
    profileId: run.profileId,
    status: renderRunStatusBadge(run.status),
    attempt: `${run.attempt}/${run.maxAttempts}`
  }));
};
````

## File: src/dashboard/hooks/useRunDetail.ts
````typescript
import type { RunRecord } from "../../shared/types.ts";
import type { DashboardRunService } from "../services/runService.ts";

export const useRunDetail = async (
  service: DashboardRunService,
  runId: string
): Promise<RunRecord | null> => {
  return service.getRun(runId);
};
````

## File: src/dashboard/hooks/useRuns.ts
````typescript
import type { RunRecord } from "../../shared/types.ts";
import type { DashboardRunService, RunsQuery } from "../services/runService.ts";

export const useRuns = async (
  service: DashboardRunService,
  query?: RunsQuery
): Promise<RunRecord[]> => {
  return service.listRuns(query);
};
````

## File: src/dashboard/pages/RunDetailPage.ts
````typescript
import { renderRunStatusBadge } from "../components/RunStatusBadge.ts";
import { renderRunArtifacts } from "../components/RunArtifacts.ts";
import { useRunDetail } from "../hooks/useRunDetail.ts";
import type { DashboardRunService } from "../services/runService.ts";

export const buildRunDetailPage = async (service: DashboardRunService, runId: string) => {
  const run = await useRunDetail(service, runId);
  if (!run) {
    return { error: "RunNotFound" };
  }
  return {
    id: run.id,
    scenarioId: run.scenarioId,
    networkId: run.networkId,
    profileId: run.profileId,
    status: renderRunStatusBadge(run.status),
    attempt: run.attempt,
    maxAttempts: run.maxAttempts,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,

    // We expect the Dashboard renderer generator to pass this down dynamically
    artifactsView: renderRunArtifacts(run.id, (run as any).artifacts || run.lastErrorMessage ? {
      // Quick polyfill mapping for dashboard testing where API didn't strictly expose artifacts column
      // For a real production app we would expose it cleanly through `run.artifacts`
      screenshotPath: (run as any).screenshotPath,
      htmlPath: (run as any).htmlPath,
      tracePath: (run as any).tracePath,
      consoleLogsPath: (run as any).consoleLogsPath,
      networkLogsPath: (run as any).networkLogsPath,
      metadataPath: (run as any).metadataPath
    } : undefined)
  };
};
````

## File: src/dashboard/pages/RunsPage.ts
````typescript
import type { RunRecord } from "../../shared/types.ts";
import { renderRunTable } from "../components/RunTable.ts";
import { useRuns } from "../hooks/useRuns.ts";
import type { DashboardRunService, RunsQuery } from "../services/runService.ts";

export const buildRunsPage = async (
  service: DashboardRunService,
  query?: RunsQuery
): Promise<{ runs: ReturnType<typeof renderRunTable>; total: number }> => {
  const runs = await useRuns(service, query);
  return {
    runs: renderRunTable(runs),
    total: runs.length
  };
};

export const serializeRunsPage = (runs: RunRecord[]) => {
  return JSON.stringify({ runs }, null, 2);
};
````

## File: src/dashboard/services/runService.ts
````typescript
import type { RunRecord, RunStatus } from "../../shared/types.ts";

export type RunsQuery = {
  status?: RunStatus;
  limit?: number;
};

export type DashboardApi = {
  listRuns(query?: RunsQuery): Promise<RunRecord[]>;
  getRun(id: string): Promise<RunRecord | null>;
  cancelRun(id: string): Promise<RunRecord | null>;
};

export class DashboardRunService {
  private readonly api: DashboardApi;

  constructor(api: DashboardApi) {
    this.api = api;
  }

  async listRuns(query?: RunsQuery): Promise<RunRecord[]> {
    return this.api.listRuns(query);
  }

  async getRun(id: string): Promise<RunRecord | null> {
    return this.api.getRun(id);
  }

  async cancelRun(id: string): Promise<RunRecord | null> {
    return this.api.cancelRun(id);
  }
}
````

## File: src/dashboard/services/runUpdates.ts
````typescript
import type { RunRecord, RunStatus } from "../../shared/types.ts";
import type { DashboardApi } from "./runService.ts";

type RunUpdatesOptions = {
  intervalMs?: number;
  status?: RunStatus;
  limit?: number;
};

export class RunUpdatesPoller {
  private readonly api: DashboardApi;
  private readonly intervalMs: number;
  private readonly status?: RunStatus;
  private readonly limit?: number;
  private timer?: ReturnType<typeof setInterval>;
  private eventSource?: EventSource;
  private running = false;

  constructor(api: DashboardApi, options: RunUpdatesOptions = {}) {
    this.api = api;
    this.intervalMs = options.intervalMs ?? 2000;
    this.status = options.status;
    this.limit = options.limit;
  }

  start(handler: (runs: RunRecord[]) => void) {
    if (this.running) {
      return;
    }
    this.running = true;

    try {
      const url = new URL("/api/runs/stream", window.location.origin);
      if (this.status) url.searchParams.set("status", this.status);
      if (this.limit) url.searchParams.set("limit", String(this.limit));

      this.eventSource = new EventSource(url.toString());
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.runs) handler(data.runs);
        } catch { }
      };
      this.eventSource.onerror = () => {
        this.eventSource?.close();
        this.eventSource = undefined;
        this.startPolling(handler);
      };
    } catch {
      this.startPolling(handler);
    }
  }

  private startPolling(handler: (runs: RunRecord[]) => void) {
    if (this.timer || !this.running) return;
    const tick = async () => {
      if (!this.running) return;
      const runs = await this.api.listRuns({ status: this.status, limit: this.limit });
      handler(runs);
    };
    this.timer = setInterval(() => {
      void tick();
    }, this.intervalMs);
    void tick();
  }

  stop() {
    this.running = false;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}
````

## File: src/dashboard/structure.ts
````typescript
export const dashboardStructure = [
  "src/dashboard/pages/RunsPage.ts",
  "src/dashboard/pages/RunDetailPage.ts",
  "src/dashboard/components/RunTable.ts",
  "src/dashboard/components/RunStatusBadge.ts",
  "src/dashboard/hooks/useRuns.ts",
  "src/dashboard/hooks/useRunDetail.ts",
  "src/dashboard/services/runService.ts",
  "src/dashboard/services/runUpdates.ts"
];
````

## File: src/data/repositories/RunRepository.ts
````typescript
import type {
  ArtifactRecord,
  ISODateString,
  RunErrorCode,
  RunId,
  RunRecord,
  RunStatus
} from "../../shared/types.ts";

export type RunRepository = {
  getRun(runId: RunId): Promise<RunRecord | null>;
  listPendingRuns(limit: number, now?: ISODateString): Promise<RunRecord[]>;
  listRuns(options?: { status?: RunStatus; limit?: number }): Promise<RunRecord[]>;
  createRun(run: RunRecord): Promise<void>;
  markRunning(runId: RunId): Promise<void>;
  markQueued(
    runId: RunId,
    errorMessage?: string,
    artifacts?: ArtifactRecord,
    nextAttemptAt?: ISODateString,
    errorCode?: RunErrorCode
  ): Promise<void>;
  markNeedsReview(
    runId: RunId,
    errorMessage?: string,
    artifacts?: ArtifactRecord,
    errorCode?: RunErrorCode
  ): Promise<void>;
  markCancelled(runId: RunId, reason?: string): Promise<void>;
  markFailed(runId: RunId, errorMessage: string, artifacts?: ArtifactRecord): Promise<void>;
  markCompleted(runId: RunId): Promise<void>;
  incrementAttempt(runId: RunId): Promise<number>;
};
````

## File: src/data/repositories/RunStoreRepository.ts
````typescript
import type { RunStore } from "../../shared/types.ts";
import type { RunRepository } from "./RunRepository.ts";

export class RunStoreRepository implements RunRepository {
  private readonly store: RunStore;

  constructor(store: RunStore) {
    this.store = store;
  }

  getRun(runId: string) {
    return this.store.getRun(runId);
  }

  listPendingRuns(limit: number, now?: string) {
    return this.store.listPendingRuns(limit, now);
  }

  listRuns(options?: Parameters<RunStore["listRuns"]>[0]) {
    return this.store.listRuns(options);
  }

  createRun(run: Parameters<RunStore["createRun"]>[0]) {
    return this.store.createRun(run);
  }

  markRunning(runId: string) {
    return this.store.markRunning(runId);
  }

  markQueued(
    runId: string,
    errorMessage?: string,
    artifacts?: Parameters<RunStore["markQueued"]>[2],
    nextAttemptAt?: string,
    errorCode?: Parameters<RunStore["markQueued"]>[4]
  ) {
    return this.store.markQueued(runId, errorMessage, artifacts, nextAttemptAt, errorCode);
  }

  markNeedsReview(
    runId: string,
    errorMessage?: string,
    artifacts?: Parameters<RunStore["markNeedsReview"]>[2],
    errorCode?: Parameters<RunStore["markNeedsReview"]>[3]
  ) {
    return this.store.markNeedsReview(runId, errorMessage, artifacts, errorCode);
  }

  markCancelled(runId: string, reason?: string) {
    return this.store.markCancelled(runId, reason);
  }

  markFailed(runId: string, errorMessage: string, artifacts?: Parameters<RunStore["markFailed"]>[2]) {
    return this.store.markFailed(runId, errorMessage, artifacts);
  }

  markCompleted(runId: string) {
    return this.store.markCompleted(runId);
  }

  incrementAttempt(runId: string) {
    return this.store.incrementAttempt(runId);
  }
}
````

## File: src/shared/security/SecretService.ts
````typescript
import crypto from "node:crypto";

type SecretServiceOptions = {
  key: string;
};

const KEY_LENGTH = 32;
const IV_LENGTH = 12;

const toBuffer = (input: string) => Buffer.from(input, "base64");
const toBase64 = (input: Buffer) => input.toString("base64");

const normalizeKey = (key: string) => {
  const raw = Buffer.from(key, "base64");
  if (raw.length !== KEY_LENGTH) {
    throw new Error("InvalidSecretKeyLength");
  }
  return raw;
};

export class SecretService {
  private readonly key: Buffer;

  constructor(options: SecretServiceOptions) {
    this.key = normalizeKey(options.key);
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [toBase64(iv), toBase64(tag), toBase64(encrypted)].join(".");
  }

  decrypt(payload: string): string {
    const [ivPart, tagPart, dataPart] = payload.split(".");
    if (!ivPart || !tagPart || !dataPart) {
      throw new Error("InvalidSecretPayload");
    }
    const iv = toBuffer(ivPart);
    const tag = toBuffer(tagPart);
    const data = toBuffer(dataPart);
    const decipher = crypto.createDecipheriv("aes-256-gcm", this.key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString("utf8");
  }

  static generateKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString("base64");
  }

  static encryptEnvValue(key: string, value: string): string {
    const service = new SecretService({ key });
    return `ENC:${service.encrypt(value)}`;
  }

  static decryptEnvValue(key: string, payload: string): string {
    if (!payload.startsWith("ENC:")) return payload;
    const service = new SecretService({ key });
    return service.decrypt(payload.slice(4));
  }
}
````

## File: src/shared/constants.ts
````typescript
export const DEFAULT_LOCK_TTL_MS = 5 * 60 * 1000;
export const DEFAULT_LOCK_RETRY_DELAY_MS = 500;
export const DEFAULT_LOCK_RETRY_ATTEMPTS = 20;
export const DEFAULT_LOCK_DIR = ".pwAutoTestnets/locks";

export const RUN_STATUS = {
  queued: "queued",
  running: "running",
  completed: "completed",
  failed: "failed",
  cancelled: "cancelled",
  needsReview: "needs_review"
} as const;

export const WALLET_DETECTION_TIMEOUT_MS = 2000;
export const WALLET_ACTION_TIMEOUT_MS = 15000;

export const WALLET_LOG_EVENTS = {
  detectStart: "wallet.detect.start",
  detectSuccess: "wallet.detect.success",
  detectFailure: "wallet.detect.failure",
  unlockStart: "wallet.unlock.start",
  unlockSuccess: "wallet.unlock.success",
  unlockFailure: "wallet.unlock.failure",
  connectStart: "wallet.connect.start",
  connectSuccess: "wallet.connect.success",
  connectFailure: "wallet.connect.failure",
  networkStart: "wallet.network.start",
  networkSuccess: "wallet.network.success",
  networkFailure: "wallet.network.failure"
} as const;

export const DEFAULT_RUN_MAX_ATTEMPTS = 3;
export const DEFAULT_QUEUE_WAIT_MS = 1000;
export const DEFAULT_QUEUE_POLL_INTERVAL_MS = 200;
export const DEFAULT_RETRY_DELAY_MS = 1500;
export const DEFAULT_ARTIFACTS_DIR = ".pwAutoTestnets/artifacts";

export const SCENARIO_LOG_EVENTS = {
  start: "scenario.start",
  success: "scenario.success",
  failure: "scenario.failure"
} as const;

export const QUEUE_LOG_EVENTS = {
  enqueue: "queue.enqueue",
  dequeue: "queue.dequeue",
  ack: "queue.ack"
} as const;

export const SCHEDULER_LOG_EVENTS = {
  promoteStart: "scheduler.promote.start",
  promoteSkip: "scheduler.promote.skip",
  promoteEnqueue: "scheduler.promote.enqueue",
  promoteDone: "scheduler.promote.done"
} as const;

export const WORKER_LOG_EVENTS = {
  runStart: "worker.run.start",
  runSuccess: "worker.run.success",
  runFailure: "worker.run.failure",
  runCancelled: "worker.run.cancelled",
  needsReview: "worker.run.needs_review",
  retryScheduled: "worker.retry.scheduled",
  artifactsCaptured: "worker.artifacts.captured"
} as const;
````

## File: src/shared/errors.ts
````typescript
import type { RunErrorCode } from "./types.ts";

export type ErrorCategory = "transient" | "permanent" | "needs_review";

export type AppErrorOptions = {
  code: RunErrorCode;
  category: ErrorCategory;
  cause?: unknown;
};

export class AppError extends Error {
  readonly code: RunErrorCode;
  readonly category: ErrorCategory;
  readonly cause?: unknown;

  constructor(message: string, options: AppErrorOptions) {
    super(message);
    this.code = options.code;
    this.category = options.category;
    this.cause = options.cause;
  }
}

export class NeedsReviewError extends AppError {
  constructor(message: string, code: RunErrorCode, cause?: unknown) {
    super(message, { code, category: "needs_review", cause });
  }
}

export const classifyError = (
  error: unknown
): { category: ErrorCategory; code: RunErrorCode; message: string } => {
  if (error instanceof AppError) {
    return {
      category: error.category,
      code: error.code,
      message: error.message
    };
  }
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("wallet") && lower.includes("unknown")) {
    return { category: "needs_review", code: "wallet_unknown_state", message };
  }
  if (lower.includes("selectortodo")) {
    return { category: "needs_review", code: "wallet_selector_todo", message };
  }
  if (lower.includes("timeout") && lower.includes("waiting for selector")) {
    return { category: "permanent", code: "ui_element_missing", message };
  }
  if (lower.includes("timeout") || lower.includes("econn") || lower.includes("network") || lower.includes("502") || lower.includes("503") || lower.includes("504")) {
    return { category: "transient", code: "network_timeout", message };
  }
  if (lower.includes("429") || lower.includes("too many requests") || lower.includes("rate limit")) {
    return { category: "transient", code: "rate_limit_exceeded", message };
  }
  if (lower.includes("401") || lower.includes("403") || lower.includes("unauthorized") || lower.includes("forbidden")) {
    return { category: "permanent", code: "auth_failed", message };
  }
  return { category: "permanent", code: "unknown", message };
};
````

## File: src/shared/logger.ts
````typescript
import { LogLevel } from "./types.ts";
import type { LogEvent, Logger } from "./types.ts";

type LoggerBase = {
  context?: Record<string, unknown>;
};

export const createConsoleLogger = (base: LoggerBase = {}): Logger => {
  const log = (event: Omit<LogEvent, "time"> & { time?: string }) => {
    const payload = {
      time: event.time ?? new Date().toISOString(),
      level: event.level,
      name: event.name,
      message: event.message,
      context: {
        ...base.context,
        ...event.context
      }
    };
    console.log(JSON.stringify(payload));
  };

  return {
    log,
    debug: (name, message, context) =>
      log({ level: LogLevel.debug, name, message, context }),
    info: (name, message, context) =>
      log({ level: LogLevel.info, name, message, context }),
    warn: (name, message, context) =>
      log({ level: LogLevel.warn, name, message, context }),
    error: (name, message, context) =>
      log({ level: LogLevel.error, name, message, context })
  };
};
````

## File: src/shared/observability.ts
````typescript
export type ObservabilityEvent = {
  name: string;
  time: string;
  payload?: Record<string, unknown>;
  metrics?: {
    durationMs?: number;
    errorCount?: number;
    successCount?: number;
  };
};

export type ObservabilityHooks = {
  onEvent(event: ObservabilityEvent): void;
  recordMetric(name: string, value: number, tags?: Record<string, string>): void;
};

export const createNoopObservability = (): ObservabilityHooks => ({
  onEvent: () => { },
  recordMetric: () => { }
});
````

## File: src/shared/retry.ts
````typescript
import type { RunErrorCode } from "./types.ts";

type RetryPolicyOptions = {
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterRatio?: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const computeRetryDelayMs = (attempt: number, errorCode?: RunErrorCode, options: RetryPolicyOptions = {}) => {
  let base = options.baseDelayMs ?? 2000;
  if (errorCode === "rate_limit_exceeded") {
    base = Math.max(base, 15000); // Backoff greatly on rate limit
  }
  const max = options.maxDelayMs ?? 60_000;
  const jitterRatio = options.jitterRatio ?? 0.2;
  const exponential = base * Math.pow(2, Math.max(0, attempt - 1));
  const jitter = exponential * jitterRatio * (Math.random() - 0.5) * 2;
  return clamp(Math.round(exponential + jitter), base, max);
};
````

## File: src/shared/types.ts
````typescript
export type ISODateString = string;
export type ID = string;

export type NetworkId = ID;
export type ProfileId = ID;
export type RunId = ID;

export type RunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "needs_review";

export type NetworkConfig = {
  id: NetworkId;
  name: string;
  rpcUrl: string;
  chainId: number;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type BrowserProfile = {
  id: ProfileId;
  label: string;
  userDataDir: string;
  proxyUrl?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type ProfileLockState = {
  profileId: ProfileId;
  ownerId: ID;
  lockToken: ID;
  host: string;
  pid: number;
  acquiredAt: ISODateString;
  expiresAt: ISODateString;
  updatedAt: ISODateString;
};

export type TestRun = {
  id: RunId;
  networkId: NetworkId;
  profileId: ProfileId;
  status: RunStatus;
  startedAt: ISODateString;
  finishedAt?: ISODateString;
  errorMessage?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type BrowserSession = {
  id: ID;
  profileId: ProfileId;
  createdAt: ISODateString;
  metadata?: Record<string, unknown>;
};

export type BrowserLaunchOptions = {
  headless?: boolean;
  extraArgs?: string[];
  proxyUrl?: string;
};

export type BrowserDriver = {
  launch(profile: BrowserProfile, options?: BrowserLaunchOptions): Promise<BrowserSession>;
  close(session: BrowserSession): Promise<void>;
};

export type LocatorHandle = {
  isVisible(options?: { timeout?: number }): Promise<boolean>;
  click(options?: { timeout?: number }): Promise<void>;
  fill(value: string, options?: { timeout?: number }): Promise<void>;
};

export type PageHandle = {
  locator(selector: string): LocatorHandle;
  waitForTimeout(ms: number): Promise<void>;
  evaluate<T>(pageFunction: () => T | Promise<T>): Promise<T>;
  screenshot(options?: { path?: string }): Promise<Buffer>;
  content(): Promise<string>;
  startTracing(): Promise<void>;
  stopTracing(path: string): Promise<void>;
  getConsoleLogs(): string[];
  getNetworkLogs(): string[];
};

export const LogLevel = {
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error"
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export type LogEvent = {
  level: LogLevel;
  name: string;
  message: string;
  time: ISODateString;
  context?: Record<string, unknown>;
};

export type Logger = {
  log(event: Omit<LogEvent, "time"> & { time?: ISODateString }): void;
  debug(name: string, message: string, context?: Record<string, unknown>): void;
  info(name: string, message: string, context?: Record<string, unknown>): void;
  warn(name: string, message: string, context?: Record<string, unknown>): void;
  error(name: string, message: string, context?: Record<string, unknown>): void;
};

export const WalletKind = {
  MetaMask: "metamask",
  Rabby: "rabby"
} as const;

export type WalletKind = (typeof WalletKind)[keyof typeof WalletKind];

export type WalletDetection = {
  kind: WalletKind;
  confidence: number;
  reason?: string;
};

export type WalletContext = {
  logger: Logger;
  timeoutMs?: number;
};

export type WalletConnectionRequest = {
  chainId: number;
};

export type WalletController = {
  kind: WalletKind;
  detect(page: PageHandle, context: WalletContext): Promise<WalletDetection | null>;
  unlock(page: PageHandle, password: string, context: WalletContext): Promise<void>;
  connect(page: PageHandle, context: WalletContext): Promise<void>;
  ensureNetwork(page: PageHandle, request: WalletConnectionRequest, context: WalletContext): Promise<void>;
};

export type ScenarioId = ID;

export type ScenarioRun = {
  id: RunId;
  scenarioId: ScenarioId;
  networkId: NetworkId;
  profileId: ProfileId;
  attempt: number;
};

export type ScenarioContext = {
  logger: Logger;
  page: PageHandle;
  run: ScenarioRun;
  artifacts: ArtifactWriter;
  abortSignal?: AbortSignal; // Added task cancellation support
};

export type Scenario = {
  id: ScenarioId;
  title: string;
  run(context: ScenarioContext): Promise<void>;
};

export type ScenarioRegistry = {
  register(scenario: Scenario): void;
  get(id: ScenarioId): Scenario;
  list(): Scenario[];
};

export type QueueEnqueueOptions = {
  delayMs?: number;
};

export type QueueDequeueOptions = {
  waitMs?: number;
};

export type QueueItem<T> = {
  id: ID;
  payload: T;
  enqueuedAt: ISODateString;
  availableAt: ISODateString;
};

export type Queue<T> = {
  enqueue(payload: T, options?: QueueEnqueueOptions): Promise<QueueItem<T>>;
  dequeue(options?: QueueDequeueOptions): Promise<QueueItem<T> | null>;
  ack(itemId: ID): Promise<void>;
};

export type RedisQueueClient = {
  lpush(key: string, value: string): Promise<number>;
  rpop(key: string): Promise<string | null>;
};

export type RunQueuePayload = {
  runId: RunId;
  scenarioId: ScenarioId;
  attempt: number;
};

export type ArtifactRecord = {
  screenshotPath?: string;
  htmlPath?: string;
  tracePath?: string;
  consoleLogsPath?: string;
  networkLogsPath?: string;
  metadataPath?: string;
};

export type ArtifactWriter = {
  captureScreenshot(page: PageHandle, runId: RunId, name: string): Promise<string>;
  captureHtml(page: PageHandle, runId: RunId, name: string): Promise<string>;
  captureTrace(page: PageHandle, runId: RunId, name: string): Promise<string>;
  captureLogs(page: PageHandle, runId: RunId, name: string): Promise<{ consolePath: string; networkPath: string }>;
  captureMetadata(runId: RunId, name: string, metadata: Record<string, unknown>): Promise<string>;
};

export type RunRecord = {
  id: RunId;
  scenarioId: ScenarioId;
  networkId: NetworkId;
  profileId: ProfileId;
  status: RunStatus;
  attempt: number;
  maxAttempts: number;
  nextAttemptAt?: ISODateString;
  lastErrorCode?: RunErrorCode;
  lastErrorMessage?: string;
  lastErrorAt?: ISODateString;
  cancelledAt?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type RunErrorCode =
  | "wallet_unknown_state"
  | "wallet_popup_missing"
  | "wallet_selector_todo"
  | "browser_launch_failed"
  | "network_timeout"
  | "rate_limit_exceeded"
  | "auth_failed"
  | "ui_element_missing"
  | "scenario_failed"
  | "run_cancelled"
  | "unknown";

export type RunStore = {
  getRun(runId: RunId): Promise<RunRecord | null>;
  listPendingRuns(limit: number, now?: ISODateString): Promise<RunRecord[]>;
  listRuns(options?: { status?: RunStatus; limit?: number }): Promise<RunRecord[]>;
  createRun(run: RunRecord): Promise<void>;
  markRunning(runId: RunId): Promise<void>;
  markQueued(
    runId: RunId,
    errorMessage?: string,
    artifacts?: ArtifactRecord,
    nextAttemptAt?: ISODateString,
    errorCode?: RunErrorCode
  ): Promise<void>;
  markNeedsReview(runId: RunId, errorMessage?: string, artifacts?: ArtifactRecord, errorCode?: RunErrorCode): Promise<void>;
  markCancelled(runId: RunId, reason?: string): Promise<void>;
  markFailed(runId: RunId, errorMessage: string, artifacts?: ArtifactRecord): Promise<void>;
  markCompleted(runId: RunId): Promise<void>;
  incrementAttempt(runId: RunId): Promise<number>;
};

export type PageFactory = {
  create(profileId: ProfileId): Promise<PageHandle>;
  close(page: PageHandle): Promise<void>;
};
````

## File: tests/scheduler-queue.test.ts
````typescript
import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryQueue } from "../src/core/queue/InMemoryQueue.ts";
import { Scheduler } from "../src/core/scheduler/Scheduler.ts";
import type { Logger, RunQueuePayload, RunRecord, RunStatus } from "../src/shared/types.ts";
import type { RunRepository } from "../src/data/repositories/RunRepository.ts";

const createLogger = (): Logger => ({
  log: () => { },
  debug: () => { },
  info: () => { },
  warn: () => { },
  error: () => { }
});

class InMemoryRunStore implements RunRepository {
  private readonly runs: Map<string, RunRecord>;

  constructor(initial: RunRecord[]) {
    this.runs = new Map(initial.map((run) => [run.id, run]));
  }

  async getRun(runId: string): Promise<RunRecord | null> {
    return this.runs.get(runId) ?? null;
  }

  async listPendingRuns(limit: number, _now?: string): Promise<RunRecord[]> {
    return Array.from(this.runs.values())
      .filter((run) => run.status === "queued")
      .slice(0, limit);
  }

  async listRuns(options?: { status?: RunStatus; limit?: number }): Promise<RunRecord[]> {
    const list = options?.status
      ? Array.from(this.runs.values()).filter((run) => run.status === options.status)
      : Array.from(this.runs.values());
    return list.slice(0, options?.limit ?? list.length);
  }

  async createRun(run: RunRecord): Promise<void> {
    this.runs.set(run.id, run);
  }

  async markRunning(runId: string): Promise<void> {
    const run = this.runs.get(runId);
    if (run) {
      delete run.nextAttemptAt;
      run.status = "running";
    }
  }

  async markQueued(runId: string, errorMessage?: string, _artifacts?: unknown, nextAttemptAt?: string): Promise<void> {
    const run = this.runs.get(runId);
    if (run) {
      if (errorMessage !== undefined) run.lastErrorMessage = errorMessage;
      if (nextAttemptAt !== undefined) run.nextAttemptAt = nextAttemptAt;
      run.status = "queued";
    }
  }

  async markNeedsReview(runId: string, errorMessage?: string): Promise<void> {
    const run = this.runs.get(runId);
    if (run) {
      if (errorMessage !== undefined) run.lastErrorMessage = errorMessage;
      run.status = "needs_review";
    }
  }

  async markCancelled(runId: string, reason?: string): Promise<void> {
    const run = this.runs.get(runId);
    if (run) {
      if (reason !== undefined) run.lastErrorMessage = reason;
      run.status = "cancelled";
      run.cancelledAt = new Date().toISOString();
    }
  }

  async markFailed(runId: string, errorMessage?: string): Promise<void> {
    const run = this.runs.get(runId);
    if (run) {
      if (errorMessage !== undefined) run.lastErrorMessage = errorMessage;
      run.status = "failed";
    }
  }

  async markCompleted(runId: string): Promise<void> {
    const run = this.runs.get(runId);
    if (run) {
      this.runs.set(runId, { ...run, status: "completed" });
    }
  }

  async incrementAttempt(runId: string): Promise<number> {
    const run = this.runs.get(runId);
    if (!run) {
      return 0;
    }
    const next = run.attempt + 1;
    this.runs.set(runId, { ...run, attempt: next });
    return next;
  }
}

const createRun = (id: string, attempt: number, maxAttempts: number): RunRecord => {
  const now = new Date().toISOString();
  return {
    id,
    scenarioId: "connect-wallet",
    networkId: "sepolia",
    profileId: "profile-1",
    status: "queued",
    attempt,
    maxAttempts,
    createdAt: now,
    updatedAt: now
  };
};

test("Scheduler promotes pending runs into queue", async () => {
  const store = new InMemoryRunStore([createRun("run-1", 0, 3)]);
  const queue = new InMemoryQueue<RunQueuePayload>({ logger: createLogger() });
  const scheduler = new Scheduler({ store, queue, logger: createLogger(), batchSize: 10 });

  const promoted = await scheduler.promotePendingRuns();
  const item = await queue.dequeue();

  assert.equal(promoted, 1);
  assert.equal(item?.payload.runId, "run-1");
});

test("Scheduler skips runs over max attempts", async () => {
  const store = new InMemoryRunStore([createRun("run-2", 3, 3)]);
  const queue = new InMemoryQueue<RunQueuePayload>({ logger: createLogger() });
  const scheduler = new Scheduler({ store, queue, logger: createLogger(), batchSize: 10 });

  const promoted = await scheduler.promotePendingRuns();
  const updated = await store.getRun("run-2");

  assert.equal(promoted, 0);
  assert.equal(updated?.status, "failed");
});
````

## File: tests/wallet-detector.test.ts
````typescript
import assert from "node:assert/strict";
import test from "node:test";
import { WalletDetector } from "../src/core/wallet/WalletDetector.ts";
import { WalletKind } from "../src/shared/types.ts";
import type { Logger, PageHandle, WalletController } from "../src/shared/types.ts";

const createLogger = (): Logger => ({
  log: () => { },
  debug: () => { },
  info: () => { },
  warn: () => { },
  error: () => { }
});

const createController = (
  kind: WalletKind,
  confidence: number,
  throws = false
): WalletController => ({
  kind,
  detect: async () => {
    if (throws) {
      throw new Error("DetectorError");
    }
    return { kind, confidence };
  },
  unlock: async () => { },
  connect: async () => { },
  ensureNetwork: async () => { }
});

const createPage = (): PageHandle => ({
  locator: () => ({ isVisible: async () => true, click: async () => { }, fill: async () => { } }),
  waitForTimeout: async () => { },
  evaluate: async <T>() => undefined as T,
  screenshot: async () => Buffer.from(""),
  content: async () => "",
  startTracing: async () => { },
  stopTracing: async () => { },
  getConsoleLogs: () => [],
  getNetworkLogs: () => []
});

test("WalletDetector returns best detection", async () => {
  const detector = new WalletDetector(
    [createController(WalletKind.MetaMask, 0.7), createController(WalletKind.Rabby, 0.9)],
    { logger: createLogger(), timeoutMs: 1000 }
  );
  const result = await detector.detect(createPage());
  assert.equal(result?.kind, WalletKind.Rabby);
});

test("WalletDetector tolerates controller errors", async () => {
  const detector = new WalletDetector(
    [createController(WalletKind.MetaMask, 0.6, true), createController(WalletKind.Rabby, 0.8)],
    { logger: createLogger(), timeoutMs: 1000 }
  );
  const result = await detector.detect(createPage());
  assert.equal(result?.kind, WalletKind.Rabby);
});
````

## File: .env.example
````
APP_PORT=3000
APP_BASE_URL=http://localhost:3000
APP_LOG_LEVEL=info
QUEUE_DRIVER=in-memory
REDIS_URL=redis://localhost:6379
APP_SECRET_KEY=
````

## File: .gitignore
````
# Dependencies
node_modules/

# Build output
dist/

# Environment files (NEVER commit these)
.env
.env.local
.env.*.local

# Debug files
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# Temp / scratch files
tmp.json
src/debug.ts
src/check_clock.ts
src/derive_api_keys.ts
src/verify_fix.ts
src/raw_ws_debug.ts
src/test_length.ts
src/test_split.ts

# TypeScript cache
*.tsbuildinfo

# IDE
.vscode/
.idea/
````

## File: docker-compose.yml
````yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: pw-autotestnets-app
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - redis
    # Playwright requires a larger shared memory size to avoid crashes
    shm_size: '2gb'
    # Optional: Enable defining custom seccomp profile or IPC for better browser isolation if needed
    # ipc: host

  redis:
    image: redis:7-alpine
    container_name: pw-autotestnets-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_data:
````

## File: Dockerfile
````dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Environment variables
ENV NODE_ENV=development
ENV HOST=0.0.0.0
ENV PORT=3000

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application (assuming npm run dev starts the app)
CMD ["npm", "run", "dev"]
````

## File: package.json
````json
{
  "name": "pw-auto-testnets",
  "version": "1.0.0",
  "description": "Production hardening for browser automation and testnets",
  "main": "src/index.ts",
  "type": "module",
  "scripts": {
    "dev": "tsx src/index.ts",
    "worker": "tsx src/core/worker/Worker.ts",
    "dashboard": "tsx src/dashboard/index.ts",
    "test": "node --loader tsx --test tests/**/*.test.ts",
    "lint": "tsc --noEmit",
    "build": "tsc"
  },
  "dependencies": {
    "playwright": "^1.40.0",
    "ioredis": "^5.3.2",
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "zod": "^3.22.4",
    "eventsource": "^2.0.2"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.5",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "tsx": "^4.7.0",
    "nodemon": "^3.0.2",
    "@playwright/test": "^1.40.0"
  }
}
````

## File: production-hardening.txt
````
1. Р’С‹РЅРµСЃС‚Рё СЃРµРєСЂРµС‚С‹ РІ СЃРµРєСЂРµС‚-РјРµРЅРµРґР¶РµСЂ Рё Р·Р°РїСЂРµС‚РёС‚СЊ С…СЂР°РЅРµРЅРёРµ РІ .env
2. РћРіСЂР°РЅРёС‡РёС‚СЊ РґРѕСЃС‚СѓРї Рє API РїРѕ СЃРµС‚Рё, РІРєР»СЋС‡РёС‚СЊ rate limit Рё audit Р»РѕРіРёСЂРѕРІР°РЅРёРµ
3. Р’РєР»СЋС‡РёС‚СЊ health-check endpoints Рё Р°Р»РµСЂС‚С‹ РїРѕ РѕС‡РµСЂРµРґРё/СЂРµС‚СЂР°СЏРј
4. Р”РѕР±Р°РІРёС‚СЊ СЂРµР·РµСЂРІРёСЂРѕРІР°РЅРёРµ Р°СЂС‚РµС„Р°РєС‚РѕРІ РІ object storage
5. РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ Redis/DB c С‚СЂР°РЅР·Р°РєС†РёСЏРјРё РґР»СЏ RunStore
6. Р’РєР»СЋС‡РёС‚СЊ TTL Рё РѕС‡РёСЃС‚РєСѓ СЃС‚Р°СЂС‹С… РїСЂРѕС„РёР»РµР№/Р°СЂС‚РµС„Р°РєС‚РѕРІ
7. Р’РєР»СЋС‡РёС‚СЊ read-only СЂРµР¶РёРј РґР»СЏ dashboard СЃ RBAC
````

## File: project-tree.txt
````
/Users/tera/code/pwAutoTestnets
в”њв”Ђв”Ђ architecture
в”‚   в””в”Ђв”Ђ overview.json
в”њв”Ђв”Ђ database
в”‚   в””в”Ђв”Ђ schema.sql
в””в”Ђв”Ђ src
    в”њв”Ђв”Ђ core
    в”‚   в””в”Ђв”Ђ browser
    в”‚       в”њв”Ђв”Ђ BrowserManager.ts
    в”‚       в””в”Ђв”Ђ ProfileLock.ts
    в””в”Ђв”Ђ shared
        в”њв”Ђв”Ђ constants.ts
        в””в”Ђв”Ђ types.ts
````

## File: README.md
````markdown
# pwAutoTesnets
````

## File: run-guide.txt
````
1. РЈСЃС‚Р°РЅРѕРІРёС‚СЊ Node.js v24+
2. Р—Р°РїРѕР»РЅРёС‚СЊ .env РїРѕ РїСЂРёРјРµСЂСѓ .env.example
3. Р“РµРЅРµСЂРёСЂРѕРІР°С‚СЊ seed SQL: node --experimental-strip-types scripts/seed.ts > database/seed.sql
4. РџСЂРѕРіРЅР°С‚СЊ unit tests: node --test --experimental-strip-types tests/*.test.ts
5. Р—Р°РїСѓСЃРє РІРѕСЂРєРµСЂР° Рё РїР»Р°РЅРёСЂРѕРІС‰РёРєР° РІС‹РїРѕР»РЅСЏРµС‚СЃСЏ С‡РµСЂРµР· СЃРѕР±СЃС‚РІРµРЅРЅС‹Р№ bootstrap (РЅРµ РІРєР»СЋС‡РµРЅ)
````

## File: selector_guide.md
````markdown
# Selector Adaptation Guide

Р­С‚РѕС‚ РґРѕРєСѓРјРµРЅС‚ РѕРїРёСЃС‹РІР°РµС‚ Р»СѓС‡С€РёРµ РїСЂР°РєС‚РёРєРё Рё РїРѕРґС…РѕРґС‹ Рє СЂР°Р±РѕС‚Рµ СЃ СЃРµР»РµРєС‚РѕСЂР°РјРё РґР»СЏ СЂР°Р·Р»РёС‡РЅС‹С… web3 РєРѕС€РµР»СЊРєРѕРІ, РјРµС‚РѕРґС‹ РёС… РѕС‚Р»Р°РґРєРё Рё РѕР±РЅРѕРІР»РµРЅРёСЏ.

## РљР°Рє Р°РґР°РїС‚РёСЂРѕРІР°С‚СЊ СЃРµР»РµРєС‚РѕСЂС‹ РїРѕРґ СЂР°Р·РЅС‹Рµ РІРµСЂСЃРёРё MetaMask
MetaMask С‡Р°СЃС‚Рѕ РѕР±РЅРѕРІР»СЏРµС‚ DOM, С‡С‚Рѕ РјРѕР¶РµС‚ РїСЂРёРІРѕРґРёС‚СЊ Рє РїРѕР»РѕРјРєР°Рј Р¶РµСЃС‚РєРёС… (xpath/СЃС‚СЂСѓРєС‚СѓСЂРЅС‹С…) СЃРµР»РµРєС‚РѕСЂРѕРІ.
1. **РСЃРїРѕР»СЊР·СѓР№С‚Рµ `data-testid`**: Р•СЃР»Рё СЂР°Р·СЂР°Р±РѕС‚С‡РёРєРё MetaMask РґРѕР±Р°РІР»СЏСЋС‚ С‚РµСЃС‚РѕРІС‹Рµ Р°С‚СЂРёР±СѓС‚С‹ (`data-testid`), РІСЃРµРіРґР° РёСЃРїРѕР»СЊР·СѓР№С‚Рµ РёС… (`[data-testid="page-container-footer-next"]`).
2. **РўРµРєСЃС‚РѕРІС‹Рµ СЃРµР»РµРєС‚РѕСЂС‹ РєР°Рє fallback**: РСЃРїРѕР»СЊР·СѓР№С‚Рµ РїРѕРёСЃРє РїРѕ С‚РµРєСЃС‚Сѓ (`hasText: "Next"`, `text="Confirm"`) РѕСЃС‚РѕСЂРѕР¶РЅРѕ, РѕР±СЂР°С‰Р°Р№С‚Рµ РІРЅРёРјР°РЅРёРµ РЅР° Р»РѕРєР°Р»РёР·Р°С†РёСЋ. Р•СЃР»Рё РєРѕС€РµР»РµРє РѕС‚РєСЂС‹РІР°РµС‚СЃСЏ РЅР° РґСЂСѓРіРѕРј СЏР·С‹РєРµ, С‚РµРєСЃС‚РѕРІС‹Р№ СЃРµР»РµРєС‚РѕСЂ СѓРїР°РґРµС‚.
3. **РР·Р±РµРіР°Р№С‚Рµ Р¶РµСЃС‚РєРёС… СЃС‚СЂСѓРєС‚СѓСЂРЅС‹С… РїСЂРёРІСЏР·РѕРє**: РСЃРєР»СЋС‡РёС‚Рµ СЃРµР»РµРєС‚РѕСЂС‹ РІСЂРѕРґРµ `div > div > span:nth-child(2)`. РС‰РёС‚Рµ СЌР»РµРјРµРЅС‚ РїРѕ СЂРѕР»Рё, РЅР°РїСЂРёРјРµСЂ: `button:has-text("Connect")`.
4. **РЈС‡РёС‚С‹РІР°Р№С‚Рµ Рђ/Р’ С‚РµСЃС‚С‹**: РЎСѓС‰РµСЃС‚РІСѓСЋС‚ РІРµСЂСЃРёРё, РіРґРµ СЌРєСЂР°РЅ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ РјРѕР¶РµС‚ Р±С‹С‚СЊ СЂР°Р·РґРµР»РµРЅ РЅР° РґРІР° С€Р°РіР°. РћР¶РёРґР°Р№С‚Рµ РѕР±Р° РІР°СЂРёР°РЅС‚Р° С‡РµСЂРµР· `Promise.race` РёР»Рё РјРµС‚РѕРґ `.or()` РІ Playwright.

## РљР°Рє Р°РґР°РїС‚РёСЂРѕРІР°С‚СЊ СЃРµР»РµРєС‚РѕСЂС‹ РїРѕРґ СЂР°Р·РЅС‹Рµ РІРµСЂСЃРёРё Rabby
Rabby Wallet РёРјРµРµС‚ СЃР»РѕР¶РЅС‹Р№ UI СЃ Р±РѕР»СЊС€РёРј РєРѕР»РёС‡РµСЃС‚РІРѕРј РІСЃРїР»С‹РІР°СЋС‰РёС… РѕРєРѕРЅ Рё РјРѕРґР°Р»РѕРє РІРЅСѓС‚СЂРё СЃР°РјРѕРіРѕ СЂР°СЃС€РёСЂРµРЅРёСЏ.
1. **РўРµРЅРё Рё Shadow DOM**: РЈР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ СЃРµР»РµРєС‚РѕСЂС‹ СЃРїРѕСЃРѕР±РЅС‹ РїСЂРѕРЅРёРєР°С‚СЊ РІ РІРѕР·РјРѕР¶РЅС‹Рµ web-components, РµСЃР»Рё Rabby РЅР°С‡РЅРµС‚ РёС… РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ.
2. **Р Р°Р±РѕС‚Р° СЃ С„РѕРєСѓСЃРѕРј**: Rabby С‡Р°СЃС‚Рѕ С‚СЂРµР±СѓРµС‚ СЏРІРЅРѕРіРѕ СЃР±СЂРѕСЃР° С„РѕРєСѓСЃР° РёР»Рё РєР»РёРєР° РІ СЂР°Р±РѕС‡СѓСЋ РѕР±Р»Р°СЃС‚СЊ РїРµСЂРµРґ РІРІРѕРґРѕРј РїР°СЂРѕР»СЏ.
3. **Button variants**: Rabby РёСЃРїРѕР»СЊР·СѓРµС‚ РјРЅРѕРіРѕ СЃС‚РёР»РёР·РѕРІР°РЅРЅС‹С… РєРЅРѕРїРѕРє. Р›СѓС‡С€Рµ РІСЃРµРіРѕ РїСЂРёРІСЏР·С‹РІР°С‚СЊСЃСЏ Рє СѓРЅРёРєР°Р»СЊРЅС‹Рј РёРєРѕРЅРєР°Рј РёР»Рё РєР»Р°СЃСЃР°Рј, РЅРµРїРѕСЃСЂРµРґСЃС‚РІРµРЅРЅРѕ РѕС‚РІРµС‡Р°СЋС‰РёРј Р·Р° Р»РѕРіРёРєСѓ (РЅР°РїСЂРёРјРµСЂ, `button.rabby-btn-primary`).
4. **Р’СЃРїР»С‹РІР°СЋС‰РёРµ РїСЂРµРґСѓРїСЂРµР¶РґРµРЅРёСЏ**: Rabby Р»СЋР±РёС‚ РїРѕРєР°Р·С‹РІР°С‚СЊ СЃРµРєСЊСЋСЂРёС‚Рё-РїСЂРµРґСѓРїСЂРµР¶РґРµРЅРёСЏ. Р’Р°С€ СЃРєСЂРёРїС‚ РґРѕР»Р¶РµРЅ РїСЂРѕРІРµСЂСЏС‚СЊ РЅР°Р»РёС‡РёРµ РєРЅРѕРїРєРё "Ignore" РёР»Рё "Proceed anyway" РїРµСЂРµРґ С‚РµРј, РєР°Рє РЅР°Р¶Р°С‚СЊ РѕСЃРЅРѕРІРЅСѓСЋ РєРЅРѕРїРєСѓ "Confirm".

## РљР°Рє РґРµР±Р°Р¶РёС‚СЊ popup pages
РћС‚Р»Р°РґРєР° СЃС‚СЂР°РЅРёС† СЂР°СЃС€РёСЂРµРЅРёР№ (popup) РѕС‚Р»РёС‡Р°РµС‚СЃСЏ РѕС‚ РѕР±С‹С‡РЅС‹С… РІРµР±-СЃС‚СЂР°РЅРёС†.
1. **РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ Playwright Inspector**: Р—Р°РїСѓСЃРєР°Р№С‚Рµ РІС‹РїРѕР»РЅРµРЅРёРµ СЃ `PWDEBUG=1`.
2. **РџРѕР»СѓС‡РµРЅРёРµ URL СЂР°СЃС€РёСЂРµРЅРёСЏ**: Р’ Playwright РІС‹ РјРѕР¶РµС‚Рµ РЅР°Р№С‚Рё background page РёР»Рё service worker СЂР°СЃС€РёСЂРµРЅРёСЏ Рё РїРµСЂРµР№С‚Рё РЅР° РµРіРѕ URL (РЅР°РїСЂРёРјРµСЂ, `chrome-extension://<id>/popup.html`). Р­С‚Рѕ РїРѕР·РІРѕР»РёС‚ РѕС‚РєСЂС‹С‚СЊ popup РєР°Рє РѕР±С‹С‡РЅСѓСЋ РІРєР»Р°РґРєСѓ РЅР° РІРµСЃСЊ СЌРєСЂР°РЅ, С‡С‚Рѕ СѓРїСЂРѕС‰Р°РµС‚ РёРЅСЃРїРµРєС‚РёСЂРѕРІР°РЅРёРµ С‡РµСЂРµР· DevTools.
3. **РџР°СѓР·С‹ РІ РєРѕРґРµ**: Р’СЃС‚Р°РІР»СЏР№С‚Рµ `await page.pause()` РїСЂСЏРјРѕ РїРµСЂРµРґ РјРѕРјРµРЅС‚РѕРј, РіРґРµ СЃРµР»РµРєС‚РѕСЂ РїР°РґР°РµС‚, С‡С‚РѕР±С‹ РёСЃСЃР»РµРґРѕРІР°С‚СЊ DOM РІСЂСѓС‡РЅСѓСЋ.
4. **РЎРєСЂРёРЅС€РѕС‚С‹ Рё HTML-РґР°РјРїС‹**: РќР°СЃС‚СЂРѕР№С‚Рµ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёР№ РґР°РјРї DOM Рё СЃРєСЂРёРЅС€РѕС‚, РµСЃР»Рё СЌР»РµРјРµРЅС‚ РЅРµ РЅР°Р№РґРµРЅ Р·Р° РѕС‚РІРµРґРµРЅРЅС‹Р№ С‚Р°Р№РјР°СѓС‚.

## РљР°Рє Р»РѕРіРёСЂРѕРІР°С‚СЊ unknown wallet states
РљРѕРіРґР° РєРѕС€РµР»РµРє РїРµСЂРµС…РѕРґРёС‚ РІ СЃРѕСЃС‚РѕСЏРЅРёРµ, РЅРµ РѕРїРёСЃР°РЅРЅРѕРµ РІ РІР°С€РёС… СЃС†РµРЅР°СЂРёСЏС… (РЅР°РїСЂРёРјРµСЂ, РЅРѕРІС‹Р№ СЌРєСЂР°РЅ РѕРЅР±РѕСЂРґРёРЅРіР° РёР»Рё РєСЂРёС‚РёС‡РµСЃРєР°СЏ РѕС€РёР±РєР° РЅРѕРґС‹):
1. Р’С‹Р±СЂР°СЃС‹РІР°Р№С‚Рµ [NeedsReviewError](cci:2://file:///Users/tera/code/pwAutoTestnets/src/shared/errors.ts:23:0-27:1) СЃ РєРѕРґРѕРј `wallet_unknown_state`.
2. РћР±СЏР·Р°С‚РµР»СЊРЅРѕ СЃРѕС…СЂР°РЅСЏР№С‚Рµ СЃРєСЂРёРЅС€РѕС‚ Рё РґР°РјРї HTML РґРµСЂРµРІР° СЃС‚СЂР°РЅРёС†С‹ РїРµСЂРµРґ Р·Р°РєСЂС‹С‚РёРµРј Р±СЂР°СѓР·РµСЂР°. РђСЂС‚РµС„Р°РєС‚С‹ РґРѕР»Р¶РЅС‹ Р±С‹С‚СЊ РїСЂРёРІСЏР·Р°РЅС‹ Рє `runId`.
3. Р’ Р»РѕРіР°С… С„РёРєСЃРёСЂСѓР№С‚Рµ URL СЃС‚СЂР°РЅРёС†С‹ РєРѕС€РµР»СЊРєР° Рё С‚РµРєСЃС‚С‹ РЅРµСЃРєРѕР»СЊРєРёС… РєР»СЋС‡РµРІС‹С… СЌР»РµРјРµРЅС‚РѕРІ РЅР° СЌРєСЂР°РЅРµ, С‡С‚РѕР±С‹ РїРѕРЅСЏС‚СЊ РєРѕРЅС‚РµРєСЃС‚ РїРѕ Р»РѕРіР°Рј Р±РµР· РїСЂРѕРІРµСЂРєРё СЃРєСЂРёРЅС€РѕС‚РѕРІ.

## РљР°Рє Р±РµР·РѕРїР°СЃРЅРѕ РѕР±РЅРѕРІР»СЏС‚СЊ detector rules
1. **РќРµ СѓРґР°Р»СЏР№С‚Рµ СЃС‚Р°СЂС‹Рµ СЃРµР»РµРєС‚РѕСЂС‹ СЃСЂР°Р·Сѓ**: Р”РѕР±Р°РІР»СЏР№С‚Рµ РЅРѕРІС‹Рµ СЃРµР»РµРєС‚РѕСЂС‹ РєР°Рє РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕРµ СѓСЃР»РѕРІРёРµ. Р•СЃР»Рё СЃС‚СЂСѓРєС‚СѓСЂР° РёР·РјРµРЅРёР»Р°СЃСЊ, СЃС‚Р°СЂС‹Р№ СЃРµР»РµРєС‚РѕСЂ РїСЂРѕСЃС‚Рѕ РЅРµ СЃСЂР°Р±РѕС‚Р°РµС‚ СЃРѕ РІСЂРµРјРµРЅРµРј, Р° РЅРѕРІС‹Р№ РїРѕРґС…РІР°С‚РёС‚ СЂР°Р±РѕС‚Сѓ.
2. **РћС†РµРЅРєР° Confidence Score**: Р’ `WalletDetector` РёСЃРїРѕР»СЊР·СѓР№С‚Рµ РЅРµСЃРєРѕР»СЊРєРѕ РїСЂРёР·РЅР°РєРѕРІ РґР»СЏ СѓРІРµСЂРµРЅРЅРѕСЃС‚Рё. РќР°РїСЂРёРјРµСЂ, РЅР°Р»РёС‡РёРµ РіР»РѕР±Р°Р»СЊРЅРѕРіРѕ РѕР±СЉРµРєС‚Р° `window.ethereum` РґР°РµС‚ 0.5 Рє СѓРІРµСЂРµРЅРЅРѕСЃС‚Рё, Р° РЅР°Р»РёС‡РёРµ СЃРїРµС†РёС„РёС‡РЅРѕРіРѕ DOM СЌР»РµРјРµРЅС‚Р° РІРЅСѓС‚СЂРё РїСЂРѕРІР°Р№РґРµСЂР° РёР»Рё URL вЂ“ РµС‰Рµ 0.5.
3. **РР·РѕР»РёСЂРѕРІР°РЅРЅРѕРµ С‚РµСЃС‚РёСЂРѕРІР°РЅРёРµ**: РџРµСЂРµРґ РєРѕРјРјРёС‚РѕРј РїСЂРѕРІРµСЂСЊС‚Рµ РЅРѕРІС‹Рµ РїСЂР°РІРёР»Р° РЅР° СЃРѕС…СЂР°РЅРµРЅРЅС‹С… HTML-РґР°РјРїР°С… РѕС‚ СЃС‚Р°СЂС‹С… РІРµСЂСЃРёР№ (РјРѕРєРёСЂРѕРІР°РЅРёРµ).

## РљР°Рє РїРёСЃР°С‚СЊ fallback rules
Playwright РїСЂРµРґРѕСЃС‚Р°РІР»СЏРµС‚ СѓРґРѕР±РЅС‹Рµ РјРµС…Р°РЅРёР·РјС‹ РґР»СЏ СЃРѕР·РґР°РЅРёСЏ fallback С†РµРїРѕС‡РµРє.
1. РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ РєРѕРјР±РёРЅР°С†РёР№ `locator.or()`:
    ```typescript
    const confirmBtn = page.locator('button[data-testid="confirm-btn"]')
        .or(page.locator('button:has-text("Approve")'))
        .or(page.locator('.primary-button.confirm'));
    await confirmBtn.click();
    ```
2. РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ РјР°СЃСЃРёРІРѕРІ СЃ РєРѕСЂРѕС‚РєРёРј С‚Р°Р№РјР°СѓС‚РѕРј:
    ```typescript
    const selectors = ['#next', '.btn-next', 'button >> text="Next"'];
    for (const sel of selectors) {
      if (await page.locator(sel).isVisible({ timeout: 1000 })) {
         await page.locator(sel).click();
         break;
      }
    }
    ```

## РљР°Рє С‚РµСЃС‚РёСЂРѕРІР°С‚СЊ detector Р»РѕРєР°Р»СЊРЅРѕ
1. РџРѕРґРЅРёРјРёС‚Рµ С‡РёСЃС‚С‹Р№ РїСЂРѕС„РёР»СЊ Р±СЂР°СѓР·РµСЂР° РїСЂРѕРіСЂР°РјРјРЅРѕ (С‡РµСЂРµР· СЃРєСЂРёРїС‚ `scripts/local-test.ts`).
2. РџРѕРјРµСЃС‚РёС‚Рµ РІ РїСЂРѕС„РёР»СЊ РЅСѓР¶РЅС‹Рµ РІРµСЂСЃРёРё СЂР°СЃРїР°РєРѕРІР°РЅРЅС‹С… СЂР°СЃС€РёСЂРµРЅРёР№.
3. РќР°РїРёС€РёС‚Рµ РїСЂРѕСЃС‚РѕР№ CLI РёРЅС‚РµСЂС„РµР№СЃ, РєРѕС‚РѕСЂС‹Р№ Р±СѓРґРµС‚ РІС‹Р·С‹РІР°С‚СЊ РјРµС‚РѕРґС‹ РґРµС‚РµРєС‚РёСЂРѕРІР°РЅРёСЏ (`WalletManager.detect()`) Рё РїС‹С‚Р°С‚СЊСЃСЏ СЂР°Р·Р±Р»РѕРєРёСЂРѕРІР°С‚СЊ РєРѕС€РµР»РµРє, РїРµСЂРµРґР°РІ С‚РµСЃС‚РѕРІС‹Р№ РїР°СЂРѕР»СЊ.
4. РќР°СЃС‚СЂРѕР№С‚Рµ Р»РѕРєР°Р»СЊРЅС‹Р№ СЃРµСЂРІРµСЂ, РІРѕР·РІСЂР°С‰Р°СЋС‰РёР№ С„РёРєС‚РёРІРЅС‹Рµ dapp СЃС‚СЂР°РЅРёС†С‹, С‡С‚РѕР±С‹ СЃРєСЂРёРїС‚ РІС‹Р·С‹РІР°Р» РїРѕСЏРІР»РµРЅРёРµ popup, Рё РїСЂРѕРіРѕРЅРёС‚Рµ workflow РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ С‚СЂР°РЅР·Р°РєС†РёРё.
````

## File: tsconfig.json
````json
{
    "compilerOptions": {
        "target": "ESNext",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "strict": true,
        "skipLibCheck": true,
        "esModuleInterop": true,
        "allowImportingTsExtensions": true,
        "noEmit": true,
        "baseUrl": ".",
        "paths": {
            "@/*": [
                "src/*"
            ]
        },
        "lib": [
            "ESNext",
            "DOM",
            "DOM.Iterable"
        ]
    },
    "include": [
        "src/**/*.ts",
        "tests/**/*.ts",
        "scripts/**/*.ts"
    ],
    "exclude": [
        "node_modules"
    ]
}
````