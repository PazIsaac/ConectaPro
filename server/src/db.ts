import type * as Mssql from 'mssql'
import { config } from './config'

// Con autenticación de Windows se utiliza el controlador ODBC nativo.
// Con autenticación SQL se utiliza el driver pure-JS (tedious), sin dependencias nativas.
const sql: typeof Mssql = config.db.trusted
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('mssql/msnodesqlv8')
  : // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('mssql')

export { sql }
export type { Mssql }

const DRIVER = process.env.DB_DRIVER || 'ODBC Driver 18 for SQL Server'

function cadenaConexion(baseDatos: string): string {
  const partes = [
    `Driver={${DRIVER}}`,
    `Server=${config.db.servidor}`,
    `Database=${baseDatos}`,
    `TrustServerCertificate=${config.db.confiarCertificado ? 'yes' : 'no'}`,
    `Encrypt=${config.db.encriptar ? 'yes' : 'no'}`,
  ]

  if (config.db.trusted) {
    partes.push('Trusted_Connection=yes')
  } else {
    partes.push(`User Id=${config.db.usuario}`, `Password=${config.db.contrasena}`)
  }

  return `${partes.join(';')};`
}

export function crearPool(baseDatos: string): Mssql.ConnectionPool {
  if (config.db.trusted) {
    // msnodesqlv8 recibe la cadena ODBC completa. El tipo de @types/mssql no
    // declara la propiedad de nivel superior, pero el driver la admite.
    return new sql.ConnectionPool({
      connectionString: cadenaConexion(baseDatos),
      pool: { max: 10, min: 0, idleTimeoutMillis: 30_000 },
    } as unknown as Mssql.config)
  }

  return new sql.ConnectionPool({
    server: config.db.servidor,
    database: baseDatos,
    user: config.db.usuario,
    password: config.db.contrasena,
    options: {
      encrypt: config.db.encriptar,
      trustServerCertificate: config.db.confiarCertificado,
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30_000 },
  })
}

let poolPromesa: Promise<Mssql.ConnectionPool> | null = null

export function getPool(): Promise<Mssql.ConnectionPool> {
  if (poolPromesa) return poolPromesa
  const pool = crearPool(config.db.nombre)
  poolPromesa = pool.connect().catch((error: unknown) => {
    poolPromesa = null
    throw error
  })
  return poolPromesa
}

type Parametros = Record<string, unknown>

function agregarParametros(request: Mssql.Request, parametros: Parametros): void {
  for (const [nombre, valor] of Object.entries(parametros)) {
    request.input(nombre, valor as never)
  }
}

/** Ejecuta una consulta SELECT y devuelve las filas. */
export async function consultar<T>(texto: string, parametros: Parametros = {}): Promise<T[]> {
  const pool = await getPool()
  const request = pool.request()
  agregarParametros(request, parametros)
  const resultado = await request.query<T>(texto)
  return resultado.recordset
}

/** Ejecuta una sentencia de escritura y devuelve las filas afectadas. */
export async function ejecutar(texto: string, parametros: Parametros = {}): Promise<number> {
  const pool = await getPool()
  const request = pool.request()
  agregarParametros(request, parametros)
  const resultado = await request.query(texto)
  return resultado.rowsAffected.reduce((total, filas) => total + filas, 0)
}

export async function cerrarPool(): Promise<void> {
  if (!poolPromesa) return
  const pool = await poolPromesa
  await pool.close()
  poolPromesa = null
}
