---------------FINAL VERSION------------
-- Creación de la base de datos jerhgkeurjhg
CREATE DATABASE CliniPet;
DROP DATABASE CliniPet
-------------------------------------
-- Creación de las tablas
CREATE TABLE Cliente (
    Cedula NVARCHAR(20) PRIMARY KEY NOT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    Teléfono NVARCHAR(15) UNIQUE NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    Dirección NVARCHAR(255) NOT NULL,
    CantidadDeMascotas INT NOT NULL CHECK (CantidadDeMascotas <= 2)
);



----Creación del cliente dummy para el caso de clientes no registrados
INSERT INTO Cliente (Cedula, Nombre, Teléfono, Email, Dirección, CantidadDeMascotas)
VALUES ('---', 'Contado', '---', '---', '---', 0);


CREATE TABLE Especie (
    EspecieID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(50) NOT NULL
);

-- Inserción de las especies
INSERT INTO Especie (Nombre) VALUES
('Perro'), 
('Gato');

SELECT * FROM Especie;


CREATE TABLE Raza (
    RazaID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL,
    EspecieID INT,
    FOREIGN KEY (EspecieID) REFERENCES Especie(EspecieID)
);

-- Inserción de razas de perros
INSERT INTO Raza (Nombre, EspecieID) VALUES
('Labrador Retriever', 1), 
('Golden Retriever', 1),
('Bulldog', 1),
('Beagle', 1),
('Poodle', 1),
('Rottweiler', 1),
('German Shepherd', 1),
('Dachshund', 1),
('Chihuahua', 1),
('Boxer', 1),
('Doberman Pinscher', 1),
('Schnauzer', 1),
('Yorkshire Terrier', 1),
('Shih Tzu', 1),
('Cocker Spaniel', 1),
('Pug', 1),
('Basset Hound', 1),
('Maltese', 1),
('French Bulldog', 1),
('Collie', 1),
('Chow Chow', 1),
('Airedale Terrier', 1),
('Bernese Mountain Dog', 1),
('Great Dane', 1),
('Australian Shepherd', 1),
('Border Collie', 1),
('Cavalier King Charles Spaniel', 1),
('Husky Siberiano', 1),
('Saint Bernard', 1),
('Pit Bull Terrier', 1),
('Italian Greyhound', 1),
('Bull Terrier', 1),
('Akita', 1),
('Shiba Inu', 1),
('Cairn Terrier', 1),
('Basenji', 1),
('Cocker Spaniel Inglés', 1),
('Weimaraner', 1),
('Irish Wolfhound', 1),
('Jack Russell Terrier', 1),
('Newfoundland', 1),
('Samoyed', 1),
('Australian Cattle Dog', 1),
('American Staffordshire Terrier', 1),
('Tibetan Mastiff', 1),
('Criollo', 1); 

-- Inserción de razas de gatos
INSERT INTO Raza (Nombre, EspecieID) VALUES
('Siamés', 2),  
('Persa', 2),
('Maine Coon', 2),
('Ragdoll', 2),
('Bengal', 2),
('British Shorthair', 2),
('Sphynx', 2),
('Abyssinian', 2),
('Birmano', 2),
('Exótico de Pelo Corto', 2),
('Oriental', 2),
('Scottish Fold', 2),
('Burmese', 2),
('Norwegian Forest', 2),
('Russian Blue', 2),
('American Shorthair', 2),
('Savannah', 2),
('Himalayo', 2),
('Chartreux', 2),
('Manx', 2),
('Devon Rex', 2),
('Cornish Rex', 2),
('Turkish Van', 2),
('Singapura', 2),
('Tonkinese', 2),
('Egyptian Mau', 2),
('Munchkin', 2),
('British Longhair', 2),
('Japanese Bobtail', 2),
('LaPerm', 2),
('Turkish Angora', 2),
('Bombay', 2),
('Somali', 2),
('Oriental Longhair', 2),
('Balinese', 2),
('Cymric', 2),
('Korat', 2),
('American Curl', 2);

select*from Raza where Nombre = 'Criollo'



CREATE TABLE Mascota (
    IDMascota INT IDENTITY(10000, 1) PRIMARY KEY,
    Nombre NVARCHAR(50) NOT NULL,
    Especie NVARCHAR(20) NOT NULL CHECK (Especie IN ('Gato', 'Perro', '-')),
    Peso DECIMAL(5,2) NOT NULL,
    Edad NVARCHAR(30) NOT NULL, -- Almacena la edad en formato año, dias, meses lo que se necesite porque si declaro por meses, año, dias solo pensé en ponerlos separados, asi que mejor que sea una cadena 
    FechaRegistro DATETIME DEFAULT GETDATE(),
    CedulaCliente NVARCHAR(20) NOT NULL FOREIGN KEY REFERENCES Cliente(Cedula),
    RazaID INT FOREIGN KEY (RazaID) REFERENCES Raza(RazaID),
	Genero NVARCHAR(10) NOT NULL CHECK (Genero IN ('Macho', 'Hembra', '-')),
	Foto VARBINARY(MAX),
);


--- Hacer este insert  primero,  seleccionen todo  hasta el paso 3 gracias, atte la gerencia :)
-- 1. Activar IDENTITY_INSERT para la tabla Mascota
SET IDENTITY_INSERT Mascota ON;
--2
INSERT INTO Mascota (IDMascota,Nombre,Especie, Peso, Edad, CedulaCliente,Genero)
VALUES(0, '---', '-', 0, '-', '---', '-')
--3
SET IDENTITY_INSERT Mascota OFF;




--Tabla de Condiciones Medicas--
DROP TABLE CondicionMedica
CREATE TABLE CondicionMedica (
    CondicionID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL,
    EspecieID INT NOT NULL,
    FOREIGN KEY (EspecieID) REFERENCES Especie(EspecieID)
);

--Tabla de relacion entre mascota y condiciones medicas--
-- Porque una mascota puede tener varias condiciones medicas--
CREATE TABLE MascotaCondicion (
    IDMascota INT,
    CondicionID INT,
    PRIMARY KEY (IDMascota, CondicionID),
    FOREIGN KEY (IDMascota) REFERENCES Mascota(IDMascota),
    FOREIGN KEY (CondicionID) REFERENCES CondicionMedica(CondicionID)
);

--enfermedades de perros
INSERT INTO CondicionMedica (Nombre, EspecieID) VALUES
('Displasia de cadera', 1),
('Parvovirus', 1),
('Moquillo canino', 1),
('Sarna', 1),
('Obesidad', 1),
('Otitis', 1),
('Gastritis', 1),
('Diabetes canina', 1),
('Insuficiencia renal', 1),
('Epilepsia', 1),
('Problemas cardíacos', 1),
('Artrosis', 1),
('Alergias cutáneas', 1),
('Leishmaniasis', 1),
('Problemas dentales', 1);

-- enfermedades de gatos
INSERT INTO CondicionMedica (Nombre, EspecieID) VALUES
('Leucemia felina (FeLV)', 2),
('Inmunodeficiencia felina (FIV)', 2),
('Insuficiencia renal', 2),
('Asma felino', 2),
('Hipertiroidismo', 2),
('Diabetes felina', 2),
('Obesidad', 2),
('Sarna', 2),
('Problemas urinarios (FLUTD)', 2),
('Alergias alimentarias', 2),
('Toxoplasmosis', 2),
('Otitis', 2),
('Problemas dentales', 2),
('Calicivirus felino', 2),
('Panleucopenia felina', 2);

select*from CondicionMedica where EspecieID = '2'

DROP TABLE MascotaCodigoQR
CREATE TABLE MascotaCodigoQR ( --Cambie esta tabla--
    ID INT IDENTITY(1,1) PRIMARY KEY,
    IDMascota INT,
    CodigoQR VARBINARY(MAX), 
    FechaGeneracion DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (IDMascota) REFERENCES Mascota(IDMascota)
);

---------------------------------------------------------------------------------------

CREATE TABLE Servicio_Producto (
    IDITEM INT IDENTITY(0100,1) PRIMARY KEY,
    NombreProducto NVARCHAR(100) NOT NULL,
    Tipo NVARCHAR(50) NOT NULL CHECK (Tipo IN ('Servicio', 'Producto')),
    PrecioITEM MONEY NOT NULL
);

-- Inserción de Servicios
INSERT INTO Servicio_Producto (NombreProducto, Tipo, PrecioITEM)
VALUES
('Consulta Veterinaria General', 'Servicio', 10.00),
('Consulta Especializada', 'Servicio', 25.00),
('Vacunación Antirrábica', 'Servicio', 10.00),
('Vacunación Triple Felina', 'Servicio', 15.00),
('Vacunación Polivalente Canina', 'Servicio', 20.00),
('Desparasitación Interna', 'Servicio', 10.00),
('Desparasitación Externa', 'Servicio', 20.00),
('Limpieza Dental Básica', 'Servicio', 40.00),
('Limpieza Dental Completa', 'Servicio', 60.00),
('Baño Antipulgas', 'Servicio', 25.00),
('Corte de Uñas', 'Servicio', 8.00),
('Corte de Pelo Estándar', 'Servicio', 20.00),
('Corte de Pelo Estilizado', 'Servicio', 30.00),
('Microchip e Identificación', 'Servicio', 45.00),
('Consulta de Emergencia', 'Servicio', 35.00),
('Radiografía', 'Servicio', 80.00),
('Ultrasonido', 'Servicio', 45.00),
('Hospitalización (por día)', 'Servicio', 150.00),
('Cirugía General', 'Servicio', 500.00),
('Cirugía Especializada', 'Servicio', 1200.00),
('Terapia Física para Mascotas', 'Servicio', 60.00),
('Asesoramiento Nutricional', 'Servicio', 35.00),
('Consulta Dermatológica', 'Servicio', 45.00),
('Consulta Cardiológica', 'Servicio', 60.00),
('Consulta de Comportamiento', 'Servicio', 55.00);

-- Inserción de Productos
INSERT INTO Servicio_Producto (NombreProducto, Tipo, PrecioITEM)
VALUES
('Alimento para Perros (15kg)', 'Producto', 65.00),
('Alimento para Gatos (10kg)', 'Producto', 50.00),
('Arena Sanitaria para Gatos', 'Producto', 25.00),
('Juguete de Cuerda para Perros', 'Producto', 15.00),
('Pelota de Goma para Mascotas', 'Producto', 10.00),
('Collar Antipulgas para Perros', 'Producto', 18.99),
('Collar Antipulgas para Gatos', 'Producto', 16.99),
('Champú Antipulgas', 'Producto', 12.50),
('Champú Hipoalergénico', 'Producto', 14.00),
('Cepillo para Mascotas', 'Producto', 8.00),
('Cama para Perros', 'Producto', 45.00),
('Cama para Gatos', 'Producto', 40.00),
('Transportadora Pequeña', 'Producto', 50.00),
('Transportadora Mediana', 'Producto', 65.00),
('Transportadora Grande', 'Producto', 80.00),
('Rascador para Gatos', 'Producto', 70.00),
('Plato de Comida Antideslizante', 'Producto', 12.00),
('Plato Doble para Mascotas', 'Producto', 15.00),
('Correa Retráctil para Perros', 'Producto', 20.00),
('Arnés para Perros', 'Producto', 25.00),
('Arnés para Gatos', 'Producto', 18.00),
('Kit de Cepillos Dentales', 'Producto', 10.00),
('Comida Húmeda para Perros (6 latas)', 'Producto', 18.00),
('Comida Húmeda para Gatos (6 latas)', 'Producto', 16.00),
('Snacks Dentales para Perros', 'Producto', 12.00),
('Snacks para Gatos', 'Producto', 10.00);

-----------------------------------------------------------
-- ============================================
-- TABLAS PARA USUARIOS Y ROLES
-- ============================================

-- Tabla de Roles
CREATE TABLE Roles (
    RolID INT PRIMARY KEY IDENTITY(1,1),
    NombreRol NVARCHAR(50) NOT NULL UNIQUE,
    Descripcion NVARCHAR(255),
    FechaCreacion DATETIME DEFAULT GETDATE()
);

-- Insertar roles básicos
INSERT INTO Roles (NombreRol, Descripcion) VALUES
('Administrador', 'Control total del sistema'),
('Operador', 'Operaciones del día a día'),
('Cliente', 'Propietario de mascotas');

-- Tabla de Usuarios del Sistema
CREATE TABLE Usuarios (
    UsuarioID INT PRIMARY KEY IDENTITY(1,1),
    NombreUsuario NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    NombreCompleto NVARCHAR(100) NOT NULL,
    RolID INT NOT NULL,
    Activo BIT DEFAULT 1,
    FechaCreacion DATETIME DEFAULT GETDATE(),
    UltimoAcceso DATETIME NULL,
    CedulaCliente NVARCHAR(20) NULL, -- Solo para usuarios tipo Cliente
    FOREIGN KEY (RolID) REFERENCES Roles(RolID),
    FOREIGN KEY (CedulaCliente) REFERENCES Cliente(Cedula)
);

-- Tabla de Permisos
CREATE TABLE Permisos (
    PermisoID INT PRIMARY KEY IDENTITY(1,1),
    NombrePermiso NVARCHAR(100) NOT NULL UNIQUE,
    Modulo NVARCHAR(50) NOT NULL
);

-- Insertar permisos básicos
INSERT INTO Permisos (NombrePermiso, Modulo) VALUES
('usuarios_crear', 'Usuarios'),
('usuarios_leer', 'Usuarios'),
('usuarios_actualizar', 'Usuarios'),
('usuarios_eliminar', 'Usuarios'),
('clientes_crear', 'Clientes'),
('clientes_leer', 'Clientes'),
('clientes_actualizar', 'Clientes'),
('mascotas_crear', 'Mascotas'),
('mascotas_leer', 'Mascotas'),
('mascotas_actualizar', 'Mascotas'),
('consultas_crear', 'Consultas'),
('consultas_leer', 'Consultas'),
('consultas_actualizar', 'Consultas'),
('citas_crear', 'Citas'),
('citas_leer', 'Citas'),
('citas_actualizar', 'Citas'),
('citas_cancelar', 'Citas'),
('vacunas_crear', 'Vacunas'),
('vacunas_leer', 'Vacunas'),
('reportes_ver', 'Reportes'),
('facturacion_ver', 'Facturacion'),
('inventario_actualizar', 'Inventario');


-- Tabla de Roles y Permisos
CREATE TABLE RolesPermisos (
    RolID INT,
    PermisoID INT,
    PRIMARY KEY (RolID, PermisoID),
    FOREIGN KEY (RolID) REFERENCES Roles(RolID),
    FOREIGN KEY (PermisoID) REFERENCES Permisos(PermisoID)
);

-- Asignar permisos a roles
-- Administrador tiene todos los permisos
INSERT INTO RolesPermisos (RolID, PermisoID)
SELECT 1, PermisoID FROM Permisos;

-- Asignación de permisos a Operador (casi completo pero con restricciones)
INSERT INTO RolesPermisos (RolID, PermisoID)
SELECT 2, PermisoID FROM Permisos 
WHERE NombrePermiso NOT IN (
    'usuarios_eliminar'  -- No pueden eliminar permanentemente
);

-- Cliente tiene permisos básicos
INSERT INTO RolesPermisos (RolID, PermisoID)
SELECT 3, PermisoID FROM Permisos 
WHERE NombrePermiso IN ('citas_crear', 'citas_leer', 'citas_cancelar', 'mascotas_leer', 'vacunas_leer', 'consultas_leer');

--------------------------------------------
CREATE TABLE Factura (
    IDFactura INT IDENTITY(01000,1) PRIMARY KEY,
    CedulaCliente NVARCHAR(20) NOT NULL FOREIGN KEY REFERENCES Cliente(Cedula),
    IDMascota INT NULL FOREIGN KEY REFERENCES Mascota(IDMascota),
    Fecha DATETIME DEFAULT GETDATE(),
    subtotalf DECIMAL(10, 2) NULL,    
    ITBMSFactura DECIMAL(10, 2) NULL,
    totalFactura DECIMAL(10, 2) NULL,
    UsuarioFirma INT NOT NULL FOREIGN KEY REFERENCES Usuarios(UsuarioID),-- incluir firma por el usuario que realiza la factura
    FechaFirma DATETIME DEFAULT GETDATE() --fecha de la firma
);


CREATE TABLE Venta (
    IDVenta INT IDENTITY(01,1) PRIMARY KEY,
	IDFactura INT NOT NULL FOREIGN KEY REFERENCES Factura(IDFactura),
    IDITEM INT NOT NULL FOREIGN KEY REFERENCES Servicio_Producto(IDITEM),
    CantidadVendida INT NOT NULL CHECK (CantidadVendida > 0),
	PrecioBruto MONEY NOT NULL,
    ITBMSLinea MONEY NOT NULL, 
    totalLinea MONEY NOT NULL
);


CREATE TABLE Inventario (
	IDInventario INT IDENTITY (010,1),
	IDVenta INT NULL FOREIGN KEY REFERENCES Venta(IDVenta),
	IDITEM INT NOT NULL FOREIGN KEY REFERENCES Servicio_Producto(IDITEM),
	EntradaInventario INT NOT NULL CHECK (EntradaInventario >= 0),
    SalidaInventario INT NOT NULL DEFAULT 0 CHECK (SalidaInventario >= 0),
	CantidadDisponible INT NOT NULL DEFAULT 0
);




-----------------------------------------------------------------------------
------------------------Procedimientos Almacenado----------------------------
-----------------------------------------------------------------------------
--Procedimiento para registrar al cliente
DROP PROCEDURE RegistrarCliente
CREATE PROCEDURE RegistrarCliente
    @Cedula NVARCHAR(20),
    @Nombre NVARCHAR(100),
    @Telefono NVARCHAR(15),
    @Email NVARCHAR(100),
    @Direccion NVARCHAR(255)
AS
BEGIN
    -- Validar el formato de la cédula panameña, extranjera o pasaporte
    IF NOT (
        @Cedula LIKE '[1-9]%'        -- Provincias 1-9
        OR @Cedula LIKE '1[0-9]-%'   -- Provincias 10-19
        OR @Cedula LIKE 'E-%'        -- Extranjeros
        OR @Cedula LIKE '[A-Z][0-9]%' -- Pasaportes
    )
    BEGIN
        RAISERROR (' El formato de la cédula no es válido.', 16, 1);
        RETURN;
    END;

    -- Verificar si la cédula ya está registrada
    IF EXISTS (SELECT 1 FROM Cliente WHERE Cedula = @Cedula)
    BEGIN
        RAISERROR (' La cédula ya está registrada.', 16, 1);
        RETURN;
    END;

    -- Verificar si el teléfono ya está registrado
    IF EXISTS (SELECT 1 FROM Cliente WHERE Teléfono = @Telefono)
    BEGIN
        RAISERROR (' El número de teléfono ya está registrado.', 16, 1);
        RETURN;
    END;

    -- Validar el formato del correo electrónico
    IF NOT (@Email LIKE '_%@_%._%')
    BEGIN
        RAISERROR (' El formato del correo electrónico no es válido.', 16, 1);
        RETURN;
    END;

    -- Verificar si el email ya está registrado
    IF EXISTS (SELECT 1 FROM Cliente WHERE Email = @Email)
    BEGIN
        RAISERROR (' El correo electrónico ya está registrado.', 16, 1);
        RETURN;
    END;

    -- Insertar cliente
    INSERT INTO Cliente (Cedula, Nombre, Teléfono, Email, Dirección, CantidadDeMascotas)
    VALUES (@Cedula, @Nombre, @Telefono, @Email, @Direccion, 0);
END;



--------------------------------------------------------
--Procedimiento para registrar Mascota
drop procedure RegistrarMascota 
CREATE PROCEDURE RegistrarMascota
    @Nombre NVARCHAR(50),
    @Especie NVARCHAR(20),
    @Peso DECIMAL(5,2),
    @Edad NVARCHAR(30), 
    @CedulaCliente NVARCHAR(20),
    @RazaID INT,
    @Genero NVARCHAR(10),
    @Foto VARBINARY(MAX) = NULL,
    @Condiciones NVARCHAR(MAX) = NULL 
AS
BEGIN
SET NOCOUNT ON;
    -- Verificar que el cliente exista en la base de datos
    IF NOT EXISTS (SELECT 1 FROM Cliente WHERE Cedula = @CedulaCliente)
    BEGIN
        RAISERROR ('El cliente no existe.', 16, 1);
        RETURN;
    END;

    -- Verificar que el cliente tiene menos de 2 mascotas registradas
    IF (SELECT COUNT(*) FROM Mascota WHERE CedulaCliente = @CedulaCliente) >= 2
    BEGIN
        RAISERROR ('El cliente ya tiene 2 mascotas registradas.', 16, 1);
        RETURN;
    END;

    -- Validar que el peso y la edad sean positivos
    IF @Peso <= 0
    BEGIN
        RAISERROR ('El peso debe ser mayor a cero.', 16, 1);
        RETURN;
    END;

    IF CAST(@Edad AS INT) <= 0
    BEGIN
        RAISERROR ('La edad debe ser mayor a cero.', 16, 1);
        RETURN;
    END;

    -- Verificar que la raza proporcionada es válida
    IF NOT EXISTS (SELECT 1 FROM Raza WHERE RazaID = @RazaID)
    BEGIN
        RAISERROR ('La raza proporcionada no es válida.', 16, 1);
        RETURN;
    END;

    -- Registrar la mascota
    INSERT INTO Mascota (Nombre, Especie, Peso, Edad, CedulaCliente, RazaID, Genero, Foto)
    VALUES (@Nombre, @Especie, @Peso, @Edad, @CedulaCliente, @RazaID, @Genero, @Foto);

    DECLARE @IDMascota INT = SCOPE_IDENTITY();

     -- Insertar condiciones médicas si existen
    IF @Condiciones IS NOT NULL AND @Condiciones <> ''
    BEGIN
        DECLARE @CondicionID INT;
        DECLARE @xml XML = '<r>' + REPLACE(@Condiciones, ',', '</r><r>') + '</r>';
        DECLARE cursorCond CURSOR FOR
            SELECT T.c.value('.', 'INT') FROM @xml.nodes('/r') AS T(c);

        OPEN cursorCond;
        FETCH NEXT FROM cursorCond INTO @CondicionID;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO MascotaCondicion (IDMascota, CondicionID)
            VALUES (@IDMascota, @CondicionID);
            FETCH NEXT FROM cursorCond INTO @CondicionID;
        END
        CLOSE cursorCond;
        DEALLOCATE cursorCond;
    END;

--Actualizar la cantidad de mascotas del cliente
    UPDATE Cliente
    SET CantidadDeMascotas = CantidadDeMascotas + 1
    WHERE Cedula = @CedulaCliente;
	END;


select * from Mascota
select*From Cliente


-------------------------------------------------------------------------------------
-- procedimiento para consultar la mascota y el cliente
DROP PROCEDURE ConsultarClienteYMascota
CREATE PROCEDURE ConsultarClienteYMascota
    @Cedula NVARCHAR(20) = NULL,  -- Define la longitud del NVARCHAR
    @IDMascota INT = NULL
AS
BEGIN
    SET NOCOUNT ON;  -- Evita que se devuelvan mensajes de conteo de filas afectadas

    SELECT 
        c.Cedula AS CedulaCliente,
        c.Nombre AS NombreCliente,
        c.Teléfono,
        c.Email,
        c.Dirección,
        c.CantidadDeMascotas,
        m.IDMascota,
        m.Nombre AS NombreMascota,
        m.Especie,
        m.Peso,
        m.Edad,
        m.Genero, 
        m.FechaRegistro,
        r.Nombre AS RazaMascota,
        m.Foto,
        STRING_AGG(cm.Nombre, ', ') AS CondicionesMedicas -- Agrega las condiciones médicas como una cadena
    FROM 
        Cliente c
    LEFT JOIN 
        Mascota m ON c.Cedula = m.CedulaCliente
    LEFT JOIN 
        Raza r ON m.RazaID = r.RazaID
    LEFT JOIN 
        MascotaCondicion mc ON m.IDMascota = mc.IDMascota
    LEFT JOIN 
        CondicionMedica cm ON mc.CondicionID = cm.CondicionID
    WHERE 
        (@Cedula IS NULL OR c.Cedula = @Cedula)  -- Filtra por cédula si se proporciona
        AND (@IDMascota IS NULL OR m.IDMascota = @IDMascota)  -- Filtra por ID de mascota si se proporciona
    GROUP BY 
        c.Cedula,
        c.Nombre,
        c.Teléfono,
        c.Email,
        c.Dirección,
        c.CantidadDeMascotas,
        m.IDMascota,
        m.Nombre,
        m.Especie,
        m.Peso,
        m.Edad,
        m.Genero, 
        m.FechaRegistro,
        r.Nombre,
        m.Foto; 
END;

----------------------------------------------------------------------------------------------------------------
--procedimieto de actualizar registro de cliente

CREATE PROCEDURE ActualizarCliente
    @Cedula NVARCHAR(20),
    @Telefono NVARCHAR(15),
    @Email NVARCHAR(100),
    @Direccion NVARCHAR(255)
AS
BEGIN
    -- Validar que la cédula no esté vacía
    IF @Cedula IS NULL OR @Cedula = ''
    BEGIN
        RAISERROR ('La cédula no puede estar vacía.', 16, 1);
        RETURN;
    END;

    -- Validar el formato de la cédula
    IF NOT (
        @Cedula LIKE '[1-9]%'          -- Provincias de 1 a 9
        OR @Cedula LIKE '10-%'          -- Provincia 10
        OR @Cedula LIKE 'E-%'           -- Extranjeros
        OR @Cedula LIKE '[A-Z][0-9]%'   -- Pasaportes
    )
    BEGIN
        RAISERROR ('El formato de la cédula no es válido.', 16, 1);
        RETURN;
    END;

    -- Verificar si la cédula existe en la base de datos
    IF NOT EXISTS (SELECT 1 FROM Cliente WHERE Cedula = @Cedula)
    BEGIN
        RAISERROR ('La cédula no existe en la base de datos.', 16, 1);
        RETURN;
    END;

    -- Validar el formato del teléfono (asegurarse que sea solo números)
    IF @Telefono IS NOT NULL AND @Telefono <> '' AND NOT @Telefono LIKE '[0-9]%' 
    BEGIN
        RAISERROR ('El formato del teléfono no es válido. Debe contener solo números.', 16, 1);
        RETURN;
    END;

    -- Validar el formato del correo electrónico (simple verificación de '@' y '.')
    IF @Email IS NOT NULL AND @Email <> '' AND NOT (@Email LIKE '%@%.%')
    BEGIN
        RAISERROR ('El formato del correo electrónico no es válido.', 16, 1);
        RETURN;
    END;

    -- Actualizar la información del cliente
    UPDATE Cliente
    SET Teléfono = @Telefono,
        Email = @Email,
        Dirección = @Direccion
    WHERE Cedula = @Cedula;

    PRINT 'Información del cliente actualizada exitosamente.';
END;
-----------------------------------------------------------------
--procedimiento para actualizar el registro de la mascota
drop procedure ActualizarMascota
CREATE PROCEDURE ActualizarMascota
    @IDMascota INT, 
    @NuevoPeso DECIMAL(5,2), 
    @NuevaEdad NVARCHAR(50),
    @Condiciones NVARCHAR(MAX) = NULL
AS
BEGIN
    -- Evitar el conteo de filas afectadas
    SET NOCOUNT ON;

    -- Validar que el ID de mascota sea positivo y que exista
    IF @IDMascota IS NULL OR @IDMascota <= 0
    BEGIN
        RAISERROR ('El ID de la mascota debe ser un valor positivo.', 16, 1);
        RETURN;
    END;

    IF NOT EXISTS (SELECT 1 FROM Mascota WHERE IDMascota = @IDMascota)
    BEGIN
        RAISERROR ('La mascota no existe.', 16, 1);
        RETURN;
    END;

    -- Validar que el peso sea positivo
    IF @NuevoPeso <= 0
    BEGIN
        RAISERROR ('El peso debe ser un número positivo o mayor que 0', 16, 1);
        RETURN;
    END;

    -- Validar que la nueva edad sea un número y mayor que la edad actual
    DECLARE @EdadActual NVARCHAR;
    SELECT @EdadActual = Edad FROM Mascota WHERE IDMascota = @IDMascota;

    -- Intentar convertir la nueva edad a INT
    DECLARE @NuevaEdadInt INT;
    BEGIN TRY
        SET @NuevaEdadInt = CAST(@NuevaEdad AS INT);
    END TRY
    BEGIN CATCH
        RAISERROR ('La nueva edad debe ser un número entero', 16, 1);
        RETURN;
    END CATCH;

    IF @NuevaEdadInt <= @EdadActual
    BEGIN
        RAISERROR ('La nueva edad debe ser mayor que la edad actual', 16, 1);
        RETURN;
    END;

    -- Actualizar mascota
    UPDATE Mascota
    SET Peso = @NuevoPeso,
        Edad = @NuevaEdad
    WHERE IDMascota = @IDMascota;

    -- Eliminar condiciones actuales
    DELETE FROM MascotaCondicion WHERE IDMascota = @IDMascota;

    -- Insertar nuevas condiciones
    IF @Condiciones IS NOT NULL AND @Condiciones <> ''
    BEGIN
        DECLARE @CondicionID INT;
        DECLARE @xml XML = '<r>' + REPLACE(@Condiciones, ',', '</r><r>') + '</r>';
        DECLARE cursorCond CURSOR FOR
            SELECT T.c.value('.', 'INT') FROM @xml.nodes('/r') AS T(c);

        OPEN cursorCond;
        FETCH NEXT FROM cursorCond INTO @CondicionID;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO MascotaCondicion (IDMascota, CondicionID)
            VALUES (@IDMascota, @CondicionID);
            FETCH NEXT FROM cursorCond INTO @CondicionID;
        END
        CLOSE cursorCond;
        DEALLOCATE cursorCond;
    END;

    PRINT 'Información de la mascota actualizada exitosamente.';
END;


select*from Cliente
------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------
-- ListarRazasPorEspecie
CREATE PROCEDURE ListarRazasPorEspecie
    @EspecieID INT
AS
BEGIN
    SELECT RazaID, Nombre
    FROM Raza
    WHERE EspecieID = @EspecieID;
END
GO

-- ListarCondicionesPorEspecie
CREATE PROCEDURE ListarCondicionesPorEspecie
    @EspecieID INT
AS
BEGIN
    SELECT CondicionID, Nombre
    FROM CondicionMedica
    WHERE EspecieID = @EspecieID;
END
GO
---------------------------------------------------------------------------------------------------------------------------
-- Procedimiento para generar la factura del servicio prestado
CREATE PROCEDURE GenerarFactura
	@CedulaCliente NVARCHAR(20),
    @IDMascota INT = NULL,
    @UsuarioFirma INT  -- añadido para guardar el Usuario que firma la factura
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validar existencia del cliente
        IF NOT EXISTS (SELECT 1 FROM Cliente WHERE Cedula = @CedulaCliente)
        BEGIN
            RAISERROR ('El cliente no existe.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Validar que el usuario existe y está activo
        IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE UsuarioID = @UsuarioFirma AND Activo = 1)
        BEGIN
            RAISERROR ('Usuario no válido para firmar factura.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Insertar la factura CON LA FIRMA
        INSERT INTO Factura (IDMascota, CedulaCliente, Fecha, UsuarioFirma, FechaFirma)
        VALUES (@IDMascota, @CedulaCliente, GETDATE(), @UsuarioFirma, GETDATE());

        -- Obtener el ID de la factura recién insertada
        DECLARE @IDFactura INT = SCOPE_IDENTITY();

        -- Confirmar transacción
        COMMIT TRANSACTION;
        
        -- Devolver el ID de la factura para poder almacenar en tabla venta
        SELECT @IDFactura AS IDFactura;
        
    END TRY
    BEGIN CATCH
        -- Manejo de errores
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

-------------------------------------------------------------------------------------------------

---procedimiento de actualizar inventario
CREATE PROCEDURE ActualizarInventario
    @IDITEM INT,
    @CantidadAgregada INT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Verificar que el producto exista
        IF NOT EXISTS (SELECT 1 FROM Servicio_Producto WHERE IDITEM = @IDITEM AND Tipo = 'Producto')
        BEGIN
            RAISERROR ('El producto no existe.', 16, 1);
            RETURN;
        END

        -- Obtener la última cantidad disponible
        DECLARE @CantidadDisponibleAnterior INT;
        SELECT TOP 1 @CantidadDisponibleAnterior = CantidadDisponible 
        FROM Inventario 
        WHERE IDITEM = @IDITEM
        ORDER BY IDInventario DESC; -- Aseguramos que obtenemos el último registro por IDInventario

        -- Calcular la nueva cantidad disponible
        DECLARE @NuevaCantidadDisponible INT = ISNULL(@CantidadDisponibleAnterior, 0) + @CantidadAgregada;

        -- Insertar nuevo registro en inventario
        INSERT INTO Inventario (IDITEM, EntradaInventario, SalidaInventario, CantidadDisponible)
        VALUES (@IDITEM, @CantidadAgregada, 0, @NuevaCantidadDisponible);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;


-----------------------------------------------------------------------------------------------
--Procedimiento almacenado para la compra de producto
CREATE PROCEDURE ComprarProducto
  @IDITEM INT,
    @Cantidad INT,
    @IDFactura INT -- Asociar la compra a una factura
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Verificar que el producto exista
        IF NOT EXISTS (SELECT 1 FROM Servicio_Producto WHERE IDITEM = @IDITEM AND Tipo = 'Producto')
        BEGIN
            RAISERROR ('El producto no existe.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Verificar que la factura exista
        IF NOT EXISTS (SELECT 1 FROM Factura WHERE IDFactura = @IDFactura)
        BEGIN
            RAISERROR ('La factura no existe.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Verificar la cantidad disponible en inventario
        DECLARE @CantidadDisponible INT;
        SELECT @CantidadDisponible = CantidadDisponible
        FROM Inventario 
        WHERE IDITEM = @IDITEM;



        IF @CantidadDisponible < @Cantidad
        BEGIN
            RAISERROR ('Cantidad insuficiente en inventario.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Obtener el precio del producto desde la tabla Servicio_Producto
        DECLARE @PrecioUnitario MONEY;
        SELECT @PrecioUnitario = PrecioITEM FROM Servicio_Producto WHERE IDITEM = @IDITEM;

        -- Validar que se encontró el precio del producto
        IF @PrecioUnitario IS NULL
        BEGIN
            RAISERROR ('No se encontró el precio del producto.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Calcular el ITBMS y el total de la línea
        DECLARE @ITBMSLinea MONEY = @PrecioUnitario * @Cantidad * 0.07;
        DECLARE @TotalLinea MONEY = @PrecioUnitario * @Cantidad + @ITBMSLinea;

        -- Insertar la venta
        INSERT INTO Venta (IDFactura, IDITEM, CantidadVendida, PrecioBruto, ITBMSLinea, TotalLinea)
        VALUES (@IDFactura, @IDITEM, @Cantidad, @PrecioUnitario * @Cantidad, @ITBMSLinea, @TotalLinea);

        -- Actualizar el inventario
        INSERT INTO Inventario (IDITEM, EntradaInventario, SalidaInventario, CantidadDisponible, IDVenta)
        VALUES (
            @IDITEM, 
            0, -- porque no ehay entrada
            @Cantidad, -- Cantidad vendida
            @CantidadDisponible - @Cantidad, -- Nueva cantidad disponible
            SCOPE_IDENTITY() -- ID de la venta recién creada
        );

        -- Confirmar la transacción
        COMMIT TRANSACTION;

        PRINT 'Compra de producto registrada exitosamente.';
    END TRY
    BEGIN CATCH
        -- Manejar errores y deshacer cambios
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
----------------------------------------------------------------------------------------------------------------------
--para consultar facturas con firmas
CREATE PROCEDURE ObtenerFacturaConFirma
    @IDFactura INT
AS
BEGIN
    SELECT 
        f.IDFactura,
        f.CedulaCliente,
        c.Nombre AS NombreCliente,
        f.IDMascota,
        m.Nombre AS NombreMascota,
        f.Fecha AS FechaFactura,
        f.subtotalf,
        f.ITBMSFactura,
        f.totalFactura,
        -- INFORMACIÓN DE LA FIRMA
        f.UsuarioFirma,
        u.NombreCompleto AS NombreFirmante,
        u.NombreUsuario AS UsuarioFirmante,
        r.NombreRol AS RolFirmante,
        f.FechaFirma
    FROM Factura f
    INNER JOIN Cliente c ON f.CedulaCliente = c.Cedula
    LEFT JOIN Mascota m ON f.IDMascota = m.IDMascota
    INNER JOIN Usuarios u ON f.UsuarioFirma = u.UsuarioID
    INNER JOIN Roles r ON u.RolID = r.RolID
    WHERE f.IDFactura = @IDFactura;
END;

--------------------------------------------------------------------------------------------------------------------------
--Procedimiento almacenado para el registro del servicio realizado a la mascota
CREATE PROCEDURE RegistrarServicioMascota
    @IDMascota INT,
    @IDITEM INT,
    @IDFactura INT -- Se agrega este parámetro para asociar la venta a la factura
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Verificar que la mascota existe
        IF NOT EXISTS (SELECT 1 FROM Mascota WHERE IDMascota = @IDMascota)
        BEGIN
            RAISERROR ('La mascota no existe.', 16, 1);
            RETURN;
        END

        -- Verificar que el servicio existe
        IF NOT EXISTS (SELECT 1 FROM Servicio_Producto WHERE IDITEM = @IDITEM AND Tipo = 'Servicio')
        BEGIN
            RAISERROR ('El servicio no existe.', 16, 1);
            RETURN;
        END

        -- Verificar que la factura existe
        IF NOT EXISTS (SELECT 1 FROM Factura WHERE IDFactura = @IDFactura)
        BEGIN
            RAISERROR ('La factura no existe.', 16, 1);
            RETURN;
        END

        -- Obtener precio del servicio
        DECLARE @PrecioServicio MONEY = (SELECT PrecioITEM FROM Servicio_Producto WHERE IDITEM = @IDITEM);
        DECLARE @ITBMSLinea MONEY = @PrecioServicio * 0.07;
        DECLARE @totalLinea MONEY = @PrecioServicio + @ITBMSLinea;

        -- Registrar la venta asociada a la factura
        INSERT INTO Venta (IDFactura, IDITEM, CantidadVendida, PrecioBruto, ITBMSLinea, totalLinea)
        VALUES (@IDFactura, @IDITEM, 1, @PrecioServicio, @ITBMSLinea, @totalLinea);

        COMMIT TRANSACTION;

        PRINT 'Servicio registrado exitosamente.';
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;



----------------------------------------------------------------------
------------procedimiento para Completar la factura
CREATE PROCEDURE CompletarFactura
    @IDFactura INT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Calcular el subtotal sumando todas las líneas de la factura
        DECLARE @Subtotal DECIMAL(10, 2);
        SELECT @Subtotal = SUM(PrecioBruto)
        FROM Venta
        WHERE IDFactura = @IDFactura;

        -- Calcular el ITBMS (7% del subtotal)
        DECLARE @ITBMS DECIMAL(10, 2) = @Subtotal * 0.07;

        -- Calcular el total (subtotal + ITBMS)
        DECLARE @Total DECIMAL(10, 2) = @Subtotal + @ITBMS;

        -- Actualizar los campos de la factura
        UPDATE Factura
        SET 
            subtotalf = @Subtotal,
            ITBMSFactura = @ITBMS,
            totalFactura = @Total
        WHERE IDFactura = @IDFactura;

        COMMIT TRANSACTION;

        PRINT 'Factura completada correctamente.';
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

select*from Raza
select* from Factura
select* from Servicio_Producto where Tipo = 'Servicio'


--------------------------Para los reportes------------------------------------------------------------------------------------------------

--Procedimiento almacenado que obtiene el producto mas vendido

CREATE PROCEDURE ObtenerProductosMasVendidos
AS
BEGIN
    WITH ProductosVendidos AS (
        SELECT 
            SP.NombreProducto, 
            SUM(V.CantidadVendida) AS TotalVendido,
            ROW_NUMBER() OVER (ORDER BY SUM(V.CantidadVendida) DESC) AS RowNum
        FROM Venta V
        INNER JOIN Servicio_Producto SP ON V.IDITEM = SP.IDITEM
        WHERE SP.Tipo = 'Producto'
        GROUP BY SP.NombreProducto
    )
    SELECT NombreProducto, TotalVendido
    FROM ProductosVendidos
    WHERE RowNum <= 5; -- Top 5 productos más vendidos
END;


--------------------------------------------------------------------------------------------------------------------------
CREATE PROCEDURE ObtenerServicioMasSolicitado
AS
BEGIN
    WITH ServiciosSolicitados AS (
        SELECT 
            SP.NombreProducto AS NombreServicio, 
            COUNT(V.IDVenta) AS TotalSolicitado,
            ROW_NUMBER() OVER (ORDER BY COUNT(V.IDVenta) DESC) AS RowNum
        FROM Venta V
        INNER JOIN Servicio_Producto SP ON V.IDITEM = SP.IDITEM
        WHERE SP.Tipo = 'Servicio'
        GROUP BY SP.NombreProducto
    )
    SELECT NombreServicio, TotalSolicitado
    FROM ServiciosSolicitados
    WHERE RowNum = 1; -- Servicio más solicitado
END;


----------------------------- data de prueba --------------------------------

INSERT INTO Cliente (Cedula, Nombre, Teléfono, Email, Dirección, CantidadDeMascotas)
VALUES 
('8-123-4567', 'Ana López', '8888-8888', 'ana.lopez@gmail.com', 'Calle Flores 123, San José', 2),
('9-234-5678', 'Carlos Martínez', '7777-7777', 'carlos.mtz@hotmail.com', 'Avenida Central, San Pedro', 1),
('7-345-6789', 'María Fernández', '6666-6666', 'maria.fernandez@yahoo.com', 'Barrio Los Olivos, Heredia', 2);


INSERT INTO Mascota (Nombre, Especie, Peso, Edad, CedulaCliente, RazaID, Genero, Foto)
VALUES 
('Rocky', 'Perro', 25.50, '5 años', '8-123-4567', 1, 'Macho', NULL), -- Labrador Retriever
('Luna', 'Gato', 4.20, '1 año', '9-234-5678', 24, 'Hembra', NULL), -- Siamés
('Max', 'Perro', 30.00, '7 años', '7-345-6789', 8, 'Macho', NULL); -- Beagle


select * from Mascota
----------------------------------------------------------------------------------------

INSERT INTO Inventario (IDITEM, EntradaInventario, SalidaInventario, CantidadDisponible)
VALUES
(125, 50, 0, 50),  -- Alimento para Perros (15kg)
(126, 40, 0, 40),  -- Alimento para Gatos (10kg)
(127, 30, 0, 30),  -- Arena Sanitaria para Gatos
(128, 20, 0, 20),  -- Juguete de Cuerda para Perros
(129, 25, 0, 25),  -- Pelota de Goma para Mascotas
(130, 15, 0, 15),  -- Collar Antipulgas para Perros
(131, 10, 0, 10),  -- Collar Antipulgas para Gatos
(132, 20, 0, 20),  -- Champú Antipulgas
(133, 15, 0, 15),  -- Champú Hipoalergénico
(134, 30, 0, 30),  -- Cepillo para Mascotas
(135, 10, 0, 10),  -- Cama para Perros
(136, 8, 0, 8),    -- Cama para Gatos
(137, 12, 0, 12),  -- Transportadora Pequeña
(138, 10, 0, 10),  -- Transportadora Mediana
(139, 5, 0, 5),    -- Transportadora Grande
(140, 6, 0, 6),    -- Rascador para Gatos
(141, 25, 0, 25),  -- Plato de Comida Antideslizante
(142, 20, 0, 20),  -- Plato Doble para Mascotas
(143, 15, 0, 15),  -- Correa Retráctil para Perros
(144, 18, 0, 18),  -- Arnés para Perros
(145, 12, 0, 12),  -- Arnés para Gatos
(146, 50, 0, 50),  -- Kit de Cepillos Dentales
(147, 25, 0, 25),  -- Comida Húmeda para Perros (6 latas)
(148, 30, 0, 30),  -- Comida Húmeda para Gatos (6 latas)
(149, 40, 0, 40),  -- Snacks Dentales para Perros
(150, 35, 0, 35);  -- Snacks para Gatos

---------------------------------
select*from Mascota where IDMascota = '0'

SELECT * FROM Factura
SELECT* FROM Servicio_Producto WHERE IDITEM = '126'
EXEC ConsultarClienteYMascota @Cedula = NULL, @IDMascota = 10001
EXEC ConsultarClienteYMascota @Cedula = '9-234-5678', @IDMascota = NULL
EXEC ConsultarClienteYMascota @Cedula = '9-234-5678', @IDMascota = 10001


SELECT * FROM Cliente

SELECT * FROM Mascota

SELECT * FROM Inventario

SELECT name FROM sys.check_constraints
WHERE parent_object_id = OBJECT_ID('Mascota') AND name LIKE '%Genero%';

alter table Mascota
drop constraint CK__Mascota__Genero__440B1D61

ALTER TABLE Mascota
ADD CONSTRAINT CK_Mascota_Genero
CHECK (Genero IN ('Macho', 'Hembra', '-'))




-----------------------------------------------------------------------------
--------------------Procedimientos Almacenados Agregados---------------------
-----------------------------------------------------------------------------

-- ============================================
-- PROCEDIMIENTOS PARA USUARIOS Y AUTENTICACIÓN
-- ============================================

-- Procedimiento para crear usuario con restricciones de rol
CREATE PROCEDURE CrearUsuario
    @NombreUsuario NVARCHAR(50),
    @Email NVARCHAR(100),
    @PasswordHash NVARCHAR(255),
    @NombreCompleto NVARCHAR(100),
    @RolID INT,
    @CedulaCliente NVARCHAR(20) = NULL,
    @UsuarioCreadorID INT = NULL  --PARAMETRO PARA VALIDACION
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
		-- Validar cédula para clientes
        IF @RolID = 3 AND (@CedulaCliente IS NULL OR NOT EXISTS (SELECT 1 FROM Cliente WHERE Cedula = @CedulaCliente))
        BEGIN
            RAISERROR('Se requiere cédula válida para usuarios cliente', 16, 1);
            RETURN;
        END;

        -- Verificar si el usuario ya existe
        IF EXISTS (SELECT 1 FROM Usuarios WHERE NombreUsuario = @NombreUsuario OR Email = @Email)
        BEGIN
            RAISERROR('El nombre de usuario o email ya está registrado', 16, 1);
            RETURN;
        END;
        
        -- Validación de permisos para creación
        IF @UsuarioCreadorID IS NOT NULL
        BEGIN
            DECLARE @RolCreador INT;
            SELECT @RolCreador = RolID FROM Usuarios WHERE UsuarioID = @UsuarioCreadorID;
            
            -- Operadores solo pueden crear clientes (RolID = 3)
            IF @RolCreador = 2 AND @RolID <> 3
            BEGIN
                RAISERROR('No tienes permisos para crear este tipo de usuario', 16, 1);
                RETURN;
            END;
        END;
        
        -- Insertar el nuevo usuario
        INSERT INTO Usuarios (
            NombreUsuario, 
            Email, 
            PasswordHash, 
            NombreCompleto, 
            RolID, 
            CedulaCliente
        )
        VALUES (
            @NombreUsuario, 
            @Email, 
            @PasswordHash, 
            @NombreCompleto, 
            @RolID, 
            @CedulaCliente
        );
        
        COMMIT TRANSACTION;
        
        -- Retornar el ID del nuevo usuario
        SELECT SCOPE_IDENTITY() AS UsuarioID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;

----------------------------------------------------------------------

-- Procedimiento para autenticar usuario
CREATE PROCEDURE AutenticarUsuario
    @NombreUsuario NVARCHAR(50)
AS
BEGIN
    -- Obtener datos del usuario incluyendo información de rol
    SELECT 
        u.UsuarioID,
        u.NombreUsuario,
        u.Email,
        u.PasswordHash,
        u.NombreCompleto,
        r.RolID,
        r.NombreRol,
        u.Activo,
        u.CedulaCliente,
        u.UltimoAcceso
    FROM Usuarios u
    INNER JOIN Roles r ON u.RolID = r.RolID
    WHERE u.NombreUsuario = @NombreUsuario;
    
    -- Actualizar último acceso si existe el usuario
    IF @@ROWCOUNT > 0
    BEGIN
        UPDATE Usuarios 
        SET UltimoAcceso = GETDATE() 
        WHERE NombreUsuario = @NombreUsuario;
    END
END;

----------------------------------------------------------

-- Procedimiento para actualizar usuario con restricciones
CREATE PROCEDURE ActualizarUsuario
    @UsuarioID INT,
    @NombreCompleto NVARCHAR(100) = NULL,
    @Email NVARCHAR(100) = NULL,
	@CedulaCliente NVARCHAR(20) = NULL,
    @Activo BIT = NULL,
    @UsuarioEditorID INT  -- Requerido para validación de permisos
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

		-- Validar cédula si se proporciona
        IF @CedulaCliente IS NOT NULL
        BEGIN
            DECLARE @EsCliente BIT;
            SELECT @EsCliente = CASE WHEN RolID = 3 THEN 1 ELSE 0 END 
            FROM Usuarios WHERE UsuarioID = @UsuarioID;
            
            IF @EsCliente = 1 AND NOT EXISTS (SELECT 1 FROM Cliente WHERE Cedula = @CedulaCliente)
            BEGIN
                RAISERROR('Cédula no existe en la tabla Cliente', 16, 1);
                RETURN;
            END;
        END;
        
        -- Obtener información del editor y usuario a modificar
        DECLARE @RolEditor INT, @RolUsuario INT;
        
        SELECT @RolEditor = RolID FROM Usuarios WHERE UsuarioID = @UsuarioEditorID;
        SELECT @RolUsuario = RolID FROM Usuarios WHERE UsuarioID = @UsuarioID;
        
        -- Validar permisos según rol
        IF @RolEditor = 2  -- Si es operador
        BEGIN
            -- Operadores no pueden modificar otros operadores o admins
            IF @RolUsuario IN (1, 2)
            BEGIN
                RAISERROR('No tienes permisos para modificar este usuario', 16, 1);
                RETURN;
            END;
            
            -- Operadores no pueden cambiar el estado de activación
            IF @Activo IS NOT NULL
            BEGIN
                RAISERROR('No puedes cambiar el estado de activación', 16, 1);
                RETURN;
            END;
        END;
        
        -- Actualizar solo campos permitidos
        UPDATE Usuarios SET
            NombreCompleto = ISNULL(@NombreCompleto, NombreCompleto),
            Email = ISNULL(@Email, Email),
            Activo = CASE 
                        WHEN @RolEditor = 1 THEN ISNULL(@Activo, Activo) 
                        ELSE Activo 
                     END
        WHERE UsuarioID = @UsuarioID;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;

------------------------------------------------------------

-- Procedimiento para obtener permisos de usuario
CREATE PROCEDURE ObtenerPermisosUsuario
    @UsuarioID INT
AS
BEGIN
    -- Verificar que el usuario existe y está activo
    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE UsuarioID = @UsuarioID AND Activo = 1)
    BEGIN
        RAISERROR('Usuario no encontrado o inactivo', 16, 1);
        RETURN;
    END;
    
    -- Obtener permisos directos del rol
    SELECT 
        p.PermisoID,
        p.NombrePermiso,
        p.Modulo,
        1 AS TienePermiso  -- Siempre true porque viene de RolesPermisos
    FROM Usuarios u
    INNER JOIN RolesPermisos rp ON u.RolID = rp.RolID
    INNER JOIN Permisos p ON rp.PermisoID = p.PermisoID
    WHERE u.UsuarioID = @UsuarioID
    ORDER BY p.Modulo, p.NombrePermiso;
END;

-------------------------------------------------------------------
-- Procedimiento para listar usuarios con filtros por rol
CREATE PROCEDURE ListarUsuarios
    @UsuarioSolicitanteID INT
AS
BEGIN
    DECLARE @RolSolicitante INT;
    SELECT @RolSolicitante = RolID FROM Usuarios WHERE UsuarioID = @UsuarioSolicitanteID;
    
    -- Administradores ven todos los usuarios
    IF @RolSolicitante = 1
    BEGIN
        SELECT 
            u.UsuarioID,
            u.NombreUsuario,
            u.Email,
            u.NombreCompleto,
            r.NombreRol,
            u.Activo,
            u.FechaCreacion,
            u.UltimoAcceso
        FROM Usuarios u
        INNER JOIN Roles r ON u.RolID = r.RolID
        ORDER BY u.Activo DESC, r.RolID, u.NombreUsuario;
    END
    -- Operadores ven solo clientes
    ELSE IF @RolSolicitante = 2
    BEGIN
        SELECT 
            u.UsuarioID,
            u.NombreUsuario,
            u.Email,
            u.NombreCompleto,
            r.NombreRol,
            u.Activo,
            u.FechaCreacion,
            u.UltimoAcceso
        FROM Usuarios u
        INNER JOIN Roles r ON u.RolID = r.RolID
        WHERE u.RolID = 3  -- Solo clientes
        ORDER BY u.Activo DESC, u.NombreUsuario;
    END
    ELSE
    BEGIN
        RAISERROR('Acceso no autorizado', 16, 1);
    END
END;


--------------------------------------------------------------------
-- Procedimiento para cambiar estado de usuario (activar/desactivar)
CREATE PROCEDURE CambiarEstadoUsuario
    @UsuarioID INT,
    @Activo BIT,
    @UsuarioEditorID INT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @RolEditor INT, @RolUsuario INT;
        
        SELECT @RolEditor = RolID FROM Usuarios WHERE UsuarioID = @UsuarioEditorID;
        SELECT @RolUsuario = RolID FROM Usuarios WHERE UsuarioID = @UsuarioID;
        
        -- Validar permisos
        IF @RolEditor = 2  -- Si es operador
        BEGIN
            -- Operadores solo pueden desactivar clientes
            IF @RolUsuario <> 3
            BEGIN
                RAISERROR('No tienes permisos para esta acción', 16, 1);
                RETURN;
            END;
        END;
        
        -- Actualizar estado
        UPDATE Usuarios 
        SET Activo = @Activo 
        WHERE UsuarioID = @UsuarioID;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;


----------------------------------------------------------------
--Procedimiento para obtener la info de usuario 
CREATE PROCEDURE ObtenerInfoCompletaUsuario
    @UsuarioID INT
AS
BEGIN
    SELECT 
        u.UsuarioID,
        u.NombreUsuario,
        u.Email,
        u.NombreCompleto,
        r.RolID,
        r.NombreRol,
        u.Activo,
        u.CedulaCliente,
        c.Nombre AS NombreCliente,  -- Desde tabla Cliente
        u.FechaCreacion,
        u.UltimoAcceso
    FROM Usuarios u
    INNER JOIN Roles r ON u.RolID = r.RolID
    LEFT JOIN Cliente c ON u.CedulaCliente = c.Cedula
    WHERE u.UsuarioID = @UsuarioID;
END;


------------------------------------------------------------------

CREATE PROCEDURE EliminarUsuario
    @UsuarioID INT,           -- ID del usuario a eliminar
    @UsuarioSolicitanteID INT -- ID del usuario que solicita la eliminación
AS
BEGIN
    SET NOCOUNT ON;

    -- Validar que el solicitante sea administrador
    DECLARE @RolSolicitante INT;
    SELECT @RolSolicitante = RolID FROM Usuarios WHERE UsuarioID = @UsuarioSolicitanteID;

    IF @RolSolicitante IS NULL OR @RolSolicitante <> 1
    BEGIN
        RAISERROR('Solo un administrador puede eliminar usuarios.', 16, 1);
        RETURN;
    END

    -- No permitir eliminar administradores ni clientes
    DECLARE @RolUsuario INT;
    SELECT @RolUsuario = RolID FROM Usuarios WHERE UsuarioID = @UsuarioID;

    IF @RolUsuario IS NULL
    BEGIN
        RAISERROR('El usuario a eliminar no existe.', 16, 1);
        RETURN;
    END

    IF @RolUsuario = 1 OR @RolUsuario = 3
    BEGIN
        RAISERROR('No se puede eliminar un administrador ni un cliente.', 16, 1);
        RETURN;
    END

    -- Eliminar el usuario
    DELETE FROM Usuarios WHERE UsuarioID = @UsuarioID;
END;





----------------------------------------
--DATOS QUE SE PUEDEN USAR PARA VERIFICAR QUE TODO FUNCIONE
-- 1. Crear usuario administrador (éxito)
EXEC CrearUsuario 'admin', 'admin@vet.com', 'hash1', 'Admin Principal', 1, NULL, NULL;

-- 2. Crear operador como administrador (éxito)
EXEC CrearUsuario 'operador1', 'ope1@vet.com', 'hash2', 'Operador Uno', 2, NULL, 1;

-- 3. Crear cliente con cédula válida (éxito)
-- (Asumiendo que existe cédula '12345' en tabla Cliente)
EXEC CrearUsuario 'cliente1', 'cli1@vet.com', 'hash3', 'Cliente Uno', 3, '111-222-963', 1;

-- 4. Operador intenta crear otro operador (error)
EXEC CrearUsuario 'operador2', 'ope2@vet.com', 'hash4', 'Operador Dos', 2, NULL, 2;

-- 5. Operador desactiva cliente (éxito)
EXEC CambiarEstadoUsuario 3, 0, 2;

-- 6. Operador intenta desactivar admin (error)
EXEC CambiarEstadoUsuario 1, 0, 2;


---------------------------------------------------------------
-------------------------------------------------------------------
-- PROCEDIMIENTOS ALMACENADOS PARA GESTIÓN DE INVENTARIO
-- ====================================================
-----------------
-- Procedimiento actualizado para incluir el precio
CREATE PROCEDURE ObtenerProductosInventario
AS
BEGIN
    SELECT DISTINCT 
        sp.IDITEM, 
        sp.NombreProducto, 
        sp.PrecioITEM, 
        ISNULL(i.CantidadDisponible, 0) AS CantidadDisponible
    FROM Servicio_Producto sp
    LEFT JOIN (
        SELECT IDITEM, CantidadDisponible,
               ROW_NUMBER() OVER (PARTITION BY IDITEM ORDER BY IDInventario DESC) AS rn
        FROM Inventario
    ) i ON sp.IDITEM = i.IDITEM AND i.rn = 1
    WHERE sp.Tipo = 'Producto'
    ORDER BY sp.NombreProducto
END
------------------------------------
CREATE PROCEDURE ObtenerDetalleProductoServicio
    @IDITEM INT
AS
BEGIN
    SELECT sp.*, 
        CASE 
            WHEN sp.Tipo = 'Producto' THEN ISNULL(i.CantidadDisponible, 0)
            ELSE NULL
        END AS CantidadDisponible
    FROM Servicio_Producto sp
    LEFT JOIN (
        SELECT IDITEM, CantidadDisponible,
               ROW_NUMBER() OVER (PARTITION BY IDITEM ORDER BY IDInventario DESC) AS rn
        FROM Inventario
    ) i ON sp.IDITEM = i.IDITEM AND i.rn = 1
    WHERE sp.IDITEM = @IDITEM
END

------------------------------------
-- Procedimiento para obtener reporte de inventario para Excel
CREATE PROCEDURE ObtenerReporteInventario
AS
BEGIN
    SELECT 
        sp.IDITEM as 'Código',
        sp.NombreProducto as 'Producto',
        sp.PrecioITEM as 'Precio Unitario',
        ISNULL(i.CantidadDisponible, 0) as 'Cantidad Disponible',
        (sp.PrecioITEM * ISNULL(i.CantidadDisponible, 0)) as 'Valor Total'
    FROM Servicio_Producto sp
    LEFT JOIN (
        SELECT IDITEM, CantidadDisponible,
        ROW_NUMBER() OVER (PARTITION BY IDITEM ORDER BY IDInventario DESC) as rn
        FROM Inventario
    ) i ON sp.IDITEM = i.IDITEM AND i.rn = 1
    WHERE sp.Tipo = 'Producto'
    ORDER BY sp.NombreProducto;
END;

------------------------------------------------------------------------------

--PROCEDIMIENTO PARA AGREGAR PRODUCTO
-- ========================================
CREATE PROCEDURE AgregarProducto
    @Codigo NVARCHAR(50),
    @Nombre NVARCHAR(100),
    @Precio MONEY,
    @Stock INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar si ya existe el código
        IF EXISTS (SELECT 1 FROM Servicio_Producto WHERE IDITEM = @Codigo)
        BEGIN
            RAISERROR('Ya existe un producto con ese código', 16, 1);
            RETURN;
        END
        
        -- Insertar en Servicio_Producto (necesitamos usar IDENTITY_INSERT si queremos código personalizado)
        DECLARE @NewID INT;
        
        INSERT INTO Servicio_Producto (NombreProducto, Tipo, PrecioITEM)
        VALUES (@Nombre, 'Producto', @Precio);
        
        SET @NewID = SCOPE_IDENTITY();
        
        -- Insertar en Inventario con el stock inicial
        INSERT INTO Inventario (IDITEM, EntradaInventario, SalidaInventario, CantidadDisponible)
        VALUES (@NewID, @Stock, 0, @Stock);
        
        COMMIT TRANSACTION;
        
        SELECT @NewID as NuevoID, 'Producto agregado exitosamente' as Mensaje;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
----------------------------------------------------------------------
--PROCEDIMIENTO PARA ELIMINAR PRODUCTO
-- ========================================
CREATE PROCEDURE EliminarProducto
    @IDITEM INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar si el producto existe
        IF NOT EXISTS (SELECT 1 FROM Servicio_Producto WHERE IDITEM = @IDITEM)
        BEGIN
            RAISERROR('El producto no existe', 16, 1);
            RETURN;
        END
        
        -- Verificar si tiene movimientos en ventas
        IF EXISTS (SELECT 1 FROM Venta WHERE IDITEM = @IDITEM)
        BEGIN
            RAISERROR('No se puede eliminar el producto porque tiene movimientos registrados', 16, 1);
            RETURN;
        END
        
        -- Eliminar del inventario primero
        DELETE FROM Inventario WHERE IDITEM = @IDITEM;
        
        -- Eliminar del catálogo de productos
        DELETE FROM Servicio_Producto WHERE IDITEM = @IDITEM;
        
        COMMIT TRANSACTION;
        
        SELECT 'Producto eliminado exitosamente' as Mensaje;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
--------------------------------------------------------
-- PROCEDIMIENTO PARA VERIFICAR CÓDIGO DE PRODUCTO
-- ================================================
CREATE PROCEDURE VerificarCodigoProducto
    @Codigo NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CASE 
            WHEN EXISTS (SELECT 1 FROM Servicio_Producto WHERE IDITEM = @Codigo)
            THEN 1 
            ELSE 0 
        END as Existe;
END;
GO
----------------------------------------------------------------------------
--PROCEDIMIENTO MEJORADO PARA OBTENER PRODUCTOS DE INVENTARIO
-- ============================================================
ALTER PROCEDURE ObtenerProductosInventario
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        sp.IDITEM,
        sp.NombreProducto,
        sp.PrecioITEM,
        sp.Tipo,
        ISNULL(i.CantidadDisponible, 0) as CantidadDisponible,
        ISNULL(i.EntradaInventario, 0) as EntradaInventario,
        ISNULL(i.SalidaInventario, 0) as SalidaInventario
    FROM Servicio_Producto sp
    LEFT JOIN Inventario i ON sp.IDITEM = i.IDITEM
    WHERE sp.Tipo = 'Producto'
    ORDER BY sp.NombreProducto;
END;
GO
-------------------------------------------------------------------
--PROCEDIMIENTO PARA BUSCAR PRODUCTOS
-- =====================================
CREATE PROCEDURE BuscarProductos
    @Termino NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        sp.IDITEM,
        sp.NombreProducto,
        sp.PrecioITEM,
        sp.Tipo,
        ISNULL(i.CantidadDisponible, 0) as CantidadDisponible
    FROM Servicio_Producto sp
    LEFT JOIN Inventario i ON sp.IDITEM = i.IDITEM
    WHERE sp.Tipo = 'Producto'
      AND (sp.NombreProducto LIKE '%' + @Termino + '%' 
           OR CAST(sp.IDITEM as NVARCHAR) LIKE '%' + @Termino + '%')
    ORDER BY sp.NombreProducto;
END;
GO
-------------------------------------------------------------
--PROCEDIMIENTO PARA OBTENER PRODUCTO POR ID
-- ============================================
CREATE PROCEDURE ObtenerProductoPorId
    @IDITEM INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        sp.IDITEM,
        sp.NombreProducto,
        sp.PrecioITEM,
        sp.Tipo,
        ISNULL(i.CantidadDisponible, 0) as CantidadDisponible,
        ISNULL(i.EntradaInventario, 0) as EntradaInventario,
        ISNULL(i.SalidaInventario, 0) as SalidaInventario
    FROM Servicio_Producto sp
    LEFT JOIN Inventario i ON sp.IDITEM = i.IDITEM
    WHERE sp.IDITEM = @IDITEM;
END;
GO
-----------------------------------------------------------------
--PROCEDIMIENTO MEJORADO PARA ACTUALIZAR INVENTARIO
-- ==================================================
ALTER PROCEDURE ActualizarInventario
    @IDITEM INT,
    @CantidadAgregada INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar si el producto existe
        IF NOT EXISTS (SELECT 1 FROM Servicio_Producto WHERE IDITEM = @IDITEM)
        BEGIN
            RAISERROR('El producto no existe', 16, 1);
            RETURN;
        END
        
        -- Verificar si existe registro en inventario
        IF EXISTS (SELECT 1 FROM Inventario WHERE IDITEM = @IDITEM)
        BEGIN
            -- Actualizar inventario existente
            UPDATE Inventario 
            SET 
                EntradaInventario = EntradaInventario + @CantidadAgregada,
                CantidadDisponible = CantidadDisponible + @CantidadAgregada
            WHERE IDITEM = @IDITEM;
        END
        ELSE
        BEGIN
            -- Crear nuevo registro en inventario
            INSERT INTO Inventario (IDITEM, EntradaInventario, SalidaInventario, CantidadDisponible)
            VALUES (@IDITEM, @CantidadAgregada, 0, @CantidadAgregada);
        END
        
        COMMIT TRANSACTION;
        
        SELECT 'Inventario actualizado exitosamente' as Mensaje;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
---------------------------------------------------------------
-------------------------------------------------------------------
-- PROCEDIMIENTOS ALMACENADOS PARA GESTIÓN DE SERVICIOS
-- ====================================================

-- 1. PROCEDIMIENTO PARA AGREGAR SERVICIO
CREATE OR ALTER PROCEDURE AgregarServicio
    @Codigo NVARCHAR(50),
    @Nombre NVARCHAR(100),
    @Precio MONEY
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar si ya existe un servicio con el mismo código
        -- Buscamos por el código que está al inicio del nombre
        IF EXISTS (SELECT 1 FROM Servicio_Producto 
                  WHERE NombreProducto LIKE @Codigo + ' -%' AND Tipo = 'Servicio')
        BEGIN
            RAISERROR('Ya existe un servicio con ese código', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Insertar el servicio
        -- Guardamos el código como parte del nombre para poder identificarlo después
        DECLARE @NombreCompleto NVARCHAR(200) = @Codigo + ' - ' + @Nombre;
        
        INSERT INTO Servicio_Producto (NombreProducto, Tipo, PrecioITEM)
        VALUES (@NombreCompleto, 'Servicio', @Precio);
        
        -- Obtener el ID generado automáticamente
        DECLARE @NuevoID INT = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
        
        SELECT @NuevoID as NuevoID, @Codigo as CodigoUtilizado, 'Servicio agregado exitosamente' as Mensaje;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO
-----------------------------------------------------------------------------------
-- 2. PROCEDIMIENTO PARA VERIFICAR CÓDIGO
CREATE OR ALTER PROCEDURE VerificarCodigoServicio
    @Codigo NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CASE 
            WHEN EXISTS (SELECT 1 FROM Servicio_Producto 
                        WHERE NombreProducto LIKE @Codigo + ' -%' AND Tipo = 'Servicio')
            THEN 1 
            ELSE 0 
        END as Existe;
END;
GO
-------------------------------------------------------------------------------------
-- 3. PROCEDIMIENTO PARA OBTENER SERVICIOS
CREATE OR ALTER PROCEDURE ObtenerServicios
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        IDITEM,
        -- Extraer el código del nombre (parte antes del ' - ')
        CASE 
            WHEN CHARINDEX(' - ', NombreProducto) > 0 
            THEN LEFT(NombreProducto, CHARINDEX(' - ', NombreProducto) - 1)
            ELSE CAST(IDITEM AS NVARCHAR)
        END as CodigoDisplay,
        -- Extraer solo el nombre (parte después del ' - ')
        CASE 
            WHEN CHARINDEX(' - ', NombreProducto) > 0 
            THEN SUBSTRING(NombreProducto, CHARINDEX(' - ', NombreProducto) + 3, LEN(NombreProducto))
            ELSE NombreProducto
        END as NombreServicio,
        NombreProducto as NombreCompleto,
        PrecioITEM,
        Tipo
    FROM Servicio_Producto 
    WHERE Tipo = 'Servicio'
    ORDER BY NombreProducto;
END;
GO
-----------------------------------------------------------------------
-- 4. PROCEDIMIENTO PARA BUSCAR SERVICIOS
CREATE OR ALTER PROCEDURE BuscarServicios
    @Termino NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        IDITEM,
        -- Extraer el código del nombre
        CASE 
            WHEN CHARINDEX(' - ', NombreProducto) > 0 
            THEN LEFT(NombreProducto, CHARINDEX(' - ', NombreProducto) - 1)
            ELSE CAST(IDITEM AS NVARCHAR)
        END as CodigoDisplay,
        -- Extraer solo el nombre
        CASE 
            WHEN CHARINDEX(' - ', NombreProducto) > 0 
            THEN SUBSTRING(NombreProducto, CHARINDEX(' - ', NombreProducto) + 3, LEN(NombreProducto))
            ELSE NombreProducto
        END as NombreServicio,
        NombreProducto as NombreCompleto,
        PrecioITEM,
        Tipo
    FROM Servicio_Producto 
    WHERE Tipo = 'Servicio'
      AND (NombreProducto LIKE '%' + @Termino + '%' 
           OR CAST(IDITEM as NVARCHAR) LIKE '%' + @Termino + '%')
    ORDER BY NombreProducto;
END;
GO
---------------------------------------------------------------
-- 5. PROCEDIMIENTO PARA OBTENER SERVICIO POR ID
CREATE OR ALTER PROCEDURE ObtenerServicioPorId
    @IDITEM INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        IDITEM,
        -- Extraer el código del nombre
        CASE 
            WHEN CHARINDEX(' - ', NombreProducto) > 0 
            THEN LEFT(NombreProducto, CHARINDEX(' - ', NombreProducto) - 1)
            ELSE CAST(IDITEM AS NVARCHAR)
        END as CodigoDisplay,
        -- Extraer solo el nombre
        CASE 
            WHEN CHARINDEX(' - ', NombreProducto) > 0 
            THEN SUBSTRING(NombreProducto, CHARINDEX(' - ', NombreProducto) + 3, LEN(NombreProducto))
            ELSE NombreProducto
        END as NombreServicio,
        NombreProducto as NombreCompleto,
        PrecioITEM,
        Tipo
    FROM Servicio_Producto 
    WHERE IDITEM = @IDITEM AND Tipo = 'Servicio';
END;
GO
---------------------------------------------------------
-- 6. PROCEDIMIENTO PARA ELIMINAR SERVICIO - CORREGIDO SIN DEPENDENCIAS EXTERNAS
CREATE OR ALTER PROCEDURE EliminarServicio
    @IDITEM INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar si el servicio existe
        IF NOT EXISTS (SELECT 1 FROM Servicio_Producto WHERE IDITEM = @IDITEM AND Tipo = 'Servicio')
        BEGIN
            RAISERROR('El servicio no existe', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        EN
        -- Eliminar el servicio
        DELETE FROM Servicio_Producto 
        WHERE IDITEM = @IDITEM AND Tipo = 'Servicio';
        
        -- Verificar si se eliminó alguna fila
        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR('No se pudo eliminar el servicio', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        COMMIT TRANSACTION;
        
        SELECT 'Servicio eliminado exitosamente' as Mensaje;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO
---------------------------------------------------------
-- 7. PROCEDIMIENTO ADICIONAL PARA OBTENER ESTADÍSTICAS
CREATE OR ALTER PROCEDURE ObtenerEstadisticasServicios
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        COUNT(*) as TotalServicios,
        AVG(CAST(PrecioITEM as FLOAT)) as PrecioPromedio,
        MIN(PrecioITEM) as PrecioMinimo,
        MAX(PrecioITEM) as PrecioMaximo,
        SUM(CASE WHEN PrecioITEM > 0 THEN 1 ELSE 0 END) as ServiciosConPrecio
    FROM Servicio_Producto 
    WHERE Tipo = 'Servicio';
END;
GO
