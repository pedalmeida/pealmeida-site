# Contrato de dados — Reporting Mídia

Fonte de verdade para o seed estático (`public/seed.json`). A UI **lê** este contrato. Não o reinterpreta.

O mesmo conjunto de regras vale para o bot Telegram e para a demo web: um seed congelado, veredictos calculados **antes** de chegar ao ecrã, e nenhuma soma Meta + Google.

## Invariantes

1. **`verdict`, `reason` e `recommendation` são INPUTS.** A UI nunca recalcula veredictos, nunca deriva `boa` / `neutra` / `ma` a partir de `costPerResult`, e nunca reescreve a razão. Mostra o que o seed traz.
2. **`costPerResult` é pré-computado no `tools/build-seed.mjs`.** Fórmula: `round(spend / result, 2)` (duas casas decimais). A UI não faz `spend / results`.
3. **Nunca somar Meta + Google num total único.** KPIs vivem em `kpisBySource[]`, um objecto por plataforma. Não existe campo `totalSpend` / `totalResults` no seed, e a UI não o inventa.
4. **Nomes de campanha são literais.** O texto em `campaigns[].name` é o que se mostra. Sem normalização, sem “Campaign #3”, sem reescrita.

## Forma

```
seedVersion: string
frozenAt: string (ISO-8601)
notice: string
period: { label, start, end, comparison }
clients[]:
  id, name, descriptor, isPilot, needsAttention, attentionReason
  targets: { costPerResult, currency }
  sources[]            // "meta" | "google"
  kpisBySource[]       // um por plataforma, nunca cruzado
    platform, spend, results, resultLabel, costPerResult, deltaPct
  campaigns[]
    id, name, platform, spend, result, resultLabel, costPerResult, deltaPct
    verdict: "boa" | "neutra" | "ma"
    reason: string
    recommendation: null | { kind: "reforcar" | "corrigir", suggestedAction, evidence }
  alerts[]
    id, campaignId, condition, channel, status, createdAt
```

### `deltaPct`

Variação do **custo por resultado** face ao período em `period.comparison`.  
**Negativo = BOM** (mais barato). Positivo = mais caro.

A UI traduz o número em palavras (`mais barato` / `mais caro`) mas não altera o valor.

### `kpisBySource[].costPerResult`

Também pré-computado: `round(sum(spend) / sum(results), 2)` **dentro da mesma plataforma**. Não misturar plataformas.

### Alertas

`alerts[].campaignId` tem de existir em `campaigns[]` do mesmo cliente. A UI liga o alerta à campanha; não reavalia a condição.

## Fase 1 — cliente piloto

| Campo | Valor |
| --- | --- |
| `id` | `pedro` |
| `name` | Pedro Almeida |
| `descriptor` | Lead gen — pedroalmeida.ai |
| Fontes | Meta only |
| Alvo | `targets.costPerResult = 15`, `currency = "EUR"` (leads) |

`notice` tem de deixar claro que os números são **exemplos** até o pipeline Meta → seed estar activo. Não são dados reais da conta.

## O que o seed builder valida

`tools/build-seed.mjs` (e `npm test`) recusam o seed se:

- faltar `seedVersion`, `frozenAt`, `notice`, `period`, `clients`
- `costPerResult` ≠ `round(spend / result, 2)` (campanhas e KPIs)
- existir mais do que uma plataforma misturada num único KPI
- `verdict` fora de `boa | neutra | ma`
- `recommendation.kind` fora de `reforcar | corrigir` (quando não é `null`)
- `sources` contiver valores fora de `meta | google`
- um alerta apontar para `campaignId` inexistente
- o cliente `pedro` não for piloto Meta-only com alvo 15 EUR

## Fora deste contrato

- Chamadas reais à API da Meta
- Recalcular veredictos no cliente
- Somar plataformas
- Branding SAVAGE / ALVA
