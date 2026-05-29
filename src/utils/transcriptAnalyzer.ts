/* ═══════════════════════════════════════════════════════════════
   TRANSCRIPT INTELLIGENCE ANALYZER
   Pure client-side NLP — no API calls
═══════════════════════════════════════════════════════════════ */

export interface TranscriptEntry {
  question: string;
  answer: string;
  timestamp_start?: number;
  timestamp_end?: number;
}

export interface TranscriptAnalysisResult {
  communication: number;
  technical: number;
  problemSolving: number;
  professionalism: number;
  leadership: number;
  confidence: number;
  fluency: number;
  fillerWordCount: number;
  fillerWords: string[];
  tone: string;
  sentiment: string;
  recommendation: string;
  recommendationReason: string;
  ownershipSignals: string[];
  hesitationPatterns: string[];
  leadershipIndicators: string[];
  keyObservations: string[];
  behavioralSignals: {
    ownership: number;
    hesitation: number;
    confidence: number;
    communication: number;
  };
  practicalExperienceScore: number;
  technicalGaps: string[];
}

/* ─── Filler word lists ─────────────────────────────────────── */
const FILLER_WORDS = [
  'um', 'uh', 'like', 'you know', 'basically', 'literally', 'actually',
  'so', 'right', 'okay', 'well', 'hmm', 'kind of', 'sort of', 'i mean',
  'you see', 'anyway', 'honestly', 'just', 'totally'
];

const OWNERSHIP_KEYWORDS = [
  'i led', 'i built', 'i designed', 'i created', 'i implemented', 'i developed',
  'i managed', 'i owned', 'i was responsible', 'i took', 'i drove', 'i initiated',
  'i established', 'my team', 'i launched', 'i delivered', 'i architected',
  'my project', 'i completed', 'i solved', 'i fixed', 'i improved'
];

const LEADERSHIP_KEYWORDS = [
  'led a team', 'managed', 'mentored', 'coached', 'hired', 'onboarded',
  'strategy', 'stakeholder', 'executive', 'cross-functional', 'roadmap',
  'vision', 'initiative', 'guided', 'motivated', 'aligned', 'collaborated',
  'team lead', 'tech lead', 'scrum master', 'product owner', 'director',
  'leadership', 'leading', 'coordinate', 'oversee', 'report to'
];

const TECHNICAL_KEYWORDS = [
  'algorithm', 'api', 'database', 'sql', 'nosql', 'react', 'angular', 'vue',
  'nodejs', 'python', 'java', 'typescript', 'javascript', 'architecture',
  'microservices', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'ci/cd',
  'devops', 'rest', 'graphql', 'testing', 'unit test', 'performance',
  'optimization', 'scalability', 'security', 'agile', 'scrum', 'git',
  'backend', 'frontend', 'fullstack', 'machine learning', 'data', 'cloud',
  'serverless', 'redis', 'kafka', 'rabbitmq', 'mongodb', 'postgresql'
];

const PROBLEM_SOLVING_KEYWORDS = [
  'solved', 'resolved', 'fixed', 'debugged', 'optimized', 'refactored',
  'improved', 'enhanced', 'analyzed', 'investigated', 'root cause',
  'bottleneck', 'challenge', 'approach', 'solution', 'workaround',
  'identify', 'diagnose', 'prototype', 'iterate', 'experiment', 'hypothesis',
  'trade-off', 'decision', 'evaluated', 'benchmarked', 'measured'
];

const HESITATION_PATTERNS = [
  'i\'m not sure', 'i don\'t know', 'maybe', 'perhaps', 'i think', 'i guess',
  'not really', 'kind of', 'sort of', 'hard to say', 'it depends', 'i might',
  'could be', 'i suppose', 'somewhat', 'not exactly', 'a bit', 'somewhat'
];

const PROFESSIONALISM_KEYWORDS = [
  'deadline', 'quality', 'standard', 'process', 'documentation', 'review',
  'feedback', 'communication', 'transparent', 'accountable', 'reliable',
  'consistent', 'professional', 'ownership', 'commitment', 'integrity',
  'best practice', 'sprint', 'milestone', 'deliverable', 'client', 'stakeholder'
];

/* ─── Helpers ───────────────────────────────────────────────── */
const getText = (transcript: TranscriptEntry[]): string =>
  transcript.map(e => `${e.question} ${e.answer}`).join(' ').toLowerCase();

const getAnswers = (transcript: TranscriptEntry[]): string =>
  transcript.map(e => e.answer || '').join(' ').toLowerCase();

const countMatches = (text: string, keywords: string[]): number =>
  keywords.reduce((acc, kw) => {
    const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = text.match(regex);
    return acc + (matches ? matches.length : 0);
  }, 0);

const clamp = (v: number, min = 0, max = 100): number =>
  Math.max(min, Math.min(max, Math.round(v)));

/* ─── TASK 2 Exported Functions ─────────────────────────────── */

export function extractFillerWords(transcript: TranscriptEntry[]): { count: number; words: string[] } {
  const answers = getAnswers(transcript);
  const found: string[] = [];
  FILLER_WORDS.forEach(fw => {
    const regex = new RegExp(`\\b${fw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = answers.match(regex);
    if (matches && matches.length > 0) {
      found.push(`"${fw}" (×${matches.length})`);
    }
  });
  const count = found.length;
  return { count, words: found };
}

export function calculateConfidence(transcript: TranscriptEntry[]): number {
  if (!transcript.length) return 0;
  const answers = getAnswers(transcript);
  const wordCount = answers.split(/\s+/).length;
  const fillerCount = FILLER_WORDS.reduce((a, fw) => {
    const r = new RegExp(`\\b${fw}\\b`, 'gi');
    return a + (answers.match(r)?.length || 0);
  }, 0);
  const hesitationCount = countMatches(answers, HESITATION_PATTERNS);
  const ownershipCount = countMatches(answers, OWNERSHIP_KEYWORDS);
  
  const fillerPenalty = Math.min(35, (fillerCount / Math.max(wordCount, 1)) * 500);
  const hesitationPenalty = Math.min(25, hesitationCount * 4);
  const ownershipBonus = Math.min(20, ownershipCount * 3);
  
  const avgAnswerLen = transcript.reduce((a, e) => a + (e.answer?.split(' ').length || 0), 0) / transcript.length;
  const lenBonus = Math.min(15, avgAnswerLen * 0.4);
  
  return clamp(60 + ownershipBonus + lenBonus - fillerPenalty - hesitationPenalty);
}

export function calculateCommunication(transcript: TranscriptEntry[]): number {
  if (!transcript.length) return 0;
  const answers = getAnswers(transcript);
  const wordCount = answers.split(/\s+/).filter(Boolean).length;
  const sentenceCount = answers.split(/[.!?]+/).filter(Boolean).length;
  const avgSentenceLen = wordCount / Math.max(sentenceCount, 1);
  
  const clarity = clamp(avgSentenceLen > 5 && avgSentenceLen < 30 ? 75 : 50);
  const vocabulary = Math.min(100, new Set(answers.split(/\s+/).map(w => w.toLowerCase())).size / Math.max(wordCount, 1) * 200);
  const fillerPenalty = Math.min(30, (countMatches(answers, FILLER_WORDS) / Math.max(wordCount, 1)) * 400);
  
  return clamp((clarity * 0.4) + (vocabulary * 0.4) - fillerPenalty + 10);
}

export function detectOwnership(transcript: TranscriptEntry[]): string[] {
  const answers = getAnswers(transcript);
  const signals: string[] = [];
  
  OWNERSHIP_KEYWORDS.forEach(kw => {
    const regex = new RegExp(`[^.!?]*${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^.!?]*[.!?]?`, 'gi');
    const matches = answers.match(regex);
    if (matches) {
      const snippet = matches[0].trim().slice(0, 80);
      if (snippet && !signals.some(s => s.includes(snippet.slice(0, 20)))) {
        signals.push(snippet + (snippet.length >= 80 ? '...' : ''));
      }
    }
  });
  
  return signals.slice(0, 5);
}

export function detectLeadership(transcript: TranscriptEntry[]): string[] {
  const answers = getAnswers(transcript);
  const indicators: string[] = [];
  
  LEADERSHIP_KEYWORDS.forEach(kw => {
    const regex = new RegExp(`[^.!?]*${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^.!?]*[.!?]?`, 'gi');
    const matches = answers.match(regex);
    if (matches) {
      const snippet = matches[0].trim().slice(0, 90);
      if (snippet && !indicators.some(s => s.includes(snippet.slice(0, 20)))) {
        indicators.push(snippet + (snippet.length >= 90 ? '...' : ''));
      }
    }
  });
  
  return indicators.slice(0, 4);
}

export function detectTechnicalSignals(transcript: TranscriptEntry[]): { score: number; gaps: string[] } {
  const text = getText(transcript);
  const techHits = countMatches(text, TECHNICAL_KEYWORDS);
  const score = clamp(40 + Math.min(55, techHits * 3));
  
  const commonTech = ['api', 'testing', 'database', 'git', 'agile'];
  const gaps = commonTech.filter(t => !text.includes(t)).map(t => `No mention of ${t.toUpperCase()}`);
  
  return { score, gaps: gaps.slice(0, 3) };
}

export function detectProblemSolving(transcript: TranscriptEntry[]): number {
  if (!transcript.length) return 0;
  const answers = getAnswers(transcript);
  const hits = countMatches(answers, PROBLEM_SOLVING_KEYWORDS);
  const structuredAnswer = transcript.some(e => {
    const a = (e.answer || '').toLowerCase();
    return (a.includes('first') || a.includes('step')) &&
           (a.includes('then') || a.includes('next') || a.includes('finally'));
  });
  
  return clamp(40 + Math.min(45, hits * 4) + (structuredAnswer ? 15 : 0));
}

export function generateRecommendation(scores: {
  communication: number;
  technical: number;
  problemSolving: number;
  confidence: number;
  leadership: number;
}): { label: string; reason: string } {
  const avg = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;
  
  if (avg >= 80) {
    return {
      label: 'Strongly Recommend',
      reason: `Candidate demonstrates exceptional capabilities across all dimensions with an average score of ${Math.round(avg)}. Strong communication, solid technical depth, and clear leadership signals make this a top-tier candidate.`
    };
  } else if (avg >= 68) {
    return {
      label: 'Recommend',
      reason: `Candidate shows strong potential with an average score of ${Math.round(avg)}. Good communication skills and technical understanding with minor areas for growth in leadership and confidence.`
    };
  } else if (avg >= 55) {
    return {
      label: 'Consider',
      reason: `Candidate demonstrates moderate capabilities with an average score of ${Math.round(avg)}. Some areas need improvement but overall shows promise with coaching and development.`
    };
  } else {
    return {
      label: 'Not Recommended',
      reason: `Candidate shows significant gaps across key dimensions with an average score of ${Math.round(avg)}. Major development needed before they are ready for this role.`
    };
  }
}

/* ─── Main analysis function ─────────────────────────────────── */
export function analyzeTranscript(transcript: TranscriptEntry[]): TranscriptAnalysisResult {
  if (!transcript || transcript.length === 0) {
    return {
      communication: 0, technical: 0, problemSolving: 0,
      professionalism: 0, leadership: 0, confidence: 0, fluency: 0,
      fillerWordCount: 0, fillerWords: [],
      tone: 'Neutral', sentiment: 'Neutral',
      recommendation: 'Insufficient Data', recommendationReason: 'No transcript data available to analyze.',
      ownershipSignals: [], hesitationPatterns: [], leadershipIndicators: [], keyObservations: [],
      behavioralSignals: { ownership: 0, hesitation: 0, confidence: 0, communication: 0 },
      practicalExperienceScore: 0, technicalGaps: []
    };
  }
  
  const answers = getAnswers(transcript);
  const { count: fillerWordCount, words: fillerWords } = extractFillerWords(transcript);
  const confidence = calculateConfidence(transcript);
  const communication = calculateCommunication(transcript);
  const problemSolving = detectProblemSolving(transcript);
  const { score: technical, gaps: technicalGaps } = detectTechnicalSignals(transcript);
  const ownershipSignals = detectOwnership(transcript);
  const leadershipIndicators = detectLeadership(transcript);
  
  // Professionalism
  const profHits = countMatches(answers, PROFESSIONALISM_KEYWORDS);
  const professionalism = clamp(50 + Math.min(40, profHits * 4));
  
  // Leadership score
  const leaderHits = countMatches(answers, LEADERSHIP_KEYWORDS);
  const leadership = clamp(30 + Math.min(65, leaderHits * 5));
  
  // Fluency: ratio of clean sentences to total
  const sentences = answers.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const cleanSentences = sentences.filter(s => {
    const fillerHits = FILLER_WORDS.filter(fw => s.includes(fw)).length;
    return fillerHits === 0;
  }).length;
  const fluency = clamp(sentences.length > 0 ? (cleanSentences / sentences.length) * 100 : 50);
  
  // Hesitation patterns
  const hesitationPatterns = HESITATION_PATTERNS
    .filter(hp => answers.includes(hp))
    .map(hp => `"${hp}" detected`)
    .slice(0, 4);
  
  // Tone detection
  const positiveWords = ['great', 'excited', 'passionate', 'love', 'excellent', 'proud', 'amazing', 'fantastic'];
  const negativeWords = ['difficult', 'struggle', 'failed', 'challenge', 'problem', 'issue', 'frustrat'];
  const posCount = countMatches(answers, positiveWords);
  const negCount = countMatches(answers, negativeWords);
  const tone = posCount > negCount + 2 ? 'Positive' : negCount > posCount + 2 ? 'Cautious' : 'Professional';
  
  // Sentiment
  const sentiment = posCount > negCount ? 'Positive' : posCount < negCount ? 'Mixed' : 'Neutral';
  
  // Key Observations
  const keyObservations: string[] = [];
  if (confidence >= 75) keyObservations.push('Demonstrates high self-confidence throughout the interview');
  if (communication >= 70) keyObservations.push('Clear and articulate communication style');
  if (leaderHits >= 2) keyObservations.push('Shows evidence of leadership experience');
  if (ownershipSignals.length >= 3) keyObservations.push('Strong ownership mindset — takes personal responsibility');
  if (technical >= 75) keyObservations.push('Strong technical vocabulary and depth');
  if (fillerWordCount > 5) keyObservations.push(`Frequent use of filler words (${fillerWordCount} detected) — impacts fluency`);
  if (hesitationPatterns.length >= 3) keyObservations.push('Multiple hesitation signals suggest nervousness or uncertainty');
  if (problemSolving >= 70) keyObservations.push('Analytical and structured problem-solving approach evident');
  if (keyObservations.length === 0) keyObservations.push('Standard interview performance with no outstanding signals');
  
  // Practical experience
  const expKeywords = ['years', 'year', 'production', 'deployed', 'released', 'client', 'real', 'live', 'enterprise'];
  const practicalExperienceScore = clamp(35 + Math.min(60, countMatches(answers, expKeywords) * 6));
  
  // Behavioral signals
  const ownershipScore = clamp(30 + Math.min(65, ownershipSignals.length * 14));
  const hesitationScore = clamp(100 - Math.min(80, hesitationPatterns.length * 18));
  
  const rec = generateRecommendation({ communication, technical, problemSolving, confidence, leadership });
  
  return {
    communication,
    technical,
    problemSolving,
    professionalism: clamp(professionalism / 10), // normalize to 0-10
    leadership,
    confidence,
    fluency,
    fillerWordCount,
    fillerWords,
    tone,
    sentiment,
    recommendation: rec.label,
    recommendationReason: rec.reason,
    ownershipSignals,
    hesitationPatterns,
    leadershipIndicators,
    keyObservations,
    behavioralSignals: {
      ownership: ownershipScore,
      hesitation: hesitationScore,
      confidence,
      communication,
    },
    practicalExperienceScore,
    technicalGaps,
  };
}
