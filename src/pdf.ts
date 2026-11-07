import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { Box } from './model.js';

const pageWidth = 612;
const pageHeight = 792;
const ink = rgb(0.12, 0.16, 0.20);

function printable(value: string): string {
  // PDF standard font uses WinAnsi encoding. Replace unsupported glyphs in labels.
  return value.replace(/[^\x20-\x7e\u00a0-\u00ff]/g, '?');
}

function wrap(text: string, maxLength = 48): string[] {
  const words = printable(text).split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (!word) continue;
    if (word.length > maxLength) {
      if (line) { lines.push(line); line = ''; }
      for (let i = 0; i < word.length; i += maxLength) lines.push(word.slice(i, i + maxLength));
      continue;
    }
    if (`${line} ${word}`.trim().length > maxLength && line) {
      lines.push(line);
      line = word;
    } else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

export async function renderBoxLabelsPdf(boxes: Box[], mark = 'MDS', origin = 'INDIA'): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  for (let index = 0; index < boxes.length; index += 2) {
    const page = pdf.addPage([pageWidth, pageHeight]);
    for (let slot = 0; slot < 2 && index + slot < boxes.length; slot++) {
      const box = boxes[index + slot];
      const top = pageHeight - 46 - slot * 390;
      const left = 68;
      page.drawRectangle({ x: 48, y: top - 318, width: 516, height: 330, borderColor: rgb(0.78,0.8,0.82), borderWidth: 1 });
      page.drawText(`BOX NO. ${box.boxNumber} / ${boxes.length}`, { x: left, y: top - 24, size: 19, font: bold, color: ink });
      page.drawText(printable(mark), { x: left, y: top - 64, size: 22, font: bold, color: ink });
      const lines = wrap(`COMMODITY: ${box.commodity}`);
      lines.forEach((line, li) => page.drawText(line, { x: left, y: top - 105 - li * 20, size: 13, font: normal, color: ink }));
      const bottom = top - 185;
      page.drawText(`GROSS WT.: ${box.grossWeightKg.toFixed(3)} KG`, { x: left, y: bottom, size: 15, font: normal, color: ink });
      page.drawText(`NET WT.: ${box.netWeightKg.toFixed(3)} KG`, { x: left, y: bottom - 34, size: 15, font: normal, color: ink });
      page.drawText(`COUNTRY OF ORIGIN: ${printable(origin)}`, { x: left, y: bottom - 72, size: 14, font: normal, color: ink });
    }
  }
  return Buffer.from(await pdf.save());
}
