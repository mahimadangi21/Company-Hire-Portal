'use strict';

require('dotenv').config();

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// ─── Internal Modules ─────────────────────────────────────────────────────────
const { extractText } = require('./src/extractors/pdfExtractor');
const { cleanText } = require('./src/parsers/textCleaner');
const { parseDeterministic } = require('./src/parsers/deterministicParser');
const { analyzeResume } = require('./src/ai/openaiAnalyzer');
const { validateSchema } = require('./src/validators/schemaValidator');
const { cleanOutput } = require('./src/cleaners/outputCleaner');

// ─── Config ───────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 3000;
const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5;
const RATE_WINDOW_MIN = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 10) || 15;
const RATE_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 20;

// ─── Directories ──────────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const LOGS_DIR = path.join(__dirname, 'logs');

for (const dir of [UPLOADS_DIR, LOGS_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ─── App Init ─────────────────────────────────────────────────────────────────
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: RATE_WINDOW_MIN * 60 * 1000,
  max: RATE_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({
    success: false,
    error: `Rate limit exceeded. Max ${RATE_MAX} requests per ${RATE_WINDOW_MIN} minutes.`,
    code: 'RATE_LIMIT_EXCEEDED',
  }),
}));

// ─── Multer Setup ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => cb(null, `${uuidv4()}.pdf`),
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      cb(null, true);
    } else {
      const err = new Error('Only PDF files are accepted');
      err.code = 'INVALID_FILE_TYPE';
      cb(err);
    }
  },
});

// ─── Utilities ────────────────────────────────────────────────────────────────

function safeDelete(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    console.warn(`[cleanup] ${e.message}`);
  }
}

function createLogger(requestId) {
  const logDir = path.join(LOGS_DIR, requestId);
  fs.mkdirSync(logDir, { recursive: true });

  function maskPII(content) {
    return content
      .replace(/\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/g, '[EMAIL]')
      .replace(/(\+\d{1,3}[\s\-]?)?\d[\d\s\-().]{8,14}\d/g, '[PHONE]');
  }

  return {
    write(filename, content) {
      try {
        const raw = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
        fs.writeFileSync(path.join(logDir, filename), maskPII(raw), 'utf8');
      } catch (e) {
        console.warn(`[logger:${requestId}] ${e.message}`);
      }
    },
  };
}

function resolveErrorStatus(code) {
  const map = {
    INVALID_PDF: 400, INVALID_FILE_TYPE: 400, FILE_TOO_LARGE: 400,
    EMPTY_PDF: 400, EXTRACTION_FAILED: 422, VALIDATION_FAILED: 422,
    NO_FILE: 400, OPENAI_TIMEOUT: 504, INTERNAL_ERROR: 500,
    INVALID_RESUME: 400,
  };
  return map[code] || 500;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/analyze', (req, res) => {
  const requestId = uuidv4();
  const logger = createLogger(requestId);
  let filePath = null;

  // Track if client aborted BEFORE we started sending response
  let clientAborted = false;
  req.on('aborted', () => {
    clientAborted = true;
    console.log(`[${requestId}] Client disconnected early — will abort`);
    safeDelete(filePath);
  });

  const startTime = Date.now();
  console.log(`[${requestId}] POST /api/analyze`);

  upload.single('resume')(req, res, async (uploadErr) => {
    if (clientAborted) return;

    // ── Upload errors ────────────────────────────────────────────────────
    if (uploadErr) {
      let code = 'UPLOAD_ERROR';
      let message = uploadErr.message;
      if (uploadErr.code === 'LIMIT_FILE_SIZE') {
        code = 'FILE_TOO_LARGE';
        message = `File too large. Max size is ${MAX_SIZE_MB}MB.`;
      } else if (uploadErr.code === 'INVALID_FILE_TYPE') {
        code = 'INVALID_FILE_TYPE';
      }
      return res.status(resolveErrorStatus(code)).json({ success: false, error: message, code });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No resume file provided. Please upload a PDF.',
        code: 'NO_FILE',
      });
    }

    filePath = req.file.path;

    try {
      // ── STEP 1: Extract text ─────────────────────────────────────────────
      const t1 = Date.now();
      const { text: rawText, source } = await extractText(filePath);
      console.log(`[${requestId}] Step1 extract: ${rawText.length} chars via ${source} (${Date.now() - t1}ms)`);
      logger.write('01_raw_text.txt', `Source: ${source}\n\n${rawText}`);

      if (clientAborted) return;

      // ── STEP 2: Clean text ───────────────────────────────────────────────
      const cleanedText = cleanText(rawText);
      console.log(`[${requestId}] Step2 clean: ${cleanedText.length} chars`);
      logger.write('02_cleaned_text.txt', cleanedText);

      // ── STEP 3: Deterministic PII parse ─────────────────────────────────
      const deterministicData = parseDeterministic(rawText);
      console.log(`[${requestId}] Step3 deterministic: email=${deterministicData.email}, phone=${deterministicData.phoneNumber}`);

      if (clientAborted) return;

      // ── STEP 4: Groq + single retry ────────────────────────────────────
      let validationResult = null;

      for (let attempt = 1; attempt <= 2; attempt++) {
        if (clientAborted) return;

        const tAI = Date.now();
        console.log(`[${requestId}] Step4 Groq attempt ${attempt}/2...`);

        try {
          const rawAI = await analyzeResume(cleanedText, deterministicData, requestId);
          console.log(`[${requestId}] Groq returned ${rawAI.length} chars (${Date.now() - tAI}ms)`);
          logger.write(`04_groq_attempt${attempt}.json`, rawAI);

          validationResult = validateSchema(rawAI);

          if (validationResult.valid) {
            if (validationResult.data?.isResume === false) {
              console.warn(`[${requestId}] Document is classified as NOT a resume (attempt ${attempt})`);
              const err = new Error('The uploaded PDF does not appear to be a valid professional resume. Please upload a resume.');
              err.code = 'INVALID_RESUME';
              throw err;
            }
            console.log(`[${requestId}] Validation OK (attempt ${attempt})`);
            break;
          } else {
            console.warn(`[${requestId}] Validation failed attempt ${attempt}:`, validationResult.errors.slice(0, 3));
            if (attempt === 2) {
              return res.status(422).json({
                success: false,
                error: 'Resume analysis failed validation. Please try again.',
                code: 'VALIDATION_FAILED',
                details: validationResult.errors,
              });
            }
          }
        } catch (aiErr) {
          console.error(`[${requestId}] Groq attempt ${attempt} error: ${aiErr.message}`);
          logger.write(`04_groq_error_attempt${attempt}.txt`, aiErr.message);
          
          if (attempt === 2) {
            let errorMsg = 'AI analysis failed. Please try again.';
            let code = 'INTERNAL_ERROR';

            if (aiErr.message?.includes('timeout')) {
              code = 'GROQ_TIMEOUT';
              errorMsg = 'AI analysis timed out. Please try again.';
            } else if (aiErr.status === 429 || aiErr.message?.includes('429') || aiErr.message?.includes('quota')) {
              code = 'GROQ_QUOTA_EXCEEDED';
              errorMsg = 'Groq API Key Error: You have exceeded your billing quota or your account is out of credits. Please add a valid, funded API key to your .env file.';
            } else if (aiErr.status === 401 || aiErr.message?.includes('401') || aiErr.message?.includes('key')) {
              code = 'GROQ_AUTH_ERROR';
              errorMsg = 'Groq API Key Error: Invalid or missing API key. Please check your .env file.';
            } else if (aiErr.message) {
               // Include the actual message to help debug any other issues
               errorMsg = `Groq API Error: ${aiErr.message}`;
            }

            return res.status(resolveErrorStatus(code)).json({
              success: false,
              error: errorMsg,
              code,
            });
          }
        }
      }

      // ── STEP 5: Clean output ─────────────────────────────────────────────
      const finalData = cleanOutput(validationResult.data, deterministicData);
      logger.write('05_final_output.json', finalData);
      safeDelete(filePath);

      const elapsed = Date.now() - startTime;
      console.log(`[${requestId}] ✅ Done in ${elapsed}ms`);

      return res.json({
        success: true,
        data: finalData,
        meta: {
          requestId,
          extractionSource: source,
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          elapsedMs: elapsed,
          timestamp: new Date().toISOString(),
        },
      });

    } catch (err) {
      console.error(`[${requestId}] ❌ ${err.message}`);
      safeDelete(filePath);
      logger.write('error.txt', `${err.message}\n${err.stack || ''}`);

      const code = err.code || 'INTERNAL_ERROR';
      const message = err.message.includes(':')
        ? err.message.split(':').slice(1).join(':').trim()
        : err.message;

      return res.status(resolveErrorStatus(code)).json({
        success: false,
        error: message,
        code,
      });
    }
  });
});

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found', code: 'NOT_FOUND' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     ATS Resume Intelligence Engine v1.0      ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Server  : http://localhost:${PORT}              ║`);
  console.log(`║  Model   : ${(process.env.GROQ_MODEL || 'llama-3.3-70b-versatile').padEnd(34)}║`);
  console.log(`║  Max PDF : ${String(MAX_SIZE_MB + 'MB').padEnd(34)}║`);
  console.log(`║  Rate    : ${String(RATE_MAX + ' req/' + RATE_WINDOW_MIN + 'min').padEnd(34)}║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
