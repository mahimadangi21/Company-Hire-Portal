/**
 * test.js — End-to-end verification script
 * Run: node test.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');

const PDF_PATH = path.join('C:\\Users\\Dhanesh vaishnav\\Downloads\\dhanesh Latest CV  6.1.pdf');
const HOST = 'localhost';
const PORT = 3000;
const BOUNDARY = '----FormBoundary' + Date.now().toString(16);

function buildMultipartBody(filePath) {
  const fileName = path.basename(filePath);
  const fileData = fs.readFileSync(filePath);

  const header = Buffer.from(
    `--${BOUNDARY}\r\n` +
    `Content-Disposition: form-data; name="resume"; filename="${fileName}"\r\n` +
    `Content-Type: application/pdf\r\n\r\n`
  );
  const footer = Buffer.from(`\r\n--${BOUNDARY}--\r\n`);

  return Buffer.concat([header, fileData, footer]);
}

async function runTest() {
  console.log('');
  console.log('='.repeat(60));
  console.log('  ATS Resume Intelligence Engine — End-to-End Test');
  console.log('='.repeat(60));
  console.log(`  PDF: ${path.basename(PDF_PATH)}`);
  console.log(`  Size: ${(fs.statSync(PDF_PATH).size / 1024).toFixed(1)} KB`);
  console.log('');

  const body = buildMultipartBody(PDF_PATH);
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: '/api/analyze',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${BOUNDARY}`,
        'Content-Length': body.length,
      },
      timeout: 120000, // 2 min max
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        try {
          const json = JSON.parse(data);

          if (json.success) {
            console.log(`✅ SUCCESS in ${elapsed}s`);
            console.log('');
            console.log('── Personal Info ─────────────────────────────────────');
            const pi = json.data.personalInformation;
            console.log(`  Name  : ${pi.fullName}`);
            console.log(`  Email : ${pi.email}`);
            console.log(`  Phone : ${pi.phoneNumber}`);

            console.log('');
            console.log('── Experience ────────────────────────────────────────');
            const exp = json.data.totalExperienceAnalysis;
            console.log(`  Total       : ${exp.totalExperience}`);
            console.log(`  Domain      : ${exp.domainExperience} years`);
            console.log(`  Leadership  : ${exp.leadershipExperience}`);

            console.log('');
            console.log('── Skills ────────────────────────────────────────────');
            const skills = json.data.skillExtraction.extractedSkills;
            console.log(`  Count : ${skills.length}`);
            console.log(`  List  : ${skills.join(', ')}`);

            console.log('');
            console.log('── Education ─────────────────────────────────────────');
            json.data.educationDetails.forEach(e => {
              console.log(`  ${e.degree} | ${e.college} | ${e.passingYear} | ${e.cgpaOrPercentage}`);
            });

            console.log('');
            console.log('── Projects ──────────────────────────────────────────');
            json.data.projectAnalysis.forEach(p => {
              console.log(`  [${p.projectName}]`);
              console.log(`    ${p.projectDescription}`);
              console.log(`    Tech: ${p.technologiesUsed.join(', ')}`);
            });

            console.log('');
            console.log(`── Meta ──────────────────────────────────────────────`);
            console.log(`  Model  : ${json.meta.model}`);
            console.log(`  Source : ${json.meta.extractionSource}`);
            console.log(`  Time   : ${json.meta.elapsedMs}ms`);
            console.log('');
            console.log('='.repeat(60));
          } else {
            console.log(`❌ FAILED in ${elapsed}s`);
            console.log(`  Error : ${json.error}`);
            console.log(`  Code  : ${json.code}`);
            if (json.details) {
              console.log(`  Details: ${JSON.stringify(json.details)}`);
            }
          }
        } catch (e) {
          console.log(`❌ JSON parse error in ${elapsed}s: ${e.message}`);
          console.log(`  Raw: ${data.slice(0, 500)}`);
        }
        resolve();
      });
    });

    req.on('timeout', () => {
      req.destroy();
      console.log('❌ Request timed out after 120s');
      reject(new Error('timeout'));
    });

    req.on('error', (err) => {
      console.log(`❌ Request error: ${err.message}`);
      reject(err);
    });

    req.write(body);
    req.end();
  });
}

runTest().catch(console.error);
