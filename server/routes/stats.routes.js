import { Router } from 'express'
import { auth, only } from '../middleware/auth.js'
import * as controller from '../controllers/stats.controller.js'

const router = Router()
router.use(auth, only('admin'))

router.get('/', controller.get)

export default router
