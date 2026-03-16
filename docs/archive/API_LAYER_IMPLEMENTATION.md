# API Layer - Production Implementation

## Architecture Changes

### Old Design (Removed)
- Custom Router class with manual path matching
- Generic route array processed by custom Router
- Type-unsafe any-casts throughout
- Middleware bypass issues
- Manual error handling

### New Design (Production-Ready)
- Express.js with native routing
- Direct route handlers with type safety
- Built-in middleware support
- Proper error handling chain
- Security features (directory traversal prevention)

## Files Modified

### 1. src/api/server.ts (Rewritten - ~360 lines)

**Key Changes**:
- Removed custom Router dependency
- Implemented native Express routing
- Added proper error handling middleware
- Added 404 handler
- Added comprehensive logging

**Features**:
- Type-safe handler functions
- Proper NextFunction error handling
- Stream-based artifact downloads
- Polling-friendly update endpoint

**Export Changes**:
```typescript
// Old:
export function createHttpServer(app: { logger; runStore; artifactsPath }): Express

// New:
interface HttpServerOptions {
  logger: Logger;
  runStore: RunRepository;
  artifactsPath: string;
  port?: number;
}

export function createHttpServer(options: HttpServerOptions): Express
export async function startHttpServer(app: Express, port: number, logger: Logger): Promise<...>
```

### 2. src/api/services/RunService.ts (Enhanced)

**Changes**:
- Made `networkId` optional (now `string | undefined`)
- Added comprehensive JSDoc comments
- Proper null handling in cancelRun
- Type-safe parameter passing

**Key Method**:
```typescript
async createRun(input: CreateRunInput): Promise<RunRecord>
// Now handles undefined networkId properly
```

### 3. src/api/services/ArtifactsService.ts (Enhanced)

**Changes**:
- Added JSDoc comments
- Improved MIME type handling
- Security checks documented
- Clear method signatures

## API Endpoints

### Health & Monitoring

#### GET /health
```
Response 200:
{
  "status": "healthy",
  "timestamp": "2026-03-13T22:00:00.000Z",
  "uptime": 1234.567
}
```

### Runs Management

#### GET /api/runs
List all runs with optional filtering
```
Query params:
  - status?: RunStatus (queued, running, completed, failed, cancelled, needs_review)
  - limit?: number (default: 100)

Response 200:
{
  "runs": [RunRecord, ...],
  "count": 5,
  "timestamp": "2026-03-13T22:00:00.000Z"
}
```

#### GET /api/runs/:id
Get specific run
```
Response 200:
{
  "run": RunRecord,
  "timestamp": "2026-03-13T22:00:00.000Z"
}

Response 404:
{
  "error": "NotFound",
  "message": "Run abc-123 not found"
}
```

#### POST /api/runs
Create new run
```
Request body:
{
  "scenarioId": "connect_wallet",
  "profileId": "profile-123",
  "networkId"?: "ethereum",
  "maxAttempts"?: 3
}

Response 201:
{
  "run": RunRecord,
  "timestamp": "2026-03-13T22:00:00.000Z"
}

Response 400:
{
  "error": "ValidationError",
  "message": "scenarioId and profileId are required"
}
```

#### POST /api/runs/:id/cancel
Cancel a run
```
Response 200:
{
  "run": RunRecord,
  "message": "Run cancelled",
  "timestamp": "2026-03-13T22:00:00.000Z"
}

Response 404:
{
  "error": "NotFound",
  "message": "Run abc-123 not found"
}
```

### Live Updates (Polling)

#### GET /api/runs/stream/updates
Poll for recent run updates (polling-friendly alternative to SSE)
```
Query params:
  - since?: ISO timestamp (default: 1 minute ago)
  - limit?: number (default: 50)

Response 200:
{
  "updates": [RunRecord, ...],
  "count": 3,
  "nextUpdate": "2026-03-13T22:00:05.000Z",
  "timestamp": "2026-03-13T22:00:00.000Z"
}

Flow:
1. Client gets initial runs: GET /api/runs
2. Client stores lastUpdate timestamp
3. Client polls: GET /api/runs/stream/updates?since={lastUpdate}
4. Server returns runs updated since that time
5. Client updates UI with returned runs
6. Repeat from step 3 every 5 seconds or as indicated by nextUpdate
```

### Artifacts

#### GET /api/runs/:id/artifacts
List all artifacts for a run
```
Response 200:
{
  "artifacts": [
    {
      "filename": "screenshots/initial.png",
      "size": 102400,
      "type": "screenshots"
    },
    {
      "filename": "traces/main-trace.zip",
      "size": 5242880,
      "type": "traces"
    },
    {
      "filename": "logs/console.json",
      "size": 2048,
      "type": "logs"
    }
  ],
  "count": 3,
  "timestamp": "2026-03-13T22:00:00.000Z"
}
```

#### GET /api/runs/:id/artifacts/:filename
Download specific artifact
```
Supports subdirectories: screenshots/, traces/, logs/, metadata/, html/

Request:
GET /api/runs/run-123/artifacts/screenshots/initial.png
GET /api/runs/run-123/artifacts/traces/main-trace.zip
GET /api/runs/run-123/artifacts/logs/console.json

Response 200:
[File stream]
Content-Type: image/png (or appropriate MIME type)
Content-Disposition: attachment; filename="initial.png"
Content-Length: 102400

Response 404:
{
  "error": "NotFound",
  "message": "Artifact screenshots/initial.png not found for run run-123"
}

Security:
- Directory traversal prevented via path.normalize() and base path check
- MIME types properly set based on file extension
- Only files allowed, not directories
```

## Error Handling

### Error Response Format
```json
{
  "error": "ErrorCode",
  "message": "Human-readable description"
}
```

### Error Codes
- `NotFound`: 404 - Resource not found
- `ValidationError`: 400 - Invalid request parameters
- `InternalServerError`: 500 - Server error
- `StreamError`: 500 - Artifact download failed

### Logging
All requests logged with:
- Method and path
- IP address
- User-Agent
- Query parameters
- Errors with stack traces

## Client Integration Examples

### Dashboard Backend Integration

**List Runs:**
```javascript
const response = await fetch('/api/runs?status=queued&limit=20');
const { runs } = await response.json();
```

**Create Run:**
```javascript
const run = await fetch('/api/runs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    scenarioId: 'connect_wallet',
    profileId: 'profile-1',
    networkId: 'ethereum'
  })
}).then(r => r.json()).then(r => r.run);
```

**Poll for Updates:**
```javascript
let lastUpdate = new Date();
setInterval(async () => {
  const response = await fetch(
    `/api/runs/stream/updates?since=${lastUpdate.toISOString()}&limit=50`
  );
  const { updates, nextUpdate } = await response.json();

  // Update UI with new/changed runs
  updates.forEach(run => updateRunInUI(run));

  lastUpdate = new Date();
}, 5000);
```

**Download Artifact:**
```javascript
// Direct download link
window.location.href = `/api/runs/${runId}/artifacts/screenshots/initial.png`;

// Or programmatic download
const response = await fetch(`/api/runs/${runId}/artifacts/${filename}`);
const blob = await response.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = filename;
a.click();
```

**Cancel Run:**
```javascript
const response = await fetch(`/api/runs/${runId}/cancel`, {
  method: 'POST'
});
const { run } = await response.json();
console.log(`Run status: ${run.status}`);
```

## Server Startup Integration

Update main.ts or entry point:

```typescript
import { createHttpServer, startHttpServer } from "./api/server";

// After initializing worker, scheduler, etc:
const httpServer = createHttpServer({
  logger,
  runStore,
  artifactsPath: finalConfig.artifactsPath,
  port: 3000
});

const serverHandle = await startHttpServer(httpServer, 3000, logger);

// On shutdown:
await serverHandle.close();
```

## Removed Dependencies

- **Custom Router class**: Replaced with native Express routing
- **RouteDefinition array pattern**: Replaced with Express handler functions
- **Manual path matching**: Express handles this natively
- **Type-unsafe any-casts**: Replaced with proper TypeScript types

## Type Safety Improvements

### Before
```typescript
const { scenarioId, profileId, networkId } = req.body as any;
await (app.runStore as any).createAndReturnRun({ ... });
```

### After
```typescript
const { scenarioId, profileId, networkId } = req.body;
const run = await runService.createRun({ ... });
```

## Middleware Chain

1. Express JSON parser
2. URL-encoded parser
3. Request logging
4. Route handlers
5. Error handler
6. 404 handler

## Testing Recommendations

### Unit Tests
```bash
# Test API contracts
npm test -- api/server.test.ts
npm test -- api/services/RunService.test.ts
```

### Integration Tests
```bash
# Start server and test endpoints
npm run dev &
curl http://localhost:3000/health
curl http://localhost:3000/api/runs
```

### Load Testing
```bash
# Test polling endpoint under load
autocannon -c 50 -d 30 http://localhost:3000/api/runs/stream/updates
```

## Security Considerations

✅ **Directory Traversal Prevention**: ArtifactsService validates paths
✅ **MIME Type Safety**: Proper content-type headers
✅ **Error Handling**: No stack traces leaked in production
✅ **Request Logging**: All activity logged for audit trails
✅ **Input Validation**: Query and body parameter validation

## Performance Notes

- **Artifact Downloads**: Stream-based (no loading into memory)
- **Polling Updates**: Filters by timestamp (efficient queries)
- **Listing**: Configurable limits prevent large responses
- **Error Handling**: Fast-path for not-found cases

## Compilation Status
✅ TypeScript builds successfully
✅ No linting errors
✅ All types properly inferred
✅ No any-casts in route handlers
✅ Express integration complete
