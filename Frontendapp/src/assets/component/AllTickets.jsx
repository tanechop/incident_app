import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import AttachmentLink from './AttachmentLink'
import './AdminHome.css'

const STATUS = [
  { key: 'open', label: 'Open', badge: 'primary' },
  { key: 'in_progress', label: 'In progress', badge: 'warning' },
  { key: 'resolved', label: 'Resolved', badge: 'success' },
  { key: 'closed', label: 'Closed', badge: 'secondary' },
]
const statusMeta = Object.fromEntries(STATUS.map((s) => [s.key, s]))

const includes = (value, q) => String(value ?? '').toLowerCase().includes(q)

const AllTickets = () => {
  const [tickets, setTickets] = useState([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/tickets')
      .then((res) => setTickets(res.data))
      .catch(() => setError('Could not load tickets'))
      .finally(() => setLoading(false))
  }, [])

  const q = query.trim().toLowerCase()

  // Text match first, so the chip counts follow the search
  const textMatches = useMemo(
    () =>
      !q
        ? tickets
        : tickets.filter(
            (t) =>
              includes(t.id, q) ||
              includes(t.title, q) ||
              includes(t.created_by_name, q) ||
              includes(t.assigned_to_name, q) ||
              includes(t.category_name, q)
          ),
    [tickets, q]
  )
  const shown = status === 'all' ? textMatches : textMatches.filter((t) => t.status === status)
  const count = (key) => textMatches.filter((t) => t.status === key).length

  if (loading) return <p>Loading...</p>

  return (
    <>
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card">
        <div className="card-body">
          <div className="ah-search">
            <i className="bi bi-search" />
            <input
              type="search"
              className="form-control"
              placeholder="Search tickets (#, title, creator, technician, category)"
              aria-label="Search tickets"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="ah-chips mb-3" role="group" aria-label="Filter tickets by status">
            {[{ key: 'all', label: 'All' }, ...STATUS].map((s) => (
              <button
                key={s.key}
                type="button"
                className={`ah-chip${status === s.key ? ' active' : ''}`}
                aria-pressed={status === s.key}
                onClick={() => setStatus(s.key)}
              >
                {s.label}
                <span className="n">{s.key === 'all' ? textMatches.length : count(s.key)}</span>
              </button>
            ))}
          </div>

          <h5 className="mb-3">All tickets ({shown.length})</h5>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>#</th><th>Title</th><th>Created by</th><th>Category</th>
                  <th>Priority</th><th>Status</th><th>Assigned to</th>
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 && (
                  <tr><td colSpan="7" className="text-center text-muted">No tickets found</td></tr>
                )}
                {shown.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>
                      <div>{t.title}</div>
                      <AttachmentLink ticket={t} />
                    </td>
                    <td>{t.created_by_name}</td>
                    <td>{t.category_name}</td>
                    <td>{t.priority}</td>
                    <td>
                      <span className={`badge text-bg-${statusMeta[t.status]?.badge || 'secondary'}`}>
                        {statusMeta[t.status]?.label || t.status}
                      </span>
                    </td>
                    <td>
                      {t.assigned_to_name || <span className="text-muted">Not assigned</span>}
                      {t.queued ? <span className="badge text-bg-light ms-2">Waiting</span> : null}
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
