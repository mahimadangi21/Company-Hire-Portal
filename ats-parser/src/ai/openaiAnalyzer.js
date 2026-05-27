'use strict';

/**
 * groqAnalyzer.js
 * Semantic enhancement layer using Groq.
 * Optimized for minimum latency: short prompt, capped output tokens, 0 temperature.
 */

const OpenAI = require('openai');

let _client = null;
function getClient() {
  if (!_client) {
    _client = new OpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY,
      timeout: parseInt(process.env.GROQ_TIMEOUT_MS, 10) || 45000,
      maxRetries: 0,
    });
  }
  return _client;
}

// ─── System Prompt (kept concise to minimize input tokens / latency) ──────────

const SYSTEM_PROMPT = `You are an ATS Resume Intelligence Engine.

RULES (strictly enforced):
- Set the top-level "isResume" key to true ONLY if the provided text is a candidate resume, CV, or professional profile. If the document is something else (like an invoice, booking receipt, grocery list, generic article, manual, book, code script, contract, tax document, etc.), set "isResume" to false and return null or empty arrays for all other keys.
- Extract ONLY data explicitly present in the resume text
- NEVER hallucinate, guess, or infer missing information
- If a field is missing: return null (never "", "N/A", "-")
- Do NOT contradict the DETERMINISTIC VALUES in the prompt
- Technologies in projects: ONLY from explicit mentions — never infer
- Skills: extract ONLY technologies, frameworks, databases, languages, libraries, tools, cloud services
- Skills: NEVER extract soft skills (communication, teamwork, problem solving, OOP, DBMS, SDLC, etc.)
- Education: normalize degrees (B.Tech→Bachelor of Technology, MCA→Master of Computer Applications, B.Sc→Bachelor of Science, BCA→Bachelor of Computer Applications, MBA→Master of Business Administration, M.Tech→Master of Technology)
- Experience: domainExperience=0 for freshers; leadershipExperience="0.0 years" if none mentioned
- Return ONLY valid JSON matching this schema exactly — no extra keys, no markdown:

{"isResume":true,"personalInformation":{"fullName":null,"email":null,"phoneNumber":null},"totalExperienceAnalysis":{"totalExperience":null,"domainExperience":0,"leadershipExperience":"0.0 years"},"skillExtraction":{"extractedSkills":[]},"educationDetails":[{"degree":null,"college":null,"passingYear":null,"cgpaOrPercentage":null}],"projectAnalysis":[{"projectName":null,"projectDescription":null,"technologiesUsed":[]}]}`;

// ─── Main Analyzer ────────────────────────────────────────────────────────────

async function analyzeResume(cleanedText, deterministicData, requestId) {
  const client = getClient();
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const maxTokens = parseInt(process.env.GROQ_MAX_TOKENS, 10) || 2000;

  const userPrompt = buildUserPrompt(cleanedText, deterministicData);

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    max_tokens: maxTokens,
    temperature: 0,   // Fully deterministic — fastest and most consistent
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq returned empty content');
  return content;
}

function buildUserPrompt(cleanedText, deterministicData) {
  const emailLine = deterministicData.email
    ? `Email (confirmed, use exactly): ${deterministicData.email}`
    : 'Email: not detected';

  const phoneLine = deterministicData.phoneNumber
    ? `Phone (confirmed, use exactly): ${deterministicData.phoneNumber}`
    : 'Phone: not detected';

  return `Analyze this resume. Return JSON matching the schema exactly.

CONFIRMED VALUES (do not change these):
${emailLine}
${phoneLine}

RESUME:
${cleanedText}`;
}

module.exports = { analyzeResume };
