import { useState } from 'react'
import './Profesionales.css'

type Profesional = {
  id: number
  nombre: string
  especialidad: string
  categoria: string
  descripcion: string
  iniciales: string
}

type Solicitud = {
  id: number
  profesional: string
  nombreCliente: string
  contacto: string
  detalle: string
}

type Resena = {
  id: number
  profesionalId: number
  nombre: string
  puntuacion: number
  comentario: string
}

const profesionalesEjemplo: Profesional[] = [
  {
    id: 1,
    nombre: 'Martín Rodríguez',
    especialidad: 'Electricista',
    categoria: 'Electricidad',
    descripcion: 'Instalaciones eléctricas y mantenimiento general.',
    iniciales: 'MR',
  },
  {
    id: 2,
    nombre: 'Lucía Fernández',
    especialidad: 'Plomera',
    categoria: 'Plomería',
    descripcion: 'Reparación de pérdidas e instalaciones de agua.',
    iniciales: 'LF',
  },
  {
    id: 3,
    nombre: 'Santiago Gómez',
    especialidad: 'Pintor',
    categoria: 'Pintura',
    descripcion: 'Pintura de interiores y exteriores.',
    iniciales: 'SG',
  },
  {
    id: 4,
    nombre: 'Camila Torres',
    especialidad: 'Carpintera',
    categoria: 'Carpintería',
    descripcion: 'Muebles, reparaciones y trabajos en madera.',
    iniciales: 'CT',
  },
  {
    id: 5,
    nombre: 'Nicolás Pérez',
    especialidad: 'Técnico en climatización',
    categoria: 'Climatización',
    descripcion: 'Mantenimiento de aire acondicionado y calefacción.',
    iniciales: 'NP',
  },
  {
    id: 6,
    nombre: 'Valentina Díaz',
    especialidad: 'Servicio de limpieza',
    categoria: 'Limpieza',
    descripcion: 'Limpieza de hogares y espacios de trabajo.',
    iniciales: 'VD',
  },
]

const categorias = [
  'Todas',
  'Electricidad',
  'Plomería',
  'Pintura',
  'Carpintería',
  'Climatización',
  'Limpieza',
]

type ProfesionalesProps = {
  volverInicio: () => void
}

function Profesionales({ volverInicio }: ProfesionalesProps) {
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('Todas')
  const [profesionalSeleccionado, setProfesionalSeleccionado] =
    useState<Profesional | null>(null)
  const [mostrarSolicitud, setMostrarSolicitud] = useState(false)
  const [nombreCliente, setNombreCliente] = useState('')
  const [contacto, setContacto] = useState('')
  const [detalle, setDetalle] = useState('')
  const [, setSolicitudes] = useState<Solicitud[]>([])
  const [mensajeSolicitud, setMensajeSolicitud] = useState('')
  const [resenas, setResenas] = useState<Resena[]>([])
  const [nombreResena, setNombreResena] = useState('')
  const [puntuacion, setPuntuacion] = useState('5')
  const [comentarioResena, setComentarioResena] = useState('')
  const [mensajeResena, setMensajeResena] = useState('')
  const [descripcionProblema, setDescripcionProblema] = useState('')
  const [categoriaSugerida, setCategoriaSugerida] = useState('')
  const [mensajeSugerencia, setMensajeSugerencia] = useState('')

  const profesionalesFiltrados = profesionalesEjemplo.filter((profesional) => {
    const coincideBusqueda =
      `${profesional.nombre} ${profesional.especialidad} ${profesional.descripcion}`
        .toLowerCase()
        .includes(busqueda.toLowerCase())

    const coincideCategoria =
      categoria === 'Todas' || profesional.categoria === categoria

    return coincideBusqueda && coincideCategoria
  })

  function enviarSolicitud(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!profesionalSeleccionado) return

    const nuevaSolicitud: Solicitud = {
      id: Date.now(),
      profesional: profesionalSeleccionado.nombre,
      nombreCliente: nombreCliente.trim(),
      contacto: contacto.trim(),
      detalle: detalle.trim(),
    }

    setSolicitudes((actuales) => [...actuales, nuevaSolicitud])
    setMensajeSolicitud(
      `La solicitud para ${profesionalSeleccionado.nombre} se registró en esta sesión.`,
    )
    setNombreCliente('')
    setContacto('')
    setDetalle('')
    setMostrarSolicitud(false)
  }

  function enviarResena(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!profesionalSeleccionado) return

    const nuevaResena: Resena = {
      id: Date.now(),
      profesionalId: profesionalSeleccionado.id,
      nombre: nombreResena.trim(),
      puntuacion: Number(puntuacion),
      comentario: comentarioResena.trim(),
    }

    setResenas((actuales) => [...actuales, nuevaResena])
    setNombreResena('')
    setPuntuacion('5')
    setComentarioResena('')
    setMensajeResena('Tu reseña se publicó durante esta sesión.')
  }

  function sugerirCategoria(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const texto = descripcionProblema.toLowerCase()
    let sugerencia = ''

    if (/cable|enchufe|luz|electric|cortocircuit|toma corriente|disyuntor|interruptor/.test(texto)) {
      sugerencia = 'Electricidad'
    } else if (/canilla|agua|cañ|grifo|pérdida|perdida|caño|inodoro|baño|plomer/.test(texto)) {
      sugerencia = 'Plomería'
    } else if (/pint|pared|humedad|paredes|látex|latex|barniz/.test(texto)) {
      sugerencia = 'Pintura'
    } else if (/madera|mueble|puerta|mesa|silla|estante|carpinter/.test(texto)) {
      sugerencia = 'Carpintería'
    } else if (/aire acondicionado|calefacción|calefaccion|refrigeración|refrigeracion|temperatura|climatiz/.test(texto)) {
      sugerencia = 'Climatización'
    } else if (/limpiar|limpieza|suciedad|desinfección|desinfeccion|polvo/.test(texto)) {
      sugerencia = 'Limpieza'
    }

    if (sugerencia) {
      setCategoriaSugerida(sugerencia)
      setMensajeSugerencia(`La categoría sugerida es ${sugerencia}. Podés ver los profesionales de esa categoría.`)
    } else {
      setCategoriaSugerida('')
      setMensajeSugerencia('No pudimos identificar una categoría con esa descripción. Probá agregando más detalles o buscá por categoría.')
    }
  }

  if (profesionalSeleccionado) {
    return (
      <main className="profesionales-page">
        <header className="profesionales-navbar">
          <button className="profesionales-brand" onClick={volverInicio}>
            <span className="profesionales-brand-icon">C</span>
            <span>Conecta<span>Pro</span></span>
          </button>
          <button
            className="profesionales-volver"
            onClick={() => {
              setProfesionalSeleccionado(null)
              setMostrarSolicitud(false)
              setMensajeSolicitud('')
            }}
          >
            ← Volver al catálogo
          </button>
        </header>

        <section className="perfil-profesional">
          <div className="perfil-avatar">
            {profesionalSeleccionado.iniciales}
          </div>
          <span className="profesionales-etiqueta">
            {profesionalSeleccionado.categoria}
          </span>
          <h1>{profesionalSeleccionado.nombre}</h1>
          <h2>{profesionalSeleccionado.especialidad}</h2>
          <p>{profesionalSeleccionado.descripcion}</p>
          <p className="perfil-nota">
            Perfil de demostración. Las solicitudes se guardan temporalmente
            mientras esta pantalla permanece abierta.
          </p>

          {!mostrarSolicitud && (
            <button
              className="profesionales-boton"
              onClick={() => {
                setMostrarSolicitud(true)
                setMensajeSolicitud('')
              }}
            >
              Consultar servicio
            </button>
          )}

          {mensajeSolicitud && (
            <p className="solicitud-mensaje" role="status">
              {mensajeSolicitud}
            </p>
          )}

          {mostrarSolicitud && (
            <form className="solicitud-formulario" onSubmit={enviarSolicitud}>
              <h2>Solicitar un servicio</h2>

              <label htmlFor="nombre-cliente">Tu nombre</label>
              <input
                id="nombre-cliente"
                value={nombreCliente}
                onChange={(event) => setNombreCliente(event.target.value)}
                required
                maxLength={100}
                placeholder="Ingresá tu nombre"
              />

              <label htmlFor="contacto-cliente">Email o teléfono de contacto</label>
              <input
                id="contacto-cliente"
                value={contacto}
                onChange={(event) => setContacto(event.target.value)}
                required
                maxLength={150}
                placeholder="Cómo puede contactarte"
              />

              <label htmlFor="detalle-solicitud">¿Qué trabajo necesitás?</label>
              <textarea
                id="detalle-solicitud"
                value={detalle}
                onChange={(event) => setDetalle(event.target.value)}
                required
                maxLength={1000}
                rows={4}
                placeholder="Describí el trabajo que necesitás realizar"
              />

              <div className="solicitud-acciones">
                <button className="profesionales-boton" type="submit">
                  Enviar solicitud
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

          <section className="resenas-seccion" aria-labelledby="titulo-resenas">
            <h2 id="titulo-resenas">Opiniones de usuarios</h2>

            {resenas.filter((resena) => resena.profesionalId === profesionalSeleccionado.id).length > 0 ? (
              resenas
                .filter((resena) => resena.profesionalId === profesionalSeleccionado.id)
                .map((resena) => (
                  <article className="resena-card" key={resena.id}>
                    <h3>{resena.nombre}</h3>
                    <p className="resena-estrellas" aria-label={`${resena.puntuacion} de 5 estrellas`}>
                      {'★'.repeat(resena.puntuacion)}
                      {'☆'.repeat(5 - resena.puntuacion)}
                    </p>
                    <p>{resena.comentario}</p>
                  </article>
                ))
            ) : (
              <p className="resenas-vacias">Todavía no hay reseñas para este profesional.</p>
            )}

            <form className="resena-formulario" onSubmit={enviarResena}>
              <h3>Dejá tu opinión</h3>

              <label htmlFor="nombre-resena">Tu nombre</label>
              <input
                id="nombre-resena"
                value={nombreResena}
                onChange={(event) => setNombreResena(event.target.value)}
                maxLength={100}
                required
                placeholder="Ingresá tu nombre"
              />

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
                value={comentarioResena}
                onChange={(event) => setComentarioResena(event.target.value)}
                maxLength={1000}
                rows={4}
                required
                placeholder="Contá cómo fue tu experiencia"
              />

              <button className="profesionales-boton" type="submit">
                Publicar reseña
              </button>

              {mensajeResena && (
                <p className="resena-mensaje" role="status">
                  {mensajeResena}
                </p>
              )}
            </form>

            <p className="resena-nota">
              Las reseñas son demostrativas y se conservan únicamente durante esta sesión.
            </p>
          </section>
        </section>
      </main>
    )
  }

  return (
    <main className="profesionales-page">
      <header className="profesionales-navbar">
        <button className="profesionales-brand" onClick={volverInicio}>
          <span className="profesionales-brand-icon">C</span>
          <span>Conecta<span>Pro</span></span>
        </button>

        <button className="profesionales-volver" onClick={volverInicio}>
          ← Volver al inicio
        </button>
      </header>

      <section className="profesionales-hero">
        <span className="profesionales-kicker">ENCONTRÁ A QUIEN NECESITÁS</span>
        <h1>Explorá profesionales</h1>
        <p>
          Buscá personas que puedan ayudarte y encontrá el servicio adecuado
          para lo que necesitás resolver.
        </p>

        <form className="sugerencia-categoria-formulario" onSubmit={sugerirCategoria}>
          <label htmlFor="descripcion-problema">¿Qué problema necesitás resolver?</label>
          <textarea
            id="descripcion-problema"
            value={descripcionProblema}
            onChange={(event) => {
              setDescripcionProblema(event.target.value)
              setMensajeSugerencia('')
              setCategoriaSugerida('')
            }}
            required
            maxLength={1000}
            rows={3}
            placeholder="Ej.: tengo una pérdida de agua debajo de la pileta"
          />
          <div className="sugerencia-categoria-acciones">
            <button className="profesionales-boton" type="submit">
              Sugerir categoría
            </button>
            {categoriaSugerida && (
              <button
                className="profesionales-volver"
                type="button"
                onClick={() => {
                  setCategoria(categoriaSugerida)
                  setBusqueda('')
                  document.getElementById('filtro-categoria')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }}
              >
                Ver {categoriaSugerida.toLowerCase()}
              </button>
            )}
          </div>
          {mensajeSugerencia && (
            <p className="sugerencia-categoria-mensaje" role="status">
              {mensajeSugerencia}
            </p>
          )}
          <p className="sugerencia-categoria-nota">
            Sugerencia demostrativa basada en palabras clave; no utiliza todavía un modelo de IA conectado.
          </p>
        </form>

        <label className="profesionales-busqueda">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Buscar por nombre o especialidad..."
            aria-label="Buscar profesionales"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
        </label>
      </section>

      <section className="profesionales-resultados">
        <div className="profesionales-filtros">
          <label htmlFor="filtro-categoria">Categoría</label>
          <select
            id="filtro-categoria"
            value={categoria}
            onChange={(event) => setCategoria(event.target.value)}
          >
            {categorias.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <span className="profesionales-cantidad">
            {profesionalesFiltrados.length}{' '}
            {profesionalesFiltrados.length === 1
              ? 'profesional'
              : 'profesionales'}
          </span>
        </div>

        {profesionalesFiltrados.length > 0 ? (
          <div className="profesionales-grid">
            {profesionalesFiltrados.map((profesional) => (
              <article className="profesional-card" key={profesional.id}>
                <div className="profesional-card-top">
                  <div className="profesional-avatar">
                    {profesional.iniciales}
                  </div>
                  <span className="profesional-categoria">
                    {profesional.categoria}
                  </span>
                </div>

                <h2>{profesional.nombre}</h2>
                <h3>{profesional.especialidad}</h3>
                <p>{profesional.descripcion}</p>

                <button
                  className="profesional-ver"
                  onClick={() => {
                    setProfesionalSeleccionado(profesional)
                    setMostrarSolicitud(false)
                    setMensajeSolicitud('')
                    setMensajeResena('')
                  }}
                >
                  Ver perfil <span aria-hidden="true">→</span>
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="profesionales-vacio">
            <span aria-hidden="true">⌕</span>
            <h2>No encontramos profesionales</h2>
            <p>Probá con otro nombre o seleccioná una categoría diferente.</p>
            <button
              className="profesionales-boton"
              onClick={() => {
                setBusqueda('')
                setCategoria('Todas')
              }}
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </section>
    </main>
  )
}

export default Profesionales
