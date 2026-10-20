import { useEffect, useState } from 'react'
import api from '../../services/api'

const badge = {
  open: 'primary',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'secondary',
}

const MyTickets = () => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () =>
    api.get('/tickets/my')
      .then((res) => setTickets(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const closeTicket = async (id) => {
    await api.put(`/tickets/${id}/close`)
    load()
  }

  if (loading) return <p>Loading...</p>

  return (
    <div className="card">
      <div className="card-body table-responsive">
        <h5 className="mb-3">My tickets</h5>
        <table className="table align-middle">
          <thead>
            <tr>
              <th>#</th><th>Title</th><th>Category</th>
              <th>Priority</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 && (
              <tr><td colSpan="6" className="text-center text-muted">No tickets yet</td></tr>
            )}
            {tickets.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.title}</td>
                <td>{t.category_name}</td>
                <td>{t.priority}</td>
                <td>
                  <span className={`badge text-bg-${badge[t.status]}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  {t.status === 'resolved' && (
                    <button className="btn btn-sm btn-outline-success"
                      onClick={() => closeTicket(t.id)}>
                      Close
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default MyTickets