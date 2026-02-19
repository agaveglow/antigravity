
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

async function inspectCurriculum() {
    console.log('Curriculum Projects:');
    const { data: projects } = await supabase.from('curriculum_projects').select('*');
    projects?.forEach(p => console.log(`ID: ${p.id} | Title: ${p.title}`));

    console.log('\nCurriculum Tasks:');
    const { data: tasks } = await supabase.from('curriculum_tasks').select('*');
    tasks?.forEach(t => console.log(`ID: ${t.id} | ProjectID: ${t.project_id} | Title: ${t.title}`));
}

inspectCurriculum();
