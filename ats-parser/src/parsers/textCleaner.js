'use strict';

/**
 * textCleaner.js
 * Cleans raw extracted PDF text before sending to OpenAI.
 *
 * Goals:
 * - Reduce token count (cost control)
 * - Remove noise that confuses AI (icons, decorators, repeated headers)
 * - Normalize spacing and structure
 * - Hard-cap at MAX_WORDS to prevent runaway token usage
 */

const MAX_WORDS = 2500;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Remove decorative symbols, bullet art, and unicode icons
 * that appear in designer resumes and confuse extraction.
 */
function removeDecorativeSymbols(text) {
  return text
    // Common bullet decorators
    .replace(/[•◦▪▸►◄●○◉✓✔✗✘★☆♦♣♠♥➤➢➜→←↓↑]/g, ' ')
    // Box drawing characters (table borders in PDFs)
    .replace(/[─━═┌┐└┘├┤┬┴┼│]/g, ' ')
    // Dingbats block
    .replace(/[\u2700-\u27BF]/g, ' ')
    // Geometric shapes
    .replace(/[\u25A0-\u25FF]/g, ' ')
    // Misc symbols (phone icons, email icons, etc.)
    .replace(/[\u2600-\u26FF]/g, ' ')
    // Emoticons / pictographs
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, ' ')
    // Repeated dashes used as visual separators
    .replace(/[-=_]{3,}/g, ' ');
}

/**
 * Remove duplicate consecutive lines.
 * Multi-column PDFs sometimes repeat section headers.
 */
function removeDuplicateLines(text) {
  const lines = text.split('\n');
  const seen = new Set();
  const result = [];

  for (const line of lines) {
    const key = line.trim().toLowerCase();
    if (key === '') {
      result.push(''); // Keep blank lines for structure
      continue;
    }
    if (!seen.has(key)) {
      seen.add(key);
      result.push(line);
    }
    // Silently drop duplicates
  }

  return result.join('\n');
}

/**
 * Collapse excessive whitespace:
 * - Tabs → single space
 * - Multiple spaces → single space (preserve indentation intent)
 * - 3+ newlines → double newline
 */
function collapseWhitespace(text) {
  return text
    .replace(/\t/g, ' ')
    .replace(/ {3,}/g, '  ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Remove section headers that have no content below them.
 * Pattern: ALL-CAPS header followed immediately by a blank line.
 */
function removeEmptySections(text) {
  return text
    .replace(/^[A-Z][A-Z\s]{2,40}\n(?=\n)/gm, '')
    .trim();
}

/**
 * Remove common PDF extraction artifacts:
 * - Page numbers: "Page 1 of 2", "1", etc. on their own line
 * - URLs that don't add semantic value (linkedin, github)
 * - Mailto: links
 */
function removeArtifacts(text) {
  return text
    // Standalone page numbers
    .replace(/^\s*(page\s+\d+\s+of\s+\d+|\d+)\s*$/gim, '')
    // LinkedIn/GitHub URLs (we extract from deterministic parser if needed)
    .replace(/https?:\/\/(www\.)?(linkedin\.com|github\.com|twitter\.com)\S*/gi, '')
    // Mailto: links
    .replace(/mailto:\S+/gi, '')
    // Excessive punctuation runs
    .replace(/[.]{3,}/g, '...')
    .replace(/[,]{2,}/g, ',');
}

/**
 * Hard truncate to MAX_WORDS words.
 * Appends a marker so OpenAI knows content was cut.
 */
function truncateToMaxWords(text, maxWords = MAX_WORDS) {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '\n\n[--- content truncated for token limit ---]';
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────

/**
 * Run full text cleaning pipeline.
 * Returns cleaned string ready for sectionParser and OpenAI.
 *
 * @param {string} rawText - Raw text from pdfExtractor
 * @returns {string} cleaned text
 */
function cleanText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;
  text = removeDecorativeSymbols(text);
  text = removeArtifacts(text);
  text = removeDuplicateLines(text);
  text = collapseWhitespace(text);
  text = removeEmptySections(text);
  text = truncateToMaxWords(text);

  return text;
}

module.exports = { cleanText };
