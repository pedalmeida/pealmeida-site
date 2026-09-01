import { useEffect, useState } from "react";
import { AttentionBanner } from "../components/AttentionBanner.jsx";
import { Alerts } from "../components/Alerts.jsx";
import { Campaigns } from "../components/Campaigns.jsx";
import { CprSparkline, SpendBars } from "../components/HandCharts.jsx";
import { KpiStrip } from "../components/KpiStrip.jsx";

function campaignIdFromHash() {
  const hash = window.location.hash;
  return hash.startsWith("#campanha-") ? hash.slice("#campanha-".length) : "";
}

export function ClientPage({ seed, client }) {
  const [highlightId, setHighlightId] = useState("");

  useEffect(() => {
    const sync = () => {
      setHighlightId(campaignIdFromHash());
      const id = window.location.hash.slice(1);
      if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return (
    <main>
      <p className="notice">{seed.notice}</p>
      <div className="hero">
        <div>
          <h1>{client.name}</h1>
          <p>
            {client.descriptor} · {seed.period.label} vs {seed.period.comparison}
          </p>
        </div>
        <div className="pills">
          {client.isPilot ? <span className="pill pilot">Cliente piloto</span> : null}
          {client.sources.map((src) => (
            <span className="pill" key={src}>
              {src === "meta" ? "Meta · Fase 1" : "Google"}
            </span>
          ))}
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
