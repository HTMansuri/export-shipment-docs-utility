import type { Box, PackingSummary } from './model.js';

export function renderBoxLabels(boxes: Box[], mark = 'MDS', origin = 'INDIA'): string {
  const labels = boxes.map(box => [
    `BOX NO. ${box.boxNumber} / ${boxes.length}`,
    mark,
    `COMMODITY: ${box.commodity}`,
    `GROSS WT.: ${box.grossWeightKg.toFixed(3)} KG`,
    `NET WT.: ${box.netWeightKg.toFixed(3)} KG`,
    `COUNTRY OF ORIGIN: ${origin}`,
  ].join('\n'));
  // Java program placed two labels per page, with spacing after every second-label slot.
  return labels.reduce((acc,label,index) => acc + label + ((index+1)%2===0 ? '\n\n\n' : '\n\n'), '').trimEnd() + '\n';
}

function r3(n: number): number { return Math.round(n * 1000)/1000; }
export function buildSummary(boxes: Box[]): PackingSummary {
  const summary: PackingSummary = { boxCount: boxes.length, totalGrossWeightKg: 0,
    totalNetWeightKg: 0, totalTareWeightKg: 0, byCommodity: {} };
  for(const b of boxes) {
    summary.totalGrossWeightKg += b.grossWeightKg;
    summary.totalNetWeightKg += b.netWeightKg;
    summary.totalTareWeightKg += b.tareWeightKg;
    const group = summary.byCommodity[b.commodity] ??= {boxCount:0,grossWeightKg:0,netWeightKg:0};
    group.boxCount++; group.grossWeightKg+=b.grossWeightKg; group.netWeightKg+=b.netWeightKg;
  }
  summary.totalGrossWeightKg = r3(summary.totalGrossWeightKg);
  summary.totalNetWeightKg = r3(summary.totalNetWeightKg);
  summary.totalTareWeightKg = r3(summary.totalTareWeightKg);
  for (const g of Object.values(summary.byCommodity)) {g.grossWeightKg=r3(g.grossWeightKg);g.netWeightKg=r3(g.netWeightKg);}
  return summary;
}
