import { Router } from 'express'
import { auth, only } from '../middleware/auth.js'
import * as controller from '../controllers/settings.controller.js'

const router = Router()
router.use(auth)

router.get('/ai/status', controller.aiStatus)
router.get('/ai', only('admin'), controller.getAi)
router.put('/ai', only('admin'), controller.saveAi)
router.post('/ai/test', only('admin'), controller.testAi)

export default router
