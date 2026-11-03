import { consultar } from '../db'
import type { Resena } from '../types'

type FilaResena = {
  ResenaId: number
  ProfesionalId: number
  ClienteId: number
  ClienteNombre: string
  Puntuacion: number
  Comentario: string
  FechaCreacion: Date | string
}

export async function listarResenas(profesionalId: number): Promise<Resena[]> {
  const filas = await consultar<FilaResena>(
    `SELECT r.ResenaId, r.ProfesionalId, r.ClienteId, u.Nombre AS ClienteNombre,
            r.Puntuacion, r.Comentario, r.FechaCreacion
     FROM dbo.Resenas r
     INNER JOIN dbo.Usuarios u ON u.UsuarioId = r.ClienteId
     WHERE r.ProfesionalId = @profesionalId
     ORDER BY r.FechaCreacion DESC`,
    { profesionalId },
  )

  return filas.map((fila) => ({
    id: fila.ResenaId,
    profesionalId: fila.ProfesionalId,
    clienteId: fila.ClienteId,
    clienteNombre: fila.ClienteNombre,
    puntuacion: fila.Puntuacion,
    comentario: fila.Comentario,
    fechaCreacion:
      fila.FechaCreacion instanceof Date ? fila.FechaCreacion.toISOString() : String(fila.FechaCreacion),
  }))
}
