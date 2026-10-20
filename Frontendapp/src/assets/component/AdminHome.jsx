import { useEffect, useState } from 'react'
import api from '../../services/api'
import StatCard from './StatCard'

const AdminHome = () => {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/stats').then((res) => setStats(res.data)).catch(console.error)
  }, [])

  if (!stats) return <p>Loading...</p>

  return (
    <>
      <div className="row g-3 mb-4">
        <StatCard label="Users" value={stats.users} color="primary" />
        <StatCard label="All tickets" value={stats.tickets} color="dark" />
        <StatCard label="Open" value={stats.open} color="danger" />
        <StatCard label="In progress" value={stats.in_progress} color="warning" />
        <StatCard label="Resolved" value={stats.resolved} color="success" />
        <StatCard label="Closed" value={stats.closed} color="secondary" />
      </div>

      <div className="card">
        <div className="card-body">
          <h5 className="mb-3">Tickets by category</h5>
          {stats.byCategory.length === 0 && <p className="text-muted mb-0">No data yet</p>}
          {stats.byCategory.map((c) => (
            <div className="mb-3" key={c.name}>
              <div className="d-flex justify-content-between small">
                <span>{c.name}</span><span>{c.total}</span>
              </div>
              <div className="progress" style={{ height: 8 }}>
                <div
                  className="progress-bar bg-success"
                  style={{ width: `${stats.tickets ? (c.total / stats.tickets) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default AdminHome