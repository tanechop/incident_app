import { useState } from 'react'
import { Link } from 'react-router-dom'
import './landing.css'

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

const features = [
  {
    title: 'Report an Incident',
    text: 'Employees can easily report hardware and software problems with priority tagging and categories.',
    icon: 'ticket-detailed-fill',
  },
  {
    title: 'IT Support Routing',
    text: 'Technicians take charge of tickets, log resolutions, and manage workflows in real-time.',
    icon: 'headset',
  },
  {
    title: 'Live Notifications',
    text: 'Stay informed at every step with automatic notification alerts and resolution status tracking.',
    icon: 'bell-fill',
  },
]

const Landing = () => {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="landing">
      {/* HEADER */}
      <header className="landing-header">
        <a href="#home" className="landing-logo">
          <i className="bi bi-headset"></i>
          <span>ANOV</span>
        </a>

        <button
          className="landing-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <i className={`bi ${menuOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
        </button>

        <nav className={`landing-nav ${menuOpen ? 'open' : ''}`}>
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
          <Link to="/login" className="landing-btn" onClick={() => setMenuOpen(false)}>
            <i className="bi bi-box-arrow-in-right"></i> Sign In
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section id="home" className="landing-hero">
        <div className="hero-content">
          <div className="landing-hero-text">
            <span className="landing-tag">
              <i className="bi bi-stars"></i> Intelligent Incident Management
            </span>
            <h1>
              Manage Incidents. <br />
              <span className="highlight-gradient">Simplify IT Support.</span>
            </h1>
            <p>
              Experience seamless employee ticket submission, smart technician routing, and crystal-clear
              incident resolution workflows .
            </p>

            <div className="landing-actions">
              <Link to="/login" className="landing-btn">
                Get Started <i className="bi bi-arrow-right"></i>
              </Link>
              <a href="#features" className="landing-btn landing-btn-outline">
                <i className="bi bi-compass"></i> Explore Features
              </a>
            </div>
          </div>

          <div className="landing-hero-image">
            <img src="/new.png" alt="GLOBAL SERVICE Incident Platform" onError={(e) => { e.target.src = '/good.jpeg' }} />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="landing-section">
        <span className="landing-tag mb-2">Designed for Efficiency</span>
        <h2>Powerful IT Service Desk Features</h2>
        <p className="section-sub">
          Everything your organization needs to report, manage, assign, and track technical incidents in one place.
        </p>

        <div className="landing-grid">
          {features.map((f) => (
            <div key={f.title} className="landing-card">
              <div className="feature-icon-wrapper">
                <i className={`bi bi-${f.icon}`}></i>
              </div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="landing-section landing-alt">
        <span className="landing-tag mb-2">About The Platform</span>
        <h2>Unified ITSM </h2>
        <p className="section-sub">
          Built on principles from leading service desks like Jira Service Management and Freshservice.
        </p>

        <div className="landing-about-card">
          <span className="landing-about-badge">Centralized Service Hub</span>
          <p>
            Our platform centralizes incident and support request management within the organization. It enables
            staff to report hardware and software problems, track their request lifecycles, and stay aligned with
            IT technicians throughout the entire resolution process.
          </p>
          <p className="mb-0">
            Technicians benefit from a dedicated queue to claim incoming requests, log structured resolution notes,
            and keep operations running smoothly with zero friction.
          </p>

          <div className="landing-about-highlights">
            <div className="about-highlight-item">
              <i className="bi bi-check-circle-fill"></i> Multi-Role Access (Staff, IT, Admin)
            </div>
            <div className="about-highlight-item">
              <i className="bi bi-check-circle-fill"></i> Automated Priority Queues
            </div>
            <div className="about-highlight-item">
              <i className="bi bi-check-circle-fill"></i> Real-Time Activity Bell
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="landing-footer">
        <div className="landing-footer-logo">
          <i className="bi bi-headset"></i> ANOV
        </div>
        <p className="mb-1">Modern Incident & IT Support Request Management System</p>
        <p className="text-secondary small">&copy; {new Date().getFullYear()} achinel51@gmail</p>
      </footer>
    </div>
  )
}

export default Landing
