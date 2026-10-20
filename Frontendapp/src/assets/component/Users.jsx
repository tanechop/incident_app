import { useEffect, useState } from 'react'
import api from '../../services/api'

const roleLabel = { staff: 'Staff', it_user: 'IT user', admin: 'Admin' }
const roleColor = { staff: 'primary', it_user: 'warning', admin: 'dark' }

const Users = () => {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const load = () =>
    api.get('/users').then((res) => setUsers(res.data)).catch(console.error)

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
            <div className="col-md-6">
              <label className="form-label fw-semibold">Password</label>
              <input type="password" name="password" value={form.password}
                onChange={handleChange} className="form-control" required />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Role</label>
              <select name="role" value={form.role} onChange={handleChange}
                className="form-select">
                <option value="staff">Staff</option>
                <option value="it_user">IT user</option>
                <option value="admin">Admin</option>
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
        <div className="card-body table-responsive">
          <h5 className="mb-3">All users ({users.length})</h5>
          <table className="table align-middle">
            <thead>
              <tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th></th></tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan="5" className="text-center text-muted">No users</td></tr>
              )}
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge text-bg-${roleColor[u.role]}`}>
                      {roleLabel[u.role]}
                    </span>
                  </td>
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
    </>
  )
}

export default Users