import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import './AdminHome.css'

const roleLabel = { staff: 'Staff', it_user: 'IT user', admin: 'Admin' }
const roleColor = { staff: 'primary', it_user: 'warning', admin: 'dark' }

const emptyForm = { name: '', email: '', password: '', role: 'staff', category_id: '' }

const Users = () => {
  const [users, setUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const load = () =>
    api.get('/users').then((res) => setUsers(res.data)).catch(console.error)

  useEffect(() => {
    load()
    api.get('/categories').then((res) => setCategories(res.data)).catch(console.error)
  }, [])

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
      await api.post('/users', { ...form, category_id: form.category_id || null })
      setForm(emptyForm)
      setSuccess('Account created')
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create the account')
    } finally {
      setLoading(false)
    }
  }

  const remove = async (u) => {
    if (!window.confirm(`Delete the account of ${u.name}?`)) return
    setError('')
    setSuccess('')
    try {
      await api.delete(`/users/${u.id}`)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete the account')
    }
  }

  const q = query.trim().toLowerCase()
  const textMatches = useMemo(
    () =>
      !q
        ? users
        : users.filter((u) =>
            [u.name, u.email, roleLabel[u.role], u.category_name]
              .some((v) => String(v ?? '').toLowerCase().includes(q))
          ),
    [users, q]
  )
  const shown = roleFilter === 'all' ? textMatches : textMatches.filter((u) => u.role === roleFilter)
  const countRole = (r) => textMatches.filter((u) => u.role === r).length

  return (
    <>
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="mb-3">Create an account</h5>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          {success && <div className="alert alert-success py-2">{success}</div>}

          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Name</label>
              <input name="name" value={form.name} onChange={handleChange}
                className="form-control" required />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className="form-control" required />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">Password</label>
              <input type="password" name="password" value={form.password}
                onChange={handleChange} className="form-control" required />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">Role</label>
              <select name="role" value={form.role} onChange={handleChange}
                className="form-select">
                <option value="staff">Staff</option>
                <option value="it_user">IT user</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">User category</label>
              <select name="category_id" value={form.category_id} onChange={handleChange}
                className="form-select">
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-12">
              <button className="btn btn-success" disabled={loading}>
                {loading ? 'Creating...' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h5 className="mb-3">All users ({shown.length})</h5>

          <div className="ah-search">
            <i className="bi bi-search" />
            <input
              type="search"
              className="form-control"
              placeholder="Search by name, email, role or category"
              aria-label="Search users"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="ah-chips mb-3" role="group" aria-label="Filter users by role">
            {[{ key: 'all', label: 'All' }, ...Object.entries(roleLabel).map(([key, label]) => ({ key, label }))]
              .map((r) => (
                <button
                  key={r.key}
                  type="button"
                  className={`ah-chip${roleFilter === r.key ? ' active' : ''}`}
                  aria-pressed={roleFilter === r.key}
                  onClick={() => setRoleFilter(r.key)}
                >
                  {r.label}
                  <span className="n">{r.key === 'all' ? textMatches.length : countRole(r.key)}</span>
                </button>
              ))}
          </div>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Category</th><th></th></tr>
              </thead>
              <tbody>
                {shown.length === 0 && (
                  <tr><td colSpan="6" className="text-center text-muted">No users found</td></tr>
                )}
                {shown.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge text-bg-${roleColor[u.role]}`}>
                        {roleLabel[u.role]}
                      </span>
                    </td>
                    <td>{u.category_name || <span className="text-muted">—</span>}</td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(u)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

export default Users
