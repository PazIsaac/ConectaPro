# ConectaPro

Plataforma full stack que conecta clientes con profesionales independientes de oficios y servicios. Permite explorar profesionales, filtrar por categoría, zona y disponibilidad, publicar servicios, enviar solicitudes, pagar con tarjeta y dejar reseñas. Incluye un asistente de inteligencia artificial que sugiere la categoría adecuada a partir de una descripción en lenguaje natural.

**Stack:** React + TypeScript (Vite) · Node.js + TypeScript (Express) · SQL Server · JWT · Zod · [`crd-ui`](https://github.com/JuandaGarcia/crd-ui)

> Documentación funcional y técnica completa: [`docs/Documentacion-ConectaPro.md`](docs/Documentacion-ConectaPro.md)

---

## Índice

1. [Requisitos](#requisitos)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Puesta en marcha rápida](#puesta-en-marcha-rápida)
4. [Cargar la base de datos](#cargar-la-base-de-datos)
5. [Variables de entorno](#variables-de-entorno)
6. [Cuentas de demostración](#cuentas-de-demostración)
7. [Scripts disponibles](#scripts-disponibles)
8. [Pruebas y validaciones](#pruebas-y-validaciones)
9. [Restricciones del diseño](#restricciones-del-diseño)
10. [Inteligencia artificial](#inteligencia-artificial)
11. [Pagos con tarjeta](#pagos-con-tarjeta)
12. [Compilar para producción](#compilar-para-producción)
13. [Solución de problemas](#solución-de-problemas)
14. [Seguridad](#seguridad)

---

## Requisitos

Antes de empezar, instalá:

| Herramienta | Versión recomendada | Para qué se usa |
| --- | --- | --- |
| [Node.js](https://nodejs.org/) | 20 o 22 (LTS) | Ejecutar el frontend y la API |
| npm | Incluido con Node.js | Instalar dependencias |
| [SQL Server Express](https://www.microsoft.com/sql-server/sql-server-downloads) | 2019 o superior | Base de datos |
| [SQL Server Management Studio (SSMS)](https://learn.microsoft.com/sql-server/ssms/download-sql-server-management-studio-ssms) | Opcional | Administrar la base visualmente |
| [Microsoft ODBC Driver 18 for SQL Server](https://learn.microsoft.com/sql-server/connect/odbc/download-odbc-driver-for-sql-server) | 18.x | Conexión con autenticación de Windows |

> En Windows, la instalación típica de SQL Server Express crea la instancia `localhost\SQLEXPRESS`. El proyecto viene configurado para esa instancia, pero podés cambiarla en `server/.env`.

Para verificar que SQL Server esté activo:

```powershell
Get-Service -Name "MSSQL*" | Select-Object Name, Status, DisplayName
```

El servicio `MSSQL$SQLEXPRESS` debe estar en estado `Running`.

Para verificar que el driver ODBC esté instalado:

```powershell
Get-OdbcDriver | Where-Object { $_.Name -like "*SQL Server*" } | Select-Object Name
```

Debe aparecer `ODBC Driver 18 for SQL Server`.

---

## Estructura del proyecto

```text
ConectaPro/
├── database/
│   ├── 01_schema.sql        # Tablas, relaciones, índices y migraciones idempotentes
│   └── 02_seed.sql          # Categorías, usuarios, profesionales, servicios y reseñas demo
├── server/                  # API REST (Node.js + TypeScript)
│   ├── src/
│   │   ├── app.ts           # Aplicación Express
│   │   ├── index.ts         # Conexión a SQL Server y arranque del servidor
│   │   ├── config.ts        # Lectura de variables de entorno
│   │   ├── db.ts            # Pool de conexiones
│   │   ├── routes/          # Endpoints: auth, servicios, solicitudes, reseñas, pagos, IA...
│   │   ├── services/        # Consultas de catálogo, reseñas e IA
│   │   └── scripts/         # setup-db.ts y smoke-test.ts
│   ├── .env.example         # Plantilla de configuración (copiar a .env)
│   └── package.json
├── src/                     # Frontend React + TypeScript
├── package.json             # Scripts generales
└── vite.config.ts           # Proxy /api -> http://localhost:4000
```

---

## Puesta en marcha rápida

Desde la raíz del proyecto, en PowerShell:

```powershell
# 1. Instalar dependencias del frontend y de la API
npm install
npm --prefix server install

# 2. Crear la configuración local de la API
Copy-Item server\.env.example server\.env

# 3. Crear la base, aplicar el esquema y cargar los datos demo
npm run setup:db

# 4. Levantar API y frontend juntos
npm run dev:all
```

Luego abrí:

- Aplicación web: **http://localhost:5173**
- API: **http://localhost:4000/api/salud**

Si `npm run setup:db` termina mostrando un resumen como este, la base quedó lista:

```text
[setup] Listo. Resumen: { Categorias: 9, Profesionales: 9, Servicios: 18, Resenas: 5 }
```

> **Importante:** los scripts de la API leen `server/.env`. Si no existe, se usan valores por defecto de desarrollo, pero conviene crearlo para configurar correctamente la instancia de SQL Server.

---

## Cargar la base de datos

### Opción A: automática (recomendada)

El script `setup-db.ts` hace todo el trabajo:

1. Se conecta a la instancia indicada en `DB_SERVER` usando la base `master`.
2. Crea la base `ConectaPro` si todavía no existe.
3. Ejecuta `database/01_schema.sql` (crea tablas, relaciones e índices que falten).
4. Ejecuta `database/02_seed.sql` (carga categorías, usuarios, profesionales, servicios y reseñas demo).
5. Actualiza la contraseña de todas las cuentas demo según `DEMO_PASSWORD`.

```powershell
npm run setup:db
```

El proceso es **idempotente**: se puede volver a ejecutar sin borrar datos ni duplicar registros. Si cambiás `DEMO_PASSWORD` en `server/.env`, volvé a ejecutarlo para actualizar las cuentas demo.

Configuración mínima en `server/.env` para autenticación de Windows:

```env
DB_SERVER=localhost\SQLEXPRESS
DB_NAME=ConectaPro
DB_TRUSTED=true
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

> `DB_SERVER` debe llevar **una sola barra invertida**: `localhost\SQLEXPRESS`. Si escribís `localhost\\SQLEXPRESS`, la conexión falla con el error *"the requested instance was not available"*.

### Opción B: manual con SSMS o sqlcmd

Si preferís crear la base a mano:

1. Abrí SSMS y conectate a `localhost\SQLEXPRESS` con autenticación de Windows.
2. Creá una base llamada `ConectaPro`.
3. Ejecutá el contenido de `database/01_schema.sql` sobre esa base.
4. Ejecutá el contenido de `database/02_seed.sql` sobre la misma base.

Con `sqlcmd`:

```powershell
sqlcmd -S localhost\SQLEXPRESS -E -Q "IF DB_ID('ConectaPro') IS NULL CREATE DATABASE ConectaPro;"
sqlcmd -S localhost\SQLEXPRESS -E -d ConectaPro -i database\01_schema.sql
sqlcmd -S localhost\SQLEXPRESS -E -d ConectaPro -i database\02_seed.sql
```

### Tablas principales

| Tabla | Contenido |
| --- | --- |
| `Usuarios` | Cuentas de clientes y profesionales, rol y credenciales hasheadas |
| `Profesionales` | Perfil profesional: especialidad, zona, experiencia, disponibilidad |
| `Categorias` | Rubros disponibles (Electricidad, Plomería, Informática, etc.) |
| `Servicios` | Publicaciones de cada profesional, con categoría, precio, zona y disponibilidad |
| `Solicitudes` | Pedidos de clientes a profesionales y su estado |
| `Resenas` | Puntajes y comentarios de clientes |
| `Pagos` | Pagos con tarjeta asociados a una solicitud (sin número completo ni CVV) |
| `IaConsultas` | Registro de consultas realizadas al asistente de IA |

### Reiniciar la base desde cero

Si necesitás descartar todos los datos:

```powershell
sqlcmd -S localhost\SQLEXPRESS -E -Q "ALTER DATABASE ConectaPro SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE ConectaPro;"
npm run setup:db
```

> Cerrá la API antes de borrar la base para liberar las conexiones.

### Usar autenticación SQL en lugar de Windows

Si tu SQL Server no permite autenticación integrada, creá un usuario SQL con permisos sobre la base y configurá:

```env
DB_TRUSTED=false
DB_USER=conectapro_app
DB_PASSWORD=tu_contraseña_segura
```

En este modo la API usa el driver pure-JS `tedious` (incluido en `mssql`), por lo que no necesita el driver ODBC.

---

## Variables de entorno

Archivo: `server/.env` (basado en `server/.env.example`). **Nunca lo subas al repositorio**; ya está incluido en `.gitignore`.

### Servidor

| Variable | Valor por defecto | Descripción |
| --- | --- | --- |
| `PORT` | `4000` | Puerto de la API |
| `NODE_ENV` | `development` | Entorno de ejecución |
| `CORS_ORIGIN` | `http://localhost:5173,...` | Orígenes permitidos, separados por coma |

### Seguridad

| Variable | Valor por defecto | Descripción |
| --- | --- | --- |
| `JWT_SECRET` | Valor de desarrollo | Clave para firmar tokens. **Obligatoria en producción** |
| `JWT_EXPIRA` | `8h` | Duración del token |

### SQL Server

| Variable | Valor por defecto | Descripción |
| --- | --- | --- |
| `DB_SERVER` | `localhost\SQLEXPRESS` | Instancia de SQL Server |
| `DB_NAME` | `ConectaPro` | Nombre de la base |
| `DB_TRUSTED` | `true` | `true` = autenticación de Windows; `false` = usuario y contraseña SQL |
| `DB_USER` | vacío | Usuario SQL (solo si `DB_TRUSTED=false`) |
| `DB_PASSWORD` | vacío | Contraseña SQL (solo si `DB_TRUSTED=false`) |
| `DB_ENCRYPT` | `false` | Cifrar la conexión |
| `DB_TRUST_SERVER_CERTIFICATE` | `true` | Confiar en certificados locales de desarrollo |
| `DB_DRIVER` | `ODBC Driver 18 for SQL Server` | Nombre exacto del driver ODBC |

### Inteligencia artificial

| Variable | Valor por defecto | Descripción |
| --- | --- | --- |
| `IA_API_KEY` | vacío | Clave de un proveedor compatible con OpenAI. Si está vacía, se usa el motor local |
| `IA_BASE_URL` | `https://api.openai.com/v1` | URL base del proveedor |
| `IA_MODEL` | `gpt-4o-mini` | Modelo a utilizar |
| `IA_TIMEOUT_MS` | `20000` | Tiempo máximo de espera |

### Demostración

| Variable | Valor por defecto | Descripción |
| --- | --- | --- |
| `DEMO_PASSWORD` | `Demo1234!` | Contraseña de las cuentas demo. Solo para desarrollo |

---

## Cuentas de demostración

Todas usan la contraseña definida en `DEMO_PASSWORD` (`Demo1234!` por defecto).

| Rol | Correo |
| --- | --- |
| Cliente | `cliente@conectapro.com` |
| Profesional | `martin@conectapro.com` |
| Profesional | `lucia@conectapro.com` |
| Profesional | `santiago@conectapro.com` |
| Profesional | `camila@conectapro.com` |
| Profesional | `nicolas@conectapro.com` |
| Profesional | `valentina@conectapro.com` |
| Profesional | `roberto@conectapro.com` |
| Profesional | `mariela@conectapro.com` |
| Profesional | `diego@conectapro.com` |

También existen `sofia@conectapro.com` y `bruno@conectapro.com` como clientes de demostración.

> Estas cuentas son solo para desarrollo y pruebas. No las uses en producción.

---

## Scripts disponibles

Ejecutados desde la raíz del proyecto:

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Levanta solo el frontend (Vite, puerto 5173) |
| `npm run dev:api` | Levanta solo la API con recarga automática (puerto 4000) |
| `npm run dev:all` | Levanta API y frontend juntos |
| `npm run setup:db` | Crea la base, aplica el esquema y carga los datos demo |
| `npm run test:api` | Ejecuta la prueba de humo contra SQL Server real |
| `npm run build` | Compila el frontend |
| `npm run build:api` | Compila la API a `server/dist` |
| `npm run build:all` | Compila frontend y API |
| `npm start` | Inicia la API compilada y sirve el frontend desde `dist` |
| `npm run lint` | Analiza el código con oxlint |

---

## Pruebas y validaciones

La calidad del proyecto se verifica en tres capas: interfaz, API y base de datos. Además de las pruebas automatizadas, se documentan las reglas de validación y las comprobaciones manuales del flujo completo.

### Estrategia de validación

| Capa | Qué valida | Implementación |
| --- | --- | --- |
| Formulario / UI | Campos obligatorios, formatos, longitud, tarjeta, importe | Componentes React y funciones de `Pago.tsx` |
| API | Esquema del cuerpo, rol, propiedad del recurso, estados y duplicados | Zod, middlewares `autenticar` / `soloRol` y consultas parametrizadas |
| Base de datos | Tipos, longitudes, claves únicas, relaciones y rangos | Restricciones `CHECK`, `UNIQUE`, `FOREIGN KEY` y columnas tipadas de SQL Server |

### Validaciones implementadas

| Módulo | Regla validada | Dónde se valida |
| --- | --- | --- |
| Registro | Nombre entre 2 y 120 caracteres; correo con formato válido y único; contraseña entre 8 y 72; rol `cliente` o `profesional` | UI + Zod + SQL Server |
| Login | Correo con formato válido y contraseña no vacía; credenciales contra hash bcrypt | UI + API |
| Servicios | Nombre entre 5 y 120; descripción entre 20 y 1000; categoría existente y activa; modalidad permitida; precio y zona con máximo de caracteres | Zod + SQL Server |
| Propiedad de servicios | Solo el profesional dueño puede editar, pausar o eliminar; la baja es lógica | Middleware + consulta SQL |
| Solicitudes | Mensaje entre 10 y 1000; profesional existente; solo clientes crean; solo el destinatario cambia el estado; estados permitidos | UI + Zod + SQL Server |
| Reseñas | Puntuación entera de 1 a 5; comentario entre 10 y 1000; una reseña por cliente y profesional; solo el autor elimina | UI + Zod + SQL Server |
| Pagos | Número de 13 a 19 dígitos y válido por Luhn; vencimiento `MM/AA` no vencido; CVC de 3 o 4 dígitos; importe entre $1 y $10.000.000; token `demo_<uuid>` | UI + Zod + API |
| Permisos de pago | Solo clientes; solo el dueño de la solicitud; estado `aceptada` o `finalizada`; un pago por solicitud | Middleware + consulta SQL + `UNIQUE` |
| Datos de tarjeta | No se envía ni persiste el número completo ni el CVV; solo marca, últimos 4, titular y vencimiento | UI + API + esquema SQL |
| Asistente IA | Texto de 10 a 1000 para sugerencias y de 20 a 1500 para mejorar descripciones; límite de frecuencia; sesión para mejorar | UI + Zod + rate limit |
| Filtros | Palabra clave hasta 100 caracteres; categoría, zona y disponibilidad con tipos permitidos | Zod + consulta parametrizada |

### Prueba automática de la API

Con la base ya cargada:

```powershell
npm run test:api
```

La prueba levanta la API en un puerto efímero y verifica **82 comprobaciones** sobre la base real:

- Estado de la API y catálogo de categorías/profesionales.
- Registro, login, roles y rechazo de escalada de privilegios.
- Creación, edición, pausa y eliminación lógica de servicios.
- Permisos: un cliente no publica; un profesional no edita ni borra servicios ajenos.
- Persistencia real en las tablas de SQL Server.
- Filtros por palabra clave, categoría, zona y disponibilidad.
- Visibilidad de servicios pausados en el catálogo público y en el panel del dueño.
- Solicitudes: creación, permisos y cambio de estado.
- Pagos: bloqueo sin sesión o con solicitud ajena, rechazo de solicitudes pendientes y tarjetas vencidas, persistencia del importe y de los últimos 4 dígitos, unicidad por solicitud y ausencia de datos sensibles en la tabla.
- Reseñas: alta, duplicado, borrado por autor y bloqueo para profesionales.
- Funcionamiento del motor local de IA y sus protecciones de sesión.

Al finalizar, limpia los datos temporales que creó.

### Prueba manual sugerida

1. Abrí `http://localhost:5173`.
2. Explorá el catálogo y probá los filtros de categoría, zona y disponibilidad.
3. Iniciá sesión como `martin@conectapro.com` y entrá al panel profesional.
4. Creá un servicio, editá su precio o zona, pausalo y comprobá que desaparece del catálogo público.
5. Volvé a activarlo y eliminálo.
6. Iniciá sesión como `cliente@conectapro.com`, enviá una solicitud y una reseña.
7. Aceptá la solicitud desde la cuenta del profesional y volvé a la cuenta del cliente.
8. Entrá a **Mis solicitudes**, pulsá **Pagar servicio** y probá el checkout con la tarjeta de prueba (ver [Pagos con tarjeta](#pagos-con-tarjeta)).
9. Verificá que un profesional no pueda responder solicitudes ajenas ni borrar reseñas de clientes.

### Resultados de la última ejecución

| Verificación | Resultado |
| --- | --- |
| `npm run test:api` | 82 comprobaciones aprobadas |
| `npm run build` | Frontend compilado sin errores |
| `npm run build:api` | API compilada sin errores |
| Flujo de pago en navegador | Checkout, tarjeta `crd-ui`, comprobante y estado “Pagado” verificados |
| Responsive | Sin desbordes a 390 px y en escritorio |

> `npm run lint` queda pendiente en entornos con Node 22.17 o anterior, porque `oxlint.config.ts` requiere Node ≥ 22.18. No afecta la compilación ni las pruebas de API.

---

## Restricciones del diseño

Las siguientes restricciones condicionaron las decisiones técnicas y funcionales del proyecto. Se documentan para que el alcance y las limitaciones sean explícitos.

### Restricciones tecnológicas

| Restricción | Impacto | Decisión / mitigación |
| --- | --- | --- |
| Stack obligatorio: React + TypeScript, Node.js + TypeScript y SQL Server | No se pueden usar frameworks de backend ni bases NoSQL | Se implementó una SPA React y una API Express separada, con SQL Server como única fuente de datos |
| SQL Server no ofrece RLS equivalente a Supabase | No se puede delegar la autorización a la base por fila | La autorización se valida en la API y se refuerza con `FK`, `UNIQUE` y `CHECK` |
| Entorno local Windows con SQL Server Express | La conexión depende de la instancia y del driver ODBC | Se soportan autenticación de Windows (`msnodesqlv8`) y autenticación SQL (`tedious`) |
| Node.js 20/22 LTS | Algunas herramientas modernas requieren versiones más nuevas | Se documenta la versión recomendada; la configuración `.ts` de oxlint requiere Node ≥ 22.18 |
| Sin servidor de pagos ni pasarela real | No se pueden procesar cobros reales | El módulo funciona en modo demostración y lo informa en la interfaz |
| Dependencia `crd-ui` 0.13.2 | La UI de tarjeta queda sujeta a la API de la librería | Se aisló su uso en `Pago.tsx` y se importan solo los helpers necesarios |
| Sin Docker ni infraestructura cloud | El despliegue es manual y local | Se proveen scripts `setup:db`, `build:all` y variables de entorno documentadas |

### Restricciones funcionales

| Restricción | Impacto | Decisión / mitigación |
| --- | --- | --- |
| Solo existen roles `cliente` y `profesional` | No hay administrador dentro de la aplicación | Las tareas administrativas se hacen con SSMS, `sqlcmd` o scripts |
| Un profesional solo gestiona sus publicaciones | No puede corregir publicaciones ajenas | Se verifica la propiedad en cada operación de escritura |
| Una reseña por cliente y profesional | No se puede editar el historial de reseñas | Restricción `UNIQUE` y mensaje 409 |
| Un pago por solicitud | No se permiten pagos parciales ni repetidos | Restricción `UNIQUE` y validación previa en la API |
| Pago solo para solicitudes aceptadas o finalizadas | No se puede pagar un pedido pendiente o rechazado | Verificación de estado antes del `INSERT` |
| Sin mensajería en tiempo real | La coordinación ocurre fuera de la plataforma | El campo `Mensaje` de la solicitud concentra el contexto inicial |
| Sin recuperación de contraseña por correo | Un usuario que la olvida necesita intervención manual | Se documenta como limitación y se usan cuentas demo |
| Categorías predefinidas | No se crean rubros desde la interfaz | Las 9 categorías se cargan con `02_seed.sql` |
| Sin cobro real ni facturación | El comprobante es solo un registro interno | Se muestra una advertencia explícita en el checkout |

### Restricciones de datos y seguridad

| Restricción | Impacto | Decisión / mitigación |
| --- | --- | --- |
| No se puede almacenar el PAN completo ni el CVV | El comprobante no puede mostrar la tarjeta completa | Solo se guardan marca, últimos 4, titular y vencimiento |
| Los secretos no deben versionarse | La configuración local no se comparte | `.env` está en `.gitignore`; se versiona `.env.example` |
| Las contraseñas no se guardan en texto plano | Se requiere hash y comparación segura | bcryptjs con hash y verificación |
| Los tokens pueden ser manipulados | El rol del token no es confiable | El rol y el estado del usuario se releen desde SQL Server en cada request |
| Los datos de demostración no son reales | No deben usarse en producción | Se documenta que `Demo1234!` es solo para desarrollo |
| Validación de tarjeta en el cliente | Un cliente malicioso podría omitir la UI | La API valida longitud de últimos 4, token, importe, vencimiento y permisos |

### Restricciones de interfaz y experiencia

| Restricción | Impacto | Decisión / mitigación |
| --- | --- | --- |
| Idioma español | No hay internacionalización | Todos los textos y mensajes están en español |
| Diseño responsive sin librería de componentes | Hay que mantener CSS propio | Se usan hojas por página y puntos de corte en 1060, 820, 620 y 390 px |
| Accesibilidad básica | No se realizó una auditoría WCAG completa | Se usan `label`, `aria-invalid`, `aria-busy`, foco visible y textos alternativos |
| Sin modo oscuro | La interfaz usa un único tema claro | Se deja como mejora futura |
| El pago debe ser visualmente claro | La tarjeta no puede parecer un cobro real | Se agregan avisos de demostración y nota de privacidad |

### Restricciones operativas

| Restricción | Impacto | Decisión / mitigación |
| --- | --- | --- |
| Base local con datos demo | Las pruebas deben poder repetirse | `setup:db` es idempotente y el smoke test limpia sus datos |
| Sin CI/CD | Las verificaciones se ejecutan manualmente | Se documentan los comandos de build y test |
| API y frontend en puertos separados en desarrollo | Se necesita proxy para `/api` | `vite.config.ts` redirige a `http://localhost:4000` |
| Una sola instancia de API | No hay escalado horizontal | Suficiente para el alcance académico |
| Sin monitoreo centralizado | Los errores se revisan en consola | Se usa un manejador de errores común y registro de IA en `IaConsultas` |

---

## Inteligencia artificial

El asistente permite:

- **Sugerir una categoría** a partir de una descripción libre.
- **Mejorar la descripción** de un servicio desde el panel profesional.

### Sin clave externa (modo local)

Funciona siempre. Usa clasificación por palabras clave y plantillas locales, no requiere internet ni costos.

### Con un modelo externo (opcional)

Configurá en `server/.env`:

```env
IA_API_KEY=tu_clave
IA_BASE_URL=https://api.openai.com/v1
IA_MODEL=gpt-4o-mini
```

La API informa el modo activo en `GET /api/salud` y en `GET /api/ia/estado`. Si el proveedor externo falla, se usa el motor local como respaldo. Todas las consultas quedan registradas en `IaConsultas`.

---

## Pagos con tarjeta

El módulo de pago permite abonar una solicitud **aceptada** o **finalizada** desde la cuenta del cliente. La interfaz de la tarjeta se construye con [`crd-ui`](https://github.com/JuandaGarcia/crd-ui), instalado como dependencia del frontend.

### Cómo usarlo

1. Iniciá sesión como cliente (`cliente@conectapro.com` / `Demo1234!`).
2. Andá a **Mis solicitudes**. Si la solicitud está aceptada o finalizada, aparece el botón **Pagar servicio**.
3. En la pantalla de pago (`/pago/:solicitudId`) ingresá los datos de la tarjeta o pulsá **Completar con tarjeta de prueba**.
4. Indicá el importe acordado con el profesional y confirmá. El pago queda registrado y se muestra el comprobante con su referencia.

### Tarjeta de prueba

| Campo | Valor |
| --- | --- |
| Número | `4242 4242 4242 4242` |
| Vencimiento | `12/30` |
| Código de seguridad | `123` |

El botón de autocompletado carga esos datos y un importe de ejemplo. La validación del número (Luhn), vencimiento y CVC se hace en el navegador para esta demostración.

> **Modo demostración:** no se contacta a ninguna pasarela ni se realiza un cobro real. La API registra el pago como `aprobado` de forma simulada para poder probar el flujo completo.

### Reglas del módulo

- Solo los **clientes** pueden registrar y consultar pagos; un profesional recibe `403`.
- Solo se puede pagar una solicitud propia, y únicamente si está `aceptada` o `finalizada`.
- Cada solicitud admite **un solo pago**. La base lo garantiza con una restricción `UNIQUE` sobre `SolicitudId`.
- Se rechazan tarjetas vencidas y se valida el importe (entre $1 y $10.000.000).
- Se guardan solo metadatos seguros: marca, **últimos 4 dígitos**, titular, vencimiento, importe, estado y referencia. **Nunca** se persisten el número completo ni el CVV.

### Endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/pagos/mias` | Historial de pagos del cliente autenticado |
| `POST` | `/api/pagos` | Registra un pago para una solicitud propia |

Ejemplo de cuerpo para `POST /api/pagos`:

```json
{
  "solicitudId": 1,
  "monto": 18500.5,
  "tokenPago": "demo_00000000-0000-4000-8000-000000000000",
  "marca": "visa",
  "ultimos4": "4242",
  "titular": "Cliente Demo",
  "vencimientoMes": 12,
  "vencimientoAnio": 2030
}
```

El campo `tokenPago` simula el token que devolvería una pasarela real y debe tener el formato `demo_<uuid>`. Si más adelante se integra un proveedor de pagos verdadero, el frontend debería enviar el token generado por ese proveedor en lugar de los datos de la tarjeta.

### Archivos involucrados

- `src/Pago.tsx` y `src/Pago.css`: checkout, vista previa con `crd-ui`, validaciones y comprobante.
- `src/MisSolicitudes.tsx`: acceso al pago y estado “Pagado”.
- `server/src/routes/pagos.ts`: autorización, validación y persistencia.
- `database/01_schema.sql`: tabla `Pagos`, restricciones e índices.

---

## Compilar para producción

```powershell
# 1. Configurar variables de producción en server/.env
#    NODE_ENV=production
#    JWT_SECRET=<valor largo y aleatorio>
#    DB_* según el servidor real

# 2. Compilar frontend y API
npm run build:all

# 3. Iniciar
npm start
```

En producción, la API sirve también el frontend compilado desde `dist`, por lo que la aplicación queda disponible en **http://localhost:4000** (o el puerto configurado).

> Si `NODE_ENV=production` y `JWT_SECRET` conserva el valor de ejemplo, la API se niega a iniciar. Es una protección intencional.

---

## Solución de problemas

### `No se encuentra el nombre del origen de datos...`

El driver ODBC no está instalado o el nombre en `DB_DRIVER` no coincide.

```powershell
Get-OdbcDriver | Select-Object Name
```

Instalá **Microsoft ODBC Driver 18 for SQL Server** y verificá que `server/.env` tenga:

```env
DB_DRIVER=ODBC Driver 18 for SQL Server
```

### `The client cannot connect to the server because the requested instance was not available`

Causas habituales:

1. `DB_SERVER` tiene doble barra: debe ser `localhost\SQLEXPRESS`.
2. El servicio de SQL Server está detenido:

   ```powershell
   Get-Service "MSSQL`$SQLEXPRESS"
   Start-Service "MSSQL`$SQLEXPRESS"
   ```

3. La instancia tiene otro nombre. Copiá el valor exacto desde SSMS.

### `Login failed for user`

- Con autenticación de Windows, verificá que `DB_TRUSTED=true` y que tu usuario tenga acceso a la instancia.
- Con autenticación SQL, revisá `DB_USER` y `DB_PASSWORD`, y que el usuario tenga permisos sobre `ConectaPro`.

### `npm run setup:db` falla al crear la base

El usuario de Windows necesita permiso para crear bases. Si no lo tiene, creá `ConectaPro` manualmente con SSMS y volvé a ejecutar el comando; el script detectará que ya existe.

### El frontend muestra errores de red

- Asegurate de que la API esté corriendo (`npm run dev:all`, no solo `npm run dev`).
- Verificá `http://localhost:4000/api/salud`.
- Si cambiaste el puerto de la API, actualizá el proxy en `vite.config.ts`.

### `EADDRINUSE` (puerto ocupado)

Cambiá `PORT` en `server/.env` y el destino del proxy en `vite.config.ts`, o cerrá el proceso que usa el puerto:

```powershell
Get-NetTCPConnection -LocalPort 4000 | Select-Object OwningProcess
```

### `npm run test:api` falla al conectar

La prueba usa la misma configuración que la API. Primero verificá que `npm run setup:db` haya terminado correctamente y que SQL Server esté activo.

### Los acentos se ven mal en la consola

Es un problema de codificación de la terminal de Windows, no de la base. En PowerShell podés ejecutar:

```powershell
chcp 65001
```

---

## Seguridad

- **Contraseñas:** se almacenan con hash bcrypt; nunca en texto plano.
- **Roles:** el registro solo acepta `cliente` o `profesional`. La API vuelve a leer el rol desde la base en cada request, por lo que un token manipulado no permite escalar privilegios.
- **Autorización:** SQL Server no ofrece un equivalente a RLS de Supabase. Por eso los permisos se validan en la capa de API: cada operación de escritura comprueba sesión, rol y propiedad del recurso antes de ejecutar el SQL.
- **Servicios:** un profesional solo puede editar o eliminar sus propias publicaciones. La eliminación es lógica (`Activo = 0`).
- **Solicitudes:** solo el profesional destinatario puede cambiar su estado.
- **Reseñas:** solo el autor puede eliminarlas; un profesional no puede borrar reseñas de clientes.
- **Pagos:** solo el cliente dueño de la solicitud puede pagarla, y únicamente si está aceptada o finalizada. La API no acepta el número completo de la tarjeta: recibe únicamente marca, últimos 4 dígitos y vencimiento. El número completo y el CVV nunca se envían al servidor ni se guardan en SQL Server.
- **Secretos:** `server/.env` está ignorado por Git. No subas claves reales ni la contraseña de producción.
- **Validación:** todas las entradas pasan por esquemas Zod antes de llegar a SQL Server; las consultas usan parámetros, no concatenación.
- **Protecciones HTTP:** Helmet, CORS restringido y límites de frecuencia para autenticación, IA y API general.
