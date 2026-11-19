"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listarResenas = listarResenas;
const db_1 = require("../db");
async function listarResenas(profesionalId) {
    const filas = await (0, db_1.consultar)(`SELECT r.ResenaId, r.ProfesionalId, r.ClienteId, u.Nombre AS ClienteNombre,
            r.Puntuacion, r.Comentario, r.FechaCreacion
     FROM dbo.Resenas r
     INNER JOIN dbo.Usuarios u ON u.UsuarioId = r.ClienteId
     WHERE r.ProfesionalId = @profesionalId
     ORDER BY r.FechaCreacion DESC`, { profesionalId });
    return filas.map((fila) => ({
        id: fila.ResenaId,
        profesionalId: fila.ProfesionalId,
        clienteId: fila.ClienteId,
        clienteNombre: fila.ClienteNombre,
        puntuacion: fila.Puntuacion,
        comentario: fila.Comentario,
        fechaCreacion: fila.FechaCreacion instanceof Date ? fila.FechaCreacion.toISOString() : String(fila.FechaCreacion),
    }));
}
//# sourceMappingURL=resenas.js.map