import { useEffect, useState } from 'react'
import api from '../../services/api'

const roleLabel = { staff: 'Staff', it_user: 'IT Support', admin: 'Administrator' }

const Users = () => {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const load = () => {
    api.get('/users')
      .then((res) => setUsers(res.data))
      .catch(console.error)
      .finally(() => setFetching(false))
  }

  useEffect(() => { load() }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await api.post('/users', form)
      setForm({ name: '', email: '', password: '', role: 'staff' })
      setSuccess('User account successfully created.')
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create the account')
    } finally {
      setLoading(false)
    }
  }

  const remove = async (u) => {
    if (!window.confirm(`Are you sure you want to delete the account for ${u.name}?`)) return
    setError('')
    setSuccess('')
    try {
      await api.delete(`/users/${u.id}`)
      setSuccess(`Account for ${u.name} deleted successfully.`)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete the account (it may have active tickets)')
    }
  }

  return (
    <>
      {error && (
        <div className="alert alert-danger py-2.5 d-flex align-items-center gap-2 mb-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
          <div>{error}</div>
        </div>
      )}
      {success && (
        <div className="alert alert-success py-2.5 d-flex align-items-center gap-2 mb-3" role="alert">
          <i className="bi bi-check-circle-fill flex-shrink-0"></i>
          <div>{success}</div>
        </div>
      )}

      {/* Create User Form Card */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center gap-2">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: 34, height: 34, background: 'var(--brand-light)', color: 'var(--brand)' }}
          >
            <i className="bi bi-person-plus-fill"></i>
          </div>
          <div>
            <h5 className="mb-0 fw-bold">Provision New User Account</h5>
            <span className="text-muted small">Register employees, IT support technicians, or additional administrators</span>
          </div>
        </div>

        <div className="card-body p-4">
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-6">
              <label className="form-label">
                <i className="bi bi-person me-1 text-muted"></i> Full Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Jessica Taylor"
                className="form-control"
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                <i className="bi bi-envelope me-1 text-muted"></i> Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="jessica@globalservice.com"
                className="form-control"
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                <i className="bi bi-key me-1 text-muted"></i> Temporary Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className="form-control"
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                <i className="bi bi-shield-check me-1 text-muted"></i> System Role
              </label>
              <select name="role" value={form.role} onChange={handleChange} className="form-select">
                <option value="staff">Staff (Employee / Submitter)</option>
                <option value="it_user">IT Support (Technician / Handler)</option>
                <option value="admin">Administrator (Full Access)</option>
              </select>
            </div>

            <div className="col-12 pt-2">
              <button className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <i className="bi bi-plus-circle"></i> Create Account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* User Directory Card */}
      <div className="card shadow-sm">
        <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0 fw-bold">Active Users Directory</h5>
            <span className="text-muted small">Manage access and review enrolled accounts</span>
          </div>
          <span className="badge bg-light text-secondary border">
            {users.length} enrolled users
          </span>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>User Profile</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registered</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fetching && (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Loading user directory...
                    </td>
                  </tr>
                )}
                {!fetching && users.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      No users registered yet.
                    </td>
                  </tr>
                )}
                {!fetching && users.map((u) => {
                  const roleBadgeClass =
                    u.role === 'admin'
                      ? 'bg-danger-subtle text-danger border-danger-subtle'
                      : u.role === 'it_user'
                      ? 'bg-purple-subtle text-purple border-purple-subtle'
                      : 'bg-primary-subtle text-primary border-primary-subtle'

                  return (
                    <tr key={u.id}>
                      <td className="fw-bold text-muted">#{u.id}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold small"
                            style={{
                              width: 32,
                              height: 32,
                              background: u.role === 'admin' ? 'var(--brand-gradient)' : u.role === 'it_user' ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                            }}
                          >
                            {(u.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="fw-semibold text-dark">{u.name}</span>
                        </div>
                      </td>
                      <td className="text-muted">{u.email}</td>
                      <td>
                        <span
                          className="badge rounded-pill border"
                          style={{
                            background: u.role === 'admin' ? '#ffe4e6' : u.role === 'it_user' ? '#f3e8ff' : '#e0f2fe',
                            color: u.role === 'admin' ? '#be123c' : u.role === 'it_user' ? '#7e22ce' : '#0369a1',
                            borderColor: u.role === 'admin' ? '#fecdd3' : u.role === 'it_user' ? '#e9d5ff' : '#bae6fd',
                          }}
                        >
                          {roleLabel[u.role] || u.role}
                        </span>
                      </td>
                      <td className="text-muted small">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => remove(u)}
                          title="Delete user account"
                        >
                          <i className="bi bi-trash"></i> Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

export default Users
