/**
 * Smoke test: generates a current-visitors PDF to disk.
 * Run: node prisma/test_pdf.js
 * Output: ./test_report.pdf
 */
const fs = require('fs');
const path = require('path');
const reportService = require('../src/services/report.service');

async function main() {
  const rows = await reportService.currentVisitorsReport();
  console.log(`Generating PDF with ${rows.length} row(s)…`);

  const outPath = path.join(__dirname, '../test_report.pdf');
  const stream  = fs.createWriteStream(outPath);

  const doc = reportService.toPdf('Current Visitors Report', rows, stream, 'Smoke Test User');

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  console.log(`✓ PDF written to: ${outPath}`);
  console.log(`  File size: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);
  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
