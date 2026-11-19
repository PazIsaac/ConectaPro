/* ============================================================
   ConectaPro - Copia completa de la base de datos
   Esquema + datos demo generados con npm run export:db
   Generado: 2026-11-13T20:16:51.205Z

   Uso: abrir en SSMS o ejecutar con sqlcmd sobre una instancia
   de SQL Server 2019 o superior. El script crea la base
   ConectaPro si no existe y solo inserta las filas que
   todavía no están presentes, así que se puede reejecutar sin
   duplicar registros ni sobrescribir cambios locales.

   ADVERTENCIA: contiene datos de demostración, incluidos los
   hashes de las cuentas demo. No usar en producción.
   ============================================================ */

IF DB_ID(N'ConectaPro') IS NULL
BEGIN
    PRINT N'Creando la base ConectaPro...';
    EXEC(N'CREATE DATABASE [ConectaPro]');
END;
GO

USE [ConectaPro];
GO

/* -------------------- Esquema -------------------- */
/* ============================================================
   ConectaPro - Esquema de base de datos para SQL Server
   Ejecutar sobre una base existente (por ejemplo ConectaPro).
   El script es idempotente: solo crea objetos que no existen.
   ============================================================ */

IF OBJECT_ID('dbo.Usuarios', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Usuarios (
        UsuarioId       INT IDENTITY(1,1) NOT NULL,
        Nombre          NVARCHAR(120) NOT NULL,
        Correo          NVARCHAR(150) NOT NULL,
        ContrasenaHash  NVARCHAR(255) NOT NULL,
        Rol             NVARCHAR(20) NOT NULL,
        Telefono        NVARCHAR(40) NULL,
        FechaRegistro   DATETIME2(0) NOT NULL CONSTRAINT DF_Usuarios_FechaRegistro DEFAULT SYSUTCDATETIME(),
        Activo          BIT NOT NULL CONSTRAINT DF_Usuarios_Activo DEFAULT 1,
        CONSTRAINT PK_Usuarios PRIMARY KEY (UsuarioId),
        CONSTRAINT UQ_Usuarios_Correo UNIQUE (Correo),
        CONSTRAINT CK_Usuarios_Rol CHECK (Rol IN ('cliente', 'profesional'))
    );
END;
GO

IF OBJECT_ID('dbo.Profesionales', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Profesionales (
        ProfesionalId       INT IDENTITY(1,1) NOT NULL,
        UsuarioId           INT NOT NULL,
        Especialidad        NVARCHAR(120) NOT NULL,
        Descripcion         NVARCHAR(1000) NOT NULL CONSTRAINT DF_Profesionales_Descripcion DEFAULT '',
        Zona                NVARCHAR(120) NOT NULL CONSTRAINT DF_Profesionales_Zona DEFAULT '',
        AniosExperiencia    INT NOT NULL CONSTRAINT DF_Profesionales_Experiencia DEFAULT 0,
        TarifaReferencia    NVARCHAR(80) NULL,
        Disponible          BIT NOT NULL CONSTRAINT DF_Profesionales_Disponible DEFAULT 1,
        Verificado          BIT NOT NULL CONSTRAINT DF_Profesionales_Verificado DEFAULT 0,
        FechaAlta           DATETIME2(0) NOT NULL CONSTRAINT DF_Profesionales_FechaAlta DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_Profesionales PRIMARY KEY (ProfesionalId),
        CONSTRAINT UQ_Profesionales_Usuario UNIQUE (UsuarioId),
        CONSTRAINT FK_Profesionales_Usuarios FOREIGN KEY (UsuarioId) REFERENCES dbo.Usuarios (UsuarioId),
        CONSTRAINT CK_Profesionales_Experiencia CHECK (AniosExperiencia >= 0)
    );
END;
GO

IF OBJECT_ID('dbo.Categorias', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Categorias (
        CategoriaId   INT IDENTITY(1,1) NOT NULL,
        Nombre        NVARCHAR(80) NOT NULL,
        Descripcion   NVARCHAR(300) NOT NULL,
        Icono         NVARCHAR(20) NOT NULL CONSTRAINT DF_Categorias_Icono DEFAULT N'🛠️',
        Orden         INT NOT NULL CONSTRAINT DF_Categorias_Orden DEFAULT 0,
        Activa        BIT NOT NULL CONSTRAINT DF_Categorias_Activa DEFAULT 1,
        CONSTRAINT PK_Categorias PRIMARY KEY (CategoriaId),
        CONSTRAINT UQ_Categorias_Nombre UNIQUE (Nombre)
    );
END;
GO

IF OBJECT_ID('dbo.Servicios', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Servicios (
        ServicioId          INT IDENTITY(1,1) NOT NULL,
        ProfesionalId       INT NOT NULL,
        CategoriaId         INT NOT NULL,
        Nombre              NVARCHAR(120) NOT NULL,
        Descripcion         NVARCHAR(1000) NOT NULL,
        PrecioReferencia    NVARCHAR(80) NULL,
        Zona                NVARCHAR(120) NULL,
        Disponible          BIT NOT NULL CONSTRAINT DF_Servicios_Disponible DEFAULT 1,
        Modalidad           NVARCHAR(30) NOT NULL CONSTRAINT DF_Servicios_Modalidad DEFAULT N'A domicilio',
        Activo              BIT NOT NULL CONSTRAINT DF_Servicios_Activo DEFAULT 1,
        FechaCreacion       DATETIME2(0) NOT NULL CONSTRAINT DF_Servicios_FechaCreacion DEFAULT SYSUTCDATETIME(),
        FechaActualizacion  DATETIME2(0) NOT NULL CONSTRAINT DF_Servicios_FechaActualizacion DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_Servicios PRIMARY KEY (ServicioId),
        CONSTRAINT FK_Servicios_Profesionales FOREIGN KEY (ProfesionalId) REFERENCES dbo.Profesionales (ProfesionalId),
        CONSTRAINT FK_Servicios_Categorias FOREIGN KEY (CategoriaId) REFERENCES dbo.Categorias (CategoriaId),
        CONSTRAINT CK_Servicios_Modalidad CHECK (Modalidad IN (N'A domicilio', N'En taller', N'Remoto', N'Mixta'))
    );
END;
GO

/* Migración idempotente para bases creadas con una versión anterior.
   La zona y la disponibilidad se guardan en el servicio para que cada
   publicación pueda tener su propio alcance. */
IF COL_LENGTH('dbo.Servicios', 'Zona') IS NULL
BEGIN
    ALTER TABLE dbo.Servicios ADD Zona NVARCHAR(120) NULL;
END;
GO

IF COL_LENGTH('dbo.Servicios', 'Disponible') IS NULL
BEGIN
    ALTER TABLE dbo.Servicios ADD Disponible BIT NOT NULL
        CONSTRAINT DF_Servicios_Disponible DEFAULT 1;
END;
GO

IF OBJECT_ID('dbo.Solicitudes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Solicitudes (
        SolicitudId         INT IDENTITY(1,1) NOT NULL,
        ClienteId           INT NOT NULL,
        ProfesionalId       INT NOT NULL,
        ServicioId          INT NULL,
        Mensaje             NVARCHAR(1000) NOT NULL,
        Estado              NVARCHAR(20) NOT NULL CONSTRAINT DF_Solicitudes_Estado DEFAULT N'pendiente',
        FechaCreacion       DATETIME2(0) NOT NULL CONSTRAINT DF_Solicitudes_FechaCreacion DEFAULT SYSUTCDATETIME(),
        FechaActualizacion  DATETIME2(0) NOT NULL CONSTRAINT DF_Solicitudes_FechaActualizacion DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_Solicitudes PRIMARY KEY (SolicitudId),
        CONSTRAINT FK_Solicitudes_Clientes FOREIGN KEY (ClienteId) REFERENCES dbo.Usuarios (UsuarioId),
        CONSTRAINT FK_Solicitudes_Profesionales FOREIGN KEY (ProfesionalId) REFERENCES dbo.Profesionales (ProfesionalId),
        CONSTRAINT FK_Solicitudes_Servicios FOREIGN KEY (ServicioId) REFERENCES dbo.Servicios (ServicioId),
        CONSTRAINT CK_Solicitudes_Estado CHECK (Estado IN (N'pendiente', N'aceptada', N'rechazada', N'finalizada'))
    );
END;
GO

IF OBJECT_ID('dbo.Resenas', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Resenas (
        ResenaId        INT IDENTITY(1,1) NOT NULL,
        ProfesionalId   INT NOT NULL,
        ClienteId       INT NOT NULL,
        Puntuacion      TINYINT NOT NULL,
        Comentario      NVARCHAR(1000) NOT NULL,
        FechaCreacion   DATETIME2(0) NOT NULL CONSTRAINT DF_Resenas_FechaCreacion DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_Resenas PRIMARY KEY (ResenaId),
        CONSTRAINT FK_Resenas_Profesionales FOREIGN KEY (ProfesionalId) REFERENCES dbo.Profesionales (ProfesionalId),
        CONSTRAINT FK_Resenas_Clientes FOREIGN KEY (ClienteId) REFERENCES dbo.Usuarios (UsuarioId),
        CONSTRAINT CK_Resenas_Puntuacion CHECK (Puntuacion BETWEEN 1 AND 5),
        CONSTRAINT UQ_Resenas_Cliente_Profesional UNIQUE (ClienteId, ProfesionalId)
    );
END;
GO

IF OBJECT_ID('dbo.Pagos', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Pagos (
        PagoId              INT IDENTITY(1,1) NOT NULL,
        SolicitudId         INT NOT NULL,
        ClienteId           INT NOT NULL,
        Monto               DECIMAL(12,2) NOT NULL,
        Moneda              CHAR(3) NOT NULL CONSTRAINT DF_Pagos_Moneda DEFAULT 'ARS',
        Estado              NVARCHAR(20) NOT NULL CONSTRAINT DF_Pagos_Estado DEFAULT N'aprobado',
        Marca               NVARCHAR(30) NOT NULL,
        Ultimos4            CHAR(4) NOT NULL,
        Titular             NVARCHAR(120) NOT NULL,
        VencimientoMes      TINYINT NOT NULL,
        VencimientoAnio     SMALLINT NOT NULL,
        Referencia          NVARCHAR(40) NOT NULL,
        FechaCreacion       DATETIME2(0) NOT NULL CONSTRAINT DF_Pagos_FechaCreacion DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_Pagos PRIMARY KEY (PagoId),
        CONSTRAINT UQ_Pagos_Solicitud UNIQUE (SolicitudId),
        CONSTRAINT UQ_Pagos_Referencia UNIQUE (Referencia),
        CONSTRAINT FK_Pagos_Solicitudes FOREIGN KEY (SolicitudId) REFERENCES dbo.Solicitudes (SolicitudId),
        CONSTRAINT FK_Pagos_Clientes FOREIGN KEY (ClienteId) REFERENCES dbo.Usuarios (UsuarioId),
        CONSTRAINT CK_Pagos_Monto CHECK (Monto > 0),
        CONSTRAINT CK_Pagos_Estado CHECK (Estado IN (N'aprobado', N'rechazado', N'pendiente')),
        CONSTRAINT CK_Pagos_Vencimiento CHECK (VencimientoMes BETWEEN 1 AND 12 AND VencimientoAnio BETWEEN 2020 AND 2100)
    );
END;
GO

IF OBJECT_ID('dbo.IaConsultas', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.IaConsultas (
        ConsultaId      INT IDENTITY(1,1) NOT NULL,
        UsuarioId       INT NULL,
        Tipo            NVARCHAR(40) NOT NULL,
        Entrada         NVARCHAR(1000) NOT NULL,
        Salida          NVARCHAR(2000) NOT NULL,
        Proveedor       NVARCHAR(40) NOT NULL,
        FechaCreacion   DATETIME2(0) NOT NULL CONSTRAINT DF_IaConsultas_FechaCreacion DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_IaConsultas PRIMARY KEY (ConsultaId),
        CONSTRAINT FK_IaConsultas_Usuarios FOREIGN KEY (UsuarioId) REFERENCES dbo.Usuarios (UsuarioId)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Servicios_Profesional' AND object_id = OBJECT_ID('dbo.Servicios'))
    CREATE INDEX IX_Servicios_Profesional ON dbo.Servicios (ProfesionalId, Activo) INCLUDE (CategoriaId);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Servicios_Categoria' AND object_id = OBJECT_ID('dbo.Servicios'))
    CREATE INDEX IX_Servicios_Categoria ON dbo.Servicios (CategoriaId, Activo);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Servicios_Disponibilidad' AND object_id = OBJECT_ID('dbo.Servicios'))
    CREATE INDEX IX_Servicios_Disponibilidad ON dbo.Servicios (Activo, Disponible, CategoriaId) INCLUDE (Zona);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Solicitudes_Cliente' AND object_id = OBJECT_ID('dbo.Solicitudes'))
    CREATE INDEX IX_Solicitudes_Cliente ON dbo.Solicitudes (ClienteId, FechaCreacion DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Solicitudes_Profesional' AND object_id = OBJECT_ID('dbo.Solicitudes'))
    CREATE INDEX IX_Solicitudes_Profesional ON dbo.Solicitudes (ProfesionalId, FechaCreacion DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Resenas_Profesional' AND object_id = OBJECT_ID('dbo.Resenas'))
    CREATE INDEX IX_Resenas_Profesional ON dbo.Resenas (ProfesionalId, FechaCreacion DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Pagos_Cliente' AND object_id = OBJECT_ID('dbo.Pagos'))
    CREATE INDEX IX_Pagos_Cliente ON dbo.Pagos (ClienteId, FechaCreacion DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Pagos_Estado' AND object_id = OBJECT_ID('dbo.Pagos'))
    CREATE INDEX IX_Pagos_Estado ON dbo.Pagos (Estado, FechaCreacion DESC);
GO
GO

/* -------------------- Datos -------------------- */
SET NOCOUNT ON;
GO

/* ---- dbo.Categorias (9 filas) ---- */
PRINT N'Insertando datos en dbo.Categorias...';
SET IDENTITY_INSERT dbo.[Categorias] ON;
IF NOT EXISTS (SELECT 1 FROM dbo.[Categorias] WHERE [CategoriaId] = 1)
    INSERT INTO dbo.[Categorias] ([CategoriaId], [Nombre], [Descripcion], [Icono], [Orden], [Activa]) VALUES (1, N'Electricidad', N'Instalaciones, reparaciones y urgencias eléctricas.', N'⚡', 1, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[Categorias] WHERE [CategoriaId] = 2)
    INSERT INTO dbo.[Categorias] ([CategoriaId], [Nombre], [Descripcion], [Icono], [Orden], [Activa]) VALUES (2, N'Plomería', N'Pérdidas de agua, cañerías, grifería y termotanques.', N'🔧', 2, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[Categorias] WHERE [CategoriaId] = 3)
    INSERT INTO dbo.[Categorias] ([CategoriaId], [Nombre], [Descripcion], [Icono], [Orden], [Activa]) VALUES (3, N'Albañilería', N'Obras, refacciones, muros, pisos y revoques.', N'🧱', 3, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[Categorias] WHERE [CategoriaId] = 4)
    INSERT INTO dbo.[Categorias] ([CategoriaId], [Nombre], [Descripcion], [Icono], [Orden], [Activa]) VALUES (4, N'Pintura', N'Pintura de interiores y exteriores, enduido y humedad.', N'🎨', 4, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[Categorias] WHERE [CategoriaId] = 5)
    INSERT INTO dbo.[Categorias] ([CategoriaId], [Nombre], [Descripcion], [Icono], [Orden], [Activa]) VALUES (5, N'Informática', N'Reparación de computadoras, redes y soporte técnico.', N'💻', 5, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[Categorias] WHERE [CategoriaId] = 6)
    INSERT INTO dbo.[Categorias] ([CategoriaId], [Nombre], [Descripcion], [Icono], [Orden], [Activa]) VALUES (6, N'Cerrajería', N'Aperturas, cerraduras, llaves y seguridad.', N'🔑', 6, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[Categorias] WHERE [CategoriaId] = 7)
    INSERT INTO dbo.[Categorias] ([CategoriaId], [Nombre], [Descripcion], [Icono], [Orden], [Activa]) VALUES (7, N'Jardinería', N'Poda, césped, riego y mantenimiento de jardines.', N'🌿', 7, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[Categorias] WHERE [CategoriaId] = 8)
    INSERT INTO dbo.[Categorias] ([CategoriaId], [Nombre], [Descripcion], [Icono], [Orden], [Activa]) VALUES (8, N'Reparación de electrodomésticos', N'Heladeras, lavarropas, hornos y microondas.', N'🔌', 8, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[Categorias] WHERE [CategoriaId] = 9)
    INSERT INTO dbo.[Categorias] ([CategoriaId], [Nombre], [Descripcion], [Icono], [Orden], [Activa]) VALUES (9, N'Nerd', N'Consolas, videojuegos, joysticks, PC gamer y máquinas arcade.', N'🎮', 9, 1);
SET IDENTITY_INSERT dbo.[Categorias] OFF;
DBCC CHECKIDENT (N'dbo.Categorias', RESEED);
GO

/* ---- dbo.Usuarios (12 filas) ---- */
PRINT N'Insertando datos en dbo.Usuarios...';
SET IDENTITY_INSERT dbo.[Usuarios] ON;
IF NOT EXISTS (SELECT 1 FROM dbo.[Usuarios] WHERE [UsuarioId] = 1)
    INSERT INTO dbo.[Usuarios] ([UsuarioId], [Nombre], [Correo], [ContrasenaHash], [Rol], [Telefono], [FechaRegistro], [Activo]) VALUES (1, N'Luana Ríos', N'cliente@conectapro.com', N'$2b$12$eIYKs27TraFuh6Qx5aq8LeYSXK5J8k0aZ3wbi2jla/qGBS5OvVdw2', N'cliente', N'11 5555-0101', '2026-10-29T20:38:57', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[Usuarios] WHERE [UsuarioId] = 2)
    INSERT INTO dbo.[Usuarios] ([UsuarioId], [Nombre], [Correo], [ContrasenaHash], [Rol], [Telefono], [FechaRegistro], [Activo]) VALUES (2, N'Sofía Benítez', N'sofia@conectapro.com', N'$2b$12$eIYKs27TraFuh6Qx5aq8LeYSXK5J8k0aZ3wbi2jla/qGBS5OvVdw2', N'cliente', N'11 5555-0102', '2026-10-29T20:38:57', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[Usuarios] WHERE [UsuarioId] = 3)
    INSERT INTO dbo.[Usuarios] ([UsuarioId], [Nombre], [Correo], [ContrasenaHash], [Rol], [Telefono], [FechaRegistro], [Activo]) VALUES (3, N'Bruno Álvarez', N'bruno@conectapro.com', N'$2b$12$eIYKs27TraFuh6Qx5aq8LeYSXK5J8k0aZ3wbi2jla/qGBS5OvVdw2', N'cliente', N'11 5555-0103', '2026-10-29T20:38:57', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[Usuarios] WHERE [UsuarioId] = 4)
    INSERT INTO dbo.[Usuarios] ([UsuarioId], [Nombre], [Correo], [ContrasenaHash], [Rol], [Telefono], [FechaRegistro], [Activo]) VALUES (4, N'Martín Rodríguez', N'martin@conectapro.com', N'$2b$12$eIYKs27TraFuh6Qx5aq8LeYSXK5J8k0aZ3wbi2jla/qGBS5OvVdw2', N'profesional', N'11 5555-0201', '2026-10-29T20:38:57', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[Usuarios] WHERE [UsuarioId] = 5)
    INSERT INTO dbo.[Usuarios] ([UsuarioId], [Nombre], [Correo], [ContrasenaHash], [Rol], [Telefono], [FechaRegistro], [Activo]) VALUES (5, N'Lucía Fernández', N'lucia@conectapro.com', N'$2b$12$eIYKs27TraFuh6Qx5aq8LeYSXK5J8k0aZ3wbi2jla/qGBS5OvVdw2', N'profesional', N'11 5555-0202', '2026-10-29T20:38:57', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[Usuarios] WHERE [UsuarioId] = 6)
    INSERT INTO dbo.[Usuarios] ([UsuarioId], [Nombre], [Correo], [ContrasenaHash], [Rol], [Telefono], [FechaRegistro], [Activo]) VALUES (6, N'Santiago Gómez', N'santiago@conectapro.com', N'$2b$12$eIYKs27TraFuh6Qx5aq8LeYSXK5J8k0aZ3wbi2jla/qGBS5OvVdw2', N'profesional', N'11 5555-0203', '2026-10-29T20:38:57', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[Usuarios] WHERE [UsuarioId] = 7)
    INSERT INTO dbo.[Usuarios] ([UsuarioId], [Nombre], [Correo], [ContrasenaHash], [Rol], [Telefono], [FechaRegistro], [Activo]) VALUES (7, N'Camila Torres', N'camila@conectapro.com', N'$2b$12$eIYKs27TraFuh6Qx5aq8LeYSXK5J8k0aZ3wbi2jla/qGBS5OvVdw2', N'profesional', N'11 5555-0204', '2026-10-29T20:38:57', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[Usuarios] WHERE [UsuarioId] = 8)
    INSERT INTO dbo.[Usuarios] ([UsuarioId], [Nombre], [Correo], [ContrasenaHash], [Rol], [Telefono], [FechaRegistro], [Activo]) VALUES (8, N'Nicolás Pérez', N'nicolas@conectapro.com', N'$2b$12$eIYKs27TraFuh6Qx5aq8LeYSXK5J8k0aZ3wbi2jla/qGBS5OvVdw2', N'profesional', N'11 5555-0205', '2026-10-29T20:38:57', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[Usuarios] WHERE [UsuarioId] = 9)
    INSERT INTO dbo.[Usuarios] ([UsuarioId], [Nombre], [Correo], [ContrasenaHash], [Rol], [Telefono], [FechaRegistro], [Activo]) VALUES (9, N'Valentina Díaz', N'valentina@conectapro.com', N'$2b$12$eIYKs27TraFuh6Qx5aq8LeYSXK5J8k0aZ3wbi2jla/qGBS5OvVdw2', N'profesional', N'11 5555-0206', '2026-10-29T20:38:57', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[Usuarios] WHERE [UsuarioId] = 10)
    INSERT INTO dbo.[Usuarios] ([UsuarioId], [Nombre], [Correo], [ContrasenaHash], [Rol], [Telefono], [FechaRegistro], [Activo]) VALUES (10, N'Roberto Silva', N'roberto@conectapro.com', N'$2b$12$eIYKs27TraFuh6Qx5aq8LeYSXK5J8k0aZ3wbi2jla/qGBS5OvVdw2', N'profesional', N'11 5555-0207', '2026-10-29T20:38:57', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[Usuarios] WHERE [UsuarioId] = 11)
    INSERT INTO dbo.[Usuarios] ([UsuarioId], [Nombre], [Correo], [ContrasenaHash], [Rol], [Telefono], [FechaRegistro], [Activo]) VALUES (11, N'Mariela Acosta', N'mariela@conectapro.com', N'$2b$12$eIYKs27TraFuh6Qx5aq8LeYSXK5J8k0aZ3wbi2jla/qGBS5OvVdw2', N'profesional', N'11 5555-0208', '2026-10-29T20:38:57', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.[Usuarios] WHERE [UsuarioId] = 12)
    INSERT INTO dbo.[Usuarios] ([UsuarioId], [Nombre], [Correo], [ContrasenaHash], [Rol], [Telefono], [FechaRegistro], [Activo]) VALUES (12, N'Diego Sosa', N'diego@conectapro.com', N'$2b$12$eIYKs27TraFuh6Qx5aq8LeYSXK5J8k0aZ3wbi2jla/qGBS5OvVdw2', N'profesional', N'11 5555-0209', '2026-10-29T20:38:57', 1);
SET IDENTITY_INSERT dbo.[Usuarios] OFF;
DBCC CHECKIDENT (N'dbo.Usuarios', RESEED);
GO

/* ---- dbo.Profesionales (9 filas) ---- */
PRINT N'Insertando datos en dbo.Profesionales...';
SET IDENTITY_INSERT dbo.[Profesionales] ON;
IF NOT EXISTS (SELECT 1 FROM dbo.[Profesionales] WHERE [ProfesionalId] = 1)
    INSERT INTO dbo.[Profesionales] ([ProfesionalId], [UsuarioId], [Especialidad], [Descripcion], [Zona], [AniosExperiencia], [TarifaReferencia], [Disponible], [Verificado], [FechaAlta]) VALUES (1, 4, N'Electricista matriculado', N'Instalaciones, tableros y urgencias eléctricas en viviendas y comercios. Diagnóstico claro y presupuesto antes de empezar.', N'CABA y Vicente López', 12, N'Visita desde $18.000', 1, 1, '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Profesionales] WHERE [ProfesionalId] = 2)
    INSERT INTO dbo.[Profesionales] ([ProfesionalId], [UsuarioId], [Especialidad], [Descripcion], [Zona], [AniosExperiencia], [TarifaReferencia], [Disponible], [Verificado], [FechaAlta]) VALUES (2, 5, N'Plomera', N'Detección de pérdidas, instalación de grifería y termotanques. Trabajo prolijo, con materiales de primera calidad.', N'CABA', 9, N'Consulta sin cargo', 1, 1, '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Profesionales] WHERE [ProfesionalId] = 3)
    INSERT INTO dbo.[Profesionales] ([ProfesionalId], [UsuarioId], [Especialidad], [Descripcion], [Zona], [AniosExperiencia], [TarifaReferencia], [Disponible], [Verificado], [FechaAlta]) VALUES (3, 6, N'Pintor', N'Pintura de interiores y exteriores, preparación de superficies y tratamiento de humedad.', N'Zona Norte GBA', 7, N'Desde $35.000 por ambiente', 1, 0, '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Profesionales] WHERE [ProfesionalId] = 4)
    INSERT INTO dbo.[Profesionales] ([ProfesionalId], [UsuarioId], [Especialidad], [Descripcion], [Zona], [AniosExperiencia], [TarifaReferencia], [Disponible], [Verificado], [FechaAlta]) VALUES (4, 7, N'Técnica en informática', N'Reparación de PC y notebooks, instalación de redes y soporte remoto para hogares y pequeños negocios.', N'CABA y remoto', 6, N'Diagnóstico desde $12.000', 1, 1, '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Profesionales] WHERE [ProfesionalId] = 5)
    INSERT INTO dbo.[Profesionales] ([ProfesionalId], [UsuarioId], [Especialidad], [Descripcion], [Zona], [AniosExperiencia], [TarifaReferencia], [Disponible], [Verificado], [FechaAlta]) VALUES (5, 8, N'Técnico en electrodomésticos', N'Reparación de heladeras, lavarropas, lavavajillas y hornos. Visitas a domicilio y repuestos originales.', N'CABA y GBA', 10, N'Visita $15.000', 1, 1, '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Profesionales] WHERE [ProfesionalId] = 6)
    INSERT INTO dbo.[Profesionales] ([ProfesionalId], [UsuarioId], [Especialidad], [Descripcion], [Zona], [AniosExperiencia], [TarifaReferencia], [Disponible], [Verificado], [FechaAlta]) VALUES (6, 9, N'Técnica Nerd', N'Reparación de consolas, joysticks y máquinas arcade. Armado de PC gamer y restauración de equipos retro.', N'CABA', 5, N'Presupuesto sin cargo', 1, 0, '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Profesionales] WHERE [ProfesionalId] = 7)
    INSERT INTO dbo.[Profesionales] ([ProfesionalId], [UsuarioId], [Especialidad], [Descripcion], [Zona], [AniosExperiencia], [TarifaReferencia], [Disponible], [Verificado], [FechaAlta]) VALUES (7, 10, N'Albañil', N'Obras menores, refacciones, muros, contrapisos y revoques. Coordinación de materiales y tiempos.', N'GBA', 15, N'Presupuesto a convenir', 1, 1, '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Profesionales] WHERE [ProfesionalId] = 8)
    INSERT INTO dbo.[Profesionales] ([ProfesionalId], [UsuarioId], [Especialidad], [Descripcion], [Zona], [AniosExperiencia], [TarifaReferencia], [Disponible], [Verificado], [FechaAlta]) VALUES (8, 11, N'Jardinera', N'Mantenimiento de jardines, poda, colocación de césped y sistemas de riego.', N'Zona Sur GBA', 8, N'Visita desde $10.000', 1, 0, '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Profesionales] WHERE [ProfesionalId] = 9)
    INSERT INTO dbo.[Profesionales] ([ProfesionalId], [UsuarioId], [Especialidad], [Descripcion], [Zona], [AniosExperiencia], [TarifaReferencia], [Disponible], [Verificado], [FechaAlta]) VALUES (9, 12, N'Cerrajero', N'Aperturas sin daño, cambio de cerraduras y copias de llaves. Atención de urgencias.', N'CABA', 11, N'Apertura desde $20.000', 1, 1, '2026-10-29T20:38:57');
SET IDENTITY_INSERT dbo.[Profesionales] OFF;
DBCC CHECKIDENT (N'dbo.Profesionales', RESEED);
GO

/* ---- dbo.Servicios (18 filas) ---- */
PRINT N'Insertando datos en dbo.Servicios...';
SET IDENTITY_INSERT dbo.[Servicios] ON;
IF NOT EXISTS (SELECT 1 FROM dbo.[Servicios] WHERE [ServicioId] = 1)
    INSERT INTO dbo.[Servicios] ([ServicioId], [ProfesionalId], [CategoriaId], [Nombre], [Descripcion], [PrecioReferencia], [Zona], [Disponible], [Modalidad], [Activo], [FechaCreacion], [FechaActualizacion]) VALUES (1, 1, 1, N'Instalación y reparación eléctrica', N'Resolución de fallas, cambio de tomacorrientes e interruptores, instalación de luminarias y tendido de cableado. Incluye revisión de seguridad y explicación del trabajo realizado.', N'Desde $18.000', N'CABA y Vicente López', 1, N'A domicilio', 1, '2026-10-29T20:38:57', '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Servicios] WHERE [ServicioId] = 2)
    INSERT INTO dbo.[Servicios] ([ServicioId], [ProfesionalId], [CategoriaId], [Nombre], [Descripcion], [PrecioReferencia], [Zona], [Disponible], [Modalidad], [Activo], [FechaCreacion], [FechaActualizacion]) VALUES (2, 1, 1, N'Tableros eléctricos y disyuntores', N'Actualización de tableros, colocación de disyuntores y térmicas, detección de sobrecargas y puesta a tierra. Ideal para viviendas antiguas o ampliaciones.', N'Presupuesto a convenir', N'CABA y Vicente López', 1, N'A domicilio', 1, '2026-10-29T20:38:57', '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Servicios] WHERE [ServicioId] = 3)
    INSERT INTO dbo.[Servicios] ([ServicioId], [ProfesionalId], [CategoriaId], [Nombre], [Descripcion], [PrecioReferencia], [Zona], [Disponible], [Modalidad], [Activo], [FechaCreacion], [FechaActualizacion]) VALUES (3, 2, 2, N'Detección y reparación de pérdidas de agua', N'Búsqueda de fugas en cañerías, reparación de uniones y cambio de tramos dañados. Trabajo con protección de muebles y limpieza final del espacio.', N'Consulta sin cargo', N'CABA', 1, N'A domicilio', 1, '2026-10-29T20:38:57', '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Servicios] WHERE [ServicioId] = 4)
    INSERT INTO dbo.[Servicios] ([ServicioId], [ProfesionalId], [CategoriaId], [Nombre], [Descripcion], [PrecioReferencia], [Zona], [Disponible], [Modalidad], [Activo], [FechaCreacion], [FechaActualizacion]) VALUES (4, 2, 2, N'Instalación de grifería y termotanques', N'Colocación y recambio de grifería, duchas, inodoros y termotanques. Verificación de conexiones, presión y ausencia de pérdidas antes de finalizar.', N'Desde $22.000', N'CABA', 1, N'A domicilio', 1, '2026-10-29T20:38:57', '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Servicios] WHERE [ServicioId] = 5)
    INSERT INTO dbo.[Servicios] ([ServicioId], [ProfesionalId], [CategoriaId], [Nombre], [Descripcion], [PrecioReferencia], [Zona], [Disponible], [Modalidad], [Activo], [FechaCreacion], [FechaActualizacion]) VALUES (5, 3, 4, N'Pintura de interiores y exteriores', N'Preparación de paredes, enduido, lijado y pintura en dos manos. Protección de pisos y muebles, con materiales de primera línea y colores a elección.', N'Desde $35.000 por ambiente', N'Zona Norte GBA', 1, N'A domicilio', 1, '2026-10-29T20:38:57', '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Servicios] WHERE [ServicioId] = 6)
    INSERT INTO dbo.[Servicios] ([ServicioId], [ProfesionalId], [CategoriaId], [Nombre], [Descripcion], [PrecioReferencia], [Zona], [Disponible], [Modalidad], [Activo], [FechaCreacion], [FechaActualizacion]) VALUES (6, 3, 4, N'Tratamiento de humedad y revoques', N'Diagnóstico de filtraciones, retiro de pintura floja, aplicación de impermeabilizante y reparación de revoques antes de pintar.', N'A presupuestar', N'Zona Norte GBA', 1, N'A domicilio', 1, '2026-10-29T20:38:57', '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Servicios] WHERE [ServicioId] = 7)
    INSERT INTO dbo.[Servicios] ([ServicioId], [ProfesionalId], [CategoriaId], [Nombre], [Descripcion], [PrecioReferencia], [Zona], [Disponible], [Modalidad], [Activo], [FechaCreacion], [FechaActualizacion]) VALUES (7, 4, 5, N'Reparación de PC y notebooks', N'Diagnóstico de fallas de hardware y software, limpieza, cambio de discos y memorias, instalación de sistema operativo y recuperación de datos.', N'Diagnóstico desde $12.000', N'CABA y remoto', 1, N'Mixta', 1, '2026-10-29T20:38:57', '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Servicios] WHERE [ServicioId] = 8)
    INSERT INTO dbo.[Servicios] ([ServicioId], [ProfesionalId], [CategoriaId], [Nombre], [Descripcion], [PrecioReferencia], [Zona], [Disponible], [Modalidad], [Activo], [FechaCreacion], [FechaActualizacion]) VALUES (8, 4, 5, N'Redes Wi-Fi y soporte remoto', N'Instalación y optimización de redes, repetidores y configuración de routers. Soporte remoto para programas, correo y respaldos.', N'Desde $15.000', N'CABA y remoto', 1, N'Remoto', 1, '2026-10-29T20:38:57', '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Servicios] WHERE [ServicioId] = 9)
    INSERT INTO dbo.[Servicios] ([ServicioId], [ProfesionalId], [CategoriaId], [Nombre], [Descripcion], [PrecioReferencia], [Zona], [Disponible], [Modalidad], [Activo], [FechaCreacion], [FechaActualizacion]) VALUES (9, 5, 8, N'Reparación de heladeras y lavarropas', N'Diagnóstico a domicilio, reparación de sistemas de frío, bombas, plaquetas y motores. Repuestos con garantía y prueba de funcionamiento.', N'Visita $15.000', N'CABA y GBA', 1, N'A domicilio', 1, '2026-10-29T20:38:57', '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Servicios] WHERE [ServicioId] = 10)
    INSERT INTO dbo.[Servicios] ([ServicioId], [ProfesionalId], [CategoriaId], [Nombre], [Descripcion], [PrecioReferencia], [Zona], [Disponible], [Modalidad], [Activo], [FechaCreacion], [FechaActualizacion]) VALUES (10, 5, 8, N'Mantenimiento de hornos y microondas', N'Limpieza técnica, revisión de resistencias, magnetrón y temporizadores. Reparación de fallas eléctricas y cambio de piezas desgastadas.', N'Desde $18.000', N'CABA y GBA', 1, N'En taller', 1, '2026-10-29T20:38:57', '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Servicios] WHERE [ServicioId] = 11)
    INSERT INTO dbo.[Servicios] ([ServicioId], [ProfesionalId], [CategoriaId], [Nombre], [Descripcion], [PrecioReferencia], [Zona], [Disponible], [Modalidad], [Activo], [FechaCreacion], [FechaActualizacion]) VALUES (11, 6, 9, N'Reparación de consolas y joysticks', N'Reparación de PlayStation, Xbox y Nintendo, cambio de analógicos, limpieza profunda y solución de fallas de conexión. También restauro máquinas arcade.', N'Presupuesto sin cargo', N'CABA', 1, N'Mixta', 1, '2026-10-29T20:38:57', '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Servicios] WHERE [ServicioId] = 12)
    INSERT INTO dbo.[Servicios] ([ServicioId], [ProfesionalId], [CategoriaId], [Nombre], [Descripcion], [PrecioReferencia], [Zona], [Disponible], [Modalidad], [Activo], [FechaCreacion], [FechaActualizacion]) VALUES (12, 6, 9, N'Armado de PC gamer y equipos retro', N'Asesoramiento de componentes, armado, instalación de sistemas y optimización para juegos. Restauración de computadoras y consolas retro.', N'Desde $25.000', N'CABA', 1, N'En taller', 1, '2026-10-29T20:38:57', '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Servicios] WHERE [ServicioId] = 13)
    INSERT INTO dbo.[Servicios] ([ServicioId], [ProfesionalId], [CategoriaId], [Nombre], [Descripcion], [PrecioReferencia], [Zona], [Disponible], [Modalidad], [Activo], [FechaCreacion], [FechaActualizacion]) VALUES (13, 7, 3, N'Albañilería general y refacciones', N'Levantado de muros, contrapisos, revoques, apertura de vanos y refacciones menores. Presupuesto detallado con materiales y plazos.', N'Presupuesto a convenir', N'GBA', 1, N'A domicilio', 1, '2026-10-29T20:38:57', '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Servicios] WHERE [ServicioId] = 14)
    INSERT INTO dbo.[Servicios] ([ServicioId], [ProfesionalId], [CategoriaId], [Nombre], [Descripcion], [PrecioReferencia], [Zona], [Disponible], [Modalidad], [Activo], [FechaCreacion], [FechaActualizacion]) VALUES (14, 7, 3, N'Reparación de techos y filtraciones', N'Revisión de cubiertas, reparación de membranas y sellado de juntas. Incluye limpieza de canaletas y prueba de estanqueidad.', N'A presupuestar', N'GBA', 1, N'A domicilio', 1, '2026-10-29T20:38:57', '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Servicios] WHERE [ServicioId] = 15)
    INSERT INTO dbo.[Servicios] ([ServicioId], [ProfesionalId], [CategoriaId], [Nombre], [Descripcion], [PrecioReferencia], [Zona], [Disponible], [Modalidad], [Activo], [FechaCreacion], [FechaActualizacion]) VALUES (15, 8, 7, N'Mantenimiento integral de jardines', N'Corte de césped, poda de arbustos, desmalezado y limpieza general. Planes periódicos para casas, consorcios y pequeños comercios.', N'Visita desde $10.000', N'Zona Sur GBA', 1, N'A domicilio', 1, '2026-10-29T20:38:57', '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Servicios] WHERE [ServicioId] = 16)
    INSERT INTO dbo.[Servicios] ([ServicioId], [ProfesionalId], [CategoriaId], [Nombre], [Descripcion], [PrecioReferencia], [Zona], [Disponible], [Modalidad], [Activo], [FechaCreacion], [FechaActualizacion]) VALUES (16, 8, 7, N'Riego y colocación de césped', N'Preparación del terreno, colocación de césped en rollo y armado de sistemas de riego por aspersión. Asesoramiento de mantenimiento.', N'A presupuestar', N'Zona Sur GBA', 1, N'A domicilio', 1, '2026-10-29T20:38:57', '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Servicios] WHERE [ServicioId] = 17)
    INSERT INTO dbo.[Servicios] ([ServicioId], [ProfesionalId], [CategoriaId], [Nombre], [Descripcion], [PrecioReferencia], [Zona], [Disponible], [Modalidad], [Activo], [FechaCreacion], [FechaActualizacion]) VALUES (17, 9, 6, N'Apertura de puertas y cambio de cerraduras', N'Apertura sin daño de puertas de vivienda y comercio, cambio de cerraduras y colocación de cerraduras de seguridad. Atención de urgencias.', N'Apertura desde $20.000', N'CABA', 1, N'A domicilio', 1, '2026-10-29T20:38:57', '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Servicios] WHERE [ServicioId] = 18)
    INSERT INTO dbo.[Servicios] ([ServicioId], [ProfesionalId], [CategoriaId], [Nombre], [Descripcion], [PrecioReferencia], [Zona], [Disponible], [Modalidad], [Activo], [FechaCreacion], [FechaActualizacion]) VALUES (18, 9, 6, N'Copias de llaves y seguridad', N'Copias de llaves convencionales y de seguridad, colocación de candados y asesoramiento para mejorar el acceso de tu hogar.', N'Desde $5.000', N'CABA', 1, N'En taller', 1, '2026-10-29T20:38:57', '2026-10-29T20:38:57');
SET IDENTITY_INSERT dbo.[Servicios] OFF;
DBCC CHECKIDENT (N'dbo.Servicios', RESEED);
GO

/* ---- dbo.Solicitudes (2 filas) ---- */
PRINT N'Insertando datos en dbo.Solicitudes...';
SET IDENTITY_INSERT dbo.[Solicitudes] ON;
IF NOT EXISTS (SELECT 1 FROM dbo.[Solicitudes] WHERE [SolicitudId] = 1)
    INSERT INTO dbo.[Solicitudes] ([SolicitudId], [ClienteId], [ProfesionalId], [ServicioId], [Mensaje], [Estado], [FechaCreacion], [FechaActualizacion]) VALUES (1, 1, 1, 1, N'Necesito revisar un tablero que hace saltar la térmica cuando prendo el aire. ¿Podés pasar esta semana?', N'pendiente', '2026-10-29T20:38:57', '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Solicitudes] WHERE [SolicitudId] = 2)
    INSERT INTO dbo.[Solicitudes] ([SolicitudId], [ClienteId], [ProfesionalId], [ServicioId], [Mensaje], [Estado], [FechaCreacion], [FechaActualizacion]) VALUES (2, 2, 2, 3, N'Tengo una pérdida debajo de la pileta de la cocina. ¿Podés darme un presupuesto?', N'aceptada', '2026-10-29T20:38:57', '2026-10-29T20:38:57');
SET IDENTITY_INSERT dbo.[Solicitudes] OFF;
DBCC CHECKIDENT (N'dbo.Solicitudes', RESEED);
GO

/* ---- dbo.Resenas (5 filas) ---- */
PRINT N'Insertando datos en dbo.Resenas...';
SET IDENTITY_INSERT dbo.[Resenas] ON;
IF NOT EXISTS (SELECT 1 FROM dbo.[Resenas] WHERE [ResenaId] = 1)
    INSERT INTO dbo.[Resenas] ([ResenaId], [ProfesionalId], [ClienteId], [Puntuacion], [Comentario], [FechaCreacion]) VALUES (1, 1, 1, 5, N'Resolvió un cortocircuito en el tablero el mismo día. Muy claro explicando y dejó todo limpio.', '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Resenas] WHERE [ResenaId] = 2)
    INSERT INTO dbo.[Resenas] ([ResenaId], [ProfesionalId], [ClienteId], [Puntuacion], [Comentario], [FechaCreacion]) VALUES (2, 1, 2, 4, N'Puntual y prolijo. El presupuesto se cumplió sin sorpresas.', '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Resenas] WHERE [ResenaId] = 3)
    INSERT INTO dbo.[Resenas] ([ResenaId], [ProfesionalId], [ClienteId], [Puntuacion], [Comentario], [FechaCreacion]) VALUES (3, 2, 1, 5, N'Encontró una pérdida que otro plomero no había podido ubicar. Excelente trato.', '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Resenas] WHERE [ResenaId] = 4)
    INSERT INTO dbo.[Resenas] ([ResenaId], [ProfesionalId], [ClienteId], [Puntuacion], [Comentario], [FechaCreacion]) VALUES (4, 4, 3, 5, N'Recuperó los datos de mi notebook y la dejó funcionando como nueva.', '2026-10-29T20:38:57');
IF NOT EXISTS (SELECT 1 FROM dbo.[Resenas] WHERE [ResenaId] = 5)
    INSERT INTO dbo.[Resenas] ([ResenaId], [ProfesionalId], [ClienteId], [Puntuacion], [Comentario], [FechaCreacion]) VALUES (5, 5, 3, 4, N'Reparó la heladera en una sola visita y explicó cómo cuidarla.', '2026-10-29T20:38:57');
SET IDENTITY_INSERT dbo.[Resenas] OFF;
DBCC CHECKIDENT (N'dbo.Resenas', RESEED);
GO

/* ---- dbo.IaConsultas (10 filas) ---- */
PRINT N'Insertando datos en dbo.IaConsultas...';
SET IDENTITY_INSERT dbo.[IaConsultas] ON;
IF NOT EXISTS (SELECT 1 FROM dbo.[IaConsultas] WHERE [ConsultaId] = 1)
    INSERT INTO dbo.[IaConsultas] ([ConsultaId], [UsuarioId], [Tipo], [Entrada], [Salida], [Proveedor], [FechaCreacion]) VALUES (1, NULL, N'sugerir-categoria', N'Tengo una pérdida de agua debajo de la pileta de la cocina', N'{"categoriaId":2,"categoria":"Plomería","confianza":0.96,"explicacion":"La descripción contiene referencias a agua, pérdida, perdida, pileta, por eso la categoría más adecuada es Plomería.","palabrasClave":["agua","pérdida","perdida","pileta"],"alternativas":[],"proveedor":"local","modelo":null,"profesionalesDisponibles":2}', N'local', '2026-10-29T20:41:38');
IF NOT EXISTS (SELECT 1 FROM dbo.[IaConsultas] WHERE [ConsultaId] = 2)
    INSERT INTO dbo.[IaConsultas] ([ConsultaId], [UsuarioId], [Tipo], [Entrada], [Salida], [Proveedor], [FechaCreacion]) VALUES (2, 4, N'mejorar-descripcion', N'Hago reparaciones de plomería en general, arreglo canillas y cañerías.', N'{"descripcion":"Hago reparaciones de plomería en general, arreglo canillas y cañerías. Ofrezco un servicio de plomería con diagnóstico previo, presupuesto claro y coordinación de fechas según tu disponibilidad. Trabajo con herramientas y materiales adecuados, cuido el espacio y explico cada paso para que sepas qué se está haciendo. Al finalizar, revisamos juntos el resultado y te dejo recomendaciones de uso y mantenimiento.","consejos":["Indicá qué incluye el servicio y qué no incluye.","Mencioná tu zona de cobertura y los horarios de atención.","Agregá un precio orientativo o aclarÁ que el presupuesto se coordina.","Cerrá con una invitación clara a solicitar el servicio."],"proveedor":"local","modelo":null}', N'local', '2026-10-29T20:41:38');
IF NOT EXISTS (SELECT 1 FROM dbo.[IaConsultas] WHERE [ConsultaId] = 3)
    INSERT INTO dbo.[IaConsultas] ([ConsultaId], [UsuarioId], [Tipo], [Entrada], [Salida], [Proveedor], [FechaCreacion]) VALUES (3, NULL, N'sugerir-categoria', N'Tengo una pérdida de agua debajo de la pileta de la cocina', N'{"categoriaId":2,"categoria":"Plomería","confianza":0.96,"explicacion":"La descripción contiene referencias a agua, pérdida, perdida, pileta, por eso la categoría más adecuada es Plomería.","palabrasClave":["agua","pérdida","perdida","pileta"],"alternativas":[],"proveedor":"local","modelo":null,"profesionalesDisponibles":2}', N'local', '2026-10-29T20:43:09');
IF NOT EXISTS (SELECT 1 FROM dbo.[IaConsultas] WHERE [ConsultaId] = 4)
    INSERT INTO dbo.[IaConsultas] ([ConsultaId], [UsuarioId], [Tipo], [Entrada], [Salida], [Proveedor], [FechaCreacion]) VALUES (4, 4, N'mejorar-descripcion', N'Hago reparaciones de plomería en general, arreglo canillas y cañerías.', N'{"descripcion":"Hago reparaciones de plomería en general, arreglo canillas y cañerías. Ofrezco un servicio de plomería con diagnóstico previo, presupuesto claro y coordinación de fechas según tu disponibilidad. Trabajo con herramientas y materiales adecuados, cuido el espacio y explico cada paso para que sepas qué se está haciendo. Al finalizar, revisamos juntos el resultado y te dejo recomendaciones de uso y mantenimiento.","consejos":["Indicá qué incluye el servicio y qué no incluye.","Mencioná tu zona de cobertura y los horarios de atención.","Agregá un precio orientativo o aclarÁ que el presupuesto se coordina.","Cerrá con una invitación clara a solicitar el servicio."],"proveedor":"local","modelo":null}', N'local', '2026-10-29T20:43:09');
IF NOT EXISTS (SELECT 1 FROM dbo.[IaConsultas] WHERE [ConsultaId] = 5)
    INSERT INTO dbo.[IaConsultas] ([ConsultaId], [UsuarioId], [Tipo], [Entrada], [Salida], [Proveedor], [FechaCreacion]) VALUES (5, NULL, N'sugerir-categoria', N'Tengo una pérdida de agua debajo de la pileta de la cocina', N'{"categoriaId":2,"categoria":"Plomería","confianza":0.96,"explicacion":"La descripción contiene referencias a agua, pérdida, perdida, pileta, por eso la categoría más adecuada es Plomería.","palabrasClave":["agua","pérdida","perdida","pileta"],"alternativas":[],"proveedor":"local","modelo":null,"profesionalesDisponibles":2}', N'local', '2026-11-03T20:12:43');
IF NOT EXISTS (SELECT 1 FROM dbo.[IaConsultas] WHERE [ConsultaId] = 6)
    INSERT INTO dbo.[IaConsultas] ([ConsultaId], [UsuarioId], [Tipo], [Entrada], [Salida], [Proveedor], [FechaCreacion]) VALUES (6, 4, N'mejorar-descripcion', N'Hago reparaciones de plomería en general, arreglo canillas y cañerías.', N'{"descripcion":"Hago reparaciones de plomería en general, arreglo canillas y cañerías. Ofrezco un servicio de plomería con diagnóstico previo, presupuesto claro y coordinación de fechas según tu disponibilidad. Trabajo con herramientas y materiales adecuados, cuido el espacio y explico cada paso para que sepas qué se está haciendo. Al finalizar, revisamos juntos el resultado y te dejo recomendaciones de uso y mantenimiento.","consejos":["Indicá qué incluye el servicio y qué no incluye.","Mencioná tu zona de cobertura y los horarios de atención.","Agregá un precio orientativo o aclarÁ que el presupuesto se coordina.","Cerrá con una invitación clara a solicitar el servicio."],"proveedor":"local","modelo":null}', N'local', '2026-11-03T20:12:43');
IF NOT EXISTS (SELECT 1 FROM dbo.[IaConsultas] WHERE [ConsultaId] = 7)
    INSERT INTO dbo.[IaConsultas] ([ConsultaId], [UsuarioId], [Tipo], [Entrada], [Salida], [Proveedor], [FechaCreacion]) VALUES (7, NULL, N'sugerir-categoria', N'Tengo una pérdida de agua debajo de la pileta de la cocina', N'{"categoriaId":2,"categoria":"Plomería","confianza":0.96,"explicacion":"La descripción contiene referencias a agua, pérdida, perdida, pileta, por eso la categoría más adecuada es Plomería.","palabrasClave":["agua","pérdida","perdida","pileta"],"alternativas":[],"proveedor":"local","modelo":null,"profesionalesDisponibles":2}', N'local', '2026-11-03T20:18:54');
IF NOT EXISTS (SELECT 1 FROM dbo.[IaConsultas] WHERE [ConsultaId] = 8)
    INSERT INTO dbo.[IaConsultas] ([ConsultaId], [UsuarioId], [Tipo], [Entrada], [Salida], [Proveedor], [FechaCreacion]) VALUES (8, 4, N'mejorar-descripcion', N'Hago reparaciones de plomería en general, arreglo canillas y cañerías.', N'{"descripcion":"Hago reparaciones de plomería en general, arreglo canillas y cañerías. Ofrezco un servicio de plomería con diagnóstico previo, presupuesto claro y coordinación de fechas según tu disponibilidad. Trabajo con herramientas y materiales adecuados, cuido el espacio y explico cada paso para que sepas qué se está haciendo. Al finalizar, revisamos juntos el resultado y te dejo recomendaciones de uso y mantenimiento.","consejos":["Indicá qué incluye el servicio y qué no incluye.","Mencioná tu zona de cobertura y los horarios de atención.","Agregá un precio orientativo o aclarÁ que el presupuesto se coordina.","Cerrá con una invitación clara a solicitar el servicio."],"proveedor":"local","modelo":null}', N'local', '2026-11-03T20:18:54');
IF NOT EXISTS (SELECT 1 FROM dbo.[IaConsultas] WHERE [ConsultaId] = 9)
    INSERT INTO dbo.[IaConsultas] ([ConsultaId], [UsuarioId], [Tipo], [Entrada], [Salida], [Proveedor], [FechaCreacion]) VALUES (9, NULL, N'sugerir-categoria', N'Tengo una pérdida de agua debajo de la pileta de la cocina', N'{"categoriaId":2,"categoria":"Plomería","confianza":0.96,"explicacion":"La descripción contiene referencias a agua, pérdida, perdida, pileta, por eso la categoría más adecuada es Plomería.","palabrasClave":["agua","pérdida","perdida","pileta"],"alternativas":[],"proveedor":"local","modelo":null,"profesionalesDisponibles":2}', N'local', '2026-11-13T20:16:22');
IF NOT EXISTS (SELECT 1 FROM dbo.[IaConsultas] WHERE [ConsultaId] = 10)
    INSERT INTO dbo.[IaConsultas] ([ConsultaId], [UsuarioId], [Tipo], [Entrada], [Salida], [Proveedor], [FechaCreacion]) VALUES (10, 4, N'mejorar-descripcion', N'Hago reparaciones de plomería en general, arreglo canillas y cañerías.', N'{"descripcion":"Hago reparaciones de plomería en general, arreglo canillas y cañerías. Ofrezco un servicio de plomería con diagnóstico previo, presupuesto claro y coordinación de fechas según tu disponibilidad. Trabajo con herramientas y materiales adecuados, cuido el espacio y explico cada paso para que sepas qué se está haciendo. Al finalizar, revisamos juntos el resultado y te dejo recomendaciones de uso y mantenimiento.","consejos":["Indicá qué incluye el servicio y qué no incluye.","Mencioná tu zona de cobertura y los horarios de atención.","Agregá un precio orientativo o aclarÁ que el presupuesto se coordina.","Cerrá con una invitación clara a solicitar el servicio."],"proveedor":"local","modelo":null}', N'local', '2026-11-13T20:16:22');
SET IDENTITY_INSERT dbo.[IaConsultas] OFF;
DBCC CHECKIDENT (N'dbo.IaConsultas', RESEED);
GO

/* -------------------- Verificación -------------------- */
PRINT N'Copia importada. Resumen de filas:';
SELECT 'Categorias' AS Tabla, COUNT(*) AS Filas FROM dbo.Categorias
       UNION ALL SELECT 'Usuarios', COUNT(*) FROM dbo.Usuarios
       UNION ALL SELECT 'Profesionales', COUNT(*) FROM dbo.Profesionales
       UNION ALL SELECT 'Servicios', COUNT(*) FROM dbo.Servicios
       UNION ALL SELECT 'Solicitudes', COUNT(*) FROM dbo.Solicitudes
       UNION ALL SELECT 'Resenas', COUNT(*) FROM dbo.Resenas
       UNION ALL SELECT 'Pagos', COUNT(*) FROM dbo.Pagos
       UNION ALL SELECT 'IaConsultas', COUNT(*) FROM dbo.IaConsultas;
GO
