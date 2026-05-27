// Run this once to add report share columns to the candidates table
// Usage: node migrate-report-token.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://iosyfjaeeogosrlolakt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc3lmamFlZW9nb3NybG9sYWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc2NTE0NSwiZXhwIjoyMDk1MzQxMTQ1fQ.VypqkM4JTRDVqDlhKcZ-jDZqdA3-3dsqtmy6Fq6LUNM'
);

async function migrate() {
  // Test a candidate update with the new fields to see if columns exist
  const { data: testData, error: fetchError } = await supabase
    .from('candidates')
    .select('id, report_share_token')
    .limit(1);

  if (fetchError && fetchError.message.includes('column')) {
    console.log('Column does not exist. Please add it manually in Supabase SQL Editor:');
    console.log('');
    console.log('ALTER TABLE public.candidates');
    console.log('  ADD COLUMN IF NOT EXISTS report_share_token text UNIQUE,');
    console.log('  ADD COLUMN IF NOT EXISTS report_share_expires_at timestamp with time zone;');
    console.log('');
    console.log('CREATE INDEX IF NOT EXISTS idx_candidates_report_share_token');
    console.log('  ON public.candidates(report_share_token)');
    console.log('  WHERE report_share_token IS NOT NULL;');
  } else if (!fetchError) {
    console.log('✅ Columns already exist or no error! Schema is ready.');
  } else {
    console.log('Error:', fetchError.message);
  }
}

migrate();
