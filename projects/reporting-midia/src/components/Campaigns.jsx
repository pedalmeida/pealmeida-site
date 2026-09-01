import { formatDelta, isFiniteNumber, money, number, statusLabel } from "../lib/format.js";
import { VerdictBadge } from "./VerdictBadge.jsx";

export function Campaigns({ client, highlightId, compact = false }) {
  const currency = client.targets.currency;
  return (
    <section className="panel" id="campanhas">
      <h2>
        Campanhas <em className="count">{client.campaigns.length}</em>
      </h2>
      <div className="campaigns">
        {client.campaigns.map((campaign) => {
          const delta = formatDelta(campaign.deltaPct);
          const rec = campaign.recommendation;
          return (
            <article
              key={campaign.id}
              id={`campanha-${campaign.id}`}
              className={`campaign verdict-${campaign.verdict}${highlightId === campaign.id ? " highlight" : ""}`}
            >
              <div className="campaign-head">
                <h3>{campaign.name}</h3>
                <div className="campaign-tags">
                  {campaign.status ? (
                    <span className={`pill status-${campaign.status}`}>{statusLabel(campaign.status)}</span>
                  ) : null}
                  <VerdictBadge verdict={campaign.verdict} />
                </div>
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
                  {isFiniteNumber(campaign.costPerResult)
                    ? money(campaign.costPerResult, currency)
                    : "—"}
                  {campaign.result === 0 ? <em className="flat">sem leads</em> : null}
                </div>
                <div>
                  <span>vs período anterior</span>
                  <em className={delta.tone}>{delta.text}</em>
                </div>
              </div>
              <p className="reason">{campaign.reason}</p>
              {!compact && rec ? (
                <div className={`reco reco-${rec.kind}`}>
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
