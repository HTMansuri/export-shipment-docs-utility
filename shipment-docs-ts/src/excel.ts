import ExcelJS from 'exceljs';
import { parsePackingRows, type RawPackingRow } from './parse.js';
import type { Box } from './model.js';

function cellValue(value: ExcelJS.CellValue): unknown {
  if (value && typeof value === 'object') {
    if ('result' in value) return value.result;
    if ('text' in value) return value.text;
    if ('richText' in value) return value.richText.map(v => v.text).join('');
  }
  return value;
}

function parseWorkbook(workbook: ExcelJS.Workbook, worksheetName?: string): Box[] {
  const sheet = worksheetName ? workbook.getWorksheet(worksheetName) : workbook.worksheets[0];
  if (!sheet) throw new Error(`Worksheet '${worksheetName ?? '(first)'}' not found`);
  const rows: RawPackingRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    rows.push({
      rowNumber,
      boxNumber: cellValue(row.getCell(1).value),
      item: cellValue(row.getCell(2).value),
      pcs: cellValue(row.getCell(4).value),
      boxSizeAndTare: cellValue(row.getCell(5).value),
      grossWeight: cellValue(row.getCell(6).value),
      ownerMark: cellValue(row.getCell(7).value),
    });
  });
  return parsePackingRows(rows);
}

export async function readPackingListXlsx(file: string, worksheetName?: string): Promise<Box[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file);
  return parseWorkbook(workbook, worksheetName);
}

export async function readPackingListBuffer(data: Buffer, worksheetName?: string): Promise<Box[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data as never);
  return parseWorkbook(workbook, worksheetName);
}
