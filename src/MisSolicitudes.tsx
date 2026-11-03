import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ErrorApi } from './api'
import { useAuth } from './contexto'
import { etiquetasEstado, formatearFecha, formatearMoneda } from './formato'
import type { Pago, Solicitud } from './types'
import './Panel.css'

type Filtro = 'todas' | Solicitud['estado']

const filtros: Array<{ valor: Filtro; etiqueta: string }> = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'pendiente', etiqueta: 'Pendientes' },
  { valor: 'aceptada', etiqueta: 'Aceptadas' },
  { valor: 'finalizada', etiqueta: 'Finalizadas' },
  { valor: 'rechazada', etiqueta: 'Rechazadas' },
]

const estadoClase: Record<Solicitud['estado'], string> = {
  pendiente: 'solicitud-estado-pendiente',
  aceptada: 'solicitud-estado-aceptada',
  rechazada: 'solicitud-estado-rechazada',
  finalizada: 'solicitud-estado-finalizada',
}

const estadoAyuda: Record<Solicitud['estado'], string> = {
  pendiente: 'El profesional todavía no respondió tu solicitud.',
  aceptada: 'La solicitud fue aceptada. Podés coordinar los detalles desde el perfil profesional.',
  rechazada: 'El profesional no pudo tomar esta solicitud. Podés buscar otra alternativa.',
  finalizada: 'El trabajo se marcó como finalizado. ¡Ya podés dejar tu reseña!',
}

export default function MisSolicitudes() {
  const { usuario } = useAuth()
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [pagos, setPagos] = useState<Record<number, Pago>>({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todas')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const [respuestaSolicitudes, respuestaPagos] = await Promise.all([
        api.solicitudes.mias(),
        api.pagos.mias(),
      ])
      setSolicitudes(respuestaSolicitudes.solicitudes)
      const mapa: Record<number, Pago> = {}
      respuestaPagos.pagos.forEach((pago) => {
        mapa[pago.solicitudId] = pago
      })
      setPagos(mapa)
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : 'No pudimos cargar tus solicitudes.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const conteos = {
    todas: solicitudes.length,
    pendiente: solicitudes.filter((solicitud) => solicitud.estado === 'pendiente').length,
    aceptada: solicitudes.filter((solicitud) => solicitud.estado === 'aceptada').length,
    finalizada: solicitudes.filter((solicitud) => solicitud.estado === 'finalizada').length,
    rechazada: solicitudes.filter((solicitud) => solicitud.estado === 'rechazada').length,
  }

  const visibles =
    filtro === 'todas'
      ? solicitudes
      : solicitudes.filter((solicitud) => solicitud.estado === filtro)

  return (
    <main className="panel-page solicitudes-page">
      <section className="panel-hero">
        <div className="panel-hero-texto">
          <span className="panel-kicker">TU ACTIVIDAD</span>
          <h1>Mis solicitudes</h1>
          <p>
            Seguí el estado de los servicios que pediste, revisá las respuestas de los
            profesionales y dejá tu reseña cuando el trabajo termine.
          </p>
        </div>
        <div className="solicitudes-resumen">
          <div>
            <strong>{conteos.pendiente}</strong>
            <span>pendientes</span>
          </div>
          <div>
            <strong>{conteos.aceptada}</strong>
            <span>aceptadas</span>
          </div>
          <div>
            <strong>{conteos.finalizada}</strong>
            <span>finalizadas</span>
          </div>
        </div>
      </section>

      <section className="panel-tarjeta" aria-labelledby="solicitudes-titulo">
        <div className="panel-tarjeta-encabezado">
          <div>
            <span className="panel-kicker">HOLA, {usuario?.nombre.split(' ')[0].toUpperCase()}</span>
            <h2 id="solicitudes-titulo">Historial de solicitudes</h2>
          </div>
          <Link className="panel-boton-secundario" to="/profesionales">
            Buscar profesionales
          </Link>
        </div>

        {error && (
          <div className="panel-aviso panel-aviso-error" role="alert">
            <p>{error}</p>
            <button className="panel-boton-secundario" type="button" onClick={() => void cargar()}>
              Reintentar
            </button>
          </div>
        )}

        {cargando ? (
          <div className="panel-cargando" aria-busy="true">
            <span className="cargando-giro" aria-hidden="true" />
            <p>Cargando tus solicitudes...</p>
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="panel-vacio">
            <span aria-hidden="true">📨</span>
            <h3>Todavía no enviaste solicitudes</h3>
            <p>
              Explorá el catálogo, entrá al perfil de un profesional y contale qué necesitás.
            </p>
            <Link className="panel-boton-principal panel-boton-compacto" to="/profesionales">
              Explorar profesionales
            </Link>
          </div>
        ) : (
          <>
            <div className="solicitudes-filtros" role="tablist" aria-label="Filtrar solicitudes">
              {filtros.map((opcion) => (
                <button
                  key={opcion.valor}
                  type="button"
                  role="tab"
                  aria-selected={filtro === opcion.valor}
                  className={
                    filtro === opcion.valor
                      ? 'solicitudes-filtro solicitudes-filtro-activo'
                      : 'solicitudes-filtro'
                  }
                  onClick={() => setFiltro(opcion.valor)}
                >
                  {opcion.etiqueta}
                  <span>{conteos[opcion.valor]}</span>
                </button>
              ))}
            </div>

            {visibles.length === 0 ? (
              <p className="solicitudes-sin-resultados">
                No hay solicitudes
                {filtro !== 'todas'
                  ? ` en estado “${etiquetasEstado[filtro].toLowerCase()}”`
                  : ''}
                .
              </p>
            ) : (
              <div className="solicitudes-lista">
                {visibles.map((solicitud) => (
                  <article className="solicitud-card" key={solicitud.id}>
                    <div className="solicitud-card-encabezado">
                      <div>
                        <span className="solicitud-card-fecha">
                          Enviada el {formatearFecha(solicitud.fechaCreacion)}
                        </span>
                        <h3>{solicitud.profesionalNombre}</h3>
                        {solicitud.servicioNombre && (
                          <p className="solicitud-card-servicio">{solicitud.servicioNombre}</p>
                        )}
                      </div>
                      <span className={`solicitud-estado ${estadoClase[solicitud.estado]}`}>
                        {etiquetasEstado[solicitud.estado]}
                      </span>
                    </div>

                    <p className="solicitud-card-mensaje">{solicitud.mensaje}</p>
                    <p className="solicitud-card-ayuda">{estadoAyuda[solicitud.estado]}</p>

                    <div className="solicitud-card-acciones">
                      {pagos[solicitud.id] ? (
                        <span className="solicitud-pago">
                          ✓ Pagado ·{' '}
                          {formatearMoneda(
                            pagos[solicitud.id]!.monto,
                            pagos[solicitud.id]!.moneda,
                          )}
                        </span>
                      ) : (
                        (solicitud.estado === 'aceptada' || solicitud.estado === 'finalizada') && (
                          <Link
                            className="panel-boton-principal panel-boton-compacto"
                            to={`/pago/${solicitud.id}`}
                          >
                            Pagar servicio
                          </Link>
                        )
                      )}
                      <Link
                        className="panel-boton-secundario"
                        to={`/profesionales/${solicitud.profesionalId}`}
                      >
                        Ver perfil profesional
                      </Link>
                      {pagos[solicitud.id] && (
                        <Link
                          className="panel-boton-secundario"
                          to={`/pago/${solicitud.id}`}
                        >
                          Ver comprobante
                        </Link>
                      )}
                      {solicitud.estado === 'finalizada' && (
                        <Link
                          className="panel-boton-principal panel-boton-compacto"
                          to={`/profesionales/${solicitud.profesionalId}#titulo-resenas`}
                        >
                          Dejar una reseña
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}
