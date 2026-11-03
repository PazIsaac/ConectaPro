import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from './api'
import AsistenteIA from './AsistenteIA'
import { categoriasBase } from './categoriasBase'
import type { Categoria, Estadisticas } from './types'

export default function Home() {
  const [busqueda, setBusqueda] = useState('')
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasBase)
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const navegar = useNavigate()
  const ubicacion = useLocation()

  useEffect(() => {
    if (!ubicacion.hash) return
    const elemento = document.getElementById(ubicacion.hash.slice(1))
    if (elemento) {
      elemento.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [ubicacion.hash])

  useEffect(() => {
    Promise.all([api.categorias.listar(), api.categorias.estadisticas()])
      .then(([respuestaCategorias, respuestaEstadisticas]) => {
        if (respuestaCategorias.categorias.length > 0) setCategorias(respuestaCategorias.categorias)
        setEstadisticas(respuestaEstadisticas.estadisticas)
      })
      .catch(() => {
        // La portada mantiene las categorías base si la API todavía no está disponible.
      })
  }, [])

  function buscar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const texto = busqueda.trim()
    navegar(texto ? `/profesionales?busqueda=${encodeURIComponent(texto)}` : '/profesionales')
  }

  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">
            <span className="status-dot" />
            Profesionales independientes, más cerca
          </span>

          <h1>
            Encontrá a la persona indicada para <span>cada trabajo.</span>
          </h1>

          <p className="hero-description">
            Conectamos personas que necesitan un servicio con profesionales independientes que
            saben cómo resolverlo. Buscá, compará y contactá en un solo lugar.
          </p>

          <form className="search-box" onSubmit={buscar}>
            <span className="search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              type="search"
              placeholder="¿Qué servicio estás buscando?"
              aria-label="Buscar servicios"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
            <button className="button button-primary search-button" type="submit">
              Buscar servicios
            </button>
          </form>

          <p className="search-hint">Probá con: plomería, electricidad, pintura, consolas...</p>

          <div className="hero-trust">
            <span className="trust-icon">✓</span>
            Perfiles, servicios y reseñas verificadas dentro de la plataforma.
          </div>
        </div>

        <div className="hero-visual" aria-label="Ilustración de conexión entre clientes y profesionales">
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />
          <div className="visual-center">
            <span className="visual-logo">C</span>
            <strong>ConectaPro</strong>
            <small>Personas que conectan</small>
          </div>
          <div className="floating-card card-top">
            <span className="floating-icon">🛠️</span>
            <div>
              <strong>Servicios</strong>
              <small>Soluciones para tu hogar</small>
            </div>
          </div>
          <div className="floating-card card-bottom">
            <span className="floating-icon">✦</span>
            <div>
              <strong>Asistente con IA</strong>
              <small>Te orienta por categoría</small>
            </div>
          </div>
          <span className="decor-dot dot-one" />
          <span className="decor-dot dot-two" />
        </div>
      </section>

      {estadisticas && (
        <section className="hero-stats" aria-label="Resumen de la plataforma">
          <div>
            <strong>{estadisticas.profesionales}</strong>
            <span>profesionales</span>
          </div>
          <div>
            <strong>{estadisticas.servicios}</strong>
            <span>servicios publicados</span>
          </div>
          <div>
            <strong>{estadisticas.categorias}</strong>
            <span>categorías</span>
          </div>
          <div>
            <strong>
              {estadisticas.promedio ? estadisticas.promedio.toFixed(1).replace('.', ',') : '—'}
            </strong>
            <span>puntaje promedio</span>
          </div>
        </section>
      )}

      <section className="home-asistente">
        <AsistenteIA />
      </section>

      <section className="categories-section" id="categorias">
        <div className="section-heading">
          <div>
            <span className="section-kicker">ENCONTRÁ LO QUE NECESITÁS</span>
            <h2>Explorá por categoría</h2>
            <p>Elegí el tipo de servicio que estás buscando.</p>
          </div>
          <span className="category-count">{categorias.length} categorías</span>
        </div>

        <div className="category-grid">
          {categorias.map((categoria) => (
            <article className="category-card" key={categoria.id}>
              <div className="category-icon">{categoria.icono}</div>
              <h3>{categoria.nombre}</h3>
              <p>{categoria.descripcion}</p>
              {typeof categoria.cantidadServicios === 'number' && (
                <span className="category-servicios">
                  {categoria.cantidadServicios}{' '}
                  {categoria.cantidadServicios === 1 ? 'servicio' : 'servicios'}
                </span>
              )}
              <Link
                className="category-link"
                to={`/profesionales?categoriaId=${categoria.id}`}
                aria-label={`Ver profesionales de ${categoria.nombre}`}
              >
                Explorar <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="how-section" id="como-funciona">
        <span className="section-kicker">SIMPLE Y DIRECTO</span>
        <h2>¿Cómo funciona ConectaPro?</h2>
        <div className="steps-grid">
          <article className="step-card">
            <span className="step-number">01</span>
            <h3>Describí tu necesidad</h3>
            <p>Escribí qué necesitás resolver o elegí una categoría para empezar.</p>
          </article>
          <article className="step-card">
            <span className="step-number">02</span>
            <h3>Conocé profesionales</h3>
            <p>Consultá perfiles, servicios, zonas de cobertura y reseñas reales.</p>
          </article>
          <article className="step-card">
            <span className="step-number">03</span>
            <h3>Enviá una solicitud</h3>
            <p>Contale al profesional qué necesitás y seguí el estado desde tu cuenta.</p>
          </article>
        </div>
      </section>
    </main>
  )
}
