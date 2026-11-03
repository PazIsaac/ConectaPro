import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { consultar } from '../db'
import { ApiError } from './errores'
import type { Rol } from '../types'

type TokenPayload = {
  sub: string
  rol: Rol
  nombre: string
  correo: string
  profesionalId: number | null
}

type UsuarioSesion = {
  UsuarioId: number
  Nombre: string
  Correo: string
  Rol: Rol
  ProfesionalId: number | null
  Activo: boolean
}

export function crearToken(usuario: {
  id: number
  rol: Rol
  nombre: string
  correo: string
  profesionalId: number | null
}): string {
  const payload: TokenPayload = {
    sub: String(usuario.id),
    rol: usuario.rol,
    nombre: usuario.nombre,
    correo: usuario.correo,
    profesionalId: usuario.profesionalId,
  }

  return jwt.sign(payload, config.jwt.secreto, {
    expiresIn: config.jwt.expiracion as jwt.SignOptions['expiresIn'],
  })
}

export async function autenticar(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const encabezado = req.headers.authorization
    if (!encabezado?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Necesitás iniciar sesión para continuar.')
    }

    const token = encabezado.slice('Bearer '.length).trim()
    let payload: TokenPayload
    try {
      payload = jwt.verify(token, config.jwt.secreto) as TokenPayload
    } catch {
      throw new ApiError(401, 'La sesión venció o el token no es válido.')
    }

    const usuarios = await consultar<UsuarioSesion>(
      `SELECT u.UsuarioId, u.Nombre, u.Correo, u.Rol, p.ProfesionalId, u.Activo
       FROM dbo.Usuarios u
       LEFT JOIN dbo.Profesionales p ON p.UsuarioId = u.UsuarioId
       WHERE u.UsuarioId = @id`,
      { id: Number(payload.sub) },
    )

    const usuario = usuarios[0]
    if (!usuario || !usuario.Activo) {
      throw new ApiError(401, 'La cuenta no existe o está deshabilitada.')
    }

    req.usuario = {
      id: usuario.UsuarioId,
      rol: usuario.Rol,
      nombre: usuario.Nombre,
      correo: usuario.Correo,
      profesionalId: usuario.ProfesionalId,
    }
    next()
  } catch (error) {
    next(error)
  }
}

export function soloRol(...roles: Rol[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      next(new ApiError(401, 'Necesitás iniciar sesión para continuar.'))
      return
    }
    if (!roles.includes(req.usuario.rol)) {
      next(new ApiError(403, 'Tu rol no tiene permiso para realizar esta operación.'))
      return
    }
    next()
  }
}
