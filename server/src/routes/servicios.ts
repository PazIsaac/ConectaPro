import { Router } from 'express'
import { z } from 'zod'
import { consultar, ejecutar } from '../db'
import { autenticar, soloRol } from '../middleware/auth'
import { ApiError, asyncHandler, validar } from '../middleware/errores'
import { listarServicios, obtenerServicio } from '../services/catalogo'

const router = Router()

const modalidades = ['A domicilio', 'En taller', 'Remoto', 'Mixta'] as const

const esquemaServicio = z.object({
  nombre: z.string().trim().min(5, 'El nombre debe tener al menos 5 caracteres.').max(120),
  descripcion: z
    .string()
    .trim()
    .min(20, 'La descripción debe tener al menos 20 caracteres.')
    .max(1000),
  categoriaId: z.coerce.number().int().positive('Seleccioná una categoría.'),
  precioReferencia: z.string().trim().max(80).optional().default(''),
  zona: z.string().trim().max(120).optional().default(''),
  disponible: z.boolean().optional().default(true),
  modalidad: z.enum(modalidades).optional().default('A domicilio'),
})

const esquemaFiltros = z.object({
  busqueda: z.string().trim().max(100).optional(),
  categoriaId: z.coerce.number().int().positive().optional(),
  zona: z.string().trim().max(120).optional(),
  disponible: z.enum(['true', 'false']).optional(),
  profesionalId: z.coerce.number().int().positive().optional(),
})

async function verificarCategoria(categoriaId: number): Promise<void> {
  const filas = await consultar<{ CategoriaId: number }>(
    'SELECT CategoriaId FROM dbo.Categorias WHERE CategoriaId = @id AND Activa = 1',
    { id: categoriaId },
  )
  if (filas.length === 0) throw new ApiError(400, 'La categoría seleccionada no existe o no está activa.')
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filtros = validar(esquemaFiltros, req.query)
    const servicios = await listarServicios({
      busqueda: filtros.busqueda,
      categoriaId: filtros.categoriaId,
      zona: filtros.zona,
      profesionalId: filtros.profesionalId,
      soloDisponibles: filtros.disponible !== 'false',
    })
    res.json({ servicios })
  }),
)

router.get(
  '/mios',
  autenticar,
  soloRol('profesional'),
  asyncHandler(async (req, res) => {
    if (!req.usuario!.profesionalId) {
      throw new ApiError(404, 'No encontramos tu perfil profesional.')
    }
    const servicios = await listarServicios({
      profesionalId: req.usuario!.profesionalId,
      soloDisponibles: false,
    })
    res.json({ servicios })
  }),
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const servicio = await obtenerServicio(Number(req.params.id))
    if (!servicio) throw new ApiError(404, 'No encontramos el servicio solicitado.')
    res.json({ servicio })
  }),
)

router.post(
  '/',
  autenticar,
  soloRol('profesional'),
  asyncHandler(async (req, res) => {
    const profesionalId = req.usuario!.profesionalId
    if (!profesionalId) throw new ApiError(403, 'Tu cuenta no tiene un perfil profesional asociado.')

    const datos = validar(esquemaServicio, req.body)
    await verificarCategoria(datos.categoriaId)

    const filas = await consultar<{ ServicioId: number }>(
      `INSERT INTO dbo.Servicios
         (ProfesionalId, CategoriaId, Nombre, Descripcion, PrecioReferencia, Zona, Disponible, Modalidad)
       OUTPUT INSERTED.ServicioId
       VALUES (@profesionalId, @categoriaId, @nombre, @descripcion, @precio, @zona, @disponible, @modalidad)`,
      {
        profesionalId,
        categoriaId: datos.categoriaId,
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        precio: datos.precioReferencia || null,
        zona: datos.zona || null,
        disponible: datos.disponible,
        modalidad: datos.modalidad,
      },
    )

    const servicio = await obtenerServicio(filas[0]!.ServicioId)
    res.status(201).json({ mensaje: 'El servicio se publicó correctamente.', servicio })
  }),
)

router.put(
  '/:id',
  autenticar,
  soloRol('profesional'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const profesionalId = req.usuario!.profesionalId
    if (!profesionalId) throw new ApiError(403, 'Tu cuenta no tiene un perfil profesional asociado.')

    const actuales = await consultar<{ ProfesionalId: number; Activo: boolean }>(
      'SELECT ProfesionalId, Activo FROM dbo.Servicios WHERE ServicioId = @id',
      { id },
    )
    const actual = actuales[0]
    if (!actual) throw new ApiError(404, 'No encontramos el servicio solicitado.')
    if (actual.ProfesionalId !== profesionalId) {
      throw new ApiError(403, 'Solo podés modificar tus propios servicios.')
    }
    if (!actual.Activo) throw new ApiError(409, 'El servicio fue eliminado y no se puede modificar.')

    const datos = validar(esquemaServicio, req.body)
    await verificarCategoria(datos.categoriaId)

    await ejecutar(
      `UPDATE dbo.Servicios
       SET CategoriaId = @categoriaId, Nombre = @nombre, Descripcion = @descripcion,
           PrecioReferencia = @precio, Zona = @zona, Disponible = @disponible,
           Modalidad = @modalidad, FechaActualizacion = SYSUTCDATETIME()
       WHERE ServicioId = @id AND ProfesionalId = @profesionalId`,
      {
        id,
        profesionalId,
        categoriaId: datos.categoriaId,
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        precio: datos.precioReferencia || null,
        zona: datos.zona || null,
        disponible: datos.disponible,
        modalidad: datos.modalidad,
      },
    )

    res.json({ mensaje: 'Los cambios se guardaron correctamente.', servicio: await obtenerServicio(id) })
  }),
)

router.delete(
  '/:id',
  autenticar,
  soloRol('profesional'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id)
    const profesionalId = req.usuario!.profesionalId
    if (!profesionalId) throw new ApiError(403, 'Tu cuenta no tiene un perfil profesional asociado.')

    const actuales = await consultar<{ ProfesionalId: number; Activo: boolean }>(
      'SELECT ProfesionalId, Activo FROM dbo.Servicios WHERE ServicioId = @id',
      { id },
    )
    const actual = actuales[0]
    if (!actual) throw new ApiError(404, 'No encontramos el servicio solicitado.')
    if (actual.ProfesionalId !== profesionalId) {
      throw new ApiError(403, 'Solo podés eliminar tus propios servicios.')
    }

    await ejecutar(
      `UPDATE dbo.Servicios SET Activo = 0, FechaActualizacion = SYSUTCDATETIME()
       WHERE ServicioId = @id AND ProfesionalId = @profesionalId`,
      { id, profesionalId },
    )

    res.json({ mensaje: 'El servicio se eliminó correctamente.' })
  }),
)

export default router
