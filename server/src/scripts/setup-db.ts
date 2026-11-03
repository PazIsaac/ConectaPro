import fs from 'node:fs'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import { config } from '../config'
import { consultar, crearPool, getPool, sql } from '../db'
import type { Mssql } from '../db'

const RUTA_DATABASE = path.resolve(__dirname, '../../../database')

function leerSql(nombre: string): string {
  return fs.readFileSync(path.join(RUTA_DATABASE, nombre), 'utf8')
}

async function ejecutarLotes(pool: Mssql.ConnectionPool, script: string): Promise<void> {
  const lotes = script
    .split(/^\s*GO\s*$/gim)
    .map((lote) => lote.trim())
    .filter(Boolean)

  for (const lote of lotes) {
    await pool.request().batch(lote)
  }
}

async function main(): Promise<void> {
  if (!/^[A-Za-z0-9_]+$/.test(config.db.nombre)) {
    throw new Error('DB_NAME solo puede contener letras, números y guiones bajos.')
  }

  console.log(`[setup] Servidor: ${config.db.servidor}`)
  console.log(`[setup] Base de datos: ${config.db.nombre}`)

  const maestro = crearPool('master')
  await maestro.connect()
  try {
    const existentes = await maestro
      .request()
      .input('nombre', sql.NVarChar(128), config.db.nombre)
      .query<{ nombre: string }>('SELECT name AS nombre FROM sys.databases WHERE name = @nombre')

    if (existentes.recordset.length === 0) {
      await maestro.request().batch(`CREATE DATABASE [${config.db.nombre}]`)
      console.log('[setup] Base de datos creada.')
    } else {
      console.log('[setup] La base de datos ya existe.')
    }
  } finally {
    await maestro.close()
  }

  const pool = crearPool(config.db.nombre)
  await pool.connect()
  try {
    console.log('[setup] Aplicando esquema...')
    await ejecutarLotes(pool, leerSql('01_schema.sql'))
    console.log('[setup] Cargando datos de demostración...')
    await ejecutarLotes(pool, leerSql('02_seed.sql'))

    const hash = await bcrypt.hash(config.demoPassword, 12)
    const correos = [
      'cliente@conectapro.com',
      'sofia@conectapro.com',
      'bruno@conectapro.com',
      'martin@conectapro.com',
      'lucia@conectapro.com',
      'santiago@conectapro.com',
      'camila@conectapro.com',
      'nicolas@conectapro.com',
      'valentina@conectapro.com',
      'roberto@conectapro.com',
      'mariela@conectapro.com',
      'diego@conectapro.com',
    ]

    const solicitud = pool.request()
    correos.forEach((correo, indice) => solicitud.input(`correo${indice}`, sql.NVarChar(150), correo))
    await solicitud
      .input('hash', sql.NVarChar(255), hash)
      .query(
        `UPDATE dbo.Usuarios SET ContrasenaHash = @hash
         WHERE Correo IN (${correos.map((_, indice) => `@correo${indice}`).join(', ')})`,
      )

    const resumen = await consultar<{
      Categorias: number
      Profesionales: number
      Servicios: number
      Resenas: number
    }>(`SELECT
         (SELECT COUNT(*) FROM dbo.Categorias) AS Categorias,
         (SELECT COUNT(*) FROM dbo.Profesionales) AS Profesionales,
         (SELECT COUNT(*) FROM dbo.Servicios) AS Servicios,
         (SELECT COUNT(*) FROM dbo.Resenas) AS Resenas`)

    console.log('[setup] Listo. Resumen:', resumen[0])
    console.log('')
    console.log('Cuentas de demostración:')
    console.log(`  Cliente:     cliente@conectapro.com / ${config.demoPassword}`)
    console.log(`  Profesional: martin@conectapro.com / ${config.demoPassword}`)
    console.log('')
    console.log('Recordá que estas cuentas son solo para desarrollo y pruebas.')
  } finally {
    await pool.close()
    await getPool()
      .then((conectado) => conectado.close())
      .catch(() => undefined)
  }
}

main().catch((error) => {
  console.error('[setup] Error:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})
