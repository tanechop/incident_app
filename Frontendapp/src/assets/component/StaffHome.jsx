import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import StatCard from './StatCard'

const badgeClass = {
  open: 'text-bg-primary',
  in_progress: 'text-bg-warning',
  resolved: 'text-bg-success',
  closed: 'text-bg-secondary',
}

const priorityClass = {
  high: 'badge-priority-high',
  medium: 'badge-priority-medium',
  low: 'badge-priority-low',
}

const StaffHome = () => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const userName = localStorage.getItem('name') || 'Colleague'

  useEffect(() => {
    api.get('/tickets/my')
      .then((res) => setTickets(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const count = (status) => tickets.filter((t) => t.status === status).length

  const cards = [
    { label: 'Open', value: count('open'), color: 'primary' },
    { label: 'In progress', value: count('in_progress'), color: 'warning' },
    { label: 'Resolved', value: count('resolved'), color: 'success' },
    { label: 'Closed', value: count('closed'), color: 'secondary' },
  ]

  return (
    <>
      {/* Welcome Banner */}
      <div className="card mb-4 border-0" style={{ background: 'linear-gradient(135deg, #fff5f8 0%, #fdf2f8 50%, #f5f3ff 100%)', border: '1px solid #fce7f3 !important' }}>
        <div className="card-body p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <span className="badge mb-2" style={{ background: '#ffe4e6', color: '#be123c', border: '1px solid #fecdd3' }}>
              <i className="bi bi-stars"></i> Employee Helpdesk
            </span>
            <h4 className="fw-bold mb-1 text-dark">Hello, {userName}! 👋</h4>
            <p className="text-muted mb-0 small">
              Need technical assistance? Submit a ticket below or track your existing support requests.
            </p>
          </div>
          <div className="d-flex gap-2">
            <Link to="/dashboard/new" className="btn btn-primary shadow-sm text-nowrap">
              <i className="bi bi-plus-circle"></i> Create Ticket
            </Link>
            <Link to="/dashboard/tickets" className="btn btn-outline-secondary text-nowrap">
              <i className="bi bi-ticket-detailed"></i> View All
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} color={c.color} />
        ))}
      </div>

      {/* Recent Tickets Overview */}
      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="mb-0 fw-bold">Recent Requests</h5>
              <div className="text-muted small">Latest incidents submitted by you</div>
            </div>
            <Link to="/dashboard/tickets" className="btn btn-sm btn-outline-secondary">
              View all
            </Link>
          </div>

          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Incident Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Loading tickets...
                    </td>
                  </tr>
                )}
                {!loading && tickets.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      <div className="empty-state py-3">
                        <div className="empty-state-icon">
                          <i className="bi bi-ticket-perforated"></i>
                        </div>
                        <h6 className="fw-semibold text-dark">No tickets submitted yet</h6>
                        <p className="text-muted small mb-3">Got an IT or software problem? Submit a ticket and our technicians will resolve it.</p>
                        <Link to="/dashboard/new" className="btn btn-sm btn-primary">
                          <i className="bi bi-plus-circle"></i> Create Your First Ticket
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && tickets.slice(0, 5).map((t) => (
                  <tr key={t.id}>
                    <td className="fw-semibold text-muted">#{t.id}</td>
                    <td>
                      <div className="fw-semibold text-dark">{t.title}</div>
                      {t.resolution && (
                        <div className="small text-success mt-0.5">
                          <i className="bi bi-check-circle me-1"></i> Solution: {t.resolution}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-light text-secondary border">
                        {t.category_name || 'General'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${priorityClass[t.priority] || 'badge-priority-medium'}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${badgeClass[t.status] || 'text-bg-secondary'}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-muted small">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

export default StaffHome
