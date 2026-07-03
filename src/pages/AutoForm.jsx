import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from "jspdf";
import { validateSumaLitere, validateSuma, validateData, validateCNP, validateSerieCI, validateAdresa, validateSediuSocial, validateDenumireFirma, validateCUI, validateNrRegCom, validateReprezentant, validateNumePrenume, validateNrInmatriculare, validateVIN, decodeCNP , validateEmail, validateTelefon } from '../utils/validators';
import { useFormHandlers } from '../utils/useFormHandlers';
import { useFormPersist } from '../utils/Userformpersist';
import IncarcareCI from '../components/incarcare/IncarcareCI';
import IncarcareTalon from '../components/incarcare/IncarcareTalon';
import LocalitateAutocomplete from '../components/LocalitateAutocomplete';
import { useSessionMetrics } from '../utils/useSessionMetrics';
import '../fonts/Roboto-normal';
import '../fonts/Roboto-bold';

const sharedFieldClasses = "w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium placeholder:text-slate-400 font-sans";
const errorFieldClasses = "w-full p-4 bg-red-50 border border-red-300 rounded-2xl outline-none focus:ring-2 focus:ring-red-400 transition-all font-medium placeholder:text-slate-400 font-sans";




const DOCUMENTE_ANEXA = [
  { id: 'ci_vanzator',   label: 'Copie CI / Buletin Vânzător' },
  { id: 'ci_cumparator', label: 'Copie CI / Buletin Cumpărător' },
  { id: 'civ',           label: 'Carte de Identitate a Vehiculului (CIV)' },
  { id: 'cert_inmatr',   label: 'Certificat de înmatriculare' },
  { id: 'itp',           label: 'ITP valabil' },
  { id: 'rca',           label: 'Poliță RCA valabilă' },
  { id: 'rad_fiscal',    label: 'Radiere fiscală (dacă este cazul)' },
];

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

function PersonaSection({ prefix, formData, handleChange, errors, cnpInfo, onCNPChange, onCIChange, onRepCIChange, onDataExtracted, onRegComChange }) {
  const isVanzator = prefix === 'v';
  const color = isVanzator ? 'orange' : 'blue';
  const tipPersoana = formData[`${prefix}_tip_persoana`] || 'fizica';
  const isFizica = tipPersoana === 'fizica';

  const numeField   = `${prefix}_nume`;
  const cnpField    = `${prefix}_cnp`;
  const serieField  = `${prefix}_serie_ci`;
  const adresaField = `${prefix}_adresa`;
  const telField    = `${prefix}_telefon`;
  const emailField  = `${prefix}_email`;
  const firmaField  = `${prefix}_denumire_firma`;
  const cuiField    = `${prefix}_cui`;
  const regComField = `${prefix}_nr_reg_com`;
  const repField    = `${prefix}_reprezentant`;

  const fc = (name) => errors[name] ? errorFieldClasses : sharedFieldClasses;
  const FE = ({ name }) => errors[name]
    ? <p className="mt-1 ml-1 text-xs text-red-500 font-medium">⚠ {errors[name]}</p>
    : null;

  const toggleColor = isVanzator ? 'orange' : 'blue';

  return (
    <div className="grid grid-cols-1 gap-5">

      {/* Toggle fizică/juridică */}
      <div className={`flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit`}>
        {['fizica', 'juridica'].map(tip => (
          <button key={tip} type="button"
            onClick={() => handleChange({ target: { name: `${prefix}_tip_persoana`, value: tip } })}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              tipPersoana === tip
                ? `bg-white shadow text-${toggleColor}-600`
                : 'text-slate-400 hover:text-slate-600'
            }`}>
            {tip === 'fizica' ? '👤 Persoană fizică' : '🏢 Persoană juridică'}
          </button>
        ))}
      </div>

      {/* Buton incarcare CI — doar pentru fizică */}
      {isFizica && (
        <div className="flex justify-end">
          <IncarcareCI
            label={`Încărcare CI ${isVanzator ? 'Vânzător' : 'Cumpărător'}`}
            color={color}
            onDataExtracted={onDataExtracted}
          />
        </div>
      )}

      {/* ── PERSOANĂ FIZICĂ ── */}
      {isFizica && (
        <>
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Nume și Prenume *</label>
            <input name={numeField} value={formData[numeField]} onChange={(e) => handleChange({target:{name:e.target.name, value:e.target.value.toUpperCase()}})}
              className={fc(numeField)} placeholder="Ex: POPESCU ION" />
            <FE name={numeField} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">CNP *</label>
              <input name={cnpField} value={formData[cnpField]} onChange={onCNPChange}
                className={`${fc(cnpField)} font-mono`} placeholder="Ex: 1801012345678" maxLength={13} />
              <FE name={cnpField} />
              <CNPBadge cnpInfo={cnpInfo} />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Serie și Nr. CI *</label>
              <input name={serieField} value={formData[serieField]} onChange={onCIChange}
                className={fc(serieField)} placeholder="Ex: RR 123456" maxLength={9} />
              <FE name={serieField} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Adresă Domiciliu *</label>
            <textarea name={adresaField} value={formData[adresaField]||''}
              onChange={(e) => { e.target.value = e.target.value.toUpperCase(); handleChange(e); }}
              rows="2" className={`${fc(adresaField)} resize-none`}
              placeholder="Ex: Str. Florilor nr. 5, bl. A, sc. 1, ap. 10, Timisoara, Jud. Timis" />
            <FE name={adresaField} />
          </div>
        </>
      )}

      {/* ── PERSOANĂ JURIDICĂ ── */}
      {!isFizica && (
        <>
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Denumire firmă *</label>
            <input name={firmaField} value={formData[firmaField]||''} onChange={(e) => handleChange({target:{name:e.target.name, value:e.target.value.toUpperCase()}})}
              className={fc(firmaField)} placeholder="Ex: SC EXAMPLE SRL" />
            <FE name={firmaField} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">CUI *</label>
              <input name={cuiField} value={formData[cuiField]||''} onChange={handleChange}
                className={`${fc(cuiField)} font-mono`} placeholder="Ex: RO12345678" />
              <FE name={cuiField} />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Nr. Reg. Comerțului *</label>
              <input name={regComField} value={formData[regComField]||''} onChange={onRegComChange}
                className={`${fc(regComField)} font-mono`} placeholder="Ex: J35/1234/2020" maxLength={13} />
              <FE name={regComField} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Sediu social *</label>
            <textarea name={adresaField} value={formData[adresaField]||''}
              onChange={(e) => { e.target.value = e.target.value.toUpperCase(); handleChange(e); }}
              rows="2" className={`${fc(adresaField)} resize-none`}
              placeholder="Ex: Str. Florilor nr. 5, Timisoara, Jud. Timis" />
            <FE name={adresaField} />
          </div>

          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-black uppercase text-slate-400 ml-1">Date Reprezentant Legal</label>
            <IncarcareCI
              label="Scanează CI Reprezentant"
              color={color}
              onDataExtracted={(data) => {
                handleChange({ target: { name: repField, value: data.nume || formData[repField] || '' } });
                handleChange({ target: { name: `${prefix}_rep_cnp`, value: data.cnp || formData[`${prefix}_rep_cnp`] || '' } });
                handleChange({ target: { name: `${prefix}_rep_serie_ci`, value: data.serie_ci || formData[`${prefix}_rep_serie_ci`] || '' } });
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Nume Reprezentant Legal *</label>
            <input name={repField} value={formData[repField]||''} onChange={(e) => handleChange({target:{name:e.target.name, value:e.target.value.toUpperCase()}})}
              className={fc(repField)} placeholder="Ex: POPESCU ION" />
            <FE name={repField} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                CNP Reprezentant <span className="text-slate-300 font-normal normal-case">(opțional)</span>
              </label>
              <input name={`${prefix}_rep_cnp`} value={formData[`${prefix}_rep_cnp`]||''} onChange={handleChange}
                className={`${fc(`${prefix}_rep_cnp`)} font-mono`} placeholder="Ex: 1801012345678" maxLength={13} />
                <FE name={`${prefix}_rep_cnp`} />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                Serie CI Reprezentant <span className="text-slate-300 font-normal normal-case">(opțional)</span>
              </label>
              <input
                name={`${prefix}_rep_serie_ci`}
                value={formData[`${prefix}_rep_serie_ci`] || ''}
                onChange={onRepCIChange}
                className={fc(`${prefix}_rep_serie_ci`)}
                placeholder="Ex: RR 123456"
                maxLength={9}
              />
              <FE name={`${prefix}_rep_serie_ci`} />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                Funcție <span className="text-slate-300 font-normal normal-case">(opțional)</span>
              </label>
              <input name={`${prefix}_rep_functie`} value={formData[`${prefix}_rep_functie`]||''} onChange={(e) => handleChange({target:{name:e.target.name, value:e.target.value.toUpperCase()}})}
                className={fc(`${prefix}_rep_functie`)} placeholder="Ex: ADMINISTRATOR" />
                <FE name={`${prefix}_rep_functie`} />
            </div>
          </div>
        </>
      )}

      {/* Telefon + Email — comune */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
  <div>
    <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
      Telefon <span className="text-slate-300 font-normal normal-case">(opțional)</span>
    </label>
    <input
      name={telField}
      value={formData[telField] || ''}
      onChange={handleChange}
      className={fc(telField)}
      placeholder="Ex: 0721 234 567"
    />
    <FE name={telField} />
  </div>

  <div>
    <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
      Email <span className="text-slate-300 font-normal normal-case">(opțional)</span>
    </label>
    <input
      name={emailField}
      value={formData[emailField] || ''}
      onChange={handleChange}
      className={fc(emailField)}
      placeholder="Ex: ion@email.com"
    />
    <FE name={emailField} />
  </div>
</div>
    </div>
  );
}

function AutoForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [cnpInfoV, setCnpInfoV] = useState(null);
  const [cnpInfoC, setCnpInfoC] = useState(null);
  const [vinInfo, setVinInfo] = useState(null);
  const [errors, setErrors] = useState({});
  const [docBifate, setDocBifate] = useState({});

  const [formData, setFormData, clearPersist] = useFormPersist('auto_form', {
    v_tip_persoana: 'fizica',
    v_nume:'', v_cnp:'', v_serie_ci:'', v_adresa:'',
    v_telefon:'', v_email:'',
    v_denumire_firma:'', v_cui:'', v_nr_reg_com:'', v_reprezentant:'', v_rep_cnp:'', v_rep_serie_ci:'', v_rep_functie:'',
    c_tip_persoana: 'fizica',
    c_nume:'', c_cnp:'', c_serie_ci:'', c_adresa:'',
    c_telefon:'', c_email:'',
    c_denumire_firma:'', c_cui:'', c_nr_reg_com:'', c_reprezentant:'', c_rep_cnp:'', c_rep_serie_ci:'', c_rep_functie:'',
    auto_marca:'', auto_tip:'', auto_serie_sasiu:'', auto_serie_motor:'',
    auto_cilindree:'', auto_nr_inmatriculare:'', auto_data_itp:'',
    auto_carte_identitate:'', auto_an:'', auto_pret:'', auto_pret_litere:'',
    auto_moneda:'EUR', auto_anexa:'',
    loc_incheiere:'', data_incheiere: new Date().toLocaleDateString('ro-RO')
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_,i) => currentYear - i);

  const handleCNPChange = (e, target) => {
    handleChange(e);
    const val = e.target.value;
    if (val.length === 13) {
      const info = decodeCNP(val);
      target === 'vanzator' ? setCnpInfoV(info) : setCnpInfoC(info);
    } else {
      target === 'vanzator' ? setCnpInfoV(null) : setCnpInfoC(null);
    }
  };

  // Nr. Reg. Comerțului: uppercase, fara auto-formatare
const handleRegComChange = (field) => (e) => {
  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9/]/g, '');
  setFormData(prev => ({ ...prev, [field]: val }));
  if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
};
  const handleCIExtracted = (data, prefix) => {
    setFormData(prev => ({
      ...prev,
      [`${prefix}_nume`]:     data.nume     || prev[`${prefix}_nume`],
      [`${prefix}_cnp`]:      data.cnp      || prev[`${prefix}_cnp`],
      [`${prefix}_serie_ci`]: data.serie_ci || prev[`${prefix}_serie_ci`],
      [`${prefix}_adresa`]:   data.adresa   || prev[`${prefix}_adresa`],
    }));
    if (data.cnp?.length === 13) {
      const info = decodeCNP(data.cnp);
      prefix === 'v' ? setCnpInfoV(info) : setCnpInfoC(info);
    }
  };

  // Callback pentru IncarcareTalon - completeaza datele vehiculului
  const handleTalonExtracted = (data) => {
    setFormData(prev => ({
      ...prev,
      auto_marca:           data.marca           || prev.auto_marca,
      auto_tip:             data.tip             || prev.auto_tip,
      auto_serie_sasiu:     data.vin             || prev.auto_serie_sasiu,
      auto_serie_motor:     data.serie_motor     || prev.auto_serie_motor,
      auto_cilindree:       data.cilindree       || prev.auto_cilindree,
      auto_nr_inmatriculare: data.nr_inmatriculare || prev.auto_nr_inmatriculare,
      auto_an:              data.an_fabricatie   || prev.auto_an,
      auto_carte_identitate: data.tip            || prev.auto_carte_identitate,
    }));
    if (data.vin?.length >= 3) setVinInfo(validateVIN(data.vin));
  };

  const toggleDoc = (id) => setDocBifate(prev => ({ ...prev, [id]: !prev[id] }));

  const { startSession, saveProgress, trackFirstInput, recordValidationError, recordAIScan, completeSession } = useSessionMetrics('ContractAuto');

  const {
  handleChange,
  handleUpperChange,
  handleNumericChange,
  handleLettersChange,
  handleNrInmatriculareChange,
  handleVINChange,
  handleTalonDataExtracted,
  handleCIChange,
  handleDateChange,
} = useFormHandlers(setFormData, setErrors, formData, { setCnpInfoV, setCnpInfoC, setVinInfo });

  // Wrapper care inregistreaza primul input al utilizatorului
  const handleChangeTracked = (e) => { trackFirstInput(); handleChange(e); };
  const validateStep = (s) => {
    const newErrors = {};

    const validatePersoana = (prefix, errors) => {
      const tip = formData[`${prefix}_tip_persoana`] || 'fizica';
      if (tip === 'fizica') {
        const numeF = `${prefix}_nume`, cnpF = `${prefix}_cnp`;
        const ciF = `${prefix}_serie_ci`, adresaF = `${prefix}_adresa`;
        const numeErr = validateNumePrenume(formData[numeF]);
        if (numeErr) errors[numeF] = numeErr;
        const cnpErr = validateCNP(formData[cnpF]);
        if (cnpErr) errors[cnpF] = cnpErr;
        const ciErr = validateSerieCI(formData[ciF]);
        if (ciErr) errors[ciF] = ciErr;
        const adrErr = validateAdresa(formData[adresaF]);
        if (adrErr) errors[adresaF] = adrErr;
      } else {
        const firmaErr = validateDenumireFirma(formData[`${prefix}_denumire_firma`]);
        if (firmaErr) errors[`${prefix}_denumire_firma`] = firmaErr;
        const cuiErr = validateCUI(formData[`${prefix}_cui`]);
        if (cuiErr) errors[`${prefix}_cui`] = cuiErr;
        const regVal = formData[`${prefix}_nr_reg_com`];
        if (regVal && regVal.trim()) {
          const regErr = validateNrRegCom(regVal);
          if (regErr) errors[`${prefix}_nr_reg_com`] = regErr;
        }
        const sediuErr = validateSediuSocial(formData[`${prefix}_adresa`]);
        if (sediuErr) errors[`${prefix}_adresa`] = sediuErr;
        const repErr = validateReprezentant(formData[`${prefix}_reprezentant`]);
        if (repErr) errors[`${prefix}_reprezentant`] = repErr;

        // CNP reprezentant (opțional)
        const repCnpF = `${prefix}_rep_cnp`;
        if (formData[repCnpF]) {
          const repCnpErr = validateCNP(formData[repCnpF]);
          if (repCnpErr) errors[repCnpF] = repCnpErr;
        }

        // Serie CI reprezentant (opțional)
        const repSerieF = `${prefix}_rep_serie_ci`;
        if (formData[repSerieF]) {
          const repSerieErr = validateSerieCI(formData[repSerieF]);
          if (repSerieErr) errors[repSerieF] = repSerieErr;
        }

        // Funcție reprezentant (opțional)
        const repFunctieF = `${prefix}_rep_functie`;
        if (formData[repFunctieF]) {
          const functie = formData[repFunctieF].trim();

          if (functie.length < 3) {
            errors[repFunctieF] = 'Funcția trebuie să aibă cel puțin 3 caractere';
          } else if (!/^[A-Za-zĂÂÎȘȚăâîșț\s.-]+$/.test(functie)) {
            errors[repFunctieF] = 'Funcția poate conține doar litere, spații, punct sau cratimă';
          }
        }
      }
      // Telefon si email — optionale dar validate daca completate
      const telF = `${prefix}_telefon`;
      const emF  = `${prefix}_email`;
      if (formData[telF]) {
        const telErr = validateTelefon(formData[telF]);
        if (telErr) errors[telF] = telErr;
      }
      if (formData[emF]) {
        const emailErr = validateEmail(formData[emF]);
        if (emailErr) errors[emF] = emailErr;
      }
    };

    if (s === 1) validatePersoana('v', newErrors);
    if (s === 2) validatePersoana('c', newErrors);
    if (s === 3) {
    if (!formData.auto_marca.trim()) newErrors.auto_marca = 'Obligatoriu';
    if (!formData.auto_tip.trim()) newErrors.auto_tip = 'Obligatoriu';

    const vinErr = validateVIN(formData.auto_serie_sasiu);
    if (vinErr) newErrors.auto_serie_sasiu = vinErr;

    if (!formData.auto_an) newErrors.auto_an = 'Obligatoriu';

    if (!formData.auto_nr_inmatriculare?.trim()) {
    newErrors.auto_nr_inmatriculare = 'Obligatoriu';
  } else {
    const nrErr = validateNrInmatriculare(formData.auto_nr_inmatriculare);
    if (nrErr) {
      newErrors.auto_nr_inmatriculare = nrErr;
    }
  }

  if (formData.auto_data_itp) {
    const dataItpErr = validateData(formData.auto_data_itp);
    if (dataItpErr) newErrors.auto_data_itp = dataItpErr;
  }

  const pretErr = validateSuma(formData.auto_pret);
  if (pretErr)
    newErrors.auto_pret = pretErr;

  const pretLitereErr = validateSumaLitere(formData.auto_pret_litere);
  if (pretLitereErr)
    newErrors.auto_pret_litere = pretLitereErr;

  if (formData.auto_anexa !== 'da' && formData.auto_anexa !== 'nu')
    newErrors.auto_anexa = 'Selectați o opțiune';

  const dataIncheiereErr = validateData(formData.data_incheiere, {
  allowPast: false
});
  if (dataIncheiereErr) newErrors.data_incheiere = dataIncheiereErr;
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

  const adresaCompleta = (prefix) => formData[`${prefix}_adresa`] || '';

  const fieldClass = (name) => errors[name] ? errorFieldClasses : sharedFieldClasses;
  const FieldError = ({ name }) => errors[name]
    ? <p className="mt-1 ml-1 text-xs text-red-500 font-medium">⚠ {errors[name]}</p>
    : null;

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

    doc.setFont('Roboto','bold'); doc.setFontSize(13);
    t('CONTRACT DE VÂNZARE- CUMPĂRARE', pageW/2, y, 'center'); y+=6;
    t('PENTRU UN VEHICUL FOLOSIT', pageW/2, y, 'center'); y+=5;
    ln(L,y,R,y); y+=7;

    const personaBloc = (titlu, prefix) => {
      const tip = formData[`${prefix}_tip_persoana`] || 'fizica';
      const adresa = adresaCompleta(prefix);
      doc.setFont('Roboto','bold'); doc.setFontSize(10);
      t(titlu,L,y); y+=5;
      doc.setFont('Roboto','normal'); doc.setFontSize(9.5);

      if (tip === 'fizica') {
        const ciRaw = formData[`${prefix}_serie_ci`] || '';
        const ciMatch = ciRaw.replace(/\s/g,'').match(/^([A-Z]{2})(\d+)$/i);
        const serie = ciMatch ? ciMatch[1] : ciRaw.split(' ')[0] || '';
        const nr    = ciMatch ? ciMatch[2] : ciRaw.split(' ')[1] || '';
        const nume  = formData[`${prefix}_nume`];
        const cnp   = formData[`${prefix}_cnp`];
        doc.setFontSize(9);
        const line1 = `${(nume)}, CNP: ${cnp}, act de identitate seria ${serie} nr. ${nr},`;
        const {lines:l1,h:l1h} = wrap(line1, W-5, 9, 4.5);
        doc.text(l1, L+5, y); y += l1h;
        const {lines:l2,h:l2h} = wrap(`Domiciliu: ${adresa}`, W-5, 9, 4.5);
        doc.text(l2, L+5, y); y += l2h + 3;
      } else {
        const firma = formData[`${prefix}_denumire_firma`]||'';
        const cui   = formData[`${prefix}_cui`]||'';
        const reg   = formData[`${prefix}_nr_reg_com`]||'';
        const rep   = formData[`${prefix}_reprezentant`]||'';
        const repCnp = formData[`${prefix}_rep_cnp`]||'';
        const repCiRaw = formData[`${prefix}_rep_serie_ci`]||'';
        const repCiMatch = repCiRaw.replace(/\s/g,'').match(/^([A-Z]{2})(\d+)$/i);
        const repSerie = repCiMatch ? repCiMatch[1] : repCiRaw.split(' ')[0]||'';
        const repNr    = repCiMatch ? repCiMatch[2] : repCiRaw.split(' ')[1]||'';
        const functie  = formData[`${prefix}_rep_functie`]||'reprezentant legal';
        doc.setFontSize(9);
        const fl1 = `${(firma)}, CUI: ${cui}, Nr. Reg. Com.: ${reg},`;
        const {lines:fl1l,h:fl1h} = wrap(fl1, W-5, 9, 4.5);
        doc.text(fl1l, L+5, y); y += fl1h;
        const {lines:fl2l,h:fl2h} = wrap(`Sediu social: ${adresa}`, W-5, 9, 4.5);
        doc.text(fl2l, L+5, y); y += fl2h;
        const repLine = `Reprezentată prin: ${(rep)}${repCnp ? ', CNP: '+repCnp : ''}${repSerie ? ', CI seria '+repSerie+' nr. '+repNr : ''}${functie ? ', în calitate de '+(functie) : ''},`;
        const {lines:rll,h:rlh} = wrap(repLine, W-5, 9, 4.5);
        doc.text(rll, L+5, y); y += rlh + 3;
        t('(Ștampilă)', R, y, 'right'); y += 4;
      }
      ln(L,y,R,y,0.5); y+=6;
    };

    personaBloc('1.  VÂNZĂTOR', 'v');
    personaBloc('2.  CUMPĂRĂTOR', 'c');

    doc.setFont('Roboto','bold'); doc.setFontSize(10);
    t('3.   OBIECTUL CONTRACTULUI',L,y); y+=5;
    doc.setFont('Roboto','normal');
    const obj=[
      `Vehiculul marca ${formData.auto_marca}, tipul ${formData.auto_tip},`,
      `număr de identificare ${formData.auto_serie_sasiu},`,
      `serie motor ${formData.auto_serie_motor||dots(8)},`,
      `cilindree ${formData.auto_cilindree||dots(6)} cmc,`,
      `număr de înmatriculare ${formData.auto_nr_inmatriculare},`,
      `data la care expiră inspecția tehnică periodică ${formData.auto_data_itp||dots(12)},`,
      `numărul cărții de identitate a vehiculului ${formData.auto_carte_identitate||dots(10)}.`
    ].join(' ');
    const {lines:objL,h:objH}=wrap(obj,W,9,4.8);
    doc.text(objL,L,y); y+=objH+2; ln(L,y,R,y); y+=6;

    doc.setFont('Roboto','bold'); doc.setFontSize(10); t('4.   PREȚUL',L,y);
    doc.setFont('Roboto','normal'); doc.setFontSize(9);
    t(`  in cifre ${formData.auto_pret} ${formData.auto_moneda},  in litere ${formData.auto_pret_litere} ${formData.auto_moneda}`,L+20,y);
    y+=1; ln(L+20,y,R,y); y+=2; ln(L,y,R,y); y+=6;

    doc.setFont('Roboto','normal'); doc.setFontSize(8.5);
    const c1='5.   Vânzătorul menționat la punctul (1) declară că vehiculul este proprietatea sa, liberă de orice sarcini. De asemenea, declară că a predat cumpărătorului menționat la punctul (2) vehiculul, cheile, fișa de înmatriculare și cartea de identitate a vehiculului, primind de la acesta prețul prevăzut la punctul (4).';
    const {lines:c1L,h:c1H}=wrap(c1,W,8.5,4.2); doc.text(c1L,L,y); y+=c1H+3;
    const c2='Cumpărătorul menționat la punctul (2) declară că a primit de la vânzătorul menționat la punctul (1) vehiculul, cheile, fișa de înmatriculare și cartea de identitate a vehiculului, achitând vânzătorului prețul menționat la punctul (4).';
    const {lines:c2L,h:c2H}=wrap(c2,W,8.5,4.2); doc.text(c2L,L,y); y+=c2H+3;
    ln(L,y,R,y); y+=6;

    const docsBifate = DOCUMENTE_ANEXA.filter(d => docBifate[d.id]);
    const docsBifateList = DOCUMENTE_ANEXA.filter(d => docBifate[d.id]);
    const anexaFinala = (formData.auto_anexa === 'da' && docsBifateList.length > 0) ? 'da' : 'nu';
    const anexaDa = anexaFinala === 'da' ? '[X] Da' : '[ ] Da';
    const anexaNu = anexaFinala === 'nu' ? '[X] Nu' : '[ ] Nu';
    doc.setFontSize(9);
    t(`Anexă la contract :  ${anexaDa}    ${anexaNu}`,L,y);
    t('Semnătura vânzătorului ..............................',R,y,'right'); y+=7;
    if (formData.auto_anexa==='da' && docsBifate.length > 0) {
      doc.setFontSize(8); doc.setFont('Roboto','bold');
      t('Documente anexate:',L,y); y+=4;
      doc.setFont('Roboto','normal');
      docsBifateList.forEach(d => { t('• '+(d.label),L+3,y); y+=4; });
      y+=2;
    }
    t('Locul încheierii contractului: '+(formData.loc_incheiere||dots(15)),L,y);
    t('Semnătura cumpărătorului ..........................',R,y,'right'); y+=7;
    t('Data '+formData.data_incheiere,L,y); y+=5;
    ln(L,y,R,y,0.5); y+=6;

    doc.setFontSize(8.5);
    const final='Începând cu data semnării, cumpărătorul dobândește calitatea de proprietar de drept și de fapt asupra vehiculului ce face obiectul prezentului contract de vânzare-cumpărăre, preluând toate obligațiile prevăzute de lege, inclusiv cele legate de transcrierea vehiculului pe numele său, în maxim 30 de zile.';
    const {lines:fL,h:fH}=wrap(final,W,8.5,4.2); doc.text(fL,L,y); y+=fH+7;
    t('Am luat la cunostinta _______________________________________',L,y); y+=5;
    t('(Semnătură cumpărător și ștampilă după caz)',pageW/2,y,'center'); y+=5;
    doc.setDrawColor(0); doc.setLineWidth(0.5);
    doc.rect(L-5,14,R-L+10,y+2);
    doc.save('Contract-Vanzare-Cumparare-Auto.pdf');
    completeSession();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-blue-600 mb-8 flex items-center font-medium">
          ← Înapoi la Dashboard
        </button>
        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 uppercase italic">Generare Contract</h1>
          <p className="text-slate-500 font-medium">Pasul {step} din 3</p>
        </header>
        <div className="w-full bg-slate-200 h-2 rounded-full mb-12 overflow-hidden">
          <div className="bg-orange-500 h-2 rounded-full transition-all duration-700" style={{ width:`${(step/3)*100}%` }}></div>
        </div>
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100">

          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-500">
              <div className="border-b pb-5">
                <h2 className="text-xl font-bold text-orange-600 uppercase">01. Date Vânzător</h2>
                <p className="text-xs text-slate-400 mt-1">Completați manual sau încărcați CI pentru completare automată</p>
              </div>
              <PersonaSection
                prefix="v"
                formData={formData}
                handleChange={handleChange}
                errors={errors}
                cnpInfo={cnpInfoV}
                onCNPChange={(e) => handleCNPChange(e, 'vanzator')}
                onCIChange={handleCIChange('v_serie_ci')}
                onRepCIChange={handleCIChange('v_rep_serie_ci')}
                onRegComChange={handleRegComChange('v_nr_reg_com')}
                onDataExtracted={(data) => handleCIExtracted(data, 'v')}
                onScanSuccess={recordAIScan}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-500">
              <div className="border-b pb-5">
                <h2 className="text-xl font-bold text-blue-600 uppercase">02. Date Cumpărător</h2>
                <p className="text-xs text-slate-400 mt-1">Completați manual sau încărcați CI pentru completare automată</p>
              </div>
              <PersonaSection
                prefix="c"
                formData={formData}
                handleChange={handleChange}
                errors={errors}
                cnpInfo={cnpInfoC}
                onCNPChange={(e) => handleCNPChange(e, 'cumparator')}
                onCIChange={handleCIChange('c_serie_ci')}
                onRepCIChange={handleCIChange('c_rep_serie_ci')}
                onRegComChange={handleRegComChange('c_nr_reg_com')}
                onDataExtracted={(data) => handleCIExtracted(data, 'c')}
                onScanSuccess={recordAIScan}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-500">
              <div className="border-b pb-5">
                <h2 className="text-xl font-bold text-slate-800 uppercase">03. Obiectul Contractului</h2>
                <p className="text-xs text-slate-400 mt-1">Completați manual sau încărcați talonul pentru completare automată</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs">
                <p className="font-black uppercase text-slate-400 mb-2">Rezumat Părți</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <p>
                    <span className="text-slate-400">Vânzător:</span>
                    <span className="font-bold ml-1">
                      {formData.v_tip_persoana === 'juridica'
                        ? (formData.v_denumire_firma || '—')
                        : (formData.v_nume || '—')}
                    </span>
                    {formData.v_tip_persoana === 'juridica' &&
                      <span className="ml-1 text-slate-400">(PJ)</span>}
                  </p>
                  <p><span className="text-slate-400">Adresă:</span> <span className="ml-1">{adresaCompleta('v')||'—'}</span></p>
                  <p>
                    <span className="text-slate-400">Cumpărător:</span>
                    <span className="font-bold ml-1">
                      {formData.c_tip_persoana === 'juridica'
                        ? (formData.c_denumire_firma || '—')
                        : (formData.c_nume || '—')}
                    </span>
                    {formData.c_tip_persoana === 'juridica' &&
                      <span className="ml-1 text-slate-400">(PJ)</span>}
                  </p>
                  <p><span className="text-slate-400">Adresă:</span> <span className="ml-1">{adresaCompleta('c')||'—'}</span></p>
                </div>
              </div>

              {/* Buton incarcare talon */}
              <div className="flex justify-end">
                <IncarcareTalon
                  label="Încărcare Document Vehicul (Talon/CIV)"
                  color="orange"
                  onDataExtracted={handleTalonExtracted}
                  onScanSuccess={recordAIScan}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Marca *</label>
                  <input name="auto_marca" value={formData.auto_marca} onChange={handleUpperChange("auto_marca")} className={fieldClass('auto_marca')} placeholder="Ex: DACIA" />
                  <FieldError name="auto_marca" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Tipul *</label>
                  <input name="auto_tip" value={formData.auto_tip} onChange={handleUpperChange("auto_tip")} className={fieldClass('auto_tip')} placeholder="Ex: LOGAN" />
                  <FieldError name="auto_tip" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                  Serie Șasiu (VIN) * <span className="font-normal normal-case text-slate-400">— 17 caractere, fără I, O, Q</span>
                </label>
                <input name="auto_serie_sasiu" value={formData.auto_serie_sasiu} onChange={handleVINChange('auto_serie_sasiu')}
                  onBlur={() => {
                    const err = validateVIN(formData.auto_serie_sasiu);
                    setErrors(prev => ({ ...prev, auto_serie_sasiu: err || null }));
                  }}
                  className={`${fieldClass('auto_serie_sasiu')} font-mono`} placeholder="Ex: UU1ABCD123456789" maxLength={17} />
                <FieldError name="auto_serie_sasiu" />
                <VINBadge vinInfo={vinInfo} marca={formData.auto_marca} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Nr. Înmatriculare *</label>
                  <input name="auto_nr_inmatriculare" value={formData.auto_nr_inmatriculare} onChange={handleNrInmatriculareChange('auto_nr_inmatriculare')}
                    className={`${fieldClass('auto_nr_inmatriculare')} font-mono`} placeholder="Ex: TM 01 ABC" maxLength={10} />
                  <FieldError name="auto_nr_inmatriculare" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">An Fabricație *</label>
                  <select name="auto_an" value={formData.auto_an} onChange={handleChangeTracked} className={fieldClass('auto_an')}>
                    <option value="">Selectați...</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <FieldError name="auto_an" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                    Serie Motor <span className="text-slate-300 font-normal normal-case">(opțional)</span> 
                  </label>
                  <input name="auto_serie_motor" value={formData.auto_serie_motor} onChange={handleUpperChange("auto_serie_motor")}
                    className={sharedFieldClasses} placeholder="Ex: K9K732" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                    Cilindree (cmc) <span className="text-slate-300 font-normal normal-case">(opțional)</span>
                  </label>
                  <input name="auto_cilindree" value={formData.auto_cilindree} onChange={handleNumericChange("auto_cilindree")}
                    className={sharedFieldClasses} placeholder="Ex: 1598" inputMode="numeric" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                    Exp. ITP <span className="text-slate-300 font-normal normal-case">(opțional)</span>
                  </label>

                  <input
                    name="auto_data_itp"
                    value={formData.auto_data_itp}
                    onChange={(e) => {
                      trackFirstInput();
                      handleDateChange("auto_data_itp")(e);
                    }}
                    className={fieldClass('auto_data_itp')}
                    maxLength={10}
                    placeholder="ZZ.LL.AAAA"
                  />

                  <FieldError name="auto_data_itp" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                  Nr. Carte Identitate Vehicul (CIV) <span className="text-slate-300 font-normal normal-case">(opțional)</span>
                </label>
                <input name="auto_carte_identitate" value={formData.auto_carte_identitate} onChange={handleChangeTracked}
                  className={sharedFieldClasses} placeholder="Ex: 123456789 (din CIV, rubrica A)" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                    Preț (cifre) *
                  </label>

                  <input
                    name="auto_pret"
                    value={formData.auto_pret}
                    onChange={(e) => {
                      trackFirstInput();
                      handleNumericChange("auto_pret")(e);
                    }}
                    className={fieldClass('auto_pret')}
                    placeholder="Ex: 8500"
                  />

                  <FieldError name="auto_pret" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Monedă *</label>
                  <select name="auto_moneda" value={formData.auto_moneda} onChange={handleChangeTracked} className={sharedFieldClasses}>
                    <option value="EUR">EUR</option>
                    <option value="LEI">LEI (RON)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Preț în litere *</label>
                <input
                  name="auto_pret_litere"
                  value={formData.auto_pret_litere}
                  onChange={(e) => {
                    trackFirstInput();
                    handleLettersChange("auto_pret_litere")(e);
                  }}
                  className={fieldClass('auto_pret_litere')}
                  placeholder="Ex: opt mii cinci sute"
                />
                <FieldError name="auto_pret_litere" />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">Anexă la contract *</label>
                <div className="flex gap-4 mb-2">
                  {['da','nu'].map(opt => (
                    <button key={opt} type="button"
                      onClick={() => { setFormData(prev=>({...prev,auto_anexa:opt})); setErrors(prev=>({...prev,auto_anexa:null})); if (opt === 'nu') setDocBifate({}); }}
                      className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all border-2 ${formData.auto_anexa===opt ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                      {opt==='da' ? 'Da' : 'Nu'}
                    </button>
                  ))}
                </div>
                <FieldError name="auto_anexa" />
                {formData.auto_anexa === 'da' && (
                  <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-xs font-black uppercase text-slate-400 mb-3">Bifați documentele anexate:</p>
                    <div className="space-y-2">
                      {DOCUMENTE_ANEXA.map(d => (
                        <div key={d.id} onClick={() => toggleDoc(d.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${docBifate[d.id] ? 'bg-green-50 border border-green-200' : 'bg-white border border-slate-200 hover:border-slate-300'}`}>
                          <div className={`w-5 h-5 rounded shrink-0 flex items-center justify-center border-2 transition-all ${docBifate[d.id] ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                            {docBifate[d.id] && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span className="text-xs font-medium text-slate-700">{d.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <LocalitateAutocomplete
                    value={formData.loc_incheiere}
                    onChange={(val) => setFormData(prev => ({ ...prev, loc_incheiere: val }))}
                    label="Locul încheierii"
                    placeholder="Ex: Timiș"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1">
                    Data
                  </label>

                  <input
                    name="data_incheiere"
                    value={formData.data_incheiere}
                    onChange={(e) => {
                      trackFirstInput();
                      handleDateChange("data_incheiere")(e);
                    }}
                    className={fieldClass('data_incheiere')}
                    maxLength={10}
                    placeholder="ZZ.LL.AAAA"
                  />

                  <FieldError name="data_incheiere" />
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 flex justify-between items-center border-t pt-8">
            {step > 1 && (
              <button onClick={() => { setStep(step-1); setErrors({}); }} className="font-bold text-slate-400 hover:text-slate-800">
                ← Înapoi
              </button>
            )}
            <button onClick={handleNext} className={`ml-auto px-10 py-4 text-white rounded-2xl font-black transition-all ${step===3 ? 'bg-green-600 shadow-lg shadow-green-100 hover:bg-green-700' : 'bg-slate-900 hover:bg-orange-600 shadow-xl'}`}>
              {step===3 ? '📄 Descarcă Contract PDF' : 'Pasul următor →'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}



export default AutoForm;