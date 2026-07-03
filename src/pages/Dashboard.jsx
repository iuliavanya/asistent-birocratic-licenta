import React from 'react';
import { useNavigate } from 'react-router-dom';

const FORMULARE = [
  {
    icon: '🏦', title: 'ANAF', color: 'blue',
    desc: 'Formulare fiscale pentru persoane fizice',
    buttons: [
      { path:'/anaf/adeverinta', label:'Cerere Adeverință Venit', badge: null },
      { path:'/anaf/d212', label:'Declarație Unică D212', badge: 'Popular' },
    ]
  },
  {
    icon: '🌳', title: 'Primărie', color: 'green',
    desc: 'Cereri pentru servicii administrative locale',
    buttons: [
      { path:'/primarie/parcare', label:'Cerere Parcare Reședință', badge: null },
      { path:'/primarie/transcriere', label:'Cerere Transcriere Act', badge: 'Nou' },
    ]
  },
  {
    icon: '🚗', title: 'Înmatriculări', color: 'orange',
    desc: 'Documente pentru vehicule și tranzacții auto',
    buttons: [
      { path:'/auto', label:'Contract Vânzare-Cumpărare', badge: null },
      { path:'/auto/inmatriculare', label:'Cerere Înmatriculare Vehicul', badge: null },
    ]
  },
];

const colorConfig = {
  blue:   { bg:'bg-blue-100',   hoverBg:'bg-blue-600',   text:'text-blue-600',   btn:'hover:bg-blue-600',   badge:'bg-blue-600' },
  green:  { bg:'bg-green-100',  hoverBg:'bg-green-600',  text:'text-green-600',  btn:'hover:bg-green-600',  badge:'bg-green-600' },
  orange: { bg:'bg-orange-100', hoverBg:'bg-orange-600', text:'text-orange-600', btn:'hover:bg-orange-600', badge:'bg-orange-600' },
};

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

      {/* NAV */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-white">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <span className="text-xl">🏛️</span>
          <span className="font-black text-lg">Asistent <span className="text-blue-600">Birocratic</span></span>
        </button>
        
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span>Scanare AI | Validare automată </span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-12">

        {/* HEADER */}
        <div className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 mb-3">
            Bun venit! 👋
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl">
            Selectează instituția și tipul de formular. 
          </p>
        </div>

        {/* STATS RAPIDE */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { nr:'6', label:'Formulare disponibile', icon:'📋' },
            { nr:'3', label:'Instituții acoperite', icon:'🏛️' },
            { nr:'~5 min', label:'Timp mediu completare', icon:'⚡' },
          ].map((s,i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center gap-4">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="text-2xl font-black text-slate-900">{s.nr}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CARDURI INSTITUTII */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FORMULARE.map((card, i) => {
            const c = colorConfig[card.color];
            return (
              <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">

                {/* Card header */}
                <div className={`p-6 border-b border-slate-100`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center group-hover:${c.hoverBg} transition-colors`}>
                      <span className={`${c.text} group-hover:text-white text-lg`}>{card.icon}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-black">{card.title}</h2>
                      <p className="text-xs text-slate-400">{card.buttons.length} formulare</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">{card.desc}</p>
                </div>

                {/* Butoane formulare */}
                <div className="p-4 space-y-2">
                  {card.buttons.map((btn, j) => (
                    <button key={j} onClick={() => navigate(btn.path)}
                      className={`w-full flex items-center justify-between bg-slate-900 text-white py-3 px-4 rounded-xl font-bold ${c.btn} transition-colors text-sm group/btn`}>
                      <span>{btn.label}</span>
                      <div className="flex items-center gap-2">
                        {btn.badge && (
                          <span className={`${c.badge} text-white text-xs px-2 py-0.5 rounded-full font-bold`}>
                            {btn.badge}
                          </span>
                        )}
                        <span className="opacity-50 group-hover/btn:opacity-100 transition-opacity">→</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* GDPR NOTICE */}
        <div className="mt-10 bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start">
          <span className="text-2xl shrink-0">🔒</span>
          <div>
            <p className="font-bold text-sm text-blue-900 mb-1">Privacy by Design</p>
            <p className="text-xs text-blue-700 leading-relaxed">
              Majoritatea operațiilor sunt efectuate local în browser. 
            <strong> Excepție face funcția opțională de scanare</strong> , care transmite imaginea documentului 
            către serviciul AI Claude exclusiv pentru extragerea informațiilor necesare completării formularului. 
            Aplicația <strong>nu păstrează</strong> copii ale documentelor scanate.
            </p>
          </div>
        </div>

      </div>

      <footer className="text-center text-slate-400 text-xs py-8 border-t border-slate-100">
        Proiect de Licență • UPT Timișoara • Facultatea AC • TI-RO • 2026
      </footer>
    </div>
  );
}

export default Dashboard;
////
