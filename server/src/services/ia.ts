import { config } from '../config'

export type CategoriaIA = {
  id: number
  nombre: string
  descripcion: string
}

export type AlternativaCategoria = {
  categoriaId: number | null
  categoria: string
  confianza: number
}

export type SugerenciaCategoria = {
  categoriaId: number | null
  categoria: string | null
  confianza: number
  explicacion: string
  palabrasClave: string[]
  alternativas: AlternativaCategoria[]
  proveedor: 'modelo' | 'local'
  modelo: string | null
}

export type DescripcionMejorada = {
  descripcion: string
  consejos: string[]
  proveedor: 'modelo' | 'local'
  modelo: string | null
}

const PALABRAS: Record<string, string[]> = {
  Electricidad: [
    'electricidad', 'eléctric', 'electric', 'cable', 'cableado', 'enchufe', 'tomacorriente',
    'toma corriente', 'luz', 'luces', 'lámpara', 'lampara', 'cortocircuito', 'disyuntor',
    'interruptor', 'tablero', 'térmica', 'termica', 'instalación eléctrica',
  ],
  Plomería: [
    'plomería', 'plomeria', 'plomero', 'plomera', 'agua', 'caño', 'cano', 'canilla', 'grifo',
    'pérdida', 'perdida', 'fuga', 'inodoro', 'baño', 'bano', 'tubería', 'tuberia', 'desagüe',
    'desague', 'termotanque', 'pileta', 'lavatorio', 'ducha', 'cloaca',
  ],
  Albañilería: [
    'albañilería', 'albanileria', 'albañil', 'albanil', 'pared', 'muro', 'cemento', 'ladrillo',
    'revoque', 'construcción', 'construccion', 'obra', 'piso', 'contrapiso', 'techo', 'ampliación',
    'ampliacion', 'hueco', 'durlock',
  ],
  Pintura: [
    'pintura', 'pintar', 'pintor', 'pintora', 'látex', 'latex', 'barniz', 'esmalte', 'color',
    'rodillo', 'pincel', 'humedad', 'enduido', 'yeso', 'impermeabilizante',
  ],
  Informática: [
    'informática', 'informatica', 'computadora', 'computador', 'pc', 'notebook', 'laptop',
    'software', 'windows', 'formatear', 'virus', 'antivirus', 'red', 'wifi', 'internet',
    'impresora', 'pantalla', 'teclado', 'programación', 'programacion', 'sistema', 'datos',
  ],
  Cerrajería: [
    'cerrajería', 'cerrajeria', 'cerrajero', 'cerradura', 'llave', 'puerta', 'candado',
    'apertura', 'cerrar', 'copiar llave', 'seguridad', 'barral', 'picaporte',
  ],
  Jardinería: [
    'jardinería', 'jardineria', 'jardín', 'jardin', 'césped', 'cesped', 'pasto', 'poda',
    'planta', 'árbol', 'arbol', 'riego', 'jardinero', 'jardinera', 'maleza', 'huerta',
  ],
  'Reparación de electrodomésticos': [
    'electrodoméstico', 'electrodomestico', 'heladera', 'refrigerador', 'lavarropas',
    'lavadora', 'secarropas', 'microondas', 'horno', 'lavavajillas', 'freezer', 'televisor',
    'televisión', 'television', 'reparación', 'reparacion', 'no enciende', 'no funciona',
  ],
  Nerd: [
    'nerd', 'consola', 'playstation', 'xbox', 'nintendo', 'switch', 'joystick', 'control',
    'mando', 'arcade', 'videojuego', 'videojuegos', 'gamer', 'gaming', 'pixel', 'pixels',
    'máquina arcade', 'maquina arcade', 'retro', 'emulador', 'pc gamer',
  ],
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sugerirLocal(descripcion: string, categorias: CategoriaIA[]): SugerenciaCategoria {
  const texto = normalizar(descripcion)
  const puntajes = new Map<string, { puntaje: number; encontradas: Set<string> }>()

  for (const categoria of categorias) {
    const palabras = PALABRAS[categoria.nombre] ?? []
    let puntaje = 0
    const encontradas = new Set<string>()

    const nombreNormalizado = normalizar(categoria.nombre)
    if (nombreNormalizado && texto.includes(nombreNormalizado)) {
      puntaje += 5
      encontradas.add(categoria.nombre)
    }

    for (const palabra of palabras) {
      const palabraNormalizada = normalizar(palabra)
      if (!palabraNormalizada) continue
      const coincidencias = texto.split(' ').filter((token) => token === palabraNormalizada).length
      const incluyeFrase = palabraNormalizada.includes(' ') && texto.includes(palabraNormalizada)
      if (coincidencias > 0 || incluyeFrase) {
        puntaje += incluyeFrase ? 4 : 2 + Math.min(coincidencias - 1, 2)
        encontradas.add(palabra)
      }
    }

    if (puntaje > 0) puntajes.set(categoria.nombre, { puntaje, encontradas })
  }

  const ordenadas = [...puntajes.entries()].sort((a, b) => b[1].puntaje - a[1].puntaje)
  const primera = ordenadas[0]

  if (!primera) {
    return {
      categoriaId: null,
      categoria: null,
      confianza: 0,
      explicacion:
        'No pudimos identificar una categoría con esa descripción. Agregá qué objeto o instalación necesita reparación y qué ocurre.',
      palabrasClave: [],
      alternativas: [],
      proveedor: 'local',
      modelo: null,
    }
  }

  const [nombre, datos] = primera
  const categoria = categorias.find((item) => item.nombre === nombre)
  const confianza = Math.min(0.96, 0.52 + datos.puntaje * 0.055)
  const alternativas = ordenadas.slice(1, 4).map(([alternativa, info]) => {
    const encontrada = categorias.find((item) => item.nombre === alternativa)
    return {
      categoriaId: encontrada?.id ?? null,
      categoria: alternativa,
      confianza: Math.max(0.2, Math.min(0.7, 0.35 + info.puntaje * 0.04)),
    }
  })

  return {
    categoriaId: categoria?.id ?? null,
    categoria: nombre,
    confianza: Number(confianza.toFixed(2)),
    explicacion: `La descripción contiene referencias a ${[...datos.encontradas]
      .slice(0, 4)
      .join(', ')}, por eso la categoría más adecuada es ${nombre}.`,
    palabrasClave: [...datos.encontradas].slice(0, 8),
    alternativas,
    proveedor: 'local',
    modelo: null,
  }
}

type RespuestaModelo = {
  categoria?: string | null
  confianza?: number
  explicacion?: string
  palabrasClave?: string[]
}

function extraerJson(texto: string): unknown {
  const limpio = texto.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const inicio = limpio.indexOf('{')
  const fin = limpio.lastIndexOf('}')
  if (inicio === -1 || fin === -1) throw new Error('La respuesta del modelo no es JSON.')
  return JSON.parse(limpio.slice(inicio, fin + 1))
}

async function llamarModelo(
  system: string,
  user: string,
): Promise<{ contenido: unknown; modelo: string }> {
  const respuesta = await fetch(`${config.ia.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.ia.apiKey}`,
    },
    body: JSON.stringify({
      model: config.ia.modelo,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    signal: AbortSignal.timeout(config.ia.timeoutMs),
  })

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => '')
    throw new Error(`El proveedor de IA respondió ${respuesta.status}. ${detalle.slice(0, 200)}`)
  }

  const datos = (await respuesta.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const contenido = datos.choices?.[0]?.message?.content
  if (!contenido) throw new Error('El proveedor de IA no devolvió contenido.')
  return { contenido: extraerJson(contenido), modelo: config.ia.modelo }
}

export function iaConfigurada(): boolean {
  return Boolean(config.ia.apiKey)
}

export async function sugerirCategoria(
  descripcion: string,
  categorias: CategoriaIA[],
): Promise<SugerenciaCategoria> {
  if (!iaConfigurada() || categorias.length === 0) {
    return sugerirLocal(descripcion, categorias)
  }

  try {
    const { contenido, modelo } = await llamarModelo(
      `Sos el asistente de ConectaPro, una plataforma de servicios para el hogar.
Clasificá la necesidad del usuario en UNA de estas categorías: ${categorias
        .map((categoria) => categoria.nombre)
        .join(', ')}.
Respondé únicamente un objeto JSON con las claves:
{"categoria":"nombre exacto o null","confianza":0.0,"explicacion":"texto breve","palabrasClave":["..."]}.
No inventes categorías. Si la descripción es insuficiente, usá null y confianza 0.`,
      `Descripción del usuario: """${descripcion}"""`,
    )

    const respuesta = contenido as RespuestaModelo
    const nombre = respuesta.categoria?.trim()
    const categoria = categorias.find(
      (item) => normalizar(item.nombre) === normalizar(nombre ?? ''),
    )

    if (!categoria) return sugerirLocal(descripcion, categorias)

    const alternativas = categorias
      .filter((item) => item.id !== categoria.id)
      .slice(0, 3)
      .map((item) => ({
        categoriaId: item.id,
        categoria: item.nombre,
        confianza: 0.25,
      }))

    return {
      categoriaId: categoria.id,
      categoria: categoria.nombre,
      confianza: Math.max(0, Math.min(1, Number(respuesta.confianza) || 0.75)),
      explicacion:
        respuesta.explicacion?.trim() ||
        `La descripción se relaciona con la categoría ${categoria.nombre}.`,
      palabrasClave: Array.isArray(respuesta.palabrasClave)
        ? respuesta.palabrasClave.filter((item): item is string => typeof item === 'string').slice(0, 8)
        : [],
      alternativas,
      proveedor: 'modelo',
      modelo,
    }
  } catch (error) {
    console.warn('[ia] Fallback local por error del proveedor:', (error as Error).message)
    return sugerirLocal(descripcion, categorias)
  }
}

function mejorarLocal(texto: string, categoria?: string): DescripcionMejorada {
  const limpio = texto.replace(/\s+/g, ' ').trim().replace(/[. ]+$/, '')
  const base = limpio.charAt(0).toUpperCase() + limpio.slice(1)
  const area = categoria ? ` de ${categoria.toLowerCase()}` : ''

  return {
    descripcion: `${base}. Ofrezco un servicio${area} con diagnóstico previo, presupuesto claro y coordinación de fechas según tu disponibilidad. Trabajo con herramientas y materiales adecuados, cuido el espacio y explico cada paso para que sepas qué se está haciendo. Al finalizar, revisamos juntos el resultado y te dejo recomendaciones de uso y mantenimiento.`,
    consejos: [
      'Indicá qué incluye el servicio y qué no incluye.',
      'Mencioná tu zona de cobertura y los horarios de atención.',
      'Agregá un precio orientativo o aclarÁ que el presupuesto se coordina.',
      'Cerrá con una invitación clara a solicitar el servicio.',
    ],
    proveedor: 'local',
    modelo: null,
  }
}

export async function mejorarDescripcion(
  texto: string,
  categoria?: string,
): Promise<DescripcionMejorada> {
  if (!iaConfigurada()) return mejorarLocal(texto, categoria)

  try {
    const { contenido, modelo } = await llamarModelo(
      `Sos redactor de perfiles profesionales de ConectaPro. Mejorá la descripción de un servicio
en español rioplatense, con tono profesional y cercano, entre 60 y 120 palabras.
No inventes certificaciones, precios ni años de experiencia que no aparezcan.
Respondé únicamente JSON con las claves:
{"descripcion":"texto final","consejos":["hasta 4 recomendaciones breves"]}.`,
      `Categoría: ${categoria ?? 'sin especificar'}\nDescripción original: """${texto}"""`,
    )

    const respuesta = contenido as { descripcion?: string; consejos?: string[] }
    if (!respuesta.descripcion?.trim() || respuesta.descripcion.trim().length < 40) {
      return mejorarLocal(texto, categoria)
    }

    return {
      descripcion: respuesta.descripcion.trim(),
      consejos: Array.isArray(respuesta.consejos)
        ? respuesta.consejos.filter((item): item is string => typeof item === 'string').slice(0, 4)
        : [],
      proveedor: 'modelo',
      modelo,
    }
  } catch (error) {
    console.warn('[ia] Fallback local al mejorar descripción:', (error as Error).message)
    return mejorarLocal(texto, categoria)
  }
}
