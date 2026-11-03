import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { ZodError, type ZodType } from 'zod'

export class ApiError extends Error {
  constructor(
    public readonly estado: number,
    mensaje: string,
    public readonly detalles?: unknown,
  ) {
    super(mensaje)
    this.name = 'ApiError'
  }
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export function validar<T>(schema: ZodType<T>, datos: unknown): T {
  try {
    return schema.parse(datos)
  } catch (error) {
    if (error instanceof ZodError) {
      const detalles = error.issues.map((issue) => ({
        campo: issue.path.join('.'),
        mensaje: issue.message,
      }))
      throw new ApiError(400, 'Revisá los datos enviados.', detalles)
    }
    throw error
  }
}

export function noEncontrado(req: Request, _res: Response, next: NextFunction): void {
  next(new ApiError(404, `No existe la ruta ${req.method} ${req.originalUrl}.`))
}

export function manejadorErrores(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ApiError) {
    res.status(error.estado).json({
      error: error.message,
      detalles: error.detalles,
    })
    return
  }

  const err = error as { number?: number; message?: string }
  if (err?.number === 2627 || err?.number === 2601) {
    res.status(409).json({ error: 'Ya existe un registro con esos datos.' })
    return
  }

  console.error('[api] Error no controlado:', error)
  res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' })
}
