
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

async function inspectTables() {
    console.log('Courses:');
    const { data: courses } = await supabase.from('courses').select('*');
    courses?.forEach(c => console.log(`ID: ${c.id} | Title: ${c.title}`));

    console.log('\nStages:');
    const { data: stages } = await supabase.from('stages').select('*');
    stages?.forEach(s => console.log(`ID: ${s.id} | CourseID: ${s.course_id} | Title: ${s.title}`));

    console.log('\nModules:');
    const { data: modules } = await supabase.from('modules').select('*');
    modules?.forEach(m => console.log(`ID: ${m.id} | StageID: ${m.stage_id} | Title: ${m.title}`));
}

inspectTables();
