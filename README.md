# Asistent Birocratic

<p align="center">
  <img src="public/screenshot.png" width="850">
</p>

Platformă web pentru completarea asistată și generarea automată a documentelor administrative românești.

## Descriere

Asistent Birocratic este o aplicație web dezvoltată în cadrul lucrării de licență, având ca scop simplificarea procesului de completare a formularelor administrative utilizate în România.

Aplicația oferă validarea automată a datelor, completarea asistată prin inteligență artificială și generarea documentelor PDF conforme modelelor oficiale.

---

## Funcționalități

- Completare ghidată a formularelor administrative
- Validare automată a datelor introduse
- Scanare asistată prin AI pentru carte de identitate și certificat de înmatriculare
- Generare automată a documentelor PDF
- Salvarea temporară a sesiunii utilizatorului

---

## Formulare disponibile

- Cerere adeverință de venit (ANAF)
- Declarația Unică D212
- Cerere parcare de reședință
- Cerere transcriere acte de stare civilă
- Contract de vânzare-cumpărare auto
- Cerere înmatriculare vehicul

---

## Tehnologii utilizate

- React
- Vite
- Tailwind CSS
- jsPDF
- Claude API (Anthropic)
- Vercel

---

## Rulare locală

Instalarea dependențelor:

```bash
npm install
```

Pornirea aplicației:

```bash
npm run dev
```

Generarea versiunii de producție:

```bash
npm run build
```

---

## Configurare

Funcționalitatea de scanare asistată prin AI utilizează API-ul Claude și necesită configurarea unei chei API într-un fișier `.env`, care nu este inclus în acest repository din motive de securitate.

---

## Aplicația online

https://asistent-birocratic.vercel.app

---

## Autor

**Vanya Iulia-Maria**

Universitatea Politehnica Timișoara  
Facultatea de Automatică și Calculatoare

Lucrare de licență – 2026