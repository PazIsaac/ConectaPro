import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, validar } from '../middleware/errores'
import { listarProfesionales, obtenerProfesional } from '../services/catalogo'
import { listarResenas } from '../services/resenas'

const router = Router()

const esquemaFiltros = z.object({
  busqueda: z.string().trim().max(100).optional(),
  categoriaId: z.coerce.number().int().positive().optional(),
  zona: z.string().trim().max(120).optional(),
  disponible: z.enum(['true', 'false']).optional(),
})

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filtros = validar(esquemaFiltros, req.query)
    const profesionales = await listarProfesionales({
      busqueda: filtros.busqueda,
      categoriaId: filtros.categoriaId,
      zona: filtros.zona,
      soloDisponibles: filtros.disponible !== 'false',
    })
    res.json({ profesionales })
  }),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'El identificador del profesional no es válido.' })
      return
    }

    const profesional = await obtenerProfesional(id)
    if (!profesional) {
      res.status(404).json({ error: 'No encontramos el perfil profesional solicitado.' })
      return
    }

    const resenas = await listarResenas(id)
    res.json({ profesional, resenas })
  }),
)

router.get(
  '/:id/resenas',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'El identificador del profesional no es válido.' })
      return
    }
    res.json({ resenas: await listarResenas(id) })
  }),
)

export default router
