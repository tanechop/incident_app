const labels = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

// Rounded status label. Colors live in staff.css (.sp-pill-open, .sp-pill-in_progress, ...)
const StatusPill = ({ status }) => (
  <span className={`sp-pill sp-pill-${status}`}>{labels[status] || status}</span>
)

export default StatusPill