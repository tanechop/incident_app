import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import './dashboard.css'

const roleNames = { staff: 'Staff', it_user: 'IT support', admin: 'Administrator' }

const Layout = ({ title, links }) => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const roleLabel = roleNames[localStorage.getItem('role')] || ''
  const name = localStorage.getItem('name') || roleLabel

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}

      <aside className={'sidebar' + (open ? ' open' : '')}>
        <div className="brand">
          <i className="bi bi-headset"></i> GLOBAL SERVICE
        </div>

        <nav>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => 'side-link' + (isActive ? ' active' : '')}
            >
              <i className={`bi bi-${l.icon || 'circle'}`}></i> {l.label}
            </NavLink>
          ))}
        </nav>

        <button className="side-link mt-auto border-0 bg-transparent text-start" onClick={logout}>
          <i className="bi bi-box-arrow-left"></i> Logout
        </button>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
            <button
              className="btn btn-light d-lg-none"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <i className="bi bi-list fs-5"></i>
            </button>
            <h5 className="mb-0 fw-semibold text-truncate">{title}</h5>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="text-end lh-sm d-none d-sm-block">
              <div className="fw-semibold small">{name}</div>
              <div className="text-muted" style={{ fontSize: '.75rem' }}>{roleLabel}</div>
            </div>
            <div className="avatar">{(name || '?').charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout