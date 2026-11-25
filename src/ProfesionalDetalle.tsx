import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { api, ErrorApi } from './api'
import { useAuth } from './contexto'
import { estrellas, formatearFecha, formatearPuntaje } from './formato'
import type { Profesional, Resena } from './types'
import './Profesionales.css'

function mensajeError(err: unknown, porDefecto: string): string {
  if (err instanceof ErrorApi) {
    return err.detalles?.length
      ? `${err.message} ${err.detalles.map((detalle) => detalle.mensaje).join(' ')}`
      : err.message
  }
  return porDefecto
}

export default function ProfesionalDetalle() {
  const { id } = useParams()
  const { usuario } = useAuth()
  const ubicacion = useLocation()

  const [profesional, setProfesional] = useState<Profesional | null>(null)
  const [resenas, setResenas] = useState<Resena[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [mostrarSolicitud, setMostrarSolicitud] = useState(false)
  const [servicioId, setServicioId] = useState('')
  const [mensajeSolicitud, setMensajeSolicitud] = useState('')
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false)
  const [errorSolicitud, setErrorSolicitud] = useState('')
  const [confirmacionSolicitud, setConfirmacionSolicitud] = useState('')

  const [puntuacion, setPuntuacion] = useState('5')
  const [comentario, setComentario] = useState('')
  const [enviandoResena, setEnviandoResena] = useState(false)
  const [errorResena, setErrorResena] = useState('')
  const [mensajeResena, setMensajeResena] = useState('')

  useEffect(() => {
    const numero = Number(id)
    if (!Number.isInteger(numero) || numero <= 0) {
      setError('El perfil solicitado no es válido.')
      setCargando(false)
      return
    }

    let activo = true
    setCargando(true)
    setError('')

    api.profesionales
      .obtener(numero)
      .then((respuesta) => {
        if (!activo) return
        setProfesional(respuesta.profesional)
        setResenas(respuesta.resenas)
      })
      .catch((err: Error) => {
        if (activo) setError(err.message)
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [id])

  if (cargando) {
    return (
      <main className="estado-pagina">
        <span className="cargando-giro" aria-hidden="true" />
        <p>Cargando perfil profesional...</p>
      </main>
    )
  }

  if (error || !profesional) {
    return (
      <main className="estado-pagina">
        <span className="estado-icono" aria-hidden="true">
          ⌕
        </span>
        <h1>No encontramos este perfil</h1>
        <p>{error || 'El profesional puede haber dejado de estar disponible.'}</p>
        <Link className="button button-primary" to="/profesionales">
          Volver al catálogo
        </Link>
      </main>
    )
  }

  const yaReseno = Boolean(usuario && resenas.some((resena) => resena.clienteId === usuario.id))

  async function enviarSolicitud(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorSolicitud('')
    setConfirmacionSolicitud('')
    if (mensajeSolicitud.trim().length < 10) {
      setErrorSolicitud('Contá brevemente qué necesitás (mínimo 10 caracteres).')
      return
    }

    setEnviandoSolicitud(true)
    try {
      const respuesta = await api.solicitudes.crear({
        profesionalId: profesional!.id,
        servicioId: servicioId ? Number(servicioId) : null,
        mensaje: mensajeSolicitud.trim(),
      })
      setConfirmacionSolicitud(respuesta.mensaje)
      setMensajeSolicitud('')
      setServicioId('')
      setMostrarSolicitud(false)
    } catch (err) {
      setErrorSolicitud(mensajeError(err, 'No pudimos enviar la solicitud.'))
    } finally {
      setEnviandoSolicitud(false)
    }
  }

  async function enviarResena(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorResena('')
    setMensajeResena('')

    if (comentario.trim().length < 10) {
      setErrorResena('Escribí un comentario de al menos 10 caracteres.')
      return
    }

    setEnviandoResena(true)
    try {
      const respuesta = await api.resenas.crear({
        profesionalId: profesional!.id,
        puntuacion: Number(puntuacion),
        comentario: comentario.trim(),
      })
      setMensajeResena(respuesta.mensaje)
      setComentario('')
      setPuntuacion('5')
      const actualizado = await api.profesionales.obtener(profesional!.id)
      setResenas(actualizado.resenas)
      setProfesional(actualizado.profesional)
    } catch (err) {
      setErrorResena(mensajeError(err, 'No pudimos publicar la reseña.'))
    } finally {
      setEnviandoResena(false)
    }
  }

  return (
    <main className="profesionales-page">
      <div className="perfil-volver-fila">
        <Link className="profesionales-volver" to="/profesionales">
          ← Volver al catálogo
        </Link>
      </div>

      <section className="perfil-profesional">
        <div className="perfil-avatar">{profesional.iniciales}</div>
        <div className="perfil-badges">
          <span className="profesionales-etiqueta">
            {profesional.categorias[0] ?? profesional.especialidad}
          </span>
          {profesional.verificado && <span className="perfil-verificado">✓ Perfil verificado</span>}
          <span className={profesional.disponible ? 'perfil-disponible' : 'perfil-no-disponible'}>
            {profesional.disponible ? 'Disponible' : 'No disponible'}
          </span>
        </div>
        <h1>{profesional.nombre}</h1>
        <h2>{profesional.especialidad}</h2>
        <p>{profesional.descripcion}</p>

        <div className="perfil-datos">
          <div>
            <strong>{formatearPuntaje(profesional.promedioPuntuacion)}</strong>
            <span className="perfil-estrellas">{estrellas(profesional.promedioPuntuacion)}</span>
            <small>{profesional.cantidadResenas} reseñas</small>
          </div>
          <div>
            <strong>{profesional.aniosExperiencia} años</strong>
            <span>de experiencia</span>
          </div>
          <div>
            <strong>📍 {profesional.zona}</strong>
            <span>zona de cobertura</span>
          </div>
          {profesional.tarifaReferencia && (
            <div>
              <strong>{profesional.tarifaReferencia}</strong>
              <span>orientativo</span>
            </div>
          )}
        </div>

        <div className="perfil-contacto">
          <h3>Datos de contacto</h3>
          {usuario ? (
            <p>
              {profesional.correo}
              {profesional.telefono ? ` · ${profesional.telefono}` : ''}
            </p>
          ) : (
            <p>
              <Link to="/login" state={{ desde: ubicacion.pathname }}>
                Iniciá sesión
              </Link>{' '}
              para ver los datos de contacto y enviar una solicitud.
            </p>
          )}
        </div>

        {usuario?.rol === 'cliente' && (
          <>
            {!mostrarSolicitud && !confirmacionSolicitud && (
              <button
                className="profesionales-boton"
                type="button"
                onClick={() => {
                  setMostrarSolicitud(true)
                  setErrorSolicitud('')
                }}
              >
                Solicitar un servicio
              </button>
            )}

            {confirmacionSolicitud && (
              <p className="solicitud-mensaje" role="status">
                {confirmacionSolicitud}{' '}
                <Link to="/solicitudes">Ver mis solicitudes →</Link>
              </p>
            )}

            {mostrarSolicitud && (
              <form className="solicitud-formulario" onSubmit={enviarSolicitud} noValidate>
                <h2>Contale qué necesitás</h2>

                <label htmlFor="servicio-solicitud">Servicio (opcional)</label>
                <select
                  id="servicio-solicitud"
                  value={servicioId}
                  onChange={(event) => setServicioId(event.target.value)}
                >
                  <option value="">Consulta general</option>
                  {profesional.servicios.map((servicio) => (
                    <option key={servicio.id} value={servicio.id}>
                      {servicio.nombre}
                    </option>
                  ))}
                </select>

                <label htmlFor="mensaje-solicitud">Mensaje</label>
                <textarea
                  id="mensaje-solicitud"
                  value={mensajeSolicitud}
                  onChange={(event) => {
                    setMensajeSolicitud(event.target.value)
                    setErrorSolicitud('')
                  }}
                  rows={4}
                  minLength={10}
                  maxLength={1000}
                  required
                  aria-describedby="mensaje-solicitud-ayuda"
                  placeholder="Ej.: necesito revisar una pérdida debajo de la pileta. ¿Tenés disponibilidad esta semana?"
                />
                <small className="solicitud-ayuda" id="mensaje-solicitud-ayuda">
                  Escribí al menos 10 caracteres.
                </small>

                {errorSolicitud && (
                  <p className="form-error" role="alert">
                    {errorSolicitud}
                  </p>
                )}

                <div className="solicitud-acciones">
                  <button className="profesionales-boton" type="submit" disabled={enviandoSolicitud}>
                    {enviandoSolicitud ? 'Enviando...' : 'Enviar solicitud'}
                  </button>
                  <button
                    className="profesionales-volver"
                    type="button"
                    onClick={() => setMostrarSolicitud(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {usuario?.rol === 'profesional' && (
          <p className="perfil-nota">
            Estás viendo este perfil como profesional. Las solicitudes solo pueden enviarse desde
            una cuenta de cliente.
          </p>
        )}

        {!usuario && (
          <p className="perfil-nota">
            <Link to="/login" state={{ desde: ubicacion.pathname }}>
              Iniciá sesión como cliente
            </Link>{' '}
            para solicitar este servicio.
          </p>
        )}

        <section className="perfil-servicios" aria-labelledby="titulo-servicios-perfil">
          <h2 id="titulo-servicios-perfil">Servicios publicados</h2>
          <div className="perfil-servicios-lista">
            {profesional.servicios.map((servicio) => (
              <article className="perfil-servicio" key={servicio.id}>
                <span className="perfil-servicio-icono">{servicio.categoriaIcono}</span>
                <div>
                  <span className="perfil-servicio-categoria">{servicio.categoria}</span>
                  <h3>{servicio.nombre}</h3>
                  <p>{servicio.descripcion}</p>
                  <div className="perfil-servicio-meta">
                    <span>{servicio.modalidad}</span>
                    {servicio.zona && <span>📍 {servicio.zona}</span>}
                    {servicio.precioReferencia && <span>{servicio.precioReferencia}</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="resenas-seccion" aria-labelledby="titulo-resenas">
          <h2 id="titulo-resenas">Opiniones de usuarios</h2>

          {resenas.length > 0 ? (
            resenas.map((resena) => (
              <article className="resena-card" key={resena.id}>
                <div className="resena-encabezado">
                  <h3>{resena.clienteNombre}</h3>
                  <span>{formatearFecha(resena.fechaCreacion)}</span>
                </div>
                <p className="resena-estrellas" aria-label={`${resena.puntuacion} de 5 estrellas`}>
                  {estrellas(resena.puntuacion)}
                </p>
                <p>{resena.comentario}</p>
              </article>
            ))
          ) : (
            <p className="resenas-vacias">Todavía no hay reseñas para este profesional.</p>
          )}

          {usuario?.rol === 'cliente' && !yaReseno && (
            <form className="resena-formulario" onSubmit={enviarResena}>
              <h3>Dejá tu opinión</h3>
              <p className="resena-nota">
                Tu reseña quedará asociada a tu cuenta y podrá verse en este perfil.
              </p>

              <label htmlFor="puntuacion-resena">Calificación</label>
              <select
                id="puntuacion-resena"
                value={puntuacion}
                onChange={(event) => setPuntuacion(event.target.value)}
              >
                <option value="5">★★★★★ - Excelente</option>
                <option value="4">★★★★☆ - Muy bueno</option>
                <option value="3">★★★☆☆ - Bueno</option>
                <option value="2">★★☆☆☆ - Regular</option>
                <option value="1">★☆☆☆☆ - Malo</option>
              </select>

              <label htmlFor="comentario-resena">Comentario</label>
              <textarea
                id="comentario-resena"
                value={comentario}
                onChange={(event) => setComentario(event.target.value)}
                maxLength={1000}
                rows={4}
                required
                placeholder="Contá cómo fue tu experiencia"
              />

              {errorResena && (
                <p className="form-error" role="alert">
                  {errorResena}
                </p>
              )}
              {mensajeResena && (
                <p className="resena-mensaje" role="status">
                  {mensajeResena}
                </p>
              )}

              <button className="profesionales-boton" type="submit" disabled={enviandoResena}>
                {enviandoResena ? 'Publicando...' : 'Publicar reseña'}
              </button>
            </form>
          )}

          {usuario?.rol === 'cliente' && yaReseno && (
            <p className="resena-nota">Ya publicaste una reseña para este profesional.</p>
          )}

          {!usuario && (
            <p className="resena-nota">
              <Link to="/login" state={{ desde: ubicacion.pathname }}>
                Iniciá sesión
              </Link>{' '}
              para dejar una reseña.
            </p>
          )}
        </section>
      </section>
    </main>
  )
}
