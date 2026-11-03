import { consultar } from '../db'
import type { Profesional, Servicio } from '../types'

type FilaProfesional = {
  ProfesionalId: number
  UsuarioId: number
  Nombre: string
  Correo: string
  Telefono: string | null
  Especialidad: string
  Descripcion: string
  Zona: string
  AniosExperiencia: number
  TarifaReferencia: string | null
  Disponible: boolean
  Verificado: boolean
  Promedio: number | null
  CantidadResenas: number
}

type FilaServicio = {
  ServicioId: number
  ProfesionalId: number
  ProfesionalNombre: string
  CategoriaId: number
  Categoria: string
  CategoriaIcono: string
  Nombre: string
  Descripcion: string
  PrecioReferencia: string | null
  Zona: string | null
  Disponible: boolean
  Modalidad: string
  ProfesionalZona: string
  ProfesionalEspecialidad: string
  Promedio: number | null
  CantidadResenas: number
  FechaCreacion: Date | string
}

type FiltrosProfesional = {
  busqueda?: string
  categoriaId?: number
  zona?: string
  profesionalId?: number
  soloDisponibles?: boolean
}

type FiltrosServicio = FiltrosProfesional

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('')
}

function mapearServicio(fila: FilaServicio): Servicio {
  return {
    id: fila.ServicioId,
    profesionalId: fila.ProfesionalId,
    profesionalNombre: fila.ProfesionalNombre,
    profesionalIniciales: iniciales(fila.ProfesionalNombre),
    categoriaId: fila.CategoriaId,
    categoria: fila.Categoria,
    categoriaIcono: fila.CategoriaIcono,
    nombre: fila.Nombre,
    descripcion: fila.Descripcion,
    precioReferencia: fila.PrecioReferencia,
    zona: fila.Zona,
    disponible: fila.Disponible,
    modalidad: fila.Modalidad,
    profesionalZona: fila.ProfesionalZona,
    profesionalEspecialidad: fila.ProfesionalEspecialidad,
    promedioPuntuacion: fila.Promedio !== null ? Number(fila.Promedio) : null,
    cantidadResenas: fila.CantidadResenas,
    fechaCreacion:
      fila.FechaCreacion instanceof Date ? fila.FechaCreacion.toISOString() : String(fila.FechaCreacion),
  }
}

export async function listarServicios(filtros: FiltrosServicio = {}): Promise<Servicio[]> {
  const filas = await consultar<FilaServicio>(
    `SELECT s.ServicioId, s.ProfesionalId, u.Nombre AS ProfesionalNombre,
            s.CategoriaId, c.Nombre AS Categoria, c.Icono AS CategoriaIcono,
            s.Nombre, s.Descripcion, s.PrecioReferencia, s.Zona, s.Disponible, s.Modalidad,
            p.Zona AS ProfesionalZona, p.Especialidad AS ProfesionalEspecialidad,
            (SELECT AVG(CAST(r.Puntuacion AS DECIMAL(3,2)))
               FROM dbo.Resenas r WHERE r.ProfesionalId = p.ProfesionalId) AS Promedio,
            (SELECT COUNT(*) FROM dbo.Resenas r WHERE r.ProfesionalId = p.ProfesionalId) AS CantidadResenas,
            s.FechaCreacion
     FROM dbo.Servicios s
     INNER JOIN dbo.Profesionales p ON p.ProfesionalId = s.ProfesionalId
     INNER JOIN dbo.Usuarios u ON u.UsuarioId = p.UsuarioId
     INNER JOIN dbo.Categorias c ON c.CategoriaId = s.CategoriaId
     WHERE s.Activo = 1
       AND u.Activo = 1
       AND (@soloDisponibles = 0 OR s.Disponible = 1)
       AND (@profesionalId IS NULL OR s.ProfesionalId = @profesionalId)
       AND (@categoriaId IS NULL OR s.CategoriaId = @categoriaId)
       AND (@zona IS NULL OR s.Zona LIKE '%' + @zona + '%' OR p.Zona LIKE '%' + @zona + '%')
       AND (@busqueda IS NULL OR
            s.Nombre LIKE '%' + @busqueda + '%' OR
            s.Descripcion LIKE '%' + @busqueda + '%' OR
            c.Nombre LIKE '%' + @busqueda + '%' OR
            p.Especialidad LIKE '%' + @busqueda + '%' OR
            u.Nombre LIKE '%' + @busqueda + '%')
     ORDER BY p.Verificado DESC, Promedio DESC, s.FechaCreacion DESC`,
    {
      profesionalId: filtros.profesionalId ?? null,
      categoriaId: filtros.categoriaId ?? null,
      zona: filtros.zona?.trim() || null,
      busqueda: filtros.busqueda?.trim() || null,
      soloDisponibles: filtros.soloDisponibles === false ? 0 : 1,
    },
  )

  return filas.map(mapearServicio)
}

export async function listarProfesionales(
  filtros: FiltrosProfesional = {},
): Promise<Profesional[]> {
  const filas = await consultar<FilaProfesional>(
    `SELECT p.ProfesionalId, p.UsuarioId, u.Nombre, u.Correo, u.Telefono,
            p.Especialidad, p.Descripcion, p.Zona, p.AniosExperiencia,
            p.TarifaReferencia, p.Disponible, p.Verificado,
            (SELECT AVG(CAST(r.Puntuacion AS DECIMAL(3,2)))
               FROM dbo.Resenas r WHERE r.ProfesionalId = p.ProfesionalId) AS Promedio,
            (SELECT COUNT(*) FROM dbo.Resenas r WHERE r.ProfesionalId = p.ProfesionalId) AS CantidadResenas
     FROM dbo.Profesionales p
     INNER JOIN dbo.Usuarios u ON u.UsuarioId = p.UsuarioId
     WHERE u.Activo = 1
       AND (@profesionalId IS NULL OR p.ProfesionalId = @profesionalId)
       AND (@soloDisponibles = 0 OR p.Disponible = 1)
       AND (@zona IS NULL OR p.Zona LIKE '%' + @zona + '%')
       AND (@busqueda IS NULL OR
            u.Nombre LIKE '%' + @busqueda + '%' OR
            p.Especialidad LIKE '%' + @busqueda + '%' OR
            p.Descripcion LIKE '%' + @busqueda + '%' OR
            p.Zona LIKE '%' + @busqueda + '%' OR
            EXISTS (SELECT 1 FROM dbo.Servicios s2
                    WHERE s2.ProfesionalId = p.ProfesionalId AND s2.Activo = 1 AND
                          (s2.Nombre LIKE '%' + @busqueda + '%' OR s2.Descripcion LIKE '%' + @busqueda + '%')))
       AND (@categoriaId IS NULL OR EXISTS (
            SELECT 1 FROM dbo.Servicios s3
            WHERE s3.ProfesionalId = p.ProfesionalId AND s3.Activo = 1 AND s3.Disponible = 1
              AND s3.CategoriaId = @categoriaId))
     ORDER BY p.Verificado DESC, Promedio DESC, p.ProfesionalId`,
    {
      profesionalId: filtros.profesionalId ?? null,
      categoriaId: filtros.categoriaId ?? null,
      zona: filtros.zona?.trim() || null,
      busqueda: filtros.busqueda?.trim() || null,
      soloDisponibles: filtros.soloDisponibles ? 1 : 0,
    },
  )

  if (filas.length === 0) return []

  // Se traen todos los servicios activos para que el perfil muestre la oferta
  // completa del profesional aunque la búsqueda haya filtrado por un término.
  const servicios = await listarServicios()
  const serviciosPorProfesional = new Map<number, Servicio[]>()
  for (const servicio of servicios) {
    const actuales = serviciosPorProfesional.get(servicio.profesionalId) ?? []
    actuales.push(servicio)
    serviciosPorProfesional.set(servicio.profesionalId, actuales)
  }

  return filas.map((fila) => {
    const propios = serviciosPorProfesional.get(fila.ProfesionalId) ?? []
    return {
      id: fila.ProfesionalId,
      usuarioId: fila.UsuarioId,
      nombre: fila.Nombre,
      correo: fila.Correo,
      telefono: fila.Telefono,
      especialidad: fila.Especialidad,
      descripcion: fila.Descripcion,
      zona: fila.Zona,
      aniosExperiencia: fila.AniosExperiencia,
      tarifaReferencia: fila.TarifaReferencia,
      disponible: fila.Disponible,
      verificado: fila.Verificado,
      iniciales: iniciales(fila.Nombre),
      promedioPuntuacion: fila.Promedio !== null ? Number(fila.Promedio) : null,
      cantidadResenas: fila.CantidadResenas,
      categorias: [...new Set(propios.map((servicio) => servicio.categoria))],
      servicios: propios,
    }
  })
}

export async function obtenerProfesional(id: number): Promise<Profesional | null> {
  const profesionales = await listarProfesionales({ profesionalId: id })
  return profesionales[0] ?? null
}

export async function obtenerServicio(id: number): Promise<Servicio | null> {
  const servicios = await listarServicios({ soloDisponibles: false })
  return servicios.find((servicio) => servicio.id === id) ?? null
}
