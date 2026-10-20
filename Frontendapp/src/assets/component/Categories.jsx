import { useEffect, useState } from 'react'
import api from '../../services/api'

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  const load = () =>
    api.get('/categories').then((res) => setCategories(res.data)).catch(console.error)

  useEffect(() => { load() }, [])

  const add = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/categories', { name })
      setName('')
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add the category')
    }
  }

  const saveEdit = async (id) => {
    setError('')
    try {
      await api.put(`/categories/${id}`, { name: editName })
      setEditingId(null)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not rename the category')
    }
  }

  const remove = async (c) => {
    if (!window.confirm(`Delete the category "${c.name}"?`)) return
    setError('')
    try {
      await api.delete(`/categories/${c.id}`)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete (it may be used by tickets)')
    }
  }

  return (
    <div className="card" style={{ maxWidth: 650 }}>
      <div className="card-body">
        <h5 className="mb-3">Categories</h5>
        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={add} className="d-flex gap-2 mb-4">
          <input
            className="form-control"
            placeholder="New category name (e.g. Network)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <button className="btn btn-success">Add</button>
        </form>

        <ul className="list-group">
          {categories.length === 0 && (
            <li className="list-group-item text-muted">No categories yet</li>
          )}
          {categories.map((c) => (
            <li key={c.id}
              className="list-group-item d-flex justify-content-between align-items-center gap-2">
              {editingId === c.id ? (
                <>
                  <input
                    className="form-control form-control-sm"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-success" onClick={() => saveEdit(c.id)}>
                      Save
                    </button>
                    <button className="btn btn-sm btn-outline-secondary"
                      onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span>{c.name}</span>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => { setEditingId(c.id); setEditName(c.name) }}
                    >
                      Rename
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => remove(c)}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Categories