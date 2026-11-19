"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const db_1 = require("../db");
const config_1 = require("../config");
const auth_1 = require("../middleware/auth");
const errores_1 = require("../middleware/errores");
const router = (0, express_1.Router)();
const esquemaRegistro = zod_1.z.object({
    nombre: zod_1.z.string().trim().min(2, 'Ingresá tu nombre completo.').max(120),
    correo: zod_1.z.string().trim().toLowerCase().email('Ingresá un correo válido.').max(150),
    contrasena: zod_1.z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(72),
    rol: zod_1.z.enum(['cliente', 'profesional']),
    telefono: zod_1.z.string().trim().max(40).optional().default(''),
    especialidad: zod_1.z.string().trim().max(120).optional().default(''),
    zona: zod_1.z.string().trim().max(120).optional().default(''),
    descripcion: zod_1.z.string().trim().max(1000).optional().default(''),
});
const esquemaLogin = zod_1.z.object({
    correo: zod_1.z.string().trim().toLowerCase().email('Ingresá un correo válido.'),
    contrasena: zod_1.z.string().min(1, 'Ingresá tu contraseña.'),
});
function usuarioPublico(fila) {
    return {
        id: fila.UsuarioId,
        nombre: fila.Nombre,
        correo: fila.Correo,
        rol: fila.Rol,
        telefono: fila.Telefono,
        profesionalId: fila.ProfesionalId,
        especialidad: fila.Especialidad,
        zona: fila.Zona,
    };
}
async function buscarUsuarioPorCorreo(correo) {
    const pool = await (0, db_1.getPool)();
    const resultado = await pool
        .request()
        .input('correo', db_1.sql.NVarChar(150), correo)
        .query(`SELECT u.UsuarioId, u.Nombre, u.Correo, u.ContrasenaHash, u.Rol, u.Telefono, u.Activo,
              p.ProfesionalId, p.Especialidad, p.Zona
       FROM dbo.Usuarios u
       LEFT JOIN dbo.Profesionales p ON p.UsuarioId = u.UsuarioId
       WHERE u.Correo = @correo`);
    return resultado.recordset[0] ?? null;
}
router.post('/registro', (0, errores_1.asyncHandler)(async (req, res) => {
    const datos = (0, errores_1.validar)(esquemaRegistro, req.body);
    if (datos.rol === 'profesional' && datos.especialidad.length < 3) {
        throw new errores_1.ApiError(400, 'Indicá tu especialidad para crear el perfil profesional.', [
            { campo: 'especialidad', mensaje: 'La especialidad es obligatoria.' },
        ]);
    }
    if (await buscarUsuarioPorCorreo(datos.correo)) {
        throw new errores_1.ApiError(409, 'Ya existe una cuenta registrada con ese correo.');
    }
    const hash = await bcryptjs_1.default.hash(datos.contrasena, 12);
    const pool = await (0, db_1.getPool)();
    const transaccion = new db_1.sql.Transaction(pool);
    await transaccion.begin();
    try {
        const solicitudUsuario = new db_1.sql.Request(transaccion);
        const resultadoUsuario = await solicitudUsuario
            .input('nombre', db_1.sql.NVarChar(120), datos.nombre)
            .input('correo', db_1.sql.NVarChar(150), datos.correo)
            .input('hash', db_1.sql.NVarChar(255), hash)
            .input('rol', db_1.sql.NVarChar(20), datos.rol)
            .input('telefono', db_1.sql.NVarChar(40), datos.telefono || null)
            .query(`INSERT INTO dbo.Usuarios (Nombre, Correo, ContrasenaHash, Rol, Telefono)
           OUTPUT INSERTED.UsuarioId
           VALUES (@nombre, @correo, @hash, @rol, @telefono)`);
        const usuarioId = resultadoUsuario.recordset[0]?.UsuarioId;
        if (!usuarioId)
            throw new Error('No se pudo crear el usuario.');
        let profesionalId = null;
        if (datos.rol === 'profesional') {
            const solicitudProfesional = new db_1.sql.Request(transaccion);
            const resultadoProfesional = await solicitudProfesional
                .input('usuarioId', db_1.sql.Int, usuarioId)
                .input('especialidad', db_1.sql.NVarChar(120), datos.especialidad)
                .input('descripcion', db_1.sql.NVarChar(1000), datos.descripcion)
                .input('zona', db_1.sql.NVarChar(120), datos.zona)
                .query(`INSERT INTO dbo.Profesionales (UsuarioId, Especialidad, Descripcion, Zona)
             OUTPUT INSERTED.ProfesionalId
             VALUES (@usuarioId, @especialidad, @descripcion, @zona)`);
            profesionalId = resultadoProfesional.recordset[0]?.ProfesionalId ?? null;
        }
        await transaccion.commit();
        const usuario = {
            id: usuarioId,
            nombre: datos.nombre,
            correo: datos.correo,
            rol: datos.rol,
            telefono: datos.telefono || null,
            profesionalId,
            especialidad: datos.rol === 'profesional' ? datos.especialidad : null,
            zona: datos.rol === 'profesional' ? datos.zona : null,
        };
        res.status(201).json({
            mensaje: 'La cuenta se creó correctamente.',
            token: (0, auth_1.crearToken)(usuario),
            usuario,
        });
    }
    catch (error) {
        await transaccion.rollback();
        throw error;
    }
}));
router.post('/login', (0, errores_1.asyncHandler)(async (req, res) => {
    const datos = (0, errores_1.validar)(esquemaLogin, req.body);
    const usuario = await buscarUsuarioPorCorreo(datos.correo);
    if (!usuario || !usuario.Activo) {
        throw new errores_1.ApiError(401, 'Correo o contraseña incorrectos.');
    }
    const coincide = await bcryptjs_1.default.compare(datos.contrasena, usuario.ContrasenaHash);
    if (!coincide) {
        throw new errores_1.ApiError(401, 'Correo o contraseña incorrectos.');
    }
    const publico = usuarioPublico(usuario);
    res.json({
        mensaje: 'Sesión iniciada correctamente.',
        token: (0, auth_1.crearToken)({
            id: publico.id,
            rol: publico.rol,
            nombre: publico.nombre,
            correo: publico.correo,
            profesionalId: publico.profesionalId,
        }),
        usuario: publico,
    });
}));
router.get('/me', auth_1.autenticar, (0, errores_1.asyncHandler)(async (req, res) => {
    const usuario = await buscarUsuarioPorCorreo(req.usuario.correo);
    if (!usuario)
        throw new errores_1.ApiError(404, 'La cuenta no existe.');
    res.json({ usuario: usuarioPublico(usuario) });
}));
router.get('/demo', (_req, res) => {
    res.json({
        cuentas: [
            { rol: 'cliente', correo: 'cliente@conectapro.com', contrasena: config_1.config.demoPassword },
            { rol: 'profesional', correo: 'martin@conectapro.com', contrasena: config_1.config.demoPassword },
        ],
        nota: 'Cuentas de demostración. No usar en producción.',
    });
});
exports.default = router;
//# sourceMappingURL=auth.js.map