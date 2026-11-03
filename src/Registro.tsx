import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ErrorApi } from './api'
import { useAuth } from './contexto'
import './Registro.css'

type TipoUsuario = 'cliente' | 'profesional'

export default function Registro() {
  const { registrar, usuario } = useAuth()
  const navegar = useNavigate()
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>('cliente')
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [zona, setZona] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (usuario) {
      navegar(usuario.rol === 'profesional' ? '/panel' : '/', { replace: true })
    }
  }, [usuario, navegar])

  async function manejarRegistro(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (contrasena.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (contrasena !== confirmacion) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (tipoUsuario === 'profesional' && especialidad.trim().length < 3) {
      setError('Indicá tu especialidad para crear el perfil profesional.')
      return
    }

    setCargando(true)
    try {
      const nuevoUsuario = await registrar({
        nombre: nombre.trim(),
        correo: correo.trim(),
        contrasena,
        rol: tipoUsuario,
        telefono: telefono.trim() || undefined,
        especialidad: tipoUsuario === 'profesional' ? especialidad.trim() : undefined,
        zona: tipoUsuario === 'profesional' ? zona.trim() : undefined,
        descripcion: tipoUsuario === 'profesional' ? descripcion.trim() : undefined,
      })
      navegar(nuevoUsuario.rol === 'profesional' ? '/panel' : '/', { replace: true })
    } catch (err) {
      if (err instanceof ErrorApi) {
        setError(
          err.detalles?.length
            ? `${err.message} ${err.detalles.map((detalle) => detalle.mensaje).join(' ')}`
            : err.message,
        )
      } else {
        setError('No pudimos crear la cuenta. Intentá nuevamente.')
      }
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="registro-page">
      <section className="registro-panel">
        <Link className="registro-brand" to="/" aria-label="Volver al inicio">
          <span className="registro-brand-icon">C</span>
          <span>
            Conecta<span>Pro</span>
          </span>
        </Link>

        <div className="registro-heading">
          <span className="registro-kicker">SUMATE A CONECTAPRO</span>
          <h1>Creá tu cuenta</h1>
          <p>Registrate para encontrar servicios o compartir tu experiencia profesional.</p>
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

          <div className="registro-grid">
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
                minLength={2}
                maxLength={120}
              />
            </label>

            <label className="registro-label" htmlFor="telefono">
              Teléfono (opcional)
              <input
                id="telefono"
                type="tel"
                autoComplete="tel"
                placeholder="11 5555-0000"
                value={telefono}
                onChange={(event) => setTelefono(event.target.value)}
                maxLength={40}
              />
            </label>
          </div>

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

          <div className="registro-grid">
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
          </div>

          {tipoUsuario === 'profesional' && (
            <div className="registro-profesional">
              <h2>Tu perfil profesional</h2>
              <p>Estos datos se muestran en el catálogo y podés completarlos más adelante.</p>

              <div className="registro-grid">
                <label className="registro-label" htmlFor="especialidad">
                  Especialidad
                  <input
                    id="especialidad"
                    type="text"
                    placeholder="Ej.: Electricista matriculado"
                    value={especialidad}
                    onChange={(event) => setEspecialidad(event.target.value)}
                    maxLength={120}
                    required={tipoUsuario === 'profesional'}
                  />
                </label>

                <label className="registro-label" htmlFor="zona">
                  Zona de cobertura
                  <input
                    id="zona"
                    type="text"
                    placeholder="Ej.: CABA y GBA"
                    value={zona}
                    onChange={(event) => setZona(event.target.value)}
                    maxLength={120}
                  />
                </label>
              </div>

              <label className="registro-label" htmlFor="descripcion">
                Presentación
                <textarea
                  id="descripcion"
                  rows={4}
                  placeholder="Contá qué hacés, cómo trabajás y qué te diferencia."
                  value={descripcion}
                  onChange={(event) => setDescripcion(event.target.value)}
                  maxLength={1000}
                />
              </label>
            </div>
          )}

          {error && (
            <p className="registro-mensaje registro-mensaje-error" role="alert">
              {error}
            </p>
          )}

          <button className="registro-submit" type="submit" disabled={cargando}>
            {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

          <p className="registro-login">
            ¿Ya tenés una cuenta? <Link to="/login">Iniciá sesión</Link>
          </p>
        </form>
      </section>

      <aside className="registro-aside">
        <div className="registro-aside-content">
          <span className="registro-aside-simbolo">C</span>
          <h2>Las buenas conexiones empiezan acá.</h2>
          <p>
            Un espacio para acercar a quienes necesitan una solución con quienes tienen las
            habilidades para brindarla.
          </p>
          <div className="registro-aside-etiqueta">
            <span>✓</span> Una comunidad de clientes y profesionales
          </div>
        </div>
      </aside>
    </main>
  )
}
