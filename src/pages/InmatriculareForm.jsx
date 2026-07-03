import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { validateData, validateNumePrenume, validateCNP, validateSerieCI, validateAdresa, validateNrInmatriculare, validateVIN, decodeCNP , validateEmail, validateTelefon } from '../utils/validators';
import { useFormHandlers } from '../utils/useFormHandlers';
import { useFormPersist } from '../utils/Userformpersist';
import LocalitateAutocomplete from '../components/LocalitateAutocomplete';
import IncarcareCI from '../components/incarcare/IncarcareCI';
import IncarcareTalon from '../components/incarcare/IncarcareTalon';
import TaraAutocomplete from '../components/TaraAutocomplete';
import { useSessionMetrics } from '../utils/useSessionMetrics';
import '../fonts/Roboto-normal';
import '../fonts/Roboto-bold';

const sharedFieldClasses = "w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium placeholder:text-slate-400 font-sans";
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

const VINBadge = ({ vinInfo, marca }) => {
  if (!vinInfo) return null;
  if (!vinInfo.valid) return (
    <div className="mt-2 p-3 rounded-xl text-xs font-medium bg-red-50 border border-red-200 text-red-700">❌ {vinInfo.msg}</div>
  );
  if (!vinInfo.producer) return (
    <div className="mt-2 p-3 rounded-xl text-xs font-medium bg-green-50 border border-green-200 text-green-700">✓ Format VIN valid</div>
  );
  const marcaLow = (marca||'').trim().toLowerCase();
  const prodLow = vinInfo.producer.toLowerCase();
  const match = !marcaLow || prodLow.includes(marcaLow) || marcaLow.includes(prodLow);
  return (
    <div className={`mt-2 p-3 rounded-xl text-xs font-medium ${match ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
      {match ? <>✓ VIN valid — Producator: <strong>{vinInfo.producer}</strong></> : <>⚠️ VIN indica <strong>{vinInfo.producer}</strong>, dar ati introdus <strong>{marca}</strong>. Verificati CIV-ul.</>}
    </div>
  );
};

function InmatriculareForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [cnpInfo, setCnpInfo] = useState(null);
  const [vinInfo, setVinInfo] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData, clearPersist] = useFormPersist('inmatriculare_form', {
    // Tip operatiune
    tip_op: '',
    // Date proprietar
    nume: '', cnp: '', serie_ci: '',
    adresa: '',
    telefon: '', email: '',
    // Date vehicul
    marca: '', tip: '', vin: '', serie_motor: '',
    cilindree: '', putere_kw: '', an_fabricatie: '',
    nr_inmatriculare_vechi: '', culoare: '', masa: '',
    tip_combustibil: '',
    // Origine vehicul
    origine: '',
    tara_import: '',
    // Meta
    judet_drpciv: '', data: new Date().toLocaleDateString('ro-RO'),
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_,i) => currentYear - i);


  const { startSession, saveProgress, trackFirstInput, recordValidationError, recordAIScan, completeSession } = useSessionMetrics('InmatriculareVehicul');

  const {
  handleChange,
  handleCNPChange,
  handleCIChange,
  handleCIDataExtracted,
  handleUpperChange,
  handleNumericChange,
  handleNrInmatriculareChange,
  handleVINChange,
  handleTalonDataExtracted,
  handleDateChange,
} = useFormHandlers(setFormData, setErrors, formData, { setCnpInfo, setVinInfo });

  // Wrapper care inregistreaza primul input al utilizatorului
  const handleChangeTracked = (e) => { trackFirstInput(); handleChange(e); };
  const validateStep = (s) => {
    const newErrors = {};
    if (s === 1) {
      if (!formData.tip_op) newErrors.tip_op = 'Selectati tipul operatiunii';
    }
    if (s === 2) {
      const numeErr = validateNumePrenume(formData.nume);
if (numeErr) newErrors.nume = numeErr;

      const cnpErr = validateCNP(formData.cnp);
      if (cnpErr) newErrors.cnp = cnpErr;

      const ciErr = validateSerieCI(formData.serie_ci);
      if (ciErr) newErrors.serie_ci = ciErr;

      const adrErr = validateAdresa(formData.adresa);
      if (adrErr) newErrors.adresa = adrErr;
    }
    if (s === 3) {
      if (!formData.marca.trim()) newErrors.marca = 'Obligatoriu';
      if (!formData.tip.trim()) newErrors.tip = 'Obligatoriu';
      if (!formData.vin.trim()) newErrors.vin = 'Obligatoriu';
      else if (formData.vin.length !== 17) newErrors.vin = 'VIN-ul trebuie sa aiba 17 caractere';
      if (!formData.an_fabricatie) newErrors.an_fabricatie = 'Obligatoriu';
      if (formData.nr_inmatriculare_vechi) {
  const err = validateNrInmatriculare(formData.nr_inmatriculare_vechi);
  if (err) newErrors.nr_inmatriculare_vechi = err;
}
      if (!formData.origine) newErrors.origine = 'Selectati originea vehiculului';
      if (!formData.judet_drpciv.trim()) newErrors.judet_drpciv = 'Obligatoriu';
      const dataErr = validateData(formData.data, { allowPast: false });
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
      if (step < 3) { saveProgress(); setStep(step + 1); }
      else generatePDF();
    }
  };

  const FieldError = ({ name }) => errors[name]
    ? <p className="mt-1 ml-1 text-xs text-red-500 font-medium">⚠ {errors[name]}</p>
    : null;

  const fieldClass = (name) => errors[name] ? errorFieldClasses : sharedFieldClasses;

  const adresaCompleta = formData.adresa || '';

  const TIP_OP_OPTIONS = [
    { v:'inmatriculare', l:'Înmatriculare', desc:'Prima înmatriculare în România', icon:'🆕' },
    { v:'transcriere', l:'Transcriere', desc:'Schimbare proprietar (vehicul deja înmatriculat)', icon:'🔄' },
    { v:'nou_certificat', l:'Certificat Nou', desc:'Modificare date în certificat', icon:'📝' },
    { v:'autorizatie_provizorie', l:'Autorizație provizorie', desc:'Circulație temporară fără plăcuțe', icon:'⏳' },
  ];

  const generatePDF = () => {
    const doc = new jsPDF({ unit:'mm', format:'a4' });
    doc.setFont('Roboto', 'normal');
    const pageW = doc.internal.pageSize.getWidth();
    const L = 18, R = 192, W = R - L;
    let y = 15;

    const ln = (x1,y1,x2,y2,w=0.3) => { doc.setDrawColor(0); doc.setLineWidth(w); doc.line(x1,y1,x2,y2); };
    const t = (text,x,yy,align='left') => doc.text((String(text||'')),x,yy,{align});
    const wrap = (text,maxW,sz,lh) => { doc.setFontSize(sz); const lines=doc.splitTextToSize((text),maxW); return {lines,h:lines.length*lh}; };
    const dots = (n) => '.'.repeat(n);
    const box = (checked) => checked ? '[X]' : '[ ]';

    // ANTET
    doc.setFont('Roboto','bold'); doc.setFontSize(8);
    t('MINISTERUL AFACERILOR INTERNE', pageW/2, y, 'center'); y+=4;
    t(`Serviciul Public Comunitar Regim Permise și Înmatriculare Vehicule ${(formData.judet_drpciv).toUpperCase()}`, pageW/2, y, 'center'); y+=8;

    ln(L,y,R,y,0.5); y+=5;

    // TITLU
    doc.setFontSize(12);
    t('CEREREA SOLICITANTULUI', pageW/2, y, 'center'); y+=7;
    ln(L,y,R,y); y+=5;

    // TIP OPERATIUNE
    doc.setFont('Roboto','bold'); doc.setFontSize(9);
    t('Tip operațiune:', L, y); y+=5;
    doc.setFont('Roboto','normal'); doc.setFontSize(9);
    // Tip operatiune - 2 randuri, 2 optiuni per rand
    doc.setFontSize(8);
    t(`${box(formData.tip_op==='inmatriculare')} Înmatriculare`, L, y);
    t(`${box(formData.tip_op==='transcriere')} Transcriere`, L+55, y);
    t(`${box(formData.tip_op==='nou_certificat')} Eliberare certificat nou`, L+110, y);
    y += 5;
    t(`${box(formData.tip_op==='autorizatie_provizorie')} Autorizație provizorie de circulație`, L, y);
    y += 7;
    ln(L,y,R,y); y+=5;

    // DATE PROPRIETAR
    doc.setFont('Roboto','bold'); doc.setFontSize(9);
    t('1. DATE PROPRIETAR / SOLICITANT', L, y); y+=5;
    doc.setFont('Roboto','normal'); doc.setFontSize(9);

    // Tabel date proprietar
    doc.setFillColor(248,248,248);
    doc.rect(L, y-2, W, 36, 'F');
    doc.setDrawColor(200,200,200); doc.setLineWidth(0.2); doc.rect(L, y-2, W, 36);

    const ciRaw = formData.serie_ci || '';
    const ciMatch = ciRaw.replace(/\s/g,'').match(/^([A-Z]{2})(\d+)$/i);
    const serieCI = ciMatch ? ciMatch[1] : ciRaw.split(' ')[0] || '';
    const nrCI    = ciMatch ? ciMatch[2] : ciRaw.split(' ')[1] || '';

    doc.setFont('Roboto','bold'); doc.setFontSize(8);
    t('Nume și prenume:', L+2, y+3);
    doc.setFont('Roboto','normal');
    t(formData.nume, L+38, y+3);
    doc.setFont('Roboto','bold');
    t('CNP:', L+110, y+3);
    doc.setFont('Roboto','normal');
    t(formData.cnp, L+120, y+3);
    y+=8;

    doc.setFont('Roboto','bold');
    t('Act de identitate:', L+2, y+3);
    doc.setFont('Roboto','normal');
    t(`seria ${serieCI} nr. ${nrCI}`, L+30, y+3);
    y+=8;

    doc.setFont('Roboto','bold');
    t('Domiciliu:', L+2, y+3);
    doc.setFont('Roboto','normal');
    const {lines:adrL} = wrap(adresaCompleta, W-35, 8, 4);
    doc.text(adrL, L+22, y+3);
    y+=8;

    doc.setFont('Roboto','bold');
    t('Tel:', L+2, y+3);
    doc.setFont('Roboto','normal');
    t(formData.telefon||dots(15), L+10, y+3);
    doc.setFont('Roboto','bold');
    t('Email:', L+70, y+3);
    doc.setFont('Roboto','normal');
    t(formData.email||dots(25), L+82, y+3);
    y+=10;

    ln(L,y,R,y); y+=5;

    // DATE VEHICUL
    doc.setFont('Roboto','bold'); doc.setFontSize(9);
    t('2. DATE VEHICUL', L, y); y+=5;
    doc.setFont('Roboto','normal');

    // Filtreaza categoria vehiculului din marca (ex: "AUTOTURISM M1 DACIA" -> "DACIA")
    const categorii = ['AUTOTURISM','MOTOCICLETA','MOTOTRICICLU','AUTOBUZ','AUTOCAR','AUTOCAMION','AUTOTRACTOR','REMORCA','SEMIREMORCA','TRACTIUNE'];
    let marcaClean = formData.marca || '';
    categorii.forEach(cat => { marcaClean = marcaClean.replace(new RegExp(cat + '\\s*(M\\d+)?\\s*', 'i'), '').trim(); });

    // Coloane fixe pentru tabel vehicul
    const c1 = L+2, v1 = L+22;   // col stanga
    const c2 = L+72, v2 = L+95;  // col mijloc
    const c3 = L+140, v3 = L+155; // col dreapta

    // rect desenat PRIMUL — 3 randuri x 7 + padding = 25mm
    doc.setFillColor(248,248,248);
    doc.setDrawColor(200,200,200); doc.setLineWidth(0.2);
    // înălțime dinamică: 3 rânduri de bază + rânduri opționale
    const extraRows =
      (formData.nr_inmatriculare_vechi ? 1 : 0) +
      (formData.origine === 'import' ? 1 : 0);

    const boxH = 25 + extraRows * 7;

    // rect desenat PRIMUL
    doc.setFillColor(248,248,248);
    doc.setDrawColor(200,200,200);
    doc.setLineWidth(0.2);
    doc.rect(L, y - 2, W, boxH, 'FD');

    // Coloane stramtate
    const lc1 = L+2,  lv1 = L+18;   // col1
    const lc2 = L+58, lv2 = L+75;   // col2
    const lc3 = L+118, lv3 = L+132; // col3

    doc.setFontSize(8);

    // Rând 1: Marca | Model | An fabricatie
    doc.setFont('Roboto','bold'); t('Marca:', lc1, y+3);
    doc.setFont('Roboto','normal'); t(marcaClean || dots(10), lv1, y+3);
    doc.setFont('Roboto','bold'); t('Model:', lc2, y+3);
    doc.setFont('Roboto','normal'); t(formData.tip || dots(10), lv2, y+3);
    doc.setFont('Roboto','bold'); t('An fabricație:', lc3, y+3);
    doc.setFont('Roboto','normal'); t(String(formData.an_fabricatie||dots(4)), lv3+5, y+3);
    y+=7;

    // Rând 2: VIN (font mic) | Serie motor | Cilindree
    doc.setFont('Roboto','bold'); doc.setFontSize(8); t('VIN:', lc1, y+3);
    doc.setFont('Roboto','normal'); doc.setFontSize(7); t(formData.vin || dots(17), lv1, y+3);
    doc.setFontSize(8);
    doc.setFont('Roboto','bold'); t('Serie motor:', lc2, y+3);
    doc.setFont('Roboto','normal'); t(formData.serie_motor || dots(8), lv2, y+3);
    doc.setFont('Roboto','bold'); t('Cilindree:', lc3, y+3);
    doc.setFont('Roboto','normal'); t(formData.cilindree ? formData.cilindree+' cmc' : dots(6), lv3+2, y+3);
    y+=7;

    // Rând 3: Putere | Combustibil | Culoare
    doc.setFont('Roboto','bold'); t('Putere:', lc1, y+3);
    doc.setFont('Roboto','normal'); t(formData.putere_kw ? formData.putere_kw+' kW' : dots(6), lv1, y+3);
    doc.setFont('Roboto','bold'); t('Combustibil:', lc2, y+3);
    doc.setFont('Roboto','normal'); t(formData.tip_combustibil || dots(10), lv2, y+3);
    doc.setFont('Roboto','bold'); t('Culoare:', lc3, y+3);
    doc.setFont('Roboto','normal'); t(formData.culoare || dots(8), lv3+2, y+3);
    y+=7;

    if (formData.nr_inmatriculare_vechi) {
      doc.setFont('Roboto','bold');
      t('Nr. inmatriculare anterior:', L+2, y+3); doc.setFont('Roboto','normal');
      t(formData.nr_inmatriculare_vechi, L+50, y+3);
      y+=7;
    }

    if (formData.origine === 'import') {
      doc.setFont('Roboto','bold');
      t('Țara de proveniență:', L+2, y+3); doc.setFont('Roboto','normal');
      t(formData.tara_import||dots(15), L+35, y+3);
      y+=7;
    }

    y += 5;
    ln(L,y,R,y); y+=5;

    // DOCUMENTE DEPUSE
    doc.setFont('Roboto','bold'); doc.setFontSize(9);
    t('3. DOCUMENTE ANEXATE', L, y); y+=5;
    doc.setFont('Roboto','normal'); doc.setFontSize(8.5);
    const docs = [
      'Carte de identitate / pașaport — original și copie',
      'Cartea de identitate a vehiculului (CIV) — original și copie',
      formData.tip_op === 'inmatriculare' || formData.tip_op === 'transcriere'
        ? 'Contract de vânzare-cumpărare / factură — original și copie'
        : 'Documentul care atestă dreptul de proprietate',
      'Dovada ITP valabil',
      'Polița RCA valabilă — copie',
      'Dovada plății taxei de înmatriculare',
      'Dovada plății contravalorii certificatului de înmatriculare',
      formData.origine === 'import'
        ? 'Documente de înmatriculare străine — original + traducere legalizată'
        : null,
      formData.origine === 'import'
        ? 'Certificat de autenticitate RAR'
        : null,
    ].filter(Boolean);

    docs.forEach(d => {
      const {lines: dLines, h: dH} = wrap('• ' + d, W-5, 8.5, 4.2);
      doc.text(dLines, L+3, y); y += dH + 0.5;
    });
    y+=3;

    ln(L,y,R,y); y+=5;

    // DECLARATIE GDPR
    doc.setFontSize(7.5);
    const gdpr = 'Am luat cunoștință de conținutul Notei de informare. În conformitate cu Regulamentul (UE) 2016/679 (GDPR), beneficiez de drepturile privind protecția datelor cu caracter personal, inclusiv dreptul la informare, acces, rectificare, ștergere și dreptul de a depune o plângere la ANSPDCP.';
    const {lines:gdprL, h:gdprH} = wrap(gdpr, W, 7.5, 3.8);
    doc.text(gdprL, L, y); y+=gdprH+5;

    // DATA + SEMNATURA
    doc.setFontSize(9);
    t(`Data: ${formData.data}`, L, y);
    t('Semnatura:', R-55, y); y+=12;
    ln(R-50, y, R, y, 0.3); y+=6;

    // BORDER
    doc.setDrawColor(0); doc.setLineWidth(0.5);
    doc.rect(L-3, 10, R-L+6, y+3);

    doc.save('Cerere-Inmatriculare-Vehicul.pdf');
    completeSession();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-orange-600 mb-8 flex items-center font-medium">
          ← Înapoi la Dashboard
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 uppercase italic">
            {formData.tip_op === 'transcriere' ? 'Cerere Transcriere Vehicul' :
             formData.tip_op === 'nou_certificat' ? 'Cerere Certificat Nou' :
             formData.tip_op === 'autorizatie_provizorie' ? 'Autorizație Provizorie' :
             'Cerere Înmatriculare'}
          </h1>
          <p className="text-slate-500 font-medium">Pasul {step} din 3</p>
        </header>

        <div className="w-full bg-slate-200 h-2 rounded-full mb-12 overflow-hidden">
          <div className="bg-orange-500 h-2 rounded-full transition-all duration-700" style={{ width:`${(step/3)*100}%` }}></div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100">

          {/* PASUL 1 — TIP OPERATIUNE */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-500">
              <div className="border-b pb-5">
                <h2 className="text-xl font-bold text-orange-600 uppercase">01. Tip Operațiune</h2>
                <p className="text-xs text-slate-400 mt-1">Ce dorești să faci cu vehiculul?</p>
              </div>

              <div className="space-y-3">
                {TIP_OP_OPTIONS.map(opt => (
                  <div key={opt.v}
                    onClick={() => { setFormData(prev=>({...prev,tip_op:opt.v})); setErrors(prev=>({...prev,tip_op:null})); }}
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.tip_op===opt.v ? 'bg-orange-50 border-orange-400' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                    <span className="text-3xl">{opt.icon}</span>
                    <div className="flex-1">
                      <p className={`font-bold text-sm ${formData.tip_op===opt.v ? 'text-orange-700' : 'text-slate-700'}`}>{opt.l}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 shrink-0 transition-all ${formData.tip_op===opt.v ? 'bg-orange-500 border-orange-500' : 'border-slate-300'}`}></div>
                  </div>
                ))}
              </div>
              <FieldError name="tip_op" />

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
                <p className="font-bold mb-1">⏱ Termen legal:</p>
                <p>Dosarul de înmatriculare trebuie depus la DRPCIV în <strong>maxim 30 de zile</strong> de la data cumpărării vehiculului.</p>
              </div>
            </div>
          )}

          {/* PASUL 2 — DATE PROPRIETAR */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-500">
              <div className="border-b pb-5">
                <h2 className="text-xl font-bold text-orange-600 uppercase">02. Date Proprietar</h2>
                <p className="text-xs text-slate-400 mt-1">Datele noului proprietar al vehiculului</p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-orange-800">📎 Completare automată din CI</p>
                  <p className="text-xs text-orange-600 mt-0.5">Scanează cartea de identitate și câmpurile se vor completa automat</p>
                </div>
                <IncarcareCI label="Scanează CI" color="orange" onDataExtracted={handleCIDataExtracted}
                  onScanSuccess={recordAIScan} />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Nume și Prenume *</label>
                <input name="nume" value={formData.nume} onChange={handleUpperChange('nume')}
                  className={fieldClass('nume')} placeholder="Ex: POPESCU ION" />
                <FieldError name="nume" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">CNP *</label>
                  <input name="cnp" value={formData.cnp} onChange={handleCNPChange}
                    className={`${fieldClass('cnp')} font-mono`} placeholder="Ex: 1801012345678" maxLength={13} />
                  <FieldError name="cnp" />
                  <CNPBadge cnpInfo={cnpInfo} />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Serie și Nr. CI *</label>
                  <input name="serie_ci" value={formData.serie_ci} onChange={handleCIChange('serie_ci')} maxLength={9}
                    className={fieldClass('serie_ci')} placeholder="Ex: RR 123456" />
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

          {/* PASUL 3 — DATE VEHICUL */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-500">
              <div className="border-b pb-5">
                <h2 className="text-xl font-bold text-slate-800 uppercase">03. Date Vehicul</h2>
                <p className="text-xs text-slate-400 mt-1">Din cartea de identitate a vehiculului (CIV)</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs">
                <p className="font-black uppercase text-slate-400 mb-2">Rezumat</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <p><span className="text-slate-400">Proprietar:</span> <span className="font-bold ml-1">{formData.nume||'—'}</span></p>
                  <p><span className="text-slate-400">Operațiune:</span> <span className="font-bold ml-1 capitalize">{formData.tip_op||'—'}</span></p>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-orange-800">📋 Completare automată din Talon (CIV)</p>
                  <p className="text-xs text-orange-600 mt-0.5">Scanează talonul vehiculului și câmpurile se vor completa automat</p>
                </div>
                <IncarcareTalon label="Scanează Talon" color="orange" onDataExtracted={handleTalonDataExtracted}
                  onScanSuccess={recordAIScan} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Marca *</label>
                  <input name="marca" value={formData.marca} onChange={handleUpperChange("marca")}
                    className={fieldClass('marca')} placeholder="Ex: DACIA" />
                  <FieldError name="marca" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Model *</label>
                  <input name="tip" value={formData.tip} onChange={handleUpperChange("tip")}
                    className={fieldClass('tip')} placeholder="Ex: LOGAN" />
                  <FieldError name="tip" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                  Serie Șasiu (VIN) * <span className="font-normal normal-case text-slate-400">— 17 caractere, fără I, O, Q</span>
                </label>
                <input name="vin" value={formData.vin} onChange={handleVINChange('vin')}
                  onBlur={() => {
                    const err = validateVIN(formData.vin);
                    setErrors(prev => ({ ...prev, vin: err || null }));
                  }}
                  className={`${fieldClass('vin')} font-mono`} placeholder="Ex: UU1ABCD123456789" maxLength={17} />
                <FieldError name="vin" />
                <VINBadge vinInfo={vinInfo} marca={formData.marca} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                    Serie Motor <span className="text-slate-300 font-normal normal-case">(opțional)</span>
                  </label>
                  <input name="serie_motor" value={formData.serie_motor} onChange={handleUpperChange("serie_motor")}
                    className={sharedFieldClasses} placeholder="Ex: K9K732" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                    Cilindree (cmc) <span className="text-slate-300 font-normal normal-case">(opțional)</span>
                  </label>
                  <input name="cilindree" value={formData.cilindree} onChange={handleNumericChange("cilindree")} inputMode="numeric"
                    className={sharedFieldClasses} placeholder="Ex: 1598" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                    Putere (kW) <span className="text-slate-300 font-normal normal-case">(opțional)</span>
                  </label>
                  <input name="putere_kw" value={formData.putere_kw} onChange={handleNumericChange("putere_kw")} inputMode="numeric"
                    className={sharedFieldClasses} placeholder="Ex: 66" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">An Fabricație *</label>
                  <select name="an_fabricatie" value={formData.an_fabricatie} onChange={handleChangeTracked}
                    className={fieldClass('an_fabricatie')}>
                    <option value="">Selectați...</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <FieldError name="an_fabricatie" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                    Combustibil <span className="text-slate-300 font-normal normal-case">(opțional)</span>
                  </label>
                  <select name="tip_combustibil" value={formData.tip_combustibil} onChange={handleChangeTracked}
                    className={sharedFieldClasses}>
                    <option value="">Selectați...</option>
                    <option value="Benzina">Benzină</option>
                    <option value="Motorina">Motorină</option>
                    <option value="Electric">Electric</option>
                    <option value="Hibrid">Hibrid</option>
                    <option value="GPL">GPL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                    Culoare <span className="text-slate-300 font-normal normal-case">(opțional)</span>
                  </label>
                  <input name="culoare" value={formData.culoare} onChange={handleUpperChange("culoare")}
                    className={sharedFieldClasses} placeholder="Ex: ALB" />
                </div>
              </div>

              {(formData.tip_op === 'transcriere' || formData.tip_op === 'nou_certificat') && (
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                    Nr. înmatriculare anterior <span className="text-slate-300 font-normal normal-case">(opțional)</span>
                  </label>
                  <input name="nr_inmatriculare_vechi" value={formData.nr_inmatriculare_vechi} onChange={handleNrInmatriculareChange('nr_inmatriculare_vechi')}
                    className={`${fieldClass('nr_inmatriculare_vechi')} font-mono`} placeholder="Ex: TM 01 ABC" maxLength={10} />
                <FieldError name="nr_inmatriculare_vechi" />
                </div>
              )}

              {/* Origine vehicul */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-3 ml-1">Originea vehiculului *</label>
                <div className="flex gap-3">
                  {[{v:'romania',l:'🇷🇴 Din România'},{v:'import',l:'🌍 Import din străinătate'}].map(opt => (
                    <button key={opt.v} type="button"
                      onClick={() => { setFormData(prev=>({...prev,origine:opt.v})); setErrors(prev=>({...prev,origine:null})); }}
                      className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all border-2 ${formData.origine===opt.v ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                      {opt.l}
                    </button>
                  ))}
                </div>
                <FieldError name="origine" />
                {formData.origine === 'import' && (
                  <div className="mt-3">
                    <TaraAutocomplete
                      value={formData.tara_import}
                      onChange={(val) => setFormData(prev => ({ ...prev, tara_import: val }))}
                      label="Țara de proveniență"
                      placeholder="Ex: Germania"
                    />
                  </div>
                )}
              </div>

              <div>
                <LocalitateAutocomplete
                  value={formData.judet_drpciv}
                  onChange={(val) => {
                    setFormData(prev => ({ ...prev, judet_drpciv: val }));
                    if (errors.judet_drpciv) setErrors(prev => ({ ...prev, judet_drpciv: null }));
                  }}
                  error={errors.judet_drpciv}
                  label="Județul DRPCIV"
                  placeholder="Ex: Timiș"
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

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
                <p className="font-bold mb-2">📎 Documente necesare la ghișeu:</p>
                <ul className="space-y-1">
                  <li>• CI / Pașaport — original + copie</li>
                  <li>• CIV — original + copie</li>
                  <li>• Contract vânzare-cumpărare / factură — original + copie</li>
                  <li>• ITP valabil</li>
                  <li>• Poliță RCA — copie</li>
                  <li>• Dovada plății taxei de înmatriculare (~100 lei transcriere)</li>
                  {formData.origine === 'import' && <li>• Certificat autenticitate RAR + documente straine traduse</li>}
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
            <button onClick={handleNext} className={`ml-auto px-10 py-4 text-white rounded-2xl font-black transition-all ${step===3 ? 'bg-green-600 shadow-lg shadow-green-100 hover:bg-green-700' : 'bg-slate-900 hover:bg-orange-600 shadow-xl'}`}>
              {step===3 ? '📄 Descarcă Cerere PDF' : 'Pasul următor →'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default InmatriculareForm;
