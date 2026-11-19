"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const db_1 = require("./db");
async function iniciar() {
    try {
        await (0, db_1.getPool)();
        console.log(`[db] Conectado a SQL Server: ${config_1.config.db.servidor}/${config_1.config.db.nombre}`);
    }
    catch (error) {
        console.error('[db] No se pudo conectar a SQL Server.');
        console.error(`[db] Verificá ${config_1.config.db.servidor}/${config_1.config.db.nombre} y ejecutá "npm run setup:db".`);
        console.error(`[db] Detalle: ${error.message}`);
        process.exitCode = 1;
        return;
    }
    app_1.default.listen(config_1.config.puerto, () => {
        console.log(`[api] ConectaPro disponible en http://localhost:${config_1.config.puerto}`);
        console.log(`[api] IA: ${config_1.config.ia.apiKey ? `modelo ${config_1.config.ia.modelo}` : 'motor local (sin clave externa)'}`);
        console.log(`[api] Entorno: ${config_1.config.entorno}`);
    });
}
const apagar = async (senal) => {
    console.log(`\n[api] Cerrando por ${senal}...`);
    await (0, db_1.cerrarPool)().catch(() => undefined);
    process.exit(0);
};
process.on('SIGINT', () => void apagar('SIGINT'));
process.on('SIGTERM', () => void apagar('SIGTERM'));
void iniciar();
//# sourceMappingURL=index.js.map