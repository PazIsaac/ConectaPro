"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* Prueba de humo de la API de ConectaPro.
   Levanta la aplicación en un puerto efímero, ejecuta los flujos críticos
   contra SQL Server real y limpia los datos creados al finalizar.
   Uso: npm run test:api (la base debe estar configurada con npm run setup:db). */
const strict_1 = __importDefault(require("node:assert/strict"));
const node_crypto_1 = require("node:crypto");
const app_1 = __importDefault(require("../app"));
const db_1 = require("../db");
const PASSWORD = process.env.DEMO_PASSWORD || 'Demo1234!';
const sufijo = Date.now().toString(36);
const patron = `Smoke ${sufijo}`;
const zona = `Zona Smoke ${sufijo}`;
let base = '';
let server = null;
let comprobaciones = 0;
let usuarioTemporalId = null;
async function pedir(ruta, opciones = {}) {
    const encabezados = {};
    if (opciones.cuerpo !== undefined)
        encabezados['Content-Type'] = 'application/json';
    if (opciones.token)
        encabezados.Authorization = `Bearer ${opciones.token}`;
    const respuesta = await fetch(`${base}${ruta}`, {
        method: opciones.metodo ?? 'GET',
        headers: encabezados,
        body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
    });
    const texto = await respuesta.text();
    const datos = texto ? JSON.parse(texto) : null;
    return { estado: respuesta.status, datos };
}
function comprobar(condicion, mensaje) {
    strict_1.default.ok(condicion, mensaje);
    comprobaciones += 1;
}
async function iniciarServidor() {
    await new Promise((resolver, rechazar) => {
        server = app_1.default.listen(0, '127.0.0.1', () => resolver());
        server.on('error', rechazar);
    });
    const direccion = server.address();
    base = `http://127.0.0.1:${direccion.port}/api`;
}
async function iniciarSesion(correo) {
    const respuesta = await pedir('/auth/login', {
        metodo: 'POST',
        cuerpo: { correo, contrasena: PASSWORD },
    });
    comprobar(respuesta.estado === 200, `Login de ${correo} (recibido ${respuesta.estado})`);
    comprobar(Boolean(respuesta.datos.token), `Token emitido para ${correo}`);
    return respuesta.datos;
}
async function ejecutar() {
    console.log('\n[smoke] Iniciando API en un puerto efímero...');
    await iniciarServidor();
    /* ---------- Estado del servicio y catálogo ---------- */
    const salud = await pedir('/salud');
    comprobar(salud.estado === 200 && salud.datos.estado === 'ok', 'La API responde /salud');
    const categoriasResp = await pedir('/categorias');
    comprobar(categoriasResp.estado === 200, 'GET /categorias responde 200');
    const categorias = categoriasResp.datos.categorias;
    comprobar(categorias.length >= 9, 'Se cargaron las 9 categorías del esquema');
    const plomeria = categorias.find((categoria) => categoria.nombre === 'Plomería');
    comprobar(plomeria !== undefined, 'Existe la categoría Plomería');
    const profesionalesResp = await pedir('/profesionales');
    comprobar(profesionalesResp.estado === 200, 'GET /profesionales responde 200');
    const profesionales = profesionalesResp.datos.profesionales;
    comprobar(profesionales.length > 0, 'El catálogo devuelve profesionales reales');
    comprobar(profesionales.every((profesional) => Array.isArray(profesional.servicios)), 'Cada profesional incluye sus servicios');
    /* ---------- Autenticación y roles ---------- */
    const cliente = await iniciarSesion('cliente@conectapro.com');
    const martin = await iniciarSesion('martin@conectapro.com');
    const lucia = await iniciarSesion('lucia@conectapro.com');
    comprobar(cliente.usuario.rol === 'cliente', 'La cuenta demo de cliente tiene rol cliente');
    comprobar(martin.usuario.rol === 'profesional', 'La cuenta demo de Martín tiene rol profesional');
    comprobar(martin.usuario.profesionalId !== lucia.usuario.profesionalId, 'Cada profesional tiene un perfil distinto');
    const escalada = await pedir('/auth/registro', {
        metodo: 'POST',
        cuerpo: {
            nombre: 'Intento Admin',
            correo: `admin-${sufijo}@ejemplo.com`,
            contrasena: 'Demo1234!',
            rol: 'admin',
        },
    });
    comprobar(escalada.estado === 400, 'El registro rechaza roles distintos de cliente/profesional');
    /* Cliente temporal para probar reseñas sin chocar con las semillas. */
    const registroTemporal = await pedir('/auth/registro', {
        metodo: 'POST',
        cuerpo: {
            nombre: `Cliente Smoke ${sufijo}`,
            correo: `cliente-${sufijo}@ejemplo.com`,
            contrasena: 'Demo1234!',
            rol: 'cliente',
        },
    });
    comprobar(registroTemporal.estado === 201, 'Un cliente nuevo puede registrarse (201)');
    comprobar(registroTemporal.datos.usuario.rol === 'cliente', 'El registro respeta el rol solicitado');
    usuarioTemporalId = registroTemporal.datos.usuario.id;
    const clienteTemporal = {
        token: registroTemporal.datos.token,
        usuario: registroTemporal.datos.usuario,
    };
    /* ---------- Permisos sobre servicios ---------- */
    const sinToken = await pedir('/servicios', {
        metodo: 'POST',
        cuerpo: { nombre: 'Servicio sin token', descripcion: 'Descripción de prueba suficientemente larga.' },
    });
    comprobar(sinToken.estado === 401, 'Crear un servicio sin sesión devuelve 401');
    const comoCliente = await pedir('/servicios', {
        metodo: 'POST',
        token: cliente.token,
        cuerpo: {
            nombre: 'Servicio de cliente',
            descripcion: 'Descripción de prueba suficientemente larga.',
            categoriaId: plomeria.id,
            modalidad: 'A domicilio',
        },
    });
    comprobar(comoCliente.estado === 403, 'Un cliente no puede publicar servicios (403)');
    const ajenos = await pedir(`/servicios?profesionalId=${lucia.usuario.profesionalId}`);
    comprobar(ajenos.estado === 200 && ajenos.datos.servicios.length > 0, 'Lucía tiene servicios publicados');
    const servicioAjeno = ajenos.datos.servicios[0];
    const editarAjeno = await pedir(`/servicios/${servicioAjeno.id}`, {
        metodo: 'PUT',
        token: martin.token,
        cuerpo: {
            nombre: 'Intento de edición ajena',
            descripcion: 'Descripción de prueba suficientemente larga.',
            categoriaId: plomeria.id,
            modalidad: 'A domicilio',
        },
    });
    comprobar(editarAjeno.estado === 403, 'Un profesional no puede editar servicios ajenos (403)');
    const borrarAjeno = await pedir(`/servicios/${servicioAjeno.id}`, {
        metodo: 'DELETE',
        token: martin.token,
    });
    comprobar(borrarAjeno.estado === 403, 'Un profesional no puede eliminar servicios ajenos (403)');
    /* ---------- CRUD real de servicios ---------- */
    const crear = await pedir('/servicios', {
        metodo: 'POST',
        token: martin.token,
        cuerpo: {
            nombre: `${patron} reparación de cañería`,
            descripcion: 'Servicio de prueba con zona, disponibilidad y precio orientativo.',
            categoriaId: plomeria.id,
            precioReferencia: 'Desde $15.000',
            zona,
            disponible: true,
            modalidad: 'A domicilio',
        },
    });
    comprobar(crear.estado === 201, `Crear servicio devuelve 201 (recibido ${crear.estado})`);
    const creado = crear.datos.servicio;
    comprobar(creado.nombre === `${patron} reparación de cañería`, 'El nombre se guardó completo');
    comprobar(creado.zona === zona, 'La zona se guardó en el servicio');
    comprobar(creado.disponible === true, 'La disponibilidad se guardó en el servicio');
    comprobar(creado.precioReferencia === 'Desde $15.000', 'El precio orientativo se guardó');
    const enBase = await (0, db_1.consultar)('SELECT Nombre, Zona, Disponible, Activo FROM dbo.Servicios WHERE ServicioId = @id', { id: creado.id });
    comprobar(enBase.length === 1, 'El servicio existe en SQL Server');
    comprobar(enBase[0].Zona === zona, 'La zona persiste en la tabla Servicios');
    comprobar(enBase[0].Disponible === true, 'La disponibilidad persiste en la tabla Servicios');
    const porZona = await pedir(`/servicios?zona=${encodeURIComponent(zona)}`);
    comprobar(porZona.datos.servicios.some((servicio) => servicio.id === creado.id), 'El filtro por zona encuentra el servicio creado');
    const porTexto = await pedir(`/servicios?busqueda=${encodeURIComponent(patron)}`);
    comprobar(porTexto.datos.servicios.some((servicio) => servicio.id === creado.id), 'La búsqueda por palabras clave encuentra el servicio creado');
    const porCategoria = await pedir(`/servicios?categoriaId=${plomeria.id}`);
    comprobar(porCategoria.datos.servicios.every((servicio) => servicio.categoriaId === plomeria.id), 'El filtro por categoría solo devuelve servicios de esa categoría');
    const publicos = await pedir('/servicios');
    comprobar(publicos.datos.servicios.every((servicio) => servicio.disponible === true), 'El catálogo público no muestra servicios pausados');
    const editar = await pedir(`/servicios/${creado.id}`, {
        metodo: 'PUT',
        token: martin.token,
        cuerpo: {
            nombre: `${patron} cañería editada`,
            descripcion: 'Descripción actualizada del servicio de prueba para verificar el UPDATE.',
            categoriaId: plomeria.id,
            precioReferencia: 'Desde $18.000',
            zona: `${zona} editada`,
            disponible: false,
            modalidad: 'Mixta',
        },
    });
    comprobar(editar.estado === 200, 'Actualizar un servicio propio devuelve 200');
    comprobar(editar.datos.servicio.nombre === `${patron} cañería editada`, 'El UPDATE cambia el nombre');
    comprobar(editar.datos.servicio.disponible === false, 'El UPDATE pausa el servicio');
    comprobar(editar.datos.servicio.modalidad === 'Mixta', 'El UPDATE cambia la modalidad');
    const mios = await pedir('/servicios/mios', { token: martin.token });
    comprobar(mios.datos.servicios.some((servicio) => servicio.id === creado.id && servicio.disponible === false), 'El panel del profesional ve sus servicios pausados');
    const oculto = await pedir(`/servicios?busqueda=${encodeURIComponent(patron)}`);
    comprobar(!oculto.datos.servicios.some((servicio) => servicio.id === creado.id), 'Un servicio pausado no aparece en el catálogo público');
    const reactivar = await pedir(`/servicios/${creado.id}`, {
        metodo: 'PUT',
        token: martin.token,
        cuerpo: {
            nombre: `${patron} cañería editada`,
            descripcion: 'Descripción actualizada del servicio de prueba para verificar el UPDATE.',
            categoriaId: plomeria.id,
            precioReferencia: 'Desde $18.000',
            zona,
            disponible: true,
            modalidad: 'A domicilio',
        },
    });
    comprobar(reactivar.estado === 200 && reactivar.datos.servicio.disponible === true, 'Se puede reactivar un servicio');
    const validacion = await pedir('/servicios', {
        metodo: 'POST',
        token: martin.token,
        cuerpo: { nombre: 'Corto', descripcion: 'muy corta', categoriaId: plomeria.id },
    });
    comprobar(validacion.estado === 400, 'La API rechaza datos inválidos sin guardar (400)');
    comprobar(Array.isArray(validacion.datos.detalles), 'La validación devuelve detalles por campo');
    /* ---------- Solicitudes ---------- */
    const solicitud = await pedir('/solicitudes', {
        metodo: 'POST',
        token: cliente.token,
        cuerpo: {
            profesionalId: martin.usuario.profesionalId,
            servicioId: creado.id,
            mensaje: `${patron} necesito coordinar una visita esta semana.`,
        },
    });
    comprobar(solicitud.estado === 201, 'Un cliente puede crear una solicitud (201)');
    const solicitudId = solicitud.datos.solicitudId;
    const miasCliente = await pedir('/solicitudes/mias', { token: cliente.token });
    comprobar(miasCliente.datos.solicitudes.some((item) => item.id === solicitudId), 'El cliente ve su solicitud en el historial');
    const ajena = await pedir(`/solicitudes/${solicitudId}/estado`, {
        metodo: 'PATCH',
        token: lucia.token,
        cuerpo: { estado: 'aceptada' },
    });
    comprobar(ajena.estado === 403, 'Otro profesional no puede responder una solicitud ajena (403)');
    const pagoPendiente = await pedir('/pagos', {
        metodo: 'POST',
        token: cliente.token,
        cuerpo: {
            solicitudId,
            monto: 18_500,
            tokenPago: `demo_${(0, node_crypto_1.randomUUID)()}`,
            marca: 'visa',
            ultimos4: '4242',
            titular: 'Cliente Demo',
            vencimientoMes: 12,
            vencimientoAnio: 2030,
        },
    });
    comprobar(pagoPendiente.estado === 409, 'No se puede pagar una solicitud pendiente (409)');
    const responder = await pedir(`/solicitudes/${solicitudId}/estado`, {
        metodo: 'PATCH',
        token: martin.token,
        cuerpo: { estado: 'aceptada' },
    });
    comprobar(responder.estado === 200, 'El profesional destinatario puede aceptar la solicitud');
    const estadoCliente = await pedir('/solicitudes/mias', { token: cliente.token });
    const actualizada = estadoCliente.datos.solicitudes.find((item) => item.id === solicitudId);
    comprobar(actualizada?.estado === 'aceptada', 'El cambio de estado persiste y lo ve el cliente');
    /* ---------- Pagos con tarjeta ---------- */
    const pagoSinSesion = await pedir('/pagos', {
        metodo: 'POST',
        cuerpo: {
            solicitudId,
            monto: 18_500,
            tokenPago: `demo_${(0, node_crypto_1.randomUUID)()}`,
            marca: 'visa',
            ultimos4: '4242',
            titular: 'Cliente Demo',
            vencimientoMes: 12,
            vencimientoAnio: 2030,
        },
    });
    comprobar(pagoSinSesion.estado === 401, 'Pagar sin sesión devuelve 401');
    const pagoAjeno = await pedir('/pagos', {
        metodo: 'POST',
        token: clienteTemporal.token,
        cuerpo: {
            solicitudId,
            monto: 18_500,
            tokenPago: `demo_${(0, node_crypto_1.randomUUID)()}`,
            marca: 'visa',
            ultimos4: '4242',
            titular: 'Otro Cliente',
            vencimientoMes: 12,
            vencimientoAnio: 2030,
        },
    });
    comprobar(pagoAjeno.estado === 403, 'Un cliente no puede pagar solicitudes ajenas (403)');
    const pagoVencido = await pedir('/pagos', {
        metodo: 'POST',
        token: cliente.token,
        cuerpo: {
            solicitudId,
            monto: 18_500,
            tokenPago: `demo_${(0, node_crypto_1.randomUUID)()}`,
            marca: 'visa',
            ultimos4: '4242',
            titular: 'Cliente Demo',
            vencimientoMes: 1,
            vencimientoAnio: 2020,
        },
    });
    comprobar(pagoVencido.estado === 400, 'La API rechaza tarjetas vencidas (400)');
    const tokenPago = `demo_${(0, node_crypto_1.randomUUID)()}`;
    const pago = await pedir('/pagos', {
        metodo: 'POST',
        token: cliente.token,
        cuerpo: {
            solicitudId,
            monto: 18_500.5,
            tokenPago,
            marca: 'visa',
            ultimos4: '4242',
            titular: 'Cliente Demo',
            vencimientoMes: 12,
            vencimientoAnio: 2030,
        },
    });
    comprobar(pago.estado === 201, `Registrar un pago devuelve 201 (recibido ${pago.estado})`);
    comprobar(pago.datos.pago.monto === 18_500.5, 'El importe del pago se guarda con decimales');
    comprobar(pago.datos.pago.ultimos4 === '4242', 'El pago conserva solo los últimos 4 dígitos');
    comprobar(pago.datos.pago.estado === 'aprobado', 'El pago queda aprobado en modo demostración');
    const pagoEnBase = await (0, db_1.consultar)('SELECT Monto, Ultimos4, Marca, Referencia FROM dbo.Pagos WHERE SolicitudId = @solicitudId', {
        solicitudId,
    });
    comprobar(pagoEnBase.length === 1, 'El pago existe en SQL Server');
    comprobar(Number(pagoEnBase[0].Monto) === 18_500.5, 'El importe persiste en la tabla Pagos');
    comprobar(pagoEnBase[0].Ultimos4 === '4242', 'Solo se persisten los últimos 4 dígitos');
    comprobar(pagoEnBase[0].Referencia.startsWith('PAY-'), 'El pago tiene una referencia única');
    const columnasSensibles = await (0, db_1.consultar)(`SELECT COUNT(*) AS Cantidad
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_NAME = 'Pagos'
       AND (COLUMN_NAME LIKE '%Numero%' OR COLUMN_NAME LIKE '%Cvv%' OR COLUMN_NAME LIKE '%Cvc%')`);
    comprobar(columnasSensibles[0].Cantidad === 0, 'La tabla Pagos no almacena número completo ni CVV');
    const misPagos = await pedir('/pagos/mias', { token: cliente.token });
    comprobar(misPagos.datos.pagos.some((item) => item.solicitudId === solicitudId), 'El cliente ve su pago en el historial');
    const pagoDuplicado = await pedir('/pagos', {
        metodo: 'POST',
        token: cliente.token,
        cuerpo: {
            solicitudId,
            monto: 18_500,
            tokenPago: `demo_${(0, node_crypto_1.randomUUID)()}`,
            marca: 'visa',
            ultimos4: '4242',
            titular: 'Cliente Demo',
            vencimientoMes: 12,
            vencimientoAnio: 2030,
        },
    });
    comprobar(pagoDuplicado.estado === 409, 'No se permite pagar dos veces la misma solicitud');
    const pagosProfesional = await pedir('/pagos/mias', { token: martin.token });
    comprobar(pagosProfesional.estado === 403, 'El historial de pagos es solo para clientes (403)');
    /* ---------- Reseñas ---------- */
    const resena = await pedir('/resenas', {
        metodo: 'POST',
        token: clienteTemporal.token,
        cuerpo: {
            profesionalId: martin.usuario.profesionalId,
            puntuacion: 5,
            comentario: `${patron} trabajo prolijo y puntual.`,
        },
    });
    comprobar(resena.estado === 201, 'Un cliente puede publicar una reseña (201)');
    const duplicada = await pedir('/resenas', {
        metodo: 'POST',
        token: clienteTemporal.token,
        cuerpo: {
            profesionalId: martin.usuario.profesionalId,
            puntuacion: 4,
            comentario: `${patron} segunda reseña no permitida.`,
        },
    });
    comprobar(duplicada.estado === 409, 'No se permite más de una reseña por cliente y profesional');
    const perfil = await pedir(`/profesionales/${martin.usuario.profesionalId}`);
    const resenaCreada = perfil.datos.resenas.find((item) => item.comentario.startsWith(patron));
    comprobar(Boolean(resenaCreada), 'La reseña aparece en el perfil del profesional');
    const borrarResenaAjena = await pedir(`/resenas/${resenaCreada.id}`, {
        metodo: 'DELETE',
        token: martin.token,
    });
    comprobar(borrarResenaAjena.estado === 403, 'Un profesional no puede borrar reseñas de clientes (403)');
    const borrarResena = await pedir(`/resenas/${resenaCreada.id}`, {
        metodo: 'DELETE',
        token: clienteTemporal.token,
    });
    comprobar(borrarResena.estado === 200, 'El autor puede eliminar su propia reseña');
    /* ---------- Inteligencia artificial (respaldo local) ---------- */
    const estadoIa = await pedir('/ia/estado');
    comprobar(estadoIa.estado === 200 && ['local', 'modelo'].includes(estadoIa.datos.modo), 'El estado de la IA responde con un modo válido');
    const sugerencia = await pedir('/ia/sugerir-categoria', {
        metodo: 'POST',
        cuerpo: { descripcion: 'Tengo una pérdida de agua debajo de la pileta de la cocina' },
    });
    comprobar(sugerencia.estado === 200, 'La IA sugiere una categoría (200)');
    comprobar(Boolean(sugerencia.datos.sugerencia.categoriaId), 'La sugerencia incluye una categoría válida');
    comprobar(['local', 'modelo'].includes(sugerencia.datos.sugerencia.proveedor), 'La sugerencia informa el proveedor utilizado');
    const mejora = await pedir('/ia/mejorar-descripcion', {
        metodo: 'POST',
        token: martin.token,
        cuerpo: {
            texto: 'Hago reparaciones de plomería en general, arreglo canillas y cañerías.',
            categoria: 'Plomería',
        },
    });
    comprobar(mejora.estado === 200, 'La IA mejora una descripción (200)');
    comprobar(typeof mejora.datos.resultado.descripcion === 'string' && mejora.datos.resultado.descripcion.length > 20, 'La descripción mejorada tiene contenido');
    const mejoraSinSesion = await pedir('/ia/mejorar-descripcion', {
        metodo: 'POST',
        cuerpo: { texto: 'Hago reparaciones de plomería en general, arreglo canillas y cañerías.' },
    });
    comprobar(mejoraSinSesion.estado === 401, 'Mejorar descripciones requiere sesión profesional');
    /* ---------- Eliminación y persistencia final ---------- */
    const eliminar = await pedir(`/servicios/${creado.id}`, { metodo: 'DELETE', token: martin.token });
    comprobar(eliminar.estado === 200, 'Eliminar un servicio propio devuelve 200');
    const detalleEliminado = await pedir(`/servicios/${creado.id}`);
    comprobar(detalleEliminado.estado === 404, 'El servicio eliminado ya no se puede consultar');
    const miosFinal = await pedir('/servicios/mios', { token: martin.token });
    comprobar(!miosFinal.datos.servicios.some((servicio) => servicio.id === creado.id), 'El servicio eliminado desaparece del panel del profesional');
    const eliminadoEnBase = await (0, db_1.consultar)('SELECT Activo FROM dbo.Servicios WHERE ServicioId = @id', { id: creado.id });
    comprobar(eliminadoEnBase[0]?.Activo === false, 'La eliminación es lógica y persiste en SQL Server');
}
async function limpiar() {
    if (!base)
        return;
    try {
        await (0, db_1.consultar)('DELETE FROM dbo.Resenas WHERE Comentario LIKE @patron', { patron: `%${patron}%` });
        await (0, db_1.consultar)(`DELETE FROM dbo.Pagos
       WHERE SolicitudId IN (SELECT SolicitudId FROM dbo.Solicitudes WHERE Mensaje LIKE @patron)`, { patron: `%${patron}%` });
        await (0, db_1.consultar)('DELETE FROM dbo.Solicitudes WHERE Mensaje LIKE @patron', { patron: `%${patron}%` });
        await (0, db_1.consultar)('DELETE FROM dbo.Servicios WHERE Nombre LIKE @patron', { patron: `%${patron}%` });
        await (0, db_1.consultar)('DELETE FROM dbo.IaConsultas WHERE Entrada LIKE @patron', { patron: `%${patron}%` });
        if (usuarioTemporalId) {
            await (0, db_1.consultar)('DELETE FROM dbo.Resenas WHERE ClienteId = @id', { id: usuarioTemporalId });
            await (0, db_1.consultar)('DELETE FROM dbo.Pagos WHERE ClienteId = @id', { id: usuarioTemporalId });
            await (0, db_1.consultar)('DELETE FROM dbo.Solicitudes WHERE ClienteId = @id', { id: usuarioTemporalId });
            await (0, db_1.consultar)('DELETE FROM dbo.Usuarios WHERE UsuarioId = @id', { id: usuarioTemporalId });
        }
    }
    catch (error) {
        console.warn('[smoke] No se pudieron limpiar todos los datos de prueba:', error.message);
    }
}
async function main() {
    try {
        await ejecutar();
        console.log(`\n[smoke] OK: ${comprobaciones} comprobaciones aprobadas.`);
    }
    catch (error) {
        console.error('\n[smoke] FALLÓ:', error instanceof Error ? error.message : error);
        process.exitCode = 1;
    }
    finally {
        await limpiar();
        if (server) {
            await new Promise((resolver) => server.close(() => resolver()));
        }
        await (0, db_1.cerrarPool)().catch(() => undefined);
    }
}
void main();
//# sourceMappingURL=smoke-test.js.map