import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: './.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log("--- Profile Table Deep Verification ---");

    const requiredColumns = [
        'id', 'name', 'username', 'avatar', 'theme_preference',
        'themePreference', 'balance', 'inventory', 'cohort',
        'xp', 'department', 'is_first_login', 'role'
    ];

    console.log(`Table: profiles`);
    for (const col of requiredColumns) {
        const { error } = await supabase
            .from('profiles')
            .select(col)
            .limit(0);

        if (error) {
            console.log(`  - ${col}: ERROR [${error.code}] - ${error.message}`);
        } else {
            console.log(`  - ${col}: EXISTS`);
        }
    }
}

inspectSchema();
