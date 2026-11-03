import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from './api'
import AsistenteIA from './AsistenteIA'
import { categoriasBase } from './categoriasBase'
import { estrellas, formatearPuntaje } from './formato'
import type { Categoria, Profesional } from './types'
import './Profesionales.css'

export default function Profesionales() {
  const [parametros, setParametros] = useSearchParams()
  const [texto, setTexto] = useState(parametros.get('busqueda') ?? '')
  const [categoriaId, setCategoriaId] = useState(Number(parametros.get('categoriaId')) || 0)
  const [zona, setZona] = useState(parametros.get('zona') ?? '')
  const [soloDisponibles, setSoloDisponibles] = useState(parametros.get('disponible') !== 'false')
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasBase)
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [reintento, setReintento] = useState(0)

  useEffect(() => {
    api.categorias
      .listar()
      .then((respuesta) => {
        if (respuesta.categorias.length > 0) setCategorias(respuesta.categorias)
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError('')

    const temporizador = window.setTimeout(() => {
      api.profesionales
        .listar({
          busqueda: texto.trim() || undefined,
          categoriaId: categoriaId || undefined,
          zona: zona.trim() || undefined,
          disponible: soloDisponibles ? undefined : false,
        })
        .then((respuesta) => {
          if (activo) setProfesionales(respuesta.profesionales)
        })
        .catch((err: Error) => {
          if (activo) setError(err.message)
        })
        .finally(() => {
          if (activo) setCargando(false)
        })
    }, 250)

    return () => {
      activo = false
      window.clearTimeout(temporizador)
    }
  }, [texto, categoriaId, zona, soloDisponibles, reintento])

  function cambiarCategoria(valor: number) {
    setCategoriaId(valor)
    const siguientes = new URLSearchParams(parametros)
    if (valor) siguientes.set('categoriaId', String(valor))
    else siguientes.delete('categoriaId')
    setParametros(siguientes, { replace: true })
  }

  function cambiarZona(valor: string) {
    setZona(valor)
    const siguientes = new URLSearchParams(parametros)
    if (valor.trim()) siguientes.set('zona', valor)
    else siguientes.delete('zona')
    setParametros(siguientes, { replace: true })
  }

  function cambiarDisponibilidad(valor: boolean) {
    setSoloDisponibles(valor)
    const siguientes = new URLSearchParams(parametros)
    if (valor) siguientes.delete('disponible')
    else siguientes.set('disponible', 'false')
    setParametros(siguientes, { replace: true })
  }

  function limpiar() {
    setTexto('')
    setCategoriaId(0)
    setZona('')
    setSoloDisponibles(true)
    setParametros({}, { replace: true })
  }

  const hayFiltros = Boolean(texto.trim() || categoriaId || zona.trim() || !soloDisponibles)

  const categoriaNombre =
    categorias.find((categoria) => categoria.id === categoriaId)?.nombre ?? ''

  return (
    <main className="profesionales-page">
      <section className="profesionales-hero">
        <span className="profesionales-kicker">ENCONTRÁ A QUIEN NECESITÁS</span>
        <h1>Explorá profesionales</h1>
        <p>
          Buscá por nombre, especialidad o servicio. También podés describir tu problema y dejar
          que el asistente de IA te oriente.
        </p>

        <div className="catalogo-ia">
          <AsistenteIA
            titulo="¿No sabés qué categoría elegir?"
            ayuda="Describí lo que necesitás y te proponemos la categoría y los profesionales más adecuados."
            onAplicar={(sugerencia) => {
              if (!sugerencia.categoriaId) return
              cambiarCategoria(sugerencia.categoriaId)
              window.setTimeout(() => {
                document.getElementById('resultados-profesionales')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }, 120)
            }}
          />
        </div>

        <label className="profesionales-busqueda">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Buscar por nombre, especialidad o servicio..."
            aria-label="Buscar profesionales"
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
          />
        </label>
      </section>

      <section className="profesionales-resultados" id="resultados-profesionales">
        <div className="profesionales-filtros">
          <label htmlFor="filtro-categoria">Categoría</label>
          <select
            id="filtro-categoria"
            value={categoriaId}
            onChange={(event) => cambiarCategoria(Number(event.target.value))}
          >
            <option value={0}>Todas</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.icono} {categoria.nombre}
              </option>
            ))}
          </select>

          <label htmlFor="filtro-zona">Zona</label>
          <input
            id="filtro-zona"
            type="search"
            className="profesionales-filtro-zona"
            placeholder="Ej.: CABA, Palermo..."
            value={zona}
            onChange={(event) => cambiarZona(event.target.value)}
          />

          <label htmlFor="filtro-disponibilidad">Disponibilidad</label>
          <select
            id="filtro-disponibilidad"
            value={soloDisponibles ? 'disponibles' : 'todos'}
            onChange={(event) => cambiarDisponibilidad(event.target.value === 'disponibles')}
          >
            <option value="disponibles">Solo disponibles</option>
            <option value="todos">Todos</option>
          </select>

          {hayFiltros && (
            <button className="profesionales-limpiar" type="button" onClick={limpiar}>
              Limpiar filtros
            </button>
          )}

          <span className="profesionales-cantidad">
            {cargando
              ? 'Buscando...'
              : `${profesionales.length} ${
                  profesionales.length === 1 ? 'profesional' : 'profesionales'
                }`}
          </span>
        </div>

        {error && (
          <div className="profesionales-vacio">
            <span aria-hidden="true">!</span>
            <h2>No pudimos cargar los profesionales</h2>
            <p>{error}</p>
            <button
              className="profesionales-boton"
              type="button"
              onClick={() => setReintento((actual) => actual + 1)}
            >
              Reintentar
            </button>
          </div>
        )}

        {!error && cargando && (
          <div className="profesionales-grid" aria-busy="true">
            {[1, 2, 3].map((item) => (
              <div className="profesional-card esqueleto" key={item}>
                <div className="esqueleto-linea esqueleto-avatar" />
                <div className="esqueleto-linea" />
                <div className="esqueleto-linea esqueleto-corta" />
                <div className="esqueleto-linea esqueleto-alta" />
              </div>
            ))}
          </div>
        )}

        {!error && !cargando && profesionales.length > 0 && (
          <div className="profesionales-grid">
            {profesionales.map((profesional) => (
              <article className="profesional-card" key={profesional.id}>
                <div className="profesional-card-top">
                  <div className="profesional-avatar">{profesional.iniciales}</div>
                  <span className="profesional-categoria">
                    {profesional.categorias[0] ?? profesional.especialidad}
                  </span>
                </div>

                <div className="profesional-nombre-fila">
                  <h2>{profesional.nombre}</h2>
                  {profesional.verificado && (
                    <span className="profesional-verificado" title="Perfil verificado">
                      ✓
                    </span>
                  )}
                </div>
                <h3>{profesional.especialidad}</h3>
                <p>{profesional.descripcion}</p>

                <div className="profesional-meta">
                  <span className="profesional-rating">
                    <span aria-hidden="true">{estrellas(profesional.promedioPuntuacion)}</span>
                    {formatearPuntaje(profesional.promedioPuntuacion)}
                    <small>({profesional.cantidadResenas})</small>
                  </span>
                  <span>📍 {profesional.zona}</span>
                  <span>
                    🛠️ {profesional.servicios.length}{' '}
                    {profesional.servicios.length === 1 ? 'servicio' : 'servicios'}
                  </span>
                </div>

                {profesional.categorias.length > 1 && (
                  <div className="profesional-tags">
                    {profesional.categorias.slice(0, 3).map((categoria) => (
                      <span key={categoria}>{categoria}</span>
                    ))}
                  </div>
                )}

                <Link className="profesional-ver" to={`/profesionales/${profesional.id}`}>
                  Ver perfil <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        )}

        {!error && !cargando && profesionales.length === 0 && (
          <div className="profesionales-vacio">
            <span aria-hidden="true">⌕</span>
            <h2>No encontramos profesionales</h2>
            <p>
              {categoriaNombre
                ? `Todavía no hay profesionales disponibles en ${categoriaNombre} con esos filtros.`
                : 'Probá con otro nombre, servicio o categoría.'}
            </p>
            <button className="profesionales-boton" type="button" onClick={limpiar}>
              Limpiar filtros
            </button>
          </div>
        )}
      </section>
    </main>
  )
}
