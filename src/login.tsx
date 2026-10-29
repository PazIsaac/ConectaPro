
import { useState } from 'react'
import './Login.css'

function Login() {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mensaje, setMensaje] = useState('')

  function manejarInicioSesion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMensaje(
      'Formulario validado. El inicio de sesión estará disponible cuando conectemos el servidor.',
    )
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <a className="login-brand" href="/" aria-label="ConectaPro inicio">
          <span className="login-brand-icon">C</span>
          <span>Conecta<span>Pro</span></span>
        </a>

        <div className="login-heading">
          <span className="login-kicker">QUÉ BUENO TENERTE DE VUELTA</span>
          <h1>Iniciá sesión</h1>
          <p>Ingresá a tu cuenta para continuar con ConectaPro.</p>
        </div>

        <form className="login-form" onSubmit={manejarInicioSesion}>
          <label className="login-label" htmlFor="login-correo">
            Correo electrónico
            <input
              id="login-correo"
              type="email"
              autoComplete="email"
              placeholder="nombre@correo.com"
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              required
            />
          </label>

          <label className="login-label" htmlFor="login-contrasena">
            Contraseña
            <input
              id="login-contrasena"
              type="password"
              autoComplete="current-password"
              placeholder="Ingresá tu contraseña"
              value={contrasena}
              onChange={(event) => setContrasena(event.target.value)}
              required
            />
          </label>

          {mensaje && (
            <p className="login-mensaje" role="status">
              {mensaje}
            </p>
          )}

          <button className="login-submit" type="submit">
            Iniciar sesión
          </button>

          <p className="login-register">
            ¿Todavía no tenés cuenta? <a href="/registro">Registrate</a>
          </p>

          <button
            className="login-back"
            type="button"
            onClick={() => window.location.assign('/')}
          >
            Volver al inicio
          </button>
        </form>
      </section>

      <aside className="login-aside">
        <div className="login-aside-content">
          <span className="login-aside-symbol">C</span>
          <h2>Tu próxima conexión empieza con un paso.</h2>
          <p>
            Encontrá servicios, conocé profesionales y acercate a la solución
            que estás buscando.
          </p>
          <div className="login-aside-tag">
            <span>✓</span> Clientes y profesionales en un mismo lugar
          </div>
        </div>
      </aside>
    </main>
  )
}

export default Login
