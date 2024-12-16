const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const cors = require('cors')
const MongoDB = require('./configs/mongodb')

const app = express()

const corsOptions = {
  origin: [
    'https://mern-bakery-app-frontend.vercel.app',
    'http://localhost:5173',
  ],
  credentials: true,
}

// middlewares
app.use(cors(corsOptions))
app.use(logger('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: false }))
app.use(cookieParser())
app.use(express.static(path.resolve(__dirname, '..', 'public')))

// routes
const apiRouter = require('./routes/apiRouter')
;(async () => {
  try {
    console.log('Connecting to database...')
    await MongoDB.connect()
    app.use('/api', apiRouter)
    app.listen(process.env.PORT, () =>
      console.log('Server is listening on port', process.env.PORT)
    )
  } catch (error) {
    console.log(error)
    process.exit(0)
  }
})()
// error handler
app.use(function (err, req, res, next) {
  const { error, status, message } = err

  return res.status(status || 500).json({
    status: status.toString().startsWith('4') ? 'failure' : 'error',
    message: message
      ? message
      : error
      ? `${error.name} - ${error.message}`
      : '',
  })
})
