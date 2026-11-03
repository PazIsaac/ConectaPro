export type Rol = 'cliente' | 'profesional'

export type Usuario = {
  id: number
  nombre: string
  correo: string
  rol: Rol
  telefono: string | null
  profesionalId: number | null
  especialidad?: string | null
  zona?: string | null
}

export type Categoria = {
  id: number
  nombre: string
  descripcion: string
  icono: string
  cantidadServicios?: number
}

export type Servicio = {
  id: number
  profesionalId: number
  profesionalNombre: string
  profesionalIniciales: string
  categoriaId: number
  categoria: string
  categoriaIcono: string
  nombre: string
  descripcion: string
  precioReferencia: string | null
  zona: string | null
  disponible: boolean
  modalidad: string
  profesionalZona: string
  profesionalEspecialidad: string
  promedioPuntuacion: number | null
  cantidadResenas: number
  fechaCreacion: string
}

export type Profesional = {
  id: number
  usuarioId: number
  nombre: string
  correo: string
  telefono: string | null
  especialidad: string
  descripcion: string
  zona: string
  aniosExperiencia: number
  tarifaReferencia: string | null
  disponible: boolean
  verificado: boolean
  iniciales: string
  promedioPuntuacion: number | null
  cantidadResenas: number
  categorias: string[]
  servicios: Servicio[]
}

export type Solicitud = {
  id: number
  clienteId: number
  clienteNombre: string
  profesionalId: number
  profesionalNombre: string
  servicioId: number | null
  servicioNombre: string | null
  mensaje: string
  estado: 'pendiente' | 'aceptada' | 'rechazada' | 'finalizada'
  fechaCreacion: string
}

export type Resena = {
  id: number
  profesionalId: number
  clienteId: number
  clienteNombre: string
  puntuacion: number
  comentario: string
  fechaCreacion: string
}

export type Pago = {
  id: number
  solicitudId: number
  clienteId: number
  profesionalNombre: string
  servicioNombre: string | null
  monto: number
  moneda: string
  estado: 'aprobado' | 'rechazado' | 'pendiente'
  marca: string
  ultimos4: string
  titular: string
  vencimientoMes: number
  vencimientoAnio: number
  referencia: string
  fechaCreacion: string
}

export type AlternativaCategoria = {
  categoriaId: number | null
  categoria: string
  confianza: number
}

export type SugerenciaCategoria = {
  categoriaId: number | null
  categoria: string | null
  confianza: number
  explicacion: string
  palabrasClave: string[]
  alternativas: AlternativaCategoria[]
  proveedor: 'modelo' | 'local'
  modelo: string | null
  profesionalesDisponibles?: number
}

export type DescripcionMejorada = {
  descripcion: string
  consejos: string[]
  proveedor: 'modelo' | 'local'
  modelo: string | null
}

export type Estadisticas = {
  profesionales: number
  servicios: number
  categorias: number
  resenas: number
  promedio: number | null
}
