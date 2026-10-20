const StatCard = ({ label, value, color = 'primary' }) => (
  <div className="col-6 col-lg-3">
    <div className={`card border-${color} h-100`}>
      <div className="card-body">
        <div className="text-muted small">{label}</div>
        <div className="fs-2 fw-semibold">{value}</div>
      </div>
    </div>
  </div>
)

export default StatCard