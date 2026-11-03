import app from './app'
import { config } from './config'
import { cerrarPool, getPool } from './db'

async function iniciar(): Promise<void> {
  try {
    await getPool()
    console.log(`[db] Conectado a SQL Server: ${config.db.servidor}/${config.db.nombre}`)
  } catch (error) {
    console.error('[db] No se pudo conectar a SQL Server.')
    console.error(`[db] Verificá ${config.db.servidor}/${config.db.nombre} y ejecutá "npm run setup:db".`)
    console.error(`[db] Detalle: ${(error as Error).message}`)
    process.exitCode = 1
    return
  }

  app.listen(config.puerto, () => {
    console.log(`[api] ConectaPro disponible en http://localhost:${config.puerto}`)
    console.log(`[api] IA: ${config.ia.apiKey ? `modelo ${config.ia.modelo}` : 'motor local (sin clave externa)'}`)
    console.log(`[api] Entorno: ${config.entorno}`)
  })
}

const apagar = async (senal: string): Promise<void> => {
  console.log(`\n[api] Cerrando por ${senal}...`)
  await cerrarPool().catch(() => undefined)
  process.exit(0)
}

process.on('SIGINT', () => void apagar('SIGINT'))
process.on('SIGTERM', () => void apagar('SIGTERM'))

void iniciar()
