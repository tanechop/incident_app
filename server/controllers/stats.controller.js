import asyncHandler from '../middleware/asyncHandler.js'
import * as statsService from '../services/stats.service.js'

export const get = asyncHandler(async (req, res) => {
  res.json(await statsService.getStats())
})
