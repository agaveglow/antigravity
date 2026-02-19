
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

const COURSE_ID = '6e86afe3-c6db-4670-80ff-50294cd1c485';

async function cleanup() {
    console.log(`Starting cleanup for course: ${COURSE_ID}`);

    // 1. Get Stages
    const { data: stages, error: stagesError } = await supabase
        .from('stages')
        .select('id')
        .eq('course_id', COURSE_ID);

    if (stagesError) {
        console.error('Error fetching stages:', stagesError);
        return;
    }

    const stageIds = stages.map(s => s.id);
    console.log(`Found ${stageIds.length} stages.`);

    if (stageIds.length === 0) {
        console.log('No stages found for this course.');
        // Still check if there are any orphaned modules or content directly linked to course (though unlikely with current schema)
    }

    // 2. Get Modules
    const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('id')
        .in('stage_id', stageIds);

    if (modulesError) {
        console.error('Error fetching modules:', modulesError);
        return;
    }

    const moduleIds = modules.map(m => m.id);
    console.log(`Found ${moduleIds.length} modules.`);

    // 3. Get Content (Quizzes, Lessons, Walkthroughs)
    const [quizzesRes, lessonsRes, walkthroughsRes] = await Promise.all([
        supabase.from('quizzes').select('id').in('module_id', moduleIds),
        supabase.from('lessons').select('id').in('module_id', moduleIds),
        supabase.from('walkthroughs').select('id').in('module_id', moduleIds)
    ]);

    const quizIds = quizzesRes.data?.map(q => q.id) || [];
    const lessonIds = lessonsRes.data?.map(l => l.id) || [];
    const walkthroughIds = walkthroughsRes.data?.map(w => w.id) || [];

    const allContentIds = [...quizIds, ...lessonIds, ...walkthroughIds];
    console.log(`Found ${allContentIds.length} content items (Quizzes: ${quizIds.length}, Lessons: ${lessonIds.length}, Walkthroughs: ${walkthroughIds.length}).`);

    // 4. Delete Dependencies (Progress, Calendar)
    if (allContentIds.length > 0) {
        console.log('Deleting progress and calendar events...');
        await Promise.all([
            supabase.from('content_completion').delete().in('content_id', allContentIds),
            supabase.from('calendar_events').delete().in('related_id', allContentIds)
        ]);
    }

    // 5. Delete Content
    if (quizIds.length > 0) {
        console.log('Deleting quizzes...');
        await supabase.from('quizzes').delete().in('id', quizIds);
    }
    if (lessonIds.length > 0) {
        console.log('Deleting lessons...');
        await supabase.from('lessons').delete().in('id', lessonIds);
    }
    if (walkthroughIds.length > 0) {
        console.log('Deleting walkthroughs...');
        await supabase.from('walkthroughs').delete().in('id', walkthroughIds);
    }

    // 6. Delete Modules
    if (moduleIds.length > 0) {
        console.log('Deleting modules...');
        await supabase.from('modules').delete().in('id', moduleIds);
    }

    // 7. Delete Stages
    if (stageIds.length > 0) {
        console.log('Deleting stages...');
        await supabase.from('stages').delete().in('id', stageIds);
    }

    console.log('Cleanup complete.');
}

cleanup();
