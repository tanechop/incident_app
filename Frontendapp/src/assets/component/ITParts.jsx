import { useEffect } from 'react'
import AttachmentLink from './AttachmentLink'
import { fmtDateTime } from '../../services/Format'
import { PRIORITY, STATUS } from './itTickets'
import './it.css'

export const PriorityTag = ({ priority }) => (
  <span className={`it-prio it-prio-${priority}`}>{PRIORITY[priority]?.label || priority}</span>
)

export const StatusTag = ({ ticket }) =>
  ticket.queued && ticket.status === 'open' ? (
    <span className="it-pill it-pill-queued">In the queue</span>
  ) : (
    <span className={`it-pill it-pill-${ticket.status}`}>{STATUS[ticket.status] || ticket.status}</span>
  )

// Filter buttons with a counter, e.g. [High 3] [Medium 5]
export const Chips = ({ label, options, value, onChange }) => (
  <div className="it-chips" role="group" aria-label={label}>
    {options.map((o) => (
      <button
        key={o.key}
        type="button"
        className={`it-chip${value === o.key ? ' active' : ''}`}
        aria-pressed={value === o.key}
        onClick={() => onChange(o.key)}
      >
        {o.label}
        <span className="n">{o.count}</span>
      </button>
    ))}
  </div>
)

export const SearchBox = ({ value, onChange, placeholder }) => (
  <div className="it-search">
    <i className="bi bi-search" />
    <input
      type="search"
      className="form-control"
      placeholder={placeholder}
      aria-label={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
)

// Side panel with everything about one ticket. The action buttons are passed as children.
export const TicketPanel = ({ ticket: t, onClose, children }) => {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="it-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="it-panel" role="dialog" aria-modal="true" aria-label={`Ticket ${t.id}`}>
        <div className="it-panel-top">
          <span className="it-id">Ticket #{t.id}</span>
          <button type="button" className="it-x" aria-label="Close details" onClick={onClose} autoFocus>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <h2 className="it-panel-title">{t.title}</h2>
        <div className="d-flex flex-wrap gap-2 mb-3">
          <StatusTag ticket={t} />
          <PriorityTag priority={t.priority} />
        </div>

        {t.priority_source === 'ai' && t.priority_reason && (
          <p className="it-ai">
            <i className="bi bi-stars" /> <strong>Priority set by AI:</strong> {t.priority_reason}
          </p>
        )}

        <dl className="it-facts">
          <dt>Requested by</dt><dd>{t.created_by_name || '—'}</dd>
          <dt>Category</dt><dd>{t.category_name || 'None'}</dd>
          <dt>Created</dt><dd>{fmtDateTime(t.created_at)}</dd>
          {t.assigned_at && (<><dt>Assigned</dt><dd>{fmtDateTime(t.assigned_at)}</dd></>)}
          {t.closed_at && (<><dt>Closed</dt><dd>{fmtDateTime(t.closed_at)}</dd></>)}
        </dl>

        <h3 className="it-section">Description</h3>
        <p className="it-text">{t.description}</p>

        {t.resolution && (
          <>
            <h3 className="it-section">Solution</h3>
            <p className="it-text it-text-solution">{t.resolution}</p>
          </>
        )}

        {t.attachment && (
          <>
            <h3 className="it-section">Attachment</h3>
            <AttachmentLink ticket={t} />
          </>
        )}

        {children && <div className="it-panel-foot">{children}</div>}
      </aside>
    </div>
  )
}

export const Empty = ({ icon, title, text, children }) => (
  <div className="it-empty">
    <i className={`bi bi-${icon}`} />
    <strong>{title}</strong>
    <p>{text}</p>
    {children}
  </div>
)
