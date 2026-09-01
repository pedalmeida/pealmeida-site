export function money(value, currency = "EUR") {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function number(value) {
  return new Intl.NumberFormat("pt-PT").format(value);
}

export function formatDelta(deltaPct) {
  if (deltaPct == null || Number.isNaN(deltaPct)) {
    return { text: "sem comparação", tone: "flat" };
  }
  const abs = Math.abs(deltaPct).toLocaleString("pt-PT", {
    maximumFractionDigits: 1,
    minimumFractionDigits: Number.isInteger(deltaPct) ? 0 : 1,
  });
  if (deltaPct < 0) {
    return { text: `−${abs}% mais barato`, tone: "good" };
  }
  if (deltaPct > 0) {
    return { text: `+${abs}% mais caro`, tone: "bad" };
  }
  return { text: "igual ao período anterior", tone: "flat" };
}

export function formatWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function verdictLabel(verdict) {
  if (verdict === "boa") return "Boa";
  if (verdict === "ma") return "Má";
  return "Neutra";
}

export function statusLabel(status) {
  if (status === "ACTIVE") return "Activa";
  if (status === "PAUSED") return "Pausada";
  return status;
}
