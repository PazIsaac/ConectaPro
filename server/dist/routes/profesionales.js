"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const errores_1 = require("../middleware/errores");
const catalogo_1 = require("../services/catalogo");
const resenas_1 = require("../services/resenas");
const router = (0, express_1.Router)();
const esquemaFiltros = zod_1.z.object({
    busqueda: zod_1.z.string().trim().max(100).optional(),
    categoriaId: zod_1.z.coerce.number().int().positive().optional(),
    zona: zod_1.z.string().trim().max(120).optional(),
    disponible: zod_1.z.enum(['true', 'false']).optional(),
});
router.get('/', (0, errores_1.asyncHandler)(async (req, res) => {
    const filtros = (0, errores_1.validar)(esquemaFiltros, req.query);
    const profesionales = await (0, catalogo_1.listarProfesionales)({
        busqueda: filtros.busqueda,
        categoriaId: filtros.categoriaId,
        zona: filtros.zona,
        soloDisponibles: filtros.disponible !== 'false',
    });
    res.json({ profesionales });
}));
router.get('/:id', (0, errores_1.asyncHandler)(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'El identificador del profesional no es válido.' });
        return;
    }
    const profesional = await (0, catalogo_1.obtenerProfesional)(id);
    if (!profesional) {
        res.status(404).json({ error: 'No encontramos el perfil profesional solicitado.' });
        return;
    }
    const resenas = await (0, resenas_1.listarResenas)(id);
    res.json({ profesional, resenas });
}));
router.get('/:id/resenas', (0, errores_1.asyncHandler)(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'El identificador del profesional no es válido.' });
        return;
    }
    res.json({ resenas: await (0, resenas_1.listarResenas)(id) });
}));
exports.default = router;
//# sourceMappingURL=profesionales.js.map