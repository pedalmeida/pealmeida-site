import { formatWhen } from "../lib/format.js";

export function Alerts({ client }) {
  if (!client.alerts?.length) {
    return (
      <section className="panel">
        <h2>Alertas</h2>
        <p className="reason">Nenhum alerta neste seed.</p>
      </section>
    );
  }

  return (
    <section className="panel" id="alertas">
      <h2>Alertas</h2>
      <ul className="alerts">
        {client.alerts.map((alert) => {
          const campaign = client.campaigns.find((c) => c.id === alert.campaignId);
          return (
            <li key={alert.id}>
              <a href={`#campanha-${alert.campaignId}`}>
                <strong>{alert.condition}</strong>
                <small>
                  {campaign ? campaign.name : alert.campaignId} · {alert.channel} · {alert.status} ·{" "}
                  {formatWhen(alert.createdAt)}
                </small>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
