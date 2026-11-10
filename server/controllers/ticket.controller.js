import fs from 'fs'
import asyncHandler from '../middleware/asyncHandler.js'
import * as ticketService from '../services/ticket.service.js'

/* STAFF-user */

export const create = asyncHandler(async (req, res) => {
  try {
    const ticket = await ticketService.createTicket(req.user.id, req.body, req.file)
    res.status(201).json(ticket)
  } catch (err) {
    // the ticket was not created: remove the file we just saved
    if (req.file) fs.unlink(req.file.path, () => {})
    throw err
  }
})

export const mine = asyncHandler(async (req, res) => {
  res.json(await ticketService.listMyTickets(req.user.id))
})

export const close = asyncHandler(async (req, res) => {
  await ticketService.closeTicket(req.params.id, req.user.id)
  res.json({ ok: true })
})

/*ITuser*/

export const unassigned = asyncHandler(async (req, res) => {
  res.json(await ticketService.listUnassigned())
})

export const assigned = asyncHandler(async (req, res) => {
  res.json(await ticketService.listAssigned(req.user.id))
})

export const takeCharge = asyncHandler(async (req, res) => {
  await ticketService.takeCharge(req.params.id, req.user.id)
  res.json({ ok: true })
})

export const updateStatus = asyncHandler(async (req, res) => {
  await ticketService.updateStatus(req.params.id, req.user.id, req.body.status)
  res.json({ ok: true })
})

export const resolve = asyncHandler(async (req, res) => {
  await ticketService.resolveTicket(req.params.id, req.user.id, req.body.resolution)
  res.json({ ok: true })
})

/*ADMIN  */

export const listAll = asyncHandler(async (req, res) => {
  res.json(await ticketService.listAllTickets())
})
