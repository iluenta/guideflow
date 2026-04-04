-- 038_add_analytics_tables.sql
-- Add analytics columns to guest_chats
ALTER TABLE guest_chats ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE guest_chats ADD COLUMN IF NOT EXISTS intent_summary JSONB DEFAULT '[]';
ALTER TABLE guest_chats ADD COLUMN IF NOT EXISTS unanswered_count INTEGER DEFAULT 0;
ALTER TABLE guest_chats ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;
ALTER TABLE guest_chats ADD COLUMN IF NOT EXISTS session_duration_seconds INTEGER;

-- Create table for unanswered questions
CREATE TABLE IF NOT EXISTS unanswered_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id UUID,
    question TEXT NOT NULL,
    intent TEXT,
    asked_at TIMESTAMPTZ DEFAULT NOW(),
    times_asked INTEGER DEFAULT 1,
    UNIQUE(property_id, question)
);

-- Create table for section views tracking
CREATE TABLE IF NOT EXISTS guide_section_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    guest_session_id TEXT,
    section TEXT NOT NULL,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    time_spent_seconds INTEGER
);

-- RLS for unanswered_questions
ALTER TABLE unanswered_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view unanswered questions for their properties"
    ON unanswered_questions FOR SELECT
    USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));

-- RLS for guide_section_views
ALTER TABLE guide_section_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view section views for their properties"
    ON guide_section_views FOR SELECT
    USING (property_id IN (
        SELECT id FROM properties WHERE tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    ));

-- RPC to increment unanswered questions safely
CREATE OR REPLACE FUNCTION increment_unanswered_question(
    p_property_id UUID,
    p_tenant_id UUID,
    p_question TEXT,
    p_intent TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO unanswered_questions (property_id, tenant_id, question, intent, times_asked)
    VALUES (p_property_id, p_tenant_id, p_question, p_intent, 1)
    ON CONFLICT (property_id, question)
    DO UPDATE SET 
        times_asked = unanswered_questions.times_asked + 1,
        asked_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
