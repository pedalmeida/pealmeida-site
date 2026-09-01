import { useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { loadSeed } from "./lib/loadSeed.js";
import { ClientPage } from "./pages/ClientPage.jsx";
import { WeeklyReportPage } from "./pages/WeeklyReportPage.jsx";
import { SeedFooter } from "./components/SeedFooter.jsx";

export default function App() {
  const [seed, setSeed] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSeed().then(setSeed).catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <p className="error">{error}</p>;
  }
  if (!seed) {
    return <p className="loading">A carregar o seed…</p>;
  }

  const client = seed.clients.find((c) => c.id === "pedro") ?? seed.clients[0];

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <strong>Reporting Mídia</strong>
          <span>Inteligência de mídia paga · pessoal</span>
        </div>
        <nav>
          <NavLink to="/" end>
            Visão geral
          </NavLink>
          <NavLink to="/relatorio">Relatório semanal</NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<ClientPage seed={seed} client={client} />} />
        <Route path="/relatorio" element={<WeeklyReportPage seed={seed} client={client} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <SeedFooter seed={seed} />
    </div>
  );
}
