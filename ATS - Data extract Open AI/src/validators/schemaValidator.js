'use strict';

/**
 * schemaValidator.js
 * Validates OpenAI JSON output against the Zod schema.
 * Uses .strip() (not .strict()) on nested schemas so extra keys from OpenAI
 * are silently removed rather than causing validation failures.
 */

const { z } = require('zod');

// ─── Zod Schema ───────────────────────────────────────────────────────────────
// NOTE: Sub-schemas use .strip() (default) NOT .strict()
// Reason: OpenAI sometimes adds extra keys like "note", "remarks", "source"
// inside nested objects. .strict() would reject the whole response.
// The top-level schema uses .strip() too — extra top-level keys are removed.

const PersonalInformationSchema = z.object({
  fullName: z.string().nullable().default(null),
  email: z.string().nullable().default(null),
  phoneNumber: z.string().nullable().default(null),
});

const TotalExperienceSchema = z.object({
  totalExperience: z.string().nullable().default(null),
  domainExperience: z.number().default(0),
  leadershipExperience: z.string().default('0.0 years'),
});

const SkillExtractionSchema = z.object({
  extractedSkills: z.array(z.string()).default([]),
});

const EducationDetailSchema = z.object({
  degree: z.string().nullable().default(null),
  college: z.string().nullable().default(null),
  passingYear: z.string().nullable().default(null),
  cgpaOrPercentage: z.string().nullable().default(null),
});

const ProjectSchema = z.object({
  projectName: z.string().nullable().default(null),
  projectDescription: z.string().nullable().default(null),
  technologiesUsed: z.array(z.string()).default([]),
});

const ResumeSchema = z.object({
  personalInformation: PersonalInformationSchema,
  totalExperienceAnalysis: TotalExperienceSchema,
  skillExtraction: SkillExtractionSchema,
  educationDetails: z.array(EducationDetailSchema).default([]),
  projectAnalysis: z.array(ProjectSchema).default([]),
});

// ─── Sanity / Hallucination Detection ────────────────────────────────────────

const HALLUCINATION_PATTERNS = [
  /lorem\s+ipsum/i,
  /john\s+doe/i,
  /jane\s+doe/i,
  /sample\s+(resume|candidate)/i,
  /example\s+(candidate|person)/i,
  /fictional\s+person/i,
  /test@test\.com/i,
  /your(name|email)@/i,
  /placeholder/i,
];

function isSuspiciousString(value) {
  if (!value || typeof value !== 'string') return false;
  return HALLUCINATION_PATTERNS.some(p => p.test(value));
}

function runSanityChecks(data) {
  const issues = [];

  if (isSuspiciousString(data.personalInformation?.fullName)) {
    issues.push(`Suspicious fullName: "${data.personalInformation.fullName}"`);
  }
  if (isSuspiciousString(data.personalInformation?.email)) {
    issues.push(`Suspicious email: "${data.personalInformation.email}"`);
  }

  const domainExp = data.totalExperienceAnalysis?.domainExperience;
  if (typeof domainExp === 'number' && (domainExp > 70 || domainExp < 0)) {
    issues.push(`Unrealistic domainExperience: ${domainExp}`);
  }

  if (Array.isArray(data.projectAnalysis)) {
    for (const project of data.projectAnalysis) {
      if (isSuspiciousString(project.projectName)) {
        issues.push(`Suspicious projectName: "${project.projectName}"`);
      }
    }
  }

  return issues;
}

// ─── Type Coercion ────────────────────────────────────────────────────────────

/**
 * Coerce types before Zod validation.
 * Handles all the ways OpenAI deviates from the expected types.
 */
function coerceTypes(parsed) {
  if (!parsed || typeof parsed !== 'object') return parsed;

  // ── totalExperienceAnalysis ─────────────────────────────────────────────
  if (parsed.totalExperienceAnalysis) {
    const exp = parsed.totalExperienceAnalysis;

    // domainExperience: coerce string "2", "2.5" → number
    if (typeof exp.domainExperience === 'string') {
      const num = parseFloat(exp.domainExperience);
      exp.domainExperience = isNaN(num) ? 0 : num;
    }
    if (exp.domainExperience === null || exp.domainExperience === undefined) {
      exp.domainExperience = 0;
    }

    // leadershipExperience: ensure string
    if (typeof exp.leadershipExperience !== 'string') {
      exp.leadershipExperience = exp.leadershipExperience == null
        ? '0.0 years'
        : String(exp.leadershipExperience);
    }
  }

  // ── skillExtraction ─────────────────────────────────────────────────────
  if (parsed.skillExtraction) {
    if (!Array.isArray(parsed.skillExtraction.extractedSkills)) {
      parsed.skillExtraction.extractedSkills = [];
    }
  } else {
    parsed.skillExtraction = { extractedSkills: [] };
  }

  // ── educationDetails ────────────────────────────────────────────────────
  if (!Array.isArray(parsed.educationDetails)) {
    parsed.educationDetails = [];
  } else {
    for (const edu of parsed.educationDetails) {
      if (edu && typeof edu === 'object') {
        if (edu.passingYear !== undefined && edu.passingYear !== null) {
          edu.passingYear = String(edu.passingYear);
        }
        if (edu.cgpaOrPercentage !== undefined && edu.cgpaOrPercentage !== null) {
          edu.cgpaOrPercentage = String(edu.cgpaOrPercentage);
        }
      }
    }
  }

  // ── projectAnalysis ─────────────────────────────────────────────────────
  if (!Array.isArray(parsed.projectAnalysis)) {
    parsed.projectAnalysis = [];
  }
  for (const project of parsed.projectAnalysis) {
    if (!Array.isArray(project.technologiesUsed)) {
      project.technologiesUsed = [];
    }
  }

  return parsed;
}

// ─── Main Validator ───────────────────────────────────────────────────────────

/**
 * Validate raw JSON string from OpenAI.
 * @param {string} rawJSON
 * @returns {{ valid: boolean, data?: object, errors?: string[] }}
 */
function validateSchema(rawJSON) {
  // Step 1: Strip markdown code fences if present (defensive)
  let cleaned = rawJSON.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  // Step 2: Parse JSON
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    return { valid: false, errors: [`JSON parse error: ${parseErr.message}`] };
  }

  // Step 3: Type coercion (before sanity and Zod)
  parsed = coerceTypes(parsed);

  // Step 4: Sanity checks
  const sanityIssues = runSanityChecks(parsed);
  const hasCriticalIssue = sanityIssues.some(
    issue => issue.startsWith('Suspicious') || issue.startsWith('Unrealistic')
  );
  if (hasCriticalIssue) {
    return { valid: false, errors: sanityIssues, sanityIssues };
  }

  // Step 5: Zod validation — .strip() removes extra keys gracefully
  const result = ResumeSchema.safeParse(parsed);

  if (result.success) {
    return {
      valid: true,
      data: result.data,
      sanityIssues: sanityIssues.length > 0 ? sanityIssues : undefined,
    };
  }

  const errors = result.error.issues.map(issue => {
    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
  });

  return {
    valid: false,
    errors,
    sanityIssues: sanityIssues.length > 0 ? sanityIssues : undefined,
  };
}

module.exports = { validateSchema };
