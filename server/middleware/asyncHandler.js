// Sends errors from route handlers (async or not) to the error middleware,
// so the server never crashes
const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next)
  } catch (err) {
    next(err)
  }
}

export default asyncHandler
