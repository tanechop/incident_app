import { useState } from 'react'
import './style.css'

const Login = () => {
  const [values, setValues] = useState({name:'', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) =>
    setValues({ ...values, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (values.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setError('')
    console.log(values) // call your API here
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 loginPage">
      <div className="loginform">
        <h2>Welcome back</h2>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleSubmit}>
            <div className="mb-3">
            <label htmlFor="name" className="form-label fw-semibold">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={values.name}
              onChange={handleChange}
              autoComplete="name"
              placeholder="Enter your name"
              className="form-control"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="form-label fw-semibold">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              autoComplete="email"
              placeholder="you@example.com"
              className="form-control"
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label fw-semibold">Password</label>
            <div className="input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                onClick={() => setShowPassword(!showPassword)}
                id="password"
                name="password"
                value={values.password}
                onChange={handleChange}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="form-control"
                required
              />
              
            </div>
          </div>

          <button type="submit" className="btn btn-success w-100">
            Login
          </button>
        </form>

        
      </div>
    </div>
  )
}

export default Login