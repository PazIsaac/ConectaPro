import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api, ErrorApi } from './api'
import { useAuth } from './contexto'
import './login.css'

type EstadoNavegacion = { desde?: string }

type CuentaDemo = { rol: string; correo: string; contrasena: string }

export default function Login() {
  const { iniciarSesion, usuario } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const desde = (ubicacion.state as EstadoNavegacion | null)?.desde

  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [cuentasDemo, setCuentasDemo] = useState<CuentaDemo[]>([])

  useEffect(() => {
    if (!usuario) return
    const destino = desde || (usuario.rol === 'profesional' ? '/panel' : '/')
    navegar(destino, { replace: true })
  }, [usuario, desde, navegar])

  useEffect(() => {
    api.auth
      .demo()
      .then((respuesta) => setCuentasDemo(respuesta.cuentas))
      .catch(() => setCuentasDemo([]))
  }, [])

  async function manejarIngreso(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!correo.trim() || !contrasena) {
      setError('Completá tu correo y contraseña para ingresar.')
      return
    }

    setCargando(true)
    try {
      await iniciarSesion(correo.trim(), contrasena)
    } catch (err) {
      if (err instanceof ErrorApi) {
        setError(
          err.detalles?.length
            ? `${err.message} ${err.detalles.map((detalle) => detalle.mensaje).join(' ')}`
            : err.message,
        )
      } else {
        setError('No pudimos iniciar sesión. Intentá nuevamente.')
      }
    } finally {
      setCargando(false)
    }
  }

  function usarCuenta(cuenta: CuentaDemo) {
    setCorreo(cuenta.correo)
    setContrasena(cuenta.contrasena)
    setError('')
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <Link className="login-brand" to="/" aria-label="Volver al inicio">
          <span className="login-brand-icon">C</span>
          <span>
            Conecta<span>Pro</span>
          </span>
        </Link>

        <div className="login-heading">
          <span className="login-kicker">BIENVENIDO DE NUEVO</span>
          <h1>Iniciá sesión</h1>
          <p>
            Accedé a tu cuenta para contactar profesionales, seguir tus solicitudes o gestionar los
            servicios que publicás.
          </p>
        </div>

        <form className="login-form" onSubmit={manejarIngreso} noValidate>
          <label className="login-label" htmlFor="login-correo">
            Correo electrónico
            <input
              id="login-correo"
              type="email"
              autoComplete="email"
              placeholder="nombre@correo.com"
              value={correo}
              onChange={(event) => {
                setCorreo(event.target.value)
                setError('')
              }}
              required
            />
          </label>

          <label className="login-label" htmlFor="login-contrasena">
            Contraseña
            <span className="login-password-wrap">
              <input
                id="login-contrasena"
                type={mostrarContrasena ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Tu contraseña"
                value={contrasena}
                onChange={(event) => {
                  setContrasena(event.target.value)
                  setError('')
                }}
                required
              />
              <button
                className="login-password-toggle"
                type="button"
                onClick={() => setMostrarContrasena((valor) => !valor)}
                aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarContrasena ? 'Ocultar' : 'Ver'}
              </button>
            </span>
          </label>

          {error && (
            <p className="login-mensaje login-error" role="alert">
              {error}
            </p>
          )}

          <button className="login-submit" type="submit" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>

          <p className="login-register">
            ¿Todavía no tenés una cuenta? <Link to="/registro">Registrate</Link>
          </p>

          <Link className="login-back" to="/">
            ← Volver al inicio
          </Link>
        </form>

        {cuentasDemo.length > 0 && (
          <aside className="login-demo" aria-label="Cuentas de demostración">
            <p className="login-demo-titulo">
              <span aria-hidden="true">✦</span> Cuentas de demostración
            </p>
            <div className="login-demo-cuentas">
              {cuentasDemo.map((cuenta) => (
                <button
                  key={cuenta.correo}
                  type="button"
                  className="login-demo-cuenta"
                  onClick={() => usarCuenta(cuenta)}
                >
                  <strong>{cuenta.rol === 'profesional' ? 'Profesional' : 'Cliente'}</strong>
                  <span>{cuenta.correo}</span>
                </button>
              ))}
            </div>
            <p className="login-demo-nota">
              Elegí una cuenta para completar el formulario. Son usuarios de prueba del proyecto
              académico.
            </p>
          </aside>
        )}
      </section>

      <aside className="login-aside">
        <div className="login-aside-content">
          <span className="login-aside-symbol">C</span>
          <h2>Tu próximo servicio empieza con una conexión.</h2>
          <p>
            Ingresá para retomar tus conversaciones, revisar el estado de tus solicitudes y
            mantener tu perfil profesional siempre actualizado.
          </p>
          <div className="login-aside-tag">
            <span>✓</span> Clientes y profesionales en un mismo lugar
          </div>
        </div>
      </aside>
    </main>
  )
}
