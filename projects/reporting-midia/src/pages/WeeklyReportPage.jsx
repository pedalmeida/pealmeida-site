import { Link } from "react-router-dom";
import { VerdictBadge } from "../components/VerdictBadge.jsx";
import { formatDelta, money, number } from "../lib/format.js";

export function WeeklyReportPage({ client, seed }) {
  const currency = client.targets.currency;
  const meta = client.kpisBySource.find((k) => k.platform === "meta");

  return (
    <main>
      <p className="notice">{seed.notice}</p>
      <div className="hero">
        <div>
          <h1>Relatório semanal</h1>
          <p>
            {client.name} · {seed.period.label} vs {seed.period.comparison}
          </p>
        </div>
        <div className="pills">
          <span className="pill">Meta</span>
          <span className="pill">conta {seed.metaAccount?.accountId}</span>
        </div>
      </div>

      {meta ? (
        <section className="kpis" aria-label="Resumo Meta">
          <article className="kpi">
            <div className="label">Investimento</div>
            <div className="value">{money(meta.spend, currency)}</div>
          </article>
          <article className="kpi">
            <div className="label">{meta.resultLabel}</div>
            <div className="value">{number(meta.results)}</div>
          </article>
          <article className="kpi">
            <div className="label">Custo por lead</div>
            <div className="value">{money(meta.costPerResult, currency)}</div>
            <div className="hint">alvo {money(client.targets.costPerResult, currency)}</div>
          </article>
        </section>
      ) : null}

      <section className="panel">
        <h2>Campanhas</h2>
        <div className="campaigns">
          {client.campaigns.map((campaign) => {
            const delta = formatDelta(campaign.deltaPct);
            return (
              <article key={campaign.id} className="campaign">
                <div className="campaign-head">
                  <h3>{campaign.name}</h3>
                  <VerdictBadge verdict={campaign.verdict} />
                </div>
                <div className="meta-row">
                  <div>
                    <span>Investimento</span>
                    {money(campaign.spend, currency)}
                  </div>
                  <div>
                    <span>{campaign.resultLabel}</span>
                    {number(campaign.result)}
                  </div>
                  <div>
                    <span>Custo por resultado</span>
                    {money(campaign.costPerResult, currency)}
                  </div>
                  <div>
                    <span>vs período anterior</span>
                    <em className={delta.tone} style={{ fontStyle: "normal" }}>
                      {delta.text}
                    </em>
                  </div>
                </div>
                <p className="reason">{campaign.reason}</p>
              </article>
            );
          })}
        </div>
      </section>

      <p style={{ marginTop: "1rem" }}>
        <Link to="/">← Visão geral</Link>
      </p>
    </main>
  );
}
