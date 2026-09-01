import { formatDelta, money, number } from "../lib/format.js";

export function KpiStrip({ client }) {
  const currency = client.targets.currency;
  return (
    <section className="kpis" aria-label="KPIs por fonte">
      {client.kpisBySource.map((kpi) => (
        <article className="kpi" key={kpi.platform}>
          <div className="label">{kpi.platform === "meta" ? "Meta" : "Google"} · investimento</div>
          <div className="value">{money(kpi.spend, currency)}</div>
          <div className="hint">só esta plataforma — sem totais cruzados</div>
        </article>
      ))}
      {client.kpisBySource.map((kpi) => (
        <article className="kpi" key={`${kpi.platform}-results`}>
          <div className="label">{kpi.resultLabel}</div>
          <div className="value">{number(kpi.results)}</div>
          <div className="hint">volume no período</div>
        </article>
      ))}
      {client.kpisBySource.map((kpi) => {
        const delta = formatDelta(kpi.deltaPct);
        return (
          <article className="kpi" key={`${kpi.platform}-cpr`}>
            <div className="label">Custo por {kpi.resultLabel.replace(/s$/, "")}</div>
            <div className="value">{money(kpi.costPerResult, currency)}</div>
            <div className={`hint ${delta.tone}`}>
              alvo {money(client.targets.costPerResult, currency)} · {delta.text}
            </div>
          </article>
        );
      })}
    </section>
  );
}
