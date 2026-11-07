# Shipment Document Generator

A TypeScript application for generating box labels from Excel packing lists. Upload an `.xlsx` workbook through the React web interface to generate print-ready PDF labels, plain-text labels, and a shipment summary. The application can also produce text labels and a JSON summary from the command line.

## Requirements

- Node.js 20 or newer
- npm

## Installation

```bash
npm install
```

## Start the web application

```bash
npm run dev
```

Open **http://localhost:5173** in your browser. The API runs on **http://localhost:3001**.

1. Select an Excel packing list (`.xlsx`, up to 8 MB).
2. Optionally specify the shipping mark, country of origin, and worksheet name.
3. Click **Generate box labels**.
4. Review the box count and shipment weights.
5. Download the printable PDF labels, text labels, or shipment summary.

The generated PDF contains two box labels per letter-size page. Each label includes the box number, shipment mark, commodity, gross weight, net weight, and country of origin.

## Example spreadsheet

Generate an example packing list with synthetic item data:

```bash
npm run sample
```

This creates `examples/sample-packing-list.xlsx`, which you can upload in the web interface.

## Expected packing list columns

| Column | Content | Example |
|---|---|---|
| A | Box number | `1` |
| B | Item / commodity | `Sample Item A` |
| D | Quantity | `75` |
| E | Box dimensions and tare weight (kg) | `10*10*10=0.367` |
| F | Gross weight (kg) | `8.053` |
| G | Owner mark | `M` |

Net weight is calculated as gross weight minus tare weight, rounded to three decimal places. The application rejects invalid weights, malformed box dimensions/tare values, duplicate box numbers, and missing box numbers.

## Command-line usage

```bash
npm run labels -- --input "/path/to/packing-list.xlsx" --out output
```

Optional settings:

```bash
npm run labels -- --input "/path/to/packing-list.xlsx" --sheet "Packing List" --mark MDS --origin INDIA
```

The command creates `output/boxLabel.txt` and `output/packing-summary.json`.

## HTTP API

`GET /api/health` returns the service status.

`POST /api/labels` accepts a `multipart/form-data` request with these fields:

| Field | Required | Description |
|---|---|---|
| `file` | Yes | Excel `.xlsx` packing list (up to 8 MB) |
| `sheet` | No | Worksheet name; defaults to the first worksheet |
| `mark` | No | Shipping mark; defaults to `MDS` |
| `origin` | No | Country of origin; defaults to `INDIA` |

A successful response contains `summary`, `labelsText`, and `labelsPdfBase64`. Validation failures return HTTP 400 with an `error` message. Uploaded files are processed in memory and are not saved by the API.

## Validation and build

```bash
npm test
npm run typecheck
npm run build
```

To run the API separately:

```bash
npm run dev:api
```

To run the frontend separately:

```bash
npm run dev:web
```

After building, serve the API and frontend together on **http://localhost:3001**:

```bash
npm start
```
