import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import multer from 'multer';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateLabels } from './service.js';

const maxUploadBytes = 8 * 1024 * 1024;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: maxUploadBytes, files: 1 } });
const app = express();
app.disable('x-powered-by');
// Development UI is proxied by Vite; restrict standalone API CORS to a configured origin.
if (process.env.CORS_ORIGIN) app.use(cors({ origin: process.env.CORS_ORIGIN }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/api/labels', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Select an .xlsx file to upload.' });
    if (!req.file.originalname.toLowerCase().endsWith('.xlsx'))
      return res.status(400).json({ error: 'Only .xlsx files are supported.' });
    // XLSX files are ZIP containers. Reject obvious non-Excel content before parsing.
    if (req.file.buffer.length < 4 || req.file.buffer.subarray(0, 2).toString() !== 'PK')
      return res.status(400).json({ error: 'The uploaded file is not a valid XLSX workbook.' });

    const options = {
      sheet: typeof req.body?.sheet === 'string' ? req.body.sheet : undefined,
      mark: typeof req.body?.mark === 'string' ? req.body.mark : undefined,
      origin: typeof req.body?.origin === 'string' ? req.body.origin : undefined,
    };
    const result = await generateLabels(req.file.buffer, options);
    res.setHeader('Cache-Control', 'no-store');
    return res.json({
      summary: result.summary,
      labelsText: result.labelsText,
      labelsPdfBase64: result.labelsPdf.toString('base64'),
    });
  } catch (error) { return next(error); }
});

const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    return void res.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the 8 MB limit.' : 'File upload failed.' });
  }
  const message = error instanceof Error ? error.message : 'Unable to process the uploaded workbook.';
  res.status(400).json({ error: message });
};
app.use(errorHandler);

const distDirectory = resolve(fileURLToPath(new URL('../web/dist/', import.meta.url)));
if (existsSync(distDirectory)) {
  app.use(express.static(distDirectory));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(resolve(distDirectory, 'index.html')));
}

export default app;
