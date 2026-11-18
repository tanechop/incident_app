import { useEffect, useState } from 'react'
import api from '../../services/api'

const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro']

const AISettings = () => {
  const [settings, setSettings] = useState(null)
  const [enabled, setEnabled] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [replacing, setReplacing] = useState(false)
  const [model, setModel] = useState('gemini-2.5-flash')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState(null) // { type, text }
  const [test, setTest] = useState(null)       // result of "Test connection"

  const apply = (s) => {
    setSettings(s)
    setEnabled(s.enabled)
    setModel(s.model)
    setApiKey('')
    setReplacing(false)
  }

  useEffect(() => {
    api.get('/settings/ai')
      .then((res) => apply(res.data))
      .catch(() => setMessage({ type: 'danger', text: 'Could not load the AI settings' }))
  }, [])

  if (!settings) return message ? <div className={`alert alert-${message.type}`}>{message.text}</div> : <p>Loading...</p>

  const showKeyInput = !settings.hasKey || replacing
  const dirty = enabled !== settings.enabled || model !== settings.model || apiKey.trim() !== ''

  const save = async (e) => {
    e.preventDefault()
    setMessage(null)
    setSaving(true)
    try {
      const body = { enabled, model }
      if (apiKey.trim()) body.apiKey = apiKey
      const { data } = await api.put('/settings/ai', body)
      apply(data)
      setTest(null)
      setMessage({ type: 'success', text: 'Settings saved.' })
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Could not save the settings' })
    } finally {
      setSaving(false)
    }
  }

  const runTest = async () => {
    setTest(null)
    setTesting(true)
    try {
      const { data } = await api.post('/settings/ai/test', { apiKey, model })
      setTest(data)
    } catch (err) {
      setTest({ ok: false, error: err.response?.data?.error || 'The test could not run' })
    } finally {
      setTesting(false)
    }
  }

  const status = settings.active
    ? { cls: 'success', text: 'Active' }
    : settings.enabled
      ? { cls: 'warning', text: 'Needs a working key' }
      : { cls: 'secondary', text: 'Off' }
  const share = settings.totalTickets ? Math.round((settings.aiTickets / settings.totalTickets) * 100) : 0

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="mb-4">
        <h1 className="h4 mb-1">AI priority</h1>
        <p className="text-muted mb-0">
          Gemini reads each new ticket and sets its priority, so urgent problems reach the IT team first.
        </p>
      </div>

      {message && <div className={`alert alert-${message.type} py-2`} role="status">{message.text}</div>}

      <div className="row g-3 mb-4">
        <div className="col-sm-6">
          <div className="card h-100"><div className="card-body">
            <div className="text-muted small">Status</div>
            <span className={`badge text-bg-${status.cls} fs-6 mt-1`}>{status.text}</span>
          </div></div>
        </div>
        <div className="col-sm-6">
          <div className="card h-100"><div className="card-body">
            <div className="text-muted small">Tickets prioritized by AI</div>
            <div className="fs-4 fw-semibold">
              {settings.aiTickets} <span className="fs-6 text-muted fw-normal">of {settings.totalTickets} ({share}%)</span>
            </div>
          </div></div>
        </div>
      </div>

      <form className="card" onSubmit={save}>
        <div className="card-body">
          <div className="form-check form-switch mb-4">
            <input
              className="form-check-input" type="checkbox" role="switch" id="ai-on"
              checked={enabled} onChange={(e) => setEnabled(e.target.checked)}
            />
            <label className="form-check-label fw-semibold" htmlFor="ai-on">
              Set the priority of new tickets with AI
            </label>
            <div className="form-text">
              When it is off, or if Gemini does not answer, the priority chosen by the employee is kept.
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold" htmlFor="ai-key">Gemini API key</label>
            {showKeyInput ? (
              <>
                <input
                  id="ai-key" type="password" className="form-control" autoComplete="off"
                  value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your key here"
                />
                <div className="form-text">
                  No key yet?{' '}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                    Create one for free in Google AI Studio
                  </a>. It is stored encrypted and never shown again.
                </div>
              </>
            ) : (
              <div className="d-flex align-items-center gap-3">
                <code className="px-3 py-2 bg-light rounded">•••••••••••• {settings.keyHint}</code>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setReplacing(true)}>
                  Replace key
                </button>
                {settings.keySource === 'env' && <span className="text-muted small">from the server settings (.env)</span>}
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold" htmlFor="ai-model">Model</label>
            <input
              id="ai-model" className="form-control" list="ai-models"
              value={model} onChange={(e) => setModel(e.target.value)}
            />
            <datalist id="ai-models">{MODELS.map((m) => <option key={m} value={m} />)}</datalist>
            <div className="form-text">The default works for most cases. Change it only if Google renames or retires it.</div>
          </div>

          {test && (
            <div className={`alert alert-${test.ok ? 'success' : 'danger'} py-2`} role="status">
              {test.ok
                ? <>Connected. A sample ticket got <strong>{test.priority}</strong> priority: {test.reason}</>
                : <>Connection failed. {test.error}</>}
            </div>
          )}

          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-success" disabled={saving || !dirty}>
              {saving ? 'Saving...' : 'Save settings'}
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={runTest}
              disabled={testing || (!settings.hasKey && !apiKey.trim())}>
              {testing ? 'Testing...' : 'Test connection'}
            </button>
          </div>
        </div>
      </form>

      <div className="card mt-4">
        <div className="card-body">
          <h2 className="h6">How it works</h2>
          <ol className="mb-0 ps-3 text-muted">
            <li>An employee sends a ticket (title, description, category).</li>
            <li>Gemini decides High, Medium or Low and gives a short reason.</li>
            <li>The IT team sees the reason in the ticket details, and urgent tickets are assigned first.</li>
          </ol>
          <p className="small text-muted mt-3 mb-0">
            Ticket titles and descriptions are sent to Google for this. Ask employees not to write passwords
            or personal data in tickets.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AISettings
