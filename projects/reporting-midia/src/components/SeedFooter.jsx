export function SeedFooter({ seed }) {
  return (
    <footer className="seed-footer">
      <span>seed {seed.seedVersion}</span>
      <span>congelado {seed.frozenAt}</span>
    </footer>
  );
}
