import { useState } from 'react'
import { Link } from 'react-router-dom'
   import "./landing.css";

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

const features = [
  { title: 'Fast', text: 'Short description of your first feature.' },
  { title: 'Simple', text: 'Short description of your second feature.' },
  { title: 'Reliable', text: 'Short description of your third feature.' },
]

const Landing = () => {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="landing">
      {/* HEADER */}
      <header className="landing-header">
        <a href="#home" className="landing-logo">IM&SR</a>

        <button
          className="landing-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>

        <nav className={`landing-nav ${menuOpen ? 'open' : ''}`}>
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
          <Link to="/login" className="landing-btn">Login</Link>
        </nav>
      </header>

      {/* HERO */}
      <section id="home" className="landing-hero">
        <div className='hero-content'>
        <div className="landing-hero-text">
          <span className="landing-tag">Welcome</span>
          <h1>Manage Incidents. </h1>
          <h1>Simplify IT Support</h1>
          <p> Submit hardware and software problems quickly</p>
           
          <div className="landing-actions">
            <Link to="/login" className="landing-btn">Get started</Link>
            <a href="#features" className="landing-btn landing-btn-outline">Learn more</a>
        </div>
        </div>

         </div>
          div
        <div className="landing-hero-image">

            <img src="inc.jpeg" alt="hero" />
        </div>

       
      </section>

      {/* FEATURES */}
      <section id="features" className="landing-section">
        <h2>Features</h2>
        <div className="landing-grid">
          {features.map((f) => (
            <div key={f.title} className="landing-card">
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="landing-section landing-alt">
        <h2>About</h2>
        <p className="landing-about">Our platform  centralizes itincident and support request management within the organization. It allows users to manage their incidents and support requests efficiently.
          It allow users to report hardware and software problems,track their request , and communicate with the IT technicians throughtout the resolution process. The platform also provides IT technicians with a centralized dashboard to manage and prioritize incoming requests, assign tasks, and track progress. Overall, our platform streamlines the incident and support request management process, improving communication and collaboration between users and IT technicians.
        </p>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="landing-footer">
        <p>thanks</p>
      </footer>
    </div>
  )
}

export default Landing