import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: jobs } = await supabase.from('jobs').select('*');
  console.log('Jobs:', jobs);
  
  const { data: candidates } = await supabase.from('candidates').select('id, name, job_applied');
  console.log('Candidates:', candidates);
}

check();
