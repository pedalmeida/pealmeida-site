# Contrato de dados — Reporting Mídia

Fonte de verdade para o seed estático (`public/seed.json`). A UI **lê** este contrato. Não o reinterpreta.

Regras do bot Telegram / demo web: seed congelado, veredictos como **inputs**, nenhuma soma Meta + Google.

## Invariantes

1. **`verdict`, `reason` e `recommendation` são INPUTS.** A UI nunca os recalcula.
2. **`costPerResult` é pré-computado** em `tools/build-seed.mjs`: `round(spend / result, 2)`. Se `result` é 0 (campanha sem leads), `costPerResult` é **`null`**. A UI não faz a divisão.
3. **Nunca somar Meta + Google** num total único. KPIs só em `kpisBySource[]`.
4. **Nomes de campanha são literais.**

## Forma (piloto)

```
seedVersion, frozenAt, notice
metaAccount { accountId, currency, timezone, attributionSetting, apiVersion }
period { label, start, end, comparison }
clients[]
  id, name, descriptor, isPilot, needsAttention, attentionReason
  targets { costPerResult, currency }   // midpoint 15 EUR; banda €10–20
  sources[]                             // "meta" | "google"
  kpisBySource[]                        // por plataforma, nunca cruzado
    platform, spend, results, resultLabel, costPerResult, deltaPct
  campaigns[]
    id, name, platform, spend, result, resultLabel, costPerResult, deltaPct
    verdict: "boa" | "neutra" | "ma"
    reason
    recommendation: null | { kind: "reforcar" | "corrigir", suggestedAction, evidence }
  alerts[]
    id, campaignId, condition, channel, status, createdAt
```

`deltaPct` = variação do custo por resultado vs `period.comparison`. **Negativo = BOM** (mais barato).

## Fase 1 — Pedro (compact pilot)

| Campo | Valor |
| --- | --- |
| `clients[].id` | `pedro` |
| Nome | Pedro Almeida |
| Descriptor | `Lead gen — pedroalmeida.ai` |
| Fontes | Meta only |
| Conta | `metaAccount.accountId` = `2089804794903235` (EUR, Europe/Lisbon) |
| Banda CPL | **€10–20** (midpoint `targets.costPerResult = 15`) |
| Campanhas | **3** no seed actual (boa / neutra / ma). O validador aceita **3–6**. |

`notice` deve dizer que os números são **exemplos** até o **pipeline Meta** estar activo.

## Validação

`npm run seed` / `npm test` recusam o seed se `costPerResult` não bater certo, se o veredicto for inválido, se um alerta apontar para campanha inexistente, ou se `pedro` não for Meta-only com 3–6 campanhas e a conta `2089804794903235`.
