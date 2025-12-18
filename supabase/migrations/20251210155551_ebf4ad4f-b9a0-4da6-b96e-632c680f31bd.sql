-- Add sort_order column to providers table
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Initialize sort_order based on created_at order
UPDATE providers SET sort_order = subquery.row_num - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num 
  FROM providers
) AS subquery
WHERE providers.id = subquery.id;