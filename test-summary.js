const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

async function test() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.log("No GROQ_API_KEY found");
    return;
  }
  
  const fullText = "Q: What is your name?\nA: My name is Achyut.\n\nQ: Why do you want to join?\nA: I love building great products.";
  
  try {
    const chatRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
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
      console.log("SUCCESS:");
      console.log(chatData.choices[0]?.message?.content);
    } else {
      console.log("FAILED:");
      console.log(await chatRes.text());
    }
  } catch(e) {
    console.error(e);
  }
}

test();
