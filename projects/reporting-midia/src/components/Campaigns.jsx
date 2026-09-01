import { formatDelta, money, number } from "../lib/format.js";
import { VerdictBadge } from "./VerdictBadge.jsx";

export function Campaigns({ client, highlightId }) {
  const currency = client.targets.currency;
  return (
    <section className="panel" id="campanhas">
      <h2>Campanhas</h2>
      <div className="campaigns">
        {client.campaigns.map((campaign) => {
          const delta = formatDelta(campaign.deltaPct);
          const rec = campaign.recommendation;
          return (
            <article
              key={campaign.id}
              id={`campanha-${campaign.id}`}
              className={`campaign${highlightId === campaign.id ? " highlight" : ""}`}
            >
              <div className="campaign-head">
                <h3>{campaign.name}</h3>
                <span style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                  {campaign.status ? <span className="pill">{campaign.status}</span> : null}
                  <VerdictBadge verdict={campaign.verdict} />
                </span>
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
              {rec ? (
                <div className="reco">
                  <strong>{rec.kind === "reforcar" ? "Reforçar" : "Corrigir"}.</strong>{" "}
                  {rec.suggestedAction} <em>({rec.evidence})</em>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
