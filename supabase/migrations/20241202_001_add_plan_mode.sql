-- =============================================================================
-- Chimera Plan Mode Extension
-- =============================================================================
-- Adds plan mode support with clarifying questions and plan approval workflow
-- Created: 2024-12-02
-- =============================================================================

-- Add plan mode columns to orchestration_jobs
ALTER TABLE orchestration_jobs
ADD COLUMN IF NOT EXISTS clarifying_questions JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS clarifying_answers JSONB DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS plan_content TEXT,
ADD COLUMN IF NOT EXISTS plan_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS plan_modified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS skip_clarification BOOLEAN DEFAULT FALSE;

-- Update status check constraint to include new statuses
ALTER TABLE orchestration_jobs
DROP CONSTRAINT IF EXISTS orchestration_jobs_status_check;

ALTER TABLE orchestration_jobs
ADD CONSTRAINT orchestration_jobs_status_check
CHECK (status IN (
    'received',
    'clarifying',        -- Generating clarifying questions
    'awaiting_answers',  -- Waiting for user to answer questions
    'planning',
    'awaiting_approval', -- Waiting for user to approve/modify plan
    'dispatching',
    'awaiting',
    'generating',
    'reviewing',
    'refining',
    'complete',
    'error'
));

-- =============================================================================
-- INDEXES for Plan Mode
-- =============================================================================

-- Index for plan approval status queries
CREATE INDEX IF NOT EXISTS idx_orchestration_jobs_plan_approved
    ON orchestration_jobs(plan_approved)
    WHERE plan_approved = FALSE;

-- Index for awaiting approval status (common query pattern)
CREATE INDEX IF NOT EXISTS idx_orchestration_jobs_awaiting_approval
    ON orchestration_jobs(status, created_at DESC)
    WHERE status = 'awaiting_approval';

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN orchestration_jobs.clarifying_questions IS 'JSONB array of clarifying questions with id, question, context, required fields';
COMMENT ON COLUMN orchestration_jobs.clarifying_answers IS 'JSONB object mapping question_id to user answers';
COMMENT ON COLUMN orchestration_jobs.plan_content IS 'Full markdown implementation plan';
COMMENT ON COLUMN orchestration_jobs.plan_approved IS 'Whether the user has approved the plan';
COMMENT ON COLUMN orchestration_jobs.plan_modified_at IS 'When the plan was last modified by user';
COMMENT ON COLUMN orchestration_jobs.skip_clarification IS 'Whether to skip clarifying questions phase';

-- =============================================================================
-- FUNCTIONS for Plan Mode
-- =============================================================================

-- Function to update plan_modified_at when plan_content changes
CREATE OR REPLACE FUNCTION update_plan_modified_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.plan_content IS DISTINCT FROM OLD.plan_content THEN
        NEW.plan_modified_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for plan modification tracking
DROP TRIGGER IF EXISTS update_plan_modified_at_trigger ON orchestration_jobs;
CREATE TRIGGER update_plan_modified_at_trigger
    BEFORE UPDATE ON orchestration_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_plan_modified_at();
