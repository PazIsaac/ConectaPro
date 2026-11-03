import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from './contexto'

export default function Layout() {
  const { usuario, cerrarSesion } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [ubicacion.pathname])

  function salir() {
    cerrarSesion()
    navegar('/')
  }

  return (
    <>
      <header className="navbar">
        <Link className="brand" to="/" aria-label="ConectaPro inicio">
          <span className="brand-icon">C</span>
          <span>
            Conecta<span className="brand-accent">Pro</span>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Navegación principal">
          <NavLink to="/profesionales">Explorar servicios</NavLink>
          <Link to="/#como-funciona">Cómo funciona</Link>
          {usuario?.rol === 'cliente' && <NavLink to="/solicitudes">Mis solicitudes</NavLink>}
          {usuario?.rol === 'profesional' && <NavLink to="/panel">Mi panel</NavLink>}
        </nav>

        <div className="nav-actions">
          {usuario ? (
            <>
              <span className="nav-usuario" title={usuario.correo}>
                <span className="nav-usuario-avatar">{usuario.nombre.charAt(0).toUpperCase()}</span>
                <span className="nav-usuario-datos">
                  <strong>{usuario.nombre.split(' ')[0]}</strong>
                  <small>{usuario.rol === 'profesional' ? 'Profesional' : 'Cliente'}</small>
                </span>
              </span>
              <button className="button button-outline" type="button" onClick={salir}>
                Salir
              </button>
            </>
          ) : (
            <>
              <Link className="button button-outline" to="/login">
                Iniciar sesión
              </Link>
              <Link className="button button-primary" to="/registro">
                Registrarme
              </Link>
            </>
          )}
        </div>
      </header>

      <div className="contenido-principal">
        <Outlet />
      </div>

      <footer className="footer">
        <Link className="brand footer-brand" to="/">
          <span className="brand-icon">C</span>
          <span>
            Conecta<span className="brand-accent">Pro</span>
          </span>
        </Link>
        <p>Conectando necesidades con soluciones.</p>
        <span>Proyecto académico · React + Node.js + SQL Server · 2026</span>
      </footer>
    </>
  )
}
