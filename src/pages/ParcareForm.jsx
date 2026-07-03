import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { validateData, validateNumePrenume, validateCNP, validateSerieCI, validateAdresa, validateNrInmatriculare, decodeCNP , validateEmail, validateTelefon } from '../utils/validators';
import { useFormHandlers } from '../utils/useFormHandlers';
import { useFormPersist } from '../utils/Userformpersist';
import LocalitateAutocomplete from '../components/LocalitateAutocomplete';
import IncarcareCI from '../components/incarcare/IncarcareCI';
import IncarcareTalon from '../components/incarcare/IncarcareTalon';
import { useSessionMetrics } from '../utils/useSessionMetrics';
import '../fonts/Roboto-normal';
import '../fonts/Roboto-bold';

const sharedFieldClasses = "w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium placeholder:text-slate-400";
const errorFieldClasses = "w-full p-4 bg-red-50 border border-red-300 rounded-2xl outline-none focus:ring-2 focus:ring-red-400 transition-all font-medium placeholder:text-slate-400";

const CNPBadge = ({ cnpInfo }) => {
  if (!cnpInfo) return null;
  return (
    <div className={`mt-2 p-3 rounded-xl text-xs flex gap-4 font-medium ${cnpInfo.valid ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
      <span>📅 {cnpInfo.dataNasterii}</span>
      <span>{cnpInfo.sex === 'M' ? '👨' : '👩'} {cnpInfo.sex}</span>
      <span>📍 {cnpInfo.judet}</span>
      {!cnpInfo.valid && <span className="ml-auto">⚠️ Verificati CNP-ul</span>}
    </div>
  );
};

function ParcareForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [cnpInfo, setCnpInfo] = useState(null);
  const [errors, setErrors] = useState({});
  const [gdprAccept, setGdprAccept] = useState(false);
  const [declaratieAccept, setDeclaratieAccept] = useState(false);

  const [formData, setFormData, clearPersist] = useFormPersist('parcare_form', {
    nume: '', cnp: '', serie_ci: '', adresa: '',
    telefon: '', email: '',
    nr_inmatriculare: '', marca: '', model: '', nr_certificat: '', civ: '',
    localitate: '', data: new Date().toLocaleDateString('ro-RO'),
  });

  // Nr. certificat înmatriculare: uppercase
  const handleNrCertificatChange = (e) => {
    const val = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, nr_certificat: val }));
    if (errors.nr_certificat) setErrors(prev => ({ ...prev, nr_certificat: null }));
  };

  const { startSession, saveProgress, trackFirstInput, recordValidationError, recordAIScan, completeSession } = useSessionMetrics('ParcareResedinta');

  const {
  handleChange,
  handleCNPChange,
  handleCIChange,
  handleCIDataExtracted,
  handleUpperChange,
  handleNrInmatriculareChange,
  handleTalonDataExtracted,
  handleDateChange,
} = useFormHandlers(setFormData, setErrors, formData, { setCnpInfo });

  // Wrapper care inregistreaza primul input al utilizatorului
  const handleChangeTracked = (e) => { trackFirstInput(); handleChange(e); };
  const validateStep = (s) => {
    const newErrors = {};
    if (s === 1) {
      const numeErr = validateNumePrenume(formData.nume);
      if (numeErr) newErrors.nume = numeErr;

      const cnpErr = validateCNP(formData.cnp);
      if (cnpErr) newErrors.cnp = cnpErr;

      const ciErr = validateSerieCI(formData.serie_ci);
      if (ciErr) newErrors.serie_ci = ciErr;

      const adrErr = validateAdresa(formData.adresa);
      if (adrErr) newErrors.adresa = adrErr;
    }
    if (s === 2) {
      if (!formData.nr_inmatriculare.trim()) {
        newErrors.nr_inmatriculare = 'Obligatoriu';
      } else {
        const err = validateNrInmatriculare(formData.nr_inmatriculare);
        if (err) newErrors.nr_inmatriculare = err;
      }
      if (!formData.marca.trim()) newErrors.marca = 'Obligatoriu';
      if (!formData.model.trim()) newErrors.model = 'Obligatoriu';
      if (!formData.nr_certificat.trim()) newErrors.nr_certificat = 'Obligatoriu';
    }
    if (s === 3) {
      if (!declaratieAccept) newErrors.declaratie = 'Trebuie sa bifati declaratia';
      if (!gdprAccept) newErrors.gdpr = 'Trebuie sa acceptati prelucrarea datelor';
      if (!formData.localitate.trim()) newErrors.localitate = 'Obligatoriu';
    }

      if (formData.telefon) {
        const telErr = validateTelefon(formData.telefon);
        if (telErr) newErrors.telefon = telErr;
      }
      if (formData.email) {
        const emailErr = validateEmail(formData.email);
        if (emailErr) newErrors.email = emailErr;
      }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) recordValidationError();
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 3) { saveProgress(); setStep(step + 1); }
      else generatePDF();
    }
  };

  const FieldError = ({ name }) => errors[name]
    ? <p className="mt-1 ml-1 text-xs text-red-500 font-medium">⚠ {errors[name]}</p>
    : null;

  const fieldClass = (name) => errors[name] ? errorFieldClasses : sharedFieldClasses;

  const adresaCompleta = formData.adresa || '';

  const generatePDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.setFont('Roboto', 'normal');
    const pageW = doc.internal.pageSize.getWidth();
    const L = 20, R = 190, W = R - L;
    let y = 20;

    const ln = (x1, y1, x2, y2, w = 0.3) => {
      doc.setDrawColor(0); doc.setLineWidth(w); doc.line(x1, y1, x2, y2);
    };
    const t = (text, x, yy, align = 'left') => doc.text((String(text || '')), x, yy, { align });
    const wrap = (text, maxW, sz, lh) => {
      doc.setFontSize(sz);
      const lines = doc.splitTextToSize((text), maxW);
      return { lines, h: lines.length * lh };
    };
    const dots = (n) => '.'.repeat(n);

    // --- ANTET ---
    doc.setFont('Roboto', 'bold'); doc.setFontSize(12);
    t('CERERE', pageW / 2, y, 'center'); y += 6;
    doc.setFontSize(10);
    t('pentru atribuirea unui loc de parcare în parcarea de reședință', pageW / 2, y, 'center'); y += 5;
    ln(L, y, R, y, 0.5); y += 8;

    // --- CATRE ---
    doc.setFont('Roboto', 'normal'); doc.setFontSize(9);
    t('Către,', L, y); y += 5;
    doc.setFont('Roboto', 'bold'); doc.setFontSize(9);
    t('PRIMĂRIA ' + (formData.localitate).toUpperCase(), L + 5, y); y += 8;

    // --- SUBSEMNATUL ---
    doc.setFont('Roboto', 'normal'); doc.setFontSize(9);
    // CI parsing
    const ciRaw = formData.serie_ci || '';
    const ciMatch = ciRaw.replace(/\s/g,'').match(/^([A-Z]{2})(\d+)$/i);
    const serieLit = ciMatch ? ciMatch[1] : ciRaw.split(' ')[0] || '';
    const serieNr  = ciMatch ? ciMatch[2] : ciRaw.split(' ')[1] || '';

    const subsemnat = `Subsemnatul(a) ${formData.nume}, CNP ${formData.cnp}, cu domiciliul în ${adresaCompleta}, posesor al actului de identitate seria ${serieLit} nr. ${serieNr}, telefon: ${formData.telefon || dots(12)}, e-mail: ${formData.email || dots(20)},`;
    const { lines: subsLines, h: subsH } = wrap(subsemnat, W, 9, 4.5);
    doc.text(subsLines, L, y); y += subsH + 2;

    // --- SOLICIT ---
    doc.setFont('Roboto', 'bold'); doc.setFontSize(10);
    t('SOLICIT', pageW / 2, y, 'center'); y += 5;
    doc.setFont('Roboto', 'normal'); doc.setFontSize(9);
    const solicit = 'atribuirea unui loc de parcare în parcarea de reședință arondată imobilului de domiciliu, pentru autovehiculul cu datele de mai jos:';
    const { lines: solicitLines, h: solicitH } = wrap(solicit, W, 9, 4.5);
    doc.text(solicitLines, L, y); y += solicitH + 3;

    // --- TABEL DATE VEHICUL ---
    doc.setFillColor(245, 245, 245);
    doc.rect(L, y - 2, W, 32, 'F');
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.2);
    doc.rect(L, y - 2, W, 32);

    const col1 = L + 3;
    const col2 = L + 55;
    const col3 = L + 105;
    const col4 = L + 145;

    doc.setFont('Roboto', 'bold'); doc.setFontSize(8);
    t('Nr. înmatriculare:', col1, y + 3);
    t('Marca:', col3, y + 3);
    doc.setFont('Roboto', 'normal');
    t(formData.nr_inmatriculare, col2, y + 3);
    t(formData.marca, col4, y + 3);

    y += 9;
    doc.setFont('Roboto', 'bold');
    t('Nr. certificat înmatriculare:', col1, y + 3);
    t('Model:', col3, y + 3);
    doc.setFont('Roboto', 'normal');
    t(formData.nr_certificat, col2, y + 3);
    t(formData.model, col4, y + 3);

    y += 9;
    doc.setFont('Roboto', 'bold');
    t('Carte identitate vehicul (CIV):', col1, y + 3);
    doc.setFont('Roboto', 'normal');
    t(formData.civ || dots(15), col2, y + 3);

    y += 16;
    ln(L, y, R, y); y += 6;

    // --- DOCUMENTE ANEXATE ---
    doc.setFont('Roboto', 'bold'); doc.setFontSize(9);
    t('Anexez urmatoarele documente:', L, y); y += 5;
    doc.setFont('Roboto', 'normal'); doc.setFontSize(8.5);
    const docs = [
      'Copie carte de identitate / buletin de identitate (valabil)',
      'Copie certificat de înmatriculare al autovehiculului',
      'Copie carte de identitate a vehiculului (CIV)',
      'Copie ITP și RCA valabile',
      'Documente privind dreptul de proprietate / folosință asupra locuinței (contract vânzare-cumpărare, contract de închiriere etc.)',
      'Certificat fiscal fără datorii (eliberat de Direcția Taxe și Impozite)',
    ];
    docs.forEach(d => {
      const { lines, h } = wrap('• ' + d, W - 5, 8.5, 4.2);
      doc.text(lines, L + 3, y);
      y += h + 1;
    });
    y += 2;
    ln(L, y, R, y); y += 6;

    // --- DECLARATII ---
    doc.setFontSize(8.5);
    const decl1 = 'Declar pe propria raspundere că datele furnizate sunt corecte și că respect prevederile Regulamentului de organizare și functionare a parcărilor de reședință de pe raza localității.';
    const { lines: d1Lines, h: d1H } = wrap(decl1, W, 8.5, 4.2);
    doc.text(d1Lines, L, y); y += d1H + 4;

    const decl2 = 'Îmi exprim consimțământul pentru prelucrarea datelor mele cu caracter personal de către instituție, inclusiv codul numeric personal, în scopul soluționării prezentei cereri, în conformitate cu Regulamentul (UE) 2016/679 (GDPR).';
    const { lines: d2Lines, h: d2H } = wrap(decl2, W, 8.5, 4.2);
    doc.text(d2Lines, L, y); y += d2H + 6;

    ln(L, y, R, y); y += 8;

    // --- DATA SI SEMNATURA ---
    doc.setFontSize(9);
    t('Data: ' + formData.data, L, y);
    // spatiu generos pt semnatura olografa
    t('Semnătura olografă:', R - 60, y);
    y += 15;
    ln(R - 55, y, R, y, 0.3); // linie semnatura
    y += 8;

    // --- BORDER EXTERIOR ---
    doc.setDrawColor(0); doc.setLineWidth(0.5);
    doc.rect(L - 5, 14, R - L + 10, y + 2);

    doc.save('Cerere-Parcare-Resedinta.pdf');
    completeSession();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-green-600 mb-8 flex items-center font-medium">
          ← Înapoi la Dashboard
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 uppercase italic">Cerere Parcare Reședință</h1>
          <p className="text-slate-500 font-medium">Pasul {step} din 3</p>
        </header>

        <div className="w-full bg-slate-200 h-2 rounded-full mb-12 overflow-hidden">
          <div className="bg-green-500 h-2 rounded-full transition-all duration-700" style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100">

          {/* PASUL 1: DATE SOLICITANT */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-500">
              <div className="border-b pb-5">
                <h2 className="text-xl font-bold text-green-600 uppercase">01. Date Solicitant</h2>
                <p className="text-xs text-slate-400 mt-1">Toate câmpurile marcate cu * sunt obligatorii</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-green-800">📎 Completare automată din CI</p>
                  <p className="text-xs text-green-600 mt-0.5">Scanează cartea de identitate și câmpurile se vor completa automat</p>
                </div>
                <IncarcareCI label="Scanează CI" color="green" onDataExtracted={handleCIDataExtracted}
                  onScanSuccess={recordAIScan} />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Nume și Prenume *</label>
                <input name="nume" value={formData.nume} onChange={handleUpperChange('nume')} className={fieldClass('nume')} placeholder="Ex: POPESCU ION" />
                <FieldError name="nume" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">CNP *</label>
                  <input name="cnp" value={formData.cnp} onChange={handleCNPChange} className={fieldClass('cnp')} placeholder="Ex: 1801012345678" maxLength={13} />
                  <FieldError name="cnp" />
                  <CNPBadge cnpInfo={cnpInfo} />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Serie și Nr. CI *</label>
                  <input name="serie_ci" value={formData.serie_ci} onChange={handleCIChange('serie_ci')} className={fieldClass('serie_ci')} placeholder="Ex: RR 123456" maxLength={9} />
                  <FieldError name="serie_ci" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Adresă Domiciliu *</label>
                <textarea
                  name="adresa"
                  value={formData.adresa || ''}
                  onChange={(e) => { trackFirstInput(); handleUpperChange('adresa')(e); }}
                  rows="2"
                  className={errors.adresa ? errorFieldClasses + ' resize-none' : sharedFieldClasses + ' resize-none'}
                  placeholder="Ex: Str. Florilor nr. 5, bl. A, sc. 1, ap. 10, Timisoara, Jud. Timis"
                />
                {errors.adresa && <p className="mt-1 ml-1 text-xs text-red-500 font-medium">⚠ {errors.adresa}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Telefon <span className="text-slate-300 font-normal normal-case">(opțional)</span></label>
                  <input name="telefon" value={formData.telefon} onChange={handleChangeTracked}
                    className={fieldClass('telefon')} placeholder="Ex: 0721 234 567" />
                  <FieldError name="telefon" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Email <span className="text-slate-300 font-normal normal-case">(opțional)</span></label>
                  <input name="email" value={formData.email} onChange={handleChangeTracked}
                    className={fieldClass('email')} placeholder="Ex: ion@email.com" />
                  <FieldError name="email" />
                </div>
              </div>
            </div>
          )}

          {/* PASUL 2: DATE VEHICUL */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-500">
              <div className="border-b pb-5">
                <h2 className="text-xl font-bold text-green-600 uppercase">02. Date Vehicul</h2>
                <p className="text-xs text-slate-400 mt-1">Datele din certificatul de înmatriculare</p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-orange-800">📎 Completare automată din Talon</p>
                  <p className="text-xs text-orange-600 mt-0.5">Scanează talonul vehiculului și câmpurile se vor completa automat</p>
                </div>
                <IncarcareTalon
                  label="Scanează Talon"
                  color="orange"
                  onDataExtracted={(data) => {
                    setFormData(prev => ({
                      ...prev,
                      ...(data.nr_inmatriculare && { nr_inmatriculare: data.nr_inmatriculare }),
                      ...(data.marca && { marca: data.marca.toUpperCase() }),
                      ...(data.tip && { model: data.tip.toUpperCase() }),
                    }));
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Nr. Înmatriculare *</label>
                  <input name="nr_inmatriculare" value={formData.nr_inmatriculare} onChange={handleNrInmatriculareChange('nr_inmatriculare')} className={fieldClass('nr_inmatriculare')} placeholder="Ex: TM 01 ABC" maxLength={10} />
                  <FieldError name="nr_inmatriculare" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Nr. Certificat Înmatriculare *</label>
                  <input name="nr_certificat" value={formData.nr_certificat} onChange={handleNrCertificatChange} className={fieldClass('nr_certificat')} placeholder="Ex: A 12345678" />
                  <FieldError name="nr_certificat" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Marca *</label>
                  <input name="marca" value={formData.marca} onChange={handleUpperChange('marca')} className={fieldClass('marca')} placeholder="Ex: DACIA" />
                  <FieldError name="marca" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Model *</label>
                  <input name="model" value={formData.model} onChange={handleUpperChange('model')} className={fieldClass('model')} placeholder="Ex: LOGAN" />
                  <FieldError name="model" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                  Nr. Carte Identitate Vehicul (CIV) <span className="text-slate-300 font-normal normal-case">(opțional)</span>
                </label>
                <input name="civ" value={formData.civ} onChange={handleChangeTracked} className={sharedFieldClasses} placeholder="Ex: 12345678" />
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs">
                <p className="font-black uppercase text-slate-400 mb-2">Rezumat solicitant</p>
                <p><span className="text-slate-400">Nume:</span> <span className="font-bold ml-1">{formData.nume || '—'}</span></p>
                <p className="mt-1"><span className="text-slate-400">Adresă:</span> <span className="font-medium ml-1">{adresaCompleta || '—'}</span></p>
              </div>
            </div>
          )}

          {/* PASUL 3: DECLARATII */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-500">
              <div className="border-b pb-5">
                <h2 className="text-xl font-bold text-green-600 uppercase">03. Declarații și Confirmare</h2>
                <p className="text-xs text-slate-400 mt-1">Verificați datele și bifați declarațiile obligatorii</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-1">
                <p className="font-black uppercase text-slate-400 mb-2">Rezumat cerere</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <p><span className="text-slate-400">Solicitant:</span> <span className="font-bold ml-1">{formData.nume || '—'}</span></p>
                  <p><span className="text-slate-400">CNP:</span> <span className="font-mono ml-1">{formData.cnp || '—'}</span></p>
                  <p className="col-span-2"><span className="text-slate-400">Adresă:</span> <span className="font-medium ml-1">{adresaCompleta || '—'}</span></p>
                  <p><span className="text-slate-400">Vehicul:</span> <span className="font-bold ml-1">{formData.nr_inmatriculare || '—'}</span></p>
                  <p><span className="text-slate-400">Marcă:</span> <span className="ml-1">{formData.marca} {formData.model}</span></p>
                </div>
              </div>

              <div
                onClick={() => setDeclaratieAccept(!declaratieAccept)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${declaratieAccept ? 'bg-green-50 border-green-300' : 'bg-slate-50 border-slate-200'}`}
              >
                <div className="flex gap-3 items-start">
                  <div className={`mt-0.5 w-5 h-5 rounded shrink-0 flex items-center justify-center border-2 transition-all ${declaratieAccept ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                    {declaratieAccept && <span className="text-white text-xs">✓</span>}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-bold text-slate-800">Declar pe propria răspundere</span> că datele furnizate sunt corecte și că respect prevederile Regulamentului de organizare și funcționare a parcărilor de reședință.
                  </p>
                </div>
              </div>
              <FieldError name="declaratie" />

              <div
                onClick={() => setGdprAccept(!gdprAccept)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${gdprAccept ? 'bg-green-50 border-green-300' : 'bg-slate-50 border-slate-200'}`}
              >
                <div className="flex gap-3 items-start">
                  <div className={`mt-0.5 w-5 h-5 rounded shrink-0 flex items-center justify-center border-2 transition-all ${gdprAccept ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                    {gdprAccept && <span className="text-white text-xs">✓</span>}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-bold text-slate-800">Îmi exprim consimțământul</span> pentru prelucrarea datelor mele cu caracter personal de către instituție, inclusiv CNP-ul, în scopul soluționării prezentei cereri, conform Regulamentului (UE) 2016/679 (GDPR).
                  </p>
                </div>
              </div>
              <FieldError name="gdpr" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <LocalitateAutocomplete
                    value={formData.localitate}
                    onChange={(val) => {
                      setFormData(prev => ({ ...prev, localitate: val }));
                      if (errors.localitate) setErrors(prev => ({ ...prev, localitate: null }));
                    }}
                    error={errors.localitate}
                    label="Localitatea"
                    placeholder="Ex: Timișoara"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                    Data
                  </label>

                  <input
                    name="data"
                    value={formData.data}
                    onChange={(e) => {
                      trackFirstInput();
                      handleDateChange("data")(e);
                    }}
                    className={fieldClass('data')}
                    maxLength={10}
                    placeholder="ZZ.LL.AAAA"
                  />

                  <FieldError name="data" />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
                <p className="font-bold mb-1">📎 Documente de anexat la depunere:</p>
                <ul className="space-y-1 list-none">
                  <li>• Copie CI / buletin valabil</li>
                  <li>• Copie certificat înmatriculare vehicul</li>
                  <li>• Copie CIV + ITP și RCA valabile</li>
                  <li>• Dovada dreptului asupra locuinței (contract vânzare-cumpărare / chirie)</li>
                  <li>• Certificat fiscal fără datorii</li>
                </ul>
              </div>
            </div>
          )}

          <div className="mt-10 flex justify-between items-center border-t pt-8">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="font-bold text-slate-400 hover:text-slate-800">
                ← Înapoi
              </button>
            )}
            <button
              onClick={handleNext}
              className={`ml-auto px-10 py-4 text-white rounded-2xl font-black transition-all ${step === 3 ? 'bg-green-600 shadow-lg shadow-green-100 hover:bg-green-700' : 'bg-slate-900 hover:bg-green-600 shadow-xl'}`}
            >
              {step === 3 ? '📄 Descarcă Cerere PDF' : 'Pasul următor →'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ParcareForm;
