import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: jobs } = await supabase.from('jobs').select('*');
  const { data: candidates } = await supabase.from('candidates').select('*');
  
  const c = candidates.find(can => can.name === 'Achyut Pancholi');
  console.log('Candidate Achyut Pancholi:');
  console.log(c);
  
  if (c) {
    const matchingJobs = jobs.filter(j => j.title === c.job_applied);
    console.log(`Jobs matching title '${c.job_applied}':`);
    console.log(matchingJobs);
    
    // Simulate VideoBot.jsx filter
    const inviteDepartment = 'Technology and Delivery';
    const inviteSubDepartment = 'PHP';
    
    const job = jobs.find(j => j.title.trim() === c.job_applied.trim()); // added trim just in case
    console.log('Job found by find():', job);
    
    if (job) {
      console.log('job.department:', job.department, '| inviteDepartment:', inviteDepartment, '-> Match?', job.department === inviteDepartment);
      console.log('job.title:', job.title, '| inviteSubDepartment:', inviteSubDepartment, '-> Match?', job.title === inviteSubDepartment);
    }
  }
}

check();
