"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const config_1 = require("./config");
const errores_1 = require("./middleware/errores");
const auth_1 = __importDefault(require("./routes/auth"));
const categorias_1 = __importDefault(require("./routes/categorias"));
const profesionales_1 = __importDefault(require("./routes/profesionales"));
const servicios_1 = __importDefault(require("./routes/servicios"));
const solicitudes_1 = __importDefault(require("./routes/solicitudes"));
const resenas_1 = __importDefault(require("./routes/resenas"));
const ia_1 = __importDefault(require("./routes/ia"));
const pagos_1 = __importDefault(require("./routes/pagos"));
const app = (0, express_1.default)();
app.disable('x-powered-by');
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
}));
app.use((0, cors_1.default)({
    origin(origen, callback) {
        if (!origen || config_1.config.corsOrigenes.includes(origen)) {
            callback(null, true);
            return;
        }
        callback(null, false);
    },
    credentials: false,
}));
app.use(express_1.default.json({ limit: '1mb' }));
const limiteGeneral = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes. Esperá unos minutos y volvé a intentar.' },
});
const limiteAuth = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    limit: 40,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Demasiados intentos de acceso. Esperá unos minutos y volvé a intentar.' },
});
const limiteIa = (0, express_rate_limit_1.rateLimit)({
    windowMs: 10 * 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Se alcanzó el límite de consultas de IA. Probá nuevamente en unos minutos.' },
});
app.get('/api/salud', (_req, res) => {
    res.json({
        estado: 'ok',
        servicio: 'ConectaPro API',
        version: '1.0.0',
        ia: config_1.config.ia.apiKey ? 'modelo' : 'local',
        fecha: new Date().toISOString(),
    });
});
app.use('/api', limiteGeneral);
app.use('/api/auth', limiteAuth, auth_1.default);
app.use('/api/categorias', categorias_1.default);
app.use('/api/profesionales', profesionales_1.default);
app.use('/api/servicios', servicios_1.default);
app.use('/api/solicitudes', solicitudes_1.default);
app.use('/api/resenas', resenas_1.default);
app.use('/api/pagos', pagos_1.default);
app.use('/api/ia', limiteIa, ia_1.default);
app.use('/api', errores_1.noEncontrado);
// En producción, el mismo servidor entrega la aplicación React compilada.
const dist = node_path_1.default.resolve(__dirname, '..', '..', 'dist');
if (node_fs_1.default.existsSync(dist)) {
    app.use(express_1.default.static(dist, { maxAge: '1h', index: false }));
    app.get('*', (_req, res) => {
        res.sendFile(node_path_1.default.join(dist, 'index.html'));
    });
}
else {
    app.use(errores_1.noEncontrado);
}
app.use(errores_1.manejadorErrores);
exports.default = app;
//# sourceMappingURL=app.js.map