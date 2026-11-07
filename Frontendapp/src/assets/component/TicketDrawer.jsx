import AttachmentLink from './AttachmentLink'
import StatusPill from './StatusPill'
import { fmtDateTime } from '../../services/format'

// Side panel with every detail of one ticket
const TicketDrawer = ({ ticket: t, error, closing, onClose, onCloseTicket }) => {
  const notes = {
    open: 'Waiting for the IT team to pick this up.',
    in_progress: t.assigned_to_name
      ? `${t.assigned_to_name} is working on this.`
      : 'The IT team is working on this.',
    resolved: 'The IT team marked this as resolved. Close the ticket if the problem is fixed.',
    closed: 'This ticket is closed.',
  }

  return (
    <div
      className="sp-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <aside className="sp-drawer" role="dialog" aria-modal="true" aria-label={`Ticket ${t.id}`}>
        <div className="sp-drawer-top">
          <span>Ticket #{t.id}</span>
          <button
            type="button" className="sp-x" aria-label="Close details"
            onClick={onClose} autoFocus
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <h2>{t.title}</h2>
        <StatusPill status={t.status} />

        <dl className="sp-facts">
          <dt>Category</dt>
          <dd>{t.category_name || 'None'}</dd>
          <dt>Priority</dt>
          <dd className="sp-cap">{t.priority}</dd>
          <dt>Handled by</dt>
          <dd>{t.assigned_to_name || 'Not assigned yet'}</dd>
          <dt>Created</dt>
          <dd>{fmtDateTime(t.created_at)}</dd>
          {t.closed_at && (
            <>
              <dt>Closed</dt>
              <dd>{fmtDateTime(t.closed_at)}</dd>
            </>
          )}
        </dl>

        <h3 className="sp-section">Description</h3>
        <p className="sp-text">{t.description}</p>

        {t.resolution && (
          <>
            <h3 className="sp-section">Solution from IT</h3>
            <p className="sp-text sp-solution">{t.resolution}</p>
          </>
        )}

        {t.attachment && (
          <>
            <h3 className="sp-section">Attachment</h3>
            <div className="sp-text">
              <AttachmentLink ticket={t} />
            </div>
          </>
        )}

        <div className="sp-drawer-foot">
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <p className="sp-note">{notes[t.status]}</p>
          {t.status === 'resolved' && (
            <button
              type="button" className="sp-btn sp-btn-primary"
              onClick={() => onCloseTicket(t)} disabled={closing}
            >
              {closing ? 'Closing...' : 'Close ticket'}
            </button>
          )}
        </div>
      </aside>
    </div>
  )
}

export default TicketDrawer
