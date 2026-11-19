"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearToken = crearToken;
exports.autenticar = autenticar;
exports.soloRol = soloRol;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const db_1 = require("../db");
const errores_1 = require("./errores");
function crearToken(usuario) {
    const payload = {
        sub: String(usuario.id),
        rol: usuario.rol,
        nombre: usuario.nombre,
        correo: usuario.correo,
        profesionalId: usuario.profesionalId,
    };
    return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.secreto, {
        expiresIn: config_1.config.jwt.expiracion,
    });
}
async function autenticar(req, _res, next) {
    try {
        const encabezado = req.headers.authorization;
        if (!encabezado?.startsWith('Bearer ')) {
            throw new errores_1.ApiError(401, 'Necesitás iniciar sesión para continuar.');
        }
        const token = encabezado.slice('Bearer '.length).trim();
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secreto);
        }
        catch {
            throw new errores_1.ApiError(401, 'La sesión venció o el token no es válido.');
        }
        const usuarios = await (0, db_1.consultar)(`SELECT u.UsuarioId, u.Nombre, u.Correo, u.Rol, p.ProfesionalId, u.Activo
       FROM dbo.Usuarios u
       LEFT JOIN dbo.Profesionales p ON p.UsuarioId = u.UsuarioId
       WHERE u.UsuarioId = @id`, { id: Number(payload.sub) });
        const usuario = usuarios[0];
        if (!usuario || !usuario.Activo) {
            throw new errores_1.ApiError(401, 'La cuenta no existe o está deshabilitada.');
        }
        req.usuario = {
            id: usuario.UsuarioId,
            rol: usuario.Rol,
            nombre: usuario.Nombre,
            correo: usuario.Correo,
            profesionalId: usuario.ProfesionalId,
        };
        next();
    }
    catch (error) {
        next(error);
    }
}
function soloRol(...roles) {
    return (req, _res, next) => {
        if (!req.usuario) {
            next(new errores_1.ApiError(401, 'Necesitás iniciar sesión para continuar.'));
            return;
        }
        if (!roles.includes(req.usuario.rol)) {
            next(new errores_1.ApiError(403, 'Tu rol no tiene permiso para realizar esta operación.'));
            return;
        }
        next();
    };
}
//# sourceMappingURL=auth.js.map