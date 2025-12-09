-- User-Company Relationship Table
-- Each user can access only their own companies

-- Create user_companies junction table
CREATE TABLE IF NOT EXISTS user_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- admin, member, viewer
    is_primary BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, company_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON user_companies(company_id);

-- RLS Policies (Row Level Security)
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;

-- Users can only see their own company associations
CREATE POLICY "Users can view own company associations" ON user_companies
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own associations
CREATE POLICY "Users can insert own company associations" ON user_companies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS for companies table - users can only see companies they're associated with
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view associated companies" ON companies
    FOR SELECT USING (
        id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert companies" ON companies
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update associated companies" ON companies
    FOR UPDATE USING (
        id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
    );

-- Function to automatically create user_company link when company is created
CREATE OR REPLACE FUNCTION link_company_to_user()
RETURNS TRIGGER AS $$
BEGIN
    -- If there's an authenticated user, link them to the new company
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO user_companies (user_id, company_id, role, is_primary)
        VALUES (auth.uid(), NEW.id, 'admin', TRUE)
        ON CONFLICT (user_id, company_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run after company creation
DROP TRIGGER IF EXISTS on_company_created ON companies;
CREATE TRIGGER on_company_created
    AFTER INSERT ON companies
    FOR EACH ROW EXECUTE FUNCTION link_company_to_user();
