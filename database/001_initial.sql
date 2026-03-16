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
);

CREATE TABLE IF NOT EXISTS run_logs (
  id BIGSERIAL PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  level VARCHAR(10),
  message TEXT,
  "timestamp" TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
CREATE INDEX IF NOT EXISTS idx_runs_scenario_id ON runs(scenario_id);
CREATE INDEX IF NOT EXISTS idx_runs_next_attempt ON runs(next_attempt_at) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_run_logs_run_id ON run_logs(run_id);
