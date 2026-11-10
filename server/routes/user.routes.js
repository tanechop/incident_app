import { Router } from 'express'
import { auth, only } from '../middleware/auth.js'
import * as controller from '../controllers/user.controller.js'

const router = Router()
router.use(auth, only('admin'))

router.get('/', controller.list)
router.post('/', controller.create)
router.delete('/:id', controller.remove)

export default router
