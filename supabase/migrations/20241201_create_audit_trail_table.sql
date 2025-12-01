-- =============================================================================
-- Chimera Audit Trail Table
-- =============================================================================
-- Stores all audit events for tracking user and system actions
-- Created: 2024-12-01
-- =============================================================================

-- Create audit_trail table
CREATE TABLE IF NOT EXISTS audit_trail (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User ownership (nullable for system events)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Event metadata
    action TEXT NOT NULL,
    actor TEXT NOT NULL CHECK (actor IN ('user', 'system', 'ai')),
    category TEXT NOT NULL CHECK (category IN ('generation', 'approval', 'export', 'config', 'error', 'auth', 'self_healing')),

    -- Related entities (nullable)
    job_id UUID REFERENCES orchestration_jobs(id) ON DELETE SET NULL,

    -- Event details
    details TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB,

    -- Severity level
    severity TEXT DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Index for user lookups
CREATE INDEX idx_audit_trail_user_id
    ON audit_trail(user_id);

-- Index for category filtering
CREATE INDEX idx_audit_trail_category
    ON audit_trail(category);

-- Index for time-based queries (recent events)
CREATE INDEX idx_audit_trail_created_at
    ON audit_trail(created_at DESC);

-- Index for job-related events
CREATE INDEX idx_audit_trail_job_id
    ON audit_trail(job_id);

-- Composite index for user's recent events
CREATE INDEX idx_audit_trail_user_created
    ON audit_trail(user_id, created_at DESC);

-- Index for severity filtering
CREATE INDEX idx_audit_trail_severity
    ON audit_trail(severity);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own audit events
CREATE POLICY "Users can view their own audit events"
    ON audit_trail
    FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: System can insert audit events (via service role)
CREATE POLICY "Service role can insert audit events"
    ON audit_trail
    FOR INSERT
    WITH CHECK (auth.jwt()->>'role' = 'service_role' OR auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access"
    ON audit_trail
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to automatically log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_action TEXT,
    p_actor TEXT,
    p_category TEXT,
    p_details TEXT,
    p_user_id UUID DEFAULT NULL,
    p_job_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB,
    p_severity TEXT DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO audit_trail (
        action,
        actor,
        category,
        details,
        user_id,
        job_id,
        metadata,
        severity
    ) VALUES (
        p_action,
        p_actor,
        p_category,
        p_details,
        p_user_id,
        p_job_id,
        p_metadata,
        p_severity
    ) RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE audit_trail IS 'Stores all audit events for tracking user and system actions';
COMMENT ON COLUMN audit_trail.id IS 'Unique event identifier';
COMMENT ON COLUMN audit_trail.user_id IS 'User who triggered the event (null for system events)';
COMMENT ON COLUMN audit_trail.action IS 'Action that was performed';
COMMENT ON COLUMN audit_trail.actor IS 'Who performed the action (user, system, ai)';
COMMENT ON COLUMN audit_trail.category IS 'Category of the action';
COMMENT ON COLUMN audit_trail.job_id IS 'Related job ID if applicable';
COMMENT ON COLUMN audit_trail.details IS 'Human-readable description of the event';
COMMENT ON COLUMN audit_trail.metadata IS 'Additional event data in JSON format';
COMMENT ON COLUMN audit_trail.severity IS 'Event severity level';
COMMENT ON COLUMN audit_trail.created_at IS 'When the event occurred';
