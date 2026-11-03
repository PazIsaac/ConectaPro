import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { config } from './config'
import { manejadorErrores, noEncontrado } from './middleware/errores'
import authRoutes from './routes/auth'
import categoriaRoutes from './routes/categorias'
import profesionalRoutes from './routes/profesionales'
import servicioRoutes from './routes/servicios'
import solicitudRoutes from './routes/solicitudes'
import resenaRoutes from './routes/resenas'
import iaRoutes from './routes/ia'
import pagoRoutes from './routes/pagos'

const app = express()
app.disable('x-powered-by')

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }),
)
app.use(
  cors({
    origin(origen, callback) {
      if (!origen || config.corsOrigenes.includes(origen)) {
        callback(null, true)
        return
      }
      callback(null, false)
    },
    credentials: false,
  }),
)
app.use(express.json({ limit: '1mb' }))

const limiteGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Esperá unos minutos y volvé a intentar.' },
})

const limiteAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de acceso. Esperá unos minutos y volvé a intentar.' },
})

const limiteIa = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Se alcanzó el límite de consultas de IA. Probá nuevamente en unos minutos.' },
})

app.get('/api/salud', (_req, res) => {
  res.json({
    estado: 'ok',
    servicio: 'ConectaPro API',
    version: '1.0.0',
    ia: config.ia.apiKey ? 'modelo' : 'local',
    fecha: new Date().toISOString(),
  })
})

app.use('/api', limiteGeneral)
app.use('/api/auth', limiteAuth, authRoutes)
app.use('/api/categorias', categoriaRoutes)
app.use('/api/profesionales', profesionalRoutes)
app.use('/api/servicios', servicioRoutes)
app.use('/api/solicitudes', solicitudRoutes)
app.use('/api/resenas', resenaRoutes)
app.use('/api/pagos', pagoRoutes)
app.use('/api/ia', limiteIa, iaRoutes)

app.use('/api', noEncontrado)

// En producción, el mismo servidor entrega la aplicación React compilada.
const dist = path.resolve(__dirname, '..', '..', 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { maxAge: '1h', index: false }))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(dist, 'index.html'))
  })
} else {
  app.use(noEncontrado)
}

app.use(manejadorErrores)

export default app
