import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

const CreateTicket = () => {
  const [categories, setCategories] = useState([])
  const [values, setValues] = useState({
    title: '', description: '', category_id: '', priority: 'medium',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data)).catch(console.error)
  }, [])

  const handleChange = (e) =>
    setValues({ ...values, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/tickets', values)
      navigate('/dashboard/tickets')
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create the ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ maxWidth: 650 }}>
      <div className="card-body">
        <h5 className="mb-3">Create a ticket</h5>
        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Title</label>
            <input name="title" value={values.title} onChange={handleChange}
              className="form-control" placeholder="Short summary of the problem" required />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Description</label>
            <textarea name="description" rows="4" value={values.description}
              onChange={handleChange} className="form-control"
              placeholder="Explain what happened" required />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Category</label>
              <select name="category_id" value={values.category_id}
                onChange={handleChange} className="form-select" required>
                <option value="">Choose...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Priority</label>
              <select name="priority" value={values.priority}
                onChange={handleChange} className="form-select">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <button className="btn btn-success" disabled={loading}>
            {loading ? 'Sending...' : 'Submit ticket'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateTicket