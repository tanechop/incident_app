import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
    <div className="d-flex justify-content-center align-items-center vh-100 loginPage">
      <div className="loginform">
        <h2>Welcome back</h2>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label fw-semibold">Email</label>
            <input
              type="email" id="email" name="email"
              value={values.email} onChange={handleChange}
              autoComplete="email" placeholder="you@example.com"
              className="form-control" required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label fw-semibold">Password</label>
            <div className="input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password" name="password"
                value={values.password} onChange={handleChange}
                autoComplete="current-password" placeholder="Enter your password"
                className="form-control" required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-success w-100" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login