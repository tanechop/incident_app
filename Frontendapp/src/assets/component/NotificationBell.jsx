import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../../services/api'

const NotificationBell = () => {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  const load = useCallback(() => {
    api.get('/notifications')
      .then((res) => setItems(res.data))
      .catch(() => {}) // never break the layout if server is unavailable
  }, [])

  // Load immediately and poll every 30 seconds
  useEffect(() => {
    load()
    const timer = setInterval(load, 30000)
    return () => clearInterval(timer)
  }, [load])

  // Close popover when clicking outside
  useEffect(() => {
    const onClick = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const unread = items.filter((n) => !n.is_read).length

  const markRead = async (n) => {
    if (n.is_read) return
    setItems((list) => list.map((x) => (x.id === n.id ? { ...x, is_read: 1 } : x)))
    try {
      await api.put(`/notifications/${n.id}/read`)
    } catch {
      load()
    }
  }

  const markAllRead = async () => {
    setItems((list) => list.map((x) => ({ ...x, is_read: 1 })))
    try {
      await api.put('/notifications/read-all')
    } catch {
      load()
    }
  }

  const toggle = () => {
    if (!open) load()
    setOpen(!open)
  }

  return (
    <div className="position-relative" ref={box}>
      <button
        type="button"
        className="btn btn-light position-relative p-2 lh-1"
        onClick={toggle}
        aria-label="Notifications"
        style={{ borderRadius: '12px' }}
      >
        <i className="bi bi-bell text-secondary fs-5"></i>
        {unread > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm"
            style={{ fontSize: '0.68rem', padding: '0.3em 0.55em' }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="position-absolute end-0 mt-2 bg-white border notification-box shadow-lg"
          style={{ zIndex: 1060 }}
        >
          <div className="d-flex justify-content-between align-items-center px-3 py-2.5 border-bottom bg-light">
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold small text-dark">Notifications</span>
              {unread > 0 && (
                <span className="badge bg-danger rounded-pill" style={{ fontSize: '0.65rem' }}>
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-decoration-none"
                style={{ fontSize: '0.78rem', color: 'var(--brand)' }}
                onClick={markAllRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {items.length === 0 && (
              <div className="empty-state py-4">
                <i className="bi bi-bell-slash text-muted fs-3 mb-2 d-block"></i>
                <div className="text-muted small">No notifications yet</div>
              </div>
            )}

            {items.map((n) => (
              <button
                type="button"
                key={n.id}
                onClick={() => markRead(n)}
                className={`w-100 text-start border-0 border-bottom px-3 py-2.5 notification-item d-flex gap-2.5 align-items-start ${
                  n.is_read ? 'bg-white' : 'unread'
                }`}
                style={{ cursor: 'pointer' }}
              >
                <div
                  className="rounded-circle mt-1 flex-shrink-0"
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: n.is_read ? 'transparent' : 'var(--brand)',
                  }}
                />
                <div className="flex-grow-1 min-w-0">
                  <div className={`small ${n.is_read ? 'text-secondary' : 'fw-semibold text-dark'}`}>
                    {n.message}
                  </div>
                  <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                    <i className="bi bi-clock me-1"></i>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
