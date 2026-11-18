import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { timeAgo } from '../../services/Format'
import { sortTickets } from './itTickets'
import { Empty, PriorityTag, StatusTag } from './ITParts'
import './it.css'

const Tile = ({ to, icon, tone, label, value, hint }) => (
  <Link to={to} className={`it-tile it-tile-${tone}`}>
    <span className="it-tile-icon"><i className={`bi bi-${icon}`} /></span>
    <span>
      <span className="it-tile-value">{value}</span>
      <span className="it-tile-label">{label}</span>
      {hint && <span className="it-tile-hint">{hint}</span>}
    </span>
  </Link>
)

const ITHome = () => {
  const [assigned, setAssigned] = useState(null)
  const [available, setAvailable] = useState(0)
  const [error, setError] = useState('')
  const name = (localStorage.getItem('name') || '').split(' ')[0]

  useEffect(() => {
    Promise.all([api.get('/tickets/assigned'), api.get('/tickets/unassigned')])
      .then(([a, u]) => { setAssigned(a.data); setAvailable(u.data.length) })
      .catch(() => setError('Could not load your dashboard'))
  }, [])

  if (error) return <div className="alert alert-danger">{error}</div>
  if (!assigned) return <p className="it-loading">Loading...</p>

  const count = (s) => assigned.filter((t) => t.status === s).length
  const active = assigned.filter((t) => t.status === 'open' || t.status === 'in_progress')
  const urgent = sortTickets(active, 'priority').slice(0, 5)
  const highCount = active.filter((t) => t.priority === 'high').length

  return (
    <div className="it-page">
      <div className="it-head">
        <div>
          <h1 className="it-title">Hello{name ? `, ${name}` : ''}</h1>
          <p className="it-sub">
            {active.length === 0
              ? 'You have nothing to work on right now.'
              : `You have ${active.length} active ticket${active.length > 1 ? 's' : ''}${highCount ? `, ${highCount} of high priority` : ''}.`}
          </p>
        </div>
      </div>

      {available > 0 && (
        <div className="it-banner">
          <span>
            <i className="bi bi-inbox" /> <strong>{available}</strong> ticket{available > 1 ? 's are' : ' is'} waiting for a technician.
          </span>
          <Link to="/it/available" className="it-btn it-btn-primary">View available tickets</Link>
        </div>
      )}

      <div className="it-tiles">
        <Tile to="/it/available" icon="inbox" tone="blue" label="Available to take" value={available} />
        <Tile to="/it/tickets" icon="play-circle" tone="red" label="To start" value={count('open')} />
        <Tile to="/it/tickets" icon="wrench-adjustable" tone="amber" label="In progress" value={count('in_progress')} />
        <Tile to="/it/tickets" icon="check2-circle" tone="green" label="Resolved" value={count('resolved')} hint="waiting for closure" />
      </div>

      <section className="it-block">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h2 className="it-block-title">Needs your attention</h2>
          <Link to="/it/tickets" className="small fw-semibold">See all my tickets</Link>
        </div>

        {urgent.length === 0 ? (
          <Empty icon="check2-circle" title="Nothing urgent" text="Take a ticket from the available list to get started." />
        ) : (
          <ul className="it-rows">
            {urgent.map((t) => (
              <li key={t.id}>
                <Link to="/it/tickets" className={`it-row it-edge-${t.priority}`}>
                  <span className="it-id">#{t.id}</span>
                  <span className="it-row-title">{t.title}</span>
                  <PriorityTag priority={t.priority} />
                  <StatusTag ticket={t} />
                  <span className="it-age d-none d-md-inline">{timeAgo(t.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default ITHome
