import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: './.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCleanup() {
    const courseId = '6e86afe3-c6db-4670-80ff-50294cd1c485';
    console.log(`--- Verifying Cleanup for Course: ${courseId} ---`);

    const { data: stages } = await supabase.from('stages').select('id').eq('course_id', courseId);
    console.log(`Stages remaining: ${stages?.length || 0}`);

    const { data: modules } = await supabase.from('modules').select('id');
    // We can't easily filter modules by course since course_id is not directly on modules, 
    // but if stages are 0, modules should be too (due to FK).
    // Let's check for any modules that might be left over.
    console.log(`Total modules in DB: ${modules?.length || 0}`);
}

verifyCleanup();
