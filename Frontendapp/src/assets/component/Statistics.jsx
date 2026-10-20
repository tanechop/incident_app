import { useEffect, useState } from 'react'
import api from '../../services/api'
import StatCard from './StatCard'

const BarList = ({ title, rows, total, color }) => (
  <div className="card h-100">
    <div className="card-body">
      <h5 className="mb-3">{title}</h5>
      {rows.length === 0 && <p className="text-muted mb-0">No data yet</p>}
      {rows.map((r) => (
        <div className="mb-3" key={r.label}>
          <div className="d-flex justify-content-between small">
            <span>{r.label}</span><span>{r.total}</span>
          </div>
          <div className="progress" style={{ height: 8 }}>
            <div
              className={`progress-bar bg-${color}`}
              style={{ width: `${total ? (r.total / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
)

const Statistics = () => {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/stats').then((res) => setStats(res.data)).catch(console.error)
  }, [])

  if (!stats) return <p>Loading...</p>

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
      <div className="row g-3 mb-4">
        <StatCard label="Total tickets" value={stats.tickets} color="dark" />
        <StatCard label="Resolved or closed" value={done} color="success" />
        <StatCard label="Resolution rate" value={`${rate}%`} color="primary" />
        <StatCard label="Still open" value={stats.open + stats.in_progress} color="danger" />
      </div>

      <div className="row g-3">
        <div className="col-lg-4">
          <BarList title="By status" rows={byStatus} total={stats.tickets} color="primary" />
        </div>
        <div className="col-lg-4">
          <BarList title="By priority" rows={byPriority} total={stats.tickets} color="warning" />
        </div>
        <div className="col-lg-4">
          <BarList title="By category" rows={byCategory} total={stats.tickets} color="success" />
        </div>
      </div>
    </>
  )
}

export default Statistics