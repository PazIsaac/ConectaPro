"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const errores_1 = require("../middleware/errores");
const router = (0, express_1.Router)();
router.get('/', (0, errores_1.asyncHandler)(async (_req, res) => {
    const categorias = await (0, db_1.consultar)(`SELECT c.CategoriaId, c.Nombre, c.Descripcion, c.Icono,
              COUNT(s.ServicioId) AS CantidadServicios
       FROM dbo.Categorias c
       LEFT JOIN dbo.Servicios s ON s.CategoriaId = c.CategoriaId AND s.Activo = 1
       WHERE c.Activa = 1
       GROUP BY c.CategoriaId, c.Nombre, c.Descripcion, c.Icono, c.Orden
       ORDER BY c.Orden`);
    res.json({
        categorias: categorias.map((categoria) => ({
            id: categoria.CategoriaId,
            nombre: categoria.Nombre,
            descripcion: categoria.Descripcion,
            icono: categoria.Icono,
            cantidadServicios: categoria.CantidadServicios,
        })),
    });
}));
router.get('/estadisticas', (0, errores_1.asyncHandler)(async (_req, res) => {
    const filas = await (0, db_1.consultar)(`SELECT
         (SELECT COUNT(*) FROM dbo.Profesionales WHERE Disponible = 1) AS Profesionales,
         (SELECT COUNT(*) FROM dbo.Servicios WHERE Activo = 1) AS Servicios,
         (SELECT COUNT(*) FROM dbo.Categorias WHERE Activa = 1) AS Categorias,
         (SELECT COUNT(*) FROM dbo.Resenas) AS Resenas,
         (SELECT AVG(CAST(Puntuacion AS DECIMAL(3,2))) FROM dbo.Resenas) AS Promedio`);
    const datos = filas[0];
    res.json({
        estadisticas: {
            profesionales: datos?.Profesionales ?? 0,
            servicios: datos?.Servicios ?? 0,
            categorias: datos?.Categorias ?? 0,
            resenas: datos?.Resenas ?? 0,
            promedio: datos?.Promedio !== null && datos?.Promedio !== undefined
                ? Number(datos.Promedio)
                : null,
        },
    });
}));
exports.default = router;
//# sourceMappingURL=categorias.js.map