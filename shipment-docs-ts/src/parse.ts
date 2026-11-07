import type { Box } from './model.js';

export interface RawPackingRow {
  rowNumber: number;
  boxNumber: unknown;
  item: unknown;
  pcs: unknown;
  boxSizeAndTare: unknown;
  grossWeight: unknown;
  ownerMark: unknown;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value.trim()))) return Number(value.trim());
  return undefined;
}

export function parseBoxSizeAndTare(value: unknown): { size: string; tare: number } {
  if (typeof value !== 'string') throw new Error(`Box size/tare must be a string: ${String(value)}`);
  // Example from Sample Packing List: 10*10*10=0.367. Also accepts legacy 10*10*10/0.555kg.
  const match = value.trim().match(/^\s*(\d+(?:\.\d+)?\s*[x*]\s*\d+(?:\.\d+)?\s*[x*]\s*\d+(?:\.\d+)?)\s*(?:=|\/)\s*(\d+(?:\.\d+)?)\s*(?:kg)?\s*$/i);
  if (!match) throw new Error(`Unsupported box size/tare format: '${value}'`);
  return { size: match[1].replace(/\s+/g, '').replace(/x/gi, '*'), tare: Number(match[2]) };
}

export function parsePackingRows(rows: RawPackingRow[]): Box[] {
  const boxes: Box[] = [];
  const seen = new Set<number>();
  for (const row of rows) {
    const blank = [row.boxNumber, row.item, row.grossWeight].every(v => v === null || v === undefined || String(v).trim() === '');
    if (blank) continue;
    const boxNumber = numberValue(row.boxNumber);
    // Allows titles, headers, summary lines in input. Actual candidate data rows require numbered boxes.
    if (boxNumber === undefined) continue;
    if (!Number.isInteger(boxNumber) || boxNumber < 1) throw new Error(`Row ${row.rowNumber}: invalid box number`);
    if (seen.has(boxNumber)) throw new Error(`Row ${row.rowNumber}: duplicate box number ${boxNumber}`);
    const gross = numberValue(row.grossWeight);
    const commodity = typeof row.item === 'string' ? row.item.trim() : '';
    if (!commodity || gross === undefined || gross <= 0) throw new Error(`Row ${row.rowNumber}: item and positive gross weight are required`);
    const {size,tare} = parseBoxSizeAndTare(row.boxSizeAndTare);
    if (tare < 0 || tare >= gross) throw new Error(`Row ${row.rowNumber}: tare ${tare} must be less than gross ${gross}`);
    const units = numberValue(row.pcs);
    if (units !== undefined && (!Number.isInteger(units) || units < 0)) throw new Error(`Row ${row.rowNumber}: invalid quantity`);
    const net = Math.round((gross - tare) * 1000) / 1000;
    boxes.push({ boxNumber, commodity, grossWeightKg: gross, netWeightKg: net,
      tareWeightKg: tare, boxSize: size, units, ownerMark: String(row.ownerMark ?? '').trim() || undefined });
    seen.add(boxNumber);
  }
  if (!boxes.length) throw new Error('No box rows found in packing list');
  boxes.sort((a,b) => a.boxNumber-b.boxNumber);
  for(let i=0;i<boxes.length;i++) {
    if(boxes[i].boxNumber!==i+1) throw new Error(`Missing or nonsequential box number: expected ${i+1}, got ${boxes[i].boxNumber}`);
  }
  return boxes;
}
