const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

async function backfill() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  
  if (!supabaseUrl || !supabaseKey || !groqKey) {
    console.error("Missing environment variables");
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: interviews, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("status", "completed")
    .is("summary", null);
    
  if (error) {
    console.error(error);
    return;
  }
  
  console.log(`Found ${interviews.length} completed interviews missing summaries.`);
  
  for (const interview of interviews) {
    if (!interview.transcript || !Array.isArray(interview.transcript)) continue;
    
    console.log(`Generating summary for ${interview.id}...`);
    const fullText = interview.transcript.map((t) => `Q: ${t.question}\nA: ${t.text}`).join("\n\n");
    
    if (!fullText.trim()) continue;
    
    try {
      const chatRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: "You are an expert HR recruiter. Summarize the following interview transcript in 3-4 concise bullet points highlighting the candidate's key qualifications, experience, and communication style." },
            { role: "user", content: fullText }
          ]
        })
      });
      
      if (chatRes.ok) {
        const chatData = await chatRes.json();
        const summary = chatData.choices[0]?.message?.content || "";
        
        await supabase
          .from("interviews")
          .update({ summary })
          .eq("id", interview.id);
          
        console.log(`Saved summary for ${interview.id}`);
      } else {
        console.error("Groq Chat API returned an error:", await chatRes.text());
      }
    } catch (err) {
      console.error(err);
    }
  }
}

backfill();
