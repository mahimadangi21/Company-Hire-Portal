import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixData() {
  // 1. Get all jobs named 'PHP' or 'PHP '
  const { data: phpJobs } = await supabase.from('jobs').select('*').ilike('title', 'PHP%');
  console.log('Found PHP jobs:', phpJobs);
  
  const badJob = phpJobs.find(j => j.title === 'PHP ' && j.department === 'Engineering');
  const goodJob = phpJobs.find(j => j.title === 'PHP' && j.department === 'Technology and Delivery');
  
  if (badJob && goodJob) {
    // 2. Update candidates pointing to badJob to point to goodJob
    const { data: cData, error: cErr } = await supabase.from('candidates').update({ job_applied: 'PHP' }).eq('job_applied', 'PHP ');
    console.log('Updated candidates:', cErr || 'Success');
    
    // 3. Delete bad job
    const { error: dErr } = await supabase.from('jobs').delete().eq('id', badJob.id);
    console.log('Deleted bad job:', dErr || 'Success');
  } else if (badJob) {
    // Just update the bad job
    await supabase.from('jobs').update({ title: 'PHP', department: 'Technology and Delivery' }).eq('id', badJob.id);
    await supabase.from('candidates').update({ job_applied: 'PHP' }).eq('job_applied', 'PHP ');
    console.log('Updated bad job and its candidates');
  } else {
    console.log('No bad job found.');
  }
}

fixData();
