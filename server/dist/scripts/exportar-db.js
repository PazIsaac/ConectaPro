"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Genera una copia portable de la base de datos (esquema + datos) en
 * `database/backup/ConectaPro_completa.sql`.
 *
 * El archivo resultante se puede ejecutar con SSMS o sqlcmd sobre cualquier
 * instancia de SQL Server 2019 o superior. Es idempotente: crea la base y las
 * tablas que falten y solo inserta las filas cuyas claves todavía no existen,
 * por lo que se puede volver a importar sin duplicar registros.
 *
 * Uso: npm run export:db
 */
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const config_1 = require("../config");
const db_1 = require("../db");
const RUTA_DATABASE = node_path_1.default.resolve(__dirname, '../../../database');
const RUTA_ESQUEMA = node_path_1.default.join(RUTA_DATABASE, '01_schema.sql');
const RUTA_SALIDA = node_path_1.default.join(RUTA_DATABASE, 'backup', 'ConectaPro_completa.sql');
// Ordenadas según sus dependencias de claves foráneas.
const ORDEN_TABLAS = [
    'Categorias',
    'Usuarios',
    'Profesionales',
    'Servicios',
    'Solicitudes',
    'Resenas',
    'Pagos',
    'IaConsultas',
];
const TIPOS_FECHA = /^(date|datetime|datetime2|smalldatetime|time|datetimeoffset)$/i;
const TIPOS_NUMERICOS = /^(decimal|numeric|money|smallmoney|float|real)$/i;
function dosDigitos(valor) {
    return String(valor).padStart(2, '0');
}
function formatearFecha(fecha) {
    return [
        `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`,
        `${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}:${dosDigitos(fecha.getSeconds())}`,
    ].join('T');
}
function escaparTexto(valor) {
    return valor.replace(/'/g, "''");
}
function literal(valor, tipo) {
    if (valor === null || valor === undefined)
        return 'NULL';
    if (Buffer.isBuffer(valor))
        return `0x${valor.toString('hex')}`;
    if (valor instanceof Date)
        return `'${formatearFecha(valor)}'`;
    if (typeof valor === 'boolean')
        return valor ? '1' : '0';
    if (typeof valor === 'number')
        return Number.isFinite(valor) ? String(valor) : 'NULL';
    const texto = String(valor);
    if (TIPOS_FECHA.test(tipo))
        return `'${escaparTexto(texto)}'`;
    if (TIPOS_NUMERICOS.test(tipo))
        return texto;
    return `N'${escaparTexto(texto)}'`;
}
function seleccionarColumna(columna) {
    // Las fechas se convierten a texto ISO para conservar el valor exacto y
    // evitar desfases por zona horaria al generar el script.
    if (TIPOS_FECHA.test(columna.tipo)) {
        return `CONVERT(varchar(23), [${columna.columna}], 126) AS [${columna.columna}]`;
    }
    return `[${columna.columna}]`;
}
async function main() {
    if (!/^[A-Za-z0-9_]+$/.test(config_1.config.db.nombre)) {
        throw new Error('DB_NAME solo puede contener letras, números y guiones bajos.');
    }
    const pool = (0, db_1.crearPool)(config_1.config.db.nombre);
    await pool.connect();
    try {
        const existentes = await pool.request().query("SELECT name AS tabla FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') ORDER BY name");
        const nombres = existentes.recordset.map((fila) => fila.tabla);
        const desconocidas = nombres.filter((nombre) => !ORDEN_TABLAS.includes(nombre));
        if (desconocidas.length > 0) {
            throw new Error(`Hay tablas sin orden de exportación: ${desconocidas.join(', ')}. Actualizá ORDEN_TABLAS.`);
        }
        const esquema = node_fs_1.default.readFileSync(RUTA_ESQUEMA, 'utf8').replace(/^\uFEFF/, '').trim();
        const partes = [
            '/* ============================================================',
            '   ConectaPro - Copia completa de la base de datos',
            '   Esquema + datos demo generados con npm run export:db',
            `   Generado: ${new Date().toISOString()}`,
            '',
            '   Uso: abrir en SSMS o ejecutar con sqlcmd sobre una instancia',
            '   de SQL Server 2019 o superior. El script crea la base',
            `   ${config_1.config.db.nombre} si no existe y solo inserta las filas que`,
            '   todavía no están presentes, así que se puede reejecutar sin',
            '   duplicar registros ni sobrescribir cambios locales.',
            '',
            '   ADVERTENCIA: contiene datos de demostración, incluidos los',
            '   hashes de las cuentas demo. No usar en producción.',
            '   ============================================================ */',
            '',
            `IF DB_ID(N'${config_1.config.db.nombre}') IS NULL`,
            'BEGIN',
            `    PRINT N'Creando la base ${config_1.config.db.nombre}...';`,
            `    EXEC(N'CREATE DATABASE [${config_1.config.db.nombre}]');`,
            'END;',
            'GO',
            '',
            `USE [${config_1.config.db.nombre}];`,
            'GO',
            '',
            '/* -------------------- Esquema -------------------- */',
            esquema,
            'GO',
            '',
            '/* -------------------- Datos -------------------- */',
            'SET NOCOUNT ON;',
            'GO',
            '',
        ];
        let totalFilas = 0;
        for (const tabla of ORDEN_TABLAS) {
            const columnas = (await pool
                .request()
                .input('objeto', db_1.sql.NVarChar(256), `dbo.${tabla}`)
                .query(`SELECT c.name AS columna, t.name AS tipo,
                    c.is_identity AS identidad, c.is_nullable AS nulable
             FROM sys.columns c
             INNER JOIN sys.types t ON t.user_type_id = c.user_type_id
             WHERE c.object_id = OBJECT_ID(@objeto)
             ORDER BY c.column_id`)).recordset;
            if (columnas.length === 0)
                continue;
            const claves = (await pool
                .request()
                .input('objeto', db_1.sql.NVarChar(256), `dbo.${tabla}`)
                .query(`SELECT c.name AS columna
             FROM sys.indexes i
             INNER JOIN sys.index_columns ic
               ON ic.object_id = i.object_id AND ic.index_id = i.index_id
             INNER JOIN sys.columns c
               ON c.object_id = ic.object_id AND c.column_id = ic.column_id
             WHERE i.is_primary_key = 1 AND i.object_id = OBJECT_ID(@objeto)
             ORDER BY ic.key_ordinal`)).recordset.map((fila) => fila.columna);
            const orden = claves.length > 0 ? `ORDER BY ${claves.map((c) => `[${c}]`).join(', ')}` : '';
            const filas = (await pool
                .request()
                .query(`SELECT ${columnas.map(seleccionarColumna).join(', ')} FROM dbo.[${tabla}] ${orden}`)).recordset;
            totalFilas += filas.length;
            if (filas.length === 0)
                continue;
            const identidad = columnas.find((columna) => columna.identidad);
            const listaColumnas = columnas.map((columna) => `[${columna.columna}]`).join(', ');
            partes.push(`/* ---- dbo.${tabla} (${filas.length} filas) ---- */`);
            partes.push(`PRINT N'Insertando datos en dbo.${tabla}...';`);
            if (identidad)
                partes.push(`SET IDENTITY_INSERT dbo.[${tabla}] ON;`);
            for (const fila of filas) {
                const valores = columnas.map((columna) => literal(fila[columna.columna], columna.tipo));
                const condicion = claves.length > 0
                    ? claves
                        .map((clave) => {
                        const columna = columnas.find((item) => item.columna === clave);
                        const tipo = columna ? columna.tipo : '';
                        return `[${clave}] = ${literal(fila[clave], tipo)}`;
                    })
                        .join(' AND ')
                    : columnas
                        .map((columna) => `[${columna.columna}] = ${literal(fila[columna.columna], columna.tipo)}`)
                        .join(' AND ');
                partes.push(`IF NOT EXISTS (SELECT 1 FROM dbo.[${tabla}] WHERE ${condicion})`);
                partes.push(`    INSERT INTO dbo.[${tabla}] (${listaColumnas}) VALUES (${valores.join(', ')});`);
            }
            if (identidad)
                partes.push(`SET IDENTITY_INSERT dbo.[${tabla}] OFF;`);
            if (identidad)
                partes.push(`DBCC CHECKIDENT (N'dbo.${tabla}', RESEED);`);
            partes.push('GO');
            partes.push('');
            console.log(`[export] dbo.${tabla}: ${filas.length} filas`);
        }
        partes.push('/* -------------------- Verificación -------------------- */');
        partes.push('PRINT N\'Copia importada. Resumen de filas:\';');
        partes.push(`SELECT 'Categorias' AS Tabla, COUNT(*) AS Filas FROM dbo.Categorias
       UNION ALL SELECT 'Usuarios', COUNT(*) FROM dbo.Usuarios
       UNION ALL SELECT 'Profesionales', COUNT(*) FROM dbo.Profesionales
       UNION ALL SELECT 'Servicios', COUNT(*) FROM dbo.Servicios
       UNION ALL SELECT 'Solicitudes', COUNT(*) FROM dbo.Solicitudes
       UNION ALL SELECT 'Resenas', COUNT(*) FROM dbo.Resenas
       UNION ALL SELECT 'Pagos', COUNT(*) FROM dbo.Pagos
       UNION ALL SELECT 'IaConsultas', COUNT(*) FROM dbo.IaConsultas;`);
        partes.push('GO');
        partes.push('');
        node_fs_1.default.mkdirSync(node_path_1.default.dirname(RUTA_SALIDA), { recursive: true });
        // BOM para que SSMS y sqlcmd interpreten correctamente los acentos y emojis.
        node_fs_1.default.writeFileSync(RUTA_SALIDA, `\uFEFF${partes.join('\n')}`, 'utf8');
        console.log('');
        console.log(`[export] Copia generada: ${RUTA_SALIDA}`);
        console.log(`[export] Filas exportadas: ${totalFilas}`);
    }
    finally {
        await pool.close();
    }
}
main().catch((error) => {
    console.error('[export] Error:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
//# sourceMappingURL=exportar-db.js.map