import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { validateData, validateCNP, validateSerieCI, validateAdresa, validateNumePrenume, decodeCNP, validateEmail, validateTelefon } from '../utils/validators';
import { useFormHandlers } from '../utils/useFormHandlers';
import { useFormPersist } from '../utils/Userformpersist';
import LocalitateAutocomplete from '../components/LocalitateAutocomplete';
import IncarcareCI from '../components/incarcare/IncarcareCI';
import { useSessionMetrics } from '../utils/useSessionMetrics';
import '../fonts/Roboto-normal';
import '../fonts/Roboto-bold';

const sharedFieldClasses = "w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium placeholder:text-slate-400 font-sans";
const errorFieldClasses = "w-full p-4 bg-red-50 border border-red-300 rounded-2xl outline-none focus:ring-2 focus:ring-red-400 transition-all font-medium placeholder:text-slate-400 font-sans";

const CNPBadge = ({ cnpInfo }) => {
  if (!cnpInfo) return null;
  return (
    <div className={`mt-2 p-3 rounded-xl text-xs flex flex-wrap gap-3 font-medium ${cnpInfo.valid ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
      <span>📅 {cnpInfo.dataNasterii}</span>
      <span>{cnpInfo.sex === 'M' ? '👨' : '👩'} {cnpInfo.sex}</span>
      <span>📍 {cnpInfo.judet}</span>
      {!cnpInfo.valid && <span className="ml-auto">⚠️ Verificati CNP-ul</span>}
    </div>
  );
};

const AN_CURENT = new Date().getFullYear();
const ANI = Array.from({ length: 6 }, (_, i) => AN_CURENT - 1 - i);

function AdeverintaForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [cnpInfo, setCnpInfo] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData, clearPersist] = useFormPersist('adeverinta_form', {
    // Date solicitant
    nume: '', cnp: '', serie_ci: '', adresa: '',
    telefon: '', email: '',
    // Detalii cerere
    an_venit: String(AN_CURENT - 1),
    scop: '',
    scop_altul: '',
    // Meta
    localitate: '', 
    data: new Date().toLocaleDateString('ro-RO'),
    directie_anaf: '',
  });

  const { startSession, saveProgress, trackFirstInput, recordValidationError, recordAIScan, completeSession } = useSessionMetrics('AdeverintaVenit');

  const {
  handleChange,
  handleCNPChange,
  handleCIChange,
  handleCIDataExtracted,
  handleUpperChange,
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
      if (!formData.scop.trim()) newErrors.scop = 'Selectați scopul cererii';
      if (formData.scop === 'altul' && !formData.scop_altul.trim()) newErrors.scop_altul = 'Precizați scopul';
      if (!formData.localitate.trim()) newErrors.localitate = 'Obligatoriu';
      const dataErr = validateData(formData.data , { allowPast: false });
    if (dataErr) newErrors.data = dataErr;
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
      if (step < 2) { saveProgress(); setStep(step + 1); }
      else generatePDF();
    }
  };

  const FieldError = ({ name }) => errors[name]
    ? <p className="mt-1 ml-1 text-xs text-red-500 font-medium">⚠ {errors[name]}</p>
    : null;

  const fieldClass = (name) => errors[name] ? errorFieldClasses : sharedFieldClasses;

  const adresaCompleta = formData.adresa || '';

  const scopText = formData.scop === 'altul'
    ? formData.scop_altul
    : formData.scop;

  const generatePDF = () => {
    const doc = new jsPDF({ unit:'mm', format:'a4' });
    doc.setFont('Roboto', 'normal');
    const pageW = doc.internal.pageSize.getWidth();
    const L = 20, R = 190, W = R - L;
    let y = 20;

    const ln = (x1,y1,x2,y2,w=0.3) => { doc.setDrawColor(0); doc.setLineWidth(w); doc.line(x1,y1,x2,y2); };
    const t = (text,x,yy,align='left') => doc.text((String(text||'')),x,yy,{align}); 
    const wrap = (text,maxW,sz,lh) => { doc.setFontSize(sz); const lines=doc.splitTextToSize((text),maxW); return {lines,h:lines.length*lh}; };
    const dots = (n) => '.'.repeat(n);

    // ANTET
    doc.setFont('Roboto','normal'); doc.setFontSize(8);
    t('MINISTERUL FINANȚELOR PUBLICE', pageW/2, y, 'center'); y+=4;
    t('Agenția Națională de Administrare Fiscală', pageW/2, y, 'center'); y+=4;
    const judetPDF = formData.localitate || 'competenta';
    t((formData.directie_anaf || 'Direcția Generală a Finanțelor Publice a Județului ' + judetPDF), pageW/2, y, 'center'); y+=8;

    ln(L,y,R,y); y+=6;

    // TITLU
    doc.setFont('Roboto','bold'); doc.setFontSize(13);
    t('CERERE DE ELIBERARE A UNEI ADEVERINȚE DE VENIT', pageW/2, y, 'center'); y+=8;
    ln(L,y,R,y); y+=7;

    // SUBSEMNATUL
    doc.setFont('Roboto','normal'); doc.setFontSize(9);
    // Posesor CI — regex robust indiferent de spatiu (AR730436 sau AR 730436)
    const ciRaw = formData.serie_ci || '';
    const ciMatch = ciRaw.replace(/\s/g,'').match(/^([A-Z]{2})(\d+)$/i);
    const serieCI = ciMatch ? ciMatch[1] : ciRaw.split(' ')[0] || '';
    const nrCI    = ciMatch ? ciMatch[2] : ciRaw.split(' ')[1] || '';
    const sub = `Subsemnatul/Subsemnata ${formData.nume}, CNP/NIF ${formData.cnp}, cu domiciliul fiscal în ${adresaCompleta}, posesorul/posesoarea documentului de identitate seria ${serieCI} nr. ${nrCI}, telefon ${formData.telefon || dots(12)}, e-mail ${formData.email || dots(20)},`;
    const {lines:subL, h:subH} = wrap(sub, W, 9, 4.5);
    doc.text(subL, L, y); y += subH;

    // SOLICIT
    doc.setFont('Roboto','bold'); doc.setFontSize(10);
    t('solicit eliberarea unei adeverințe privind situația veniturilor impozabile pe anul:', L, y); y += 6;

    // An venit - chenar
    doc.setFillColor(240,240,240);
    doc.rect(L, y-4, 30, 10, 'F');
    doc.setFont('Roboto','bold'); doc.setFontSize(14);
    t(formData.an_venit, L+15, y+3, 'center'); y += 12;

    doc.setFont('Roboto','normal'); doc.setFontSize(9);

    // Scop
    const scopLine = `Documentul este necesar pentru: ${(scopText||dots(40))}`; 
    const {lines:scopL, h:scopH} = wrap(scopLine, W, 9, 4.5);
    doc.text(scopL, L, y); y += scopH + 3;

    ln(L,y,R,y); y+=7;

    // Declaratie GDPR
    doc.setFontSize(8);
    const gdpr = 'Sunt de acord cu prelucrarea datelor mele cu caracter personal de către ANAF, în scopul soluționării prezentei cereri, în conformitate cu Regulamentul (UE) 2016/679 (GDPR).';
    const {lines:gdprL, h:gdprH} = wrap(gdpr, W, 8, 4);
    doc.text(gdprL, L, y); y += gdprH + 6;

    ln(L,y,R,y); y+=8;

    // Data si semnatura
    doc.setFontSize(9);
    t(`Data: ${formData.data}`, L, y);
    t('Semnatura:', R - 55, y);
    y += 12;
    ln(R-50, y, R, y, 0.3);
    y += 8;

    // Border
    doc.setDrawColor(0); doc.setLineWidth(0.5);
    doc.rect(L-5, 14, R-L+10, y+2);

    doc.save('Cerere-Adeverinta-Venit.pdf');
    completeSession();
  };

  const SCOPURI = [
  'obținerea unui credit bancar',
  'înscrierea la o instituție de învățământ',
  'obținerea unei burse sociale',
  'dosarul de ajutor social',
  'dosarul de alocație pentru susținerea familiei',
  'obținerea unei vize / permis de ședere',
  'uz personal',
  'altul',
];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-blue-600 mb-8 flex items-center font-medium">
          ← Înapoi la Dashboard
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 uppercase italic">Cerere Adeverință Venit</h1>
          <p className="text-slate-500 font-medium">Pasul {step} din 2</p>
        </header>

        <div className="w-full bg-slate-200 h-2 rounded-full mb-12 overflow-hidden">
          <div className="bg-blue-500 h-2 rounded-full transition-all duration-700" style={{ width:`${(step/2)*100}%` }}></div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100">

          {/* PASUL 1 — DATE SOLICITANT */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-500">
              <div className="border-b pb-5">
                <h2 className="text-xl font-bold text-blue-600 uppercase">01. Date Solicitant</h2>
                <p className="text-xs text-slate-400 mt-1">Toate câmpurile marcate cu * sunt obligatorii</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-blue-800">📎 Completare automată din CI</p>
                  <p className="text-xs text-blue-600 mt-0.5">Scanează cartea de identitate și câmpurile se vor completa automat</p>
                </div>
                <IncarcareCI
                  label="Scanează CI"
                  color="blue"
                  onDataExtracted={handleCIDataExtracted}
                  onScanSuccess={recordAIScan}
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Nume și Prenume *</label>
                <input name="nume" value={formData.nume} onChange={(e) => { trackFirstInput(); handleUpperChange('nume')(e); }}
                  className={fieldClass('nume')} placeholder="Ex: POPESCU ION" />
                <FieldError name="nume" />
              </div>

              <div className="grid grid-cols-2 gap-5 items-start">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">CNP *</label>
                  <input name="cnp" value={formData.cnp} onChange={handleCNPChange}
                    className={`${fieldClass('cnp')} font-mono`} placeholder="Ex: 1801012345678" maxLength={13} />
                  <FieldError name="cnp" />
                  <CNPBadge cnpInfo={cnpInfo} />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Serie și Nr. CI *</label>
                  <input
                    name="serie_ci"
                    value={formData.serie_ci}
                    onChange={handleCIChange('serie_ci')}
                    className={fieldClass('serie_ci')}
                    placeholder="Ex: RR 123456"
                    maxLength={9}
                  />
                  <FieldError name="serie_ci" />
                </div>
              </div>

              {/* Adresa */}
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
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                    Telefon <span className="text-slate-300 font-normal normal-case">(opțional)</span>
                  </label>
                  <input name="telefon" value={formData.telefon} onChange={handleChangeTracked}
                    className={fieldClass('telefon')} placeholder="Ex: 0721 234 567" />
                  <FieldError name="telefon" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                    Email <span className="text-slate-300 font-normal normal-case">(opțional)</span>
                  </label>
                  <input name="email" value={formData.email} onChange={handleChangeTracked}
                    className={fieldClass('email')} placeholder="Ex: ion@email.com" />
                  <FieldError name="email" />
                </div>
              </div>
            </div>
          )}

          {/* PASUL 2 — DETALII CERERE */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-500">
              <div className="border-b pb-5">
                <h2 className="text-xl font-bold text-blue-600 uppercase">02. Detalii Cerere</h2>
                <p className="text-xs text-slate-400 mt-1">Pentru ce an și în ce scop solicitați adeverința</p>
              </div>

              {/* Rezumat */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs">
                <p className="font-black uppercase text-slate-400 mb-2">Rezumat solicitant</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <p><span className="text-slate-400">Nume:</span> <span className="font-bold ml-1">{formData.nume||'—'}</span></p>
                  <p><span className="text-slate-400">CNP:</span> <span className="font-mono ml-1">{formData.cnp||'—'}</span></p>
                  <p className="col-span-2"><span className="text-slate-400">Adresă:</span> <span className="ml-1">{adresaCompleta||'—'}</span></p>
                </div>
              </div>

              {/* An venit */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Anul pentru care se solicită adeverința *</label>
                <select name="an_venit" value={formData.an_venit} onChange={handleChangeTracked} className={sharedFieldClasses}>
                  {ANI.map(an => <option key={an} value={an}>{an}</option>)}
                </select>
              </div>

              {/* Scop */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-3 ml-1">Scopul cererii *</label>
                <div className="space-y-2">
                  {SCOPURI.map(s => (
                    <div key={s} onClick={() => { setFormData(prev=>({...prev, scop: s})); setErrors(prev=>({...prev, scop:null})); }}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${formData.scop===s ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all ${formData.scop===s ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}></div>
                      <span className="text-sm font-medium text-slate-700 capitalize">{s}</span>
                    </div>
                  ))}
                </div>
                <FieldError name="scop" />

                {formData.scop === 'altul' && (
                  <div className="mt-3">
                    <input name="scop_altul" value={formData.scop_altul} onChange={handleChangeTracked}
                      className={fieldClass('scop_altul')} placeholder="Precizați scopul..." />
                    <FieldError name="scop_altul" />
                  </div>
                )}
              </div>

              {/* Directie ANAF */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                  Direcția ANAF competentă <span className="text-slate-300 font-normal normal-case">(opțional)</span>
                  </label>
                <input name="directie_anaf" value={formData.directie_anaf} onChange={handleChangeTracked}
                  className={sharedFieldClasses} placeholder="Ex: DGRFP Timișoara — Administrația Județeană Timiș" />
                <p className="mt-1.5 ml-1 text-xs text-slate-400">Lăsați gol pentru completare automată pe baza județului</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <LocalitateAutocomplete
                    value={formData.localitate}
                    onChange={(val) => {
                      setFormData(prev => ({ ...prev, localitate: val }));
                      if (errors.localitate) setErrors(prev => ({ ...prev, localitate: null }));
                    }}
                    error={errors.localitate}
                    label="Județul"
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

              {/* Info GDPR */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-800">
                <p className="font-bold mb-1">ℹ️ Ce urmează după descărcare:</p>
                <ul className="space-y-1">
                  <li>• Depuneți cererea la sediul ANAF competent sau prin SPV (Spațiu Privat Virtual)</li>
                  <li>• Adeverința (F232) se eliberează de regulă în 5–10 zile lucrătoare</li>
                  <li>• Dacă aveți cont SPV, puteți depune și primi răspuns online</li>
                </ul>
              </div>
            </div>
          )}

          <div className="mt-10 flex justify-between items-center border-t pt-8">
            {step > 1 && (
              <button onClick={() => setStep(step-1)} className="font-bold text-slate-400 hover:text-slate-800">
                ← Înapoi
              </button>
            )}
            <button onClick={handleNext} className={`ml-auto px-10 py-4 text-white rounded-2xl font-black transition-all ${step===2 ? 'bg-blue-600 shadow-lg shadow-blue-100 hover:bg-blue-700' : 'bg-slate-900 hover:bg-blue-600 shadow-xl'}`}>
              {step===2 ? '📄 Descarcă Cerere PDF' : 'Pasul următor →'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AdeverintaForm;
