import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type ContextoAuth } from './contexto'
import { api } from './api'
import type { Usuario } from './types'

const CLAVE_TOKEN = 'conectapro.token'
const CLAVE_USUARIO = 'conectapro.usuario'

function leerUsuarioGuardado(): Usuario | null {
  try {
    const crudo = localStorage.getItem(CLAVE_USUARIO)
    return crudo ? (JSON.parse(crudo) as Usuario) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => leerUsuarioGuardado())
  const [cargando, setCargando] = useState(true)

  const guardarSesion = useCallback((token: string, nuevoUsuario: Usuario) => {
    localStorage.setItem(CLAVE_TOKEN, token)
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(nuevoUsuario))
    setUsuario(nuevoUsuario)
  }, [])

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem(CLAVE_TOKEN)
    localStorage.removeItem(CLAVE_USUARIO)
    setUsuario(null)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem(CLAVE_TOKEN)
    if (!token) {
      setCargando(false)
      return
    }

    let activo = true
    api.auth
      .yo()
      .then(({ usuario: actual }) => {
        if (!activo) return
        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(actual))
        setUsuario(actual)
      })
      .catch(() => {
        if (!activo) return
        localStorage.removeItem(CLAVE_TOKEN)
        localStorage.removeItem(CLAVE_USUARIO)
        setUsuario(null)
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [])

  const iniciarSesion = useCallback(
    async (correo: string, contrasena: string) => {
      const respuesta = await api.auth.login(correo, contrasena)
      guardarSesion(respuesta.token, respuesta.usuario)
      return respuesta.usuario
    },
    [guardarSesion],
  )

  const registrar = useCallback(
    async (datos: Parameters<typeof api.auth.registro>[0]) => {
      const respuesta = await api.auth.registro(datos)
      guardarSesion(respuesta.token, respuesta.usuario)
      return respuesta.usuario
    },
    [guardarSesion],
  )

  const valor = useMemo<ContextoAuth>(
    () => ({
      usuario,
      cargando,
      autenticado: Boolean(usuario),
      iniciarSesion,
      registrar,
      cerrarSesion,
    }),
    [usuario, cargando, iniciarSesion, registrar, cerrarSesion],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
