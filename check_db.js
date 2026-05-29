const { createClient } = require("@supabase/supabase-js");

const url = "https://npogsacnialzixgnxmoq.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wb2dzYWNuaWFseml4Z254bW9xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk1NjIxMCwiZXhwIjoyMDk1NTMyMjEwfQ.jBT6bRXW-VfWZE5HV3U0YZAvTY0-3ClBgjG_RVIIkaI";

const supabase = createClient(url, key);

async function main() {
  const { data: candidates, error } = await supabase
    .from("candidates")
    .select("*");
  
  if (error) {
    console.error("Error fetching candidates:", error);
    return;
  }
  
  console.log("Total candidates:", candidates.length);
  candidates.forEach(c => {
    console.log("-----------------------------------------");
    console.log("Name:", c.name);
    console.log("ID:", c.id);
    console.log(`Name: ${c.name} | Video: ${c.video_score} | Tech: ${c.tech_score} | Rec: ${c.final_recommendation}`);
  });
}

main();
