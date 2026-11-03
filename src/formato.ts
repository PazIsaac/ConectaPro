export function formatearFecha(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return ''
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(fecha)
}

export function formatearPuntaje(promedio: number | null): string {
  if (promedio === null || Number.isNaN(promedio)) return 'Sin reseñas'
  return promedio.toFixed(1).replace('.', ',')
}

export function formatearMoneda(monto: number, moneda = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(monto)
}

export function estrellas(promedio: number | null): string {
  if (promedio === null) return '☆☆☆☆☆'
  const redondeado = Math.round(promedio)
  return `${'★'.repeat(redondeado)}${'☆'.repeat(5 - redondeado)}`
}

export function porcentaje(confianza: number): string {
  return `${Math.round(confianza * 100)}%`
}

export const etiquetasEstado: Record<string, string> = {
  pendiente: 'Pendiente',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  finalizada: 'Finalizada',
}
