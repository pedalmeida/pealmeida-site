export function SeedFooter({ seed }) {
  const account = seed.metaAccount;
  return (
    <footer className="seed-footer">
      <span>seed {seed.seedVersion}</span>
      <span>congelado {seed.frozenAt}</span>
      {account?.accountId ? <span>Meta {account.accountId}</span> : null}
      {account?.timezone ? <span>{account.timezone}</span> : null}
      {account?.attributionSetting ? <span>{account.attributionSetting}</span> : null}
      {account?.apiVersion ? <span>{account.apiVersion}</span> : null}
    </footer>
  );
}
