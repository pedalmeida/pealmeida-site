/** Deterministic wobble so charts look hand-drawn without being random on each render. */
function jig(i, amp = 1.2) {
  return Math.sin(i * 12.9898) * amp + Math.cos(i * 78.233) * (amp * 0.35);
}

function barPath(x, y, w, h) {
  const t = jig(x, 1.1);
  const r = jig(x + 3, 0.9);
  return [
    `M ${x + t} ${y + h}`,
    `Q ${x - 0.6} ${y + h * 0.55} ${x + t * 0.4} ${y}`,
    `L ${x + w + r} ${y + jig(y, 0.6)}`,
    `Q ${x + w + 0.8} ${y + h * 0.5} ${x + w + r * 0.3} ${y + h}`,
    "Z",
  ].join(" ");
}

function shortLabel(name, max = 26) {
  return name
    .replace(/^LEADS OFFER - /i, "")
    .replace(/^Lead gen — /i, "")
    .replace(/^Meta · /i, "")
    .replace(/^Instagram post: /i, "IG · ")
    .slice(0, max);
}

export function SpendBars({ campaigns, currency = "EUR" }) {
  const width = 520;
  const height = 232;
  const pad = { l: 28, r: 12, t: 18, b: 70 };
  const max = Math.max(...campaigns.map((c) => c.spend), 1);
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const gap = 28;
  const barW = Math.min(72, (innerW - gap * Math.max(campaigns.length - 1, 0)) / Math.max(campaigns.length, 1));
  const groupW = campaigns.length * barW + gap * Math.max(campaigns.length - 1, 0);
  const offset = pad.l + Math.max((innerW - groupW) / 2, 0);

  return (
    <div className="chart-card">
      <h3>Investimento por campanha (Meta)</h3>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Barras de investimento">
        <path
          d={`M ${pad.l} ${pad.t + innerH + jig(2, 1)} C ${width * 0.4} ${pad.t + innerH + 3}, ${width * 0.7} ${pad.t + innerH - 2}, ${width - pad.r} ${pad.t + innerH}`}
          fill="none"
          stroke="rgba(244,241,234,0.25)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {campaigns.map((c, i) => {
          const h = (c.spend / max) * innerH;
          const x = offset + i * (barW + gap);
          const y = pad.t + innerH - h;
          const fill = c.verdict === "ma" ? "#e15a4a" : c.verdict === "boa" ? "#3dba7a" : "#c4a35a";
          return (
            <g key={c.id}>
              <path d={barPath(x, y, barW, h)} fill={fill} opacity="0.82" />
              <text
                x={x + barW / 2}
                y={height - 36}
                textAnchor="middle"
                fill="#8a8680"
                fontSize="10"
                transform={`rotate(-18 ${x + barW / 2} ${height - 36})`}
              >
                {shortLabel(c.name, 24)}
              </text>
            </g>
          );
        })}
        <text x={pad.l} y={14} fill="#8a8680" fontSize="10">
          {currency}
        </text>
      </svg>
    </div>
  );
}

export function CprSparkline({ campaigns, target }) {
  const width = 420;
  const height = 220;
  const pad = { l: 36, r: 16, t: 22, b: 40 };
  const plotted = campaigns.filter((c) => typeof c.costPerResult === "number");
  const skipped = campaigns.length - plotted.length;

  if (plotted.length === 0) {
    return (
      <div className="chart-card">
        <h3>Custo por lead vs alvo (pré-computado)</h3>
        <p className="reason">Nenhuma campanha com custo por resultado neste seed.</p>
      </div>
    );
  }

  const values = plotted.map((c) => c.costPerResult);
  const max = Math.max(...values, target, 1) * 1.12;
  const min = 0;
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const step = innerW / Math.max(plotted.length - 1, 1);

  const pts = plotted.map((c, i) => {
    const x = pad.l + i * step + jig(i, 1.4);
    const y = pad.t + innerH - ((c.costPerResult - min) / (max - min)) * innerH + jig(i + 4, 1.1);
    return { x, y, c };
  });

  const d = pts
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = pts[i - 1];
      const cx = (prev.x + p.x) / 2;
      return `Q ${cx} ${prev.y + jig(i, 3)} ${p.x} ${p.y}`;
    })
    .join(" ");

  const targetY = pad.t + innerH - ((target - min) / (max - min)) * innerH;

  return (
    <div className="chart-card">
      <h3>Custo por lead vs alvo (pré-computado)</h3>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Linha de custo por lead">
        <path
          d={`M ${pad.l} ${targetY} L ${width - pad.r} ${targetY + jig(8, 1.5)}`}
          stroke="#ff6b35"
          strokeDasharray="5 7"
          strokeWidth="1.5"
          fill="none"
        />
        <text x={width - pad.r} y={targetY - 6} textAnchor="end" fill="#ff6b35" fontSize="10">
          alvo {target}
        </text>
        <path d={d} fill="none" stroke="#f4f1ea" strokeWidth="2.3" strokeLinecap="round" />
        {pts.map((p) => (
          <g key={p.c.id}>
            <circle
              cx={p.x}
              cy={p.y}
              r="4.2"
              fill={p.c.verdict === "ma" ? "#e15a4a" : p.c.verdict === "boa" ? "#3dba7a" : "#c4a35a"}
              stroke="#0e0e10"
              strokeWidth="1.2"
            />
            <text x={p.x} y={height - 12} textAnchor="middle" fill="#8a8680" fontSize="9">
              {shortLabel(p.c.name, 16)}
            </text>
          </g>
        ))}
      </svg>
      {skipped > 0 ? (
        <p className="chart-note">
          {skipped === 1
            ? "1 campanha sem custo por resultado (0 leads) fica de fora da linha."
            : `${skipped} campanhas sem custo por resultado (0 leads) ficam de fora da linha.`}
        </p>
      ) : null}
    </div>
  );
}
