<?php
// test_connection.php - Guardar en el directorio backend/controller/

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/test_errors.log');

echo "<h2>Test de Conexión CliniPet</h2>";

// Test 1: Conexión básica
echo "<h3>1. Probando conexión básica a SQL Server...</h3>";
try {
    $pdo = new PDO("sqlsrv:Server=localhost;Database=CliniPet", "usuario_esti", "TuPasswordSeguro123!");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Conexión exitosa<br>";
    
    // Test básico de consulta
    $stmt = $pdo->query("SELECT @@VERSION as version");
    $version = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "📊 Versión SQL Server: " . $version['version'] . "<br>";
    
} catch (PDOException $e) {
    echo "❌ Error de conexión: " . $e->getMessage() . "<br>";
    die();
}

// Test 2: Verificar tablas principales
echo "<h3>2. Verificando tablas principales...</h3>";
$tablas = ['Usuarios', 'Roles', 'Cliente', 'Mascota'];
foreach ($tablas as $tabla) {
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM $tabla");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "✅ Tabla $tabla: " . $result['total'] . " registros<br>";
    } catch (PDOException $e) {
        echo "❌ Error en tabla $tabla: " . $e->getMessage() . "<br>";
    }
}

// Test 3: Verificar procedimientos almacenados
echo "<h3>3. Verificando procedimientos almacenados...</h3>";
$procedimientos = ['CrearUsuario', 'ActualizarUsuario', 'ListarUsuarios', 'RegistrarCliente'];
foreach ($procedimientos as $proc) {
    try {
        $stmt = $pdo->query("SELECT OBJECT_ID('$proc') as obj_id");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($result['obj_id']) {
            echo "✅ Procedimiento $proc existe<br>";
        } else {
            echo "❌ Procedimiento $proc NO existe<br>";
        }
    } catch (PDOException $e) {
        echo "❌ Error verificando $proc: " . $e->getMessage() . "<br>";
    }
}

// Test 4: Probar CrearUsuario con datos de prueba
echo "<h3>4. Probando procedimiento CrearUsuario...</h3>";
try {
    $sql = "EXEC CrearUsuario 
        @NombreUsuario = ?, 
        @Email = ?, 
        @PasswordHash = ?, 
        @NombreCompleto = ?, 
        @RolID = ?, 
        @CedulaCliente = ?, 
        @UsuarioCreadorID = ?,
        @Telefono = ?,
        @Direccion = ?";
    
    $stmt = $pdo->prepare($sql);
    echo "✅ Procedimiento CrearUsuario preparado correctamente<br>";
    
    // No ejecutamos para evitar crear datos de prueba
    echo "ℹ️ Preparación exitosa (no ejecutado para evitar datos de prueba)<br>";
    
} catch (PDOException $e) {
    echo "❌ Error preparando CrearUsuario: " . $e->getMessage() . "<br>";
}

// Test 5: Verificar roles existentes
echo "<h3>5. Verificando roles del sistema...</h3>";
try {
    $stmt = $pdo->query("SELECT RolID, NombreRol, Descripcion FROM Roles ORDER BY RolID");
    $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($roles)) {
        echo "❌ No hay roles en el sistema<br>";
    } else {
        echo "✅ Roles encontrados:<br>";
        foreach ($roles as $rol) {
            echo "&nbsp;&nbsp;- ID: {$rol['RolID']}, Nombre: {$rol['NombreRol']}<br>";
        }
    }
} catch (PDOException $e) {
    echo "❌ Error obteniendo roles: " . $e->getMessage() . "<br>";
}

// Test 6: Verificar usuarios existentes
echo "<h3>6. Verificando usuarios del sistema...</h3>";
try {
    $stmt = $pdo->query("SELECT u.UsuarioID, u.NombreUsuario, u.Email, r.NombreRol, u.Activo 
                        FROM Usuarios u 
                        INNER JOIN Roles r ON u.RolID = r.RolID 
                        ORDER BY u.UsuarioID");
    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($usuarios)) {
        echo "⚠️ No hay usuarios en el sistema<br>";
    } else {
        echo "✅ Usuarios encontrados:<br>";
        foreach ($usuarios as $usuario) {
            $estado = $usuario['Activo'] ? 'Activo' : 'Inactivo';
            echo "&nbsp;&nbsp;- ID: {$usuario['UsuarioID']}, Usuario: {$usuario['NombreUsuario']}, Rol: {$usuario['NombreRol']}, Estado: $estado<br>";
        }
    }
} catch (PDOException $e) {
    echo "❌ Error obteniendo usuarios: " . $e->getMessage() . "<br>";
}

echo "<h3>7. Resumen del Test</h3>";
echo "Si todos los tests anteriores muestran ✅, la configuración es correcta.<br>";
echo "Si hay errores ❌, revisa la configuración de la base de datos.<br>";
echo "<br>Archivo de log: " . __DIR__ . '/test_errors.log<br>';

// Cerrar conexión
$pdo = null;
?>