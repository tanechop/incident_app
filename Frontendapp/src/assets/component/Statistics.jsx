import { useEffect, useState } from 'react'
import api from '../../services/api'
import StatCard from './StatCard'

const BarList = ({ title, icon, rows, total, gradientClass }) => (
  <div className="card h-100 shadow-sm">
    <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center gap-2">
      <i className={`bi bi-${icon} text-muted`}></i>
      <h6 className="mb-0 fw-bold">{title}</h6>
    </div>
    <div className="card-body p-4">
      {rows.length === 0 && <p className="text-muted mb-0 small">No data recorded yet.</p>}
      {rows.map((r) => {
        const pct = total ? Math.round((r.total / total) * 100) : 0
        return (
          <div className="mb-3.5" key={r.label}>
            <div className="d-flex justify-content-between align-items-center small mb-1.5">
              <span className="fw-semibold text-dark text-capitalize">{r.label.replace('_', ' ')}</span>
              <span className="text-muted">
                <strong>{r.total}</strong> ({pct}%)
              </span>
            </div>
            <div className="progress" style={{ height: 9 }}>
              <div
                className={`progress-bar ${gradientClass}`}
                style={{ width: `${pct}%` }}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
          </div>
        )
      })}
    </div>
  </div>
)

const Statistics = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/stats')
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !stats) {
    return (
      <div className="card text-center py-5">
        <div className="spinner-border text-primary mx-auto mb-2" role="status"></div>
        <p className="text-muted">Loading statistical reports...</p>
      </div>
    )
  }

  const byStatus = [
    { label: 'Open', total: stats.open },
    { label: 'In progress', total: stats.in_progress },
    { label: 'Resolved', total: stats.resolved },
    { label: 'Closed', total: stats.closed },
  ]
  const byPriority = (stats.byPriority || []).map((p) => ({ label: p.priority, total: p.total }))
  const byCategory = stats.byCategory.map((c) => ({ label: c.name, total: c.total }))
  const done = stats.resolved + stats.closed
  const rate = stats.tickets ? Math.round((done / stats.tickets) * 100) : 0

  return (
    <>
      {/* KPI Overview Row */}
      <div className="row g-3 mb-4">
        <StatCard label="Total tickets" value={stats.tickets} color="dark" />
        <StatCard label="Resolved or closed" value={done} color="success" />
        <StatCard label="Resolution rate" value={`${rate}%`} color="primary" />
        <StatCard label="Still open" value={stats.open + stats.in_progress} color="danger" />
      </div>

      {/* Analytics Breakdown Row */}
      <div className="row g-3">
        <div className="col-lg-4">
          <BarList
            title="Breakdown by Status"
            icon="pie-chart-fill"
            rows={byStatus}
            total={stats.tickets}
            gradientClass="bg-primary"
          />
        </div>
        <div className="col-lg-4">
          <BarList
            title="Breakdown by Priority"
            icon="bar-chart-fill"
            rows={byPriority}
            total={stats.tickets}
            gradientClass="bg-warning"
          />
        </div>
        <div className="col-lg-4">
          <BarList
            title="Breakdown by Category"
            icon="tags-fill"
            rows={byCategory}
            total={stats.tickets}
            gradientClass="bg-success"
          />
        </div>
      </div>
    </>
  )
}

export default Statistics
