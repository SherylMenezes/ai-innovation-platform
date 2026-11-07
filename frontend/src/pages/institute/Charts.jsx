import { useLayoutEffect, useRef, useState } from "react";

// Shared chart pieces for the Reports page. Marks follow the dataviz specs: bars <= 16px with a
// 4px rounded data-end, 2px lines, hairline grid, a 2px surface gap between stacked segments,
// a tooltip on hover/focus for every mark, and a table view for every chart.

function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

function niceMax(value) {
  if (value <= 0) return 1;
  const step = 10 ** Math.floor(Math.log10(value));
  const n = value / step;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * step;
}

const fmt = (v) => (Math.abs(v) >= 10000 ? `${Math.round(v / 1000)}K` : Math.round(v).toLocaleString("en-IN"));

function Tooltip({ tip }) {
  if (!tip) return null;
  return (
    <div className="ch-tip" style={{ left: tip.x, top: tip.y }} role="presentation">
      {tip.title && <span className="ch-tip-title">{tip.title}</span>}
      {tip.rows.map((r) => (
        <span key={r.label} className="ch-tip-row">
          {r.color && <i style={{ background: r.color }} aria-hidden="true" />}
          <strong>{r.value}</strong>
          <span>{r.label}</span>
        </span>
      ))}
    </div>
  );
}

// Positions the tooltip relative to the chart body from a pointer or focus event.
function tipAt(e, body, title, rows) {
  const box = body.getBoundingClientRect();
  const source = e.clientX != null && e.clientX !== 0 ? e : e.currentTarget.getBoundingClientRect();
  const x = (source.clientX ?? source.left + source.width / 2) - box.left;
  const y = (source.clientY ?? source.top) - box.top;
  return { x: Math.min(Math.max(x, 70), box.width - 70), y, title, rows };
}

export function Legend({ items }) {
  return (
    <ul className="ch-legend">
      {items.map((item) => (
        <li key={item.label}>
          <i className={item.shape === "line" ? "is-line" : undefined} style={{ background: item.color }} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

// Card wrapper with a Chart / Table switch. `table` is { columns, rows } with plain values.
export function ChartCard({ title, subtitle, legend, table, children, id }) {
  const [view, setView] = useState("chart");
  return (
    <section className="inst-card ch-card" aria-labelledby={`${id}-title`}>
      <header className="ch-card-head">
        <div>
          <h2 id={`${id}-title`} className="inst-card-title">{title}</h2>
          {subtitle && <p className="inst-card-sub">{subtitle}</p>}
        </div>
        {table && (
          <div className="inst-segmented ch-view" role="group" aria-label={`${title} view`}>
            <button type="button" aria-pressed={view === "chart"} className={view === "chart" ? "is-on" : ""} onClick={() => setView("chart")}>Chart</button>
            <button type="button" aria-pressed={view === "table"} className={view === "table" ? "is-on" : ""} onClick={() => setView("table")}>Table</button>
          </div>
        )}
      </header>
      {view === "chart" ? (
        <>
          {legend && legend.length > 1 && <Legend items={legend} />}
          {children}
        </>
      ) : (
        <div className="ch-table-wrap">
          <table className="ch-table">
            <thead><tr>{table.columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// Horizontal bars, one series. data: [{ key, label, value, valueLabel? }].
// `benchmark` draws a hairline marker (e.g. the institution average) across every row.
export function BarList({ data, color, max, format = fmt, benchmark, benchmarkLabel, unit = "" }) {
  const body = useRef(null);
  const [tip, setTip] = useState(null);
  const top = max ?? niceMax(Math.max(...data.map((d) => d.value), benchmark ?? 0));
  const show = (e, d) => setTip(tipAt(e, body.current, d.label, [
    { label: unit || "Value", value: d.valueLabel ?? format(d.value), color },
    ...(benchmark != null ? [{ label: benchmarkLabel, value: format(benchmark) }] : []),
  ]));
  return (
    <div className="ch-body" ref={body} onPointerLeave={() => setTip(null)}>
      <ul className="ch-bars">
        {data.map((d) => (
          <li key={d.key}>
            <span className="ch-bar-label" title={d.label}>{d.label}</span>
            <span className="ch-bar-track">
              <span
                className="ch-bar"
                tabIndex={0}
                role="img"
                aria-label={`${d.label}: ${d.valueLabel ?? format(d.value)}`}
                style={{ width: `${(d.value / top) * 100}%`, background: color }}
                onPointerMove={(e) => show(e, d)}
                onFocus={(e) => show(e, d)}
                onBlur={() => setTip(null)}
              />
              <span className="ch-bar-value">{d.valueLabel ?? format(d.value)}</span>
              {benchmark != null && <span className="ch-benchmark" style={{ left: `${(benchmark / top) * 100}%` }} aria-hidden="true" />}
            </span>
          </li>
        ))}
      </ul>
      {benchmark != null && (
        <p className="ch-note"><span className="ch-benchmark-key" aria-hidden="true" /> {benchmarkLabel}: {format(benchmark)}</p>
      )}
      <Tooltip tip={tip} />
    </div>
  );
}

// Horizontal stacked bars. series: [{ key, label, color }]; data: [{ key, label, values: { [seriesKey]: n } }].
export function StackedBars({ data, series }) {
  const body = useRef(null);
  const [tip, setTip] = useState(null);
  const top = Math.max(...data.map((d) => series.reduce((s, x) => s + (d.values[x.key] ?? 0), 0)), 1);
  return (
    <div className="ch-body" ref={body} onPointerLeave={() => setTip(null)}>
      <ul className="ch-bars">
        {data.map((d) => {
          const total = series.reduce((s, x) => s + (d.values[x.key] ?? 0), 0);
          const parts = series.filter((x) => d.values[x.key] > 0);
          const show = (e, part) => setTip(tipAt(e, body.current, d.label, series.map((x) => ({
            label: x.label,
            value: `${d.values[x.key] ?? 0} (${total ? Math.round(((d.values[x.key] ?? 0) / total) * 100) : 0}%)`,
            color: x.color,
            active: x.key === part.key,
          }))));
          return (
            <li key={d.key}>
              <span className="ch-bar-label" title={d.label}>{d.label}</span>
              <span className="ch-bar-track">
                <span className="ch-stack" style={{ width: `${(total / top) * 100}%` }}>
                  {parts.map((part) => (
                    <span
                      key={part.key}
                      className="ch-seg"
                      tabIndex={0}
                      role="img"
                      aria-label={`${d.label}, ${part.label}: ${d.values[part.key]}`}
                      style={{ flexGrow: d.values[part.key], background: part.color }}
                      onPointerMove={(e) => show(e, part)}
                      onFocus={(e) => show(e, part)}
                      onBlur={() => setTip(null)}
                    />
                  ))}
                </span>
                <span className="ch-bar-value">{total}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <Tooltip tip={tip} />
    </div>
  );
}

const PAD = { top: 16, right: 16, bottom: 28, left: 40 };

// Vertical columns, one series (used for score distributions).
export function Columns({ data, color, height = 220, unit = "Students" }) {
  const [body, width] = useWidth();
  const [tip, setTip] = useState(null);
  const top = niceMax(Math.max(...data.map((d) => d.value)));
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = height - PAD.top - PAD.bottom;
  const band = innerW / data.length;
  const barW = Math.min(28, band * 0.6);
  const ticks = [0, top / 2, top];

  return (
    <div className="ch-body" ref={body} onPointerLeave={() => setTip(null)}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={`${unit} by ${data.map((d) => `${d.label}: ${d.value}`).join(", ")}`}>
          {ticks.map((t) => {
            const y = PAD.top + innerH - (t / top) * innerH;
            return (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y} y2={y} className="ch-grid" />
                <text x={PAD.left - 8} y={y + 4} textAnchor="end" className="ch-axis">{fmt(t)}</text>
              </g>
            );
          })}
          {data.map((d, i) => {
            const h = (d.value / top) * innerH;
            const x = PAD.left + band * i + (band - barW) / 2;
            const y = PAD.top + innerH - h;
            const r = Math.min(4, h, barW / 2);
            const show = (e) => setTip(tipAt(e, body.current, d.label, [{ label: unit, value: fmt(d.value), color }]));
            return (
              <g key={d.label}>
                {/* The whole column band is the hit target, not just the painted bar. */}
                <rect x={PAD.left + band * i} y={PAD.top} width={band} height={innerH} fill="transparent"
                  tabIndex={0} aria-label={`${d.label}: ${d.value}`} onPointerMove={show} onFocus={show} onBlur={() => setTip(null)} />
                {h > 0 && (
                  <path
                    pointerEvents="none"
                    fill={color}
                    d={`M${x},${PAD.top + innerH} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${PAD.top + innerH} Z`}
                  />
                )}
                <text x={x + barW / 2} y={y - 6} textAnchor="middle" className="ch-value">{d.value}</text>
                <text x={x + barW / 2} y={height - 8} textAnchor="middle" className="ch-axis">{d.label}</text>
              </g>
            );
          })}
        </svg>
      )}
      <Tooltip tip={tip} />
    </div>
  );
}

// Line chart with a crosshair that snaps to the nearest week and lists every series.
// series: [{ key, label, color, values: number[] }]; labels: string[] (x positions).
export function LineChart({ series, labels, height = 240, format = fmt, max }) {
  const [body, width] = useWidth();
  const [hover, setHover] = useState(null);
  const top = max ?? niceMax(Math.max(...series.flatMap((s) => s.values)));
  const left = PAD.left;
  const right = 92; // room for end labels
  const innerW = Math.max(0, width - left - right);
  const innerH = height - PAD.top - PAD.bottom;
  const x = (i) => left + (labels.length > 1 ? (i / (labels.length - 1)) * innerW : innerW / 2);
  const y = (v) => PAD.top + innerH - (v / top) * innerH;
  const ticks = [0, top / 4, top / 2, (top * 3) / 4, top];
  const every = Math.max(1, Math.ceil(labels.length / Math.max(1, Math.floor(innerW / 70))));

  const onMove = (e) => {
    const box = body.current.getBoundingClientRect();
    const px = e.clientX - box.left;
    const i = Math.round(((px - left) / Math.max(1, innerW)) * (labels.length - 1));
    setHover(Math.max(0, Math.min(labels.length - 1, i)));
  };

  // End labels: drop one when two would overlap; the legend still names it.
  const ends = series.map((s) => ({ s, y: y(s.values[s.values.length - 1]) })).sort((a, b) => a.y - b.y);
  const placed = ends.filter((e, i) => i === 0 || e.y - ends[i - 1].y >= 14);

  return (
    <div className="ch-body" ref={body}>
      {width > 0 && (
        <svg
          width={width} height={height} onPointerMove={onMove} onPointerLeave={() => setHover(null)}
          role="img" aria-label={`${series.map((s) => s.label).join(" and ")} over ${labels.length} periods; open the table view for values`}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={left} x2={left + innerW} y1={y(t)} y2={y(t)} className="ch-grid" />
              <text x={left - 8} y={y(t) + 4} textAnchor="end" className="ch-axis">{format(t)}</text>
            </g>
          ))}
          {labels.map((l, i) => (i % every === 0 || i === labels.length - 1) && (
            <text key={l} x={x(i)} y={height - 8} textAnchor="middle" className="ch-axis">{l}</text>
          ))}
          {series.map((s, si) => {
            const d = s.values.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
            return (
              <g key={s.key}>
                {si === 0 && <path d={`${d} L${x(s.values.length - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill={s.color} opacity="0.1" />}
                <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                <circle cx={x(s.values.length - 1)} cy={y(s.values[s.values.length - 1])} r="4" fill={s.color} stroke="#FEFEFE" strokeWidth="2" />
              </g>
            );
          })}
          {placed.map(({ s, y: ly }) => (
            <text key={s.key} x={left + innerW + 10} y={ly + 4} className="ch-end-label">
              {format(s.values[s.values.length - 1])} {s.short ?? ""}
            </text>
          ))}
          {hover != null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} className="ch-crosshair" />
              {series.map((s) => (
                <circle key={s.key} cx={x(hover)} cy={y(s.values[hover])} r="4" fill={s.color} stroke="#FEFEFE" strokeWidth="2" />
              ))}
            </g>
          )}
        </svg>
      )}
      {hover != null && (
        <Tooltip tip={{
          x: Math.min(Math.max(x(hover), 70), width - 70),
          y: PAD.top + 8,
          title: labels[hover],
          rows: series.map((s) => ({ label: s.label, value: format(s.values[hover]), color: s.color })),
        }} />
      )}
    </div>
  );
}
