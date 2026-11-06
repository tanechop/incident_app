import { useEffect, useState } from 'react'
import api from '../../services/api'

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    api.get('/categories')
      .then((res) => setCategories(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const add = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await api.post('/categories', { name })
      setSuccess(`Category "${name}" added successfully.`)
      setName('')
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add the category')
    }
  }

  const saveEdit = async (id) => {
    setError('')
    setSuccess('')
    try {
      await api.put(`/categories/${id}`, { name: editName })
      setSuccess('Category renamed successfully.')
      setEditingId(null)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not rename the category')
    }
  }

  const remove = async (c) => {
    if (!window.confirm(`Delete the category "${c.name}"?`)) return
    setError('')
    setSuccess('')
    try {
      await api.delete(`/categories/${c.id}`)
      setSuccess(`Category "${c.name}" removed successfully.`)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete (it may be used by existing tickets)')
    }
  }

  return (
    <div className="card shadow-sm mx-auto" style={{ maxWidth: 740 }}>
      <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center gap-2">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: 34, height: 34, background: 'var(--brand-light)', color: 'var(--brand)' }}
        >
          <i className="bi bi-tags-fill"></i>
        </div>
        <div>
          <h5 className="mb-0 fw-bold">Incident Classification Categories</h5>
          <span className="text-muted small">Configure service categories used by employees to file support tickets</span>
        </div>
      </div>

      <div className="card-body p-4">
        {error && (
          <div className="alert alert-danger py-2.5 d-flex align-items-center gap-2 mb-3 small" role="alert">
            <i className="bi bi-exclamation-octagon-fill flex-shrink-0"></i>
            <div>{error}</div>
          </div>
        )}
        {success && (
          <div className="alert alert-success py-2.5 d-flex align-items-center gap-2 mb-3 small" role="alert">
            <i className="bi bi-check-circle-fill flex-shrink-0"></i>
            <div>{success}</div>
          </div>
        )}

        <form onSubmit={add} className="d-flex gap-2 mb-4">
          <input
            className="form-control"
            placeholder="New category name (e.g. Database Access, VPN, Hardware)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <button className="btn btn-primary text-nowrap">
            <i className="bi bi-plus-lg"></i> Add Category
          </button>
        </form>

        <div className="list-group list-group-flush rounded-3 border">
          {loading && (
            <div className="text-center py-4 text-muted small">
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Loading categories...
            </div>
          )}
          {!loading && categories.length === 0 && (
            <div className="text-center py-4 text-muted small">
              No categories configured yet. Add your first category above.
            </div>
          )}
          {!loading && categories.map((c) => (
            <div
              key={c.id}
              className="list-group-item d-flex justify-content-between align-items-center gap-2 py-3 px-3.5"
            >
              {editingId === c.id ? (
                <>
                  <input
                    className="form-control form-control-sm"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-success" onClick={() => saveEdit(c.id)}>
                      <i className="bi bi-check"></i> Save
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="d-flex align-items-center gap-2.5">
                    <i className="bi bi-folder-fill text-muted"></i>
                    <span className="fw-semibold text-dark">{c.name}</span>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => { setEditingId(c.id); setEditName(c.name) }}
                    >
                      <i className="bi bi-pencil"></i> Rename
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => remove(c)}>
                      <i className="bi bi-trash"></i> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Categories
