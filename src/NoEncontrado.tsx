import { Link } from 'react-router-dom'

export default function NoEncontrado() {
  return (
    <main className="estado-pagina">
      <span className="estado-icono" aria-hidden="true">
        404
      </span>
      <h1>No encontramos esta página</h1>
      <p>
        La dirección que buscás no existe o cambió de lugar. Podés volver al inicio o explorar los
        profesionales disponibles.
      </p>
      <div className="estado-acciones">
        <Link className="button button-primary" to="/">
          Volver al inicio
        </Link>
        <Link className="button button-outline" to="/profesionales">
          Explorar profesionales
        </Link>
      </div>
    </main>
  )
}
