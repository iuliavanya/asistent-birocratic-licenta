import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { validateData, validateNumePrenume, validateCNP, validateSerieCI, validateAdresa, decodeCNP , validateEmail, validateTelefon } from '../utils/validators';
import { useFormHandlers } from '../utils/useFormHandlers';
import { useFormPersist } from '../utils/Userformpersist';
import LocalitateAutocomplete from '../components/LocalitateAutocomplete';
import IncarcareCI from '../components/incarcare/IncarcareCI';
import TaraAutocomplete from '../components/TaraAutocomplete';
import { useSessionMetrics } from '../utils/useSessionMetrics';
import '../fonts/Roboto-normal';
import '../fonts/Roboto-bold';

const sharedFieldClasses = "w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium placeholder:text-slate-400 font-sans";
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

function TranscrierForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [cnpInfo, setCnpInfo] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData, clearPersist] = useFormPersist('transcriere_form', {
    tip_act: '',
    // Date solicitant (declarant)
    nume: '', cnp: '', serie_ci: '',
    adresa: '',
    telefon: '', email: '',
    cetatenie: 'romana',
    // Date decedat (doar pentru deces)
    decedat_nume: '',
    decedat_data_nastere: '',
    decedat_data_deces: '',
    decedat_locul_deces: '',
    // Pentru casatorie
    nume_sot: '', cnp_sot: '', cetatenie_sot: '',
    // Pentru nastere (minor)
    este_minor: false,
    nume_copil: '',
    data_nastere_copil: '',
    tara_nastere_copil: '',
    // Date act strain
    tara_emitere: '',
    data_emitere: '',
    nr_act_strain: '',
    autoritate_emitenta: '',
    // Documente
    are_apostila: '',
    are_traducere: '',
    // Meta
    localitate_primarie: '',
    data: new Date().toLocaleDateString('ro-RO'),
  });

  const { startSession, saveProgress, trackFirstInput, recordValidationError, recordAIScan, completeSession } = useSessionMetrics('TranscrierAct');

  const {
    handleChange, handleCNPChange, handleCIChange, handleCIDataExtracted,
    handleDateChange, handleUpperChange,
  } = useFormHandlers(setFormData, setErrors, formData, { setCnpInfo });

  // Wrapper care inregistreaza primul input al utilizatorului
  const handleChangeTracked = (e) => { trackFirstInput(); handleChange(e); };
  const validateStep = (s) => {
    const newErrors = {};
    if (s === 1) {
      if (!formData.tip_act) newErrors.tip_act = 'Selectati tipul actului';
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

      // Validări specifice deces
    if (formData.tip_act === 'deces') {
      const decedatNumeErr = validateNumePrenume(formData.decedat_nume);
      if (decedatNumeErr) newErrors.decedat_nume = decedatNumeErr;

      if (formData.decedat_data_nastere) {
        const dataNastereDecedatErr = validateData(formData.decedat_data_nastere, {
          allowFuture: false
        });

        if (dataNastereDecedatErr) {
          newErrors.decedat_data_nastere = dataNastereDecedatErr;
        }
      }

      if (!formData.decedat_data_deces.trim()) {
        newErrors.decedat_data_deces = 'Obligatoriu';
      } else {
        const dataDecesErr = validateData(formData.decedat_data_deces, {
          allowFuture: false
        });

        if (dataDecesErr) {
          newErrors.decedat_data_deces = dataDecesErr;
        }
      }

    if (
      formData.decedat_data_nastere &&
      formData.decedat_data_deces &&
      !newErrors.decedat_data_nastere &&
      !newErrors.decedat_data_deces
    ) {
      const [zn, ln, an] = formData.decedat_data_nastere.split('.').map(Number);
      const [zd, ld, ad] = formData.decedat_data_deces.split('.').map(Number);

      const dataNastere = new Date(an, ln - 1, zn);
      const dataDeces = new Date(ad, ld - 1, zd);

      if (dataNastere > dataDeces) {
        newErrors.decedat_data_nastere =
          'Data nașterii trebuie să fie înainte sau egală cu data decesului';

        newErrors.decedat_data_deces =
          'Data decesului trebuie să fie după sau egală cu data nașterii';
      }
    }

      if (!formData.decedat_locul_deces.trim())
        newErrors.decedat_locul_deces = 'Obligatoriu';
    }

      // Validări specifice căsătorie
    if (formData.tip_act === 'casatorie') {
      const numeSotErr = validateNumePrenume(formData.nume_sot);
      if (numeSotErr) newErrors.nume_sot = numeSotErr;

      if (formData.cnp_sot) {
        const cnpSotErr = validateCNP(formData.cnp_sot);
        if (cnpSotErr) newErrors.cnp_sot = cnpSotErr;
      }

      if (!formData.cetatenie_sot.trim())
        newErrors.cetatenie_sot = 'Obligatoriu';
    }

      // Validări specifice naștere minor
    if (formData.tip_act === 'nastere' && formData.este_minor) {
      const numeCopilErr = validateNumePrenume(formData.nume_copil);
      if (numeCopilErr) newErrors.nume_copil = numeCopilErr;

      if (formData.data_nastere_copil) {
        const dataCopilErr = validateData(formData.data_nastere_copil, {
          allowFuture: false
        });

        if (dataCopilErr) {
          newErrors.data_nastere_copil = dataCopilErr;
        }
      }

      if (!formData.tara_nastere_copil.trim())
        newErrors.tara_nastere_copil = 'Obligatoriu';
    }
    }
    if (s === 3) {
      if (!formData.tara_emitere.trim()) newErrors.tara_emitere = 'Obligatoriu';
      const dataEmitereErr = validateData(formData.data_emitere, {
        allowFuture: false
      });

      if (dataEmitereErr) {
        newErrors.data_emitere = dataEmitereErr;
      }

      if (
        formData.tip_act === 'deces' &&
        formData.data_emitere &&
        formData.decedat_data_deces &&
        !newErrors.data_emitere &&
        !newErrors.decedat_data_deces
      ) {
          const [ze, le, ae] = formData.data_emitere.split('.').map(Number);
          const [zd, ld, ad] = formData.decedat_data_deces.split('.').map(Number);

          const dataEmitere = new Date(ae, le - 1, ze);
          const dataDeces = new Date(ad, ld - 1, zd);

          if (dataEmitere < dataDeces) {
            newErrors.data_emitere =
              'Data emiterii nu poate fi înainte de data decesului';
          }
      }

      if (
          formData.tip_act === 'nastere' &&
          formData.este_minor &&
          formData.data_emitere &&
          formData.data_nastere_copil &&
          !newErrors.data_emitere &&
          !newErrors.data_nastere_copil
        ) {
          const [ze, le, ae] = formData.data_emitere.split('.').map(Number);
          const [zn, ln, an] = formData.data_nastere_copil.split('.').map(Number);

          const dataEmitere = new Date(ae, le - 1, ze);
          const dataNastereCopil = new Date(an, ln - 1, zn);

          if (dataEmitere < dataNastereCopil) {
            newErrors.data_emitere =
              'Data emiterii nu poate fi înainte de data nașterii copilului';
          }
        }
      if (!formData.nr_act_strain.trim()) newErrors.nr_act_strain = 'Obligatoriu';
      if (!formData.are_apostila) newErrors.are_apostila = 'Selectati o optiune';
      if (!formData.are_traducere) newErrors.are_traducere = 'Selectati o optiune';
      if (!formData.localitate_primarie.trim()) newErrors.localitate_primarie = 'Obligatoriu';
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

  const tipActLabel = {
    nastere: 'naștere',
    casatorie: 'căsătorie',
    deces: 'deces',
  }[formData.tip_act] || '';

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

    // CATRE
    doc.setFont('Roboto','normal'); doc.setFontSize(9);
    t(`Către,`, L, y); y += 5;
    doc.setFont('Roboto','bold'); doc.setFontSize(10);
    t(`PRIMARUL MUNICIPIULUI / ORAȘULUI ${(formData.localitate_primarie).toUpperCase()}`, L + 5, y); y += 8;
    doc.setFont('Roboto','normal'); doc.setFontSize(8);
    t('Serviciul de Stare Civilă', L + 5, y); y += 8;
    ln(L, y, R, y); y += 7;

    // TITLU
    doc.setFont('Roboto','bold'); doc.setFontSize(13);
    t(`CERERE DE TRANSCRIERE`, pageW/2, y, 'center'); y += 6;
    doc.setFontSize(10);
    t(`a certificatului de ${tipActLabel} eliberat de autoritățile străine`, pageW/2, y, 'center'); y += 8;
    ln(L, y, R, y); y += 7;

    // SUBSEMNATUL — ordinea corecta: nume, CNP, domiciliu, posesor CI, tel/email
    doc.setFont('Roboto','normal'); doc.setFontSize(9);
    const ciRaw = formData.serie_ci || '';
    const ciMatch = ciRaw.replace(/\s/g,'').match(/^([A-Z]{2})(\d+)$/i);
    const serieCI = ciMatch ? ciMatch[1] : ciRaw.split(' ')[0] || '';
    const nrCI    = ciMatch ? ciMatch[2] : ciRaw.split(' ')[1] || '';
    const sub = `Subsemnatul/Subsemnata ${formData.nume}, cetățean ${formData.cetatenie}, CNP ${formData.cnp}, cu domiciliul în ${adresaCompleta}, posesor/posesoare al/a actului de identitate seria ${serieCI} nr. ${nrCI}, telefon: ${formData.telefon || dots(12)}, e-mail: ${formData.email || dots(20)},`;
    const {lines:subL, h:subH} = wrap(sub, W, 9, 4.5);
    doc.text(subL, L, y); y += subH + 3;

    // SOLICIT
    doc.setFont('Roboto','bold'); doc.setFontSize(9);
    t('vă rog să aprobați transcrierea în registrele de stare civilă române a:', L, y); y += 6;
    doc.setFont('Roboto','normal');

    // NASTERE — cadran principal date copil, apoi cadran act
    if (formData.tip_act === 'nastere' && formData.nume_copil) {
      doc.setFillColor(245,245,245);
      doc.rect(L, y-2, W, 20, 'F');
      doc.setDrawColor(200,200,200); doc.setLineWidth(0.2); doc.rect(L, y-2, W, 20);
      doc.setFontSize(8.5);
      doc.setFont('Roboto','bold'); t('Date copil:', L+3, y+3);
      doc.setFont('Roboto','normal');
      t(`Nume: ${(formData.nume_copil)}`, L+3, y+9);
      if (formData.data_nastere_copil) t(`Data nașterii: ${formData.data_nastere_copil}`, L+80, y+9);
      if (formData.tara_nastere_copil) t(`Țara nașterii: ${(formData.tara_nastere_copil)}`, L+3, y+15);
      y += 24;
    }

    // CASATORIE — cadran sot/sotie, apoi cadran act
    if (formData.tip_act === 'casatorie' && formData.nume_sot) {
      doc.setFillColor(245,245,245);
      doc.rect(L, y-2, W, 14, 'F');
      doc.setDrawColor(200,200,200); doc.setLineWidth(0.2); doc.rect(L, y-2, W, 14);
      doc.setFontSize(8.5);
      doc.setFont('Roboto','bold'); t('Celălalt soț:', L+3, y+3);
      doc.setFont('Roboto','normal');
      t(`Nume: ${(formData.nume_sot)}`, L+3, y+9);
      if (formData.cnp_sot) t(`CNP: ${formData.cnp_sot}`, L+80, y+9);
      if (formData.cetatenie_sot) t(`Cetățenie: ${(formData.cetatenie_sot)}`, L+140, y+9);
      y += 18;
    }

    // DECES — cadran date decedat, apoi cadran act
    if (formData.tip_act === 'deces' && formData.decedat_nume) {
      doc.setFillColor(245,245,245);
      doc.rect(L, y-2, W, 22, 'F');
      doc.setDrawColor(200,200,200); doc.setLineWidth(0.2); doc.rect(L, y-2, W, 22);
      doc.setFontSize(8.5);
      doc.setFont('Roboto','bold'); t('Date persoană decedată:', L+3, y+3);
      doc.setFont('Roboto','normal');
      t(`Nume: ${(formData.decedat_nume)}`, L+3, y+9);
      if (formData.decedat_data_nastere) t(`Data nașterii: ${formData.decedat_data_nastere}`, L+80, y+9);
      t(`Data decesului: ${formData.decedat_data_deces}`, L+3, y+15);
      if (formData.decedat_locul_deces) t(`Locul decesului: ${(formData.decedat_locul_deces)}`, L+80, y+15);
      y += 26;
    }

    // Cadran act strain
    doc.setFillColor(245,245,245);
    doc.rect(L, y-3, W, 28, 'F');
    doc.setDrawColor(200,200,200); doc.setLineWidth(0.2); doc.rect(L, y-3, W, 28);
    doc.setFontSize(9);
    doc.setFont('Roboto','bold');
    t(`Certificat de ${tipActLabel}`, L+3, y+2);
    doc.setFont('Roboto','normal');
    t(`Emis de autoritățile din: ${(formData.tara_emitere)}`, L+3, y+8);
    t(`Nr. act: ${formData.nr_act_strain}`, L+3, y+14);
    if (formData.data_emitere) t(`Data emiterii: ${formData.data_emitere}`, L+3, y+20);
    if (formData.autoritate_emitenta) t(`Autoritate emitentă: ${(formData.autoritate_emitenta)}`, L+90, y+8);
    y += 32;

    ln(L, y, R, y); y += 6;

    // Documente anexate
    doc.setFont('Roboto','bold'); doc.setFontSize(9);
    t('Anexez următoarele documente:', L, y); y += 5;
    doc.setFont('Roboto','normal'); doc.setFontSize(8.5);

    const docsComune = [
      `Certificat de ${tipActLabel} original eliberat de autoritățile străine`,
      formData.are_apostila === 'da' ? 'Apostila aplicată pe document' : 'Document supralegalizat conform tratatelor bilaterale',
      formData.are_traducere === 'da' ? 'Traducere legalizată în limba română' : 'Traducere în curs de legalizare',
      'Copie carte de identitate / pașaport solicitant',
    ];

    if (formData.tip_act === 'casatorie') {
      docsComune.push('Certificat de naștere al soțului/soției cetățean român — original');
      docsComune.push('Declarație notarială privind numele purtat după căsătorie (dacă nu apare în certificat)');
    }
    if (formData.tip_act === 'nastere') {
      docsComune.push('Certificatele de naștere ale părinților — original');
      docsComune.push('Certificatul de căsătorie al părinților (dacă este cazul) — original');
    }
    if (formData.tip_act === 'deces') {
      docsComune.push('Certificatul de deces original din străinătate');
      docsComune.push('Copie act de identitate al declarantului (persoana care depune cererea)');
      docsComune.push('Dovada relației de rudenie cu decedatul (dacă este cazul)');
    }

    docsComune.forEach(d => {
      const {lines, h} = wrap('• ' + d, W-5, 8.5, 4.2);
      doc.text(lines, L+3, y); y += h + 1;
    });
    y += 3;

    ln(L, y, R, y); y += 6;

    // Declaratie
    doc.setFontSize(8.5);
    const decl = 'Declar pe propria răspundere că nu am mai solicitat anterior transcrierea / înscrierea acestui act de stare civilă în registrele de stare civilă române. Sunt de acord cu prelucrarea datelor mele cu caracter personal în scopul soluționării prezentei cereri (GDPR - Reg. UE 2016/679).';
    const {lines:declL, h:declH} = wrap(decl, W, 8.5, 4.2);
    doc.text(declL, L, y); y += declH + 6;

    ln(L, y, R, y); y += 8;

    doc.setFontSize(9);
    t(`Data: ${formData.data}`, L, y);
    t('Semnatura:', R - 55, y); y += 12;
    ln(R-50, y, R, y, 0.3); y += 8;

    doc.setDrawColor(0); doc.setLineWidth(0.5);
    doc.rect(L-5, 14, R-L+10, y+2);

    doc.save(`Cerere-Transcriere-Act-${formData.tip_act || 'stare-civila'}.pdf`);
    completeSession();
  };

  const TipActButton = ({ value, label, icon }) => (
    <div onClick={() => { setFormData(prev=>({...prev, tip_act: value})); setErrors(prev=>({...prev, tip_act:null})); }}
      className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.tip_act===value ? 'bg-green-50 border-green-400' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
      <span className="text-3xl">{icon}</span>
      <div>
        <p className={`font-bold text-sm ${formData.tip_act===value ? 'text-green-700' : 'text-slate-700'}`}>{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {value === 'nastere' && 'Copil născut în străinătate'}
          {value === 'casatorie' && 'Căsătorie încheiată în străinătate'}
          {value === 'deces' && 'Deces survenit în străinătate'}
        </p>
      </div>
      <div className={`ml-auto w-5 h-5 rounded-full border-2 shrink-0 ${formData.tip_act===value ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-green-600 mb-8 flex items-center font-medium">
          ← Înapoi la Dashboard
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 uppercase italic">Cerere Transcriere Act</h1>
          <p className="text-slate-500 font-medium">Pasul {step} din 3</p>
        </header>

        <div className="w-full bg-slate-200 h-2 rounded-full mb-12 overflow-hidden">
          <div className="bg-green-500 h-2 rounded-full transition-all duration-700" style={{ width:`${(step/3)*100}%` }}></div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100">

          {/* PASUL 1 — TIP ACT */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-500">
              <div className="border-b pb-5">
                <h2 className="text-xl font-bold text-green-600 uppercase">01. Tipul Actului</h2>
                <p className="text-xs text-slate-400 mt-1">Ce certificat doriți să transcrieți în România?</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
                <p className="font-bold mb-1">ℹ️ Când se folosește această cerere:</p>
                <p>Cetățenii români care au înregistrat un act de stare civilă în <strong>străinătate</strong> sunt obligați să îl transcrie în registrele române în termen de <strong>6 luni</strong> de la înregistrare.</p>
              </div>

              <div className="space-y-3">
                <TipActButton value="nastere" label="Certificat de Naștere" icon="👶" />
                <TipActButton value="casatorie" label="Certificat de Căsătorie" icon="💍" />
                <TipActButton value="deces" label="Certificat de Deces" icon="📋" />
              </div>
              <FieldError name="tip_act" />
            </div>
          )}

          {/* PASUL 2 — DATE SOLICITANT */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-500">
              <div className="border-b pb-5">
                <h2 className="text-xl font-bold text-green-600 uppercase">02. Date Solicitant</h2>
                <p className="text-xs text-slate-400 mt-1">Datele cetățeanului român care depune cererea</p>
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
                  <input name="serie_ci" value={formData.serie_ci} onChange={handleCIChange('serie_ci')}
                    className={fieldClass('serie_ci')} placeholder="Ex: RR 123456" maxLength={9} />
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

              {/* ── BLOC SPECIAL DECES ─────────────────────────── */}
              {formData.tip_act === 'deces' && (
                <div className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    <p className="text-xs font-black uppercase text-slate-500">Date Persoană Decedată</p>
                  </div>
                  <p className="text-xs text-slate-400 -mt-2">
                    Tu ești <strong>declarantul</strong> (cel care depune cererea). Completează mai jos datele persoanei decedate.
                  </p>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Nume și Prenume Decedat *</label>
                    <input name="decedat_nume" value={formData.decedat_nume} onChange={handleUpperChange('decedat_nume')}
                      className={fieldClass('decedat_nume')} placeholder="Ex: POPESCU GHEORGHE" />
                    <FieldError name="decedat_nume" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Data Nașterii</label>
                      <input
                        name="decedat_data_nastere"
                        value={formData.decedat_data_nastere}
                        onChange={handleDateChange("decedat_data_nastere")}
                        className={fieldClass('decedat_data_nastere')}
                        placeholder="Ex: 15.03.1950"
                      />

                      <FieldError name="decedat_data_nastere" />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Data Decesului *</label>
                      <input name="decedat_data_deces" value={formData.decedat_data_deces} onChange={handleDateChange("decedat_data_deces")}
                        className={fieldClass('decedat_data_deces')} placeholder="Ex: 10.01.2024" />
                      <FieldError name="decedat_data_deces" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Locul Decesului *</label>
                    <input name="decedat_locul_deces" value={formData.decedat_locul_deces} onChange={handleUpperChange('decedat_locul_deces')}
                      className={fieldClass('decedat_locul_deces')} placeholder="Ex: Roma, Italia" />
                    <FieldError name="decedat_locul_deces" />
                  </div>
                </div>
              )}

              {/* ── BLOC SPECIAL CĂSĂTORIE ─────────────────────── */}
              {formData.tip_act === 'casatorie' && (
                <div className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-200 space-y-4">
                  <p className="text-xs font-black uppercase text-slate-500">Date Celălalt Soț *</p>
                  <p className="text-xs text-slate-400 -mt-2">Completați datele soțului/soției. Dacă este cetățean român, puteți scana CI-ul.</p>

                  <div className="bg-green-50 border border-green-200 rounded-2xl p-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-green-800">📎 Completare automată din CI soț/soție</p>
                      <p className="text-xs text-green-600 mt-0.5">Doar pentru cetățeni români</p>
                    </div>
                    <IncarcareCI
                      label="Scanează CI Soț"
                      color="green"
                      onDataExtracted={(data) => {
                        setFormData(prev => ({
                          ...prev,
                          ...(data.nume && { nume_sot: data.nume }),
                          ...(data.cnp  && { cnp_sot:  data.cnp }),
                          cetatenie_sot: 'romana',
                        }));
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Nume și Prenume soț/soție *</label>
                    <input name="nume_sot" value={formData.nume_sot} onChange={handleUpperChange('nume_sot')}
                      className={fieldClass('nume_sot')} placeholder="Ex: IONESCU MARIA" />
                    <FieldError name="nume_sot" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">CNP (dacă este cetățean român)</label>
                      <input name="cnp_sot" value={formData.cnp_sot} onChange={handleChangeTracked}
                        className={`${sharedFieldClasses} font-mono`} placeholder="Ex: 2850320354566" maxLength={13} />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Cetățenie *</label>
                      <input name="cetatenie_sot" value={formData.cetatenie_sot} onChange={(e) => { trackFirstInput(); handleUpperChange('cetatenie_sot')(e); }}
                        className={fieldClass('cetatenie_sot')} placeholder="Ex: ROMÂNĂ" />
                      <FieldError name="cetatenie_sot" />
                    </div>
                  </div>
                </div>
              )}

              {/* ── BLOC SPECIAL NAȘTERE MINOR ─────────────────── */}
              {formData.tip_act === 'nastere' && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-4">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" name="este_minor" checked={formData.este_minor} onChange={handleChangeTracked}
                      className="w-4 h-4 rounded" id="este_minor" />
                    <label htmlFor="este_minor" className="text-sm font-medium text-slate-700 cursor-pointer">
                      Cererea se face pentru un copil minor
                    </label>
                  </div>
                  {formData.este_minor && (
                    <>
                      <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Numele copilului *</label>
                        <input name="nume_copil" value={formData.nume_copil} onChange={handleUpperChange('nume_copil')}
                          className={fieldClass('nume_copil')} placeholder="Ex: POPESCU ANDREI" />
                        <FieldError name="nume_copil" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                            Data nașterii
                          </label>

                            <input
                              name="data_nastere_copil"
                              value={formData.data_nastere_copil}
                              onChange={handleDateChange("data_nastere_copil")}
                              className={fieldClass('data_nastere_copil')}
                              maxLength={10}
                              placeholder="ZZ.LL.AAAA"
                            />

                            <FieldError name="data_nastere_copil" />
                          </div>
                        <div>
                          <TaraAutocomplete
                            value={formData.tara_nastere_copil}
                            onChange={(val) => {
                              setFormData(prev => ({ ...prev, tara_nastere_copil: val }));
                              if (errors.tara_nastere_copil) setErrors(prev => ({ ...prev, tara_nastere_copil: null }));
                            }}
                            error={errors.tara_nastere_copil}
                            label="Țara nașterii *"
                            placeholder="Ex: Italia"
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PASUL 3 — DATE ACT + DOCUMENTE */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-500">
              <div className="border-b pb-5">
                <h2 className="text-xl font-bold text-green-600 uppercase">03. Detalii Act Străin</h2>
                <p className="text-xs text-slate-400 mt-1">Informații despre documentul emis în străinătate</p>
              </div>

              {/* Rezumat */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs">
                <p className="font-black uppercase text-slate-400 mb-2">Rezumat</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <p><span className="text-slate-400">Tip act:</span> <span className="font-bold ml-1 capitalize">Certificat de {formData.tip_act}</span></p>
                  <p><span className="text-slate-400">Solicitant:</span> <span className="font-bold ml-1">{formData.nume||'—'}</span></p>
                  <p className="col-span-2"><span className="text-slate-400">Adresă:</span> <span className="ml-1">{adresaCompleta||'—'}</span></p>
                  {formData.tip_act === 'deces' && formData.decedat_nume && (
                    <p className="col-span-2"><span className="text-slate-400">Decedat:</span> <span className="font-bold ml-1">{formData.decedat_nume}</span></p>
                  )}
                </div>
              </div>

              {/* Dropdown țări */}
              <div className="grid grid-cols-2 gap-4">
                <TaraAutocomplete
                  value={formData.tara_emitere}
                  onChange={(val) => {
                    setFormData(prev => ({ ...prev, tara_emitere: val }));
                    if (errors.tara_emitere) setErrors(prev => ({ ...prev, tara_emitere: null }));
                  }}
                  error={errors.tara_emitere}
                  label="Țara unde a fost emis actul"
                  required
                />
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Nr. act / certificat *</label>
                  <input name="nr_act_strain" value={formData.nr_act_strain} onChange={handleChangeTracked}
                    className={`${fieldClass('nr_act_strain')} font-mono`} placeholder="Ex: 12345/2023" />
                  <FieldError name="nr_act_strain" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                    Data emiterii <span className="text-slate-300 font-normal normal-case">(opțional)</span>
                  </label>

                  <input
                    name="data_emitere"
                    value={formData.data_emitere}
                    onChange={handleDateChange("data_emitere")}
                    className={fieldClass('data_emitere')}
                    maxLength={10}
                    placeholder="ZZ.LL.AAAA"
                  />

                  <FieldError name="data_emitere" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                    Autoritatea emitentă <span className="text-slate-300 font-normal normal-case">(opțional)</span>
                  </label>
                  <input name="autoritate_emitenta" value={formData.autoritate_emitenta} onChange={(e) => { trackFirstInput(); handleUpperChange('autoritate_emitenta')(e); }}
                    className={sharedFieldClasses} placeholder="Ex: COMUNE DI ROMA" />
                </div>
              </div>

              {/* Apostila */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Documentul are apostilă? *</label>
                <div className="flex gap-3">
                  {[{v:'da',l:'Da — are apostilă'},{v:'nu',l:'Nu — supralegalizat'},{v:'scutit',l:'Scutit (tratat bilateral)'}].map(opt => (
                    <button key={opt.v} type="button"
                      onClick={() => { setFormData(prev=>({...prev,are_apostila:opt.v})); setErrors(prev=>({...prev,are_apostila:null})); }}
                      className={`flex-1 py-3 px-2 rounded-2xl font-bold text-xs transition-all border-2 ${formData.are_apostila===opt.v ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                      {opt.l}
                    </button>
                  ))}
                </div>
                <FieldError name="are_apostila" />
              </div>

              {/* Traducere */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Există traducere legalizată în română? *</label>
                <div className="flex gap-3">
                  {[{v:'da',l:'Da'},{v:'nu',l:'Nu — în curs'}].map(opt => (
                    <button key={opt.v} type="button"
                      onClick={() => { setFormData(prev=>({...prev,are_traducere:opt.v})); setErrors(prev=>({...prev,are_traducere:null})); }}
                      className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all border-2 ${formData.are_traducere===opt.v ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                      {opt.l}
                    </button>
                  ))}
                </div>
                <FieldError name="are_traducere" />
              </div>

              {/* Dropdown județe localitate primărie */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <LocalitateAutocomplete
                    value={formData.localitate_primarie}
                    onChange={(val) => {
                      setFormData(prev => ({ ...prev, localitate_primarie: val }));
                      if (errors.localitate_primarie) setErrors(prev => ({ ...prev, localitate_primarie: null }));
                    }}
                    error={errors.localitate_primarie}
                    label="Localitatea primăriei"
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
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-800">
                <p className="font-bold mb-1">📎 Documente obligatorii la depunere:</p>
                <ul className="space-y-1">
                  <li>• Certificatul original din străinătate + apostilă/supralegalizare</li>
                  <li>• Traducere legalizată în limba română</li>
                  <li>• Copie CI / pașaport valabil</li>
                  {formData.tip_act === 'casatorie' && <li>• Certificat de naștere soț/soție cetățean român — original</li>}
                  {formData.tip_act === 'nastere' && <li>• Certificate de naștere părinți + certificat de căsătorie — original</li>}
                  {formData.tip_act === 'deces' && <li>• Dovada relației de rudenie cu decedatul</li>}
                  <li>• Termenul legal de soluționare: <strong>30 de zile</strong></li>
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
            <button onClick={handleNext} className={`ml-auto px-10 py-4 text-white rounded-2xl font-black transition-all ${step===3 ? 'bg-green-600 shadow-lg shadow-green-100 hover:bg-green-700' : 'bg-slate-900 hover:bg-green-600 shadow-xl'}`}>
              {step===3 ? '📄 Descarcă Cerere PDF' : 'Pasul următor →'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default TranscrierForm;
