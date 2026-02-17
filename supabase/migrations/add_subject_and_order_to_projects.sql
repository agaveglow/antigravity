-- Add subject and order_index columns to projects table

-- Add subject column (nullable, allows 'music' or 'performing_arts')
ALTER TABLE projects ADD COLUMN IF NOT EXISTS subject TEXT;

-- Add order_index column for manual ordering
ALTER TABLE projects ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Update existing projects to have order_index based on created_at
-- This ensures existing projects maintain their current order
UPDATE projects 
SET order_index = subquery.row_num - 1
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
    FROM projects
) AS subquery
WHERE projects.id = subquery.id AND projects.order_index = 0;

-- Add index for better query performance when ordering
CREATE INDEX IF NOT EXISTS idx_projects_order ON projects(order_index);
