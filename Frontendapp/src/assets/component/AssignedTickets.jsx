import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import { ageHours, timeAgo } from '../../services/Format'
import { SORTS, matchesQuery, sortTickets } from './itTickets'
import { Chips, Empty, PriorityTag, SearchBox, StatusTag, TicketPanel } from './ITParts'
import './it.css'

const REFRESH_MS = 30000
const isActive = (t) => t.status === 'open' || t.status === 'in_progress'

// Pop-up asking how the problem was solved
const ResolveDialog = ({ ticket, busy, error, onCancel, onSubmit }) => {
  const [note, setNote] = useState('')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onCancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onCancel])

  return (
    <div className="it-overlay it-center" onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}>
      <form
        className="it-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resolve-title"
        onSubmit={(e) => { e.preventDefault(); onSubmit(note) }}
      >
        <h2 className="it-dialog-title" id="resolve-title">Resolve ticket #{ticket.id}</h2>
        <p className="it-sub mb-3">{ticket.title}</p>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <label className="form-label fw-semibold" htmlFor="resolution">What was done to fix it?</label>
        <textarea
          id="resolution"
          className="form-control"
          rows="5"
          maxLength={2000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Describe the solution so the requester understands what changed"
          required
          autoFocus
        />
        <div className="form-text mb-3">The requester will see this text. {note.length}/2000</div>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="it-btn it-btn-quiet" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="it-btn it-btn-success" disabled={busy || !note.trim()}>
            <i className="bi bi-check2-circle" /> {busy ? 'Saving...' : 'Mark as resolved'}
          </button>
        </div>
      </form>
    </div>
  )
}

const AssignedTickets = () => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('active')
  const [sort, setSort] = useState('priority')
  const [busyId, setBusyId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [resolving, setResolving] = useState(null)
  const [resolveError, setResolveError] = useState('')

  const load = useCallback(() =>
    api.get('/tickets/assigned')
      .then((res) => setTickets(res.data))
      .catch(() => setError('Could not load your tickets. Check your connection and refresh.'))
      .finally(() => setLoading(false)), [])

  useEffect(() => {
    load()
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load()
    }, REFRESH_MS)
    return () => clearInterval(timer)
  }, [load])

  // One helper for the three simple actions
  const act = async (t, request, doneText) => {
    setError('')
    setSuccess('')
    setBusyId(t.id)
    try {
      await request()
      setSuccess(doneText)
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed')
    } finally {
      setBusyId(null)
      load()
    }
  }

  const start = (t) =>
    act(t, () => api.put(`/tickets/${t.id}/take-charge`), `Ticket #${t.id} started. The requester was notified.`)
  const pause = (t) =>
    act(t, () => api.put(`/tickets/${t.id}/status`, { status: 'open' }), `Ticket #${t.id} is back in "To start".`)

  const submitResolution = async (note) => {
    setResolveError('')
    setBusyId(resolving.id)
    try {
      await api.put(`/tickets/${resolving.id}/resolve`, { resolution: note })
      setSuccess(`Ticket #${resolving.id} resolved. The requester was notified.`)
      setResolving(null)
      setSelectedId(null)
      load()
    } catch (err) {
      setResolveError(err.response?.data?.error || 'Could not resolve the ticket')
    } finally {
      setBusyId(null)
    }
  }

  const textMatches = useMemo(() => tickets.filter((t) => matchesQuery(t, query)), [tickets, query])
  const inFilter = (t) =>
    filter === 'all' ? true : filter === 'active' ? isActive(t) : t.status === filter
  const shown = useMemo(
    () => sortTickets(textMatches.filter(inFilter), sort),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [textMatches, filter, sort]
  )
  const count = (f) =>
    textMatches.filter((t) => (f === 'all' ? true : f === 'active' ? isActive(t) : t.status === f)).length
  const selected = tickets.find((t) => t.id === selectedId)

  const actions = (t, full) => {
    const busy = busyId === t.id
    const block = full ? ' it-btn-block' : ''
    // Queued, resolved and closed tickets have no action: their status tag says everything
    if (t.status === 'open' && t.queued) return null
    if (t.status === 'open') {
      return (
        <button type="button" className={`it-btn it-btn-primary${block}`} onClick={() => start(t)} disabled={busy}>
          <i className="bi bi-play-fill" /> {busy ? 'Starting...' : 'Start work'}
        </button>
      )
    }
    if (t.status === 'in_progress') {
      return (
        <>
          <button type="button" className={`it-btn it-btn-success${block}`} onClick={() => { setResolveError(''); setResolving(t) }} disabled={busy}>
            <i className="bi bi-check2-circle" /> Mark resolved
          </button>
          <button type="button" className={`it-btn it-btn-quiet${block}`} onClick={() => pause(t)} disabled={busy} title="Put the ticket back in To start">
            <i className="bi bi-pause-fill" /> Pause
          </button>
        </>
      )
    }
    return null
  }

  const empty = {
    active: ['inbox', 'Nothing to work on', 'You have no ticket to start or in progress. Check the available tickets.'],
    open: ['inbox', 'No ticket to start', 'Tickets assigned to you will appear here.'],
    in_progress: ['inbox', 'Nothing in progress', 'Start a ticket and it will appear here.'],
    resolved: ['inbox', 'No resolved ticket', 'Tickets you resolve are listed here until the requester closes them.'],
    closed: ['inbox', 'No closed ticket', 'Closed tickets are kept here for reference.'],
    all: ['inbox', 'No ticket yet', 'Tickets assigned to you will appear here.'],
  }[filter]

  return (
    <div className="it-page">
      <div className="it-head">
        <div>
          <h1 className="it-title">Assigned tickets</h1>
          <p className="it-sub">Your tickets, from first contact to solution.</p>
        </div>
        <div className="it-head-side">
          <button type="button" className="it-btn it-btn-quiet" onClick={load}>
            <i className="bi bi-arrow-clockwise" /> Refresh
          </button>
        </div>
      </div>

      <div aria-live="polite">
        {error && <div className="alert alert-danger py-2">{error}</div>}
        {success && <div className="alert alert-success py-2">{success}</div>}
      </div>

      <div className="it-toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder="Search by number, title, requester or category" />
        <select className="form-select it-sort" aria-label="Sort tickets" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>
      <Chips
        label="Filter by status"
        value={filter}
        onChange={setFilter}
        options={[
          { key: 'active', label: 'Active', count: count('active') },
          { key: 'open', label: 'To start', count: count('open') },
          { key: 'in_progress', label: 'In progress', count: count('in_progress') },
          { key: 'resolved', label: 'Resolved', count: count('resolved') },
          { key: 'closed', label: 'Closed', count: count('closed') },
          { key: 'all', label: 'All', count: count('all') },
        ]}
      />

      {loading ? (
        <p className="it-loading">Loading tickets...</p>
      ) : shown.length === 0 ? (
        query.trim() ? (
          <Empty icon="funnel" title="No ticket matches your search" text="Try other words or another status.">
            <button type="button" className="it-btn it-btn-quiet" onClick={() => setQuery('')}>Clear search</button>
          </Empty>
        ) : (
          <Empty icon={empty[0]} title={empty[1]} text={empty[2]} />
        )
      ) : (
        <div className="it-list">
          {shown.map((t) => (
            <article key={t.id} className={`it-card it-edge-${isActive(t) ? t.priority : 'done'}`}>
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
                  <StatusTag ticket={t} />
                  <PriorityTag priority={t.priority} />
                  {t.category_name && <span className="it-cat">{t.category_name}</span>}
                  <span className={`it-age${isActive(t) && ageHours(t.created_at) > 24 ? ' old' : ''}`}>
                    <i className="bi bi-clock" /> Created {timeAgo(t.created_at)}
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
                {actions(t)}
              </div>
            </article>
          ))}
        </div>
      )}

      {selected && (
        <TicketPanel ticket={selected} onClose={() => setSelectedId(null)}>
          {actions(selected, true) && <div className="it-panel-actions">{actions(selected, true)}</div>}
        </TicketPanel>
      )}

      {resolving && (
        <ResolveDialog
          ticket={resolving}
          busy={busyId === resolving.id}
          error={resolveError}
          onCancel={() => setResolving(null)}
          onSubmit={submitResolution}
        />
      )}
    </div>
  )
}

export default AssignedTickets
