import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../../services/api'

const NotificationBell = () => {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  const load = useCallback(() => {
    api.get('/notifications')
      .then((res) => setItems(res.data))
      .catch(() => {}) // the bell should never break the page
  }, [])

  // Load now, then check for new notifications every 30 seconds
  useEffect(() => {
    load()
    const timer = setInterval(load, 30000)
    return () => clearInterval(timer)
  }, [load])

  // Close the list when the user clicks somewhere else
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
      load() // put the real state back if the server refused
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
    if (!open) load() // refresh when opening
    setOpen(!open)
  }

  return (
    <div className="position-relative" ref={box}>
      <button
        type="button"
        className="btn btn-light position-relative"
        onClick={toggle}
        aria-label="Notifications"
      >
        <i className="bi bi-bell fs-5"></i>
        {unread > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="position-absolute end-0 mt-2 bg-white border rounded shadow"
          style={{ width: 'min(340px, 70vw)', maxHeight: 420, overflowY: 'auto', zIndex: 1050 }}
        >
          <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
            <span className="fw-semibold">Notifications</span>
            {unread > 0 && (
              <button type="button" className="btn btn-link btn-sm p-0" onClick={markAllRead}>
                Mark all as read
              </button>
            )}
          </div>

          {items.length === 0 && (
            <div className="px-3 py-4 text-center text-muted small">No notifications yet</div>
          )}

          {items.map((n) => (
            <button
              type="button"
              key={n.id}
              onClick={() => markRead(n)}
              className={
                'd-block w-100 text-start border-0 border-bottom px-3 py-2 ' +
                (n.is_read ? 'bg-white text-muted' : 'bg-light fw-semibold')
              }
            >
              <div className="small">{n.message}</div>
              <div className="text-muted fw-normal" style={{ fontSize: '.72rem' }}>
                {new Date(n.created_at).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
