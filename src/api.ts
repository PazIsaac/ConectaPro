import type {
  Categoria,
  DescripcionMejorada,
  Estadisticas,
  Pago,
  Profesional,
  Resena,
  Servicio,
  Solicitud,
  SugerenciaCategoria,
  Usuario,
} from './types'

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api'

export class ErrorApi extends Error {
  readonly estado: number
  readonly detalles?: Array<{ campo: string; mensaje: string }>

  constructor(
    mensaje: string,
    estado: number,
    detalles?: Array<{ campo: string; mensaje: string }>,
  ) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.estado = estado
    this.detalles = detalles
  }
}

function token(): string | null {
  return localStorage.getItem('conectapro.token')
}

async function solicitar<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const encabezados = new Headers(opciones.headers)
  if (opciones.body) encabezados.set('Content-Type', 'application/json')
  const guardado = token()
  if (guardado) encabezados.set('Authorization', `Bearer ${guardado}`)

  let respuesta: Response
  try {
    respuesta = await fetch(`${BASE}${ruta}`, { ...opciones, headers: encabezados })
  } catch {
    throw new ErrorApi(
      'No pudimos comunicarnos con el servidor. Verificá que la API esté en ejecución.',
      0,
    )
  }

  const datos = (await respuesta.json().catch(() => null)) as
    | { error?: string; detalles?: Array<{ campo: string; mensaje: string }> }
    | null

  if (!respuesta.ok) {
    throw new ErrorApi(
      datos?.error || `La operación falló (${respuesta.status}).`,
      respuesta.status,
      datos?.detalles,
    )
  }

  return datos as T
}

function consulta(parametros: Record<string, string | number | boolean | undefined>): string {
  const busqueda = new URLSearchParams()
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== '') busqueda.set(clave, String(valor))
  }
  const texto = busqueda.toString()
  return texto ? `?${texto}` : ''
}

export type DatosRegistro = {
  nombre: string
  correo: string
  contrasena: string
  rol: 'cliente' | 'profesional'
  telefono?: string
  especialidad?: string
  zona?: string
  descripcion?: string
}

export type DatosServicio = {
  nombre: string
  descripcion: string
  categoriaId: number
  precioReferencia?: string
  zona?: string
  disponible?: boolean
  modalidad: string
}

export type DatosPago = {
  solicitudId: number
  monto: number
  tokenPago: string
  marca: string
  ultimos4: string
  titular: string
  vencimientoMes: number
  vencimientoAnio: number
}

export const api = {
  auth: {
    login: (correo: string, contrasena: string) =>
      solicitar<{ token: string; usuario: Usuario; mensaje: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ correo, contrasena }),
      }),
    registro: (datos: DatosRegistro) =>
      solicitar<{ token: string; usuario: Usuario; mensaje: string }>('/auth/registro', {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    yo: () => solicitar<{ usuario: Usuario }>('/auth/me'),
    demo: () =>
      solicitar<{
        cuentas: Array<{ rol: string; correo: string; contrasena: string }>
        nota: string
      }>('/auth/demo'),
  },
  categorias: {
    listar: () => solicitar<{ categorias: Categoria[] }>('/categorias'),
    estadisticas: () => solicitar<{ estadisticas: Estadisticas }>('/categorias/estadisticas'),
  },
  profesionales: {
    listar: (filtros: {
      busqueda?: string
      categoriaId?: number
      zona?: string
      disponible?: boolean
    } = {}) => solicitar<{ profesionales: Profesional[] }>(`/profesionales${consulta(filtros)}`),
    obtener: (id: number) =>
      solicitar<{ profesional: Profesional; resenas: Resena[] }>(`/profesionales/${id}`),
  },
  servicios: {
    listar: (filtros: {
      busqueda?: string
      categoriaId?: number
      zona?: string
      disponible?: boolean
    } = {}) => solicitar<{ servicios: Servicio[] }>(`/servicios${consulta(filtros)}`),
    mios: () => solicitar<{ servicios: Servicio[] }>('/servicios/mios'),
    crear: (datos: DatosServicio) =>
      solicitar<{ mensaje: string; servicio: Servicio }>('/servicios', {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    actualizar: (id: number, datos: DatosServicio) =>
      solicitar<{ mensaje: string; servicio: Servicio }>(`/servicios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(datos),
      }),
    eliminar: (id: number) =>
      solicitar<{ mensaje: string }>(`/servicios/${id}`, { method: 'DELETE' }),
  },
  solicitudes: {
    mias: () => solicitar<{ solicitudes: Solicitud[] }>('/solicitudes/mias'),
    crear: (datos: { profesionalId: number; servicioId?: number | null; mensaje: string }) =>
      solicitar<{ mensaje: string; solicitudId: number }>('/solicitudes', {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    cambiarEstado: (id: number, estado: 'aceptada' | 'rechazada' | 'finalizada') =>
      solicitar<{ mensaje: string }>(`/solicitudes/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
      }),
  },
  resenas: {
    crear: (datos: { profesionalId: number; puntuacion: number; comentario: string }) =>
      solicitar<{ mensaje: string }>('/resenas', {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
    eliminar: (id: number) =>
      solicitar<{ mensaje: string }>(`/resenas/${id}`, { method: 'DELETE' }),
  },
  pagos: {
    mias: () => solicitar<{ pagos: Pago[] }>('/pagos/mias'),
    crear: (datos: DatosPago) =>
      solicitar<{ mensaje: string; pago: Pago }>('/pagos', {
        method: 'POST',
        body: JSON.stringify(datos),
      }),
  },
  ia: {
    estado: () =>
      solicitar<{ modo: 'modelo' | 'local'; descripcion: string }>('/ia/estado'),
    sugerirCategoria: (descripcion: string) =>
      solicitar<{ sugerencia: SugerenciaCategoria }>('/ia/sugerir-categoria', {
        method: 'POST',
        body: JSON.stringify({ descripcion }),
      }),
    mejorarDescripcion: (texto: string, categoria?: string) =>
      solicitar<{ resultado: DescripcionMejorada }>('/ia/mejorar-descripcion', {
        method: 'POST',
        body: JSON.stringify({ texto, categoria }),
      }),
  },
}
