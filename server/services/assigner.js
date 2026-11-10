import { db } from '../config/db.js'
import { notify } from './notification.service.js'
import { createAssigner } from './ticketAssignment.service.js'

// The one automatic-assignment engine shared by the whole server
// (rules and algorithm: ticketAssignment.service.js)
export const assigner = createAssigner({ db, notify })
