import { createContext, useContext } from 'react'
import type { Usuario } from './types'

export type ContextoAuth = {
  usuario: Usuario | null
  cargando: boolean
  autenticado: boolean
  iniciarSesion: (correo: string, contrasena: string) => Promise<Usuario>
  registrar: (datos: {
    nombre: string
    correo: string
    contrasena: string
    rol: 'cliente' | 'profesional'
    telefono?: string
    especialidad?: string
    zona?: string
    descripcion?: string
  }) => Promise<Usuario>
  cerrarSesion: () => void
}

export const AuthContext = createContext<ContextoAuth | null>(null)

export function useAuth(): ContextoAuth {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth debe usarse dentro de AuthProvider.')
  return contexto
}
