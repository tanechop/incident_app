import { Router } from 'express'
import authRoutes from './auth.routes.js'
import categoryRoutes from './category.routes.js'
import ticketRoutes from './ticket.routes.js'
import userRoutes from './user.routes.js'
import statsRoutes from './stats.routes.js'
import notificationRoutes from './notification.routes.js'

const router = Router()

// Public
router.get('/', (req, res) => res.send('API is running'))
router.use(authRoutes)

// Protected (each router checks the login token itself)
router.use('/categories', categoryRoutes)
router.use('/tickets', ticketRoutes)
router.use('/users', userRoutes)
router.use('/stats', statsRoutes)
router.use('/notifications', notificationRoutes)

export default router
