import asyncHandler from '../middleware/asyncHandler.js'
import * as userService from '../services/user.service.js'

export const list = asyncHandler(async (req, res) => {
  res.json(await userService.listUsers(req.query.role))
})

export const create = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body)
  res.status(201).json(user)
})

export const remove = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id, req.user.id)
  res.json({ ok: true })
})
