# pwAutoTestnets 🚀

A production-hardened Playwright automation framework for Web3/dApp interactions. This project runs robust, queue-based automation tasks targeting modern browser extension wallets like MetaMask and Rabby.

## Key Features

- **Persistent Contexts:** Uses `launchPersistentContext` to gracefully load and operate extension wallets.
- **Wallet Support:** Built-in automatic detection and handling for MetaMask and Rabby.
- **Scenario Engine:** Event-driven architecture with customizable test scenarios (e.g., wallet connection, signing messages, swapping tokens).
- **Background Workers:** Redis-backed queues and schedulers for reliable task execution and retry logic.
- **Reporting & Dashboards:** A lightweight Express-based dashboard giving you live visibility into tests and artifacts.
- **Production-Ready Logging:** Structured, structured JSON and terminal logging. 
- **Graceful Shutdown:** Ensures browser sessions and database connections cleanly close on SIGINT/SIGTERM.

## Getting Started

### 1. Requirements

- Node.js >= 20
- Docker and Docker Compose (for PostgreSQL/Redis)

### 2. Environment Setup

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Set up your vital environment variables inside `.env`:

```env
METAMASK_EXTENSION_PATH=/path/to/extracted/metamask/extension
RABBY_EXTENSION_PATH=/path/to/extracted/rabby/extension
DAPP_URL=https://your-dapp-to-test.com
```

> **WARNING:** You must provide unpacked extension directories for MetaMask and/or Rabby. The paths should point to the unzipped, `manifest.json`-containing directory of each respective extension.

### 3. Start Infrastructure

Start the Redis and PostgreSQL databases:

```bash
npm run start
```

### 4. Start the Application

Start the backend API server, dashboard, worker loops, and schedulers for automation:

```bash
npm install
npm run dev
```

The application exposes its endpoint and dashboard at `http://localhost:3000`.

### 5. Running Scenarios

Submit a run request to the API:

```bash
curl -X POST http://localhost:3000/api/runs \
     -H "Content-Type: application/json" \
     -d '{"scenarioId":"connect_wallet","profileId":"profile-1","networkId":"sepolia"}'
```

The application polling loops will pick it up and launch a Playwright instance to execute the requested automation task. 

## Project Structure

- `/src/core/` - Browser managers, queue mechanisms, workers, and scenarios.
- `/src/api/` - The Express backend server.
- `/src/dashboard/` - Frontend components formatting and returning HTML to view live run status.
- `/database/` - Initial SQL schema definitions.

## Testing & Quality

Run types and verification tests:

```bash
npm run lint  # Validates TypeScript compilation
npm test      # Runs backend scheduling tests
```
