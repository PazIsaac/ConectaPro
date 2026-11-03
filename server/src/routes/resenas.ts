import { Router } from 'express'
import { z } from 'zod'
import { consultar, ejecutar } from '../db'
import { autenticar, soloRol } from '../middleware/auth'
import { ApiError, asyncHandler, validar } from '../middleware/errores'
import { listarResenas } from '../services/resenas'

const router = Router()

const esquemaResena = z.object({
  profesionalId: z.coerce.number().int().positive(),
  puntuacion: z.coerce.number().int().min(1).max(5),
  comentario: z.string().trim().min(10, 'El comentario debe tener al menos 10 caracteres.').max(1000),
})

router.post(
  '/',
  autenticar,
  soloRol('cliente'),
  asyncHandler(async (req, res) => {
    const datos = validar(esquemaResena, req.body)

    const profesionales = await consultar<{ ProfesionalId: number }>(
      'SELECT ProfesionalId FROM dbo.Profesionales WHERE ProfesionalId = @id',
      { id: datos.profesionalId },
    )
    if (profesionales.length === 0) throw new ApiError(404, 'El profesional seleccionado no existe.')

    const previas = await consultar<{ ResenaId: number }>(
      'SELECT ResenaId FROM dbo.Resenas WHERE ClienteId = @clienteId AND ProfesionalId = @profesionalId',
      { clienteId: req.usuario!.id, profesionalId: datos.profesionalId },
    )
    if (previas.length > 0) {
      throw new ApiError(409, 'Ya publicaste una reseña para este profesional.')
    }

    await ejecutar(
      `INSERT INTO dbo.Resenas (ProfesionalId, ClienteId, Puntuacion, Comentario)
       VALUES (@profesionalId, @clienteId, @puntuacion, @comentario)`,
      {
        profesionalId: datos.profesionalId,
        clienteId: req.usuario!.id,
        puntuacion: datos.puntuacion,
        comentario: datos.comentario,
      },
    )

    res.status(201).json({ mensaje: 'Tu reseña se publicó correctamente.' })
  }),
)

router.delete(
  '/:id',
  autenticar,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const filas = await consultar<{ ClienteId: number }>(
      'SELECT ClienteId FROM dbo.Resenas WHERE ResenaId = @id',
      { id },
    )
    const resena = filas[0]
    if (!resena) throw new ApiError(404, 'No encontramos la reseña.')
    if (resena.ClienteId !== req.usuario!.id) {
      throw new ApiError(403, 'Solo podés eliminar tus propias reseñas.')
    }

    await ejecutar('DELETE FROM dbo.Resenas WHERE ResenaId = @id', { id })
    res.json({ mensaje: 'La reseña se eliminó correctamente.' })
  }),
)

router.get(
  '/profesional/:profesionalId',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.profesionalId)
    if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, 'El profesional no es válido.')
    res.json({ resenas: await listarResenas(id) })
  }),
)

export default router
