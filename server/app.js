import express from 'express'
import cors from 'cors'
import routes from './routes/index.js'
import errorHandler from './middleware/errorHandler.js'
import { UPLOAD_DIR } from './middleware/upload.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(UPLOAD_DIR)) // ticket attachments
app.use(routes)
app.use(errorHandler)

export default app
