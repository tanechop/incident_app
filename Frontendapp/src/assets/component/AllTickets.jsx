import { useEffect, useState } from 'react'
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

const AllTickets = () => {
  const [tickets, setTickets] = useState([])
  const [techs, setTechs] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = () => {
    setError('')
    api.get('/tickets')
      .then((res) => setTickets(res.data))
      .catch(() => setError('Could not load tickets'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    api.get('/users', { params: { role: 'it_user' } })
      .then((res) => setTechs(res.data))
      .catch(console.error)
  }, [])

  const assign = async (id, userId) => {
    if (!userId) return
    setError('')
    setSuccess('')
    try {
      await api.put(`/tickets/${id}/assign`, { assigned_to: userId })
      setSuccess(`Ticket #${id} assignment updated successfully.`)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not assign the ticket')
    }
  }

  const shown = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter)

  return (
    <>
      {error && (
        <div className="alert alert-danger py-2.5 d-flex align-items-center gap-2 mb-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
          <div>{error}</div>
        </div>
      )}
      {success && (
        <div className="alert alert-success py-2.5 d-flex align-items-center gap-2 mb-3" role="alert">
          <i className="bi bi-check-circle-fill flex-shrink-0"></i>
          <div>{success}</div>
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-header bg-white border-bottom py-3 px-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <h5 className="mb-0 fw-bold">All Incidents & Requests</h5>
              <span className="badge bg-secondary-subtle text-secondary border rounded-pill" style={{ fontSize: '0.75rem' }}>
                {shown.length} shown
              </span>
            </div>
            <span className="text-muted small">Global view of all support tickets across the organization</span>
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
            <button className="btn btn-sm btn-outline-secondary" onClick={load} title="Refresh ticket list">
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>Incident Details</th>
                  <th>Submitted By</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th style={{ minWidth: 200 }}>Technician Assignment</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Loading all incident records...
                    </td>
                  </tr>
                )}
                {!loading && shown.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <div className="empty-state py-2">
                        <div className="empty-state-icon">
                          <i className="bi bi-ticket-detailed"></i>
                        </div>
                        <h6 className="fw-semibold text-dark">No tickets found</h6>
                        <p className="text-muted small mb-0">No tickets matching the current filter.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && shown.map((t) => (
                  <tr key={t.id}>
                    <td className="fw-bold text-muted">#{t.id}</td>
                    <td>
                      <div className="fw-semibold text-dark">{t.title}</div>
                      <div className="small text-muted text-truncate" style={{ maxWidth: 360 }}>
                        {t.description}
                      </div>
                      {t.resolution && (
                        <div className="small text-success mt-1">
                          <i className="bi bi-check-circle me-1"></i> Resolution: {t.resolution}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="fw-medium text-dark">{t.created_by_name || 'Staff Member'}</div>
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
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={t.assigned_to || ''}
                        disabled={t.status === 'closed'}
                        onChange={(e) => assign(t.id, e.target.value)}
                        style={{
                          borderColor: t.assigned_to ? '#bbf7d0' : '#ebdbe8',
                          backgroundColor: t.assigned_to ? '#f0fdf4' : '#ffffff',
                        }}
                      >
                        <option value="">⚠️ Unassigned</option>
                        {techs.map((u) => (
                          <option key={u.id} value={u.id}>
                            🧑‍💻 {u.name}
                          </option>
                        ))}
                      </select>
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

export default AllTickets
