
import { useState } from 'react'
import './Registro.css'

type TipoUsuario = 'cliente' | 'profesional'

function Registro() {
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>('cliente')
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [mensaje, setMensaje] = useState('')

  function manejarRegistro(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMensaje('')

    if (contrasena.length < 8) {
      setMensaje('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (contrasena !== confirmacion) {
      setMensaje('Las contraseñas no coinciden.')
      return
    }

    setMensaje(
      'Formulario validado. El registro real estará disponible cuando conectemos el servidor.',
    )
  }

  return (
    <main className="registro-page">
      <section className="registro-panel">
        <a className="registro-brand" href="/" aria-label="Volver al inicio">
          <span className="registro-brand-icon">C</span>
          <span>Conecta<span>Pro</span></span>
        </a>

        <div className="registro-heading">
          <span className="registro-kicker">SUMATE A CONECTAPRO</span>
          <h1>Creá tu cuenta</h1>
          <p>
            Registrate para encontrar servicios o compartir tu experiencia
            profesional.
          </p>
        </div>

        <form className="registro-form" onSubmit={manejarRegistro}>
          <fieldset className="tipo-usuario">
            <legend>¿Cómo querés usar ConectaPro?</legend>

            <div className="tipo-opciones">
              <button
                type="button"
                className={tipoUsuario === 'cliente' ? 'tipo-opcion seleccionada' : 'tipo-opcion'}
                onClick={() => setTipoUsuario('cliente')}
                aria-pressed={tipoUsuario === 'cliente'}
              >
                <span className="tipo-icono">⌕</span>
                <span>
                  <strong>Cliente</strong>
                  <small>Busco un servicio</small>
                </span>
              </button>

              <button
                type="button"
                className={tipoUsuario === 'profesional' ? 'tipo-opcion seleccionada' : 'tipo-opcion'}
                onClick={() => setTipoUsuario('profesional')}
                aria-pressed={tipoUsuario === 'profesional'}
              >
                <span className="tipo-icono">✦</span>
                <span>
                  <strong>Profesional</strong>
                  <small>Ofrezco servicios</small>
                </span>
              </button>
            </div>
          </fieldset>

          <label className="registro-label" htmlFor="nombre">
            Nombre y apellido
            <input
              id="nombre"
              type="text"
              autoComplete="name"
              placeholder="Tu nombre completo"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              required
            />
          </label>

          <label className="registro-label" htmlFor="correo">
            Correo electrónico
            <input
              id="correo"
              type="email"
              autoComplete="email"
              placeholder="nombre@correo.com"
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              required
            />
          </label>

          <label className="registro-label" htmlFor="contrasena">
            Contraseña
            <input
              id="contrasena"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              value={contrasena}
              onChange={(event) => setContrasena(event.target.value)}
              minLength={8}
              required
            />
          </label>

          <label className="registro-label" htmlFor="confirmacion">
            Confirmar contraseña
            <input
              id="confirmacion"
              type="password"
              autoComplete="new-password"
              placeholder="Volvé a escribir tu contraseña"
              value={confirmacion}
              onChange={(event) => setConfirmacion(event.target.value)}
              required
            />
          </label>

          {mensaje && (
            <p className="registro-mensaje" role="status">
              {mensaje}
            </p>
          )}

          <button className="registro-submit" type="submit">
            Crear cuenta
          </button>

          <p className="registro-login">
            ¿Ya tenés una cuenta? <a href="/login">Iniciá sesión</a>
          </p>
        </form>
      </section>

      <aside className="registro-aside">
        <div className="registro-aside-content">
          <span className="registro-aside-simbolo">C</span>
          <h2>Las buenas conexiones empiezan acá.</h2>
          <p>
            Un espacio para acercar a quienes necesitan una solución con
            quienes tienen las habilidades para brindarla.
          </p>
          <div className="registro-aside-etiqueta">
            <span>✓</span> Una comunidad de clientes y profesionales
          </div>
        </div>
      </aside>
    </main>
  )
}

export default Registro
