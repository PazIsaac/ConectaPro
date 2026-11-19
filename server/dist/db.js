"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sql = void 0;
exports.crearPool = crearPool;
exports.getPool = getPool;
exports.consultar = consultar;
exports.ejecutar = ejecutar;
exports.cerrarPool = cerrarPool;
const config_1 = require("./config");
// Con autenticación de Windows se utiliza el controlador ODBC nativo.
// Con autenticación SQL se utiliza el driver pure-JS (tedious), sin dependencias nativas.
const sql = config_1.config.db.trusted
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('mssql/msnodesqlv8')
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('mssql');
exports.sql = sql;
const DRIVER = process.env.DB_DRIVER || 'ODBC Driver 18 for SQL Server';
function cadenaConexion(baseDatos) {
    const partes = [
        `Driver={${DRIVER}}`,
        `Server=${config_1.config.db.servidor}`,
        `Database=${baseDatos}`,
        `TrustServerCertificate=${config_1.config.db.confiarCertificado ? 'yes' : 'no'}`,
        `Encrypt=${config_1.config.db.encriptar ? 'yes' : 'no'}`,
    ];
    if (config_1.config.db.trusted) {
        partes.push('Trusted_Connection=yes');
    }
    else {
        partes.push(`User Id=${config_1.config.db.usuario}`, `Password=${config_1.config.db.contrasena}`);
    }
    return `${partes.join(';')};`;
}
function crearPool(baseDatos) {
    if (config_1.config.db.trusted) {
        // msnodesqlv8 recibe la cadena ODBC completa. El tipo de @types/mssql no
        // declara la propiedad de nivel superior, pero el driver la admite.
        return new sql.ConnectionPool({
            connectionString: cadenaConexion(baseDatos),
            pool: { max: 10, min: 0, idleTimeoutMillis: 30_000 },
        });
    }
    return new sql.ConnectionPool({
        server: config_1.config.db.servidor,
        database: baseDatos,
        user: config_1.config.db.usuario,
        password: config_1.config.db.contrasena,
        options: {
            encrypt: config_1.config.db.encriptar,
            trustServerCertificate: config_1.config.db.confiarCertificado,
        },
        pool: { max: 10, min: 0, idleTimeoutMillis: 30_000 },
    });
}
let poolPromesa = null;
function getPool() {
    if (poolPromesa)
        return poolPromesa;
    const pool = crearPool(config_1.config.db.nombre);
    poolPromesa = pool.connect().catch((error) => {
        poolPromesa = null;
        throw error;
    });
    return poolPromesa;
}
function agregarParametros(request, parametros) {
    for (const [nombre, valor] of Object.entries(parametros)) {
        request.input(nombre, valor);
    }
}
/** Ejecuta una consulta SELECT y devuelve las filas. */
async function consultar(texto, parametros = {}) {
    const pool = await getPool();
    const request = pool.request();
    agregarParametros(request, parametros);
    const resultado = await request.query(texto);
    return resultado.recordset;
}
/** Ejecuta una sentencia de escritura y devuelve las filas afectadas. */
async function ejecutar(texto, parametros = {}) {
    const pool = await getPool();
    const request = pool.request();
    agregarParametros(request, parametros);
    const resultado = await request.query(texto);
    return resultado.rowsAffected.reduce((total, filas) => total + filas, 0);
}
async function cerrarPool() {
    if (!poolPromesa)
        return;
    const pool = await poolPromesa;
    await pool.close();
    poolPromesa = null;
}
//# sourceMappingURL=db.js.map