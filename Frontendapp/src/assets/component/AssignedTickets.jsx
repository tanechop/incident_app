import { useEffect, useState } from 'react'
import api from '../../services/api'

const badge = {
  open: 'primary',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'secondary',
}

const AssignedTickets = () => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [resolving, setResolving] = useState(null) // the ticket being resolved
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const load = () =>
    api.get('/tickets/assigned')
      .then((res) => setTickets(res.data))
      .catch(() => setError('Could not load tickets'))
      .finally(() => setLoading(false))

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
    try {
      await api.put(`/tickets/${resolving.id}/resolve`, { resolution: note })
      setResolving(null)
      setNote('')
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not resolve the ticket')
    }
  }

  const shown = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter)

  if (loading) return <p>Loading...</p>

  return (
    <>
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card">
        <div className="card-body table-responsive">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Assigned tickets</h5>
            <select
              className="form-select form-select-sm w-auto"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="open">To start</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <table className="table align-middle">
            <thead>
              <tr>
                <th>#</th><th>Title</th><th>Created by</th>
                <th>Priority</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan="6" className="text-center text-muted">No tickets</td></tr>
              )}
              {shown.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>
                    <div className="fw-semibold">{t.title}</div>
                    <div className="small text-muted">{t.description}</div>
                  </td>
                  <td>{t.created_by_name}</td>
                  <td>{t.priority}</td>
                  <td>
                    <span className={`badge text-bg-${badge[t.status]}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {t.status === 'open' && (
                      <button className="btn btn-sm btn-primary" onClick={() => takeCharge(t.id)}>
                        Start
                      </button>
                    )}
                    {t.status === 'in_progress' && (
                      <div className="d-flex gap-2">
                        <select
                          className="form-select form-select-sm"
                          value={t.status}
                          onChange={(e) => updateStatus(t.id, e.target.value)}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In progress</option>
                        </select>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => setResolving(t)}
                        >
                          Resolve
                        </button>
                      </div>
                    )}
                    {(t.status === 'resolved' || t.status === 'closed') && (
                      <span className="text-muted small">Done</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolve form */}
      {resolving && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="card" style={{ width: 480 }}>
            <form className="card-body" onSubmit={submitResolution}>
              <h5>Resolve ticket #{resolving.id}</h5>
              <p className="text-muted small mb-3">{resolving.title}</p>
              <label className="form-label fw-semibold">What was done to fix it?</label>
              <textarea
                className="form-control mb-3"
                rows="4"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Describe the solution"
                required
              />
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => { setResolving(null); setNote('') }}
                >
                  Cancel
                </button>
                <button className="btn btn-success">Mark as resolved</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default AssignedTickets