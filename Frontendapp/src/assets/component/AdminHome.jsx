import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import StatCard from './StatCard'

const AdminHome = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const adminName = localStorage.getItem('name') || 'Administrator'

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
        <p className="text-muted">Loading administrative statistics...</p>
      </div>
    )
  }

  return (
    <>
      {/* Admin Welcome Banner */}
      <div className="card mb-4 border-0" style={{ background: 'linear-gradient(135deg, #fff5f8 0%, #fdf2f8 50%, #f5f3ff 100%)', border: '1px solid #fce7f3 !important' }}>
        <div className="card-body p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <span className="badge mb-2" style={{ background: '#fdf2f8', color: '#be185d', border: '1px solid #fbcfe8' }}>
              <i className="bi bi-shield-lock-fill"></i> Central Admin Dashboard
            </span>
            <h4 className="fw-bold mb-1 text-dark">Welcome back, {adminName}! ⚙️</h4>
            <p className="text-muted mb-0 small">
              Complete oversight of GLOBAL SERVICE IT operations, active incidents, staff accounts, and category metrics.
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/admin/tickets" className="btn btn-primary text-nowrap">
              <i className="bi bi-ticket-detailed"></i> All Tickets
            </Link>
            <Link to="/admin/users" className="btn btn-outline-secondary text-nowrap">
              <i className="bi bi-people"></i> Manage Users
            </Link>
            <Link to="/admin/categories" className="btn btn-outline-secondary text-nowrap">
              <i className="bi bi-tags"></i> Categories
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="row g-3 mb-4">
        <StatCard label="Users" value={stats.users} color="primary" />
        <StatCard label="All tickets" value={stats.tickets} color="dark" />
        <StatCard label="Open" value={stats.open} color="danger" />
        <StatCard label="In progress" value={stats.in_progress} color="warning" />
        <StatCard label="Resolved" value={stats.resolved} color="success" />
        <StatCard label="Closed" value={stats.closed} color="secondary" />
      </div>

      {/* Breakdown by Category */}
      <div className="card shadow-sm">
        <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0 fw-bold">Incident Distribution by Category</h5>
            <span className="text-muted small">Relative volume of support requests across service categories</span>
          </div>
          <Link to="/admin/categories" className="btn btn-sm btn-outline-secondary">
            Manage Categories
          </Link>
        </div>

        <div className="card-body p-4">
          {stats.byCategory.length === 0 && (
            <div className="text-muted text-center py-4">No ticket categories recorded yet.</div>
          )}
          {stats.byCategory.map((c, i) => {
            const pct = stats.tickets ? Math.round((c.total / stats.tickets) * 100) : 0
            return (
              <div className="mb-3.5" key={c.name}>
                <div className="d-flex justify-content-between align-items-center mb-1.5">
                  <span className="fw-semibold text-dark small">
                    <i className="bi bi-folder2-open me-2 text-muted"></i>
                    {c.name}
                  </span>
                  <span className="text-muted small">
                    <strong>{c.total}</strong> tickets ({pct}%)
                  </span>
                </div>
                <div className="progress" style={{ height: 10 }}>
                  <div
                    className="progress-bar"
                    style={{
                      width: `${pct}%`,
                      background: i % 2 === 0 ? 'var(--brand-gradient)' : 'linear-gradient(135deg, #a855f7, #6366f1)',
                    }}
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
    </>
  )
}

export default AdminHome
