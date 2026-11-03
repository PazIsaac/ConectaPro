import { Router } from 'express'
import { consultar } from '../db'
import { asyncHandler } from '../middleware/errores'

const router = Router()

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const categorias = await consultar<{
      CategoriaId: number
      Nombre: string
      Descripcion: string
      Icono: string
      CantidadServicios: number
    }>(
      `SELECT c.CategoriaId, c.Nombre, c.Descripcion, c.Icono,
              COUNT(s.ServicioId) AS CantidadServicios
       FROM dbo.Categorias c
       LEFT JOIN dbo.Servicios s ON s.CategoriaId = c.CategoriaId AND s.Activo = 1
       WHERE c.Activa = 1
       GROUP BY c.CategoriaId, c.Nombre, c.Descripcion, c.Icono, c.Orden
       ORDER BY c.Orden`,
    )

    res.json({
      categorias: categorias.map((categoria) => ({
        id: categoria.CategoriaId,
        nombre: categoria.Nombre,
        descripcion: categoria.Descripcion,
        icono: categoria.Icono,
        cantidadServicios: categoria.CantidadServicios,
      })),
    })
  }),
)

router.get(
  '/estadisticas',
  asyncHandler(async (_req, res) => {
    const filas = await consultar<{
      Profesionales: number
      Servicios: number
      Categorias: number
      Resenas: number
      Promedio: number | null
    }>(`SELECT
         (SELECT COUNT(*) FROM dbo.Profesionales WHERE Disponible = 1) AS Profesionales,
         (SELECT COUNT(*) FROM dbo.Servicios WHERE Activo = 1) AS Servicios,
         (SELECT COUNT(*) FROM dbo.Categorias WHERE Activa = 1) AS Categorias,
         (SELECT COUNT(*) FROM dbo.Resenas) AS Resenas,
         (SELECT AVG(CAST(Puntuacion AS DECIMAL(3,2))) FROM dbo.Resenas) AS Promedio`)

    const datos = filas[0]
    res.json({
      estadisticas: {
        profesionales: datos?.Profesionales ?? 0,
        servicios: datos?.Servicios ?? 0,
        categorias: datos?.Categorias ?? 0,
        resenas: datos?.Resenas ?? 0,
        promedio: datos?.Promedio !== null && datos?.Promedio !== undefined
          ? Number(datos.Promedio)
          : null,
      },
    })
  }),
)

export default router
