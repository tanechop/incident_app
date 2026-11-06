import { useEffect, useState } from 'react'
import api from '../../services/api'

const priorityClass = {
  high: 'badge-priority-high',
  medium: 'badge-priority-medium',
  low: 'badge-priority-low',
}

const AvailableTickets = () => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = () => {
    setError('')
    api.get('/tickets/unassigned')
      .then((res) => setTickets(res.data))
      .catch(() => setError('Could not load available tickets'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const takeCharge = async (t) => {
    setError('')
    setSuccess('')
    try {
      await api.put(`/tickets/${t.id}/take-charge`)
      setSuccess(`Ticket #${t.id} successfully claimed. You can now work on it in "Assigned tickets".`)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not take charge of this ticket')
    }
    load()
  }

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
        <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
          <div>
            <div className="d-flex align-items-center gap-2">
              <h5 className="mb-0 fw-bold">Unassigned Ticket Queue</h5>
              <span className="badge bg-danger rounded-pill" style={{ fontSize: '0.75rem' }}>
                {tickets.length} waiting
              </span>
            </div>
            <span className="text-muted small">New incoming support requests awaiting technician claim</span>
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={load} title="Refresh ticket queue">
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>Incident Summary</th>
                  <th>Submitted By</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Received</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Loading available queue...
                    </td>
                  </tr>
                )}
                {!loading && tickets.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <div className="empty-state py-2">
                        <div className="empty-state-icon">
                          <i className="bi bi-inbox-fill"></i>
                        </div>
                        <h6 className="fw-semibold text-dark">Queue is currently empty!</h6>
                        <p className="text-muted small mb-0">No unassigned tickets are waiting at the moment.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && tickets.map((t) => (
                  <tr key={t.id}>
                    <td className="fw-bold text-muted">#{t.id}</td>
                    <td>
                      <div className="fw-semibold text-dark">{t.title}</div>
                      <div className="small text-muted text-truncate" style={{ maxWidth: 360 }}>
                        {t.description}
                      </div>
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
                    <td className="text-muted small">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-primary text-nowrap" onClick={() => takeCharge(t)}>
                        <i className="bi bi-hand-index-thumb"></i> Take Charge
                      </button>
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

export default AvailableTickets
