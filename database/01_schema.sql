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
