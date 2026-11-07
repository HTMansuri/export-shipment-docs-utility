import ExcelJS from 'exceljs';
import { mkdir } from 'node:fs/promises';

const book = new ExcelJS.Workbook();
const sheet = book.addWorksheet('Packing List');
sheet.addRow(['BOX NO', 'ITEM', '', 'PCS', 'BOX SIZE / TARE KG', 'GROSS WT KG', 'OWNER']);
sheet.addRow([1, 'Sample Item A', '', 75, '10*10*10=0.367', 8.053, 'M']);
sheet.addRow([2, 'Sample Item B', '', 50, '19*10*10=0.532', 9.5, 'M']);
await mkdir('examples', { recursive: true });
await book.xlsx.writeFile('examples/sample-packing-list.xlsx');
console.log('Created examples/sample-packing-list.xlsx');
