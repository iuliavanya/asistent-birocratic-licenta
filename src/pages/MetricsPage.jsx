// src/pages/MetricsPage.jsx
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'asistent_birocratic_metrics';

function loadMetrics() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function avg(arr) {
  if (!arr.length) return '—';
  return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
}

function downloadJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `metrics_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCSV(data) {
  if (!data.length) return;
  const headers = ['sessionId', 'form', 'startedAt', 'durationSeconds', 'validationErrors', 'usedAIScan', 'completed'];
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `metrics_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const FORM_LABELS = {
  AdeverintaVenit: 'Adeverință Venit',
  D212: 'Declarație D212',
  ParcareResedinta: 'Parcare Reședință',
  TranscrierAct: 'Transcriere Act',
  ContractAuto: 'Contract Auto',
  InmatriculareVehicul: 'Înmatriculare Vehicul',
};

const btnRed = {
  padding: '0.35rem 0.8rem', cursor: 'pointer', borderRadius: '6px',
  background: '#dc2626', color: '#fff', border: 'none',
  fontWeight: '700', fontSize: '0.78rem',
};

export default function MetricsPage() {
  const [metrics, setMetrics] = useState([]);

  useEffect(() => { setMetrics(loadMetrics()); }, []);

  const completed = metrics.filter(m => m.completed);
  const completionRate = metrics.length ? ((completed.length / metrics.length) * 100).toFixed(1) : '—';
  const avgDuration = avg(completed.map(m => m.durationSeconds));
  const avgErrors = avg(metrics.map(m => m.validationErrors));
  const aiScanPct = metrics.length ? ((metrics.filter(m => m.usedAIScan).length / metrics.length) * 100).toFixed(1) : '—';

  function handleClear() {
    if (window.confirm('Ștergi toate metricile? Acțiunea este ireversibilă.')) {
      localStorage.removeItem(STORAGE_KEY);
      setMetrics([]);
    }
  }

  function handleDeleteRow(sessionId) {
    if (!window.confirm('Sigur vrei să ștergi această sesiune?')) return;
    const updated = metrics.filter(m => m.sessionId !== sessionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setMetrics(updated);
  }

  const statCards = [
    { label: 'Total sesiuni', value: metrics.length },
    { label: 'Rată finalizare', value: completionRate !== '—' ? `${completionRate}%` : '—' },
    { label: 'Timp mediu (s)', value: avgDuration },
    { label: 'AI Scan folosit', value: aiScanPct !== '—' ? `${aiScanPct}%` : '—' },
    { label: 'Erori medii/sesiune', value: avgErrors },
  ];

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', padding: '2rem', maxWidth: '1300px', margin: '0 auto', color: '#1e293b' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.25rem' }}>
          📊 Metrics — Asistent Birocratic
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
          Pagină internă pentru testare utilizabilitate (lucrare de licență). Nu este linkuită din aplicație.
        </p>
      </div>

      {/* Statistici agregate */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {statCards.map(stat => (
          <div key={stat.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.5rem', minWidth: '160px' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Butoane actiuni */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => downloadJSON(metrics)} disabled={!metrics.length}
          style={{ padding: '0.6rem 1.2rem', cursor: 'pointer', borderRadius: '8px', background: '#1d4ed8', color: '#fff', border: 'none', fontWeight: '700', fontSize: '0.875rem', opacity: metrics.length ? 1 : 0.5 }}>
          ⬇ Download JSON
        </button>
        <button onClick={() => downloadCSV(metrics)} disabled={!metrics.length}
          style={{ padding: '0.6rem 1.2rem', cursor: 'pointer', borderRadius: '8px', background: '#065f46', color: '#fff', border: 'none', fontWeight: '700', fontSize: '0.875rem', opacity: metrics.length ? 1 : 0.5 }}>
          ⬇ Download CSV
        </button>
        <button onClick={handleClear} disabled={!metrics.length}
          style={{ padding: '0.6rem 1.2rem', cursor: 'pointer', borderRadius: '8px', background: '#dc2626', color: '#fff', border: 'none', fontWeight: '700', fontSize: '0.875rem', opacity: metrics.length ? 1 : 0.5 }}>
          🗑 Clear Metrics
        </button>
        <button onClick={() => setMetrics(loadMetrics())}
          style={{ padding: '0.6rem 1.2rem', cursor: 'pointer', borderRadius: '8px', background: '#475569', color: '#fff', border: 'none', fontWeight: '700', fontSize: '0.875rem' }}>
          🔄 Refresh
        </button>
      </div>

      {/* Tabel sesiuni */}
      {metrics.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Nicio sesiune înregistrată încă.</p>
          <p style={{ fontSize: '0.85rem' }}>Completează un formular și generează un PDF pentru a vedea date aici.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {['#', 'Session ID', 'Formular', 'Început', 'Durată (s)', 'Erori validare', 'AI Scan', 'Finalizat', 'Șterge'].map(h => (
                  <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', borderBottom: '2px solid #cbd5e1', fontWeight: '700', color: '#475569', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, i) => (
                <tr key={m.sessionId} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#94a3b8', fontSize: '0.75rem' }}>{i + 1}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#94a3b8', fontSize: '0.72rem', fontFamily: 'monospace' }}>{m.sessionId}</td>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: '700', color: '#1e293b' }}>{FORM_LABELS[m.form] || m.form}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#475569', whiteSpace: 'nowrap' }}>{new Date(m.startedAt).toLocaleString('ro-RO')}</td>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: '700', textAlign: 'center' }}>{m.durationSeconds}</td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: m.validationErrors > 3 ? '#dc2626' : m.validationErrors > 0 ? '#d97706' : '#16a34a', fontWeight: '700' }}>
                    {m.validationErrors}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{m.usedAIScan ? '✅' : '—'}</td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{m.completed ? '✅' : '❌'}</td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                    <button onClick={() => handleDeleteRow(m.sessionId)} style={btnRed}>
                      Șterge
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
