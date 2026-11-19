"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
exports.asyncHandler = asyncHandler;
exports.validar = validar;
exports.noEncontrado = noEncontrado;
exports.manejadorErrores = manejadorErrores;
const zod_1 = require("zod");
class ApiError extends Error {
    estado;
    detalles;
    constructor(estado, mensaje, detalles) {
        super(mensaje);
        this.estado = estado;
        this.detalles = detalles;
        this.name = 'ApiError';
    }
}
exports.ApiError = ApiError;
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
function validar(schema, datos) {
    try {
        return schema.parse(datos);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            const detalles = error.issues.map((issue) => ({
                campo: issue.path.join('.'),
                mensaje: issue.message,
            }));
            throw new ApiError(400, 'Revisá los datos enviados.', detalles);
        }
        throw error;
    }
}
function noEncontrado(req, _res, next) {
    next(new ApiError(404, `No existe la ruta ${req.method} ${req.originalUrl}.`));
}
function manejadorErrores(error, _req, res, _next) {
    if (error instanceof ApiError) {
        res.status(error.estado).json({
            error: error.message,
            detalles: error.detalles,
        });
        return;
    }
    const err = error;
    if (err?.number === 2627 || err?.number === 2601) {
        res.status(409).json({ error: 'Ya existe un registro con esos datos.' });
        return;
    }
    console.error('[api] Error no controlado:', error);
    res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' });
}
//# sourceMappingURL=errores.js.map