import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';

type Group = { boxCount: number; grossWeightKg: number; netWeightKg: number };
type Summary = {
  boxCount: number;
  totalGrossWeightKg: number;
  totalNetWeightKg: number;
  totalTareWeightKg: number;
  byCommodity: Record<string, Group>;
};
type ResponseData = { summary: Summary; labelsText: string; labelsPdfBase64: string };

function saveFile(filename: string, data: Blob) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(data);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function base64ToBlob(base64: string): Blob {
  const decoded = atob(base64);
  const bytes = Uint8Array.from(decoded, character => character.charCodeAt(0));
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

function kg(value: number) { return `${value.toFixed(3)} kg`; }

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [mark, setMark] = useState('MDS');
  const [origin, setOrigin] = useState('INDIA');
  const [sheet, setSheet] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ResponseData | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const changeFile = (next: File | null) => {
    setResult(null); setError('');
    if (next && !next.name.toLowerCase().endsWith('.xlsx')) {
      setFile(null); setError('Only .xlsx Excel workbooks are supported.'); return;
    }
    if (next && next.size > 8 * 1024 * 1024) {
      setFile(null); setError('The file must be smaller than 8 MB.'); return;
    }
    setFile(next);
  };
  const onChoose = (event: ChangeEvent<HTMLInputElement>) => changeFile(event.target.files?.[0] ?? null);
  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault(); setDragging(false); changeFile(event.dataTransfer.files?.[0] ?? null);
  };
  const generate = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) { setError('Select a packing list first.'); return; }
    setError(''); setResult(null); setBusy(true);
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('mark', mark);
      data.append('origin', origin);
      if (sheet.trim()) data.append('sheet', sheet.trim());
      const response = await fetch('/api/labels', { method: 'POST', body: data });
      const payload: ResponseData & { error?: string } = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to generate labels.');
      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect to the application server.');
    } finally { setBusy(false); }
  };

  return <div className="app">
    <header className="topbar">
      <div className="brandmark">▣</div>
      <div><strong>Shipment Documents</strong><span>Box Label Generator</span></div>
    </header>
    <main>
      <div className="intro"><div className="eyebrow">SHIPPING OPERATIONS</div>
        <h1>Generate box labels</h1>
        <p>Upload your Excel packing list to create printable box labels and review shipment totals.</p>
      </div>
      <div className="layout">
        <section className="panel">
          <div className="section-head"><span className="step">01</span><div><h2>Upload packing list</h2><p>Excel workbook (.xlsx), up to 8 MB</p></div></div>
          <form onSubmit={generate}>
            <div className={`dropzone ${dragging ? 'dragging' : ''}`} role="button" tabIndex={0}
              onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
              onClick={() => fileInput.current?.click()} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') fileInput.current?.click(); }}>
              <div className="upload-icon">⇧</div>
              <strong>{file ? file.name : 'Drop your packing list here'}</strong>
              <span>{file ? `${(file.size / 1024).toFixed(1)} KB · Click to replace` : 'or click to browse your files'}</span>
              <input ref={fileInput} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={onChoose} hidden />
            </div>
            <div className="form-grid">
              <label>Shipping mark<input value={mark} onChange={event => { setMark(event.target.value); setResult(null); }} maxLength={60} /></label>
              <label>Country of origin<input value={origin} onChange={event => { setOrigin(event.target.value); setResult(null); }} maxLength={60} /></label>
              <label className="full">Worksheet name <small>(optional — defaults to first sheet)</small><input value={sheet} onChange={event => { setSheet(event.target.value); setResult(null); }} placeholder="First worksheet" /></label>
            </div>
            {error && <div className="error" role="alert"><strong>Unable to process file</strong><div>{error}</div></div>}
            <button className="primary" type="submit" disabled={busy || !file}>{busy ? 'Generating labels…' : 'Generate box labels'} <span>→</span></button>
          </form>
        </section>
        <section className="panel results">
          <div className="section-head"><span className="step">02</span><div><h2>Shipment summary</h2><p>Results from your packing list</p></div></div>
          {!result ? <div className="empty"><div className="empty-icon">▤</div><strong>No labels generated yet</strong><p>Upload a packing list and click Generate to see the shipment totals.</p></div> : <>
            <div className="stats">
              <div className="stat"><span>Total boxes</span><strong>{result.summary.boxCount}</strong></div>
              <div className="stat"><span>Gross weight</span><strong>{kg(result.summary.totalGrossWeightKg)}</strong></div>
              <div className="stat"><span>Net weight</span><strong>{kg(result.summary.totalNetWeightKg)}</strong></div>
              <div className="stat"><span>Packaging tare</span><strong>{kg(result.summary.totalTareWeightKg)}</strong></div>
            </div>
            <h3>Items in shipment</h3>
            <div className="groups">{Object.entries(result.summary.byCommodity).map(([name, group]) => <div className="group" key={name}><span>{name}</span><strong>{group.boxCount} {group.boxCount === 1 ? 'box' : 'boxes'}</strong></div>)}</div>
            <div className="downloads">
              <button className="primary" onClick={() => saveFile('box-labels.pdf', base64ToBlob(result.labelsPdfBase64))}>↓ Download labels PDF</button>
              <button className="secondary" onClick={() => saveFile('box-labels.txt', new Blob([result.labelsText], { type: 'text/plain;charset=utf-8' }))}>Download text labels</button>
              <button className="secondary" onClick={() => saveFile('packing-summary.json', new Blob([JSON.stringify(result.summary, null, 2) + '\n'], { type: 'application/json' }))}>Download summary JSON</button>
            </div>
          </>}
        </section>
      </div>
      <div className="footnote">Input columns: A = box number · B = item · D = quantity · E = size/tare · F = gross weight · G = owner mark</div>
    </main>
  </div>;
}
