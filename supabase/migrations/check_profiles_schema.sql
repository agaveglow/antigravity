-- Check if 'predicted_grade' column exists in 'profiles' table and see its data type
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'profiles';
