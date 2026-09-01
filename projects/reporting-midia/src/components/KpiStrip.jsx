import { formatDelta, isFiniteNumber, money, number } from "../lib/format.js";

export function KpiStrip({ client }) {
  const currency = client.targets.currency;
  return (
    <section className="kpis" aria-label="KPIs por fonte">
      {client.kpisBySource.map((kpi) => {
        const delta = formatDelta(kpi.deltaPct);
        const platform = kpi.platform === "meta" ? "Meta" : "Google";
        return (
          <div className="kpi-source" key={kpi.platform}>
            <p className="kpi-source-label">{platform} · só esta plataforma</p>
            <div className="kpi-row">
              <article className="kpi">
                <div className="label">Investimento</div>
                <div className="value">{money(kpi.spend, currency)}</div>
              </article>
              <article className="kpi">
                <div className="label">{kpi.resultLabel}</div>
                <div className="value">{number(kpi.results)}</div>
              </article>
              <article className="kpi">
                <div className="label">Custo por lead</div>
                <div className="value">
                  {isFiniteNumber(kpi.costPerResult) ? money(kpi.costPerResult, currency) : "—"}
                </div>
                <div className={`hint ${delta.tone}`}>
                  alvo {money(client.targets.costPerResult, currency)} · {delta.text}
                </div>
              </article>
            </div>
          </div>
        );
      })}
    </section>
  );
}
