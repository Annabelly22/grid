-- GRID App — Cloud Sync Schema
-- Run this once in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS grid_user_data (
  user_id   TEXT PRIMARY KEY,
  payload   JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on every write
CREATE OR REPLACE FUNCTION _grid_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS grid_user_data_updated_at ON grid_user_data;
CREATE TRIGGER grid_user_data_updated_at
  BEFORE UPDATE ON grid_user_data
  FOR EACH ROW EXECUTE FUNCTION _grid_touch_updated_at();

-- No RLS needed — service_role key used server-side only
