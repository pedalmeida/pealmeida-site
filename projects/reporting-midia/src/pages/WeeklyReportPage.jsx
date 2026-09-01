import { Link } from "react-router-dom";

export function WeeklyReportPage({ client }) {
  return (
    <main className="placeholder">
      <span className="phase">Fase 3 · placeholder</span>
      <h1>Relatório semanal</h1>
      <p>
        O envio automático (email / PDF) entra na Fase 3. Por agora o seed de {client.name} já
        alimenta a visão geral — o relatório vai ler o mesmo contrato, sem recalcular veredictos.
      </p>
      <Link to="/">← Voltar à visão geral</Link>
    </main>
  );
}
