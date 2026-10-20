import { useEffect, useState } from 'react'
import api from '../../services/api'
import StatCard from './StatCard'

const badge = {
  open: 'primary',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'secondary',
}

const ITHome = () => {
  const [tickets, setTickets] = useState([])

  useEffect(() => {
    api.get('/tickets/assigned').then((res) => setTickets(res.data)).catch(console.error)
  }, [])

  const count = (s) => tickets.filter((t) => t.status === s).length

  return (
    <>
      <div className="row g-3 mb-4">
        <StatCard label="Assigned to me" value={tickets.length} color="primary" />
        <StatCard label="To start" value={count('open')} color="danger" />
        <StatCard label="In progress" value={count('in_progress')} color="warning" />
        <StatCard label="Resolved" value={count('resolved')} color="success" />
      </div>

      <div className="card">
        <div className="card-body table-responsive">
          <h5 className="mb-3">Latest assigned tickets</h5>
          <table className="table align-middle mb-0">
            <thead>
              <tr><th>#</th><th>Title</th><th>Priority</th><th>Status</th></tr>
            </thead>
            <tbody>
              {tickets.length === 0 && (
                <tr><td colSpan="4" className="text-center text-muted">Nothing assigned yet</td></tr>
              )}
              {tickets.slice(0, 5).map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.title}</td>
                  <td>{t.priority}</td>
                  <td>
                    <span className={`badge text-bg-${badge[t.status]}`}>
                      {t.status.replace('_', ' ')}
                    </span>
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

export default ITHome