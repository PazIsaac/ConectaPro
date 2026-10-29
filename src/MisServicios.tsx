
import { useState } from 'react'
import './MisServicios.css'

type Servicio = {
  id: number
  nombre: string
  categoria: string
  descripcion: string
  precio: string
}

type MisServiciosProps = {
  volverInicio: () => void
}

const categorias = [
  'Electricidad',
  'Plomería',
  'Pintura',
  'Limpieza',
  'Carpintería',
  'Climatización',
  'Otros',
]

function MisServicios({ volverInicio }: MisServiciosProps) {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [confirmarEliminar, setConfirmarEliminar] = useState<number | null>(
    null,
  )

  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState(categorias[0])
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')

  function limpiarFormulario() {
    setNombre('')
    setCategoria(categorias[0])
    setDescripcion('')
    setPrecio('')
    setEditandoId(null)
  }

  function guardarServicio(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const datosServicio = {
      nombre: nombre.trim(),
      categoria,
      descripcion: descripcion.trim(),
      precio: precio.trim(),
    }

    if (!datosServicio.nombre || !datosServicio.descripcion) {
      setMensaje('Completá el nombre y la descripción del servicio.')
      return
    }

    if (editandoId !== null) {
      setServicios((actuales) =>
        actuales.map((servicio) =>
          servicio.id === editandoId
            ? { ...servicio, ...datosServicio }
            : servicio,
        ),
      )
      setMensaje('Los cambios del servicio se guardaron correctamente.')
    } else {
      setServicios((actuales) => [
        ...actuales,
        { id: Date.now(), ...datosServicio },
      ])
      setMensaje('El servicio se publicó correctamente.')
    }

    limpiarFormulario()
  }

  function editarServicio(servicio: Servicio) {
    setNombre(servicio.nombre)
    setCategoria(servicio.categoria)
    setDescripcion(servicio.descripcion)
    setPrecio(servicio.precio)
    setEditandoId(servicio.id)
    setMensaje('')
    setConfirmarEliminar(null)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function eliminarServicio(id: number) {
    setServicios((actuales) =>
      actuales.filter((servicio) => servicio.id !== id),
    )

    if (editandoId === id) {
      limpiarFormulario()
    }

    setConfirmarEliminar(null)
    setMensaje('El servicio se eliminó correctamente.')
  }

  return (
    <main className="mis-servicios">
      <header className="servicios-encabezado">
        <button
          type="button"
          className="servicios-volver"
          onClick={volverInicio}
        >
          ← Volver al inicio
        </button>

        <p className="servicios-etiqueta">PANEL DEL PROFESIONAL</p>
        <h1>Mis servicios</h1>
        <p>
          Publicá tus servicios y mantené actualizada la información que ven
          tus potenciales clientes.
        </p>
      </header>

      <section className="servicios-formulario-seccion">
        <h2>
          {editandoId !== null ? 'Modificar servicio' : 'Publicar un servicio'}
        </h2>

        <form className="servicios-formulario" onSubmit={guardarServicio}>
          <label htmlFor="servicio-nombre">Nombre del servicio</label>
          <input
            id="servicio-nombre"
            type="text"
            placeholder="Ej.: Instalación de luces"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            required
          />

          <label htmlFor="servicio-categoria">Categoría</label>
          <select
            id="servicio-categoria"
            value={categoria}
            onChange={(event) => setCategoria(event.target.value)}
          >
            {categorias.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>

          <label htmlFor="servicio-descripcion">Descripción</label>
          <textarea
            id="servicio-descripcion"
            placeholder="Describí qué trabajo realizás y qué ofrecés."
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
            rows={4}
            required
          />

          <label htmlFor="servicio-precio">Precio orientativo (opcional)</label>
          <input
            id="servicio-precio"
            type="text"
            placeholder="Ej.: Desde $15.000"
            value={precio}
            onChange={(event) => setPrecio(event.target.value)}
          />

          <div className="servicios-acciones-formulario">
            <button type="submit" className="servicios-boton-principal">
              {editandoId !== null ? 'Guardar cambios' : 'Publicar servicio'}
            </button>

            {editandoId !== null && (
              <button
                type="button"
                className="servicios-boton-secundario"
                onClick={limpiarFormulario}
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>

        {mensaje && (
          <p className="servicios-mensaje" role="status">
            {mensaje}
          </p>
        )}
      </section>

      <section className="servicios-listado">
        <div className="servicios-listado-titulo">
          <div>
            <p className="servicios-etiqueta">TU ACTIVIDAD</p>
            <h2>Servicios publicados</h2>
          </div>
          <span>{servicios.length} servicios</span>
        </div>

        {servicios.length === 0 ? (
          <div className="servicios-vacio">
            <h3>Todavía no publicaste servicios</h3>
            <p>
              Completá el formulario para publicar tu primer servicio.
            </p>
          </div>
        ) : (
          <div className="servicios-tarjetas">
            {servicios.map((servicio) => (
              <article className="servicio-tarjeta" key={servicio.id}>
                <span className="servicio-categoria">
                  {servicio.categoria}
                </span>
                <h3>{servicio.nombre}</h3>
                <p>{servicio.descripcion}</p>

                {servicio.precio && (
                  <p className="servicio-precio">{servicio.precio}</p>
                )}

                <div className="servicio-acciones">
                  <button
                    type="button"
                    className="servicios-boton-secundario"
                    onClick={() => editarServicio(servicio)}
                  >
                    Modificar
                  </button>

                  <button
                    type="button"
                    className="servicios-boton-eliminar"
                    onClick={() => setConfirmarEliminar(servicio.id)}
                  >
                    Eliminar
                  </button>
                </div>

                {confirmarEliminar === servicio.id && (
                  <div className="servicio-confirmacion">
                    <p>¿Querés eliminar este servicio?</p>
                    <button
                      type="button"
                      className="servicios-boton-eliminar"
                      onClick={() => eliminarServicio(servicio.id)}
                    >
                      Sí, eliminar
                    </button>
                    <button
                      type="button"
                      className="servicios-boton-secundario"
                      onClick={() => setConfirmarEliminar(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default MisServicios
