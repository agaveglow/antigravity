
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

async function listCourses() {
    const { data, error } = await supabase.from('courses').select('*');
    if (error) {
        console.error('Error fetching courses:', error);
        return;
    }
    console.log('Courses:');
    data.forEach(c => {
        console.log(`ID: ${c.id} | Title: ${c.title}`);
    });
}

listCourses();
