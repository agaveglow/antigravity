
import { createClient } from '@supabase/supabase-js';
// @ts-ignore
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDuplicateError() {
    console.log('Verifying duplicate username error...');

    // 1. Create a random user to ensure we have one
    const randomSuffix = Math.floor(Math.random() * 10000);
    const testEmail = `testuser${randomSuffix}@example.com`;
    const testPassword = 'password123';

    // We can't easily create a user via admin API without service role key, 
    // but we can try to hit the `manage_student_auth` RPC if it's exposed, 
    // or just assume we have a user.
    // Actually, `manage_student_auth` is what we use in the app. Let's try to call it.

    const { data, error } = await supabase.rpc('manage_student_auth', {
        p_username: `duplicate_test_${randomSuffix}`,
        p_password: testPassword,
        p_name: 'Duplicate Test User',
        p_cohort: 'Level 3A',
        p_department: 'music'
    });

    if (error) {
        console.error('Error creating initial user:', error);
        return;
    }

    console.log('Created initial user:', `duplicate_test_${randomSuffix}`);

    // 2. Try to create the SAME user again
    console.log('Attempting to create duplicate user...');
    const { data: dupData, error: dupError } = await supabase.rpc('manage_student_auth', {
        p_username: `duplicate_test_${randomSuffix}`,
        p_password: testPassword,
        p_name: 'Duplicate Test User 2',
        p_cohort: 'Level 3A',
        p_department: 'music'
    });

    if (dupError) {
        console.log('Caught expected error:');
        console.log('Error Code:', dupError.code);
        console.log('Error Message:', dupError.message);

        if (dupError.code === '23505' || dupError.message.includes('unique constraint')) {
            console.log('SUCCESS: Error code matches verified expectation (23505 or unique constraint message).');
        } else {
            console.error('FAILURE: Unexpected error code or message.');
        }
    } else {
        console.error('FAILURE: Duplicate user creation succeeded but should have failed.');
    }

    // Cleanup (optional, if we had delete RPC)
}

verifyDuplicateError();
