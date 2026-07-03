import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { parseSuma, validateCAEN, validateSuma, validateData, validateNumePrenume, validateCNP, validateAdresa, decodeCNP , validateEmail, validateTelefon } from '../utils/validators';
import { useFormHandlers } from '../utils/useFormHandlers';
import { useFormPersist } from '../utils/Userformpersist';
import LocalitateAutocomplete from '../components/LocalitateAutocomplete';
import IncarcareCI from '../components/incarcare/IncarcareCI';
import { useSessionMetrics } from '../utils/useSessionMetrics';
import '../fonts/Roboto-normal';
import '../fonts/Roboto-bold';

const sharedFieldClasses = "w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium placeholder:text-slate-400 font-sans";
const errorFieldClasses = "w-full p-4 bg-red-50 border border-red-300 rounded-2xl outline-none focus:ring-2 focus:ring-red-400 transition-all font-medium placeholder:text-slate-400 font-sans";


const AN_CURENT = new Date().getFullYear();
const AN_VENIT = AN_CURENT - 1; // declaratia din 2026 e pentru 2025

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

// Calcul impozit si contributii
const calculeaza = (tip, venit_brut) => {
  const vb = parseSuma(venit_brut);

  if (!vb) return null;

  const SALARIU_MINIM = 4050;

  if (tip === 'chirii') {
    const cheltuieli = vb * 0.20;
    const venit_net = vb - cheltuieli;
    const impozit = Math.round(venit_net * 0.10);

    const prag6 = 6 * SALARIU_MINIM;
    const prag12 = 12 * SALARIU_MINIM;
    const prag24 = 24 * SALARIU_MINIM;

    let bazaCASS = 0;
    if (venit_net >= prag24) bazaCASS = prag24;
    else if (venit_net >= prag12) bazaCASS = prag12;
    else if (venit_net >= prag6) bazaCASS = prag6;

    const cass = Math.round(bazaCASS * 0.10);

    return {
      cheltuieli: Math.round(cheltuieli),
      venit_net: Math.round(venit_net),
      impozit,
      cass,
      cas: 0,
      total: impozit + cass
    };
  }

  if (tip === 'independente') {
    const venit_net = vb;
    const impozit = Math.round(venit_net * 0.10);

    const prag_cas_12 = 12 * SALARIU_MINIM;
    const prag_cas_24 = 24 * SALARIU_MINIM;

    const cas = venit_net >= prag_cas_12
      ? Math.round((venit_net >= prag_cas_24 ? prag_cas_24 : prag_cas_12) * 0.25)
      : 0;

    const prag_cass_6 = 6 * SALARIU_MINIM;
    const prag_cass_60 = 60 * SALARIU_MINIM;

    const cass = venit_net >= prag_cass_6
      ? Math.round(Math.min(venit_net, prag_cass_60) * 0.10)
      : 0;

    return {
      venit_net,
      impozit,
      cas,
      cass,
      total: impozit + cas + cass
    };
  }

  return null;
};


function D212Form() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [cnpInfo, setCnpInfo] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData, clearPersist] = useFormPersist('d212_form', {
    // Date contribuabil
    nume: '', cnp: '', adresa: '',
    telefon: '', email: '', judet_anaf: '',
    // Tip venituri
    are_chirii: false,
    are_independente: false,
    // Chirii
    ch_venit_brut: '',
    ch_imobile: [{ adresa: '' }],
    // Independente / PFA
    ind_cod_caen: '',
    ind_activitate: '',
    ind_venit_net: '',
    ind_sistem: 'real',
    // Meta
    data: new Date().toLocaleDateString('ro-RO'),
    tip_declaratie: 'normala',
  });

  const calcChirii = formData.are_chirii && formData.ch_venit_brut
    ? calculeaza('chirii', formData.ch_venit_brut)
    : null;

  const calcInd = formData.are_independente && formData.ind_venit_net
    ? calculeaza('independente', formData.ind_venit_net)
    : null;

  const totalImpozit = (calcChirii?.impozit || 0) + (calcInd?.impozit || 0);
  const totalCAS = calcInd?.cas || 0;
  const totalCASS = (calcChirii?.cass || 0) + (calcInd?.cass || 0);
  const totalDePlata = totalImpozit + totalCAS + totalCASS;

  const { startSession, saveProgress, trackFirstInput, recordValidationError, recordAIScan, completeSession } = useSessionMetrics('D212');

  const {
  handleChange,
  handleCNPChange,
  handleCIChange,
  handleCIDataExtracted,
  handleUpperChange,
  handleDateChange,
  handleNumericChange,
  handleMoneyChange,
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

      const adrErr = validateAdresa(formData.adresa);
      if (adrErr) newErrors.adresa = adrErr;
    }
    if (s === 2) {
      if (!formData.are_chirii && !formData.are_independente)
        newErrors.tip_venit = 'Selectati cel putin un tip de venit';
      if (formData.are_chirii) {
  const err = validateSuma(formData.ch_venit_brut);
  if (err) newErrors.ch_venit_brut = err;
}
      if (formData.are_chirii) {
        formData.ch_imobile.forEach((imobil, i) => {
          const adrImobilErr = validateAdresa(imobil.adresa);
          if (adrImobilErr) newErrors[`ch_imobil_${i}`] = adrImobilErr;
        });
      }
      if (formData.are_independente) {
  if (!formData.ind_activitate.trim())
    newErrors.ind_activitate = 'Descrieți activitatea';

  if (formData.ind_cod_caen.trim()) {
  const caenErr = validateCAEN(formData.ind_cod_caen);
  if (caenErr)
    newErrors.ind_cod_caen = caenErr;
}

  const venitErr = validateSuma(formData.ind_venit_net);
  if (venitErr)
    newErrors.ind_venit_net = venitErr;
}
    }
    if (s === 3) {
      if (!formData.judet_anaf.trim()) newErrors.judet_anaf = 'Obligatoriu';
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

  const generatePDF = () => {
    const doc = new jsPDF({ unit:'mm', format:'a4' });
    doc.setFont('Roboto', 'normal');
    const pageW = doc.internal.pageSize.getWidth();
    const L = 15, R = 195, W = R - L;
    let y = 12;

    const ln = (x1,y1,x2,y2,w=0.3) => { doc.setDrawColor(0); doc.setLineWidth(w); doc.line(x1,y1,x2,y2); };
    const t = (text,x,yy,align='left') => doc.text((String(text||'')),x,yy,{align});
    const wrap = (text,maxW,sz,lh) => { doc.setFontSize(sz); const lines=doc.splitTextToSize((text),maxW); return {lines,h:lines.length*lh}; };
    const dots = (n) => '.'.repeat(n);

    // ANTET
    doc.setFont('Roboto','bold'); doc.setFontSize(8);
    t('MINISTERUL FINANȚELOR — AGENȚIA NAȚIONALĂ DE ADMINISTRARE FISCALĂ', pageW/2, y, 'center'); y+=4;
    t(`Administrația Fiscală ${(formData.judet_anaf)}`, pageW/2, y, 'center'); y+=6;
    ln(L,y,R,y,0.5); y+=5;

    doc.setFontSize(12);
    t('DECLARAȚIE UNICĂ', pageW/2, y, 'center'); y+=5;
    doc.setFontSize(9);
    t(`privind impozitul pe venit si contribuțiile sociale datorate de persoanele fizice`, pageW/2, y, 'center'); y+=4;
    t(`Formularul 212 — Venituri realizate în anul ${AN_VENIT}`, pageW/2, y, 'center'); y+=5;

    // Tip declaratie
    doc.setFontSize(8);
    const tipLabel = formData.tip_declaratie === 'rectificativa' ? '[ ] Declarație normală   [X] Declarație rectificativă' : '[X] Declarație normală   [ ] Declarație rectificativă';
    t(tipLabel, L, y); y+=6;
    ln(L,y,R,y); y+=5;

    // CAP I — DATE CONTRIBUABIL
    doc.setFont('Roboto','bold'); doc.setFontSize(9);
    t('CAPITOLUL I. DATE DE IDENTIFICARE A CONTRIBUABILULUI', L, y); y+=5;
    doc.setFont('Roboto','normal'); doc.setFontSize(8.5);

    doc.setFillColor(248,248,248);
    doc.rect(L, y-2, W, 28, 'F');
    doc.setDrawColor(200,200,200); doc.setLineWidth(0.2); doc.rect(L, y-2, W, 28);

    doc.setFont('Roboto','bold'); doc.setFontSize(8);
    t('Nume și prenume:', L+2, y+3); doc.setFont('Roboto','normal'); t(formData.nume, L+32, y+3);
    doc.setFont('Roboto','bold'); t('CNP:', L+110, y+3); doc.setFont('Roboto','normal'); t(formData.cnp, L+118, y+3);
    y+=7;
    doc.setFont('Roboto','bold'); t('Domiciliu fiscal:', L+2, y+3); doc.setFont('Roboto','normal');
    const {lines:adrL} = wrap(adresaCompleta, W-35, 8, 4);
    doc.text(adrL, L+30, y+3); y+=7;
    doc.setFont('Roboto','bold'); t('Tel:', L+2, y+3); doc.setFont('Roboto','normal'); t(formData.telefon || dots(12), L+10, y+3);
    doc.setFont('Roboto','bold'); t('Email:', L+65, y+3); doc.setFont('Roboto','normal'); t(formData.email || dots(25), L+76, y+3);
    y+=12;
    ln(L,y,R,y); y+=5;

    // CAP II — VENITURI CHIRII
    if (formData.are_chirii && calcChirii) {
      doc.setFont('Roboto','bold'); doc.setFontSize(9);
      t('CAPITOLUL II. VENITURI DIN CEDAREA FOLOSINȚEI BUNURILOR (CHIRII)', L, y); y+=5;
      doc.setFont('Roboto','normal'); doc.setFontSize(8.5);

      const nrImobile = formData.ch_imobile ? formData.ch_imobile.filter(im => im.adresa).length : 0;
      const rectH = 32 + 11 + nrImobile * 5 + 4;
      doc.setFillColor(248,248,248);
      doc.rect(L, y-2, W, rectH, 'F');
      doc.setDrawColor(200,200,200); doc.setLineWidth(0.2); doc.rect(L, y-2, W, rectH);

      const rows = [
        ['Venit brut (chiria încasată):', formData.ch_venit_brut + ' lei'],
        ['Cheltuieli deductibile (20% cota forfetară):', calcChirii.cheltuieli + ' lei'],
        ['Venit net impozabil:', calcChirii.venit_net + ' lei'],
        ['Impozit datorat (10% x venit net):', calcChirii.impozit + ' lei'],
        ['CASS datorată (10% x 6 salarii min.):', calcChirii.cass > 0 ? calcChirii.cass + ' lei' : 'Nu se datorează'],
      ];
      rows.forEach((row, i) => {
        doc.setFont('Roboto','bold'); t(row[0], L+3, y+3+i*5.5);
        doc.setFont('Roboto','normal'); t(row[1], L+100, y+3+i*5.5);
      });
      y+=35;

      if (formData.ch_imobile && formData.ch_imobile.length > 0) {
        y+=4;
        doc.setFont('Roboto','bold'); t(`Nr. contracte chirii: ${formData.ch_imobile.length}`, L+3, y+3);
        doc.setFont('Roboto','normal'); y+=7;
        formData.ch_imobile.forEach((imobil, i) => {
          if (imobil.adresa) {
            const label = formData.ch_imobile.length > 1 ? `Imobil ${i+1}: ` : 'Imobil închiriat: ';
            t(`${label}${(imobil.adresa)}`, L+3, y); y+=5;
          }
        });
        y+=4;
      }
      ln(L,y,R,y); y+=5;
    }

    // CAP III — VENITURI INDEPENDENTE
    if (formData.are_independente && calcInd) {
      doc.setFont('Roboto','bold'); doc.setFontSize(9);
      t('CAPITOLUL III. VENITURI DIN ACTIVITĂȚI INDEPENDENTE', L, y); y+=5;
      doc.setFont('Roboto','normal'); doc.setFontSize(8.5);

      doc.setFillColor(248,248,248);
      doc.rect(L, y-2, W, 38, 'F');
      doc.setDrawColor(200,200,200); doc.setLineWidth(0.2); doc.rect(L, y-2, W, 38);

      t(`Activitate: ${(formData.ind_activitate)}${formData.ind_cod_caen ? ' (CAEN: '+formData.ind_cod_caen+')' : ''}`, L+3, y+3); y+=6;
      t(`Sistem impunere: ${formData.ind_sistem === 'real' ? 'Sistem real' : 'Norme de venit'}`, L+3, y+3);

      const rows2 = [
        ['Venit net impozabil:', formData.ind_venit_net + ' lei'],
        ['Impozit datorat (10%):', calcInd.impozit + ' lei'],
        ['CAS datorată (25%):', calcInd.cas > 0 ? calcInd.cas + ' lei' : 'Sub pragul minim'],
        ['CASS datorată (10%):', calcInd.cass + ' lei'],
      ];
      rows2.forEach((row, i) => {
        doc.setFont('Roboto','bold'); t(row[0], L+3, y+8+i*5.5);
        doc.setFont('Roboto','normal'); t(row[1], L+100, y+8+i*5.5);
      });
      y+=40;
      ln(L,y,R,y); y+=5;
    }

    // SUMAR TOTAL
    doc.setFont('Roboto','bold'); doc.setFontSize(10);
    t('SUMAR OBLIGAȚII FISCALE', L, y); y+=5;

    doc.setFillColor(30,30,30);
    doc.rect(L, y-2, W, 28, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(8.5);
    doc.setFont('Roboto','normal');
    t(`Impozit pe venit:   ${totalImpozit} lei`, L+5, y+4);
    t(`CAS:   ${totalCAS} lei`, L+80, y+4);
    t(`CASS:   ${totalCASS} lei`, L+120, y+4);
    y+=10;
    doc.setFont('Roboto','bold'); doc.setFontSize(11);
    t(`TOTAL DE PLATĂ: ${totalDePlata} lei`, pageW/2, y+4, 'center');
    doc.setTextColor(0,0,0); y+=22;

    // Termen
    doc.setFont('Roboto','normal'); doc.setFontSize(7.5);
    t(`Termen depunere: 25 mai ${AN_CURENT} (cu bonificație 3% până la 15 aprilie ${AN_CURENT})`, L, y); y+=5;
    t('Declarația se depune prin SPV (Spațiu Privat Virtual) sau la ghiseul ANAF.', L, y); y+=8;

    ln(L,y,R,y,0.3); y+=5;
    doc.setFontSize(9);
    t(`Data: ${formData.data}`, L, y);
    t('Semnatura:', R-50, y); y+=10;
    ln(R-45,y,R,y,0.3); y+=5;

    doc.setDrawColor(0); doc.setLineWidth(0.5);
    doc.rect(L-3, 8, R-L+6, y+3);

    doc.save(`D212-Declaratie-Unica-${AN_VENIT}.pdf`);
    completeSession();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-blue-600 mb-8 flex items-center font-medium">
          ← Înapoi la Dashboard
        </button>

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black text-slate-900 uppercase italic">Declarație Unică D212</h1>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">{AN_VENIT}</span>
          </div>
          <p className="text-slate-500 font-medium">Pasul {step} din 3</p>
        </header>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 mb-8">
          <p className="font-bold mb-1">⚠️ Important</p>
          <p>Acest formular este un <strong>asistent de pre-completare</strong>. Calculele sunt estimative bazate pe cotele standard. Depunerea oficială se face prin <strong>SPV (Spațiu Privat Virtual)</strong> sau la ghișeul ANAF. Consultați un contabil pentru situații complexe.</p>
        </div>

        <div className="w-full bg-slate-200 h-2 rounded-full mb-12 overflow-hidden">
          <div className="bg-blue-500 h-2 rounded-full transition-all duration-700" style={{ width:`${(step/3)*100}%` }}></div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100">

          {/* PASUL 1 — DATE CONTRIBUABIL */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-500">
              <div className="border-b pb-5">
                <h2 className="text-xl font-bold text-blue-600 uppercase">01. Date Contribuabil</h2>
                <p className="text-xs text-slate-400 mt-1">Datele dumneavoastră de identificare fiscală</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-blue-800">📎 Completare automată din CI</p>
                  <p className="text-xs text-blue-600 mt-0.5">Scanează cartea de identitate și câmpurile se vor completa automat</p>
                </div>
                <IncarcareCI label="Scanează CI" color="blue" onDataExtracted={handleCIDataExtracted}
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
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Tip declarație</label>
                  <select name="tip_declaratie" value={formData.tip_declaratie} onChange={handleChangeTracked} className={sharedFieldClasses}>
                    <option value="normala">Declarație normală</option>
                    <option value="rectificativa">Declarație rectificativă</option>
                  </select>
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

          {/* PASUL 2 — VENITURI */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="border-b pb-5">
                <h2 className="text-xl font-bold text-blue-600 uppercase">02. Venituri</h2>
                <p className="text-xs text-slate-400 mt-1">Selectați tipurile de venituri realizate</p>
              </div>

              <FieldError name="tip_venit" />

              {/* CHIRII */}
              <div className={`rounded-2xl border-2 transition-all ${formData.are_chirii ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => setFormData(prev=>({...prev, are_chirii: !prev.are_chirii}))}>
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-all ${formData.are_chirii ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
                    {formData.are_chirii && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">🏠 Venituri din chirii</p>
                    <p className="text-xs text-slate-500">Cedarea folosinței bunurilor — impozit 10% din venitul net</p>
                  </div>
                </div>

                {formData.are_chirii && (
                  <div className="px-4 pb-4 space-y-4 border-t border-blue-200 pt-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                        Venit brut total (lei) *
                      </label>

                      <input
                        name="ch_venit_brut"
                        value={formData.ch_venit_brut}
                        onChange={(e) => {
                          trackFirstInput();
                          handleMoneyChange("ch_venit_brut")(e);
                        }}
                        className={`${fieldClass('ch_venit_brut')} font-mono`}
                        placeholder="Ex: 24000"
                        inputMode="decimal"
                      />

                      <FieldError name="ch_venit_brut" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-black uppercase text-slate-400 ml-1">
                          Adrese imobile închiriate * <span className="text-blue-400 font-normal normal-case">({formData.ch_imobile.length} {formData.ch_imobile.length === 1 ? 'contract' : 'contracte'})</span>
                        </label>
                      </div>
                      {formData.ch_imobile.map((imobil, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <div className="flex-1">
                            <textarea
                              value={imobil.adresa}
                              onChange={(e) => {
                                trackFirstInput();
                                const updated = formData.ch_imobile.map((item, idx) =>
                                  idx === i ? { ...item, adresa: e.target.value.toUpperCase() } : item
                                );
                                setFormData(prev => ({ ...prev, ch_imobile: updated }));
                                if (errors[`ch_imobil_${i}`]) setErrors(prev => ({ ...prev, [`ch_imobil_${i}`]: null }));
                              }}
                              rows="2"
                              className={errors[`ch_imobil_${i}`] ? errorFieldClasses + ' resize-none' : sharedFieldClasses + ' resize-none'}
                              placeholder={`Ex: Str. Florilor nr. 3, bl. A, ap. ${i + 1}, Timisoara, Jud. Timis`}
                            />
                            {errors[`ch_imobil_${i}`] && (
                              <p className="mt-1 ml-1 text-xs text-red-500 font-medium">⚠ {errors[`ch_imobil_${i}`]}</p>
                            )}
                          </div>
                          {formData.ch_imobile.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = formData.ch_imobile.filter((_, idx) => idx !== i);
                                setFormData(prev => ({ ...prev, ch_imobile: updated }));
                              }}
                              className="mt-1 w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 transition-all font-bold text-sm shrink-0"
                              title="Șterge imobil"
                            >×</button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, ch_imobile: [...prev.ch_imobile, { adresa: '' }] }))}
                        className="w-full py-2.5 border-2 border-dashed border-blue-200 rounded-2xl text-xs font-bold text-blue-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                      >
                        + Adaugă imobil
                      </button>
                    </div>

                    {calcChirii && (
                      <div className="bg-white rounded-xl p-4 border border-blue-200">
                        <p className="text-xs font-black uppercase text-blue-600 mb-3">Calcul estimativ</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-50 rounded-lg p-2">
                            <p className="text-slate-400">Cheltuieli forfetare (20%)</p>
                            <p className="font-bold text-slate-700">{calcChirii.cheltuieli.toLocaleString()} lei</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2">
                            <p className="text-slate-400">Venit net impozabil</p>
                            <p className="font-bold text-slate-700">{calcChirii.venit_net.toLocaleString()} lei</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-2">
                            <p className="text-blue-600">Impozit (10%)</p>
                            <p className="font-bold text-blue-700">{calcChirii.impozit.toLocaleString()} lei</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-2">
                            <p className="text-blue-600">CASS</p>
                            <p className="font-bold text-blue-700">{calcChirii.cass > 0 ? calcChirii.cass.toLocaleString() + ' lei' : 'Nu se datorează'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ACTIVITATI INDEPENDENTE */}
              <div className={`rounded-2xl border-2 transition-all ${formData.are_independente ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => setFormData(prev=>({...prev, are_independente: !prev.are_independente}))}>
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-all ${formData.are_independente ? 'bg-orange-500 border-orange-500' : 'border-slate-300'}`}>
                    {formData.are_independente && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">💼 Venituri din activități independente / PFA</p>
                    <p className="text-xs text-slate-500">PFA, profesii liberale, freelancing — sistem real sau norme de venit</p>
                  </div>
                </div>

                {formData.are_independente && (
                  <div className="px-4 pb-4 space-y-4 border-t border-orange-200 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Activitatea desfășurată *</label>
                        <input name="ind_activitate" value={formData.ind_activitate} onChange={handleChangeTracked}
                          className={fieldClass('ind_activitate')} placeholder="Ex: Servicii IT, Design grafic" />
                        <FieldError name="ind_activitate" />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                          Cod CAEN
                        </label>

                        <input
                          name="ind_cod_caen"
                          value={formData.ind_cod_caen}
                          onChange={(e) => {
                            trackFirstInput();
                            handleNumericChange("ind_cod_caen")(e);
                          }}
                          className={`${fieldClass('ind_cod_caen')} font-mono`}
                          placeholder="Ex: 6201"
                          maxLength={4}
                          inputMode="numeric"
                        />

                        <FieldError name="ind_cod_caen" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Sistem de impunere</label>
                        <select name="ind_sistem" value={formData.ind_sistem} onChange={handleChangeTracked} className={sharedFieldClasses}>
                          <option value="real">Sistem real (pe baza contabilității)</option>
                          <option value="norme">Norme de venit</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                          {formData.ind_sistem === 'real' ? 'Venit net (lei) *' : 'Norma de venit (lei) *'}
                        </label>

                        <input
                          name="ind_venit_net"
                          value={formData.ind_venit_net}
                          onChange={(e) => {
                            trackFirstInput();
                            handleMoneyChange("ind_venit_net")(e);
                          }}
                          className={`${fieldClass('ind_venit_net')} font-mono`}
                          placeholder="Ex: 50000"
                          inputMode="numeric"
                        />

                        <FieldError name="ind_venit_net" />
                      </div>
                    </div>

                    {calcInd && (
                      <div className="bg-white rounded-xl p-4 border border-orange-200">
                        <p className="text-xs font-black uppercase text-orange-600 mb-3">Calcul estimativ</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-orange-50 rounded-lg p-2">
                            <p className="text-orange-600">Impozit (10%)</p>
                            <p className="font-bold text-orange-700">{calcInd.impozit.toLocaleString()} lei</p>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-2">
                            <p className="text-orange-600">CAS (25%)</p>
                            <p className="font-bold text-orange-700">{calcInd.cas > 0 ? calcInd.cas.toLocaleString() + ' lei' : 'Sub prag'}</p>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-2">
                            <p className="text-orange-600">CASS (10%)</p>
                            <p className="font-bold text-orange-700">{calcInd.cass.toLocaleString()} lei</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASUL 3 — SUMAR + DEPUNERE */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-500">
              <div className="border-b pb-5">
                <h2 className="text-xl font-bold text-blue-600 uppercase">03. Sumar și Depunere</h2>
                <p className="text-xs text-slate-400 mt-1">Verificați calculele și descărcați declarația</p>
              </div>

              {/* Sumar total */}
              <div className="bg-slate-900 rounded-2xl p-6 text-white">
                <p className="text-xs font-black uppercase text-slate-400 mb-4">Total obligații fiscale estimate — {AN_VENIT}</p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-400">Impozit venit</p>
                    <p className="text-xl font-black">{totalImpozit.toLocaleString()} lei</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">CAS</p>
                    <p className="text-xl font-black">{totalCAS.toLocaleString()} lei</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">CASS</p>
                    <p className="text-xl font-black">{totalCASS.toLocaleString()} lei</p>
                  </div>
                </div>
                <div className="border-t border-slate-700 pt-4">
                  <p className="text-xs text-slate-400">TOTAL DE PLATĂ</p>
                  <p className="text-3xl font-black text-green-400">{totalDePlata.toLocaleString()} lei</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-800">
                <p className="font-bold mb-2">📅 Termene importante {AN_CURENT}:</p>
                <ul className="space-y-1">
                  <li>• <strong>15 aprilie {AN_CURENT}</strong> — termen cu bonificație 3% (dacă depui și plătești)</li>
                  <li>• <strong>25 mai {AN_CURENT}</strong> — termen legal pentru depunere</li>
                  <li>• Depunere prin <strong>SPV</strong> (recomandat) sau la ghișeu ANAF</li>
                </ul>
              </div>

              <div>
                <LocalitateAutocomplete
                  value={formData.judet_anaf}
                  onChange={(val) => {
                    setFormData(prev => ({ ...prev, judet_anaf: val }));
                    if (errors.judet_anaf) setErrors(prev => ({ ...prev, judet_anaf: null }));
                  }}
                  error={errors.judet_anaf}
                  label="Administrația fiscală județeană"
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
                <p className="font-bold mb-1">⚠️ Atenție</p>
                <p>Calculele sunt <strong>estimative</strong>. Valorile exacte depind de deducerile personale, alte venituri și situația fiscală completă. Declarația oficială se depune prin <strong>SPV ANAF</strong> folosind formularul PDF inteligent de pe <strong>anaf.ro</strong>.</p>
              </div>
            </div>
          )}

          <div className="mt-10 flex justify-between items-center border-t pt-8">
            {step > 1 && (
              <button onClick={() => setStep(step-1)} className="font-bold text-slate-400 hover:text-slate-800">
                ← Înapoi
              </button>
            )}
            <button onClick={handleNext} className={`ml-auto px-10 py-4 text-white rounded-2xl font-black transition-all ${step===3 ? 'bg-blue-600 shadow-lg shadow-blue-100 hover:bg-blue-700' : 'bg-slate-900 hover:bg-blue-600 shadow-xl'}`}>
              {step===3 ? '📄 Descarcă D212 PDF' : 'Pasul următor →'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default D212Form;
