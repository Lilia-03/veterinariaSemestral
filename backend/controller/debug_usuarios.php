<?php
// Guardar como: backend/controller/debug_usuarios.php
// Agregar al inicio del debug_usuarios.php
if (!extension_loaded('pdo_sqlsrv')) {
    die('Extensión pdo_sqlsrv no está instalada');
}

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/debug.log');

// Log inicial
file_put_contents(__DIR__ . '/debug.log', "=== INICIO DEBUG ===\n", FILE_APPEND);
file_put_contents(__DIR__ . '/debug.log', "Timestamp: " . date('Y-m-d H:i:s') . "\n", FILE_APPEND);
file_put_contents(__DIR__ . '/debug.log', "POST data: " . print_r($_POST, true) . "\n", FILE_APPEND);

session_start();

header('Content-Type: application/json; charset=utf-8');

$action = $_POST['action'] ?? $_GET['action'] ?? '';

try {
    file_put_contents(__DIR__ . '/debug.log', "Acción: $action\n", FILE_APPEND);
    
    if (empty($action)) {
        throw new Exception('No se especificó una acción');
    }

    // Verificar sesión
    $usuarioActualId = $_SESSION['usuario_id'] ?? null;
    file_put_contents(__DIR__ . '/debug.log', "Usuario ID: " . ($usuarioActualId ?? 'NULL') . "\n", FILE_APPEND);
    
    if (!$usuarioActualId) {
        throw new Exception('Acceso no autorizado. Inicie sesión.');
    }

    // Test de conexión básica
    file_put_contents(__DIR__ . '/debug.log', "Probando conexión PDO...\n", FILE_APPEND);
    try {
        $pdo = new PDO("sqlsrv:Server=localhost;Database=CliniPet", "usuario_esti", "TuPasswordSeguro123!");
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        file_put_contents(__DIR__ . '/debug.log', "Conexión PDO exitosa\n", FILE_APPEND);
    } catch (PDOException $e) {
        file_put_contents(__DIR__ . '/debug.log', "Error PDO: " . $e->getMessage() . "\n", FILE_APPEND);
        throw new Exception('Error de conexión a base de datos: ' . $e->getMessage());
    }

    switch ($action) {
        case 'test':
            file_put_contents(__DIR__ . '/debug.log', "Ejecutando test\n", FILE_APPEND);
            echo json_encode([
                'success' => true, 
                'message' => 'Test exitoso',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            break;

        case 'obtenerRoles':
            file_put_contents(__DIR__ . '/debug.log', "Obteniendo roles...\n", FILE_APPEND);
            try {
                $stmt = $pdo->query("SELECT RolID, NombreRol, Descripcion FROM Roles ORDER BY RolID");
                $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
                file_put_contents(__DIR__ . '/debug.log', "Roles obtenidos: " . count($roles) . "\n", FILE_APPEND);
                echo json_encode(['success' => true, 'data' => $roles]);
            } catch (Exception $e) {
                file_put_contents(__DIR__ . '/debug.log', "Error obteniendo roles: " . $e->getMessage() . "\n", FILE_APPEND);
                throw $e;
            }
            break;

        case 'obtenerUsuarios':
            file_put_contents(__DIR__ . '/debug.log', "Obteniendo usuarios...\n", FILE_APPEND);
            try {
                $sql = "SELECT u.UsuarioID, u.NombreUsuario, u.Email, u.NombreCompleto, 
                               r.NombreRol, u.Activo, u.UltimoAcceso, u.FechaCreacion, u.RolID
                        FROM Usuarios u 
                        INNER JOIN Roles r ON u.RolID = r.RolID 
                        ORDER BY u.UsuarioID";
                $stmt = $pdo->prepare($sql);
                $stmt->execute();
                $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
                file_put_contents(__DIR__ . '/debug.log', "Usuarios obtenidos: " . count($usuarios) . "\n", FILE_APPEND);
                echo json_encode(['success' => true, 'data' => $usuarios]);
            } catch (Exception $e) {
                file_put_contents(__DIR__ . '/debug.log', "Error obteniendo usuarios: " . $e->getMessage() . "\n", FILE_APPEND);
                throw $e;
            }
            break;

        case 'registrarUsuario':
            file_put_contents(__DIR__ . '/debug.log', "=== REGISTRAR USUARIO ===\n", FILE_APPEND);
            
            // Validaciones básicas
            $required = ['nombreUsuario', 'email', 'nombreCompleto', 'password', 'rolId'];
            $missing = [];
            
            foreach ($required as $field) {
                if (empty($_POST[$field])) {
                    $missing[] = $field;
                }
            }
            
            if (!empty($missing)) {
                file_put_contents(__DIR__ . '/debug.log', "Campos faltantes: " . implode(', ', $missing) . "\n", FILE_APPEND);
                throw new Exception('Faltan campos: ' . implode(', ', $missing));
            }

            $datos = [
                'nombreUsuario' => trim($_POST['nombreUsuario']),
                'email' => trim($_POST['email']),
                'nombreCompleto' => trim($_POST['nombreCompleto']),
                'password' => $_POST['password'],
                'rolId' => (int)$_POST['rolId'],
                'cedulaCliente' => !empty($_POST['cedulaCliente']) ? trim($_POST['cedulaCliente']) : null
            ];

            // Para clientes
            if ($datos['rolId'] == 3) {
                file_put_contents(__DIR__ . '/debug.log', "Usuario es cliente, validando campos adicionales...\n", FILE_APPEND);
                if (empty($_POST['telefono']) || empty($_POST['direccion']) || empty($datos['cedulaCliente'])) {
                    throw new Exception('Cliente requiere: teléfono, dirección y cédula');
                }
                $datos['telefono'] = trim($_POST['telefono']);
                $datos['direccion'] = trim($_POST['direccion']);
            }

            file_put_contents(__DIR__ . '/debug.log', "Datos preparados: " . print_r($datos, true) . "\n", FILE_APPEND);

            try {
                // Hash de password
                $passwordHash = password_hash($datos['password'], PASSWORD_DEFAULT);
                file_put_contents(__DIR__ . '/debug.log', "Password hasheado\n", FILE_APPEND);

                // Preparar SQL
               // Cambiar esta línea en el case 'registrarUsuario':
$sql = "EXEC CrearUsuarioSimple 
    @NombreUsuario = ?, 
    @Email = ?, 
    @PasswordHash = ?, 
    @NombreCompleto = ?, 
    @RolID = ?, 
    @CedulaCliente = ?, 
    @UsuarioCreadorID = ?,
    @Telefono = ?,
    @Direccion = ?";

                file_put_contents(__DIR__ . '/debug.log', "SQL preparado\n", FILE_APPEND);

                $stmt = $pdo->prepare($sql);
                
                $parametros = [
                    $datos['nombreUsuario'],
                    $datos['email'],
                    $passwordHash,
                    $datos['nombreCompleto'],
                    $datos['rolId'],
                    $datos['cedulaCliente'],
                    $usuarioActualId,
                    $datos['telefono'] ?? null,
                    $datos['direccion'] ?? null
                ];

                file_put_contents(__DIR__ . '/debug.log', "Parámetros: " . print_r($parametros, true) . "\n", FILE_APPEND);

                $resultado = $stmt->execute($parametros);
                file_put_contents(__DIR__ . '/debug.log', "Execute resultado: " . ($resultado ? 'true' : 'false') . "\n", FILE_APPEND);

                if ($resultado) {
                    echo json_encode(['success' => true, 'message' => 'Usuario creado exitosamente']);
                } else {
                    $errorInfo = $stmt->errorInfo();
                    file_put_contents(__DIR__ . '/debug.log', "Error Info: " . print_r($errorInfo, true) . "\n", FILE_APPEND);
                    throw new Exception('Error al crear usuario: ' . implode(' - ', $errorInfo));
                }

            } catch (PDOException $e) {
                file_put_contents(__DIR__ . '/debug.log', "PDOException: " . $e->getMessage() . "\n", FILE_APPEND);
                throw new Exception('Error de base de datos: ' . $e->getMessage());
            }
            break;

        case 'actualizarUsuario':
            file_put_contents(__DIR__ . '/debug.log', "=== ACTUALIZAR USUARIO ===\n", FILE_APPEND);
            
            if (empty($_POST['idUsuario'])) {
                throw new Exception('ID de usuario requerido');
            }

            $idUsuario = (int)$_POST['idUsuario'];
            file_put_contents(__DIR__ . '/debug.log', "ID a actualizar: $idUsuario\n", FILE_APPEND);

            try {
                // SQL simple para actualizar
                $sql = "UPDATE Usuarios SET 
                        Email = ?, 
                        NombreCompleto = ?, 
                        Activo = ? 
                        WHERE UsuarioID = ?";

                $stmt = $pdo->prepare($sql);
                $resultado = $stmt->execute([
                    trim($_POST['email']),
                    trim($_POST['nombreCompleto']),
                    (int)($_POST['activo'] ?? 1),
                    $idUsuario
                ]);

                file_put_contents(__DIR__ . '/debug.log', "Update resultado: " . ($resultado ? 'true' : 'false') . "\n", FILE_APPEND);

                if ($resultado) {
                    echo json_encode(['success' => true, 'message' => 'Usuario actualizado']);
                } else {
                    throw new Exception('Error al actualizar');
                }

            } catch (PDOException $e) {
                file_put_contents(__DIR__ . '/debug.log', "Error actualizar: " . $e->getMessage() . "\n", FILE_APPEND);
                throw new Exception('Error: ' . $e->getMessage());
            }
            break;

        default:
            throw new Exception('Acción no válida: ' . $action);
    }

} catch (Exception $e) {
    file_put_contents(__DIR__ . '/debug.log', "Exception: " . $e->getMessage() . "\n", FILE_APPEND);
    file_put_contents(__DIR__ . '/debug.log', "Stack: " . $e->getTraceAsString() . "\n", FILE_APPEND);
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'debug' => true
    ]);
    
} catch (Error $e) {
    file_put_contents(__DIR__ . '/debug.log', "Fatal Error: " . $e->getMessage() . "\n", FILE_APPEND);
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error fatal: ' . $e->getMessage(),
        'debug' => true
    ]);
}

file_put_contents(__DIR__ . '/debug.log', "=== FIN DEBUG ===\n\n", FILE_APPEND);
?>