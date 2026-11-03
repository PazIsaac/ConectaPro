import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ErrorApi } from './api'
import { porcentaje } from './formato'
import type { SugerenciaCategoria } from './types'
import './Ia.css'

type Props = {
  onAplicar?: (sugerencia: SugerenciaCategoria) => void
  titulo?: string
  ayuda?: string
}

const ejemplos = [
  'Tengo una pérdida de agua debajo de la pileta',
  'La PlayStation no lee los juegos y el joystick se mueve solo',
  'Quiero pintar dos ambientes y hay humedad en una pared',
]

export default function AsistenteIA({
  onAplicar,
  titulo = 'Contanos qué necesitás y la IA te orienta',
  ayuda = 'Describí el problema con tus palabras. El asistente identifica la categoría más adecuada y te muestra profesionales disponibles.',
}: Props) {
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(false)
  const [sugerencia, setSugerencia] = useState<SugerenciaCategoria | null>(null)
  const [error, setError] = useState('')
  const [modo, setModo] = useState<'modelo' | 'local' | null>(null)
  const navegar = useNavigate()

  useEffect(() => {
    api.ia
      .estado()
      .then((respuesta) => setModo(respuesta.modo))
      .catch(() => setModo(null))
  }, [])

  async function analizar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSugerencia(null)

    if (texto.trim().length < 10) {
      setError('Agregá un poco más de detalle para que la sugerencia sea útil.')
      return
    }

    setCargando(true)
    try {
      const respuesta = await api.ia.sugerirCategoria(texto.trim())
      setSugerencia(respuesta.sugerencia)
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : 'No pudimos analizar la descripción.')
    } finally {
      setCargando(false)
    }
  }

  function aplicar(categoriaId: number | null) {
    if (!categoriaId) return
    if (onAplicar && sugerencia) {
      onAplicar(sugerencia)
      return
    }
    navegar(`/profesionales?categoriaId=${categoriaId}`)
  }

  return (
    <section className="asistente-ia" aria-labelledby="titulo-asistente-ia">
      <div className="asistente-ia-encabezado">
        <div>
          <span className="asistente-ia-kicker">
            <span aria-hidden="true">✦</span> Asistente inteligente
          </span>
          <h2 id="titulo-asistente-ia">{titulo}</h2>
          <p>{ayuda}</p>
        </div>
        <span className={`ia-modo ${modo === 'modelo' ? 'ia-modo-modelo' : ''}`}>
          {modo === 'modelo'
            ? 'Modelo de lenguaje conectado'
            : modo === 'local'
              ? 'Motor local de IA'
              : 'IA de ConectaPro'}
        </span>
      </div>

      <form className="asistente-ia-form" onSubmit={analizar}>
        <label htmlFor="ia-descripcion" className="sr-only">
          Descripción de la necesidad
        </label>
        <textarea
          id="ia-descripcion"
          value={texto}
          onChange={(event) => {
            setTexto(event.target.value)
            setError('')
          }}
          rows={3}
          maxLength={1000}
          placeholder="Ej.: se me rompió la canilla de la cocina y pierde agua..."
        />
        <div className="asistente-ia-pie">
          <div className="asistente-ia-ejemplos">
            {ejemplos.map((ejemplo) => (
              <button
                key={ejemplo}
                type="button"
                className="ia-ejemplo"
                onClick={() => {
                  setTexto(ejemplo)
                  setError('')
                }}
              >
                {ejemplo}
              </button>
            ))}
          </div>
          <button className="button button-primary ia-boton" type="submit" disabled={cargando}>
            {cargando ? 'Analizando...' : 'Sugerir categoría'}
          </button>
        </div>
      </form>

      {error && (
        <p className="ia-error" role="alert">
          {error}
        </p>
      )}

      {sugerencia && (
        <div className="ia-resultado" role="status">
          <div className="ia-resultado-principal">
            <div>
              <span className="ia-resultado-etiqueta">Categoría sugerida</span>
              <h3>{sugerencia.categoria ?? 'Necesitamos más detalles'}</h3>
              <p>{sugerencia.explicacion}</p>
            </div>
            {sugerencia.categoria && (
              <div className="ia-confianza">
                <strong>{porcentaje(sugerencia.confianza)}</strong>
                <span>confianza</span>
              </div>
            )}
          </div>

          {sugerencia.palabrasClave.length > 0 && (
            <div className="ia-palabras">
              {sugerencia.palabrasClave.map((palabra) => (
                <span key={palabra}>{palabra}</span>
              ))}
            </div>
          )}

          {sugerencia.categoriaId && (
            <div className="ia-resultado-acciones">
              <button
                type="button"
                className="button button-primary"
                onClick={() => aplicar(sugerencia.categoriaId)}
              >
                Ver profesionales de {sugerencia.categoria}
              </button>
              {typeof sugerencia.profesionalesDisponibles === 'number' && (
                <span className="ia-disponibles">
                  {sugerencia.profesionalesDisponibles}{' '}
                  {sugerencia.profesionalesDisponibles === 1
                    ? 'profesional disponible'
                    : 'profesionales disponibles'}
                </span>
              )}
            </div>
          )}

          {sugerencia.alternativas.length > 0 && (
            <div className="ia-alternativas">
              <span>También podría ser:</span>
              {sugerencia.alternativas.map((alternativa) => (
                <button
                  key={alternativa.categoria}
                  type="button"
                  onClick={() => aplicar(alternativa.categoriaId)}
                  disabled={!alternativa.categoriaId}
                >
                  {alternativa.categoria}
                </button>
              ))}
            </div>
          )}

          <p className="ia-resultado-pie">
            {sugerencia.proveedor === 'modelo'
              ? `Sugerencia generada con el modelo ${sugerencia.modelo ?? 'de lenguaje'} y validada contra las categorías de ConectaPro.`
              : 'Sugerencia generada por el motor local de clasificación semántica de ConectaPro.'}
          </p>
        </div>
      )}
    </section>
  )
}
