import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
    <div className="card shadow-sm mx-auto" style={{ maxWidth: 720 }}>
      <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center gap-2">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: 36, height: 36, background: 'var(--brand-light)', color: 'var(--brand)' }}
        >
          <i className="bi bi-pencil-square fs-5"></i>
        </div>
        <div>
          <h5 className="mb-0 fw-bold">Submit Support Request</h5>
          <span className="text-muted small">Provide details so our IT support team can resolve your issue quickly</span>
        </div>
      </div>

      <div className="card-body p-4">
        {error && (
          <div className="alert alert-danger py-2.5 d-flex align-items-center gap-2 small mb-4" role="alert">
            <i className="bi bi-exclamation-octagon-fill flex-shrink-0"></i>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">
              <i className="bi bi-card-heading me-1 text-muted"></i> Incident Title
            </label>
            <input
              name="title"
              value={values.title}
              onChange={handleChange}
              className="form-control"
              placeholder="e.g. Cannot connect to office Wi-Fi, Outlook crashes on launch"
              required
            />
            <div className="form-text" style={{ fontSize: '0.78rem', color: '#8b7d90' }}>
              A short, clear summary of what is happening.
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label">
                <i className="bi bi-tag me-1 text-muted"></i> Category
              </label>
              <select
                name="category_id"
                value={values.category_id}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select a category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">
                <i className="bi bi-flag me-1 text-muted"></i> Urgency / Priority
              </label>
              <select
                name="priority"
                value={values.priority}
                onChange={handleChange}
                className="form-select"
              >
                <option value="low">🟢 Low — Minor inconvenience</option>
                <option value="medium">🟡 Medium — Normal business impact</option>
                <option value="high">🔴 High — Work completely blocked</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label">
              <i className="bi bi-text-paragraph me-1 text-muted"></i> Detailed Description
            </label>
            <textarea
              name="description"
              rows="5"
              value={values.description}
              onChange={handleChange}
              className="form-control"
              placeholder="Please describe what you were doing when the issue occurred, any error messages shown, and steps to reproduce..."
              required
            />
          </div>

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <Link to="/dashboard" className="btn btn-outline-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Submitting Ticket...
                </>
              ) : (
                <>
                  <i className="bi bi-send-fill"></i> Submit Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateTicket
