import { useState } from 'react'
import './App.css'
import Registro from './Registro'
import Login from './login'
import Profesionales from './Profesionales'
import MisServicios from './MisServicios'

const categories = [
  { icon: '🔧', name: 'Plomería', description: 'Reparaciones e instalaciones' },
  { icon: '⚡', name: 'Electricidad', description: 'Instalaciones y mantenimiento' },
  { icon: '🎨', name: 'Pintura', description: 'Interiores y exteriores' },
  { icon: '🧹', name: 'Limpieza', description: 'Hogares y espacios de trabajo' },
  { icon: '🪚', name: 'Carpintería', description: 'Muebles y trabajos en madera' },
  { icon: '❄️', name: 'Climatización', description: 'Aire acondicionado y calefacción' },
]

function App() {
  const [search, setSearch] = useState('')
const [pagina, setPagina] = useState<
  'inicio' | 'registro' | 'login' | 'profesionales' | 'mis-servicios'
>('inicio')

  const filteredCategories = categories.filter((category) =>
    `${category.name} ${category.description}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  if (pagina === 'registro') {
    return <Registro />
  }

if (pagina === 'login') {
  return <Login />
}

if (pagina === 'profesionales') {
  return <Profesionales volverInicio={() => setPagina('inicio')} />
}

if (pagina === 'mis-servicios') {
  return <MisServicios volverInicio={() => setPagina('inicio')} />
}

  return (
    <main>
      <header className="navbar">
        <button
          className="brand"
          onClick={() => setPagina('inicio')}
          aria-label="ConectaPro inicio"
        >
          <span className="brand-icon">C</span>
          <span>Conecta<span className="brand-accent">Pro</span></span>
        </button>

        <nav className="nav-links" aria-label="Navegación principal">
<a
  href="#categorias"
  onClick={(event) => {
    event.preventDefault()
    setPagina('profesionales')
  }}
>
  Explorar servicios
</a>
          <a href="#como-funciona">Cómo funciona</a>
        </nav>


        <div className="nav-actions">
          <button
            className="button button-outline"
            onClick={() => setPagina('login')}
          >
            Iniciar sesión
          </button>

          <button
            className="button button-primary"
            onClick={() => setPagina('registro')}
          >
            Registrarme
          </button>

          <button
            className="button button-outline"
            onClick={() => setPagina('mis-servicios')}
          >
            Mis servicios
          </button>
        </div>

      </header>

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
            Conectamos personas que necesitan un servicio con profesionales
            independientes que saben cómo resolverlo.
          </p>

          <form
            className="search-box"
            onSubmit={(event) => {
              event.preventDefault()
              document.getElementById('categorias')?.scrollIntoView({
                behavior: 'smooth',
              })
            }}
          >
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="¿Qué servicio estás buscando?"
              aria-label="Buscar servicios"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button className="button button-primary search-button" type="submit">
              Buscar servicios
            </button>
          </form>

          <p className="search-hint">
            Probá con: plomería, electricidad, pintura...
          </p>

          <div className="hero-trust">
            <span className="trust-icon">✓</span>
            Explorá opciones y encontrá profesionales para tu necesidad.
          </div>
        </div>

        <div
          className="hero-visual"
          aria-label="Ilustración de conexión entre clientes y profesionales"
        >
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
            <span className="floating-icon">🤝</span>
            <div>
              <strong>Conexiones reales</strong>
              <small>Clientes y profesionales</small>
            </div>
          </div>
          <span className="decor-dot dot-one" />
          <span className="decor-dot dot-two" />
        </div>
      </section>

      <section className="categories-section" id="categorias">
        <div className="section-heading">
          <div>
            <span className="section-kicker">ENCONTRÁ LO QUE NECESITÁS</span>
            <h2>Explorá por categoría</h2>
            <p>Elegí el tipo de servicio que estás buscando.</p>
          </div>
          <span className="category-count">
            {filteredCategories.length} categorías
          </span>
        </div>

        <div className="category-grid">
          {filteredCategories.map((category) => (
            <article className="category-card" key={category.name}>
              <div className="category-icon">{category.icon}</div>
              <h3>{category.name}</h3>
              <p>{category.description}</p>
              <button
                className="category-link"
                onClick={() => {
                  setSearch(category.name)
                  document.getElementById('categorias')?.scrollIntoView({
                    behavior: 'smooth',
                  })
                }}
                aria-label={`Buscar servicios de ${category.name}`}
              >
                Explorar <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <p className="empty-state">
            No encontramos categorías para “{search}”. Probá con otro término.
          </p>
        )}
      </section>

      <section className="how-section" id="como-funciona">
        <span className="section-kicker">SIMPLE Y DIRECTO</span>
        <h2>¿Cómo funciona ConectaPro?</h2>
        <div className="steps-grid">
          <article className="step-card">
            <span className="step-number">01</span>
            <h3>Buscá un servicio</h3>
            <p>Encontrá la categoría que se ajuste a lo que necesitás resolver.</p>
          </article>
          <article className="step-card">
            <span className="step-number">02</span>
            <h3>Conocé profesionales</h3>
            <p>Consultá los perfiles y servicios publicados en la plataforma.</p>
          </article>
          <article className="step-card">
            <span className="step-number">03</span>
            <h3>Contactá y conectá</h3>
            <p>Encontrá una opción adecuada y ponete en contacto.</p>
          </article>
        </div>
      </section>

      <footer className="footer">
        <button
          className="brand footer-brand"
          onClick={() => setPagina('inicio')}
        >
          <span className="brand-icon">C</span>
          <span>Conecta<span className="brand-accent">Pro</span></span>
        </button>
        <p>Conectando necesidades con soluciones.</p>
        <span>Proyecto académico · 2026</span>
      </footer>
    </main>
  )
}

export default App
