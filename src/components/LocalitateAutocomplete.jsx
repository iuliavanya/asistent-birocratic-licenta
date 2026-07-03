import React, { useState, useRef, useEffect } from 'react';

const sharedFieldClasses = "w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium placeholder:text-slate-400 font-sans";
const errorFieldClasses = "w-full p-4 bg-red-50 border border-red-300 rounded-2xl outline-none focus:ring-2 focus:ring-red-400 transition-all font-medium placeholder:text-slate-400 font-sans";

const JUDETE = [
  "Alba","Arad","Argeș","Bacău","Bihor","Bistrița-Năsăud","Botoșani","Brașov",
  "Brăila","București","Buzău","Călărași","Caraș-Severin","Cluj","Constanța",
  "Covasna","Dâmbovița","Dolj","Galați","Giurgiu","Gorj","Harghita","Hunedoara",
  "Ialomița","Iași","Ilfov","Maramureș","Mehedinți","Mureș","Neamț","Olt",
  "Prahova","Sălaj","Satu Mare","Sibiu","Suceava","Teleorman","Timiș","Tulcea",
  "Vâlcea","Vaslui","Vrancea",
].sort((a, b) => a.localeCompare(b, 'ro'));

/**
 * LocalitateAutocomplete — dropdown cu autocomplete pentru județe
 *
 * Props:
 *  - value: string          — valoarea curenta
 *  - onChange: (val) => {}  — callback cu noua valoare
 *  - error: string|null     — mesaj de eroare (optional)
 *  - placeholder: string    — placeholder (optional)
 *  - label: string          — label afisat deasupra (optional)
 *  - required: bool         — arata * langa label (optional)
 *
 * Utilizare:
 *  <LocalitateAutocomplete
 *    value={formData.judet}
 *    onChange={(val) => setFormData(prev => ({ ...prev, judet: val }))}
 *    error={errors.judet}
 *    label="Județul"
 *    required
 *  />
 */
function LocalitateAutocomplete({
  value = '',
  onChange,
  error = null,
  placeholder = 'Ex: Timiș',
  label = 'Județul',
  required = false,
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const normalize = (str) =>
    str.toLowerCase()
      .replace(/ă/g,'a').replace(/â/g,'a').replace(/î/g,'i')
      .replace(/ș/g,'s').replace(/ț/g,'t')
      .replace(/ş/g,'s').replace(/ţ/g,'t');

  const filtered = query.length >= 1
    ? JUDETE.filter(j => normalize(j).includes(normalize(query)))
    : JUDETE;

  const handleInput = (e) => {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
    setHighlighted(0);
  };

  const handleSelect = (judet) => {
    setQuery(judet);
    onChange(judet);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open || filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(filtered[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (listRef.current) {
      const item = listRef.current.children[highlighted];
      if (item) item.scrollIntoView({ block: 'nearest' });
    }
  }, [highlighted]);

  const inputClass = error ? errorFieldClasses : sharedFieldClasses;

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
          {label}{required && ' *'}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={inputClass}
        />
        <span
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none select-none"
          style={{ fontSize: '10px' }}
        >
          ▼
        </span>
      </div>

      {error && (
        <p className="mt-1 ml-1 text-xs text-red-500 font-medium">⚠ {error}</p>
      )}

      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 overflow-auto max-h-56"
        >
          {filtered.map((judet, i) => (
            <li
              key={judet}
              onMouseDown={() => handleSelect(judet)}
              onMouseEnter={() => setHighlighted(i)}
              className={`px-4 py-3 text-sm font-medium cursor-pointer transition-colors
                ${i === highlighted ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}
                ${i === 0 ? 'rounded-t-2xl' : ''}
                ${i === filtered.length - 1 ? 'rounded-b-2xl' : 'border-b border-slate-100'}
              `}
            >
              {judet}
            </li>
          ))}
        </ul>
      )}

      {open && query.length >= 2 && filtered.length === 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-4 text-sm text-slate-400 text-center">
          Niciun județ găsit
        </div>
      )}
    </div>
  );
}

export default LocalitateAutocomplete;
