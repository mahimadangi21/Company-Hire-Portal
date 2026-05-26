'use strict';

/**
 * sectionParser.js
 * Segments cleaned resume text into labeled semantic sections.
 * This structured format dramatically improves OpenAI extraction accuracy
 * by telling the model exactly where each piece of information lives.
 */

// ─── Section Detection Patterns ──────────────────────────────────────────────

const SECTION_PATTERNS = {
  summary: [
    /^(professional\s+)?summary$/i,
    /^(career\s+)?objective$/i,
    /^profile(\s+summary)?$/i,
    /^about\s+me$/i,
    /^overview$/i,
    /^introduction$/i,
  ],
  skills: [
    /^(technical\s+)?skills?$/i,
    /^technologies(\s+used)?$/i,
    /^tech\s+stack$/i,
    /^core\s+competencies$/i,
    /^tools?\s+(and\s+technologies)?$/i,
    /^programming\s+languages?$/i,
    /^frameworks?\s+(and\s+(libraries|tools))?$/i,
    /^languages\s+(and\s+(tools|frameworks))?$/i,
    /^key\s+skills?$/i,
    /^expertise$/i,
    /^technical\s+proficiencies?$/i,
  ],
  experience: [
    /^(work\s+)?experience$/i,
    /^employment(\s+history)?$/i,
    /^professional\s+experience$/i,
    /^career\s+history$/i,
    /^work\s+history$/i,
    /^(industry\s+)?experience$/i,
    /^internship(s)?$/i,
    /^training(\s+and\s+experience)?$/i,
  ],
  education: [
    /^education(al\s+background)?$/i,
    /^academic(\s+(background|qualifications?))?$/i,
    /^qualification(s)?$/i,
    /^degrees?$/i,
    /^schooling$/i,
  ],
  projects: [
    /^(personal\s+|academic\s+|key\s+|major\s+)?projects?$/i,
    /^portfolio(\s+projects?)?$/i,
    /^(notable\s+)?works?$/i,
    /^applications?$/i,
    /^(academic\s+)?assignments?$/i,
  ],
  certifications: [
    /^certifications?$/i,
    /^certificates?$/i,
    /^courses?(\s+(and\s+certifications?))?$/i,
    /^achievements?(\s+(and\s+certifications?))?$/i,
    /^training(\s+(and\s+certifications?))?$/i,
  ],
  awards: [
    /^(honors?|awards?|achievements?|accomplishments?)$/i,
    /^recognition$/i,
  ],
};

// ─── Section Detector ─────────────────────────────────────────────────────────

/**
 * Determines if a line is a section header.
 * A header is typically a short (1–5 words) line that matches a pattern.
 */
function detectSectionType(line) {
  const trimmed = line.trim();

  // Section headers are typically short and don't end with punctuation
  if (!trimmed || trimmed.length > 60 || trimmed.endsWith('.') || trimmed.endsWith(',')) {
    return null;
  }

  // Must be reasonably short (section titles rarely exceed 5 words)
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount > 6) return null;

  for (const [section, patterns] of Object.entries(SECTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(trimmed)) return section;
    }
  }

  return null;
}

// ─── Section Parser ────────────────────────────────────────────────────────────

/**
 * Parse resume text into labeled sections.
 * Returns an object with section name → lines array.
 *
 * @param {string} text - Cleaned resume text
 * @returns {Object} sections
 */
function parseIntoSections(text) {
  const lines = text.split('\n');

  const sections = {
    header: [],       // Top of resume (name, contact)
    summary: [],
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    awards: [],
    other: [],
  };

  let currentSection = 'header';
  let headerLineLimit = 8; // First N lines are treated as header regardless
  let lineIndex = 0;

  for (const line of lines) {
    lineIndex++;

    // Force first few lines into header (name, phone, email area)
    if (lineIndex <= headerLineLimit && currentSection === 'header') {
      sections.header.push(line);
      continue;
    }

    const detectedSection = detectSectionType(line);
    if (detectedSection) {
      currentSection = detectedSection;
      // Don't add the section header line itself — just the content
      continue;
    }

    sections[currentSection].push(line);
  }

  return sections;
}

// ─── Formatter ────────────────────────────────────────────────────────────────

/**
 * Format sections into a structured prompt-friendly string.
 * Empty sections are omitted to reduce token usage.
 *
 * @param {Object} sections
 * @returns {string}
 */
function formatSectionsForPrompt(sections) {
  const SECTION_LABELS = {
    header:         '=== PERSONAL INFORMATION / HEADER ===',
    summary:        '=== PROFESSIONAL SUMMARY ===',
    skills:         '=== TECHNICAL SKILLS ===',
    experience:     '=== WORK EXPERIENCE ===',
    education:      '=== EDUCATION ===',
    projects:       '=== PROJECTS ===',
    certifications: '=== CERTIFICATIONS ===',
    awards:         '=== AWARDS & ACHIEVEMENTS ===',
    other:          '=== OTHER ===',
  };

  const parts = [];

  for (const [key, label] of Object.entries(SECTION_LABELS)) {
    const content = (sections[key] || [])
      .join('\n')
      .trim();

    if (content.length > 10) { // Only include non-trivial sections
      parts.push(`${label}\n${content}`);
    }
  }

  return parts.join('\n\n');
}

module.exports = { parseIntoSections, formatSectionsForPrompt };
