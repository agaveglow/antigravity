
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

async function cleanup() {
    console.log('Logging in as teacher...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'teacher@test.com',
        password: 'password123' // Likely default
    });

    if (authError) {
        console.error('Login failed:', authError.message);
        // Try another teacher if first fails
        console.log('Trying dowd@erclearn.com...');
        const { error: authError2 } = await supabase.auth.signInWithPassword({
            email: 'dowd@erclearn.com',
            password: 'password123'
        });
        if (authError2) {
            console.error('Second login failed:', authError2.message);
            return;
        }
    }

    console.log('Login successful.');

    const COURSE_ID = '6e86afe3-c6db-4670-80ff-50294cd1c485';

    console.log(`Searching for stages in course ${COURSE_ID}...`);
    const { data: stages, error: stagesError } = await supabase
        .from('stages')
        .select('*')
        .eq('course_id', COURSE_ID);

    if (stagesError) {
        console.error('Error fetching stages:', stagesError);
        return;
    }

    console.log(`Found ${stages?.length || 0} stages.`);

    const stageIds = stages?.map(s => s.id) || [];
    if (stageIds.length === 0) {
        console.log('No stages found for this course.');
        // Maybe try the OTHER Project 1?
        const ALT_COURSE_ID = '550c1161-9921-4ac1-98a9-4f32b5aa9b4e';
        console.log(`Trying alternate course ID (curriculum_project matches): ${ALT_COURSE_ID}`);
        // But stages table references courses(id)... wait, maybe it doesn't?
        // Migration says: course_id uuid REFERENCES public.courses(id)
        // So it MUST be the course ID.
    }

    const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .in('stage_id', stageIds);

    if (modulesError) {
        console.error('Error fetching modules:', modulesError);
        return;
    }

    console.log(`Found ${modules?.length || 0} modules.`);

    const moduleIds = modules?.map(m => m.id) || [];

    // Cleanup Content
    if (moduleIds.length > 0) {
        console.log('Cleaning up content for modules:', moduleIds);

        // 1. Content Completion
        const { data: quizzes } = await supabase.from('quizzes').select('id').in('module_id', moduleIds);
        const { data: lessons } = await supabase.from('lessons').select('id').in('module_id', moduleIds);
        const { data: walkthroughs } = await supabase.from('walkthroughs').select('id').in('module_id', moduleIds);

        const contentIds = [
            ...(quizzes?.map(q => q.id) || []),
            ...(lessons?.map(l => l.id) || []),
            ...(walkthroughs?.map(w => w.id) || [])
        ];

        if (contentIds.length > 0) {
            console.log(`Deleting ${contentIds.length} content completion records...`);
            await supabase.from('content_completion').delete().in('content_id', contentIds);
        }

        // 2. Delete Content
        console.log('Deleting quizzes, lessons, and walkthroughs...');
        await supabase.from('quizzes').delete().in('module_id', moduleIds);
        await supabase.from('lessons').delete().in('module_id', moduleIds);
        await supabase.from('walkthroughs').delete().in('module_id', moduleIds);

        // 3. Delete Modules
        console.log('Deleting modules...');
        await supabase.from('modules').delete().in('stage_id', stageIds);
    }

    // 4. Delete Stages
    if (stageIds.length > 0) {
        console.log('Deleting stages...');
        const { error: dsError } = await supabase.from('stages').delete().in('id', stageIds);
        if (dsError) {
            console.error('Error deleting stages:', dsError);
        } else {
            console.log('Stages deleted successfully.');
        }
    }

    console.log('Cleanup complete.');
}

cleanup();
