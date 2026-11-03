import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ErrorApi, type DatosServicio } from './api'
import { useAuth } from './contexto'
import { categoriasBase } from './categoriasBase'
import { etiquetasEstado, formatearFecha } from './formato'
import type { Categoria, Servicio, Solicitud } from './types'
import './Panel.css'

const modalidades = ['A domicilio', 'En taller', 'Remoto', 'Mixta'] as const

type Modalidad = (typeof modalidades)[number]

const estadoSolicitud: Record<Solicitud['estado'], string> = {
  pendiente: 'solicitud-estado-pendiente',
  aceptada: 'solicitud-estado-aceptada',
  rechazada: 'solicitud-estado-rechazada',
  finalizada: 'solicitud-estado-finalizada',
}

export default function PanelProfesional() {
  const { usuario } = useAuth()

  const [categorias, setCategorias] = useState<Categoria[]>(categoriasBase)
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')

  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [nombre, setNombre] = useState('')
  const [categoriaId, setCategoriaId] = useState(0)
  const [descripcion, setDescripcion] = useState('')
  const [precioReferencia, setPrecioReferencia] = useState('')
  const [zona, setZona] = useState(usuario?.zona ?? '')
  const [disponible, setDisponible] = useState(true)
  const [modalidad, setModalidad] = useState<Modalidad>('A domicilio')

  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [errorFormulario, setErrorFormulario] = useState('')
  const [confirmarEliminar, setConfirmarEliminar] = useState<number | null>(null)

  const [mejorando, setMejorando] = useState(false)
  const [mensajeIa, setMensajeIa] = useState('')
  const [errorIa, setErrorIa] = useState('')
  const [consejosIa, setConsejosIa] = useState<string[]>([])

  const [cambiandoSolicitud, setCambiandoSolicitud] = useState<number | null>(null)
  const [mensajeSolicitud, setMensajeSolicitud] = useState('')
  const [errorSolicitud, setErrorSolicitud] = useState('')

  const cargarTodo = useCallback(async () => {
    setCargando(true)
    setErrorCarga('')
    try {
      const [respuestaCategorias, respuestaServicios, respuestaSolicitudes] = await Promise.all([
        api.categorias.listar(),
        api.servicios.mios(),
        api.solicitudes.mias(),
      ])
      setCategorias(respuestaCategorias.categorias)
      setServicios(respuestaServicios.servicios)
      setSolicitudes(respuestaSolicitudes.solicitudes)
      setCategoriaId((actual) => actual || respuestaCategorias.categorias[0]?.id || 0)
    } catch (err) {
      setErrorCarga(err instanceof ErrorApi ? err.message : 'No pudimos cargar tu panel.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargarTodo()
  }, [cargarTodo])

  function limpiarFormulario() {
    setEditandoId(null)
    setNombre('')
    setCategoriaId(categorias[0]?.id ?? 0)
    setDescripcion('')
    setPrecioReferencia('')
    setZona(usuario?.zona ?? '')
    setDisponible(true)
    setModalidad('A domicilio')
    setErrorFormulario('')
    setConsejosIa([])
    setMensajeIa('')
    setErrorIa('')
  }

  function editarServicio(servicio: Servicio) {
    setEditandoId(servicio.id)
    setNombre(servicio.nombre)
    setCategoriaId(servicio.categoriaId)
    setDescripcion(servicio.descripcion)
    setPrecioReferencia(servicio.precioReferencia ?? '')
    setZona(servicio.zona ?? usuario?.zona ?? '')
    setDisponible(servicio.disponible)
    setModalidad(servicio.modalidad as Modalidad)
    setMensaje('')
    setErrorFormulario('')
    setErrorIa('')
    setMensajeIa('')
    setConsejosIa([])
    setConfirmarEliminar(null)
    document.getElementById('panel-formulario')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function guardarServicio(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMensaje('')
    setErrorFormulario('')

    if (nombre.trim().length < 5) {
      setErrorFormulario('El nombre del servicio debe tener al menos 5 caracteres.')
      return
    }
    if (descripcion.trim().length < 20) {
      setErrorFormulario('La descripción debe tener al menos 20 caracteres para que sea útil.')
      return
    }
    if (!categoriaId) {
      setErrorFormulario('Seleccioná una categoría para el servicio.')
      return
    }

    const datos: DatosServicio = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      categoriaId,
      precioReferencia: precioReferencia.trim() || undefined,
      zona: zona.trim() || undefined,
      disponible,
      modalidad,
    }

    setGuardando(true)
    try {
      const respuesta = editandoId
        ? await api.servicios.actualizar(editandoId, datos)
        : await api.servicios.crear(datos)

      setMensaje(respuesta.mensaje)
      limpiarFormulario()
      const actualizados = await api.servicios.mios()
      setServicios(actualizados.servicios)
    } catch (err) {
      if (err instanceof ErrorApi) {
        setErrorFormulario(
          err.detalles?.length
            ? `${err.message} ${err.detalles.map((detalle) => detalle.mensaje).join(' ')}`
            : err.message,
        )
      } else {
        setErrorFormulario('No pudimos guardar el servicio. Intentá nuevamente.')
      }
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarServicio(id: number) {
    setMensaje('')
    setErrorFormulario('')
    try {
      const respuesta = await api.servicios.eliminar(id)
      setMensaje(respuesta.mensaje)
      setConfirmarEliminar(null)
      if (editandoId === id) limpiarFormulario()
      const actualizados = await api.servicios.mios()
      setServicios(actualizados.servicios)
    } catch (err) {
      setErrorFormulario(
        err instanceof ErrorApi ? err.message : 'No pudimos eliminar el servicio.',
      )
    }
  }

  async function mejorarConIa() {
    setMensajeIa('')
    setErrorIa('')
    setConsejosIa([])

    if (descripcion.trim().length < 20) {
      setErrorIa('Escribí una descripción base de al menos 20 caracteres y volvé a intentar.')
      return
    }

    const categoria = categorias.find((item) => item.id === categoriaId)
    setMejorando(true)
    try {
      const respuesta = await api.ia.mejorarDescripcion(descripcion.trim(), categoria?.nombre)
      setDescripcion(respuesta.resultado.descripcion)
      setConsejosIa(respuesta.resultado.consejos)
      setMensajeIa(
        respuesta.resultado.proveedor === 'modelo'
          ? 'La descripción se mejoró con el modelo de lenguaje. Revisala antes de publicar.'
          : 'La descripción se mejoró con el motor local. Revisala antes de publicar.',
      )
    } catch (err) {
      setErrorIa(err instanceof ErrorApi ? err.message : 'No pudimos mejorar la descripción.')
    } finally {
      setMejorando(false)
    }
  }

  async function cambiarEstadoSolicitud(
    id: number,
    estado: 'aceptada' | 'rechazada' | 'finalizada',
  ) {
    setCambiandoSolicitud(id)
    setMensajeSolicitud('')
    setErrorSolicitud('')
    try {
      const respuesta = await api.solicitudes.cambiarEstado(id, estado)
      setMensajeSolicitud(respuesta.mensaje)
      setSolicitudes((actuales) =>
        actuales.map((solicitud) => (solicitud.id === id ? { ...solicitud, estado } : solicitud)),
      )
    } catch (err) {
      setErrorSolicitud(
        err instanceof ErrorApi ? err.message : 'No pudimos actualizar la solicitud.',
      )
    } finally {
      setCambiandoSolicitud(null)
    }
  }

  const pendientes = solicitudes.filter((solicitud) => solicitud.estado === 'pendiente').length
  const aceptadas = solicitudes.filter((solicitud) => solicitud.estado === 'aceptada').length
  const serviciosDisponibles = servicios.filter((servicio) => servicio.disponible).length

  return (
    <main className="panel-page">
      <section className="panel-hero">
        <div className="panel-hero-texto">
          <span className="panel-kicker">PANEL DEL PROFESIONAL</span>
          <h1>Hola, {usuario?.nombre.split(' ')[0] ?? 'profesional'}</h1>
          <p>
            Gestioná tus publicaciones, mejorá sus descripciones con IA y respondé las solicitudes
            que recibís.
          </p>
        </div>
        <div className="panel-perfil">
          <span className="panel-perfil-avatar">
            {usuario?.nombre
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((parte) => parte.charAt(0).toUpperCase())
              .join('') || 'P'}
          </span>
          <div>
            <strong>{usuario?.nombre}</strong>
            <span>{usuario?.especialidad || 'Profesional independiente'}</span>
            {usuario?.zona && <small>📍 {usuario.zona}</small>}
          </div>
        </div>
      </section>

      <section className="panel-metricas" aria-label="Resumen de tu actividad">
        <article>
          <strong>{servicios.length}</strong>
          <span>servicios publicados</span>
        </article>
        <article>
          <strong>{serviciosDisponibles}</strong>
          <span>disponibles</span>
        </article>
        <article>
          <strong>{pendientes}</strong>
          <span>solicitudes pendientes</span>
        </article>
        <article>
          <strong>{aceptadas}</strong>
          <span>solicitudes aceptadas</span>
        </article>
      </section>

      {errorCarga && (
        <div className="panel-aviso panel-aviso-error" role="alert">
          <p>{errorCarga}</p>
          <button className="panel-boton-secundario" type="button" onClick={() => void cargarTodo()}>
            Reintentar
          </button>
        </div>
      )}

      {cargando ? (
        <div className="panel-cargando" aria-busy="true">
          <span className="cargando-giro" aria-hidden="true" />
          <p>Cargando tus servicios y solicitudes...</p>
        </div>
      ) : (
        <>
          <div className="panel-columnas">
            <section className="panel-tarjeta" id="panel-formulario" aria-labelledby="panel-form-titulo">
              <div className="panel-tarjeta-encabezado">
                <div>
                  <span className="panel-kicker">{editandoId ? 'EDITANDO' : 'NUEVA PUBLICACIÓN'}</span>
                  <h2 id="panel-form-titulo">
                    {editandoId ? 'Modificar servicio' : 'Publicar un servicio'}
                  </h2>
                </div>
                {editandoId && (
                  <button className="panel-boton-texto" type="button" onClick={limpiarFormulario}>
                    Cancelar edición
                  </button>
                )}
              </div>

              <form className="panel-form" onSubmit={guardarServicio} noValidate>
                <label htmlFor="panel-nombre">
                  Nombre del servicio
                  <input
                    id="panel-nombre"
                    type="text"
                    value={nombre}
                    onChange={(event) => setNombre(event.target.value)}
                    placeholder="Ej.: Instalación de luminarias LED"
                    minLength={5}
                    maxLength={120}
                    required
                  />
                </label>

                <div className="panel-form-fila">
                  <label htmlFor="panel-categoria">
                    Categoría
                    <select
                      id="panel-categoria"
                      value={categoriaId}
                      onChange={(event) => setCategoriaId(Number(event.target.value))}
                      required
                    >
                      {categorias.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.icono} {categoria.nombre}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label htmlFor="panel-modalidad">
                    Modalidad
                    <select
                      id="panel-modalidad"
                      value={modalidad}
                      onChange={(event) => setModalidad(event.target.value as Modalidad)}
                    >
                      {modalidades.map((opcion) => (
                        <option key={opcion} value={opcion}>
                          {opcion}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label htmlFor="panel-descripcion">
                  Descripción
                  <textarea
                    id="panel-descripcion"
                    value={descripcion}
                    onChange={(event) => setDescripcion(event.target.value)}
                    rows={5}
                    minLength={20}
                    maxLength={1000}
                    placeholder="Contá qué incluye el servicio, cómo trabajás y qué puede esperar el cliente."
                    required
                  />
                </label>

                <div className="panel-ia">
                  <div>
                    <strong>
                      <span aria-hidden="true">✦</span> Asistente de redacción
                    </strong>
                    <p>
                      Mejorá la descripción con IA a partir del texto que ya escribiste. Después
                      podés editarla libremente.
                    </p>
                  </div>
                  <button
                    className="panel-boton-ia"
                    type="button"
                    onClick={() => void mejorarConIa()}
                    disabled={mejorando}
                  >
                    {mejorando ? 'Mejorando...' : 'Mejorar con IA'}
                  </button>
                </div>

                {errorIa && (
                  <p className="panel-mensaje panel-mensaje-error" role="alert">
                    {errorIa}
                  </p>
                )}
                {mensajeIa && (
                  <p className="panel-mensaje panel-mensaje-ok" role="status">
                    {mensajeIa}
                  </p>
                )}
                {consejosIa.length > 0 && (
                  <ul className="panel-consejos">
                    {consejosIa.map((consejo) => (
                      <li key={consejo}>{consejo}</li>
                    ))}
                  </ul>
                )}

                <div className="panel-form-fila">
                  <label htmlFor="panel-precio">
                    Precio orientativo (opcional)
                    <input
                      id="panel-precio"
                      type="text"
                      value={precioReferencia}
                      onChange={(event) => setPrecioReferencia(event.target.value)}
                      placeholder="Ej.: Desde $18.000"
                      maxLength={80}
                    />
                  </label>

                  <label htmlFor="panel-zona">
                    Zona de cobertura
                    <input
                      id="panel-zona"
                      type="text"
                      value={zona}
                      onChange={(event) => setZona(event.target.value)}
                      placeholder="Ej.: CABA y Vicente López"
                      maxLength={120}
                    />
                  </label>
                </div>

                <label className="panel-check" htmlFor="panel-disponible">
                  <input
                    id="panel-disponible"
                    type="checkbox"
                    checked={disponible}
                    onChange={(event) => setDisponible(event.target.checked)}
                  />
                  <span>
                    <strong>Servicio disponible</strong>
                    <small>Si lo desactivás, no se mostrará en el catálogo público.</small>
                  </span>
                </label>

                {errorFormulario && (
                  <p className="panel-mensaje panel-mensaje-error" role="alert">
                    {errorFormulario}
                  </p>
                )}
                {mensaje && (
                  <p className="panel-mensaje panel-mensaje-ok" role="status">
                    {mensaje}
                  </p>
                )}

                <button className="panel-boton-principal" type="submit" disabled={guardando}>
                  {guardando
                    ? 'Guardando...'
                    : editandoId
                      ? 'Guardar cambios'
                      : 'Publicar servicio'}
                </button>
              </form>
            </section>

            <section className="panel-tarjeta" aria-labelledby="panel-servicios-titulo">
              <div className="panel-tarjeta-encabezado">
                <div>
                  <span className="panel-kicker">TU OFERTA</span>
                  <h2 id="panel-servicios-titulo">Servicios publicados</h2>
                </div>
                <span className="panel-contador">
                  {servicios.length} {servicios.length === 1 ? 'servicio' : 'servicios'}
                </span>
              </div>

              {servicios.length === 0 ? (
                <div className="panel-vacio">
                  <span aria-hidden="true">🛠️</span>
                  <h3>Todavía no publicaste servicios</h3>
                  <p>Usá el formulario para crear tu primera publicación.</p>
                </div>
              ) : (
                <div className="panel-servicios">
                  {servicios.map((servicio) => (
                    <article className="panel-servicio" key={servicio.id}>
                      <div className="panel-servicio-encabezado">
                        <span className="panel-servicio-categoria">
                          {servicio.categoriaIcono} {servicio.categoria}
                        </span>
                        <span
                          className={
                            servicio.disponible
                              ? 'panel-servicio-estado panel-servicio-disponible'
                              : 'panel-servicio-estado panel-servicio-pausado'
                          }
                        >
                          {servicio.disponible ? 'Disponible' : 'Pausado'}
                        </span>
                      </div>
                      <h3>{servicio.nombre}</h3>
                      <p>{servicio.descripcion}</p>
                      <div className="panel-servicio-meta">
                        <span>{servicio.modalidad}</span>
                        {servicio.zona && <span>📍 {servicio.zona}</span>}
                        {servicio.precioReferencia && <span>{servicio.precioReferencia}</span>}
                        <span>Publicado el {formatearFecha(servicio.fechaCreacion)}</span>
                      </div>

                      <div className="panel-servicio-acciones">
                        <button
                          className="panel-boton-secundario"
                          type="button"
                          onClick={() => editarServicio(servicio)}
                        >
                          Editar
                        </button>
                        <button
                          className="panel-boton-peligro"
                          type="button"
                          onClick={() => setConfirmarEliminar(servicio.id)}
                        >
                          Eliminar
                        </button>
                      </div>

                      {confirmarEliminar === servicio.id && (
                        <div className="panel-confirmacion" role="alertdialog">
                          <p>¿Querés eliminar “{servicio.nombre}”? Dejará de mostrarse en el catálogo.</p>
                          <div>
                            <button
                              className="panel-boton-peligro"
                              type="button"
                              onClick={() => void eliminarServicio(servicio.id)}
                            >
                              Sí, eliminar
                            </button>
                            <button
                              className="panel-boton-secundario"
                              type="button"
                              onClick={() => setConfirmarEliminar(null)}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="panel-tarjeta panel-solicitudes" aria-labelledby="panel-solicitudes-titulo">
            <div className="panel-tarjeta-encabezado">
              <div>
                <span className="panel-kicker">CONTACTOS RECIBIDOS</span>
                <h2 id="panel-solicitudes-titulo">Solicitudes de clientes</h2>
              </div>
              <span className="panel-contador">
                {pendientes} {pendientes === 1 ? 'pendiente' : 'pendientes'}
              </span>
            </div>

            {errorSolicitud && (
              <p className="panel-mensaje panel-mensaje-error" role="alert">
                {errorSolicitud}
              </p>
            )}
            {mensajeSolicitud && (
              <p className="panel-mensaje panel-mensaje-ok" role="status">
                {mensajeSolicitud}
              </p>
            )}

            {solicitudes.length === 0 ? (
              <div className="panel-vacio">
                <span aria-hidden="true">📬</span>
                <h3>No recibiste solicitudes todavía</h3>
                <p>
                  Cuando un cliente te contacte, la solicitud va a aparecer acá. También podés
                  revisar cómo se ve tu perfil en el{' '}
                  <Link to="/profesionales">catálogo público</Link>.
                </p>
              </div>
            ) : (
              <div className="panel-solicitudes-lista">
                {solicitudes.map((solicitud) => (
                  <article className="panel-solicitud" key={solicitud.id}>
                    <div className="panel-solicitud-encabezado">
                      <div>
                        <h3>{solicitud.clienteNombre}</h3>
                        <span>{formatearFecha(solicitud.fechaCreacion)}</span>
                      </div>
                      <span className={`solicitud-estado ${estadoSolicitud[solicitud.estado]}`}>
                        {etiquetasEstado[solicitud.estado]}
                      </span>
                    </div>

                    {solicitud.servicioNombre && (
                      <p className="panel-solicitud-servicio">
                        Servicio consultado: <strong>{solicitud.servicioNombre}</strong>
                      </p>
                    )}
                    <p className="panel-solicitud-mensaje">{solicitud.mensaje}</p>

                    <div className="panel-solicitud-acciones">
                      {solicitud.estado === 'pendiente' && (
                        <>
                          <button
                            className="panel-boton-principal panel-boton-compacto"
                            type="button"
                            disabled={cambiandoSolicitud === solicitud.id}
                            onClick={() => void cambiarEstadoSolicitud(solicitud.id, 'aceptada')}
                          >
                            Aceptar
                          </button>
                          <button
                            className="panel-boton-secundario"
                            type="button"
                            disabled={cambiandoSolicitud === solicitud.id}
                            onClick={() => void cambiarEstadoSolicitud(solicitud.id, 'rechazada')}
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                      {solicitud.estado === 'aceptada' && (
                        <button
                          className="panel-boton-principal panel-boton-compacto"
                          type="button"
                          disabled={cambiandoSolicitud === solicitud.id}
                          onClick={() => void cambiarEstadoSolicitud(solicitud.id, 'finalizada')}
                        >
                          Marcar como finalizada
                        </button>
                      )}
                      {(solicitud.estado === 'rechazada' || solicitud.estado === 'finalizada') && (
                        <span className="panel-solicitud-cerrada">
                          Esta solicitud ya está cerrada.
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}
