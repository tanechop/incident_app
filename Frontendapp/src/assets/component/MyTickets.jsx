import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

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

const MyTickets = () => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  const load = () =>
    api.get('/tickets/my')
      .then((res) => setTickets(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const closeTicket = async (id) => {
    setError('')
    try {
      await api.put(`/tickets/${id}/close`)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not close the ticket')
    }
  }

  const shown = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter)

  if (loading) {
    return (
      <div className="card text-center py-5">
        <div className="spinner-border text-primary mx-auto mb-2" role="status"></div>
        <p className="text-muted">Loading your tickets...</p>
      </div>
    )
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white border-bottom py-3 px-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
        <div>
          <h5 className="mb-0 fw-bold">My Support Requests</h5>
          <span className="text-muted small">Track and manage all incidents submitted under your account</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm w-auto"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All statuses ({tickets.length})</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <Link to="/dashboard/new" className="btn btn-sm btn-primary text-nowrap">
            <i className="bi bi-plus-lg"></i> New Ticket
          </Link>
        </div>
      </div>

      <div className="card-body p-0">
        {error && <div className="alert alert-danger m-3 py-2">{error}</div>}

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>Incident Details</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Submitted</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="empty-state py-2">
                      <div className="empty-state-icon">
                        <i className="bi bi-inbox"></i>
                      </div>
                      <h6 className="fw-semibold text-dark">No tickets found</h6>
                      <p className="text-muted small mb-3">
                        {filter === 'all' ? 'You have not submitted any incidents yet.' : `No tickets with status "${filter}".`}
                      </p>
                      {filter === 'all' && (
                        <Link to="/dashboard/new" className="btn btn-sm btn-primary">
                          <i className="bi bi-plus-circle"></i> Create Ticket
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              {shown.map((t) => (
                <tr key={t.id}>
                  <td className="fw-bold text-muted">#{t.id}</td>
                  <td>
                    <div className="fw-semibold text-dark">{t.title}</div>
                    <div className="small text-muted text-truncate" style={{ maxWidth: 360 }}>
                      {t.description}
                    </div>
                    {t.resolution && (
                      <div className="small text-success mt-1 p-1.5 px-2 rounded bg-light border border-success-subtle d-inline-block">
                        <i className="bi bi-check-circle-fill me-1"></i>
                        <strong>Resolution:</strong> {t.resolution}
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
                    <span className={`badge ${badge[t.status] || 'text-bg-secondary'}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="text-muted small">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                  <td className="text-end">
                    {t.status === 'resolved' && (
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => closeTicket(t.id)}
                        title="Confirm resolution and close ticket"
                      >
                        <i className="bi bi-check2-all"></i> Close Ticket
                      </button>
                    )}
                    {t.status === 'closed' && (
                      <span className="text-muted small">
                        <i className="bi bi-lock"></i> Closed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default MyTickets
