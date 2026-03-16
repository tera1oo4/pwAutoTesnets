# Wallet Abstraction Layer - Production-Grade Implementation

## Summary

Redesigned and enhanced the wallet abstraction layer to support production-like Playwright + wallet extensions interaction. All wallet controllers now implement a comprehensive interface with support for signing, transaction confirmation, and automatic popup handling.

## Interface Changes

### New Types in `src/shared/types.ts`

```typescript
// Detection rule metadata for rich signal tracking
export type WalletDetectionRule = {
  name: string;
  signal: string;
  confidence: number;
};

// Enriched detection result with metadata
export type WalletDetection = {
  kind: WalletKind;
  confidence: number;
  reason?: string;
  matchedRule?: WalletDetectionRule;
  metadata?: {
    detectedSignals?: string[];
    selectors?: { name: string; versions: number[] }[];
    unknownStateReason?: string;
  };
};

// Request types for transaction operations
export type TransactionConfirmRequest = {
  method: "eth_sendTransaction" | "eth_sign" | "personal_sign" | "eth_signTypedData_v4";
};

export type SignMessageRequest = {
  message: string;
};

export type SignTypedDataRequest = {
  domain?: { name?: string; version?: string; chainId?: number };
  types?: Record<string, any>;
  primaryType?: string;
  message?: Record<string, any>;
};

// Complete WalletController interface (10 methods)
export type WalletController = {
  kind: WalletKind;
  detect(page: PageHandle, context: WalletContext): Promise<WalletDetection | null>;
  unlock(page: PageHandle, password: string, context: WalletContext): Promise<void>;
  connect(page: PageHandle, context: WalletContext): Promise<void>;
  ensureNetwork(page: PageHandle, request: WalletConnectionRequest, context: WalletContext): Promise<void>;
  signMessage(page: PageHandle, request: SignMessageRequest, context: WalletContext): Promise<void>;
  signTypedData(page: PageHandle, request: SignTypedDataRequest, context: WalletContext): Promise<void>;
  confirmTransaction(page: PageHandle, request: TransactionConfirmRequest, context: WalletContext): Promise<void>;
  approve(page: PageHandle, context: WalletContext): Promise<void>;
  reject(page: PageHandle, context: WalletContext): Promise<void>;
  handlePopupAuto(page: PageHandle, context: WalletContext): Promise<void>;
};
```

## Modified Files

### 1. `src/shared/types.ts`
- Added new detection rule and enriched WalletDetection types
- Added SignMessageRequest, SignTypedDataRequest, TransactionConfirmRequest types
- Extended WalletController interface with 6 new methods

### 2. `src/core/wallet/WalletDetector.ts`
- Enhanced to log and track detection rule matching
- Returns enriched metadata about which signals matched
- Structured logging of all detection attempts

### 3. `src/core/wallet/WalletManager.ts`
- Added wrapper methods for all 10 wallet controller operations
- Each method has consistent error handling and logging
- New methods: signMessage, signTypedData, confirmTransaction, approve, reject, handlePopupAuto

### 4. `src/core/wallet/metamask/MetaMaskController.ts` (Complete Rewrite)

**Architecture:**
- Production-ready selector sets with fallback chains
- Rule-based detection with multiple signals
- Structured error handling with NeedsReviewError
- Helper methods for common patterns (clickButton, fillInput, waitForElement, etc.)

**Key Features:**
- **Selector Strategy**: Each element has primary and fallback selectors. Tries primary, falls back if not visible.
- **Version Sensitivity**: Marked with `VERSION-SENSITIVE` comments for UI changes (MetaMask v10.33+)
- **Banner Handling**: Automatically closes info/warning banners before operations
- **Error Handling**: All operations throw `NeedsReviewError` on failure with context
- **Logging**: Structured logging at all stages with meaningful context

**Methods Implemented:**
- `detect()`: Multi-signal detection (extension icon + wallet UI)
- `unlock()`: Password-based unlock with fallback selectors
- `connect()`: DApp connection flow with approval
- `ensureNetwork()`: Network switching with chainId template substitution
- `signMessage()`: Message signing with popup handling
- `signTypedData()`: Typed data signing (EIP-712)
- `confirmTransaction()`: Transaction confirmation for various methods (eth_sign, personal_sign, eth_sendTransaction)
- `approve()`: Generic approval for requests
- `reject()`: Rejection of requests
- `handlePopupAuto()`: Best-effort auto-handling of pending popups

**Selector Coverage:**
```typescript
const METAMASK_SELECTORS = {
  // Detection
  extensionIcon: "[data-testid='app-header-logo']" + fallback
  extensionIconAlt: ".app-header__logo-container"

  // Unlock
  unlockPasswordInput: "[type='password']" + fallback
  unlockButton: "button[type='submit']" + fallback

  // Connection
  connectButton: "button:has-text('Connect')" + fallback
  approveButton: "[data-testid='page-container-footer-button-primary']" + fallback
  rejectButton: "[data-testid='page-container-footer-button-secondary']" + fallback

  // Network
  networkMenu: "[data-testid='network-display']" + fallback
  networkItem: "[data-testid='network-item-{chainId}']" (template)

  // Signing
  signatureRequest: "[data-testid='signature-request']" + fallback
  confirmButton: "[data-testid='page-container-footer-button-primary']" + fallback

  // Banners
  banner: "[data-testid='global-banner']" + fallback
  bannerClose: "[data-testid='global-banner-close']" + fallback

  // Error detection
  errorMessage: "[data-testid='error-page-container']" + fallback
}
```

### 5. `src/core/wallet/rabby/RabbyController.ts` (Complete Rewrite)

**Architecture:**
- Similar to MetaMask but with Rabby-specific handling
- Aggressive security warning handling
- Different UI patterns for network switching and approvals

**Key Differences from MetaMask:**
- Additional `closeSecurityWarnings()` method for Rabby's aggressive security popups
- Security warning acknowledgment with "I Understand" button
- Different selector patterns (uses "Approve" instead of button role-based)
- More defensive about banner/warning handling

**Methods Implemented:**
- All 10 methods same as MetaMask
- Enhanced `unlock()`, `connect()`, `ensureNetwork()` with warning handling
- All signing/transaction methods include pre-emptive warning closure

**Selector Coverage:**
```typescript
const RABBY_SELECTORS = {
  // Detection
  extensionIcon: "[data-testid='rabby-logo']" + fallbacks
  extensionTitle: "text=Rabby"

  // Security specific to Rabby
  securityWarning: "[data-testid='security-warning']" + fallback
  securityWarningClose: "button:has-text('I Understand')" + fallback

  // Unlock (similar to MetaMask)
  unlockPasswordInput: "input[type='password']" + fallback

  // Connection (Rabby uses "Approve" text)
  connectButton: "button:has-text('Connect')" + fallback
  approveButton: "button:has-text('Approve')" + fallback

  // Signing (Rabby-specific popups)
  typedDataSignature: "[data-testid='typed-data-signing']" + fallback

  // Rest similar to MetaMask with Rabby-specific patterns
}
```

## Design Patterns

### 1. Selector Fallback Chains
```typescript
type SelectorChain = readonly string[];

// Usage in helper methods:
await this.clickButton(
  page,
  [METAMASK_SELECTORS.connectButton, METAMASK_SELECTORS.connectButtonAlt],
  timeoutMs,
  "connect button"
);
```

The implementation tries each selector in order until one is found and visible.

### 2. Helper Methods
```typescript
// tryLocator: Returns boolean if element is visible
private async tryLocator(page: PageHandle, selectors: SelectorChain, timeoutMs?: number): Promise<boolean>

// clickButton: Tries fallback chain, throws descriptive error
private async clickButton(page: PageHandle, selectors: SelectorChain, timeoutMs?: number, description?: string): Promise<void>

// fillInput: Similar to clickButton for text inputs
private async fillInput(page: PageHandle, selectors: SelectorChain, value: string, timeoutMs?: number, description?: string): Promise<void>

// waitForElement: Waits for element to become visible
private async waitForElement(page: PageHandle, selectors: SelectorChain, timeoutMs?: number, description?: string): Promise<void>

// closeBanners: Best-effort banner closure
private async closeBanners(page: PageHandle, context: WalletContext): Promise<void>

// closeSecurityWarnings: Rabby-specific warning handling
private async closeSecurityWarnings(page: PageHandle, context: WalletContext): Promise<void>
```

### 3. Structured Error Handling
```typescript
try {
  // operation
} catch (error) {
  context.logger.error("operation_error_event", "descriptive message", {
    kind: this.kind,
    error: String(error)
  });
  throw new NeedsReviewError(`Descriptive error: ${error}`, "wallet_unknown_state", error);
}
```

### 4. Versioning Strategy
Each selector set includes:
- VERSION-SENSITIVE comment indicating when selectors are applicable
- Multiple fallback selectors for different versions
- Comments about which MetaMask/Rabby versions are supported

## Unknown State Handling

All methods throw `NeedsReviewError` when:
- Required selectors cannot be found
- UI transitions don't complete as expected
- Wallet state is unexpected or unrecognized

This allows scenarios and workers to distinguish between:
- **Transient errors** (retry): Browser/network issues
- **Unknown state** (needs_review): Wallet state that needs manual investigation

## What Must Be Validated Manually in PWDEBUG

The selectors below are production scaffolds with `VERSION-SENSITIVE` comments. They need live validation against actual wallet extensions:

### MetaMask Selectors to Validate:
1. **Extension Icon Detection**
   - `[data-testid='app-header-logo']` - Current version
   - `.app-header__logo-container` - Fallback
   - **Action**: Open MetaMask popup in PWDEBUG, verify selector exists

2. **Unlock Flow**
   - Password input: `[type='password']`
   - Unlock button: `button[type='submit']`
   - **Action**: Test on locked MetaMask wallet

3. **Connection Flow**
   - Connect button: `button:has-text('Connect')`
   - Approve button: `[data-testid='page-container-footer-button-primary']`
   - **Action**: Test dapp connection in PWDEBUG

4. **Network Switching**
   - Network menu: `[data-testid='network-display']`
   - Network items: `[data-testid='network-item-{chainId}']`
   - **Action**: Test switching between networks (chainId: 1 for mainnet, 11155111 for sepolia)

5. **Signing Requests**
   - Signature popup: `[data-testid='signature-request']`
   - Confirm button: `[data-testid='page-container-footer-button-primary']`
   - **Action**: Trigger eth_sign/personal_sign from test dapp

6. **Banner Handling**
   - Banner: `[data-testid='global-banner']`
   - Close: `[data-testid='global-banner-close']`
   - **Action**: Verify banner appears and can be closed

### Rabby Selectors to Validate:
1. **Extension Detection**
   - Logo: `[data-testid='rabby-logo']`
   - Container: `[data-testid='rabby-container']`
   - **Action**: Open Rabby popup in PWDEBUG

2. **Security Warnings** (Rabby-specific)
   - Warning popup: `[data-testid='security-warning']`
   - Acknowledgement button: `button:has-text('I Understand')`
   - **Action**: Trigger warning scenarios and verify closure

3. **Unlock Flow**
   - Same general pattern as MetaMask but test specifically with Rabby

4. **Connection & Signing**
   - Same flow patterns as MetaMask
   - **Note**: Rabby uses "Approve" button text instead of generic role-based selectors

### General Validation Steps:

1. **Use Playwright Inspector**
   ```bash
   PWDEBUG=1 npm run worker
   ```

2. **For Each Selector**:
   - Open target wallet
   - In browser console: `document.querySelector('selector')`
   - Verify element exists and is visible in target state
   - Record actual selector if different

3. **Test Full Flows**:
   - Unlock → Connect → Sign Message → Confirm
   - Network switching
   - Transaction confirmation
   - Reject/Cancel operations

4. **Version Tracking**:
   - Note wallet extension version when selectors are validated
   - Update VERSION-SENSITIVE comments with specific versions
   - Create version-specific selector sets if needed

### Fallback Strategy:

If a primary selector fails in production:
1. The helper method tries the fallback selector
2. If all selectors fail, throws `NeedsReviewError`
3. Error is logged with which selectors were attempted
4. Scenario marks run as `needs_review` for manual investigation
5. Engineer reviews PWDEBUG trace to find correct selector

## Integration Points

Scenarios can now use wallet operations:

```typescript
// In ScenarioContext, you have access to wallet controller via context
const wallet = new WalletManager(controller, context);

// For detection
const detection = await wallet.detect(page);

// For operations
await wallet.signMessage(page, { message: "Hello" });
await wallet.confirmTransaction(page, { method: "eth_sendTransaction" });
await wallet.approve(page);
await wallet.handlePopupAuto(page); // Best-effort auto-handling
```

## Error Flow

```
operation fails
    ↓
Try fallback selector
    ↓
All fail?
    ├─ YES → NeedsReviewError("wallet_unknown_state")
    │        ├─ Logged with attempted selectors
    │        └─ Worker marks run as needs_review
    │
    └─ NO → Operation succeeds
```

## Files Modified/Created

- ✅ `src/shared/types.ts` - Extended types
- ✅ `src/core/wallet/WalletDetector.ts` - Enhanced detection logging
- ✅ `src/core/wallet/WalletManager.ts` - Added 6 new methods
- ✅ `src/core/wallet/metamask/MetaMaskController.ts` - Complete rewrite (500+ lines)
- ✅ `src/core/wallet/rabby/RabbyController.ts` - Complete rewrite (550+ lines)
- ✅ `tests/wallet-detector.test.ts` - Updated mock controller

## Next Steps

1. **Selector Validation** - Use PWDEBUG to validate all selectors against real wallet extensions
2. **Scenario Integration** - Update scenarios to use new wallet methods for signing/approval
3. **Error Handling Tests** - Test unknown state handling with invalid/missing selectors
4. **Version Management** - Track and update selectors as wallet extensions are updated
5. **Future Adapters** - New wallet types (WalletConnect, Ledger, etc.) can implement same interface
