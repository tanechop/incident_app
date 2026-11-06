import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import NotificationBell from './NotificationBell'
import './dashboard.css'

const roleNames = { staff: 'Staff', it_user: 'IT Support', admin: 'Administrator' }

const Layout = ({ title, links }) => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const currentRole = localStorage.getItem('role') || 'staff'
  const roleLabel = roleNames[currentRole] || 'User'
  const name = localStorage.getItem('name') || roleLabel

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      {/* Off-canvas mobile backdrop */}
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}

      {/* Sidebar (Jira & Freshservice Inspired) */}
      <aside className={'sidebar' + (open ? ' open' : '')}>
        <div className="brand">
          <i className="bi bi-headset"></i>
          <span>GLOBAL SERVICE</span>
        </div>

        <nav className="d-flex flex-column gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => 'side-link' + (isActive ? ' active' : '')}
            >
              <i className={`bi bi-${l.icon || 'circle'}`}></i>
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          className="side-link mt-auto border-0 bg-transparent text-start"
          onClick={logout}
        >
          <i className="bi bi-box-arrow-left"></i>
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="main">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-title-wrapper">
            <button
              className="btn btn-light d-lg-none p-2 lh-1"
              onClick={() => setOpen(true)}
              aria-label="Open navigation menu"
            >
              <i className="bi bi-list fs-5"></i>
            </button>
            <div>
              <h5 className="mb-0 text-truncate">{title}</h5>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <NotificationBell />
            
            <div className="text-end lh-sm d-none d-sm-block">
              <div className="fw-bold small text-dark">{name}</div>
              <span className="user-badge mt-1">{roleLabel}</span>
            </div>

            <div className="avatar" title={`${name} (${roleLabel})`}>
              {(name || '?').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
