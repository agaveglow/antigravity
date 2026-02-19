
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    const { data, error } = await supabase.rpc('get_tables_info'); // If RPC exists
    if (error) {
        // Fallback: try querying information_schema if allowed (usually not for anon key)
        console.log('RPC failed, trying information_schema...');
        const { data: schemas, error: schemaError } = await supabase
            .from('pg_catalog.pg_tables') // Usually restricted
            .select('tablename');

        if (schemaError) {
            console.error('Could not list tables:', schemaError);
            // One more try: common table names
            const commonTables = ['courses', 'stages', 'modules', 'lessons', 'quizzes', 'walkthroughs', 'curriculum_projects', 'curriculum_tasks', 'submissions', 'profiles'];
            console.log('Testing common tables:');
            for (const table of commonTables) {
                const { count, error: tableError } = await supabase.from(table).select('*', { count: 'exact', head: true });
                if (!tableError) {
                    console.log(`Table: ${table} exists, count: ${count}`);
                } else {
                    console.log(`Table: ${table} error: ${tableError.message}`);
                }
            }
        } else {
            console.log('Tables:', schemas);
        }
    } else {
        console.log('Tables:', data);
    }
}

listTables();
