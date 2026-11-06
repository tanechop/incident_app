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

const AssignedTickets = () => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [resolving, setResolving] = useState(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setError('')
    api.get('/tickets/assigned')
      .then((res) => setTickets(res.data))
      .catch(() => setError('Could not load assigned tickets'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const takeCharge = async (id) => {
    setError('')
    try {
      await api.put(`/tickets/${id}/take-charge`)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed')
    }
  }

  const updateStatus = async (id, status) => {
    setError('')
    try {
      await api.put(`/tickets/${id}/status`, { status })
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed')
    }
  }

  const submitResolution = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.put(`/tickets/${resolving.id}/resolve`, { resolution: note })
      setResolving(null)
      setNote('')
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not resolve the ticket')
    } finally {
      setSubmitting(false)
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

      <div className="card shadow-sm">
        <div className="card-header bg-white border-bottom py-3 px-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
          <div>
            <h5 className="mb-0 fw-bold">My Assigned Workload</h5>
            <span className="text-muted small">Manage and resolve tickets assigned to your technician queue</span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <label className="text-muted small text-nowrap d-none d-md-inline">Filter Status:</label>
            <select
              className="form-select form-select-sm w-auto"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All statuses ({tickets.length})</option>
              <option value="open">To start</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <button className="btn btn-sm btn-outline-secondary" onClick={load} title="Refresh">
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
                  <th>Requester</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th className="text-end">Action & Resolution</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Loading assigned workload...
                    </td>
                  </tr>
                )}
                {!loading && shown.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div className="empty-state py-2">
                        <div className="empty-state-icon">
                          <i className="bi bi-check2-all"></i>
                        </div>
                        <h6 className="fw-semibold text-dark">No tickets in this view</h6>
                        <p className="text-muted small mb-0">
                          {filter === 'all'
                            ? 'You do not have any tickets assigned to you right now.'
                            : `No tickets matching filter "${filter}".`}
                        </p>
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
                        <div className="small text-success mt-1 p-1 px-2 rounded bg-light border border-success-subtle d-inline-block">
                          <i className="bi bi-check-circle-fill me-1"></i> Solution: {t.resolution}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="fw-medium text-dark">{t.created_by_name || 'Staff Member'}</div>
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
                      {t.status === 'open' && (
                        <button className="btn btn-sm btn-primary text-nowrap" onClick={() => takeCharge(t.id)}>
                          <i className="bi bi-play-fill"></i> Start Work
                        </button>
                      )}
                      {t.status === 'in_progress' && (
                        <div className="d-inline-flex align-items-center gap-2">
                          <select
                            className="form-select form-select-sm"
                            style={{ minWidth: 120 }}
                            value={t.status}
                            onChange={(e) => updateStatus(t.id, e.target.value)}
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In progress</option>
                          </select>
                          <button
                            className="btn btn-sm btn-success text-nowrap"
                            onClick={() => setResolving(t)}
                          >
                            <i className="bi bi-check-lg"></i> Resolve
                          </button>
                        </div>
                      )}
                      {(t.status === 'resolved' || t.status === 'closed') && (
                        <span className="badge bg-light text-success border border-success-subtle py-1.5 px-2.5">
                          <i className="bi bi-check-circle me-1"></i> Completed
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

      {/* Modern Freshservice-style Resolve Modal */}
      {resolving && (
        <div className="modal-backdrop-blur">
          <div className="card shadow-lg mx-auto" style={{ width: '100%', maxWidth: 520, borderRadius: '20px' }}>
            <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: 34, height: 34, background: '#dcfce7', color: '#16a34a' }}
                >
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                <h5 className="mb-0 fw-bold">Resolve Ticket #{resolving.id}</h5>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => { setResolving(null); setNote('') }}
                aria-label="Close"
              ></button>
            </div>

            <form onSubmit={submitResolution} className="card-body p-4">
              <div className="p-3 mb-3 rounded-3" style={{ background: '#faf5f8', border: '1px solid #f0e2ee' }}>
                <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.72rem' }}>Ticket Summary</div>
                <div className="fw-semibold text-dark mt-0.5">{resolving.title}</div>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  <i className="bi bi-journal-check me-1 text-muted"></i> Resolution Details
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Describe the solution applied (e.g. replaced bad network cable, reset credentials, applied software patch)..."
                  required
                />
                <div className="form-text" style={{ fontSize: '0.78rem' }}>
                  The requester will receive a notification with this resolution note.
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => { setResolving(null); setNote('') }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default AssignedTickets
