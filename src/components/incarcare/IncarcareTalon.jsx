import React, { useState } from 'react';

// Componenta pentru incarcarea Talonului/CIV si extragerea automata a datelor
// Props:
//   label: string — text buton
//   color: 'orange' | 'blue' | 'green'
//   onDataExtracted: (data) => void — callback cu datele vehiculului

function GdprModal({ onAccept, onRefuse, isScanning }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🔒</span>
          <h3 className="text-xl font-black text-slate-900">Confirmare procesare date</h3>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>Atenție:</strong> Imaginea talonului vehiculului (CIV) va fi trimisă și
            procesată de <strong>Claude AI (Anthropic)</strong> pentru extragerea automată a datelor.
          </p>
        </div>
        <div className="space-y-3 mb-5 text-sm text-slate-600">
          <div className="flex gap-2"><span className="text-green-500 shrink-0">✓</span><span>Folosită <strong>exclusiv</strong> pentru extragerea datelor vehiculului</span></div>
          <div className="flex gap-2"><span className="text-green-500 shrink-0">✓</span><span>Nu este stocată permanent pe serverele Anthropic</span></div>
          <div className="flex gap-2"><span className="text-green-500 shrink-0">✓</span><span>Datele extrase rămân exclusiv în browserul tău</span></div>
          <div className="flex gap-2"><span className="text-amber-500 shrink-0">⚠</span><span>Servere localizate în <strong>SUA</strong> — transfer internațional Art. 46 GDPR</span></div>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Prin continuare îți exprimi consimțământul explicit conform Art. 6(1)(a) GDPR.
        </p>
        <div className="flex gap-3">
          <button onClick={onRefuse}
            className="flex-1 py-3 rounded-2xl border-2 border-slate-200 font-bold text-slate-600 hover:border-slate-400 transition-all text-sm">
            Nu, completez manual
          </button>
          <label className="flex-1 cursor-pointer">
            <div className={`w-full py-3 rounded-2xl font-bold text-center text-white text-sm transition-all ${isScanning ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-orange-600 cursor-pointer'}`}>
              {isScanning ? '⏳ Se procesează...' : '✓ Da, sunt de acord'}
            </div>
            {!isScanning && (
              <input type="file" accept="image/*,application/pdf" className="hidden"
                onChange={(e) => { if (e.target.files[0]) onAccept(e.target.files[0]); }} />
            )}
          </label>
        </div>
      </div>
    </div>
  );
}

function IncarcareTalon({ label = 'Încărcare Document Vehicul', color = 'orange', onDataExtracted, onScanSuccess }) {
  const [showModal, setShowModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);

  const colorMap = {
    blue:   'bg-blue-600 hover:bg-blue-700 text-white',
    green:  'bg-green-600 hover:bg-green-700 text-white',
    orange: 'bg-orange-600 hover:bg-orange-700 text-white',
  };

  const handleFile = async (file) => {
    setShowModal(false);
    setIsScanning(true);
    setResult(null);

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType: file.type || 'image/jpeg',
          tip: 'talon',
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setResult({ error: data.eroare || data.error || 'Nu s-au putut extrage datele.' });
        return;
      }

      const { marca, tip, vin, serie_motor, cilindree, putere_kw, an_fabricatie, nr_inmatriculare, culoare, tip_combustibil } = data.data;

      if (!marca && !vin) {
        setResult({ error: 'Nu s-au putut citi datele vehiculului. Încearcă o poză mai clară a talonului (CIV).' });
        return;
      }

      setResult({ success: true, fields: data.data });
      if (onScanSuccess) onScanSuccess();
      onDataExtracted(data.data);

    } catch (err) {
      setResult({ error: 'Eroare de conexiune. Verifică internetul și încearcă din nou.' });
    } finally {
      setIsScanning(false);
    }
  };

  const fieldLabels = {
    marca: 'Marcă',
    tip: 'Model',
    vin: 'VIN',
    serie_motor: 'Serie motor',
    cilindree: 'Cilindree (cmc)',
    putere_kw: 'Putere (kW)',
    an_fabricatie: 'An fabricație',
    nr_inmatriculare: 'Nr. înmatriculare',
    culoare: 'Culoare',
    tip_combustibil: 'Combustibil',
  };

  return (
    <div>
      {showModal && (
        <GdprModal
          onAccept={handleFile}
          onRefuse={() => setShowModal(false)}
          isScanning={isScanning}
        />
      )}

      <button type="button"
        onClick={() => { setShowModal(true); setResult(null); }}
        disabled={isScanning}
        className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm disabled:opacity-50 ${colorMap[color] || colorMap.orange}`}>
        {isScanning ? '⏳ Se procesează...' : `📎 ${label}`}
      </button>

      {result && (
        <div className={`mt-3 p-4 rounded-2xl text-xs ${result.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
          {result.error ? (
            <div>
              <p className="font-bold text-red-700 mb-1">❌ {result.error}</p>
              <p className="text-red-500">Poți completa datele vehiculului manual în câmpurile de mai jos.</p>
            </div>
          ) : (
            <div>
              <p className="font-bold text-green-700 mb-2">✓ Date vehicul extrase — verificați și corectați dacă e necesar:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(result.fields).map(([k, v]) => v && (
                  <p key={k} className="text-green-800">
                    <span className="font-mono text-green-600">{fieldLabels[k] || k}:</span> {v}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default IncarcareTalon;
