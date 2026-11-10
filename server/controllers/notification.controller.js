import asyncHandler from '../middleware/asyncHandler.js'
import * as notificationService from '../services/notification.service.js'

export const list = asyncHandler(async (req, res) => {
  res.json(await notificationService.listForUser(req.user.id))
})

export const readAll = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user.id)
  res.json({ ok: true })
})

export const readOne = asyncHandler(async (req, res) => {
  await notificationService.markRead(req.params.id, req.user.id)
  res.json({ ok: true })
})
