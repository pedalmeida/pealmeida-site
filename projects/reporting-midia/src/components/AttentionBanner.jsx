export function AttentionBanner({ client }) {
  if (!client.needsAttention) return null;
  const hasAlerts = Boolean(client.alerts?.length);
  return (
    <aside className="attention" role="status">
      <strong>Precisa de atenção</strong>
      <p>{client.attentionReason}</p>
      {hasAlerts ? (
        <p className="attention-jump">
          <a href="#alertas">Ver alerta →</a>
        </p>
      ) : null}
    </aside>
  );
}
