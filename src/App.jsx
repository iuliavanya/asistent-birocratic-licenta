import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AutoForm from './pages/AutoForm';
import ParcareForm from './pages/ParcareForm';
import AdeverintaForm from './pages/AdeverintaForm';
import TranscrierForm from './pages/TranscrierForm';
import InmatriculareForm from './pages/InmatriculareForm';
import D212Form from './pages/D212Form';
import MetricsPage from './pages/MetricsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/auto" element={<AutoForm />} />
        <Route path="/auto/inmatriculare" element={<InmatriculareForm />} />
        <Route path="/primarie/parcare" element={<ParcareForm />} />
        <Route path="/primarie/transcriere" element={<TranscrierForm />} />
        <Route path="/anaf/adeverinta" element={<AdeverintaForm />} />
        <Route path="/anaf/d212" element={<D212Form />} />
        {/* Pagina interna pentru testare utilizabilitate — nu apare in navigare */}
        <Route path="/metrics" element={<MetricsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
