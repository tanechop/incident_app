import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { ageHours, timeAgo } from '../../services/Format'
import { SORTS, matchesQuery, sortTickets } from './itTickets'
import { Chips, Empty, PriorityTag, SearchBox, TicketPanel } from './ITParts'
import './it.css'

const REFRESH_MS = 30000

const AvailableTickets = () => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null) // { id }
  const [query, setQuery] = useState('')
  const [priority, setPriority] = useState('all')
  const [sort, setSort] = useState('priority')
  const [taking, setTaking] = useState(null) // id of the ticket being taken
  const [selectedId, setSelectedId] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)

  const load = useCallback(() =>
    api.get('/tickets/unassigned')
      .then((res) => { setTickets(res.data); setUpdatedAt(new Date()); setError('') })
      .catch(() => setError('Could not load the tickets. Check your connection and refresh.'))
      .finally(() => setLoading(false)), [])

  // First load, then refresh by itself while the page is visible
  useEffect(() => {
    load()
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load()
    }, REFRESH_MS)
    return () => clearInterval(timer)
  }, [load])

  const takeCharge = async (t) => {
    setError('')
    setSuccess(null)
    setTaking(t.id)
    try {
      await api.put(`/tickets/${t.id}/take-charge`)
      setSuccess({ id: t.id })
      setSelectedId(null)
    } catch (err) {
      // 409 = a colleague was faster
      setError(err.response?.data?.error || 'Could not take this ticket')
    } finally {
      setTaking(null)
      load()
    }
  }

  const textMatches = useMemo(() => tickets.filter((t) => matchesQuery(t, query)), [tickets, query])
  const shown = useMemo(
    () => sortTickets(priority === 'all' ? textMatches : textMatches.filter((t) => t.priority === priority), sort),
    [textMatches, priority, sort]
  )
  const count = (p) => textMatches.filter((t) => t.priority === p).length
  const selected = tickets.find((t) => t.id === selectedId)
  const filtered = query.trim() !== '' || priority !== 'all'

  const takeButton = (t, full) => (
    <button
      type="button"
      className={`it-btn it-btn-primary${full ? ' it-btn-block' : ''}`}
      onClick={() => takeCharge(t)}
      disabled={taking === t.id}
    >
      <i className="bi bi-hand-index-thumb" /> {taking === t.id ? 'Taking...' : 'Take charge'}
    </button>
  )

  return (
    <div className="it-page">
      <div className="it-head">
        <div>
          <h1 className="it-title">Available tickets</h1>
          <p className="it-sub">Tickets waiting for a technician. Pick one and it becomes yours.</p>
        </div>
        <div className="it-head-side">
          {updatedAt && (
            <span className="it-updated">Updated {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          )}
          <button type="button" className="it-btn it-btn-quiet" onClick={load}>
            <i className="bi bi-arrow-clockwise" /> Refresh
          </button>
        </div>
      </div>

      <div aria-live="polite">
        {error && <div className="alert alert-danger py-2">{error}</div>}
        {success && (
          <div className="alert alert-success py-2 d-flex flex-wrap justify-content-between gap-2">
            <span>Ticket #{success.id} is now yours.</span>
            <Link to="/it/tickets" className="fw-semibold">Go to my assigned tickets</Link>
          </div>
        )}
      </div>

      <div className="it-toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder="Search by title, description, requester or category" />
        <select className="form-select it-sort" aria-label="Sort tickets" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>
      <Chips
        label="Filter by priority"
        value={priority}
        onChange={setPriority}
        options={[
          { key: 'all', label: 'All', count: textMatches.length },
          { key: 'high', label: 'High', count: count('high') },
          { key: 'medium', label: 'Medium', count: count('medium') },
          { key: 'low', label: 'Low', count: count('low') },
        ]}
      />

      {loading ? (
        <p className="it-loading">Loading tickets...</p>
      ) : shown.length === 0 ? (
        filtered ? (
          <Empty icon="funnel" title="No ticket matches your filters" text="Try another search or remove the filters.">
            <button type="button" className="it-btn it-btn-quiet" onClick={() => { setQuery(''); setPriority('all') }}>
              Clear filters
            </button>
          </Empty>
        ) : (
          <Empty icon="check2-circle" title="All caught up" text="No ticket is waiting for a technician right now. This page refreshes by itself." />
        )
      ) : (
        <div className="it-list">
          {shown.map((t) => (
            <article key={t.id} className={`it-card it-edge-${t.priority}`}>
              <div
                className="it-card-main"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(t.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(t.id) }
                }}
              >
                <div className="it-card-top">
                  <span className="it-id">#{t.id}</span>
                  <PriorityTag priority={t.priority} />
                  {t.category_name && <span className="it-cat">{t.category_name}</span>}
                  <span className={`it-age${ageHours(t.created_at) > 24 ? ' old' : ''}`}>
                    <i className="bi bi-clock" /> Waiting since {timeAgo(t.created_at)}
                  </span>
                </div>
                <h3 className="it-card-title">
                  {t.title}
                  {t.attachment && <i className="bi bi-paperclip it-clip" title="Has an attachment" />}
                </h3>
                <p className="it-card-desc">{t.description}</p>
                <div className="it-card-foot"><i className="bi bi-person" /> {t.created_by_name}</div>
              </div>
              <div className="it-card-actions">
                <button type="button" className="it-btn it-btn-quiet" onClick={() => setSelectedId(t.id)}>Details</button>
                {takeButton(t)}
              </div>
            </article>
          ))}
        </div>
      )}

      {selected && (
        <TicketPanel ticket={selected} onClose={() => setSelectedId(null)}>
          <p className="it-note">Once you take charge, this ticket moves to your assigned tickets and the requester is notified.</p>
          {takeButton(selected, true)}
        </TicketPanel>
      )}
    </div>
  )
}

export default AvailableTickets
