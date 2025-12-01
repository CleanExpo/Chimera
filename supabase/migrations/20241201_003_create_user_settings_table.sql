-- =============================================================================
-- Chimera User Settings Table
-- =============================================================================
-- Stores user preferences and configuration
-- Created: 2024-12-01
-- =============================================================================

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    -- Primary key (same as user id for 1:1 relationship)
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- AI Model Preferences
    default_model TEXT DEFAULT 'claude-sonnet',
    fallback_model TEXT DEFAULT 'gemini-pro',
    max_tokens INTEGER DEFAULT 4096,
    temperature DECIMAL(3, 2) DEFAULT 0.7,

    -- Self-Healing Configuration
    self_healing_enabled BOOLEAN DEFAULT true,
    auto_fix_tier INTEGER DEFAULT 1 CHECK (auto_fix_tier >= 0 AND auto_fix_tier <= 3),

    -- Notification Preferences
    notifications_enabled BOOLEAN DEFAULT true,
    notify_on_completion BOOLEAN DEFAULT true,
    notify_on_approval_needed BOOLEAN DEFAULT true,
    notify_on_incident BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT false,

    -- UI Preferences
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    sidebar_collapsed BOOLEAN DEFAULT false,
    show_thought_streams BOOLEAN DEFAULT true,
    compact_mode BOOLEAN DEFAULT false,

    -- API Keys (encrypted in production)
    anthropic_api_key_set BOOLEAN DEFAULT false,
    google_api_key_set BOOLEAN DEFAULT false,
    openrouter_api_key_set BOOLEAN DEFAULT false,

    -- GitHub Integration
    github_connected BOOLEAN DEFAULT false,
    github_default_repo TEXT,
    github_default_branch TEXT DEFAULT 'main',

    -- Usage Limits
    daily_token_limit INTEGER DEFAULT 1000000,
    daily_cost_limit DECIMAL(10, 2) DEFAULT 50.00,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER trigger_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_updated_at();

-- Function to create default settings for new users
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create settings when user is created
CREATE TRIGGER trigger_create_user_settings
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_settings();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own settings
CREATE POLICY "Users can view their own settings"
    ON user_settings
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can update their own settings
CREATE POLICY "Users can update their own settings"
    ON user_settings
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own settings
CREATE POLICY "Users can insert their own settings"
    ON user_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to settings"
    ON user_settings
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE user_settings IS 'Stores user preferences and configuration';
COMMENT ON COLUMN user_settings.user_id IS 'User ID (1:1 with auth.users)';
COMMENT ON COLUMN user_settings.default_model IS 'Default AI model for orchestration';
COMMENT ON COLUMN user_settings.auto_fix_tier IS 'Max tier that can auto-fix (0=none, 1-3)';
COMMENT ON COLUMN user_settings.theme IS 'UI theme preference';
