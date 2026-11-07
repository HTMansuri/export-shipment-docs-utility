import { readPackingListBuffer } from './excel.js';
import { buildSummary, renderBoxLabels } from './labels.js';
import { renderBoxLabelsPdf } from './pdf.js';

export interface GenerateOptions { sheet?: string; mark?: string; origin?: string; }

export async function generateLabels(data: Buffer, options: GenerateOptions = {}) {
  const mark = options.mark?.trim() || 'MDS';
  const origin = options.origin?.trim() || 'INDIA';
  if (mark.length > 60 || origin.length > 60) throw new Error('Mark and origin must be 60 characters or fewer');
  const boxes = await readPackingListBuffer(data, options.sheet?.trim() || undefined);
  return {
    summary: buildSummary(boxes),
    labelsText: renderBoxLabels(boxes, mark, origin),
    labelsPdf: await renderBoxLabelsPdf(boxes, mark, origin),
  };
}
