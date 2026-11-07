import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './style.css'

const Login = () => {
  const [values, setValues] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) =>
    setValues({ ...values, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (values.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/login', values)
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role)
      localStorage.setItem('name', data.name)

      if (data.role === 'admin') navigate('/admin')
      else if (data.role === 'it_user') navigate('/it')
      else navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Cannot reach the server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="loginPage">
      <div className="loginform">
        <div className="login-brand-icon">
          <i className="bi bi-headset"></i>
        </div>

        <h2>Welcome Back</h2>
        <p className="subtitle">Sign in to your portal</p>

        {error && (
          <div className="alert alert-danger py-2 d-flex align-items-center gap-2 small" role="alert">
            <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              <i className="bi bi-envelope me-1 text-muted"></i> Email address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              autoComplete="email"
              placeholder="name@globalservice.com"
              className="form-control"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label">
              <i className="bi bi-lock me-1 text-muted"></i> Password
            </label>
            <div className="input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={values.password}
                onChange={handleChange}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="form-control"
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`bi bi-${showPassword ? 'eye-slash' : 'eye'}`}></i>
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Signing In...
              </>
            ) : (
              <>
                Sign In <i className="bi bi-arrow-right-short fs-5"></i>
              </>
            )}
          </button>

          <Link to="/" className="login-back-link">
            <i className="bi bi-arrow-left me-1"></i> Back to Homepage
          </Link>
        </form>
      </div>
    </div>
  )
}

export default Login
