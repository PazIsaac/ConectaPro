"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
require("dotenv/config");
function bool(valor, porDefecto) {
    if (valor === undefined || valor === '')
        return porDefecto;
    return ['1', 'true', 'yes', 'si', 'sí'].includes(valor.toLowerCase());
}
function numero(valor, porDefecto) {
    const parseado = Number(valor);
    return Number.isFinite(parseado) ? parseado : porDefecto;
}
const jwtSecret = process.env.JWT_SECRET || 'conectapro-dev-secret-cambiar';
if (process.env.NODE_ENV === 'production' && jwtSecret.includes('cambiar')) {
    throw new Error('Configurá JWT_SECRET con un valor seguro antes de iniciar en producción.');
}
exports.config = {
    puerto: numero(process.env.PORT, 4000),
    entorno: process.env.NODE_ENV || 'development',
    corsOrigenes: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
        .split(',')
        .map((origen) => origen.trim())
        .filter(Boolean),
    jwt: {
        secreto: jwtSecret,
        expiracion: process.env.JWT_EXPIRA || '8h',
    },
    db: {
        servidor: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
        nombre: process.env.DB_NAME || 'ConectaPro',
        trusted: bool(process.env.DB_TRUSTED, true),
        usuario: process.env.DB_USER || '',
        contrasena: process.env.DB_PASSWORD || '',
        encriptar: bool(process.env.DB_ENCRYPT, false),
        confiarCertificado: bool(process.env.DB_TRUST_SERVER_CERTIFICATE, true),
    },
    ia: {
        apiKey: process.env.IA_API_KEY || process.env.OPENAI_API_KEY || '',
        baseUrl: (process.env.IA_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, ''),
        modelo: process.env.IA_MODEL || 'gpt-4o-mini',
        timeoutMs: numero(process.env.IA_TIMEOUT_MS, 20_000),
    },
    demoPassword: process.env.DEMO_PASSWORD || 'Demo1234!',
};
//# sourceMappingURL=config.js.map