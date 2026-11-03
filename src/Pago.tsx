import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { detectBrand, formatCardNumber, formatCvc, formatExpiry, type Brand, type FocusedField } from 'crd-ui'
import { Card } from 'crd-ui/react'
import 'crd-ui/styles.css'
import { api, ErrorApi } from './api'
import { useAuth } from './contexto'
import { formatearFecha, formatearMoneda } from './formato'
import type { Pago as PagoRegistrado, Solicitud } from './types'
import './Panel.css'
import './Pago.css'

type CampoPago = 'numero' | 'titular' | 'vencimiento' | 'cvc' | 'monto'
type Errores = Partial<Record<CampoPago, string>>

const nombresMarca: Record<Brand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  dinersclub: 'Diners Club',
  jcb: 'JCB',
  unionpay: 'UnionPay',
  maestro: 'Maestro',
  elo: 'Elo',
  hipercard: 'Hipercard',
}

const etiquetasPago: Record<PagoRegistrado['estado'], string> = {
  aprobado: 'Aprobado',
  pendiente: 'Pendiente',
  rechazado: 'Rechazado',
}

function pasaLuhn(numero: string): boolean {
  let suma = 0
  let doble = false
  for (let indice = numero.length - 1; indice >= 0; indice -= 1) {
    let digito = Number(numero[indice])
    if (doble) {
      digito *= 2
      if (digito > 9) digito -= 9
    }
    suma += digito
    doble = !doble
  }
  return suma % 10 === 0
}

function tarjetaVencida(mes: number, anio: number): boolean {
  const hoy = new Date()
  return anio < hoy.getFullYear() || (anio === hoy.getFullYear() && mes < hoy.getMonth() + 1)
}

function esMarca(valor: string): valor is Brand {
  return Object.prototype.hasOwnProperty.call(nombresMarca, valor)
}

export default function Pago() {
  const { solicitudId } = useParams()
  const { usuario } = useAuth()
  const idSolicitud = Number(solicitudId)

  const [solicitud, setSolicitud] = useState<Solicitud | null>(null)
  const [pago, setPago] = useState<PagoRegistrado | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')

  const [numero, setNumero] = useState('')
  const [titular, setTitular] = useState(usuario?.nombre ?? '')
  const [vencimiento, setVencimiento] = useState('')
  const [cvc, setCvc] = useState('')
  const [monto, setMonto] = useState('')
  const [enfocado, setEnfocado] = useState<FocusedField | null>(null)
  const [errores, setErrores] = useState<Errores>({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const marca = detectBrand(numero)

  useEffect(() => {
    if (!Number.isInteger(idSolicitud) || idSolicitud <= 0) {
      setErrorCarga('La solicitud indicada no es válida.')
      setCargando(false)
      return
    }

    let activo = true
    setCargando(true)
    setErrorCarga('')

    Promise.all([api.solicitudes.mias(), api.pagos.mias()])
      .then(([respuestaSolicitudes, respuestaPagos]) => {
        if (!activo) return
        const encontrada = respuestaSolicitudes.solicitudes.find(
          (item) => item.id === idSolicitud,
        )
        if (!encontrada) {
          setErrorCarga('No encontramos esta solicitud entre tus servicios.')
          return
        }
        setSolicitud(encontrada)
        setPago(
          respuestaPagos.pagos.find((item) => item.solicitudId === idSolicitud) ?? null,
        )
      })
      .catch((err: Error) => {
        if (activo) {
          setErrorCarga(
            err instanceof ErrorApi ? err.message : 'No pudimos cargar los datos del pago.',
          )
        }
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [idSolicitud])

  function limpiarError(campo: CampoPago) {
    setErrores((actuales) => ({ ...actuales, [campo]: undefined }))
    setError('')
  }

  function usarTarjetaDemo() {
    setNumero('4242 4242 4242 4242')
    setTitular(usuario?.nombre ?? 'Cliente Demo')
    setVencimiento('12/30')
    setCvc('123')
    if (!monto) setMonto('15000')
    setErrores({})
    setError('')
  }

  function validarFormulario(): Errores {
    const nuevos: Errores = {}
    const digitos = numero.replace(/\D/g, '')

    if (digitos.length === 0) {
      nuevos.numero = 'Ingresá el número de la tarjeta.'
    } else if (digitos.length < 13 || digitos.length > 19) {
      nuevos.numero = 'El número debe tener entre 13 y 19 dígitos.'
    } else if (!pasaLuhn(digitos)) {
      nuevos.numero = 'El número de tarjeta no es válido. Revisalo e intentá de nuevo.'
    }

    if (titular.trim().length < 3) {
      nuevos.titular = 'Ingresá el nombre y apellido del titular.'
    }

    if (!/^\d{2}\/\d{2}$/.test(vencimiento)) {
      nuevos.vencimiento = 'Usá el formato MM/AA.'
    } else {
      const [textoMes, textoAnio] = vencimiento.split('/')
      const mes = Number(textoMes)
      const anio = 2000 + Number(textoAnio)
      if (mes < 1 || mes > 12) {
        nuevos.vencimiento = 'El mes debe estar entre 01 y 12.'
      } else if (tarjetaVencida(mes, anio)) {
        nuevos.vencimiento = 'La tarjeta está vencida.'
      }
    }

    const longitudEsperada = marca === 'amex' ? 4 : 3
    if (cvc.length !== longitudEsperada) {
      nuevos.cvc =
        marca === 'amex'
          ? 'El código de American Express tiene 4 dígitos.'
          : 'El código de seguridad tiene 3 dígitos.'
    }

    const importe = Number(monto)
    if (!Number.isFinite(importe) || importe <= 0) {
      nuevos.monto = 'Ingresá el importe acordado con el profesional.'
    } else if (importe > 10_000_000) {
      nuevos.monto = 'El importe máximo permitido es $10.000.000.'
    }

    return nuevos
  }

  async function enviarPago(evento: React.FormEvent) {
    evento.preventDefault()
    if (!solicitud || enviando) return

    const nuevosErrores = validarFormulario()
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      setError('Revisá los datos marcados antes de continuar.')
      return
    }

    const digitos = numero.replace(/\D/g, '')
    const [textoMes, textoAnio] = vencimiento.split('/')

    setEnviando(true)
    setError('')

    try {
      const respuesta = await api.pagos.crear({
        solicitudId: solicitud.id,
        monto: Number(monto),
        tokenPago: `demo_${crypto.randomUUID()}`,
        marca: marca ?? 'otra',
        ultimos4: digitos.slice(-4),
        titular: titular.trim(),
        vencimientoMes: Number(textoMes),
        vencimientoAnio: 2000 + Number(textoAnio),
      })
      setPago(respuesta.pago)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : 'No pudimos registrar el pago.')
      if (err instanceof ErrorApi && err.estado === 409) {
        try {
          const { pagos } = await api.pagos.mias()
          setPago(pagos.find((item) => item.solicitudId === solicitud.id) ?? null)
        } catch {
          // Si falla la recarga, se mantiene el mensaje de error original.
        }
      }
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) {
    return (
      <main className="panel-page pago-page">
        <section className="panel-cargando" aria-busy="true">
          <span className="cargando-giro" aria-hidden="true" />
          <p>Cargando los datos del pago...</p>
        </section>
      </main>
    )
  }

  if (errorCarga || !solicitud) {
    return (
      <main className="panel-page pago-page">
        <section className="pago-estado">
          <span className="pago-estado-icono" aria-hidden="true">
            !
          </span>
          <h1>No pudimos abrir el pago</h1>
          <p>{errorCarga || 'La solicitud no existe o no tenés acceso a ella.'}</p>
          <Link className="panel-boton-principal" to="/solicitudes">
            Volver a mis solicitudes
          </Link>
        </section>
      </main>
    )
  }

  const pagable = solicitud.estado === 'aceptada' || solicitud.estado === 'finalizada'

  return (
    <main className="panel-page pago-page">
      <section className="panel-hero">
        <div className="panel-hero-texto">
          <span className="panel-kicker">PAGO DEL SERVICIO</span>
          <h1>{pago ? 'Pago confirmado' : 'Pagá tu servicio'}</h1>
          <p>
            {pago
              ? 'Guardamos el comprobante del pago. Podés consultarlo cuando quieras desde Mis solicitudes.'
              : 'Ingresá los datos de tu tarjeta para abonar el importe acordado con el profesional.'}
          </p>
        </div>
        <Link className="panel-boton-secundario" to="/solicitudes">
          ← Mis solicitudes
        </Link>
      </section>

      <section className="pago-contenido">
        <aside className="pago-resumen" aria-label="Resumen de la solicitud">
          <span className="panel-kicker">SOLICITUD #{solicitud.id}</span>
          <h2>{solicitud.profesionalNombre}</h2>
          <p>{solicitud.servicioNombre ?? 'Consulta general'}</p>
          <div className="pago-resumen-datos">
            <div>
              <span>Estado</span>
              <strong>{solicitud.estado}</strong>
            </div>
            <div>
              <span>Enviada</span>
              <strong>{formatearFecha(solicitud.fechaCreacion)}</strong>
            </div>
          </div>
          {solicitud.mensaje && <blockquote>{solicitud.mensaje}</blockquote>}
        </aside>

        {pago ? (
          <section className="pago-recibo" aria-labelledby="pago-recibo-titulo">
            <div className="pago-recibo-encabezado">
              <span className="pago-recibo-check" aria-hidden="true">
                ✓
              </span>
              <div>
                <span className="panel-kicker">TRANSACCIÓN {pago.referencia}</span>
                <h2 id="pago-recibo-titulo">Pago aprobado</h2>
                <p>
                  Registrado el {formatearFecha(pago.fechaCreacion)} · Estado:{' '}
                  {etiquetasPago[pago.estado]}
                </p>
              </div>
            </div>

            <div className="pago-recibo-importe">
              <span>Importe abonado</span>
              <strong>{formatearMoneda(pago.monto, pago.moneda)}</strong>
            </div>

            <div className="pago-recibo-tarjeta">
              <Card
                layout="display"
                brand={esMarca(pago.marca) ? pago.marca : null}
                last4={pago.ultimos4}
                expiry={`${String(pago.vencimientoMes).padStart(2, '0')}/${String(
                  pago.vencimientoAnio,
                ).slice(-2)}`}
                name={pago.titular}
                variant="graphite"
              />
            </div>

            <dl className="pago-recibo-detalle">
              <div>
                <dt>Profesional</dt>
                <dd>{pago.profesionalNombre}</dd>
              </div>
              <div>
                <dt>Servicio</dt>
                <dd>{pago.servicioNombre ?? 'Consulta general'}</dd>
              </div>
              <div>
                <dt>Tarjeta</dt>
                <dd>
                  {(esMarca(pago.marca) ? nombresMarca[pago.marca] : 'Tarjeta') + ' •••• ' + pago.ultimos4}
                </dd>
              </div>
              <div>
                <dt>Titular</dt>
                <dd>{pago.titular}</dd>
              </div>
            </dl>

            <div className="pago-recibo-acciones">
              <Link className="panel-boton-principal" to="/solicitudes">
                Volver a mis solicitudes
              </Link>
              <Link className="panel-boton-secundario" to="/profesionales">
                Explorar profesionales
              </Link>
            </div>

            <p className="pago-nota-privacidad">
              Por seguridad, no guardamos el número completo de la tarjeta ni el código de
              seguridad. Este comprobante es válido como registro del pago en la plataforma.
            </p>
          </section>
        ) : !pagable ? (
          <section className="pago-estado">
            <span className="pago-estado-icono" aria-hidden="true">
              ⏳
            </span>
            <h2>Esta solicitud todavía no se puede pagar</h2>
            <p>
              El profesional debe aceptar la solicitud antes de que puedas abonar. Estado actual:{' '}
              <strong>{solicitud.estado}</strong>.
            </p>
            <Link className="panel-boton-principal" to="/solicitudes">
              Volver a mis solicitudes
            </Link>
          </section>
        ) : (
          <div className="pago-checkout">
            <div className="pago-preview">
              <Card
                number={numero}
                name={titular}
                expiry={vencimiento}
                cvc={cvc}
                focused={enfocado}
                variant="gradient"
                tilt
                placeholders={{ name: 'NOMBRE DEL TITULAR' }}
                locale={{ validThru: 'válida hasta' }}
              />
              <div className="pago-preview-pie">
                <span className={marca ? 'pago-marca-activa' : 'pago-marca-vacia'}>
                  {marca ? nombresMarca[marca] : 'Marca sin detectar'}
                </span>
                <span>🔒 Datos protegidos</span>
              </div>
              <p className="pago-demo-aviso">
                Entorno de demostración: el pago se valida y registra localmente, pero no se
                realiza un cobro real.
              </p>
              <button className="pago-boton-demo" type="button" onClick={usarTarjetaDemo}>
                Completar con tarjeta de prueba
              </button>
            </div>

            <form className="pago-form" onSubmit={enviarPago} noValidate>
              <div className="pago-campo">
                <label htmlFor="pago-numero">Número de tarjeta</label>
                <div
                  className={
                    errores.numero ? 'pago-input-envoltura pago-input-error' : 'pago-input-envoltura'
                  }
                >
                  <input
                    id="pago-numero"
                    name="numeroTarjeta"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="0000 0000 0000 0000"
                    value={numero}
                    onChange={(evento) => {
                      setNumero(formatCardNumber(evento.target.value, detectBrand(evento.target.value)))
                      limpiarError('numero')
                    }}
                    onFocus={() => setEnfocado('number')}
                    onBlur={() => setEnfocado(null)}
                    aria-invalid={Boolean(errores.numero)}
                    aria-describedby={errores.numero ? 'pago-error-numero' : undefined}
                  />
                  {marca && <span className="pago-marca-tag">{nombresMarca[marca]}</span>}
                </div>
                {errores.numero && (
                  <p className="pago-error-campo" id="pago-error-numero">
                    {errores.numero}
                  </p>
                )}
              </div>

              <div className="pago-campo">
                <label htmlFor="pago-titular">Titular de la tarjeta</label>
                <input
                  id="pago-titular"
                  name="titular"
                  autoComplete="cc-name"
                  placeholder="Como figura en la tarjeta"
                  value={titular}
                  onChange={(evento) => {
                    setTitular(evento.target.value)
                    limpiarError('titular')
                  }}
                  onFocus={() => setEnfocado('name')}
                  onBlur={() => setEnfocado(null)}
                  aria-invalid={Boolean(errores.titular)}
                />
                {errores.titular && <p className="pago-error-campo">{errores.titular}</p>}
              </div>

              <div className="pago-fila">
                <div className="pago-campo">
                  <label htmlFor="pago-vencimiento">Vencimiento</label>
                  <input
                    id="pago-vencimiento"
                    name="vencimiento"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/AA"
                    maxLength={5}
                    value={vencimiento}
                    onChange={(evento) => {
                      setVencimiento(formatExpiry(evento.target.value))
                      limpiarError('vencimiento')
                    }}
                    onFocus={() => setEnfocado('expiry')}
                    onBlur={() => setEnfocado(null)}
                    aria-invalid={Boolean(errores.vencimiento)}
                  />
                  {errores.vencimiento && (
                    <p className="pago-error-campo">{errores.vencimiento}</p>
                  )}
                </div>

                <div className="pago-campo">
                  <label htmlFor="pago-cvc">Código de seguridad</label>
                  <input
                    id="pago-cvc"
                    name="cvc"
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder={marca === 'amex' ? '4 dígitos' : '3 dígitos'}
                    maxLength={4}
                    value={cvc}
                    onChange={(evento) => {
                      setCvc(formatCvc(evento.target.value, marca))
                      limpiarError('cvc')
                    }}
                    onFocus={() => setEnfocado('cvc')}
                    onBlur={() => setEnfocado(null)}
                    aria-invalid={Boolean(errores.cvc)}
                  />
                  {errores.cvc && <p className="pago-error-campo">{errores.cvc}</p>}
                </div>
              </div>

              <div className="pago-campo">
                <label htmlFor="pago-monto">Importe acordado</label>
                <div className="pago-input-dinero">
                  <span aria-hidden="true">$</span>
                  <input
                    id="pago-monto"
                    name="monto"
                    type="number"
                    inputMode="decimal"
                    min={1}
                    max={10_000_000}
                    step="0.01"
                    placeholder="15000"
                    value={monto}
                    onChange={(evento) => {
                      setMonto(evento.target.value)
                      limpiarError('monto')
                    }}
                    aria-invalid={Boolean(errores.monto)}
                  />
                </div>
                <p className="pago-ayuda">
                  Ingresá el monto que acordaste con {solicitud.profesionalNombre}.
                </p>
                {errores.monto && <p className="pago-error-campo">{errores.monto}</p>}
              </div>

              {error && (
                <div className="pago-alerta" role="alert">
                  <p>{error}</p>
                </div>
              )}

              <button className="pago-boton-pagar" type="submit" disabled={enviando}>
                {enviando
                  ? 'Procesando pago...'
                  : `Pagar ${monto ? formatearMoneda(Number(monto)) : ''}`.trim()}
              </button>

              <p className="pago-nota-privacidad">
                Al confirmar, se registra el pago en ConectaPro. No almacenamos el número completo
                ni el CVV de tu tarjeta.
              </p>
            </form>
          </div>
        )}
      </section>
    </main>
  )
}
