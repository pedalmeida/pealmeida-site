import { Link } from "react-router-dom";
import { Alerts } from "../components/Alerts.jsx";
import { Campaigns } from "../components/Campaigns.jsx";
import { KpiStrip } from "../components/KpiStrip.jsx";
import { formatWhen } from "../lib/format.js";

export function WeeklyReportPage({ client, seed }) {
  return (
    <main className="report">
      <div className="report-toolbar no-print">
        <p>Resumo do seed · sem recalcular veredictos</p>
        <div className="report-actions">
          <button type="button" className="print-btn" onClick={() => window.print()}>
            Imprimir / PDF
          </button>
          <Link to="/">← Visão geral</Link>
        </div>
      </div>

      <header className="report-masthead">
        <p className="eyebrow">Reporting Mídia · relatório semanal</p>
        <h1>{client.name}</h1>
        <p>
          {client.descriptor}
          {seed.metaAccount?.accountId ? ` · conta ${seed.metaAccount.accountId}` : ""}
          {seed.metaAccount?.attributionSetting ? ` · ${seed.metaAccount.attributionSetting}` : ""}
        </p>
        <p className="period">
          {seed.period.label} vs {seed.period.comparison}
        </p>
      </header>

      <p className="notice">{seed.notice}</p>
      <KpiStrip client={client} />
      <Campaigns client={client} compact />
      <Alerts client={client} fromReport />

      <p className="report-meta">
        seed {seed.seedVersion} · congelado {formatWhen(seed.frozenAt)}
      </p>
    </main>
  );
}
