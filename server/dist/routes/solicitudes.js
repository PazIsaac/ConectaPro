"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const errores_1 = require("../middleware/errores");
const router = (0, express_1.Router)();
const estados = ['aceptada', 'rechazada', 'finalizada'];
const esquemaSolicitud = zod_1.z.object({
    profesionalId: zod_1.z.coerce.number().int().positive(),
    servicioId: zod_1.z.coerce.number().int().positive().nullable().optional(),
    mensaje: zod_1.z.string().trim().min(10, 'Contá brevemente qué necesitás (mínimo 10 caracteres).').max(1000),
});
const esquemaEstado = zod_1.z.object({
    estado: zod_1.z.enum(estados),
});
function mapearSolicitud(fila) {
    return {
        id: fila.SolicitudId,
        clienteId: fila.ClienteId,
        clienteNombre: fila.ClienteNombre,
        profesionalId: fila.ProfesionalId,
        profesionalNombre: fila.ProfesionalNombre,
        servicioId: fila.ServicioId,
        servicioNombre: fila.ServicioNombre,
        mensaje: fila.Mensaje,
        estado: fila.Estado,
        fechaCreacion: fila.FechaCreacion instanceof Date ? fila.FechaCreacion.toISOString() : String(fila.FechaCreacion),
    };
}
router.get('/mias', auth_1.autenticar, (0, errores_1.asyncHandler)(async (req, res) => {
    const usuario = req.usuario;
    if (usuario.rol === 'profesional' && !usuario.profesionalId) {
        throw new errores_1.ApiError(404, 'No encontramos tu perfil profesional.');
    }
    const filas = await (0, db_1.consultar)(`SELECT s.SolicitudId, s.ClienteId, uc.Nombre AS ClienteNombre,
              s.ProfesionalId, up.Nombre AS ProfesionalNombre,
              s.ServicioId, sv.Nombre AS ServicioNombre,
              s.Mensaje, s.Estado, s.FechaCreacion
       FROM dbo.Solicitudes s
       INNER JOIN dbo.Usuarios uc ON uc.UsuarioId = s.ClienteId
       INNER JOIN dbo.Profesionales p ON p.ProfesionalId = s.ProfesionalId
       INNER JOIN dbo.Usuarios up ON up.UsuarioId = p.UsuarioId
       LEFT JOIN dbo.Servicios sv ON sv.ServicioId = s.ServicioId
       WHERE (@rol = 'cliente' AND s.ClienteId = @usuarioId)
          OR (@rol = 'profesional' AND s.ProfesionalId = @profesionalId)
       ORDER BY s.FechaCreacion DESC`, {
        rol: usuario.rol,
        usuarioId: usuario.id,
        profesionalId: usuario.profesionalId ?? -1,
    });
    res.json({ solicitudes: filas.map(mapearSolicitud) });
}));
router.post('/', auth_1.autenticar, (0, auth_1.soloRol)('cliente'), (0, errores_1.asyncHandler)(async (req, res) => {
    const datos = (0, errores_1.validar)(esquemaSolicitud, req.body);
    const profesionales = await (0, db_1.consultar)('SELECT ProfesionalId, Disponible FROM dbo.Profesionales WHERE ProfesionalId = @id', { id: datos.profesionalId });
    const profesional = profesionales[0];
    if (!profesional)
        throw new errores_1.ApiError(404, 'El profesional seleccionado no existe.');
    if (!profesional.Disponible)
        throw new errores_1.ApiError(409, 'El profesional no está disponible en este momento.');
    if (datos.servicioId) {
        const servicios = await (0, db_1.consultar)(`SELECT ServicioId FROM dbo.Servicios
         WHERE ServicioId = @servicioId AND ProfesionalId = @profesionalId AND Activo = 1`, { servicioId: datos.servicioId, profesionalId: datos.profesionalId });
        if (servicios.length === 0) {
            throw new errores_1.ApiError(400, 'El servicio seleccionado no pertenece al profesional.');
        }
    }
    const filas = await (0, db_1.consultar)(`INSERT INTO dbo.Solicitudes (ClienteId, ProfesionalId, ServicioId, Mensaje)
       OUTPUT INSERTED.SolicitudId
       VALUES (@clienteId, @profesionalId, @servicioId, @mensaje)`, {
        clienteId: req.usuario.id,
        profesionalId: datos.profesionalId,
        servicioId: datos.servicioId ?? null,
        mensaje: datos.mensaje,
    });
    res.status(201).json({
        mensaje: 'La solicitud se envió correctamente. Podés seguir su estado desde Mis solicitudes.',
        solicitudId: filas[0].SolicitudId,
    });
}));
router.patch('/:id/estado', auth_1.autenticar, (0, auth_1.soloRol)('profesional'), (0, errores_1.asyncHandler)(async (req, res) => {
    const id = Number(req.params.id);
    const profesionalId = req.usuario.profesionalId;
    if (!profesionalId)
        throw new errores_1.ApiError(403, 'Tu cuenta no tiene un perfil profesional asociado.');
    const datos = (0, errores_1.validar)(esquemaEstado, req.body);
    const filas = await (0, db_1.consultar)('SELECT ProfesionalId, Estado FROM dbo.Solicitudes WHERE SolicitudId = @id', { id });
    const solicitud = filas[0];
    if (!solicitud)
        throw new errores_1.ApiError(404, 'No encontramos la solicitud.');
    if (solicitud.ProfesionalId !== profesionalId) {
        throw new errores_1.ApiError(403, 'Solo podés responder solicitudes dirigidas a vos.');
    }
    await (0, db_1.ejecutar)(`UPDATE dbo.Solicitudes
       SET Estado = @estado, FechaActualizacion = SYSUTCDATETIME()
       WHERE SolicitudId = @id`, { id, estado: datos.estado });
    res.json({ mensaje: 'El estado de la solicitud se actualizó correctamente.' });
}));
exports.default = router;
//# sourceMappingURL=solicitudes.js.map