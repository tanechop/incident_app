import { Router } from 'express'
import { auth, only } from '../middleware/auth.js'
import * as controller from '../controllers/category.controller.js'

const router = Router()
router.use(auth)

router.get('/', controller.list)
router.post('/', only('admin'), controller.create)
router.put('/:id', only('admin'), controller.rename)
router.delete('/:id', only('admin'), controller.remove)

export default router
