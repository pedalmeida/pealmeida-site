import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AttentionBanner } from "../components/AttentionBanner.jsx";
import { Alerts } from "../components/Alerts.jsx";
import { Campaigns } from "../components/Campaigns.jsx";
import { CprSparkline, SpendBars } from "../components/HandCharts.jsx";
import { KpiStrip } from "../components/KpiStrip.jsx";

function campaignIdFromHash(hash) {
  return hash.startsWith("#campanha-") ? hash.slice("#campanha-".length) : "";
}

function tallyBadges(campaigns) {
  const counts = { boa: 0, neutra: 0, ma: 0 };
  for (const campaign of campaigns) {
    if (counts[campaign.verdict] != null) counts[campaign.verdict] += 1;
  }
  return counts;
}

export function ClientPage({ seed, client }) {
  const location = useLocation();
  const [highlightId, setHighlightId] = useState("");
  const mix = tallyBadges(client.campaigns);

  useEffect(() => {
    const hash = location.hash || window.location.hash;
    setHighlightId(campaignIdFromHash(hash));
    const id = hash.replace(/^#/, "");
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);

  return (
    <main>
      <p className="notice">{seed.notice}</p>
      <div className="hero">
        <div>
          <h1>{client.name}</h1>
          <p>
            {client.descriptor} · {seed.period.label} vs {seed.period.comparison}
          </p>
          <p className="verdict-mix">
            {client.campaigns.length} campanhas · {mix.boa} boa · {mix.neutra} neutra · {mix.ma} má
          </p>
        </div>
        <div className="pills">
          {client.isPilot ? <span className="pill pilot">Cliente piloto</span> : null}
          {client.sources.map((src) => (
            <span className="pill" key={src}>
              {src === "meta" ? "Meta · Fase 1" : "Google"}
            </span>
          ))}
          {seed.metaAccount?.accountId ? (
            <span className="pill">conta {seed.metaAccount.accountId}</span>
          ) : null}
          {seed.metaAccount?.attributionSetting ? (
            <span className="pill">{seed.metaAccount.attributionSetting}</span>
          ) : null}
        </div>
      </div>
      <AttentionBanner client={client} />
      <KpiStrip client={client} />
      <section className="panel">
        <h2>Leitura rápida</h2>
        <div className="charts">
          <SpendBars campaigns={client.campaigns} currency={client.targets.currency} />
          <CprSparkline campaigns={client.campaigns} target={client.targets.costPerResult} />
        </div>
      </section>
      <Campaigns client={client} highlightId={highlightId} />
      <Alerts client={client} />
    </main>
  );
}
