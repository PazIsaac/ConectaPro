import { Router } from 'express'
import { z } from 'zod'
import { consultar } from '../db'
import { autenticar, soloRol } from '../middleware/auth'
import { asyncHandler, validar } from '../middleware/errores'
import { iaConfigurada, mejorarDescripcion, sugerirCategoria, type CategoriaIA } from '../services/ia'

const router = Router()

const esquemaSugerencia = z.object({
  descripcion: z
    .string()
    .trim()
    .min(10, 'Describí tu necesidad con un poco más de detalle.')
    .max(1000),
})

const esquemaMejora = z.object({
  texto: z.string().trim().min(20, 'Escribí una descripción base de al menos 20 caracteres.').max(1500),
  categoria: z.string().trim().max(80).optional(),
})

async function registrarConsulta(
  tipo: string,
  entrada: string,
  salida: unknown,
  proveedor: string,
  usuarioId: number | null,
): Promise<void> {
  try {
    await consultar(
      `INSERT INTO dbo.IaConsultas (UsuarioId, Tipo, Entrada, Salida, Proveedor)
       VALUES (@usuarioId, @tipo, @entrada, @salida, @proveedor)`,
      {
        usuarioId,
        tipo,
        entrada: entrada.slice(0, 1000),
        salida: JSON.stringify(salida).slice(0, 2000),
        proveedor: proveedor.slice(0, 40),
      },
    )
  } catch (error) {
    console.warn('[ia] No se pudo registrar la consulta:', (error as Error).message)
  }
}

router.get('/estado', (_req, res) => {
  res.json({
    modo: iaConfigurada() ? 'modelo' : 'local',
    descripcion: iaConfigurada()
      ? 'Clasificación y redacción con modelo de lenguaje externo, con respaldo local.'
      : 'Motor local de clasificación semántica por palabras clave. Configurá IA_API_KEY para usar un modelo de lenguaje.',
  })
})

router.post(
  '/sugerir-categoria',
  asyncHandler(async (req, res) => {
    const datos = validar(esquemaSugerencia, req.body)
    const filas = await consultar<{
      CategoriaId: number
      Nombre: string
      Descripcion: string
    }>('SELECT CategoriaId, Nombre, Descripcion FROM dbo.Categorias WHERE Activa = 1 ORDER BY Orden')

    const categorias: CategoriaIA[] = filas.map((fila) => ({
      id: fila.CategoriaId,
      nombre: fila.Nombre,
      descripcion: fila.Descripcion,
    }))

    const sugerencia = await sugerirCategoria(datos.descripcion, categorias)

    if (sugerencia.categoriaId) {
      const profesionales = await consultar<{ Total: number }>(
        `SELECT COUNT(DISTINCT p.ProfesionalId) AS Total
         FROM dbo.Profesionales p
         INNER JOIN dbo.Servicios s ON s.ProfesionalId = p.ProfesionalId
         WHERE p.Disponible = 1 AND s.Activo = 1 AND s.CategoriaId = @categoriaId`,
        { categoriaId: sugerencia.categoriaId },
      )
      Object.assign(sugerencia, { profesionalesDisponibles: profesionales[0]?.Total ?? 0 })
    }

    await registrarConsulta(
      'sugerir-categoria',
      datos.descripcion,
      sugerencia,
      sugerencia.proveedor,
      null,
    )

    res.json({ sugerencia })
  }),
)

router.post(
  '/mejorar-descripcion',
  autenticar,
  soloRol('profesional'),
  asyncHandler(async (req, res) => {
    const datos = validar(esquemaMejora, req.body)
    const resultado = await mejorarDescripcion(datos.texto, datos.categoria)

    await registrarConsulta(
      'mejorar-descripcion',
      datos.texto,
      resultado,
      resultado.proveedor,
      req.usuario!.id,
    )

    res.json({ resultado })
  }),
)

export default router
