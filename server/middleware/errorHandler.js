import HttpError from '../utils/HttpError.js'

// Last middleware: one place that turns every error into a JSON answer
// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message })
  }
  console.error(err)
  res.status(500).json({ error: 'Server error' })
}
