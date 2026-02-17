-- Count all stages and modules
SELECT 
    (SELECT count(*) FROM stages) as total_stages,
    (SELECT count(*) FROM modules) as total_modules,
    (SELECT count(*) FROM curriculum_projects) as total_projects;

-- List the most recent ones to see if any "recent" ones made it (e.g. created in last hour)
SELECT id, title, created_at FROM modules ORDER BY created_at DESC LIMIT 5;
