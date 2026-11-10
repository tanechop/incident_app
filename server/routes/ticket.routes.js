import { Router } from 'express'
import { auth, only } from '../middleware/auth.js'
import { uploadAttachment } from '../middleware/upload.js'
import * as controller from '../controllers/ticket.controller.js'

const router = Router()
router.use(auth)

// Staff
router.post('/', only('staff'), uploadAttachment, controller.create)
router.get('/my', only('staff'), controller.mine)
router.put('/:id/close', only('staff'), controller.close)

// IT user
router.get('/unassigned', only('it_user'), controller.unassigned)
router.get('/assigned', only('it_user'), controller.assigned)
router.put('/:id/take-charge', only('it_user'), controller.takeCharge)
router.put('/:id/status', only('it_user'), controller.updateStatus)
router.put('/:id/resolve', only('it_user'), controller.resolve)

// Admin
router.get('/', only('admin'), controller.listAll)

export default router
