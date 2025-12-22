-- ============================================================
-- Migration: Enhanced Conversions (lead_attribution + SHA-256)
-- Date: 2025-12-19
-- ============================================================

-- 1. Create lead_attribution table (for click_id_hash persistence)
CREATE TABLE IF NOT EXISTS lead_attribution (
  project_id TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  click_id_hash TEXT,
  first_click_ts TIMESTAMPTZ,
  last_message_ts TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, phone_e164)
);

-- 2. Add new columns to conversions table (if not exist)
DO $$
BEGIN
  -- lead_email column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversions' AND column_name = 'lead_email'
  ) THEN
    ALTER TABLE conversions ADD COLUMN lead_email TEXT;
  END IF;

  -- lead_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversions' AND column_name = 'lead_name'
  ) THEN
    ALTER TABLE conversions ADD COLUMN lead_name TEXT;
  END IF;

  -- email_sha256 column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversions' AND column_name = 'email_sha256'
  ) THEN
    ALTER TABLE conversions ADD COLUMN email_sha256 TEXT;
  END IF;

  -- phone_sha256 column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversions' AND column_name = 'phone_sha256'
  ) THEN
    ALTER TABLE conversions ADD COLUMN phone_sha256 TEXT;
  END IF;
END $$;

-- 3. Create indexes for SHA-256 fields (for Google Ads Enhanced Conversions lookup)
CREATE INDEX IF NOT EXISTS idx_conversions_email_sha256 ON conversions(email_sha256);
CREATE INDEX IF NOT EXISTS idx_conversions_phone_sha256 ON conversions(phone_sha256);

-- 4. Create index on lead_attribution for fast lookups
CREATE INDEX IF NOT EXISTS idx_lead_attribution_expires ON lead_attribution(project_id, phone_e164, expires_at);

-- 5. Verify the schema
SELECT 
  'lead_attribution' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'lead_attribution'
UNION ALL
SELECT 
  'conversions (new cols)' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'conversions' 
  AND column_name IN ('lead_email', 'lead_name', 'email_sha256', 'phone_sha256');
