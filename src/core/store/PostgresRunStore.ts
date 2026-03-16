import { Pool, PoolClient } from "pg";
import {
  RunRecord,
  RunStatus,
  RunErrorCode,
  ArtifactRecord,
  ISODateString
} from "../../shared/types";

export class PostgresRunStore {
  private pool: Pool;

  constructor(private connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async initialize(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS runs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          scenario_id VARCHAR(100) NOT NULL,
          network_id VARCHAR(100),
          profile_id VARCHAR(100),
          status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled', 'needs_review')),
          attempt INT DEFAULT 0,
          max_attempts INT DEFAULT 3,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          scheduled_at TIMESTAMP,
          started_at TIMESTAMP,
          completed_at TIMESTAMP,
          cancelled_at TIMESTAMP,
          next_attempt_at TIMESTAMP,
          last_error_code VARCHAR(100),
          last_error_message TEXT,
          last_error_at TIMESTAMP,
          result JSONB,
          artifacts JSONB
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS run_logs (
          id BIGSERIAL PRIMARY KEY,
          run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
          level VARCHAR(10),
          message TEXT,
          "timestamp" TIMESTAMP DEFAULT NOW(),
          metadata JSONB
        )
      `);

      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_runs_scenario_id ON runs(scenario_id)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_runs_next_attempt ON runs(next_attempt_at)
        WHERE status = 'queued'
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_run_logs_run_id ON run_logs(run_id)
      `);

      console.log("✓ PostgreSQL schema initialized");
    } finally {
      client.release();
    }
  }

  async createRun(input: RunRecord | { scenarioId: string; networkId?: string; profileId: string; maxAttempts?: number }): Promise<void> {
    if ('id' in input) {
      // Input is already a RunRecord
      const run = input;
      await this.pool.query(
        `INSERT INTO runs (id, scenario_id, network_id, profile_id, status, attempt, max_attempts, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          run.id,
          run.scenarioId,
          run.networkId,
          run.profileId,
          run.status,
          run.attempt,
          run.maxAttempts,
          run.createdAt,
          run.updatedAt
        ]
      );
    } else {
      // Input is CreateRunInput
      await this.pool.query(
        `INSERT INTO runs (scenario_id, network_id, profile_id, status, max_attempts)
         VALUES ($1, $2, $3, 'queued', $4)`,
        [input.scenarioId, input.networkId, input.profileId, input.maxAttempts ?? 3]
      );
    }
  }

  async createAndReturnRun(input: {
    scenarioId: string;
    networkId?: string;
    profileId: string;
    maxAttempts?: number;
  }): Promise<RunRecord> {
    const result = await this.pool.query(
      `INSERT INTO runs (scenario_id, network_id, profile_id, status, max_attempts)
       VALUES ($1, $2, $3, 'queued', $4)
       RETURNING *`,
      [input.scenarioId, input.networkId, input.profileId, input.maxAttempts ?? 3]
    );
    return this.mapRow(result.rows[0]);
  }

  async getRun(id: string): Promise<RunRecord | null> {
    const result = await this.pool.query("SELECT * FROM runs WHERE id = $1", [id]);
    return result.rows.length ? this.mapRow(result.rows[0]) : null;
  }

  async listRuns(options?: {
    status?: RunStatus;
    limit?: number;
  }): Promise<RunRecord[]> {
    let query = "SELECT * FROM runs";
    const params: any[] = [];

    if (options?.status) {
      query += " WHERE status = $1";
      params.push(options.status);
    }

    query += " ORDER BY created_at DESC";

    if (options?.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(options.limit);
    }

    const result = await this.pool.query(query, params);
    return result.rows.map((row) => this.mapRow(row));
  }

  async listRecentlyUpdatedRuns(since: ISODateString, limit: number): Promise<RunRecord[]> {
    const result = await this.pool.query(
      `SELECT * FROM runs WHERE updated_at >= $1 ORDER BY updated_at DESC LIMIT $2`,
      [since, limit]
    );
    return result.rows.map((row) => this.mapRow(row));
  }

  async listPendingRuns(limit: number, now?: ISODateString): Promise<RunRecord[]> {
    const timestamp = now ?? new Date().toISOString();
    const result = await this.pool.query(
      `SELECT * FROM runs
       WHERE status = 'queued'
       AND (next_attempt_at IS NULL OR next_attempt_at <= $1)
       ORDER BY created_at ASC
       LIMIT $2`,
      [timestamp, limit]
    );
    return result.rows.map((row) => this.mapRow(row));
  }

  async markRunning(id: string): Promise<void> {
    await this.pool.query(
      `UPDATE runs SET status = 'running', started_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  async markCompleted(id: string): Promise<void> {
    await this.pool.query(
      `UPDATE runs
       SET status = 'completed', completed_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
  }

  async markFailed(
    id: string,
    errorMessage: string,
    artifacts?: any,
    errorCode?: RunErrorCode
  ): Promise<void> {
    await this.pool.query(
      `UPDATE runs
       SET status = 'failed',
           last_error_message = $2,
           last_error_code = $4,
           last_error_at = NOW(),
           completed_at = NOW(),
           artifacts = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [id, errorMessage, artifacts ? JSON.stringify(artifacts) : null, errorCode]
    );
  }

  async markNeedsReview(
    id: string,
    errorMessage?: string,
    artifacts?: any,
    errorCode?: RunErrorCode
  ): Promise<void> {
    await this.pool.query(
      `UPDATE runs
       SET status = 'needs_review',
           last_error_message = $2,
           last_error_code = $4,
           last_error_at = NOW(),
           completed_at = NOW(),
           artifacts = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [id, errorMessage, artifacts ? JSON.stringify(artifacts) : null, errorCode]
    );
  }

  async markQueued(
    id: string,
    errorMessage?: string,
    artifacts?: any,
    nextAttemptAt?: ISODateString,
    errorCode?: RunErrorCode
  ): Promise<void> {
    await this.pool.query(
      `UPDATE runs
       SET status = 'queued',
           last_error_message = $2,
           last_error_code = $5,
           next_attempt_at = $4,
           artifacts = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [
        id,
        errorMessage,
        artifacts ? JSON.stringify(artifacts) : null,
        nextAttemptAt,
        errorCode
      ]
    );
  }

  async markCancelled(id: string, reason?: string): Promise<void> {
    await this.pool.query(
      `UPDATE runs
       SET status = 'cancelled',
           cancelled_at = NOW(),
           last_error_message = $2,
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [id, reason]
    );
  }

  async incrementAttempt(id: string): Promise<number> {
    const result = await this.pool.query(
      `UPDATE runs SET attempt = attempt + 1, updated_at = NOW() WHERE id = $1 RETURNING attempt`,
      [id]
    );
    return result.rows[0].attempt;
  }

  async addLog(
    runId: string,
    level: string,
    message: string,
    metadata?: any
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO run_logs (run_id, level, message, metadata) VALUES ($1, $2, $3, $4)`,
      [runId, level, message, metadata ? JSON.stringify(metadata) : null]
    );
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private mapRow(row: any): RunRecord {
    return {
      id: row.id,
      scenarioId: row.scenario_id,
      networkId: row.network_id,
      profileId: row.profile_id,
      status: row.status as RunStatus,
      attempt: row.attempt,
      maxAttempts: row.max_attempts,
      createdAt: (row.created_at instanceof Date ? row.created_at : new Date(row.created_at)).toISOString(),
      updatedAt: (row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at)).toISOString(),
      cancelledAt: row.cancelled_at ? (row.cancelled_at instanceof Date ? row.cancelled_at : new Date(row.cancelled_at)).toISOString() : undefined,
      nextAttemptAt: row.next_attempt_at ? (row.next_attempt_at instanceof Date ? row.next_attempt_at : new Date(row.next_attempt_at)).toISOString() : undefined,
      lastErrorCode: row.last_error_code as RunErrorCode | undefined,
      lastErrorMessage: row.last_error_message,
      lastErrorAt: row.last_error_at ? (row.last_error_at instanceof Date ? row.last_error_at : new Date(row.last_error_at)).toISOString() : undefined
    };
  }
}
