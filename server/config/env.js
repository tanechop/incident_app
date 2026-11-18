import dotenv from 'dotenv'

// Must run before anything else reads process.env
dotenv.config()

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET in the .env file')
  process.exit(1)
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: '8h',
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'incident_db',
  },
  // Email is optional: it only works if MAIL_USER and MAIL_PASS are in .env
  mail: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  // Optional: public address of the web app, shown as a button in emails (e.g. http://localhost:5173)
  appUrl: process.env.APP_URL,
  // Optional: Gemini sets the priority of new tickets. Off when GEMINI_API_KEY is missing.
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || 8000,
  },
  dispatchIntervalMs: Number(process.env.DISPATCH_INTERVAL_MS) || 60000,
}
