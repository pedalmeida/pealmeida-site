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

O cliente piloto na UI é **Pedro Almeida** (`id: pedro`), Meta-only, alvo ~15 EUR/lead, 3 campanhas. Seed de demo até existir refresh live.

## Testes e build

```bash
cd projects/reporting-midia
npm test
npm run build
```

- `npm run seed` — valida invariantes e escreve `public/seed.json`
- `npm test` — contrato + invariantes da UI
- `npm run build` — seed + Vite → `dist/` (`base: /projects/reporting-midia/`)

## Publicar

Na raiz do repo:

```bash
./deploy.sh
```

Isto faz `npm ci && npm run build` em `projects/reporting-midia/`, copia `dist/` para `.deploy/projects/reporting-midia/`, e corre `wrangler deploy`. Depois: `https://pealmeida.com/projects/reporting-midia/`

Rotas conhecidas da Fase 1:

| URL | O quê |
| --- | --- |
| `/projects/reporting-midia/` | visão do cliente piloto |
| `/projects/reporting-midia/relatorio/` | relatório semanal simples (mesmo seed) |

Refresh profundo noutros paths não tem rewrite global no Worker (o site inteiro não é uma SPA). Novas rotas: acrescentar a pasta em `spaRouteCopies` no `vite.config.js`.

## Fora de âmbito (Fase 1)

- API real da Meta
- Bot Telegram / PDF por email
- Qualquer coisa `savage-*`
