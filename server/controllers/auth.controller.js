import asyncHandler from '../middleware/asyncHandler.js'
import * as authService from '../services/auth.service.js'

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  res.json(await authService.login(email, password))
})
