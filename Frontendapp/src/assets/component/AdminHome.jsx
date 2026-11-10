import { useEffect, useState } from 'react'
import api from '../../services/api'
import StatCard from './StatCard'
import { ColumnChart, Donut, TrendChart, WorkloadBars } from './AdminCharts'
import './AdminHome.css'

const STATUS = [
  { key: 'open', label: 'Open', color: '#dc3545' },
  { key: 'in_progress', label: 'In progress', color: '#f59f00' },
  { key: 'resolved', label: 'Resolved', color: '#198754' },
  { key: 'closed', label: 'Closed', color: '#6c757d' },
]

const ROLE = {
  staff: { label: 'Staff', color: '#0d6efd' },
  it_user: { label: 'IT user', color: '#f59f00' },
  admin: { label: 'Admin', color: '#1e293b' },
}

const Card = ({ title, children, className = '' }) => (
  <div className={`card h-100 ${className}`}>
    <div className="card-body">
      <h5 className="mb-3">{title}</h5>
      {children}
    </div>
  </div>
)

const AdminHome = () => {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/stats')
      .then((res) => setStats(res.data))
      .catch(() => setError('Could not load the dashboard'))
  }, [])

  if (error) return <div className="alert alert-danger">{error}</div>
  if (!stats) return <p>Loading...</p>

  const statusData = STATUS.map((s) => ({ label: s.label, value: stats[s.key], color: s.color }))
  const roleData = stats.byRole.map((r) => ({
    label: ROLE[r.role]?.label || r.role,
    value: r.total,
    color: ROLE[r.role]?.color || '#94a3b8',
  }))
  const palette = ['#198754', '#0d6efd', '#f59f00', '#6f42c1', '#20c997', '#dc3545', '#fd7e14']
  const userCatData = stats.byUserCategory.map((c, i) => ({
    label: c.name,
    value: c.total,
    color: c.name === 'No category' ? '#cbd5e1' : palette[i % palette.length],
  }))

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

      {/* ---------- system overview charts ---------- */}
      <div className="row g-3 mb-3">
        <div className="col-lg-7">
          <Card title="Tickets by status">
            <ColumnChart data={statusData} />
          </Card>
        </div>
        <div className="col-lg-5">
          <Card title="Users by role">
            <Donut data={roleData} centerLabel="users" />
          </Card>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-lg-7">
          <Card title="Tickets created, last 14 days">
            <TrendChart points={stats.trend} />
          </Card>
        </div>
        <div className="col-lg-5">
          <Card title="Technician workload">
            <WorkloadBars rows={stats.workload} />
          </Card>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-5">
          <Card title="Users by category">
            <Donut data={userCatData} centerLabel="users" />
          </Card>
        </div>
        <div className="col-lg-7">
          <Card title="Tickets by category">
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
          </Card>
        </div>
      </div>
    </>
  )
}

export default AdminHome
