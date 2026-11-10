// Small dependency-free charts (CSS + SVG) used by the admin dashboard.
// Styles live in AdminHome.css.

// Round the top of an axis to a "nice" number so grid lines are readable
const niceMax = (max) => {
  if (max <= 4) return 4
  const step = 10 ** Math.floor(Math.log10(max))
  return Math.ceil(max / step) * step
}

/* ---------- column chart: tickets by status ---------- */
export const ColumnChart = ({ data }) => {
  const top = niceMax(Math.max(0, ...data.map((d) => d.value)))
  const ticks = [1, 0.75, 0.5, 0.25, 0]
  return (
    <div className="ic" role="img"
      aria-label={data.map((d) => `${d.label}: ${d.value}`).join(', ')}>
      <div className="ic-plot">
        {ticks.map((t) => (
          <div className="ic-grid" key={t} style={{ top: `${(1 - t) * 100}%` }}>
            <span>{Math.round(top * t)}</span>
          </div>
        ))}
        <div className="ic-bars" style={{ '--cols': data.length }}>
          {data.map((d) => {
            const h = (d.value / top) * 100
            return (
              <div className="ic-col" key={d.label}>
                <div className="ic-bar" style={{ height: `${h}%`, background: d.color }} />
                <div className="ic-value" style={{ bottom: `calc(${h}% + 6px)` }}>{d.value}</div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="ic-labels" style={{ '--cols': data.length }}>
        {data.map((d) => (
          <div key={d.label}><strong>{d.label}</strong></div>
        ))}
      </div>
    </div>
  )
}

/* ---------- donut: share of each slice ---------- */
export const Donut = ({ data, centerLabel }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  let offset = 25 // start at 12 o'clock
  return (
    <div className="dn">
      <svg viewBox="0 0 42 42" className="dn-svg" role="img"
        aria-label={data.map((d) => `${d.label}: ${d.value}`).join(', ')}>
        <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#e9edf2" strokeWidth="6" />
        {total > 0 && data.map((d) => {
          const pct = (d.value / total) * 100
          const el = (
            <circle key={d.label} cx="21" cy="21" r="15.9155" fill="none"
              stroke={d.color} strokeWidth="6"
              strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={offset} />
          )
          offset -= pct
          return el
        })}
        <text x="21" y="21.5" textAnchor="middle" className="dn-total">{total}</text>
        <text x="21" y="27" textAnchor="middle" className="dn-sub">{centerLabel}</text>
      </svg>
      <ul className="dn-legend">
        {data.map((d) => (
          <li key={d.label}>
            <span className="dot" style={{ background: d.color }} />
            <span className="lbl">{d.label}</span>
            <span className="val">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------- area/line chart: tickets per day ---------- */
export const TrendChart = ({ points }) => {
  const W = 600
  const H = 160
  const top = niceMax(Math.max(0, ...points.map((p) => p.total)))
  const x = (i) => (points.length === 1 ? W / 2 : (i / (points.length - 1)) * W)
  const y = (v) => H - (v / top) * H
  const line = points.map((p, i) => `${x(i)},${y(p.total)}`).join(' ')
  const fmt = (day) =>
    new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  const sum = points.reduce((s, p) => s + p.total, 0)

  return (
    <div className="tc">
      <div className="tc-plot">
        <span className="tc-max">{top}</span>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img"
          aria-label={`${sum} tickets created in the last ${points.length} days`}>
          {[0, 0.5, 1].map((t) => (
            <line key={t} x1="0" x2={W} y1={H * t} y2={H * t} stroke="#e9edf2"
              vectorEffect="non-scaling-stroke" />
          ))}
          <polygon points={`0,${H} ${line} ${W},${H}`} fill="#198754" fillOpacity=".12" />
          <polyline points={line} fill="none" stroke="#198754" strokeWidth="2.5"
            strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="tc-axis">
        <span>{fmt(points[0].day)}</span>
        <span>{sum} tickets in {points.length} days</span>
        <span>{fmt(points[points.length - 1].day)}</span>
      </div>
    </div>
  )
}

/* ---------- stacked bars: workload per technician ---------- */
export const WorkloadBars = ({ rows }) => {
  const max = Math.max(1, ...rows.map((r) => r.active + r.done))
  if (rows.length === 0) return <p className="text-muted mb-0">No technicians yet</p>
  return (
    <div>
      {rows.map((r) => (
        <div className="mb-3" key={r.id}>
          <div className="d-flex justify-content-between small">
            <span>{r.name}</span>
            <span className="text-muted">{r.active} active · {r.done} done</span>
          </div>
          <div className="wl">
            <div className="wl-active" style={{ width: `${(r.active / max) * 100}%` }} />
            <div className="wl-done" style={{ width: `${(r.done / max) * 100}%` }} />
          </div>
        </div>
      ))}
      <div className="small text-muted d-flex gap-3">
        <span><span className="dot" style={{ background: '#f59f00' }} /> Active</span>
        <span><span className="dot" style={{ background: '#198754' }} /> Done</span>
      </div>
    </div>
  )
}
