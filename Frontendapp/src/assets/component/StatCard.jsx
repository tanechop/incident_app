const iconMap = {
  'Users': 'people-fill',
  'All tickets': 'ticket-detailed-fill',
  'Total tickets': 'ticket-perforated-fill',
  'Assigned to me': 'person-check-fill',
  'To start': 'inbox-fill',
  'Open': 'exclamation-circle-fill',
  'In progress': 'hourglass-split',
  'Resolved': 'check-circle-fill',
  'Resolved or closed': 'shield-check',
  'Resolution rate': 'graph-up-arrow',
  'Still open': 'clock-history',
  'Closed': 'archive-fill',
}

const StatCard = ({ label, value, color = 'primary' }) => {
  const icon = iconMap[label] || 'bar-chart-fill'

  return (
    <div className="col-6 col-lg-3">
      <div className={`card stat-card border-${color} h-100`}>
        <div className="card-body d-flex align-items-center justify-content-between p-3.5">
          <div>
            <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.73rem', letterSpacing: '0.04em' }}>
              {label}
            </div>
            <div className="fs-2 fw-bold text-dark mt-1 lh-1">{value}</div>
          </div>
          <div className={`stat-icon ${color}`}>
            <i className={`bi bi-${icon}`}></i>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatCard
