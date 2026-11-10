import { Router } from 'express'
import { auth } from '../middleware/auth.js'
import * as controller from '../controllers/notification.controller.js'

const router = Router()
router.use(auth)

router.get('/', controller.list)
router.put('/read-all', controller.readAll)
router.put('/:id/read', controller.readOne)

export default router
