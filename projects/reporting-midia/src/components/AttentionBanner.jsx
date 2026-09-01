export function AttentionBanner({ client }) {
  if (!client.needsAttention) return null;
  return (
    <aside className="attention" role="status">
      <strong>Precisa de atenção</strong>
      {client.attentionReason}
    </aside>
  );
}
