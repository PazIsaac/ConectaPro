"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const errores_1 = require("../middleware/errores");
const catalogo_1 = require("../services/catalogo");
const router = (0, express_1.Router)();
const modalidades = ['A domicilio', 'En taller', 'Remoto', 'Mixta'];
const esquemaServicio = zod_1.z.object({
    nombre: zod_1.z.string().trim().min(5, 'El nombre debe tener al menos 5 caracteres.').max(120),
    descripcion: zod_1.z
        .string()
        .trim()
        .min(20, 'La descripción debe tener al menos 20 caracteres.')
        .max(1000),
    categoriaId: zod_1.z.coerce.number().int().positive('Seleccioná una categoría.'),
    precioReferencia: zod_1.z.string().trim().max(80).optional().default(''),
    zona: zod_1.z.string().trim().max(120).optional().default(''),
    disponible: zod_1.z.boolean().optional().default(true),
    modalidad: zod_1.z.enum(modalidades).optional().default('A domicilio'),
});
const esquemaFiltros = zod_1.z.object({
    busqueda: zod_1.z.string().trim().max(100).optional(),
    categoriaId: zod_1.z.coerce.number().int().positive().optional(),
    zona: zod_1.z.string().trim().max(120).optional(),
    disponible: zod_1.z.enum(['true', 'false']).optional(),
    profesionalId: zod_1.z.coerce.number().int().positive().optional(),
});
async function verificarCategoria(categoriaId) {
    const filas = await (0, db_1.consultar)('SELECT CategoriaId FROM dbo.Categorias WHERE CategoriaId = @id AND Activa = 1', { id: categoriaId });
    if (filas.length === 0)
        throw new errores_1.ApiError(400, 'La categoría seleccionada no existe o no está activa.');
}
router.get('/', (0, errores_1.asyncHandler)(async (req, res) => {
    const filtros = (0, errores_1.validar)(esquemaFiltros, req.query);
    const servicios = await (0, catalogo_1.listarServicios)({
        busqueda: filtros.busqueda,
        categoriaId: filtros.categoriaId,
        zona: filtros.zona,
        profesionalId: filtros.profesionalId,
        soloDisponibles: filtros.disponible !== 'false',
    });
    res.json({ servicios });
}));
router.get('/mios', auth_1.autenticar, (0, auth_1.soloRol)('profesional'), (0, errores_1.asyncHandler)(async (req, res) => {
    if (!req.usuario.profesionalId) {
        throw new errores_1.ApiError(404, 'No encontramos tu perfil profesional.');
    }
    const servicios = await (0, catalogo_1.listarServicios)({
        profesionalId: req.usuario.profesionalId,
        soloDisponibles: false,
    });
    res.json({ servicios });
}));
router.get('/:id', (0, errores_1.asyncHandler)(async (req, res) => {
    const servicio = await (0, catalogo_1.obtenerServicio)(Number(req.params.id));
    if (!servicio)
        throw new errores_1.ApiError(404, 'No encontramos el servicio solicitado.');
    res.json({ servicio });
}));
router.post('/', auth_1.autenticar, (0, auth_1.soloRol)('profesional'), (0, errores_1.asyncHandler)(async (req, res) => {
    const profesionalId = req.usuario.profesionalId;
    if (!profesionalId)
        throw new errores_1.ApiError(403, 'Tu cuenta no tiene un perfil profesional asociado.');
    const datos = (0, errores_1.validar)(esquemaServicio, req.body);
    await verificarCategoria(datos.categoriaId);
    const filas = await (0, db_1.consultar)(`INSERT INTO dbo.Servicios
         (ProfesionalId, CategoriaId, Nombre, Descripcion, PrecioReferencia, Zona, Disponible, Modalidad)
       OUTPUT INSERTED.ServicioId
       VALUES (@profesionalId, @categoriaId, @nombre, @descripcion, @precio, @zona, @disponible, @modalidad)`, {
        profesionalId,
        categoriaId: datos.categoriaId,
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        precio: datos.precioReferencia || null,
        zona: datos.zona || null,
        disponible: datos.disponible,
        modalidad: datos.modalidad,
    });
    const servicio = await (0, catalogo_1.obtenerServicio)(filas[0].ServicioId);
    res.status(201).json({ mensaje: 'El servicio se publicó correctamente.', servicio });
}));
router.put('/:id', auth_1.autenticar, (0, auth_1.soloRol)('profesional'), (0, errores_1.asyncHandler)(async (req, res) => {
    const id = Number(req.params.id);
    const profesionalId = req.usuario.profesionalId;
    if (!profesionalId)
        throw new errores_1.ApiError(403, 'Tu cuenta no tiene un perfil profesional asociado.');
    const actuales = await (0, db_1.consultar)('SELECT ProfesionalId, Activo FROM dbo.Servicios WHERE ServicioId = @id', { id });
    const actual = actuales[0];
    if (!actual)
        throw new errores_1.ApiError(404, 'No encontramos el servicio solicitado.');
    if (actual.ProfesionalId !== profesionalId) {
        throw new errores_1.ApiError(403, 'Solo podés modificar tus propios servicios.');
    }
    if (!actual.Activo)
        throw new errores_1.ApiError(409, 'El servicio fue eliminado y no se puede modificar.');
    const datos = (0, errores_1.validar)(esquemaServicio, req.body);
    await verificarCategoria(datos.categoriaId);
    await (0, db_1.ejecutar)(`UPDATE dbo.Servicios
       SET CategoriaId = @categoriaId, Nombre = @nombre, Descripcion = @descripcion,
           PrecioReferencia = @precio, Zona = @zona, Disponible = @disponible,
           Modalidad = @modalidad, FechaActualizacion = SYSUTCDATETIME()
       WHERE ServicioId = @id AND ProfesionalId = @profesionalId`, {
        id,
        profesionalId,
        categoriaId: datos.categoriaId,
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        precio: datos.precioReferencia || null,
        zona: datos.zona || null,
        disponible: datos.disponible,
        modalidad: datos.modalidad,
    });
    res.json({ mensaje: 'Los cambios se guardaron correctamente.', servicio: await (0, catalogo_1.obtenerServicio)(id) });
}));
router.delete('/:id', auth_1.autenticar, (0, auth_1.soloRol)('profesional'), (0, errores_1.asyncHandler)(async (req, res) => {
    const id = Number(req.params.id);
    const profesionalId = req.usuario.profesionalId;
    if (!profesionalId)
        throw new errores_1.ApiError(403, 'Tu cuenta no tiene un perfil profesional asociado.');
    const actuales = await (0, db_1.consultar)('SELECT ProfesionalId, Activo FROM dbo.Servicios WHERE ServicioId = @id', { id });
    const actual = actuales[0];
    if (!actual)
        throw new errores_1.ApiError(404, 'No encontramos el servicio solicitado.');
    if (actual.ProfesionalId !== profesionalId) {
        throw new errores_1.ApiError(403, 'Solo podés eliminar tus propios servicios.');
    }
    await (0, db_1.ejecutar)(`UPDATE dbo.Servicios SET Activo = 0, FechaActualizacion = SYSUTCDATETIME()
       WHERE ServicioId = @id AND ProfesionalId = @profesionalId`, { id, profesionalId });
    res.json({ mensaje: 'El servicio se eliminó correctamente.' });
}));
exports.default = router;
//# sourceMappingURL=servicios.js.map