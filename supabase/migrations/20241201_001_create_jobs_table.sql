-- =============================================================================
-- Chimera Orchestration Jobs Table
-- =============================================================================
-- Stores AI orchestration jobs with thought streams and generated code
-- Created: 2024-12-01
-- =============================================================================

-- Create orchestration_jobs table
CREATE TABLE IF NOT EXISTS orchestration_jobs (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User ownership
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Job metadata
    brief TEXT NOT NULL,
    brief_summary TEXT,
    target_framework TEXT DEFAULT 'react' CHECK (target_framework IN ('react', 'vue', 'svelte', 'vanilla')),
    status TEXT DEFAULT 'received' CHECK (status IN ('received', 'planning', 'dispatching', 'awaiting', 'complete', 'error')),

    -- Team outputs stored as JSONB
    -- Structure: { "anthropic": {...}, "google": {...} }
    teams JSONB DEFAULT '{}'::JSONB,

    -- Cost tracking
    total_tokens INTEGER DEFAULT 0 CHECK (total_tokens >= 0),
    estimated_cost DECIMAL(10,6) DEFAULT 0 CHECK (estimated_cost >= 0),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Index for user lookups (most common query)
CREATE INDEX idx_orchestration_jobs_user_id
    ON orchestration_jobs(user_id);

-- Index for status filtering
CREATE INDEX idx_orchestration_jobs_status
    ON orchestration_jobs(status);

-- Index for time-based queries (recent jobs)
CREATE INDEX idx_orchestration_jobs_created_at
    ON orchestration_jobs(created_at DESC);

-- Composite index for user's recent jobs (most common query pattern)
CREATE INDEX idx_orchestration_jobs_user_created
    ON orchestration_jobs(user_id, created_at DESC);

-- Index for JSONB queries on teams (if needed)
CREATE INDEX idx_orchestration_jobs_teams
    ON orchestration_jobs USING GIN (teams);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS
ALTER TABLE orchestration_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own jobs
CREATE POLICY "Users can view their own jobs"
    ON orchestration_jobs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own jobs
CREATE POLICY "Users can create their own jobs"
    ON orchestration_jobs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own jobs
CREATE POLICY "Users can update their own jobs"
    ON orchestration_jobs
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own jobs
CREATE POLICY "Users can delete their own jobs"
    ON orchestration_jobs
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Service role can do everything (for backend operations)
CREATE POLICY "Service role has full access"
    ON orchestration_jobs
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_orchestration_jobs_updated_at
    BEFORE UPDATE ON orchestration_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to set completed_at when status becomes 'complete' or 'error'
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('complete', 'error') AND OLD.status NOT IN ('complete', 'error') THEN
        NEW.completed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set completed_at
CREATE TRIGGER set_orchestration_jobs_completed_at
    BEFORE UPDATE ON orchestration_jobs
    FOR EACH ROW
    EXECUTE FUNCTION set_completed_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE orchestration_jobs IS 'Stores AI orchestration jobs with thought streams and generated code';
COMMENT ON COLUMN orchestration_jobs.id IS 'Unique job identifier';
COMMENT ON COLUMN orchestration_jobs.user_id IS 'User who created the job';
COMMENT ON COLUMN orchestration_jobs.brief IS 'Original natural language description';
COMMENT ON COLUMN orchestration_jobs.brief_summary IS 'Truncated summary for display';
COMMENT ON COLUMN orchestration_jobs.target_framework IS 'Target framework for code generation';
COMMENT ON COLUMN orchestration_jobs.status IS 'Current job status';
COMMENT ON COLUMN orchestration_jobs.teams IS 'JSONB containing team outputs (thoughts, code, tokens, etc.)';
COMMENT ON COLUMN orchestration_jobs.total_tokens IS 'Total tokens used across all teams';
COMMENT ON COLUMN orchestration_jobs.estimated_cost IS 'Estimated cost in USD';
COMMENT ON COLUMN orchestration_jobs.created_at IS 'When the job was created';
COMMENT ON COLUMN orchestration_jobs.updated_at IS 'When the job was last updated';
COMMENT ON COLUMN orchestration_jobs.completed_at IS 'When the job completed or errored';
