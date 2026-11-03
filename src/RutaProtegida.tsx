import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './contexto'
import type { Rol } from './types'

type Props = {
  roles?: Rol[]
}

export default function RutaProtegida({ roles }: Props) {
  const { usuario, cargando } = useAuth()
  const ubicacion = useLocation()

  if (cargando) {
    return (
      <main className="estado-pagina">
        <span className="cargando-giro" aria-hidden="true" />
        <p>Verificando tu sesión...</p>
      </main>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  }

  if (roles && !roles.includes(usuario.rol)) {
    return (
      <main className="estado-pagina">
        <span className="estado-icono" aria-hidden="true">
          🔒
        </span>
        <h1>Esta sección es para {roles.includes('profesional') ? 'profesionales' : 'clientes'}</h1>
        <p>
          Estás con una cuenta de {usuario.rol}. Podés volver al inicio y seguir explorando
          ConectaPro.
        </p>
        <Link className="button button-primary" to="/">
          Volver al inicio
        </Link>
      </main>
    )
  }

  return <Outlet />
}
