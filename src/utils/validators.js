// ─────────────────────────────────────────────────────────────────────────────
// validators.js — validatori comuni pentru toate formularele
// ─────────────────────────────────────────────────────────────────────────────

// ── CNP ──────────────────────────────────────────────────────────────────────

export const decodeCNP = (cnp) => {
  if (!cnp || cnp.length !== 13 || !/^\d+$/.test(cnp)) return null;
  const s = parseInt(cnp[0]);
  const an2 = cnp.substring(1, 3);
  const luna = cnp.substring(3, 5);
  const zi = cnp.substring(5, 7);
  const jud = cnp.substring(7, 9);
  const secole = { 1:'19',2:'19',3:'18',4:'18',5:'20',6:'20',7:'19',8:'19' };
  const an = (secole[s] || '19') + an2;
  const sex = [1,3,5,7].includes(s) ? 'M' : 'F';
  const judete = {
    '01':'Alba','02':'Arad','03':'Arges','04':'Bacau','05':'Bihor',
    '06':'Bistrita-Nasaud','07':'Botosani','08':'Brasov','09':'Braila',
    '10':'Buzau','11':'Caras-Severin','12':'Cluj','13':'Constanta',
    '14':'Covasna','15':'Dambovita','16':'Dolj','17':'Galati','18':'Gorj',
    '19':'Harghita','20':'Hunedoara','21':'Ialomita','22':'Iasi','23':'Ilfov',
    '24':'Maramures','25':'Mehedinti','26':'Mures','27':'Neamt','28':'Olt',
    '29':'Prahova','30':'Satu Mare','31':'Salaj','32':'Sibiu','33':'Suceava',
    '34':'Teleorman','35':'Timis','36':'Tulcea','37':'Vaslui','38':'Valcea',
    '39':'Vrancea','40':'Bucuresti','41':'Bucuresti S1','42':'Bucuresti S2',
    '43':'Bucuresti S3','44':'Bucuresti S4','45':'Bucuresti S5','46':'Bucuresti S6',
  };
  
  const coef = [2,7,9,1,4,6,3,5,8,2,7,9];
  const suma = coef.reduce((acc, c, i) => acc + c * parseInt(cnp[i]), 0);
  const control = suma % 11 === 10 ? 1 : suma % 11;
  const valid = control === parseInt(cnp[12]);
  return { dataNasterii: `${zi}.${luna}.${an}`, sex, judet: judete[jud] || 'Necunoscut', valid };
};

export const validateCNP = (cnp) => {
  if (!cnp) return 'CNP-ul este obligatoriu';
  if (!/^\d+$/.test(cnp)) return 'CNP-ul trebuie sa contina doar cifre';
  if (cnp.length !== 13) return 'CNP-ul trebuie sa aiba 13 cifre';
  if (!['1','2','3','4','5','6','7','8'].includes(cnp[0]))
    return 'Prima cifra a CNP-ului este invalida';
  const coef = [2,7,9,1,4,6,3,5,8,2,7,9];
  const suma = coef.reduce((acc, c, i) => acc + c * parseInt(cnp[i]), 0);
  const control = suma % 11 === 10 ? 1 : suma % 11;
  if (control !== parseInt(cnp[12]))
    return 'Cifra de control a CNP-ului este invalida';
  return null;
};

// ── NUME SI PRENUME ───────────────────────────────────────────────────────────
// Minim 2 cuvinte (nume + prenume)

export const validateNumePrenume = (nume) => {
  if (!nume || !nume.trim()) return 'Numele este obligatoriu';
  const cuvinte = nume.trim().split(/\s+/).filter(Boolean);
  if (cuvinte.length < 2)
    return 'Introduceti atat numele cat si prenumele';
  return null;
};

// ── SERIE CI ─────────────────────────────────────────────────────────────────

export const validateSerieCI = (serie) => {
  if (!serie) return 'Seria CI este obligatorie';
  if (!/^[A-Z]{2}\s?\d{6}$/.test(serie.toUpperCase()))
    return 'Format invalid (ex: RR 123456)';
  return null;
};

// ── ADRESĂ PERSOANĂ FIZICĂ ───────────────────────────────────────────────────
// Accepta: Str. X nr. Y, Bd. X nr. Y, etc.

export const validateAdresa = (adresa) => {
  if (!adresa || !adresa.trim()) return 'Adresa este obligatorie';
  if (!/\b(str|strada|bd|bdul|bulevardul|aleea|alee|calea|piata|piața|intr|intrarea|splai|sos|șos|soseaua|șoseaua|drum|dj|dn|sat|satul)[.]?\s*\S+.*\b(nr|numar|numarul)[.]?\s*\d+/i.test(adresa))
    return 'Adresa trebuie să conțină strada și numărul — ex: Str. Florilor nr. 5';
  return null;
};


// ── SEDIU SOCIAL PERSOANĂ JURIDICĂ ───────────────────────────────────────────
// Accepta: Str. X nr. Y sau "ambulant"

export const validateSediuSocial = (sediu) => {
  if (!sediu || !sediu.trim()) return 'Sediul social este obligatoriu';
  if (/ambulant/i.test(sediu)) return null;
if (!/\b(str|strada|bd|bdul|bulevardul|aleea|alee|calea|piata|piața|intr|intrarea|splai|sos|șos|soseaua|șoseaua|drum|dj|dn|sat|satul)[.]?\s*\S+.*\bnr[.]?\s*\d+/i.test(sediu))
      return 'Sediul social trebuie sa contina strada si numarul sau "ambulant"';
  return null;
};

// ── DENUMIRE FIRMĂ ───────────────────────────────────────────────────────────
// Trebuie sa contina minim 2 cuvinte sau sa inceapa cu SC/SRL/SA/RA/PFA/II/IF

export const validateDenumireFirma = (denumire) => {
  if (!denumire || !denumire.trim()) return 'Denumirea firmei este obligatorie';
  const cuvinte = denumire.trim().split(/\s+/).filter(Boolean);
  if (cuvinte.length < 2)
    return 'Introduceti denumirea completa a firmei (ex: SC Example SRL)';
  return null;
};

// ── CUI ──────────────────────────────────────────────────────────────────────
// Format: RO + 2-10 cifre sau doar 2-10 cifre

export const validateCUI = (cui) => {
  if (!cui || !cui.trim()) return 'CUI-ul este obligatoriu';
  if (!/^(RO)?\d{2,10}$/i.test(cui.trim().replace(/\s/g, '')))
    return 'Format invalid — ex: RO12345678 sau 12345678';
  return null;
};

// ── NR. REGISTRUL COMERȚULUI ─────────────────────────────────────────────────
// Format: J35/1234/2020 sau C35/1234/2020 etc.

export const validateNrRegCom = (nr) => {
  if (!nr || !nr.trim()) return 'Nr. Registrului Comerțului este obligatoriu';
  if (!/^[A-Za-z]\d{1,2}\/\d+/i.test(nr.trim()))
    return 'Format invalid — ex: J35/1234/2020';
  return null;
};

// ── REPREZENTANT LEGAL ───────────────────────────────────────────────────────
// Minim 2 cuvinte

export const validateReprezentant = (rep) => {
  if (!rep || !rep.trim()) return 'Reprezentantul legal este obligatoriu';
  const cuvinte = rep.trim().split(/\s+/).filter(Boolean);
  if (cuvinte.length < 2)
    return 'Introduceti numele complet al reprezentantului';
  return null;
};

// ── NR. ÎNMATRICULARE ────────────────────────────────────────────────────────

export const validateNrInmatriculare = (nr) => {
  if (!nr) return null;

  const coduriJudetInmatriculare = [
  'AB','AR','AG','BC','BH','BN','BT','BV','BR','BZ',
  'CS','CL','CJ','CT','CV',
  'DB','DJ',
  'GL','GR','GJ',
  'HR','HD',
  'IL','IS','IF',
  'MM','MH','MS',
  'NT','OT','PH',
  'SM','SJ','SB','SV',
  'TR','TM','TL',
  'VS','VL','VN',
  'B'
];
  const normalized = nr.trim().replace(/[-\s]+/g, ' ');

  // 1. Format general
  const match = normalized.match(/^([A-Z]{1,2})\s?(\d{2,3})\s?([A-Z]{3})$/i);

  if (!match)
    return 'Format invalid (ex: TM 01 ABC sau B 123 ABC)';

  // 2. Județ
  const judet = match[1].toUpperCase();

  if (!coduriJudetInmatriculare.includes(judet))
    return 'Cod de județ invalid';

  // 3. Litere finale
  const litere = match[3].toUpperCase();

  if (litere[0] === 'I' || litere[0] === 'O')
    return 'Ultimele 3 litere nu pot începe cu I sau O';

  return null;
};

// ── VIN ──────────────────────────────────────────────────────────────────────

export const validateVIN = (vin) => {
  if (!vin) return 'VIN-ul este obligatoriu';
  const clean = vin.toUpperCase().trim();
  if (clean.length !== 17) return 'VIN-ul trebuie sa aiba exact 17 caractere';
  if (/[IOQ]/.test(clean)) return 'VIN-ul nu poate contine literele I, O sau Q';
  return null;
};

// ── TELEFON ──────────────────────────────────────────────────────────────────

export const validateTelefon = (tel) => {
  if (!tel) return null;
  const clean = tel.replace(/\s/g, '');
  if (!/^(\+40|0040|0)[0-9]{9}$/.test(clean))
    return 'Format invalid (ex: 0721 234 567 sau +40721234567)';
  return null;
};

// ── EMAIL ────────────────────────────────────────────────────────────────────

export const validateEmail = (email) => {
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return 'Adresa de email nu este valida';
  return null;
};

// ── COD POSTAL ───────────────────────────────────────────────────────────────

export const validateCodPostal = (cod) => {
  if (!cod) return null;
  if (!/^\d{6}$/.test(cod))
    return 'Codul postal trebuie sa aiba 6 cifre';
  return null;
};

// ── DATĂ (ZZ.LL.AAAA) ────────────────────────────────────────────────────────

export const validateData = (valoare, options = {}) => {
  const {
    allowPast = true,
    allowFuture = true,
    minYear = 1900,
    maxYear = 2099,
  } = options;

  if (!valoare || !valoare.trim()) return null;

  const text = valoare.trim();

  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(text))
    return 'Format incorect. Utilizați ZZ.LL.AAAA (ex: 01.01.2001)';

  const [zi, luna, an] = text.split('.').map(Number);

  const erori = [];

  if (an < minYear || an > maxYear) erori.push('an');
  if (luna < 1 || luna > 12) erori.push('luna');
  if (zi < 1 || zi > 31) erori.push('zi');

  if (erori.length >= 2)
    return 'Dată invalidă';

  if (erori.includes('an'))
    return `Anul trebuie să fie între ${minYear} și ${maxYear}`;

  if (erori.includes('luna'))
    return 'Lună invalidă';

  const anBisect =
    (an % 4 === 0 && an % 100 !== 0) || an % 400 === 0;

  const zileLuna = [
    0, 31, anBisect ? 29 : 28, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31
  ];

  if (zi < 1 || zi > zileLuna[luna])
    return `Zi invalidă pentru luna ${String(luna).padStart(2, '0')}`;

  const dataIntrodusa = new Date(an, luna - 1, zi);
  dataIntrodusa.setHours(0, 0, 0, 0);

  const azi = new Date();
  azi.setHours(0, 0, 0, 0);

  if (!allowPast && dataIntrodusa < azi)
    return 'Data nu poate fi în trecut';

  if (!allowFuture && dataIntrodusa > azi)
  return 'Data nu poate fi în viitor';

  return null;
};

// ── SUMĂ (LEI) ───────────────────────────────────────────────────────────────

export const validateSuma = (valoare) => {
  if (!valoare || !valoare.trim())
    return 'Câmpul este obligatoriu';

  const clean = valoare.trim();

  if (!/^\d{1,3}( \d{3})*([.,]\d{1,2})?$|^\d+([.,]\d{1,2})?$/.test(clean))
    return 'Se acceptă doar cifre (ex: 1500 sau 1 500,50)';

  return null;
};

export const validateCAEN = (cod) => {
  if (!cod || !cod.trim()) return null;

  if (!/^\d{4}$/.test(cod.trim()))
    return 'Codul CAEN trebuie să conțină exact 4 cifre';

  return null;
};

// ── SUMĂ ÎN LITERE ───────────────────────────────────────────────────────────

export const validateSumaLitere = (valoare) => {
  if (!valoare || !valoare.trim())
    return 'Câmpul este obligatoriu';

  const text = valoare.trim();

  if (!/^[A-Za-zĂÂÎȘȚăâîșț\s-]+$/.test(text))
    return 'Se acceptă doar litere (ex: opt mii cinci sute)';

  return null;
};


export const parseSuma = (valoare) => {
  if (!valoare) return 0;

  return Number(
    valoare
      .replace(/\s/g, '')   // elimină spațiile
      .replace(',', '.')    // 25,50 -> 25.50
  );
};