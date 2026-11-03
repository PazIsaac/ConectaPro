import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { consultar } from '../db'
import { autenticar, soloRol } from '../middleware/auth'
import { ApiError, asyncHandler, validar } from '../middleware/errores'
import type { Pago } from '../types'

const router = Router()

const marcas = [
  'visa',
  'mastercard',
  'amex',
  'discover',
  'dinersclub',
  'jcb',
  'unionpay',
  'maestro',
  'elo',
  'hipercard',
  'otra',
] as const

const esquemaPago = z.object({
  solicitudId: z.coerce.number().int().positive('La solicitud no es válida.'),
  monto: z.coerce
    .number()
    .min(1, 'El importe debe ser mayor a cero.')
    .max(10_000_000, 'El importe supera el máximo permitido.'),
  tokenPago: z
    .string()
    .trim()
    .regex(
      /^demo_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      'El token de pago no es válido.',
    ),
  marca: z.enum(marcas),
  ultimos4: z.string().trim().regex(/^\d{4}$/, 'Los últimos cuatro dígitos no son válidos.'),
  titular: z.string().trim().min(3, 'Ingresá el nombre del titular.').max(120),
  vencimientoMes: z.coerce.number().int().min(1).max(12),
  vencimientoAnio: z.coerce.number().int().min(2020).max(2100),
})

type FilaPago = {
  PagoId: number
  SolicitudId: number
  ClienteId: number
  ProfesionalNombre: string
  ServicioNombre: string | null
  Monto: number | string
  Moneda: string
  Estado: Pago['estado']
  Marca: string
  Ultimos4: string
  Titular: string
  VencimientoMes: number
  VencimientoAnio: number
  Referencia: string
  FechaCreacion: Date | string
}

const SELECT_PAGOS = `
  SELECT p.PagoId, p.SolicitudId, p.ClienteId,
         up.Nombre AS ProfesionalNombre,
         sv.Nombre AS ServicioNombre,
         p.Monto, p.Moneda, p.Estado, p.Marca, p.Ultimos4, p.Titular,
         p.VencimientoMes, p.VencimientoAnio, p.Referencia, p.FechaCreacion
  FROM dbo.Pagos p
  INNER JOIN dbo.Solicitudes s ON s.SolicitudId = p.SolicitudId
  INNER JOIN dbo.Profesionales pr ON pr.ProfesionalId = s.ProfesionalId
  INNER JOIN dbo.Usuarios up ON up.UsuarioId = pr.UsuarioId
  LEFT JOIN dbo.Servicios sv ON sv.ServicioId = s.ServicioId
`

function mapearPago(fila: FilaPago): Pago {
  return {
    id: fila.PagoId,
    solicitudId: fila.SolicitudId,
    clienteId: fila.ClienteId,
    profesionalNombre: fila.ProfesionalNombre,
    servicioNombre: fila.ServicioNombre,
    monto: Number(fila.Monto),
    moneda: fila.Moneda,
    estado: fila.Estado,
    marca: fila.Marca,
    ultimos4: fila.Ultimos4,
    titular: fila.Titular,
    vencimientoMes: fila.VencimientoMes,
    vencimientoAnio: fila.VencimientoAnio,
    referencia: fila.Referencia,
    fechaCreacion:
      fila.FechaCreacion instanceof Date
        ? fila.FechaCreacion.toISOString()
        : String(fila.FechaCreacion),
  }
}

router.get(
  '/mias',
  autenticar,
  soloRol('cliente'),
  asyncHandler(async (req, res) => {
    const filas = await consultar<FilaPago>(
      `${SELECT_PAGOS} WHERE p.ClienteId = @clienteId ORDER BY p.FechaCreacion DESC`,
      { clienteId: req.usuario!.id },
    )
    res.json({ pagos: filas.map(mapearPago) })
  }),
)

router.post(
  '/',
  autenticar,
  soloRol('cliente'),
  asyncHandler(async (req, res) => {
    const datos = validar(esquemaPago, req.body)

    const filasSolicitud = await consultar<{
      SolicitudId: number
      ClienteId: number
      Estado: string
    }>(
      `SELECT SolicitudId, ClienteId, Estado
       FROM dbo.Solicitudes
       WHERE SolicitudId = @id`,
      { id: datos.solicitudId },
    )
    const solicitud = filasSolicitud[0]
    if (!solicitud) throw new ApiError(404, 'No encontramos la solicitud.')
    if (solicitud.ClienteId !== req.usuario!.id) {
      throw new ApiError(403, 'Solo podés pagar tus propias solicitudes.')
    }
    if (solicitud.Estado !== 'aceptada' && solicitud.Estado !== 'finalizada') {
      throw new ApiError(409, 'Solo podés pagar una solicitud aceptada o finalizada.')
    }

    const existentes = await consultar<{ PagoId: number }>(
      'SELECT PagoId FROM dbo.Pagos WHERE SolicitudId = @solicitudId',
      { solicitudId: datos.solicitudId },
    )
    if (existentes.length > 0) {
      throw new ApiError(409, 'Esta solicitud ya tiene un pago registrado.')
    }

    const ahora = new Date()
    if (
      datos.vencimientoAnio < ahora.getUTCFullYear() ||
      (datos.vencimientoAnio === ahora.getUTCFullYear() &&
        datos.vencimientoMes < ahora.getUTCMonth() + 1)
    ) {
      throw new ApiError(400, 'La tarjeta está vencida.')
    }

    const referencia = `PAY-${randomUUID()}`.toUpperCase()

    try {
      await consultar(
        `INSERT INTO dbo.Pagos
           (SolicitudId, ClienteId, Monto, Moneda, Estado, Marca, Ultimos4,
            Titular, VencimientoMes, VencimientoAnio, Referencia)
         VALUES
           (@solicitudId, @clienteId, @monto, 'ARS', 'aprobado', @marca, @ultimos4,
            @titular, @vencimientoMes, @vencimientoAnio, @referencia)`,
        {
          solicitudId: datos.solicitudId,
          clienteId: req.usuario!.id,
          monto: datos.monto,
          marca: datos.marca,
          ultimos4: datos.ultimos4,
          titular: datos.titular,
          vencimientoMes: datos.vencimientoMes,
          vencimientoAnio: datos.vencimientoAnio,
          referencia,
        },
      )
    } catch (error) {
      const numero = (error as { number?: number }).number
      if (numero === 2627 || numero === 2601) {
        throw new ApiError(409, 'Esta solicitud ya tiene un pago registrado.')
      }
      throw error
    }

    const filas = await consultar<FilaPago>(
      `${SELECT_PAGOS} WHERE p.Referencia = @referencia`,
      { referencia },
    )

    res.status(201).json({
      mensaje: 'El pago se registró correctamente.',
      pago: mapearPago(filas[0]!),
    })
  }),
)

export default router
