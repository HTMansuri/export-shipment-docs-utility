import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBoxSizeAndTare, parsePackingRows, type RawPackingRow } from '../src/parse.js';
import { renderBoxLabels, buildSummary } from '../src/labels.js';

const rows: RawPackingRow[] = [
 {rowNumber:3,boxNumber:1,item:'Sample Item A',pcs:75,boxSizeAndTare:'10*10*10=0.367',grossWeight:8.053,ownerMark:'M'},
 {rowNumber:4,boxNumber:2,item:'Sample Item B',pcs:50,boxSizeAndTare:'19*10*10=0.532',grossWeight:9.5,ownerMark:'Q'},
];
test('parses current and legacy box-size formats',()=>{
 assert.deepEqual(parseBoxSizeAndTare('10*10*10=0.367'),{size:'10*10*10',tare:0.367});
 assert.deepEqual(parseBoxSizeAndTare('19*10*10/0.770kg'),{size:'19*10*10',tare:0.770});
});
test('converts spreadsheet rows and calculates net weights',()=>{
 const boxes=parsePackingRows(rows);
 assert.equal(boxes[0].netWeightKg,7.686);
 assert.equal(boxes[1].netWeightKg,8.968);
 assert.equal(buildSummary(boxes).boxCount,2);
 assert.match(renderBoxLabels(boxes),/BOX NO\. 1 \/ 2/);
 assert.match(renderBoxLabels(boxes),/NET WT\.: 7\.686 KG/);
});
test('rejects inconsistent box numbering and bad weights',()=>{
 assert.throws(()=>parsePackingRows([{...rows[0],boxNumber:2}]),/nonsequential/);
 assert.throws(()=>parsePackingRows([{...rows[0],grossWeight:0.2}]),/tare/);
 assert.throws(()=>parsePackingRows([rows[0],{...rows[0],rowNumber:4}]),/duplicate/);
});
