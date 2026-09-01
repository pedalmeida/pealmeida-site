# Reporting Mídia

Dashboard pessoal de inteligência de mídia paga — **Pedro Almeida**. Sem marca de cliente. Não é a demo SAVAGE.

SPA React 19 + Vite 6, a viver inteiramente em `projects/reporting-midia/`. Dados via seed estático (`public/seed.json`). A UI **não** recalcula veredictos nem `costPerResult`.

Live (depois do deploy do site): `https://pealmeida.com/projects/reporting-midia/`

## Correr localmente

```bash
cd projects/reporting-midia
npm install
npm run dev
```

Abrir `http://localhost:5173/projects/reporting-midia/` (o `base` do Vite é esse path, igual ao da produção).

O cliente piloto na UI é **Pedro Almeida** (`id: pedro`), Meta-only, alvo 15 EUR/lead. Os números do seed são exemplos até existir pipeline Meta → seed.

## Testes e build

```bash
cd projects/reporting-midia
npm test
npm run build
```

- `npm run seed` — valida invariantes e escreve `public/seed.json`
- `npm test` — contrato + invariantes da UI (não recalcular CPR / veredictos)
- `npm run build` — seed + Vite → `dist/`, com cópia de `index.html` em `dist/relatorio/` para o fallback estático

## Contrato

Ver [`CONTRATO-DADOS.md`](./CONTRATO-DADOS.md). Resumo:

1. `verdict` / `reason` / `recommendation` são inputs
2. `costPerResult` = `round(spend / result, 2)` no build do seed
3. Nunca somar Meta + Google
4. Nomes de campanha literais

## Deploy no pealmeida-site

O Worker (`wrangler.jsonc`) serve o directório `.deploy/` como assets estáticos. `deploy.sh` na raiz do repo:

1. Copia `index.html`, `robots.txt` e os projectos estáticos
2. Faz `npm ci && npm run build` **neste** pacote
3. Substitui `.deploy/projects/reporting-midia/` pelo conteúdo de `dist/`

Assim `/projects/reporting-midia/` é a SPA compilada, não a árvore-fonte (nem `node_modules`).

Rotas conhecidas da Fase 1:

| URL | O quê |
| --- | --- |
| `/projects/reporting-midia/` | visão do cliente piloto |
| `/projects/reporting-midia/relatorio/` | placeholder do relatório semanal (Fase 3) |

Refresh profundo noutros paths não tem rewrite global no Worker (o site inteiro não é uma SPA). Novas rotas: acrescentar a pasta em `spaRouteCopies` no `vite.config.js`.

## Fora de âmbito (Fase 1)

- API real da Meta
- Bot Telegram / PDF por email
- Qualquer coisa `savage-*`
