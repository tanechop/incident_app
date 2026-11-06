import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import StatCard from './StatCard'

const badge = {
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

const ITHome = () => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const techName = localStorage.getItem('name') || 'Technician'

  useEffect(() => {
    api.get('/tickets/assigned')
      .then((res) => setTickets(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const count = (s) => tickets.filter((t) => t.status === s).length

  return (
    <>
      {/* Technician Banner */}
      <div className="card mb-4 border-0" style={{ background: 'linear-gradient(135deg, #fff5f8 0%, #fdf2f8 50%, #f5f3ff 100%)', border: '1px solid #fce7f3 !important' }}>
        <div className="card-body p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <span className="badge mb-2" style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
              <i className="bi bi-wrench-adjustable"></i> IT Support Workspace
            </span>
            <h4 className="fw-bold mb-1 text-dark">Welcome back, {techName}! 🛠️</h4>
            <p className="text-muted mb-0 small">
              Here is your technical support overview. Check available unassigned tickets or continue active investigations.
            </p>
          </div>
          <div className="d-flex gap-2">
            <Link to="/it/available" className="btn btn-primary text-nowrap">
              <i className="bi bi-inbox"></i> Available Queue
            </Link>
            <Link to="/it/tickets" className="btn btn-outline-secondary text-nowrap">
              <i className="bi bi-list-task"></i> My Assigned Tickets
            </Link>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <StatCard label="Assigned to me" value={tickets.length} color="primary" />
        <StatCard label="To start" value={count('open')} color="danger" />
        <StatCard label="In progress" value={count('in_progress')} color="warning" />
        <StatCard label="Resolved" value={count('resolved')} color="success" />
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0 fw-bold">Latest Assigned Tickets</h5>
            <span className="text-muted small">Most recent tickets currently in your queue</span>
          </div>
          <Link to="/it/tickets" className="btn btn-sm btn-outline-secondary">
            View all ({tickets.length})
          </Link>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>Incident Title</th>
                  <th>Created By</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th className="text-end">Manage</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Loading assigned tickets...
                    </td>
                  </tr>
                )}
                {!loading && tickets.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div className="empty-state py-2">
                        <div className="empty-state-icon">
                          <i className="bi bi-check2-circle"></i>
                        </div>
                        <h6 className="fw-semibold text-dark">Your queue is clear!</h6>
                        <p className="text-muted small mb-3">No active tickets are currently assigned to you.</p>
                        <Link to="/it/available" className="btn btn-sm btn-primary">
                          <i className="bi bi-inbox"></i> Claim an Available Ticket
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && tickets.slice(0, 5).map((t) => (
                  <tr key={t.id}>
                    <td className="fw-bold text-muted">#{t.id}</td>
                    <td>
                      <div className="fw-semibold text-dark">{t.title}</div>
                      <div className="small text-muted text-truncate" style={{ maxWidth: 350 }}>
                        {t.description}
                      </div>
                    </td>
                    <td>
                      <span className="fw-medium text-dark">{t.created_by_name || 'Staff Member'}</span>
                    </td>
                    <td>
                      <span className={`badge ${priorityClass[t.priority] || 'badge-priority-medium'}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${badge[t.status] || 'text-bg-secondary'}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-end">
                      <Link to="/it/tickets" className="btn btn-sm btn-outline-primary">
                        <i className="bi bi-pencil-square"></i> Open
                      </Link>
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

export default ITHome
