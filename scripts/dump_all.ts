
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

async function dumpData() {
    console.log('--- COURSES ---');
    const { data: courses } = await supabase.from('courses').select('*');
    courses?.forEach(c => console.log(JSON.stringify(c)));

    console.log('\n--- STAGES ---');
    const { data: stages } = await supabase.from('stages').select('*');
    stages?.forEach(s => console.log(JSON.stringify(s)));

    console.log('\n--- MODULES ---');
    const { data: modules } = await supabase.from('modules').select('*');
    modules?.forEach(m => console.log(JSON.stringify(m)));

    console.log('\n--- CURRICULUM PROJECTS ---');
    const { data: cProjects } = await supabase.from('curriculum_projects').select('*');
    cProjects?.forEach(p => console.log(JSON.stringify(p)));
}

dumpData();
