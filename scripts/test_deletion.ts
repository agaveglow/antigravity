
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDeletion() {
    const courseId = '6e86afe3-c6db-4670-80ff-50294cd1c485';
    const stageId = crypto.randomUUID();
    const moduleId = crypto.randomUUID();

    console.log('Creating dummy stage...');
    const { error: sError } = await supabase.from('stages').insert({
        id: stageId,
        course_id: courseId,
        title: 'TEST STAGE',
        order_index: 0
    });
    if (sError) {
        console.error('Error creating stage:', sError);
        return;
    }

    console.log('Creating dummy module...');
    const { error: mError } = await supabase.from('modules').insert({
        id: moduleId,
        stage_id: stageId,
        title: 'TEST MODULE',
        order_index: 0
    });
    if (mError) {
        console.error('Error creating module:', mError);
        return;
    }

    console.log('Successfully created test data.');

    console.log('Now attempting to delete module...');
    const { error: dmError } = await supabase.from('modules').delete().eq('id', moduleId);
    if (dmError) {
        console.error('Error deleting module:', dmError);
    } else {
        console.log('Successfully deleted module.');
    }

    console.log('Now attempting to delete stage...');
    const { error: dsError } = await supabase.from('stages').delete().eq('id', stageId);
    if (dsError) {
        console.error('Error deleting stage:', dsError);
    } else {
        console.log('Successfully deleted stage.');
    }
}

testDeletion();
