"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const errores_1 = require("../middleware/errores");
const resenas_1 = require("../services/resenas");
const router = (0, express_1.Router)();
const esquemaResena = zod_1.z.object({
    profesionalId: zod_1.z.coerce.number().int().positive(),
    puntuacion: zod_1.z.coerce.number().int().min(1).max(5),
    comentario: zod_1.z.string().trim().min(10, 'El comentario debe tener al menos 10 caracteres.').max(1000),
});
router.post('/', auth_1.autenticar, (0, auth_1.soloRol)('cliente'), (0, errores_1.asyncHandler)(async (req, res) => {
    const datos = (0, errores_1.validar)(esquemaResena, req.body);
    const profesionales = await (0, db_1.consultar)('SELECT ProfesionalId FROM dbo.Profesionales WHERE ProfesionalId = @id', { id: datos.profesionalId });
    if (profesionales.length === 0)
        throw new errores_1.ApiError(404, 'El profesional seleccionado no existe.');
    const previas = await (0, db_1.consultar)('SELECT ResenaId FROM dbo.Resenas WHERE ClienteId = @clienteId AND ProfesionalId = @profesionalId', { clienteId: req.usuario.id, profesionalId: datos.profesionalId });
    if (previas.length > 0) {
        throw new errores_1.ApiError(409, 'Ya publicaste una reseña para este profesional.');
    }
    await (0, db_1.ejecutar)(`INSERT INTO dbo.Resenas (ProfesionalId, ClienteId, Puntuacion, Comentario)
       VALUES (@profesionalId, @clienteId, @puntuacion, @comentario)`, {
        profesionalId: datos.profesionalId,
        clienteId: req.usuario.id,
        puntuacion: datos.puntuacion,
        comentario: datos.comentario,
    });
    res.status(201).json({ mensaje: 'Tu reseña se publicó correctamente.' });
}));
router.delete('/:id', auth_1.autenticar, (0, errores_1.asyncHandler)(async (req, res) => {
    const id = Number(req.params.id);
    const filas = await (0, db_1.consultar)('SELECT ClienteId FROM dbo.Resenas WHERE ResenaId = @id', { id });
    const resena = filas[0];
    if (!resena)
        throw new errores_1.ApiError(404, 'No encontramos la reseña.');
    if (resena.ClienteId !== req.usuario.id) {
        throw new errores_1.ApiError(403, 'Solo podés eliminar tus propias reseñas.');
    }
    await (0, db_1.ejecutar)('DELETE FROM dbo.Resenas WHERE ResenaId = @id', { id });
    res.json({ mensaje: 'La reseña se eliminó correctamente.' });
}));
router.get('/profesional/:profesionalId', (0, errores_1.asyncHandler)(async (req, res) => {
    const id = Number(req.params.profesionalId);
    if (!Number.isInteger(id) || id <= 0)
        throw new errores_1.ApiError(400, 'El profesional no es válido.');
    res.json({ resenas: await (0, resenas_1.listarResenas)(id) });
}));
exports.default = router;
//# sourceMappingURL=resenas.js.map