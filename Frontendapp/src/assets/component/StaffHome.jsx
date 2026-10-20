import { useEffect, useState } from 'react'
import api from '../../services/api'

const StaffHome = () => {
  const [tickets, setTickets] = useState([])

  useEffect(() => {
    api.get('/tickets/my').then((res) => setTickets(res.data)).catch(console.error)
  }, [])

  const count = (status) => tickets.filter((t) => t.status === status).length

  const cards = [
    { label: 'Open', value: count('open'), color: 'primary' },
    { label: 'In progress', value: count('in_progress'), color: 'warning' },
    { label: 'Resolved', value: count('resolved'), color: 'success' },
    { label: 'Closed', value: count('closed'), color: 'secondary' },
  ]

  return (
    <div className="row g-3">
      {cards.map((c) => (
        <div className="col-6 col-lg-3" key={c.label}>
          <div className={`card border-${c.color}`}>
            <div className="card-body">
              <div className="text-muted small">{c.label}</div>
              <div className="fs-2 fw-semibold">{c.value}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default StaffHome