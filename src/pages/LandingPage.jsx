import React from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  const features = [
    { icon: '📝', title: 'Completare ghidată', desc: 'Formulare pas cu pas, cu explicații clare pentru fiecare câmp' },
    { icon: '✅', title: 'Validare automată', desc: 'CNP, adresă, VIN — verificate în timp real înainte de trimitere' },
    { icon: '📄', title: 'PDF oficial', desc: 'Documentul generat respectă modelul oficial acceptat de instituții' },
    { icon: '🔒', title: '100% local*', desc: 'Formularele și PDF-urile sunt procesate local în browser' },
  ];

  const formulare = [
    { inst: 'ANAF', icon: '🏦', color: 'blue', items: ['Cerere Adeverință Venit', 'Declarație Unică D212'] },
    { inst: 'Primărie', icon: '🌳', color: 'green', items: ['Cerere Parcare Reședință', 'Cerere Transcriere Act'] },
    { inst: 'Înmatriculări', icon: '🚗', color: 'orange', items: ['Contract Vânzare-Cumpărare', 'Cerere Înmatriculare Vehicul'] },
  ];

  const stats = [
    { nr: '6', label: 'Formulare disponibile' },
    { nr: '3', label: 'Instituții acoperite' },
    { nr: 'AI', label: 'Scanare asistată' },
    { nr: '100%', label: 'Gratuit' },
  ];

  const colorMap = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">

      {/* NAV */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏛️</span>
          <span className="font-black text-xl">Asistent <span className="text-blue-600">Birocratic</span></span>
        </div>
        <button onClick={() => navigate('/dashboard')}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors">
          Deschide aplicația →
        </button>
      </nav>

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-4 py-2 rounded-full mb-8">
          <span>✨</span> Proiect de Licență — UPT AC TI-RO 2026
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-6">
          Formulare oficiale,<br />
          <span className="text-blue-600">fără bătaie de cap</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Completezi datele o singură dată, aplicația generează documentul oficial gata de depus la ANAF, Primărie sau DRPCIV.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => navigate('/dashboard')}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-blue-600 transition-all shadow-xl hover:shadow-blue-200">
            Începe acum — gratuit →
          </button>
          <button onClick={() => document.getElementById('formulare').scrollIntoView({behavior:'smooth'})}
            className="bg-slate-100 text-slate-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-all">
            Vezi formulare disponibile
          </button>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-slate-900 py-12">
        <div className="max-w-4xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s,i) => (
            <div key={i} className="text-center">
              <p className="text-4xl font-black text-white mb-1">{s.nr}</p>
              <p className="text-slate-400 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-5xl mx-auto px-8 py-20">
        <h2 className="text-3xl font-black text-center mb-12">De ce să folosești această aplicație?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f,i) => (
            <div key={i} className="flex gap-5 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-3xl shrink-0">{f.icon}</span>
              <div>
                <h3 className="font-bold text-lg mb-1">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-500 text-center max-w-3xl mx-auto leading-relaxed">
          <span className="font-semibold">*Notă:</span> Funcția opțională de scanare transmite imaginea documentului
          către serviciul AI Claude (Anthropic) exclusiv pentru extragerea automată a datelor.
          Formularele și documentele PDF sunt procesate local și nu sunt stocate de aplicație.
        </p>
      </section>

      {/* FORMULARE */}
      <section id="formulare" className="bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-8">
          <h2 className="text-3xl font-black text-center mb-4">Formulare disponibile</h2>
          <p className="text-center text-slate-500 mb-12">Selectează instituția și tipul de document</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {formulare.map((f,i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{f.icon}</span>
                  <h3 className="font-bold text-lg">{f.inst}</h3>
                </div>
                <div className="space-y-2">
                  {f.items.map((item,j) => (
                    <div key={j} className={`text-xs font-medium px-3 py-2 rounded-lg border ${colorMap[f.color]}`}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CUM FUNCTIONEAZA */}
      <section className="max-w-5xl mx-auto px-8 py-20">
        <h2 className="text-3xl font-black text-center mb-12">Cum funcționează?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { nr:'1', title:'Alegi formularul', desc:'Selectezi instituția și tipul de document de care ai nevoie' },
            { nr:'2', title:'Completezi datele', desc:'Formularul te ghidează pas cu pas, cu validare în timp real' },
            { nr:'3', title:'Descarci PDF-ul', desc:'Documentul oficial este generat instant, gata de semnat și depus' },
          ].map((step,i) => (
            <div key={i} className="text-center">
              <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-4">
                {step.nr}
              </div>
              <h3 className="font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* GDPR NOTICE */}
      <section className="bg-slate-50 py-10">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <p className="text-sm text-slate-500">
            🔒 <strong>Privacy by Design:</strong> Majoritatea operațiilor sunt efectuate local în browser. 
            <strong> Excepție face funcția opțională de scanare</strong> , care transmite imaginea documentului 
            către serviciul AI Claude exclusiv pentru extragerea informațiilor necesare completării formularului. 
            Aplicația <strong>nu păstrează</strong> copii ale documentelor scanate.

          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 text-center">
        <h2 className="text-3xl font-black mb-4">Gata să începi?</h2>
        <p className="text-slate-500 mb-8">Selectează primul formular și ai documentul în mai puțin de 5 minute.</p>
        <button onClick={() => navigate('/dashboard')}
          className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">
          Deschide aplicația →
        </button>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 py-8 text-center text-slate-400 text-sm">
        Proiect de Licență • UPT Timișoara • Facultatea AC • Specializarea TI-RO • 2026
      </footer>
    </div>
  );
}

export default LandingPage;
