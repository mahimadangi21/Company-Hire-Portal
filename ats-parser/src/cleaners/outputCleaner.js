'use strict';

/**
 * outputCleaner.js
 * Final cleaning pass after Zod validation.
 *
 * Responsibilities:
 * 1. Normalize skill names using skillDictionary.json
 * 2. Remove blacklisted non-technical terms (skillBlacklist.json)
 * 3. Deduplicate skills (case-insensitive, post-normalization)
 * 4. Apply deterministic PII values over AI output
 * 5. Replace null placeholders ("N/A", "", "-") with actual null
 * 6. Enforce leadershipExperience default
 * 7. Enforce technologiesUsed cleanup in projects
 */

const path = require('path');

// ─── Load Data Files ──────────────────────────────────────────────────────────

const skillDictionary = require('../data/skillDictionary.json');
const skillBlacklist = require('../data/skillBlacklist.json');

// Pre-build lookup structures for performance
const blacklistSet = new Set(skillBlacklist.map(s => s.toLowerCase().trim()));

// Case-insensitive dictionary lookup: lowercase key → canonical value
const dictLowerMap = new Map(
  Object.entries(skillDictionary).map(([k, v]) => [k.toLowerCase().trim(), v])
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NULL_PLACEHOLDERS = new Set([
  'n/a', 'na', '-', '--', '—', 'none', 'nil', 'unknown',
  'not applicable', 'not provided', 'not available', 'not mentioned',
  'not specified', 'not found', 'missing', 'empty', 'tbd',
]);

/**
 * Converts placeholder strings to actual null.
 */
function toNullIfPlaceholder(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (trimmed === '' || NULL_PLACEHOLDERS.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

/**
 * Normalize a single skill name using skillDictionary.
 * If not in dictionary, return as-is (trimmed).
 */
function normalizeSkill(skill) {
  if (!skill || typeof skill !== 'string') return null;
  const trimmed = skill.trim();
  if (!trimmed) return null;

  // Exact case-insensitive dictionary lookup
  const dictMatch = dictLowerMap.get(trimmed.toLowerCase());
  if (dictMatch) return dictMatch;

  // Return as-is (trimmed) if not in dictionary
  return trimmed;
}

/**
 * Returns true if the skill should be excluded.
 * Checks against blacklist (case-insensitive).
 */
function isBlacklisted(skill) {
  if (!skill) return true;
  return blacklistSet.has(skill.toLowerCase().trim());
}

/**
 * Deduplicate skills after normalization.
 * Uses case-insensitive Set to catch "react" vs "React".
 */
function deduplicateSkills(skills) {
  const seen = new Set();   // lowercase → for dedup check
  const result = [];

  for (const raw of skills) {
    const normalized = normalizeSkill(raw);
    if (!normalized) continue;
    if (isBlacklisted(normalized)) continue;

    const key = normalized.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(normalized);
    }
  }

  return result;
}

/**
 * Clean all string fields on an object using toNullIfPlaceholder.
 */
function cleanStringFields(obj, fields) {
  for (const field of fields) {
    if (field in obj) {
      obj[field] = toNullIfPlaceholder(obj[field]);
    }
  }
  return obj;
}

// ─── Main Cleaner ─────────────────────────────────────────────────────────────

/**
 * Run the full output cleaning pipeline.
 *
 * @param {object} validatedData - Data that passed Zod validation
 * @param {{ email: string|null, phoneNumber: string|null }} deterministicData
 * @returns {object} Final clean output matching the exact schema
 */
function cleanOutput(validatedData, deterministicData) {
  // Deep clone to avoid mutating Zod-validated object
  const data = JSON.parse(JSON.stringify(validatedData));

  // ── 1. Personal Information ────────────────────────────────────────────────
  cleanStringFields(data.personalInformation, ['fullName', 'email', 'phoneNumber']);

  // Deterministic override — regex parser is higher confidence than AI
  if (deterministicData.email) {
    data.personalInformation.email = deterministicData.email;
  }
  if (deterministicData.phoneNumber) {
    data.personalInformation.phoneNumber = deterministicData.phoneNumber;
  }

  // ── 2. Experience ──────────────────────────────────────────────────────────
  const exp = data.totalExperienceAnalysis;
  exp.totalExperience = toNullIfPlaceholder(exp.totalExperience);

  // Ensure domainExperience is a non-negative number
  if (typeof exp.domainExperience !== 'number' || isNaN(exp.domainExperience)) {
    exp.domainExperience = 0;
  }
  exp.domainExperience = Math.max(0, exp.domainExperience);

  // Default leadershipExperience
  if (!exp.leadershipExperience || toNullIfPlaceholder(exp.leadershipExperience) === null) {
    exp.leadershipExperience = '0.0 years';
  }

  // ── 3. Skills ──────────────────────────────────────────────────────────────
  const rawSkills = data.skillExtraction.extractedSkills || [];
  data.skillExtraction.extractedSkills = deduplicateSkills(rawSkills);

  // ── 4. Education ───────────────────────────────────────────────────────────
  data.educationDetails = (data.educationDetails || []).map(edu => {
    cleanStringFields(edu, ['degree', 'college', 'passingYear', 'cgpaOrPercentage']);
    return edu;
  });

  // ── 5. Projects ────────────────────────────────────────────────────────────
  data.projectAnalysis = (data.projectAnalysis || []).map(project => {
    cleanStringFields(project, ['projectName', 'projectDescription']);

    // Clean and deduplicate project technologies
    project.technologiesUsed = deduplicateSkills(project.technologiesUsed || []);

    return project;
  });

  return data;
}

module.exports = { cleanOutput };
