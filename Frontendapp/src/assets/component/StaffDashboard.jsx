import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { fmtDate } from '../../services/format'
import NotificationBell from './NotificationBell'
import StatusPill from './StatusPill'
import TicketDrawer from './TicketDrawer'
import './dashboard.css'
import './staff.css'

const emptyForm = { title: '', description: '', category_id: '', priority: 'medium' }
const MAX_FILE_MB = 5

const StaffDashboard = () => {
  const navigate = useNavigate()
  const name = localStorage.getItem('name') || 'Staff'

  const [tickets, setTickets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })

  // ticket details panel
  const [selectedId, setSelectedId] = useState(null)
  const [closing, setClosing] = useState(false)
  const [drawerError, setDrawerError] = useState('')
  const selected = tickets.find((t) => t.id === selectedId) || null

  // "New ticket" modal
  const [showModal, setShowModal] = useState(false)
  const [values, setValues] = useState(emptyForm)
  const [file, setFile] = useState(null)
  const [formError, setFormError] = useState('')
  const [sending, setSending] = useState(false)

  const load = () =>
    api.get('/tickets/my')
      .then((res) => setTickets(res.data))
      .catch(() => setMessage({ type: 'danger', text: 'Could not load your tickets' }))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
    api.get('/categories').then((res) => setCategories(res.data)).catch(console.error)
  }, [])

  // Escape closes whatever is open on top
  useEffect(() => {
    if (!showModal && !selectedId) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (showModal) setShowModal(false)
      else setSelectedId(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showModal, selectedId])

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const openDetails = (id) => {
    setDrawerError('')
    setSelectedId(id)
  }

  const openModal = () => {
    setValues(emptyForm)
    setFile(null)
    setFormError('')
    setShowModal(true)
  }

  const handleChange = (e) => setValues({ ...values, [e.target.name]: e.target.value })

  const handleFile = (e) => {
    const chosen = e.target.files[0] || null
    if (chosen && chosen.size > MAX_FILE_MB * 1024 * 1024) {
      setFormError(`File is too large (max ${MAX_FILE_MB} MB)`)
      e.target.value = ''
      setFile(null)
      return
    }
    setFormError('')
    setFile(chosen)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSending(true)
    try {
      // FormData is needed to send a file together with the text fields
      const data = new FormData()
      data.append('title', values.title)
      data.append('description', values.description)
      data.append('category_id', values.category_id)
      data.append('priority', values.priority)
      if (file) data.append('attachment', file)

      await api.post('/tickets', data)
      setShowModal(false)
      setMessage({ type: 'success', text: 'Your ticket was sent to the IT team.' })
      load()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Could not create the ticket')
    } finally {
      setSending(false)
    }
  }

  const closeTicket = async (t) => {
    setDrawerError('')
    setClosing(true)
    try {
      await api.put(`/tickets/${t.id}/close`)
      setSelectedId(null)
      setMessage({ type: 'success', text: `Ticket #${t.id} is closed.` })
      load()
    } catch (err) {
      setDrawerError(err.response?.data?.error || 'Could not close the ticket')
    } finally {
      setClosing(false)
    }
  }

  return (
    <div className="app-shell staff-page">
      <div className="main">
        <header className="topbar">
          <div className="sp-brand">
            <i className="bi bi-headset"></i> ANOV
          </div>

          <div className="d-flex align-items-center gap-3">
            <NotificationBell />
            <div className="text-end lh-sm d-none d-sm-block">
              <div className="fw-semibold small">{name}</div>
              <div className="sp-muted" style={{ fontSize: '.75rem' }}>Staff</div>
            </div>
            <div className="avatar">{name.charAt(0).toUpperCase()}</div>
            <button type="button" className="sp-btn sp-btn-quiet sp-btn-small" onClick={logout}>
              Log out
            </button>
          </div>
        </header>

        <main className="content">
          <div className="sp-wrap">
            <div className="sp-head">
              <div>
                <h1 className="sp-title">My tickets</h1>
                <p className="sp-sub">Everything you have sent to the IT team, and where it stands.</p>
              </div>
              <button type="button" className="sp-btn sp-btn-primary" onClick={openModal}>
                <i className="bi bi-plus-lg"></i> New ticket
              </button>
            </div>

            {message.text && (
              <div className={`alert alert-${message.type} py-2`}>{message.text}</div>
            )}

            <div className="sp-table-wrap">
              {loading ? (
                <p className="sp-empty">Loading your tickets...</p>
              ) : tickets.length === 0 ? (
                <div className="sp-empty">
                  <strong>No tickets yet</strong>
                  <p>When something is not working, send it to the IT team.</p>
                  <button type="button" className="sp-btn sp-btn-primary" onClick={openModal}>
                    <i className="bi bi-plus-lg"></i> New ticket
                  </button>
                </div>
              ) : (
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th className="sp-hide-sm">No.</th>
                      <th>Ticket</th>
                      <th className="sp-hide-sm">Priority</th>
                      <th>Status</th>
                      <th className="sp-hide-sm">Handled by</th>
                      <th className="sp-hide-sm">Created</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr
                        key={t.id}
                        className="sp-row"
                        tabIndex={0}
                        onClick={() => openDetails(t.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            openDetails(t.id)
                          }
                        }}
                      >
                        <td className="sp-id sp-hide-sm">#{t.id}</td>
                        <td className="sp-ticket-cell">
                          <div className="sp-ticket-title">
                            {t.title}
                            {t.attachment && (
                              <i className="bi bi-paperclip sp-clip" title="Has an attachment"></i>
                            )}
                          </div>
                          <div className="sp-ticket-meta">{t.category_name || 'No category'}</div>
                        </td>
                        <td className={'sp-cap sp-hide-sm ' + (t.priority === 'high' ? 'sp-high' : 'sp-muted')}>
                          {t.priority}
                        </td>
                        <td><StatusPill status={t.status} /></td>
                        <td className="sp-hide-sm sp-nowrap">
                          {t.assigned_to_name || <span className="sp-muted">Not assigned yet</span>}
                        </td>
                        <td className="sp-hide-sm sp-nowrap sp-muted">{fmtDate(t.created_at)}</td>
                        <td className="sp-chevron"><i className="bi bi-chevron-right"></i></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Ticket details */}
      {selected && (
        <TicketDrawer
          ticket={selected}
          error={drawerError}
          closing={closing}
          onClose={() => setSelectedId(null)}
          onCloseTicket={closeTicket}
        />
      )}

      {/* New ticket */}
      {showModal && (
        <div
          className="sp-overlay sp-center"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <form className="sp-dialog" onSubmit={handleSubmit}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="sp-dialog-title">New ticket</h2>
              <button
                type="button" className="sp-x" aria-label="Close"
                onClick={() => setShowModal(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {formError && <div className="alert alert-danger py-2">{formError}</div>}

            <div className="mb-3">
              <label className="form-label">Title</label>
              <input
                name="title" value={values.title} onChange={handleChange}
                className="form-control" placeholder="Short summary of the problem"
                required autoFocus
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                name="description" rows="4" value={values.description} onChange={handleChange}
                className="form-control" placeholder="Explain what happened" required
              />
            </div>

            <div className="row">
              <div className="col-sm-6 mb-3">
                <label className="form-label">Category</label>
                <select
                  name="category_id" value={values.category_id} onChange={handleChange}
                  className="form-select" required
                >
                  <option value="">Choose...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-sm-6 mb-3">
                <label className="form-label">Priority</label>
                <select
                  name="priority" value={values.priority} onChange={handleChange}
                  className="form-select"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">
                Attach a file <span className="sp-muted fw-normal">(optional, max {MAX_FILE_MB} MB)</span>
              </label>
              <input
                type="file" className="form-control" onChange={handleFile}
                accept=".png,.jpg,.jpeg,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="sp-btn sp-btn-quiet" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="sp-btn sp-btn-primary" disabled={sending}>
                {sending ? 'Sending...' : 'Submit ticket'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default StaffDashboard
