import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

// Files are saved in the "uploads" folder at the root of the server
const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const ALLOWED_FILES = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt']

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    // random name so two files with the same name never overwrite each other
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`)
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ALLOWED_FILES.includes(ext)) return cb(null, true)
    cb(new Error('Allowed files: images, PDF, Word, Excel or text'))
  },
})

// Reads one optional file sent in the field "attachment"
export function uploadAttachment(req, res, next) {
  upload.single('attachment')(req, res, (err) => {
    if (!err) return next()
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 5 MB)' : err.message
    res.status(400).json({ error: msg })
  })
}
