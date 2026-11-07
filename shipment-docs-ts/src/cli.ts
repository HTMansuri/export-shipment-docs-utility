import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { readPackingListXlsx } from './excel.js';
import { buildSummary, renderBoxLabels } from './labels.js';

function argument(name: string, fallback?: string): string | undefined {
  const i=process.argv.indexOf(name);
  if(i<0) return fallback;
  if(!process.argv[i+1] || process.argv[i+1].startsWith('--')) throw new Error(`Missing value for ${name}`);
  return process.argv[i+1];
}
async function main() {
  const input=argument('--input');
  if(!input) {console.error('Usage: npm run labels -- --input /path/packing-list.xlsx [--out output] [--sheet name] [--mark MDS]');process.exitCode=2;return;}
  const out=resolve(argument('--out','output')!);
  const boxes=await readPackingListXlsx(resolve(input),argument('--sheet'));
  await mkdir(out,{recursive:true});
  await writeFile(join(out,'boxLabel.txt'),renderBoxLabels(boxes,argument('--mark','MDS'),argument('--origin','INDIA')),'utf8');
  await writeFile(join(out,'packing-summary.json'),JSON.stringify(buildSummary(boxes),null,2)+'\n','utf8');
  console.log(`Processed ${boxes.length} boxes; wrote ${join(out,'boxLabel.txt')} and packing-summary.json`);
}
main().catch(e=>{console.error(e instanceof Error?e.message:e); process.exitCode=1;});
