export function VerdictBadge({ verdict }) {
  const label = verdict === "boa" ? "Boa" : verdict === "ma" ? "Má" : "Neutra";
  return <span className={`badge ${verdict}`}>{label}</span>;
}
