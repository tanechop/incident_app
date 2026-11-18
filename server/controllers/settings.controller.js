import asyncHandler from '../middleware/asyncHandler.js'
import * as settingsService from '../services/settings.service.js'

// Any logged-in user: the ticket form only needs to know if AI sets the priority
export const aiStatus = asyncHandler(async (req, res) => {
  res.json({ enabled: await settingsService.isAiEnabled() })
})

export const getAi = asyncHandler(async (req, res) => {
  res.json(await settingsService.getAiSettings())
})

export const saveAi = asyncHandler(async (req, res) => {
  res.json(await settingsService.saveAiSettings(req.body))
})

export const testAi = asyncHandler(async (req, res) => {
  res.json(await settingsService.testAiConnection(req.body))
})
