import { NextRequest, NextResponse } from 'next/server';
import { extractText } from '@/lib/parser/extractors/pdfExtractor';
import { cleanText } from '@/lib/parser/parsers/textCleaner';
import { parseDeterministic } from '@/lib/parser/parsers/deterministicParser';
import { analyzeResume } from '@/lib/parser/ai/openaiAnalyzer';
import { validateSchema } from '@/lib/parser/validators/schemaValidator';
import { cleanOutput } from '@/lib/parser/cleaners/outputCleaner';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export const maxDuration = 60; // Vercel hobby max

export async function POST(request: NextRequest) {
  const requestId = uuidv4();
  try {
    const formData = await request.formData();
    const file = formData.get('resume') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No resume file provided.', code: 'NO_FILE' }, { status: 400 });
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ success: false, error: 'Only PDF files are accepted.', code: 'INVALID_FILE_TYPE' }, { status: 400 });
    }

    // Save to temp file since pdfExtractor expects a path
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, `${requestId}.pdf`);
    fs.writeFileSync(filePath, buffer);

    try {
      // Step 1: Extract
      const { text: rawText } = await extractText(filePath);

      // Step 2: Clean
      const cleanedText = cleanText(rawText);

      // Step 3: Deterministic
      const deterministicData = parseDeterministic(rawText);

      // Step 4: AI Analysis
      let validationResult = null;
      let finalData = null;

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const rawAI = await analyzeResume(cleanedText, deterministicData, requestId);
          validationResult = validateSchema(rawAI);

          if (validationResult.valid) {
             if (validationResult.data?.isResume === false) {
               throw new Error('NOT_A_RESUME');
             }
             finalData = validationResult.data;
             break;
          }
        } catch (aiErr: any) {
           if (aiErr.message === 'NOT_A_RESUME') {
               return NextResponse.json({ success: false, error: 'The uploaded document is not a valid professional resume.', code: 'INVALID_RESUME' }, { status: 422 });
           }
           if (attempt === 2) {
               return NextResponse.json({ success: false, error: aiErr.message, code: 'INTERNAL_ERROR' }, { status: 500 });
           }
        }
      }

      if (!finalData) {
          return NextResponse.json({ success: false, error: 'Resume analysis failed validation.', code: 'VALIDATION_FAILED' }, { status: 422 });
      }

      // Step 5: Clean output
      const cleanData = cleanOutput(finalData, deterministicData);
      
      return NextResponse.json({
         success: true,
         data: cleanData
      });

    } finally {
      // Clean up temp file
      if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
      }
    }
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to process request.', code: 'SERVER_ERROR', details: error.stack }, { status: 500 });
  }
}
