// An error that carries the HTTP status to answer with.
// Services throw it, the error middleware turns it into a JSON response.
export default class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}
