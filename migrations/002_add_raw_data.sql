-- Add column to store complete API response
ALTER TABLE composite_rates 
ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- Add index for querying JSONB data (GIN index for fast JSONB queries)
CREATE INDEX IF NOT EXISTS idx_raw_data ON composite_rates USING GIN (raw_data);

-- Add comment
COMMENT ON COLUMN composite_rates.raw_data IS 'Complete API response data in JSON format';

