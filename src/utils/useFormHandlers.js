// ─────────────────────────────────────────────────────────────
// useFormHandlers.js — handleri reutilizabili pentru toate formularele
//
// Utilizare:
//   import { useFormHandlers } from '../utils/useFormHandlers';
//   const { handleCIChange, handleCNPChange, handleUpperChange,
//           handleNumericChange, handleNrInmatriculareChange,
//           handleVINChange, handleDateChange } = useFormHandlers(setFormData, setErrors, formData);
// ─────────────────────────────────────────────────────────────

import { decodeCNP, validateVIN } from './validators';

export const useFormHandlers = (setFormData, setErrors, formData, extraSetters = {}) => {
  const { setCnpInfo, setVinInfo } = extraSetters;

  // ── Handler generic ─────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors(prev => ({ ...prev, [name]: null }));
  };

  // ── CNP ─────────────────────────────────────────────────────
  const handleCNPChange = (e) => {
    handleChange(e);
    const val = e.target.value;
    if (setCnpInfo) {
      if (val.length === 13) setCnpInfo(decodeCNP(val));
      else setCnpInfo(null);
    }
  };

  // CNP cu prefix (pentru AutoForm: vanzator/cumparator)
  const handleCNPChangePrefix = (prefix, setCnpInfoFn) => (e) => {
    handleChange(e);
    const val = e.target.value;
    if (setCnpInfoFn) {
      if (val.length === 13) setCnpInfoFn(decodeCNP(val));
      else setCnpInfoFn(null);
    }
  };

  // ── Serie CI ─────────────────────────────────────────────────
  // field: numele câmpului în formData (ex: 'serie_ci' sau 'v_serie_ci')
  const handleCIChange = (field = 'serie_ci') => (e) => {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
    const prevVal = (formData && formData[field]) || '';
    // Auto-spatiu dupa 2 litere doar daca userul adauga (nu sterge)
    if (val.length > prevVal.length) {
      if (/^[A-Z]{2}\d/.test(val)) val = val.slice(0, 2) + ' ' + val.slice(2);
    }
    if (val.length > 9) val = val.slice(0, 9);
    setFormData(prev => ({ ...prev, [field]: val }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  // ── Uppercase ────────────────────────────────────────────────
  const handleUpperChange = (field) => (e) => {
    const val = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, [field]: val }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  // ── Sume  ────────────────────────────────────────────────
  const handleMoneyChange = (field) => (e) => {
  const val = e.target.value.replace(/[^0-9., ]/g, '');

  setFormData(prev => ({
    ...prev,
    [field]: val
  }));

  setErrors(prev => ({
    ...prev,
    [field]: null
  }));
};

  // ── Numeric (doar cifre) ─────────────────────────────────────
  const handleNumericChange = (field) => (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, [field]: val }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  // ── Letters (doar litere) ─────────────────────────────────────
  const handleLettersChange = (field) => (e) => {
  const value = e.target.value.replace(/[^A-Za-zĂÂÎȘȚăâîșț\s-]/g, '');

  setFormData(prev => ({
    ...prev,
    [field]: value,
  }));

  setErrors(prev => ({
    ...prev,
    [field]: null,
  }));
};

  // ── Nr. Înmatriculare (auto-format TM 01 ABC) ────────────────
  const handleNrInmatriculareChange = (field = 'nr_inmatriculare') => (e) => {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
    const clean = val.replace(/\s/g, '');
    const match = clean.match(/^([A-Z]{1,2})(\d{2,3})([A-Z]{0,3})$/);
    if (match) val = [match[1], match[2], match[3]].filter(Boolean).join(' ');
    setFormData(prev => ({ ...prev, [field]: val }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  // ── VIN (uppercase + validare) ───────────────────────────────
const handleVINChange = (field = 'vin') => (e) => {
  const val = e.target.value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 17);

  setFormData(prev => ({ ...prev, [field]: val }));
  setErrors(prev => ({ ...prev, [field]: null }));

  if (setVinInfo) {
    if (val.length === 0) {
      setVinInfo(null);
    } else if (/[IOQ]/.test(val)) {
      setVinInfo({
        valid: false,
        msg: 'VIN-ul nu poate conține literele I, O sau Q'
      });
    } else if (val.length < 17) {
      setVinInfo({
        valid: null,
        msg: `Mai ai ${17 - val.length} caractere de introdus`
      });
    } else {
      setVinInfo({
        valid: true,
        msg: 'VIN complet'
      });
    }
  }
};


  // ── Dată auto-formatare ZZ.LL.AAAA ──────────────────────────
  const handleDateChange = (field) => (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length >= 3 && digits.length <= 4)
      formatted = digits.slice(0, 2) + '.' + digits.slice(2);
    else if (digits.length >= 5)
      formatted = digits.slice(0, 2) + '.' + digits.slice(2, 4) + '.' + digits.slice(4);
    setFormData(prev => ({ ...prev, [field]: formatted }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };  
 


  // ── Autofill din CI scan ─────────────────────────────────────
  // prefix: '' pentru formulare simple, 'v_' / 'c_' pentru AutoForm
  const handleCIDataExtracted = (data, prefix = '') => {
    setFormData(prev => ({
      ...prev,
      ...(data.nume     && { [`${prefix}nume`]:     data.nume }),
      ...(data.cnp      && { [`${prefix}cnp`]:      data.cnp }),
      ...(data.serie_ci && { [`${prefix}serie_ci`]: data.serie_ci }),
      ...(data.adresa   && { [`${prefix}adresa`]:   data.adresa }),
    }));
    if (setCnpInfo && data.cnp && data.cnp.length === 13)
      setCnpInfo(decodeCNP(data.cnp));
  };

  // ── Autofill din Talon scan ──────────────────────────────────
  const handleTalonDataExtracted = (data, setVinInfoFn) => {
    setFormData(prev => ({
      ...prev,
      ...(data.marca           && { marca:           data.marca.toUpperCase() }),
      ...(data.tip             && { tip:              data.tip.toUpperCase() }),
      ...(data.vin             && { vin:              data.vin.toUpperCase() }),
      ...(data.serie_motor     && { serie_motor:      data.serie_motor.toUpperCase() }),
      ...(data.cilindree       && { cilindree:        String(data.cilindree).replace(/[^0-9]/g, '') }),
      ...(data.putere_kw       && { putere_kw:        String(data.putere_kw).replace(/[^0-9]/g, '') }),
      ...(data.an_fabricatie   && { an_fabricatie:    String(data.an_fabricatie) }),
      ...(data.culoare         && { culoare:          data.culoare.toUpperCase() }),
      ...(data.tip_combustibil && { tip_combustibil:  data.tip_combustibil }),
    }));
    if (setVinInfoFn && data.vin?.length >= 3)
      setVinInfoFn(validateVIN(data.vin));
  };

  return {
    handleChange,
    handleCNPChange,
    handleCNPChangePrefix,
    handleCIChange,
    handleUpperChange,
    handleMoneyChange,
    handleNumericChange,
    handleLettersChange,
    handleNrInmatriculareChange,
    handleVINChange,
    handleDateChange,
    handleCIDataExtracted,
    handleTalonDataExtracted,
  };
};