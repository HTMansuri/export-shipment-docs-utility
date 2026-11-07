import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import ExcelJS from 'exceljs';
import { PDFDocument } from 'pdf-lib';
import app from '../src/app.js';

async function sampleExcel(badGross = false): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sample');
  sheet.addRow(['Box', 'Item', '', 'PCS', 'Box Size/Tare', 'Gross KG', 'Owner']);
  sheet.addRow([1, 'Sample Item A', '', 75, '10*10*10=0.367', badGross ? 0.2 : 8.053, 'M']);
  sheet.addRow([2, 'Sample Item B', '', 50, '19*10*10=0.532', 9.5, 'M']);
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

test('GET /api/health reports readiness', async () => {
  const response = await request(app).get('/api/health').expect(200);
  assert.equal(response.body.status, 'ok');
});

test('POST /api/labels generates labels, summary and valid two-per-page PDF', async () => {
  const response = await request(app)
    .post('/api/labels')
    .field('mark', 'DEMO')
    .field('origin', 'INDIA')
    .attach('file', await sampleExcel(), 'packing-list.xlsx')
    .expect(200);
  assert.equal(response.body.summary.boxCount, 2);
  assert.equal(response.body.summary.totalNetWeightKg, 16.654);
  assert.match(response.body.labelsText, /BOX NO\. 1 \/ 2/);
  assert.match(response.body.labelsText, /DEMO/);
  assert.match(response.body.labelsText, /NET WT\.: 7\.686 KG/);
  const pdfBytes = Buffer.from(response.body.labelsPdfBase64, 'base64');
  assert.equal(pdfBytes.subarray(0, 4).toString(), '%PDF');
  const pdf = await PDFDocument.load(pdfBytes);
  assert.equal(pdf.getPageCount(), 1);
});

test('rejects missing uploads, invalid extensions and incorrect data', async () => {
  await request(app).post('/api/labels').expect(400);
  const invalidExtension = await request(app).post('/api/labels')
    .attach('file', Buffer.from('some plain text'), 'file.txt').expect(400);
  assert.match(invalidExtension.body.error, /xlsx/);
  const badData = await request(app).post('/api/labels')
    .attach('file', await sampleExcel(true), 'invalid.xlsx').expect(400);
  assert.match(badData.body.error, /tare/);
});

test('rejects a missing worksheet', async () => {
  const response = await request(app).post('/api/labels')
    .field('sheet', 'NotThere')
    .attach('file', await sampleExcel(), 'packing-list.xlsx').expect(400);
  assert.match(response.body.error, /Worksheet/);
});
