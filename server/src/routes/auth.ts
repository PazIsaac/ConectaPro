import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { getPool, sql } from '../db'
import { config } from '../config'
import { crearToken, autenticar } from '../middleware/auth'
import { ApiError, asyncHandler, validar } from '../middleware/errores'
import type { Rol, UsuarioPublico } from '../types'

const router = Router()

const esquemaRegistro = z.object({
  nombre: z.string().trim().min(2, 'Ingresá tu nombre completo.').max(120),
  correo: z.string().trim().toLowerCase().email('Ingresá un correo válido.').max(150),
  contrasena: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(72),
  rol: z.enum(['cliente', 'profesional']),
  telefono: z.string().trim().max(40).optional().default(''),
  especialidad: z.string().trim().max(120).optional().default(''),
  zona: z.string().trim().max(120).optional().default(''),
  descripcion: z.string().trim().max(1000).optional().default(''),
})

const esquemaLogin = z.object({
  correo: z.string().trim().toLowerCase().email('Ingresá un correo válido.'),
  contrasena: z.string().min(1, 'Ingresá tu contraseña.'),
})

type UsuarioFila = {
  UsuarioId: number
  Nombre: string
  Correo: string
  ContrasenaHash: string
  Rol: Rol
  Telefono: string | null
  Activo: boolean
  ProfesionalId: number | null
  Especialidad: string | null
  Zona: string | null
}

function usuarioPublico(fila: UsuarioFila): UsuarioPublico {
  return {
    id: fila.UsuarioId,
    nombre: fila.Nombre,
    correo: fila.Correo,
    rol: fila.Rol,
    telefono: fila.Telefono,
    profesionalId: fila.ProfesionalId,
    especialidad: fila.Especialidad,
    zona: fila.Zona,
  }
}

async function buscarUsuarioPorCorreo(correo: string): Promise<UsuarioFila | null> {
  const pool = await getPool()
  const resultado = await pool
    .request()
    .input('correo', sql.NVarChar(150), correo)
    .query<UsuarioFila>(
      `SELECT u.UsuarioId, u.Nombre, u.Correo, u.ContrasenaHash, u.Rol, u.Telefono, u.Activo,
              p.ProfesionalId, p.Especialidad, p.Zona
       FROM dbo.Usuarios u
       LEFT JOIN dbo.Profesionales p ON p.UsuarioId = u.UsuarioId
       WHERE u.Correo = @correo`,
    )
  return resultado.recordset[0] ?? null
}

router.post(
  '/registro',
  asyncHandler(async (req, res) => {
    const datos = validar(esquemaRegistro, req.body)

    if (datos.rol === 'profesional' && datos.especialidad.length < 3) {
      throw new ApiError(400, 'Indicá tu especialidad para crear el perfil profesional.', [
        { campo: 'especialidad', mensaje: 'La especialidad es obligatoria.' },
      ])
    }

    if (await buscarUsuarioPorCorreo(datos.correo)) {
      throw new ApiError(409, 'Ya existe una cuenta registrada con ese correo.')
    }

    const hash = await bcrypt.hash(datos.contrasena, 12)
    const pool = await getPool()
    const transaccion = new sql.Transaction(pool)

    await transaccion.begin()
    try {
      const solicitudUsuario = new sql.Request(transaccion)
      const resultadoUsuario = await solicitudUsuario
        .input('nombre', sql.NVarChar(120), datos.nombre)
        .input('correo', sql.NVarChar(150), datos.correo)
        .input('hash', sql.NVarChar(255), hash)
        .input('rol', sql.NVarChar(20), datos.rol)
        .input('telefono', sql.NVarChar(40), datos.telefono || null)
        .query<{ UsuarioId: number }>(
          `INSERT INTO dbo.Usuarios (Nombre, Correo, ContrasenaHash, Rol, Telefono)
           OUTPUT INSERTED.UsuarioId
           VALUES (@nombre, @correo, @hash, @rol, @telefono)`,
        )

      const usuarioId = resultadoUsuario.recordset[0]?.UsuarioId
      if (!usuarioId) throw new Error('No se pudo crear el usuario.')

      let profesionalId: number | null = null
      if (datos.rol === 'profesional') {
        const solicitudProfesional = new sql.Request(transaccion)
        const resultadoProfesional = await solicitudProfesional
          .input('usuarioId', sql.Int, usuarioId)
          .input('especialidad', sql.NVarChar(120), datos.especialidad)
          .input('descripcion', sql.NVarChar(1000), datos.descripcion)
          .input('zona', sql.NVarChar(120), datos.zona)
          .query<{ ProfesionalId: number }>(
            `INSERT INTO dbo.Profesionales (UsuarioId, Especialidad, Descripcion, Zona)
             OUTPUT INSERTED.ProfesionalId
             VALUES (@usuarioId, @especialidad, @descripcion, @zona)`,
          )
        profesionalId = resultadoProfesional.recordset[0]?.ProfesionalId ?? null
      }

      await transaccion.commit()

      const usuario: UsuarioPublico = {
        id: usuarioId,
        nombre: datos.nombre,
        correo: datos.correo,
        rol: datos.rol,
        telefono: datos.telefono || null,
        profesionalId,
        especialidad: datos.rol === 'profesional' ? datos.especialidad : null,
        zona: datos.rol === 'profesional' ? datos.zona : null,
      }

      res.status(201).json({
        mensaje: 'La cuenta se creó correctamente.',
        token: crearToken(usuario),
        usuario,
      })
    } catch (error) {
      await transaccion.rollback()
      throw error
    }
  }),
)

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const datos = validar(esquemaLogin, req.body)
    const usuario = await buscarUsuarioPorCorreo(datos.correo)

    if (!usuario || !usuario.Activo) {
      throw new ApiError(401, 'Correo o contraseña incorrectos.')
    }

    const coincide = await bcrypt.compare(datos.contrasena, usuario.ContrasenaHash)
    if (!coincide) {
      throw new ApiError(401, 'Correo o contraseña incorrectos.')
    }

    const publico = usuarioPublico(usuario)
    res.json({
      mensaje: 'Sesión iniciada correctamente.',
      token: crearToken({
        id: publico.id,
        rol: publico.rol,
        nombre: publico.nombre,
        correo: publico.correo,
        profesionalId: publico.profesionalId,
      }),
      usuario: publico,
    })
  }),
)

router.get(
  '/me',
  autenticar,
  asyncHandler(async (req, res) => {
    const usuario = await buscarUsuarioPorCorreo(req.usuario!.correo)
    if (!usuario) throw new ApiError(404, 'La cuenta no existe.')
    res.json({ usuario: usuarioPublico(usuario) })
  }),
)

router.get('/demo', (_req, res) => {
  res.json({
    cuentas: [
      { rol: 'cliente', correo: 'cliente@conectapro.com', contrasena: config.demoPassword },
      { rol: 'profesional', correo: 'martin@conectapro.com', contrasena: config.demoPassword },
    ],
    nota: 'Cuentas de demostración. No usar en producción.',
  })
})

export default router
