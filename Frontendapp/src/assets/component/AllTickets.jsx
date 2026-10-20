import { useEffect, useState } from 'react'
import api from '../../services/api'

const badge = {
  open: 'primary',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'secondary',
}

const AllTickets = () => {
  const [tickets, setTickets] = useState([])
  const [techs, setTechs] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () =>
    api.get('/tickets')
      .then((res) => setTickets(res.data))
      .catch(() => setError('Could not load tickets'))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
    api.get('/users', { params: { role: 'it_user' } })
      .then((res) => setTechs(res.data))
      .catch(console.error)
  }, [])

  const assign = async (id, userId) => {
    if (!userId) return
    setError('')
    try {
      await api.put(`/tickets/${id}/assign`, { assigned_to: userId })
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not assign the ticket')
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
            <h5 className="mb-0">All tickets ({shown.length})</h5>
            <select
              className="form-select form-select-sm w-auto"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <table className="table align-middle">
            <thead>
              <tr>
                <th>#</th><th>Title</th><th>Created by</th><th>Category</th>
                <th>Priority</th><th>Status</th><th>Assigned to</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan="7" className="text-center text-muted">No tickets</td></tr>
              )}
              {shown.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.title}</td>
                  <td>{t.created_by_name}</td>
                  <td>{t.category_name}</td>
                  <td>{t.priority}</td>
                  <td>
                    <span className={`badge text-bg-${badge[t.status]}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ minWidth: 180 }}>
                    <select
                      className="form-select form-select-sm"
                      value={t.assigned_to || ''}
                      disabled={t.status === 'closed'}
                      onChange={(e) => assign(t.id, e.target.value)}
                    >
                      <option value="">Not assigned</option>
                      {techs.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
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

export default AllTickets