'use strict';

/**
 * pdfExtractor.js
 * Primary: PyMuPDF via Python subprocess
 * Fallback: pdf-parse (Node.js)
 *
 * Also validates PDF magic bytes (%PDF-) before any processing.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PYTHON_SCRIPT = path.join(process.cwd(), 'src', 'lib', 'parser', 'extractors', 'pdf_extractor.py');
const PYTHON_TIMEOUT_MS = 8000;       // 8s max — PyMuPDF is fast; fail quickly to fallback
const MIN_TEXT_LENGTH = 50;            // Minimum chars to consider extraction valid

// ─── PDF Signature Validation ────────────────────────────────────────────────

/**
 * Validates PDF magic bytes: first 5 bytes must be "%PDF-"
 * Rejects non-PDF files even if they pass MIME check.
 */
function validatePDFSignature(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(5);
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    return buffer.toString('ascii') === '%PDF-';
  } catch (err) {
    return false;
  }
}

// ─── PyMuPDF Extractor ───────────────────────────────────────────────────────

/**
 * Spawns pdf_extractor.py as a subprocess.
 * Returns extracted text string on success.
 * Rejects with error on failure or timeout.
 */
function extractWithPyMuPDF(filePath) {
  return new Promise((resolve, reject) => {
    // Try python3 first, fall back to python
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

    const child = spawn(pythonCmd, [PYTHON_SCRIPT, filePath], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      reject(new Error('PyMuPDF extraction timed out after 30s'));
    }, PYTHON_TIMEOUT_MS);

    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) return;

      if (code === 0 && stdout.trim().length >= MIN_TEXT_LENGTH) {
        resolve(stdout.trim());
      } else if (code === 0 && stdout.trim().length < MIN_TEXT_LENGTH) {
        reject(new Error(`PyMuPDF returned too little text (${stdout.trim().length} chars)`));
      } else {
        const errMsg = stderr.trim() || `PyMuPDF exited with code ${code}`;
        reject(new Error(errMsg));
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      // ENOENT = python not found on system
      if (err.code === 'ENOENT') {
        reject(new Error('Python not found on system. Install Python 3.8+ to enable PyMuPDF extraction.'));
      } else {
        reject(err);
      }
    });
  });
}

// ─── pdf2json Fallback ──────────────────────────────────────────────────────

/**
 * Fallback extractor using pdf2json (Node.js).
 * Pure JavaScript, extremely stable on serverless.
 */
async function extractWithPdf2Json(filePath) {
  let PDFParser;
  try {
    PDFParser = require('pdf2json');
  } catch (e) {
    throw new Error('pdf2json not available. Error: ' + e.message);
  }

  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(this, 1);
    
    pdfParser.on("pdfParser_dataError", errData => {
      reject(new Error(errData.parserError));
    });
    
    pdfParser.on("pdfParser_dataReady", pdfData => {
      const text = pdfParser.getRawTextContent();
      if (!text || text.trim().length < MIN_TEXT_LENGTH) {
        reject(new Error('pdf2json returned empty or too-short text'));
      } else {
        // pdf2json returns URI-encoded text strings often separated by \r\n
        // so we decode it and clean it up
        try {
          const decoded = decodeURIComponent(text);
          resolve(decoded.trim());
        } catch (e) {
          resolve(text.trim());
        }
      }
    });

    pdfParser.loadPDF(filePath);
  });
}

// ─── Main Orchestrator ───────────────────────────────────────────────────────

/**
 * Main entry point.
 * 1. Validates PDF signature (magic bytes)
 * 2. Tries PyMuPDF
 * 3. Falls back to pdf-parse if PyMuPDF fails
 * 4. Validates output is non-empty
 *
 * @param {string} filePath - Absolute path to uploaded PDF
 * @returns {{ text: string, source: 'pymupdf' | 'pdf-parse' }}
 */
async function extractText(filePath) {
  // Step 1: Magic byte validation
  if (!validatePDFSignature(filePath)) {
    const err = new Error('File is not a valid PDF (invalid magic bytes)');
    err.code = 'INVALID_PDF';
    throw err;
  }

  // Step 2: Try PyMuPDF
  try {
    const text = await extractWithPyMuPDF(filePath);
    return { text, source: 'pymupdf' };
  } catch (pyErr) {
    console.warn(`[pdfExtractor] PyMuPDF failed: ${pyErr.message} — trying fallback`);
  }

  // Step 3: Fallback to pdf2json
  try {
    const text = await extractWithPdf2Json(filePath);
    return { text, source: 'pdf2json' };
  } catch (fallbackErr) {
    const err = new Error(
      `Both extractors failed. Last error: ${fallbackErr.message}`
    );
    err.code = 'EXTRACTION_FAILED';
    throw err;
  }
}

module.exports = { extractText, validatePDFSignature };
