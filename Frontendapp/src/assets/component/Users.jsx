import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import './AdminHome.css'

const roleLabel = { staff: 'Staff', it_user: 'IT user', admin: 'Admin' }
const roleColor = { staff: 'primary', it_user: 'warning', admin: 'dark' }

const emptyForm = { name: '', email: '', password: '', role: 'staff', category_id: '' }

// The login token holds the id of the connected admin (used to protect the admin's own role)
const currentUserId = () => {
  try {
    const payload = localStorage.getItem('token')?.split('.')[1]
    if (!payload) return null
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))).id
  } catch {
    return null
  }
}

const EditUserModal = ({ user, categories, isSelf, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    category_id: user.category_id ?? '',
    password: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Escape closes the dialog
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !saving && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, saving])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const dirty =
    form.name !== user.name ||
    form.email !== user.email ||
    form.role !== user.role ||
    String(form.category_id) !== String(user.category_id ?? '') ||
    form.password !== ''

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password && form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setSaving(true)
    try {
      await api.put(`/users/${user.id}`, {
        name: form.name,
        email: form.email,
        role: form.role,
        category_id: form.category_id || null,
        password: form.password || undefined,
      })
      onSaved({ name: form.name.trim(), isSelf })
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update the account')
      setSaving(false)
    }
  }

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-title"
      style={{ background: 'rgba(15, 23, 42, .5)', overflowY: 'auto' }}
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div className="modal-dialog modal-dialog-centered">
        <form className="modal-content" onSubmit={submit}>
          <div className="modal-header">
            <h5 className="modal-title" id="edit-user-title">Edit account #{user.id}</h5>
            <button type="button" className="btn-close" aria-label="Close"
              onClick={onClose} disabled={saving} />
          </div>

          <div className="modal-body">
            {error && <div className="alert alert-danger py-2">{error}</div>}

            <div className="mb-3">
              <label className="form-label fw-semibold">Name</label>
              <input name="name" value={form.name} onChange={handleChange}
                className="form-control" required autoFocus />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className="form-control" required />
            </div>
            <div className="row g-3 mb-3">
              <div className="col-sm-6">
                <label className="form-label fw-semibold">Role</label>
                <select name="role" value={form.role} onChange={handleChange}
                  className="form-select" disabled={isSelf}>
                  <option value="staff">Staff</option>
                  <option value="it_user">IT user</option>
                  <option value="admin">Admin</option>
                </select>
                {isSelf && <div className="form-text">You cannot change your own role.</div>}
              </div>
              <div className="col-sm-6">
                <label className="form-label fw-semibold">User category</label>
                <select name="category_id" value={form.category_id} onChange={handleChange}
                  className="form-select">
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="form-label fw-semibold">New password</label>
              <input type="password" name="password" value={form.password}
                onChange={handleChange} className="form-control"
                autoComplete="new-password" placeholder="Leave empty to keep the current one" />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary"
              onClick={onClose} disabled={saving}>Cancel</button>
            <button className="btn btn-success" disabled={saving || !dirty}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const Users = () => {
  const [users, setUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [editing, setEditing] = useState(null) // the user being edited, or null

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

  const handleSaved = (updated) => {
    // Keep the name shown in the header right if the admin edited themselves
    if (updated.isSelf) localStorage.setItem('name', updated.name)
    setEditing(null)
    setError('')
    setSuccess('Account updated')
    load()
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
                    <td className="text-end text-nowrap">
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => { setSuccess(''); setError(''); setEditing(u) }}
                      >
                        <i className="bi bi-pencil me-1" />Edit
                      </button>
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

      {editing && (
        <EditUserModal
          user={editing}
          categories={categories}
          isSelf={editing.id === currentUserId()}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}

export default Users
