import { Link } from "react-router-dom";
import { formatWhen } from "../lib/format.js";

export function Alerts({ client, fromReport = false }) {
  if (!client.alerts?.length) {
    return (
      <section className="panel" id="alertas">
        <h2>Alertas</h2>
        <p className="reason">Nenhum alerta neste seed.</p>
      </section>
    );
  }

  return (
    <section className="panel" id="alertas">
      <h2>
        Alertas <em className="count">{client.alerts.length}</em>
      </h2>
      <ul className="alerts">
        {client.alerts.map((alert) => {
          const campaign = client.campaigns.find((c) => c.id === alert.campaignId);
          const hash = `#campanha-${alert.campaignId}`;
          const body = (
            <>
              <div className="alert-top">
                <strong>{alert.condition}</strong>
                <span className={`pill status-${alert.status}`}>{alert.status}</span>
              </div>
              <small>
                {campaign ? campaign.name : alert.campaignId}
                <span className="dot">·</span>
                {alert.channel}
                <span className="dot">·</span>
                {formatWhen(alert.createdAt)}
                <span className="jump">Ir à campanha →</span>
              </small>
            </>
          );
          return (
            <li key={alert.id}>
              {fromReport ? (
                <Link to={{ pathname: "/", hash }}>{body}</Link>
              ) : (
                <a href={hash}>{body}</a>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
