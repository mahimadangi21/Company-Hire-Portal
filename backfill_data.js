const { createClient } = require("@supabase/supabase-js");

const url = "https://npogsacnialzixgnxmoq.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wb2dzYWNuaWFseml4Z254bW9xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk1NjIxMCwiZXhwIjoyMDk1NTMyMjEwfQ.jBT6bRXW-VfWZE5HV3U0YZAvTY0-3ClBgjG_RVIIkaI";

const supabase = createClient(url, key);

function analyze(transcript) {
  const FILLER_WORDS = [
    'um', 'uh', 'like', 'you know', 'basically', 'literally', 'actually',
    'so', 'right', 'okay', 'well', 'hmm', 'kind of', 'sort of', 'i mean',
    'you see', 'anyway', 'honestly', 'just', 'totally'
  ];

  const OWNERSHIP_KEYWORDS = [
    'i led', 'i built', 'i designed', 'i created', 'i implemented', 'i developed',
    'i managed', 'i owned', 'i was responsible', 'i took', 'i drove', 'i initiated',
    'i established', 'my team', 'i launched', 'i delivered', 'i architected',
    'my project', 'i completed', 'i solved', 'i fixed', 'i improved',
    'responsibility', 'ownership', 'responsible', 'deliverable', 'accountability',
    'i handle', 'i take care', 'my role', 'my task'
  ];

  const LEADERSHIP_KEYWORDS = [
    'led a team', 'managed', 'mentored', 'coached', 'hired', 'onboarded',
    'strategy', 'stakeholder', 'executive', 'cross-functional', 'roadmap',
    'vision', 'initiative', 'guided', 'motivated', 'aligned', 'collaborated',
    'team lead', 'tech lead', 'scrum master', 'product owner', 'director',
    'leadership', 'leading', 'coordinate', 'oversee', 'report to',
    'collaboration', 'collaborative', 'mentor', 'team player', 'guided the team',
    'facilitated', 'led the effort', 'spearheaded'
  ];

  const TECHNICAL_KEYWORDS = [
    'algorithm', 'api', 'database', 'sql', 'nosql', 'react', 'angular', 'vue',
    'nodejs', 'python', 'java', 'typescript', 'javascript', 'architecture',
    'microservices', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'ci/cd',
    'devops', 'rest', 'graphql', 'testing', 'unit test', 'performance',
    'optimization', 'scalability', 'security', 'agile', 'scrum', 'git',
    'backend', 'frontend', 'fullstack', 'machine learning', 'data', 'cloud',
    'serverless', 'redis', 'kafka', 'rabbitmq', 'mongodb', 'postgresql',
    // UI/UX
    'figma', 'sketch', 'adobe', 'wireframe', 'wireframing', 'prototype',
    'prototyping', 'usability', 'user research', 'user interface', 'user experience',
    'design system', 'mockup', 'high-fidelity', 'information architecture',
    'typography', 'color palette', 'component', 'responsive'
  ];

  const PROBLEM_SOLVING_KEYWORDS = [
    'solved', 'resolved', 'fixed', 'debugged', 'optimized', 'refactored',
    'improved', 'enhanced', 'analyzed', 'investigated', 'root cause',
    'bottleneck', 'challenge', 'approach', 'solution', 'workaround',
    'identify', 'diagnose', 'prototype', 'iterate', 'experiment', 'hypothesis',
    'trade-off', 'decision', 'evaluated', 'benchmarked', 'measured',
    'solving', 'fixing', 'debugging', 'optimization', 'refactoring',
    'resolved the issue', 'troubleshoot', 'troubleshooting'
  ];

  const getAnswers = (t) => t.map(e => {
    const a = e.answer || '';
    if (!a || a.toLowerCase().includes('no answer provided')) {
      return e.question || '';
    }
    return a;
  }).join(' ').toLowerCase();

  const countMatches = (text, keywords) => keywords.reduce((acc, kw) => {
    const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = text.match(regex);
    return acc + (matches ? matches.length : 0);
  }, 0);

  const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(v)));

  const answers = getAnswers(transcript);
  const text = transcript.map(e => `${e.question} ${e.answer}`).join(' ').toLowerCase();

  const wordCount = answers.split(/\s+/).length;
  const fillerCount = FILLER_WORDS.reduce((a, fw) => {
    const r = new RegExp(`\\b${fw}\\b`, 'gi');
    return a + (answers.match(r)?.length || 0);
  }, 0);
  const hesitationCount = countMatches(answers, [
    'i\'m not sure', 'i don\'t know', 'maybe', 'perhaps', 'i think', 'i guess',
    'not really', 'kind of', 'sort of', 'hard to say', 'it depends', 'i might',
    'could be', 'i suppose', 'somewhat', 'not exactly', 'a bit'
  ]);
  const ownershipCount = countMatches(answers, OWNERSHIP_KEYWORDS);
  
  const fillerPenalty = Math.min(20, (fillerCount / Math.max(wordCount, 1)) * 300);
  const hesitationPenalty = Math.min(15, hesitationCount * 3);
  const ownershipBonus = Math.min(15, ownershipCount * 3);
  
  const avgAnswerLen = transcript.reduce((a, e) => a + (e.answer?.split(' ').length || 0), 0) / transcript.length;
  const lenBonus = Math.min(10, avgAnswerLen * 0.3);
  
  const confidence = clamp(70 + ownershipBonus + lenBonus - fillerPenalty - hesitationPenalty);

  const sentenceCount = answers.split(/[.!?]+/).filter(Boolean).length;
  const avgSentenceLen = wordCount / Math.max(sentenceCount, 1);
  const clarity = clamp(avgSentenceLen > 5 && avgSentenceLen < 30 ? 80 : 65);
  const vocabulary = Math.min(100, new Set(answers.split(/\s+/).map(w => w.toLowerCase())).size / Math.max(wordCount, 1) * 200);
  const fillerPenaltyComm = Math.min(20, (countMatches(answers, FILLER_WORDS) / Math.max(wordCount, 1)) * 300);
  
  const communication = clamp((clarity * 0.4) + (vocabulary * 0.4) - fillerPenaltyComm + 20);

  const techHits = countMatches(text, TECHNICAL_KEYWORDS);
  const technical = clamp(68 + Math.min(27, techHits * 4));

  const probHits = countMatches(answers, PROBLEM_SOLVING_KEYWORDS);
  const structuredAnswer = transcript.some(e => {
    const a = (e.answer || '').toLowerCase();
    return (a.includes('first') || a.includes('step')) &&
           (a.includes('then') || a.includes('next') || a.includes('finally'));
  });
  const problemSolving = clamp(65 + Math.min(25, probHits * 5) + (structuredAnswer ? 10 : 0));

  const leaderHits = countMatches(answers, LEADERSHIP_KEYWORDS);
  const leadership = clamp(60 + Math.min(35, leaderHits * 6));

  const avg = (communication + technical + problemSolving + confidence + leadership) / 5;
  let recommendation = 'Recommend';
  if (avg >= 78) recommendation = 'Strongly Recommend';
  else if (avg < 55) recommendation = 'Not Recommended';
  else if (avg < 68) recommendation = 'Consider';

  return {
    communication,
    technical,
    leadership,
    confidence,
    fluency: 85,
    recommendation
  };
}

async function main() {
  const { data: candidates, error } = await supabase
    .from("candidates")
    .select("*");
  
  if (error) {
    console.error("Error fetching candidates:", error);
    return;
  }
  
  console.log("Found", candidates.length, "candidates.");
  
  for (const c of candidates) {
    const transcript = c.extracted_data?.transcript || c.transcript || [];
    if (transcript.length > 0) {
      console.log(`Force backfilling scores for ${c.name}...`);
      const analysis = analyze(transcript);
      const video_score = Math.round((analysis.communication + analysis.confidence + analysis.fluency) / 3);
      const tech_score = analysis.technical;
      const final_recommendation = analysis.recommendation;
      
      const { error: updateError } = await supabase
        .from("candidates")
        .update({
          video_score,
          tech_score,
          final_recommendation,
          video_status: 'Completed',
          tech_status: 'Completed'
        })
        .eq("id", c.id);
        
      if (updateError) {
        console.error(`Error updating ${c.name}:`, updateError);
      } else {
        console.log(`Successfully updated ${c.name}: Video ${video_score}%, Tech ${tech_score}%, Rec: ${final_recommendation}`);
      }
    }
  }
}

main();
