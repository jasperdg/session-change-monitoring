-- Create composite_rates table
CREATE TABLE IF NOT EXISTS composite_rates (
  id SERIAL PRIMARY KEY,
  composite_rate DECIMAL(10, 5) NOT NULL,
  active_session VARCHAR(50),
  session_weight DECIMAL(5, 2),
  reference_weight DECIMAL(5, 2),
  timestamp TIMESTAMPTZ NOT NULL,
  sources_used TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_timestamp ON composite_rates (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_created_at ON composite_rates (created_at DESC);

-- Add comment
COMMENT ON TABLE composite_rates IS 'Stores all composite rate data from SEDA API';

