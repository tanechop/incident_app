import { useEffect, useState } from 'react'
import api from '../../services/api'

const AvailableTickets = () => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = () =>
    api.get('/tickets/unassigned')
      .then((res) => setTickets(res.data))
      .catch(() => setError('Could not load tickets'))
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const takeCharge = async (t) => {
    setError('')
    setSuccess('')
    try {
      await api.put(`/tickets/${t.id}/take-charge`)
      setSuccess(`Ticket #${t.id} is now yours. Find it in "Assigned tickets".`)
    } catch (err) {
      // 409 = someone else was faster
      setError(err.response?.data?.error || 'Could not take this ticket')
    }
    load()
  }

  if (loading) return <p>Loading...</p>

  return (
    <>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      {success && <div className="alert alert-success py-2">{success}</div>}

      <div className="card">
        <div className="card-body table-responsive">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Available tickets ({tickets.length})</h5>
            <button className="btn btn-sm btn-outline-secondary" onClick={load}>
              Refresh
            </button>
          </div>

          <table className="table align-middle">
            <thead>
              <tr>
                <th>#</th><th>Title</th><th>Created by</th><th>Category</th>
                <th>Priority</th><th>Created</th><th></th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 && (
                <tr><td colSpan="7" className="text-center text-muted">No tickets waiting</td></tr>
              )}
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>
                    <div className="fw-semibold">{t.title}</div>
                    <div className="small text-muted">{t.description}</div>
                  </td>
                  <td>{t.created_by_name}</td>
                  <td>{t.category_name}</td>
                  <td>{t.priority}</td>
                  <td>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => takeCharge(t)}>
                      Take charge
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default AvailableTickets
