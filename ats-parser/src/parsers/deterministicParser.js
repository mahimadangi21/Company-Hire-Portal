'use strict';

/**
 * deterministicParser.js
 * High-confidence PII extraction using regex BEFORE OpenAI is called.
 * These values are injected into the OpenAI prompt and used to override
 * AI output in the output cleaner — the AI must never contradict them.
 *
 * Extracts: email, phoneNumber
 */

// ─── Email ────────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/g;

// Domains/values that are clearly placeholder/example — reject these
const EMAIL_BLOCKLIST = [
  'example.com', 'test.com', 'domain.com', 'email.com',
  'youremail.com', 'yourname.com', 'sample.com',
];

function extractEmail(text) {
  const matches = [...text.matchAll(EMAIL_REGEX)];
  if (!matches.length) return null;

  for (const match of matches) {
    const email = match[1].toLowerCase();
    const domain = email.split('@')[1];

    if (EMAIL_BLOCKLIST.some(blocked => domain.includes(blocked))) continue;
    if (email.length < 6) continue;

    return email;
  }

  return null;
}

// ─── Phone ────────────────────────────────────────────────────────────────────

/**
 * Phone number patterns — ordered by specificity (most specific first).
 * Handles: Indian (+91), international, US, and plain 10-digit.
 */
const PHONE_PATTERNS = [
  // International with country code: +91-XXXXX-XXXXX or +1 (555) 123-4567
  /(\+\d{1,3}[\s.\-]?)(\(?\d{1,4}\)?[\s.\-]?)(\d{2,4}[\s.\-]?)(\d{2,4}[\s.\-]?)(\d{1,4})/g,
  // Indian 10-digit with optional prefix
  /\b(91[\s\-]?)?[6-9]\d{9}\b/g,
  // Generic 10-digit
  /\b\d{10}\b/g,
  // Formatted: XXX-XXX-XXXX or (XXX) XXX-XXXX
  /\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/g,
];

function countDigits(str) {
  return (str.match(/\d/g) || []).length;
}

function normalizePhoneNumber(raw) {
  const digits = raw.replace(/\D/g, '');

  if (digits.length < 10) return null;

  // Indian mobile: starts with country code 91 + 10 digits = 12 digits
  if (digits.length === 12 && digits.startsWith('91')) {
    const number = digits.slice(2);
    return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
  }

  // Indian mobile: 10 digits starting with 6-9
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  // International with +
  if (raw.trim().startsWith('+') && digits.length >= 10 && digits.length <= 15) {
    return `+${digits.slice(0, digits.length - 10)} ${digits.slice(-10, -5)} ${digits.slice(-5)}`;
  }

  // Generic 10-digit
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  // Return normalized digits if reasonable length
  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }

  return null;
}

function extractPhone(text) {
  for (const pattern of PHONE_PATTERNS) {
    // Reset lastIndex for global regex
    pattern.lastIndex = 0;

    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const raw = match[0].trim();
      const digitCount = countDigits(raw);

      if (digitCount < 10 || digitCount > 15) continue;

      const normalized = normalizePhoneNumber(raw);
      if (normalized) return normalized;
    }
  }

  return null;
}

// ─── Main Deterministic Parser ────────────────────────────────────────────────

/**
 * Run deterministic regex extraction on raw (pre-clean) text.
 * Using raw text ensures we don't lose PII that cleaners might strip.
 *
 * @param {string} rawText - Raw text from pdfExtractor (before cleaning)
 * @returns {{ email: string|null, phoneNumber: string|null }}
 */
function parseDeterministic(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { email: null, phoneNumber: null };
  }

  return {
    email: extractEmail(rawText),
    phoneNumber: extractPhone(rawText),
  };
}

module.exports = { parseDeterministic };
