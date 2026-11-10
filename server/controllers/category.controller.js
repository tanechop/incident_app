import asyncHandler from '../middleware/asyncHandler.js'
import * as categoryService from '../services/category.service.js'

export const list = asyncHandler(async (req, res) => {
  res.json(await categoryService.listCategories())
})

export const create = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body.name)
  res.status(201).json(category)
})

export const rename = asyncHandler(async (req, res) => {
  await categoryService.renameCategory(req.params.id, req.body.name)
  res.json({ ok: true })
})

export const remove = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id)
  res.json({ ok: true })
})
