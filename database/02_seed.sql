/* ============================================================
   ConectaPro - Datos iniciales de demostración
   Contraseña de todas las cuentas demo: Demo1234!
   El hash se actualiza desde setup-db.ts si se define DEMO_PASSWORD.
   ============================================================ */

DECLARE @Hash NVARCHAR(255) = N'$2b$10$tPq1luDlHgYOZHCEapv3IuXdPFlAJrLwqta2S9krmgskauhuD1Nwa';

/* ---------- Categorías ---------- */
IF NOT EXISTS (SELECT 1 FROM dbo.Categorias WHERE Nombre = N'Electricidad')
    INSERT INTO dbo.Categorias (Nombre, Descripcion, Icono, Orden) VALUES
    (N'Electricidad', N'Instalaciones, reparaciones y urgencias eléctricas.', N'⚡', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.Categorias WHERE Nombre = N'Plomería')
    INSERT INTO dbo.Categorias (Nombre, Descripcion, Icono, Orden) VALUES
    (N'Plomería', N'Pérdidas de agua, cañerías, grifería y termotanques.', N'🔧', 2);
IF NOT EXISTS (SELECT 1 FROM dbo.Categorias WHERE Nombre = N'Albañilería')
    INSERT INTO dbo.Categorias (Nombre, Descripcion, Icono, Orden) VALUES
    (N'Albañilería', N'Obras, refacciones, muros, pisos y revoques.', N'🧱', 3);
IF NOT EXISTS (SELECT 1 FROM dbo.Categorias WHERE Nombre = N'Pintura')
    INSERT INTO dbo.Categorias (Nombre, Descripcion, Icono, Orden) VALUES
    (N'Pintura', N'Pintura de interiores y exteriores, enduido y humedad.', N'🎨', 4);
IF NOT EXISTS (SELECT 1 FROM dbo.Categorias WHERE Nombre = N'Informática')
    INSERT INTO dbo.Categorias (Nombre, Descripcion, Icono, Orden) VALUES
    (N'Informática', N'Reparación de computadoras, redes y soporte técnico.', N'💻', 5);
IF NOT EXISTS (SELECT 1 FROM dbo.Categorias WHERE Nombre = N'Cerrajería')
    INSERT INTO dbo.Categorias (Nombre, Descripcion, Icono, Orden) VALUES
    (N'Cerrajería', N'Aperturas, cerraduras, llaves y seguridad.', N'🔑', 6);
IF NOT EXISTS (SELECT 1 FROM dbo.Categorias WHERE Nombre = N'Jardinería')
    INSERT INTO dbo.Categorias (Nombre, Descripcion, Icono, Orden) VALUES
    (N'Jardinería', N'Poda, césped, riego y mantenimiento de jardines.', N'🌿', 7);
IF NOT EXISTS (SELECT 1 FROM dbo.Categorias WHERE Nombre = N'Reparación de electrodomésticos')
    INSERT INTO dbo.Categorias (Nombre, Descripcion, Icono, Orden) VALUES
    (N'Reparación de electrodomésticos', N'Heladeras, lavarropas, hornos y microondas.', N'🔌', 8);
IF NOT EXISTS (SELECT 1 FROM dbo.Categorias WHERE Nombre = N'Nerd')
    INSERT INTO dbo.Categorias (Nombre, Descripcion, Icono, Orden) VALUES
    (N'Nerd', N'Consolas, videojuegos, joysticks, PC gamer y máquinas arcade.', N'🎮', 9);

/* ---------- Cuentas demo ---------- */
IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE Correo = N'cliente@conectapro.com')
    INSERT INTO dbo.Usuarios (Nombre, Correo, ContrasenaHash, Rol, Telefono) VALUES
    (N'Luana Ríos', N'cliente@conectapro.com', @Hash, N'cliente', N'11 5555-0101');
IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE Correo = N'sofia@conectapro.com')
    INSERT INTO dbo.Usuarios (Nombre, Correo, ContrasenaHash, Rol, Telefono) VALUES
    (N'Sofía Benítez', N'sofia@conectapro.com', @Hash, N'cliente', N'11 5555-0102');
IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE Correo = N'bruno@conectapro.com')
    INSERT INTO dbo.Usuarios (Nombre, Correo, ContrasenaHash, Rol, Telefono) VALUES
    (N'Bruno Álvarez', N'bruno@conectapro.com', @Hash, N'cliente', N'11 5555-0103');

IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE Correo = N'martin@conectapro.com')
    INSERT INTO dbo.Usuarios (Nombre, Correo, ContrasenaHash, Rol, Telefono) VALUES
    (N'Martín Rodríguez', N'martin@conectapro.com', @Hash, N'profesional', N'11 5555-0201');
IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE Correo = N'lucia@conectapro.com')
    INSERT INTO dbo.Usuarios (Nombre, Correo, ContrasenaHash, Rol, Telefono) VALUES
    (N'Lucía Fernández', N'lucia@conectapro.com', @Hash, N'profesional', N'11 5555-0202');
IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE Correo = N'santiago@conectapro.com')
    INSERT INTO dbo.Usuarios (Nombre, Correo, ContrasenaHash, Rol, Telefono) VALUES
    (N'Santiago Gómez', N'santiago@conectapro.com', @Hash, N'profesional', N'11 5555-0203');
IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE Correo = N'camila@conectapro.com')
    INSERT INTO dbo.Usuarios (Nombre, Correo, ContrasenaHash, Rol, Telefono) VALUES
    (N'Camila Torres', N'camila@conectapro.com', @Hash, N'profesional', N'11 5555-0204');
IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE Correo = N'nicolas@conectapro.com')
    INSERT INTO dbo.Usuarios (Nombre, Correo, ContrasenaHash, Rol, Telefono) VALUES
    (N'Nicolás Pérez', N'nicolas@conectapro.com', @Hash, N'profesional', N'11 5555-0205');
IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE Correo = N'valentina@conectapro.com')
    INSERT INTO dbo.Usuarios (Nombre, Correo, ContrasenaHash, Rol, Telefono) VALUES
    (N'Valentina Díaz', N'valentina@conectapro.com', @Hash, N'profesional', N'11 5555-0206');
IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE Correo = N'roberto@conectapro.com')
    INSERT INTO dbo.Usuarios (Nombre, Correo, ContrasenaHash, Rol, Telefono) VALUES
    (N'Roberto Silva', N'roberto@conectapro.com', @Hash, N'profesional', N'11 5555-0207');
IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE Correo = N'mariela@conectapro.com')
    INSERT INTO dbo.Usuarios (Nombre, Correo, ContrasenaHash, Rol, Telefono) VALUES
    (N'Mariela Acosta', N'mariela@conectapro.com', @Hash, N'profesional', N'11 5555-0208');
IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE Correo = N'diego@conectapro.com')
    INSERT INTO dbo.Usuarios (Nombre, Correo, ContrasenaHash, Rol, Telefono) VALUES
    (N'Diego Sosa', N'diego@conectapro.com', @Hash, N'profesional', N'11 5555-0209');

/* ---------- Perfiles profesionales ---------- */
DECLARE @UMartin INT = (SELECT UsuarioId FROM dbo.Usuarios WHERE Correo = N'martin@conectapro.com');
DECLARE @ULucia INT = (SELECT UsuarioId FROM dbo.Usuarios WHERE Correo = N'lucia@conectapro.com');
DECLARE @USantiago INT = (SELECT UsuarioId FROM dbo.Usuarios WHERE Correo = N'santiago@conectapro.com');
DECLARE @UCamila INT = (SELECT UsuarioId FROM dbo.Usuarios WHERE Correo = N'camila@conectapro.com');
DECLARE @UNicolas INT = (SELECT UsuarioId FROM dbo.Usuarios WHERE Correo = N'nicolas@conectapro.com');
DECLARE @UValentina INT = (SELECT UsuarioId FROM dbo.Usuarios WHERE Correo = N'valentina@conectapro.com');
DECLARE @URoberto INT = (SELECT UsuarioId FROM dbo.Usuarios WHERE Correo = N'roberto@conectapro.com');
DECLARE @UMariela INT = (SELECT UsuarioId FROM dbo.Usuarios WHERE Correo = N'mariela@conectapro.com');
DECLARE @UDiego INT = (SELECT UsuarioId FROM dbo.Usuarios WHERE Correo = N'diego@conectapro.com');

IF NOT EXISTS (SELECT 1 FROM dbo.Profesionales WHERE UsuarioId = @UMartin)
    INSERT INTO dbo.Profesionales (UsuarioId, Especialidad, Descripcion, Zona, AniosExperiencia, TarifaReferencia, Verificado) VALUES
    (@UMartin, N'Electricista matriculado', N'Instalaciones, tableros y urgencias eléctricas en viviendas y comercios. Diagnóstico claro y presupuesto antes de empezar.', N'CABA y Vicente López', 12, N'Visita desde $18.000', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.Profesionales WHERE UsuarioId = @ULucia)
    INSERT INTO dbo.Profesionales (UsuarioId, Especialidad, Descripcion, Zona, AniosExperiencia, TarifaReferencia, Verificado) VALUES
    (@ULucia, N'Plomera', N'Detección de pérdidas, instalación de grifería y termotanques. Trabajo prolijo, con materiales de primera calidad.', N'CABA', 9, N'Consulta sin cargo', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.Profesionales WHERE UsuarioId = @USantiago)
    INSERT INTO dbo.Profesionales (UsuarioId, Especialidad, Descripcion, Zona, AniosExperiencia, TarifaReferencia, Verificado) VALUES
    (@USantiago, N'Pintor', N'Pintura de interiores y exteriores, preparación de superficies y tratamiento de humedad.', N'Zona Norte GBA', 7, N'Desde $35.000 por ambiente', 0);
IF NOT EXISTS (SELECT 1 FROM dbo.Profesionales WHERE UsuarioId = @UCamila)
    INSERT INTO dbo.Profesionales (UsuarioId, Especialidad, Descripcion, Zona, AniosExperiencia, TarifaReferencia, Verificado) VALUES
    (@UCamila, N'Técnica en informática', N'Reparación de PC y notebooks, instalación de redes y soporte remoto para hogares y pequeños negocios.', N'CABA y remoto', 6, N'Diagnóstico desde $12.000', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.Profesionales WHERE UsuarioId = @UNicolas)
    INSERT INTO dbo.Profesionales (UsuarioId, Especialidad, Descripcion, Zona, AniosExperiencia, TarifaReferencia, Verificado) VALUES
    (@UNicolas, N'Técnico en electrodomésticos', N'Reparación de heladeras, lavarropas, lavavajillas y hornos. Visitas a domicilio y repuestos originales.', N'CABA y GBA', 10, N'Visita $15.000', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.Profesionales WHERE UsuarioId = @UValentina)
    INSERT INTO dbo.Profesionales (UsuarioId, Especialidad, Descripcion, Zona, AniosExperiencia, TarifaReferencia, Verificado) VALUES
    (@UValentina, N'Técnica Nerd', N'Reparación de consolas, joysticks y máquinas arcade. Armado de PC gamer y restauración de equipos retro.', N'CABA', 5, N'Presupuesto sin cargo', 0);
IF NOT EXISTS (SELECT 1 FROM dbo.Profesionales WHERE UsuarioId = @URoberto)
    INSERT INTO dbo.Profesionales (UsuarioId, Especialidad, Descripcion, Zona, AniosExperiencia, TarifaReferencia, Verificado) VALUES
    (@URoberto, N'Albañil', N'Obras menores, refacciones, muros, contrapisos y revoques. Coordinación de materiales y tiempos.', N'GBA', 15, N'Presupuesto a convenir', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.Profesionales WHERE UsuarioId = @UMariela)
    INSERT INTO dbo.Profesionales (UsuarioId, Especialidad, Descripcion, Zona, AniosExperiencia, TarifaReferencia, Verificado) VALUES
    (@UMariela, N'Jardinera', N'Mantenimiento de jardines, poda, colocación de césped y sistemas de riego.', N'Zona Sur GBA', 8, N'Visita desde $10.000', 0);
IF NOT EXISTS (SELECT 1 FROM dbo.Profesionales WHERE UsuarioId = @UDiego)
    INSERT INTO dbo.Profesionales (UsuarioId, Especialidad, Descripcion, Zona, AniosExperiencia, TarifaReferencia, Verificado) VALUES
    (@UDiego, N'Cerrajero', N'Aperturas sin daño, cambio de cerraduras y copias de llaves. Atención de urgencias.', N'CABA', 11, N'Apertura desde $20.000', 1);

DECLARE @PMartin INT = (SELECT ProfesionalId FROM dbo.Profesionales WHERE UsuarioId = @UMartin);
DECLARE @PLucia INT = (SELECT ProfesionalId FROM dbo.Profesionales WHERE UsuarioId = @ULucia);
DECLARE @PSantiago INT = (SELECT ProfesionalId FROM dbo.Profesionales WHERE UsuarioId = @USantiago);
DECLARE @PCamila INT = (SELECT ProfesionalId FROM dbo.Profesionales WHERE UsuarioId = @UCamila);
DECLARE @PNicolas INT = (SELECT ProfesionalId FROM dbo.Profesionales WHERE UsuarioId = @UNicolas);
DECLARE @PValentina INT = (SELECT ProfesionalId FROM dbo.Profesionales WHERE UsuarioId = @UValentina);
DECLARE @PRoberto INT = (SELECT ProfesionalId FROM dbo.Profesionales WHERE UsuarioId = @URoberto);
DECLARE @PMariela INT = (SELECT ProfesionalId FROM dbo.Profesionales WHERE UsuarioId = @UMariela);
DECLARE @PDiego INT = (SELECT ProfesionalId FROM dbo.Profesionales WHERE UsuarioId = @UDiego);

/* ---------- Servicios ---------- */
DECLARE @CElectricidad INT = (SELECT CategoriaId FROM dbo.Categorias WHERE Nombre = N'Electricidad');
DECLARE @CPlomeria INT = (SELECT CategoriaId FROM dbo.Categorias WHERE Nombre = N'Plomería');
DECLARE @CAlbanileria INT = (SELECT CategoriaId FROM dbo.Categorias WHERE Nombre = N'Albañilería');
DECLARE @CPintura INT = (SELECT CategoriaId FROM dbo.Categorias WHERE Nombre = N'Pintura');
DECLARE @CInformatica INT = (SELECT CategoriaId FROM dbo.Categorias WHERE Nombre = N'Informática');
DECLARE @CCerrajeria INT = (SELECT CategoriaId FROM dbo.Categorias WHERE Nombre = N'Cerrajería');
DECLARE @CJardineria INT = (SELECT CategoriaId FROM dbo.Categorias WHERE Nombre = N'Jardinería');
DECLARE @CElectro INT = (SELECT CategoriaId FROM dbo.Categorias WHERE Nombre = N'Reparación de electrodomésticos');
DECLARE @CNerd INT = (SELECT CategoriaId FROM dbo.Categorias WHERE Nombre = N'Nerd');

IF NOT EXISTS (SELECT 1 FROM dbo.Servicios WHERE ProfesionalId = @PMartin AND Nombre = N'Instalación y reparación eléctrica')
    INSERT INTO dbo.Servicios (ProfesionalId, CategoriaId, Nombre, Descripcion, PrecioReferencia, Modalidad) VALUES
    (@PMartin, @CElectricidad, N'Instalación y reparación eléctrica', N'Resolución de fallas, cambio de tomacorrientes e interruptores, instalación de luminarias y tendido de cableado. Incluye revisión de seguridad y explicación del trabajo realizado.', N'Desde $18.000', N'A domicilio');
IF NOT EXISTS (SELECT 1 FROM dbo.Servicios WHERE ProfesionalId = @PMartin AND Nombre = N'Tableros eléctricos y disyuntores')
    INSERT INTO dbo.Servicios (ProfesionalId, CategoriaId, Nombre, Descripcion, PrecioReferencia, Modalidad) VALUES
    (@PMartin, @CElectricidad, N'Tableros eléctricos y disyuntores', N'Actualización de tableros, colocación de disyuntores y térmicas, detección de sobrecargas y puesta a tierra. Ideal para viviendas antiguas o ampliaciones.', N'Presupuesto a convenir', N'A domicilio');

IF NOT EXISTS (SELECT 1 FROM dbo.Servicios WHERE ProfesionalId = @PLucia AND Nombre = N'Detección y reparación de pérdidas de agua')
    INSERT INTO dbo.Servicios (ProfesionalId, CategoriaId, Nombre, Descripcion, PrecioReferencia, Modalidad) VALUES
    (@PLucia, @CPlomeria, N'Detección y reparación de pérdidas de agua', N'Búsqueda de fugas en cañerías, reparación de uniones y cambio de tramos dañados. Trabajo con protección de muebles y limpieza final del espacio.', N'Consulta sin cargo', N'A domicilio');
IF NOT EXISTS (SELECT 1 FROM dbo.Servicios WHERE ProfesionalId = @PLucia AND Nombre = N'Instalación de grifería y termotanques')
    INSERT INTO dbo.Servicios (ProfesionalId, CategoriaId, Nombre, Descripcion, PrecioReferencia, Modalidad) VALUES
    (@PLucia, @CPlomeria, N'Instalación de grifería y termotanques', N'Colocación y recambio de grifería, duchas, inodoros y termotanques. Verificación de conexiones, presión y ausencia de pérdidas antes de finalizar.', N'Desde $22.000', N'A domicilio');

IF NOT EXISTS (SELECT 1 FROM dbo.Servicios WHERE ProfesionalId = @PSantiago AND Nombre = N'Pintura de interiores y exteriores')
    INSERT INTO dbo.Servicios (ProfesionalId, CategoriaId, Nombre, Descripcion, PrecioReferencia, Modalidad) VALUES
    (@PSantiago, @CPintura, N'Pintura de interiores y exteriores', N'Preparación de paredes, enduido, lijado y pintura en dos manos. Protección de pisos y muebles, con materiales de primera línea y colores a elección.', N'Desde $35.000 por ambiente', N'A domicilio');
IF NOT EXISTS (SELECT 1 FROM dbo.Servicios WHERE ProfesionalId = @PSantiago AND Nombre = N'Tratamiento de humedad y revoques')
    INSERT INTO dbo.Servicios (ProfesionalId, CategoriaId, Nombre, Descripcion, PrecioReferencia, Modalidad) VALUES
    (@PSantiago, @CPintura, N'Tratamiento de humedad y revoques', N'Diagnóstico de filtraciones, retiro de pintura floja, aplicación de impermeabilizante y reparación de revoques antes de pintar.', N'A presupuestar', N'A domicilio');

IF NOT EXISTS (SELECT 1 FROM dbo.Servicios WHERE ProfesionalId = @PCamila AND Nombre = N'Reparación de PC y notebooks')
    INSERT INTO dbo.Servicios (ProfesionalId, CategoriaId, Nombre, Descripcion, PrecioReferencia, Modalidad) VALUES
    (@PCamila, @CInformatica, N'Reparación de PC y notebooks', N'Diagnóstico de fallas de hardware y software, limpieza, cambio de discos y memorias, instalación de sistema operativo y recuperación de datos.', N'Diagnóstico desde $12.000', N'Mixta');
IF NOT EXISTS (SELECT 1 FROM dbo.Servicios WHERE ProfesionalId = @PCamila AND Nombre = N'Redes Wi-Fi y soporte remoto')
    INSERT INTO dbo.Servicios (ProfesionalId, CategoriaId, Nombre, Descripcion, PrecioReferencia, Modalidad) VALUES
    (@PCamila, @CInformatica, N'Redes Wi-Fi y soporte remoto', N'Instalación y optimización de redes, repetidores y configuración de routers. Soporte remoto para programas, correo y respaldos.', N'Desde $15.000', N'Remoto');

IF NOT EXISTS (SELECT 1 FROM dbo.Servicios WHERE ProfesionalId = @PNicolas AND Nombre = N'Reparación de heladeras y lavarropas')
    INSERT INTO dbo.Servicios (ProfesionalId, CategoriaId, Nombre, Descripcion, PrecioReferencia, Modalidad) VALUES
    (@PNicolas, @CElectro, N'Reparación de heladeras y lavarropas', N'Diagnóstico a domicilio, reparación de sistemas de frío, bombas, plaquetas y motores. Repuestos con garantía y prueba de funcionamiento.', N'Visita $15.000', N'A domicilio');
IF NOT EXISTS (SELECT 1 FROM dbo.Servicios WHERE ProfesionalId = @PNicolas AND Nombre = N'Mantenimiento de hornos y microondas')
    INSERT INTO dbo.Servicios (ProfesionalId, CategoriaId, Nombre, Descripcion, PrecioReferencia, Modalidad) VALUES
    (@PNicolas, @CElectro, N'Mantenimiento de hornos y microondas', N'Limpieza técnica, revisión de resistencias, magnetrón y temporizadores. Reparación de fallas eléctricas y cambio de piezas desgastadas.', N'Desde $18.000', N'En taller');

IF NOT EXISTS (SELECT 1 FROM dbo.Servicios WHERE ProfesionalId = @PValentina AND Nombre = N'Reparación de consolas y joysticks')
    INSERT INTO dbo.Servicios (ProfesionalId, CategoriaId, Nombre, Descripcion, PrecioReferencia, Modalidad) VALUES
    (@PValentina, @CNerd, N'Reparación de consolas y joysticks', N'Reparación de PlayStation, Xbox y Nintendo, cambio de analógicos, limpieza profunda y solución de fallas de conexión. También restauro máquinas arcade.', N'Presupuesto sin cargo', N'Mixta');
IF NOT EXISTS (SELECT 1 FROM dbo.Servicios WHERE ProfesionalId = @PValentina AND Nombre = N'Armado de PC gamer y equipos retro')
    INSERT INTO dbo.Servicios (ProfesionalId, CategoriaId, Nombre, Descripcion, PrecioReferencia, Modalidad) VALUES
    (@PValentina, @CNerd, N'Armado de PC gamer y equipos retro', N'Asesoramiento de componentes, armado, instalación de sistemas y optimización para juegos. Restauración de computadoras y consolas retro.', N'Desde $25.000', N'En taller');

IF NOT EXISTS (SELECT 1 FROM dbo.Servicios WHERE ProfesionalId = @PRoberto AND Nombre = N'Albañilería general y refacciones')
    INSERT INTO dbo.Servicios (ProfesionalId, CategoriaId, Nombre, Descripcion, PrecioReferencia, Modalidad) VALUES
    (@PRoberto, @CAlbanileria, N'Albañilería general y refacciones', N'Levantado de muros, contrapisos, revoques, apertura de vanos y refacciones menores. Presupuesto detallado con materiales y plazos.', N'Presupuesto a convenir', N'A domicilio');
IF NOT EXISTS (SELECT 1 FROM dbo.Servicios WHERE ProfesionalId = @PRoberto AND Nombre = N'Reparación de techos y filtraciones')
    INSERT INTO dbo.Servicios (ProfesionalId, CategoriaId, Nombre, Descripcion, PrecioReferencia, Modalidad) VALUES
    (@PRoberto, @CAlbanileria, N'Reparación de techos y filtraciones', N'Revisión de cubiertas, reparación de membranas y sellado de juntas. Incluye limpieza de canaletas y prueba de estanqueidad.', N'A presupuestar', N'A domicilio');

IF NOT EXISTS (SELECT 1 FROM dbo.Servicios WHERE ProfesionalId = @PMariela AND Nombre = N'Mantenimiento integral de jardines')
    INSERT INTO dbo.Servicios (ProfesionalId, CategoriaId, Nombre, Descripcion, PrecioReferencia, Modalidad) VALUES
    (@PMariela, @CJardineria, N'Mantenimiento integral de jardines', N'Corte de césped, poda de arbustos, desmalezado y limpieza general. Planes periódicos para casas, consorcios y pequeños comercios.', N'Visita desde $10.000', N'A domicilio');
IF NOT EXISTS (SELECT 1 FROM dbo.Servicios WHERE ProfesionalId = @PMariela AND Nombre = N'Riego y colocación de césped')
    INSERT INTO dbo.Servicios (ProfesionalId, CategoriaId, Nombre, Descripcion, PrecioReferencia, Modalidad) VALUES
    (@PMariela, @CJardineria, N'Riego y colocación de césped', N'Preparación del terreno, colocación de césped en rollo y armado de sistemas de riego por aspersión. Asesoramiento de mantenimiento.', N'A presupuestar', N'A domicilio');

IF NOT EXISTS (SELECT 1 FROM dbo.Servicios WHERE ProfesionalId = @PDiego AND Nombre = N'Apertura de puertas y cambio de cerraduras')
    INSERT INTO dbo.Servicios (ProfesionalId, CategoriaId, Nombre, Descripcion, PrecioReferencia, Modalidad) VALUES
    (@PDiego, @CCerrajeria, N'Apertura de puertas y cambio de cerraduras', N'Apertura sin daño de puertas de vivienda y comercio, cambio de cerraduras y colocación de cerraduras de seguridad. Atención de urgencias.', N'Apertura desde $20.000', N'A domicilio');
IF NOT EXISTS (SELECT 1 FROM dbo.Servicios WHERE ProfesionalId = @PDiego AND Nombre = N'Copias de llaves y seguridad')
    INSERT INTO dbo.Servicios (ProfesionalId, CategoriaId, Nombre, Descripcion, PrecioReferencia, Modalidad) VALUES
    (@PDiego, @CCerrajeria, N'Copias de llaves y seguridad', N'Copias de llaves convencionales y de seguridad, colocación de candados y asesoramiento para mejorar el acceso de tu hogar.', N'Desde $5.000', N'En taller');

/* ---------- Reseñas ---------- */
DECLARE @UCliente INT = (SELECT UsuarioId FROM dbo.Usuarios WHERE Correo = N'cliente@conectapro.com');
DECLARE @USofia INT = (SELECT UsuarioId FROM dbo.Usuarios WHERE Correo = N'sofia@conectapro.com');
DECLARE @UBruno INT = (SELECT UsuarioId FROM dbo.Usuarios WHERE Correo = N'bruno@conectapro.com');

IF NOT EXISTS (SELECT 1 FROM dbo.Resenas WHERE ClienteId = @UCliente AND ProfesionalId = @PMartin)
    INSERT INTO dbo.Resenas (ProfesionalId, ClienteId, Puntuacion, Comentario) VALUES
    (@PMartin, @UCliente, 5, N'Resolvió un cortocircuito en el tablero el mismo día. Muy claro explicando y dejó todo limpio.');
IF NOT EXISTS (SELECT 1 FROM dbo.Resenas WHERE ClienteId = @USofia AND ProfesionalId = @PMartin)
    INSERT INTO dbo.Resenas (ProfesionalId, ClienteId, Puntuacion, Comentario) VALUES
    (@PMartin, @USofia, 4, N'Puntual y prolijo. El presupuesto se cumplió sin sorpresas.');
IF NOT EXISTS (SELECT 1 FROM dbo.Resenas WHERE ClienteId = @UCliente AND ProfesionalId = @PLucia)
    INSERT INTO dbo.Resenas (ProfesionalId, ClienteId, Puntuacion, Comentario) VALUES
    (@PLucia, @UCliente, 5, N'Encontró una pérdida que otro plomero no había podido ubicar. Excelente trato.');
IF NOT EXISTS (SELECT 1 FROM dbo.Resenas WHERE ClienteId = @UBruno AND ProfesionalId = @PCamila)
    INSERT INTO dbo.Resenas (ProfesionalId, ClienteId, Puntuacion, Comentario) VALUES
    (@PCamila, @UBruno, 5, N'Recuperó los datos de mi notebook y la dejó funcionando como nueva.');
IF NOT EXISTS (SELECT 1 FROM dbo.Resenas WHERE ClienteId = @UBruno AND ProfesionalId = @PNicolas)
    INSERT INTO dbo.Resenas (ProfesionalId, ClienteId, Puntuacion, Comentario) VALUES
    (@PNicolas, @UBruno, 4, N'Reparó la heladera en una sola visita y explicó cómo cuidarla.');

/* ---------- Solicitudes demo ---------- */
IF NOT EXISTS (SELECT 1 FROM dbo.Solicitudes WHERE ClienteId = @UCliente AND ProfesionalId = @PMartin)
    INSERT INTO dbo.Solicitudes (ClienteId, ProfesionalId, ServicioId, Mensaje, Estado) VALUES
    (@UCliente, @PMartin, (SELECT TOP 1 ServicioId FROM dbo.Servicios WHERE ProfesionalId = @PMartin ORDER BY ServicioId),
     N'Necesito revisar un tablero que hace saltar la térmica cuando prendo el aire. ¿Podés pasar esta semana?', N'pendiente');

IF NOT EXISTS (SELECT 1 FROM dbo.Solicitudes WHERE ClienteId = @USofia AND ProfesionalId = @PLucia)
    INSERT INTO dbo.Solicitudes (ClienteId, ProfesionalId, ServicioId, Mensaje, Estado) VALUES
    (@USofia, @PLucia, (SELECT TOP 1 ServicioId FROM dbo.Servicios WHERE ProfesionalId = @PLucia ORDER BY ServicioId),
     N'Tengo una pérdida debajo de la pileta de la cocina. ¿Podés darme un presupuesto?', N'aceptada');

/* Completar la zona de los servicios históricos con la zona del profesional.
   Así los servicios creados antes de incorporar la columna siguen siendo visibles. */
UPDATE s
SET Zona = p.Zona
FROM dbo.Servicios AS s
INNER JOIN dbo.Profesionales AS p ON p.ProfesionalId = s.ProfesionalId
WHERE s.Zona IS NULL OR LTRIM(RTRIM(s.Zona)) = N'';

GO
