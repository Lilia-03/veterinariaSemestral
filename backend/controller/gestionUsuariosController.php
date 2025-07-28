<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

session_start();

header('Content-Type: application/json; charset=utf-8');

$action = $_POST['action'] ?? $_GET['action'] ?? '';

try {
    if (empty($action)) {
        throw new Exception('No se especificó una acción');
    }

    // Obtener ID del usuario actual para validación de permisos
    $usuarioActualId = $_SESSION['usuario_id'] ?? null;
    if (!$usuarioActualId) {
        throw new Exception('Acceso no autorizado. Inicie sesión.');
    }

    // Conexión directa a la base de datos (evitamos clases externas por ahora)
    try {
        $pdo = new PDO("sqlsrv:Server=localhost;Database=CliniPet", "usuario_esti", "TuPasswordSeguro123!");
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    } catch (PDOException $e) {
        throw new Exception('Error de conexión a base de datos: ' . $e->getMessage());
    }

    switch ($action) {
        case 'obtenerUsuarios':
            try {
                $sql = "SELECT u.UsuarioID, u.NombreUsuario, u.Email, u.NombreCompleto, 
                               r.NombreRol, u.Activo, u.UltimoAcceso, u.FechaCreacion, u.RolID
                        FROM Usuarios u 
                        INNER JOIN Roles r ON u.RolID = r.RolID 
                        ORDER BY u.UsuarioID";
                $stmt = $pdo->prepare($sql);
                $stmt->execute();
                $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'data' => $usuarios]);
            } catch (Exception $e) {
                throw new Exception('Error al obtener usuarios: ' . $e->getMessage());
            }
            break;

        case 'registrarUsuario':
            try {
                // Validar campos requeridos
                $requiredFields = ['nombreUsuario', 'email', 'nombreCompleto', 'password', 'rolId'];
                $missingFields = [];
                
                foreach ($requiredFields as $field) {
                    if (empty($_POST[$field])) {
                        $missingFields[] = $field;
                    }
                }
                
                if (!empty($missingFields)) {
                    throw new Exception('Faltan campos requeridos: ' . implode(', ', $missingFields));
                }

                // Validar email
                if (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
                    throw new Exception('El formato del correo electrónico no es válido');
                }

                // Validar contraseña
                if (strlen($_POST['password']) < 6) {
                    throw new Exception('La contraseña debe tener al menos 6 caracteres');
                }

                // Preparar datos básicos
                $datos = [
                    'nombreUsuario' => trim($_POST['nombreUsuario']),
                    'email' => trim($_POST['email']),
                    'nombreCompleto' => trim($_POST['nombreCompleto']),
                    'password' => $_POST['password'],
                    'rolId' => (int)$_POST['rolId'],
                    'cedulaCliente' => !empty($_POST['cedulaCliente']) ? trim($_POST['cedulaCliente']) : null
                ];

                // Para rol cliente (3), validar campos adicionales
                if ($datos['rolId'] == 3) {
                    if (empty($_POST['telefono']) || empty($_POST['direccion'])) {
                        throw new Exception('Para usuarios tipo Cliente se requiere teléfono y dirección');
                    }
                    
                    if (empty($datos['cedulaCliente'])) {
                        throw new Exception('Para usuarios tipo Cliente se requiere cédula');
                    }
                    
                    $datos['telefono'] = trim($_POST['telefono']);
                    $datos['direccion'] = trim($_POST['direccion']);
                }

                // Crear usuario usando el procedimiento que funciona
                $passwordHash = password_hash($datos['password'], PASSWORD_DEFAULT);

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

                $resultado = $stmt->execute($parametros);

                if ($resultado) {
                    echo json_encode(['success' => true, 'message' => 'Usuario registrado correctamente']);
                } else {
                    $errorInfo = $stmt->errorInfo();
                    throw new Exception('Error al crear usuario: ' . implode(' - ', $errorInfo));
                }
                
            } catch (PDOException $e) {
                // Manejo específico de errores de SQL Server
                $errorMessage = $e->getMessage();
                if (strpos($errorMessage, '2627') !== false || strpos($errorMessage, 'UNIQUE constraint') !== false) {
                    if (strpos($errorMessage, 'NombreUsuario') !== false) {
                        $errorMessage = 'El nombre de usuario ya está en uso';
                    } elseif (strpos($errorMessage, 'Email') !== false) {
                        $errorMessage = 'El correo electrónico ya está registrado';
                    } elseif (strpos($errorMessage, 'Teléfono') !== false) {
                        $errorMessage = 'El número de teléfono ya está registrado';
                    } elseif (strpos($errorMessage, 'Cedula') !== false) {
                        $errorMessage = 'La cédula ya está registrada';
                    }
                }
                throw new Exception($errorMessage);
            } catch (Exception $e) {
                throw new Exception($e->getMessage());
            }
            break;
    
        case 'actualizarUsuario':
            try {
                if (empty($_POST['idUsuario'])) {
                    throw new Exception('ID de usuario no proporcionado');
                }
                
                // Validar campos requeridos
                if (empty($_POST['email']) || empty($_POST['nombreCompleto'])) {
                    throw new Exception('Email y nombre completo son requeridos');
                }

                // Validar email
                if (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
                    throw new Exception('El formato del correo electrónico no es válido');
                }

                $idUsuario = (int)$_POST['idUsuario'];

                // Usar el procedimiento almacenado ActualizarUsuario
                $sql = "EXEC ActualizarUsuario 
                    @UsuarioID = ?, 
                    @NombreCompleto = ?, 
                    @Email = ?, 
                    @CedulaCliente = ?, 
                    @Activo = ?, 
                    @UsuarioEditorID = ?,
                    @Telefono = ?,
                    @Direccion = ?";

                $stmt = $pdo->prepare($sql);
                
                $parametros = [
                    $idUsuario,
                    trim($_POST['nombreCompleto']),
                    trim($_POST['email']),
                    !empty($_POST['cedulaCliente']) ? trim($_POST['cedulaCliente']) : null,
                    isset($_POST['activo']) ? (int)$_POST['activo'] : 1,
                    $usuarioActualId,
                    !empty($_POST['telefono']) ? trim($_POST['telefono']) : null,
                    !empty($_POST['direccion']) ? trim($_POST['direccion']) : null
                ];

                $resultado = $stmt->execute($parametros);

                if (!$resultado) {
                    $errorInfo = $stmt->errorInfo();
                    throw new Exception('Error al actualizar: ' . implode(' - ', $errorInfo));
                }

                // Cambiar contraseña si se proporciona
                if (!empty($_POST['password'])) {
                    if (strlen($_POST['password']) < 6) {
                        throw new Exception('La contraseña debe tener al menos 6 caracteres');
                    }
                    $passwordHash = password_hash($_POST['password'], PASSWORD_DEFAULT);
                    $sqlPassword = "UPDATE Usuarios SET PasswordHash = ? WHERE UsuarioID = ?";
                    $stmtPassword = $pdo->prepare($sqlPassword);
                    $stmtPassword->execute([$passwordHash, $idUsuario]);
                }
                
                echo json_encode(['success' => true, 'message' => 'Usuario actualizado correctamente']);
                
            } catch (Exception $e) {
                throw new Exception('Error al actualizar usuario: ' . $e->getMessage());
            }
            break;

        case 'eliminarUsuario':
            if (!isset($_POST['usuarioId']) || empty($_POST['usuarioId'])) {
                throw new Exception('ID de usuario es requerido');
            }
            
            try {
                $sql = "EXEC EliminarUsuario ?, ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$_POST['usuarioId'], $usuarioActualId]);
                echo json_encode(['success' => true, 'message' => 'Usuario eliminado correctamente']);
            } catch (Exception $e) {
                throw new Exception('Error al eliminar usuario: ' . $e->getMessage());
            }
            break;

        case 'cambiarEstadoUsuario':
            if (!isset($_POST['idUsuario']) || !isset($_POST['nuevoEstado'])) {
                throw new Exception('Datos insuficientes');
            }

            try {
                $sql = "EXEC CambiarEstadoUsuario ?, ?, ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$_POST['idUsuario'], (bool)$_POST['nuevoEstado'], $usuarioActualId]);
                echo json_encode(['success' => true, 'message' => 'Estado actualizado correctamente']);
            } catch (Exception $e) {
                throw new Exception('Error al cambiar estado: ' . $e->getMessage());
            }
            break;

        case 'obtenerUsuarioPorId':
            if (!isset($_POST['idUsuario']) && !isset($_GET['idUsuario'])) {
                throw new Exception('ID de usuario es requerido');
            }

            $idUsuario = $_POST['idUsuario'] ?? $_GET['idUsuario'];
            
            try {
                $sql = "SELECT u.UsuarioID, u.NombreUsuario, u.Email, u.NombreCompleto, 
                               u.RolID, r.NombreRol, u.Activo, u.CedulaCliente, 
                               c.Nombre AS NombreCliente, u.FechaCreacion, u.UltimoAcceso
                        FROM Usuarios u
                        INNER JOIN Roles r ON u.RolID = r.RolID
                        LEFT JOIN Cliente c ON u.CedulaCliente = c.Cedula
                        WHERE u.UsuarioID = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$idUsuario]);
                $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$usuario) {
                    throw new Exception('Usuario no encontrado');
                }
                
                echo json_encode(['success' => true, 'data' => $usuario]);
            } catch (Exception $e) {
                throw new Exception('Error al obtener usuario: ' . $e->getMessage());
            }
            break;

        case 'obtenerRoles':
            try {
                $sql = "SELECT RolID, NombreRol, Descripcion FROM Roles ORDER BY NombreRol";
                $stmt = $pdo->prepare($sql);
                $stmt->execute();
                $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'data' => $roles]);
            } catch (Exception $e) {
                throw new Exception('Error al obtener roles: ' . $e->getMessage());
            }
            break;

        case 'obtenerPermisosRol':
            if (!isset($_POST['rolId']) && !isset($_GET['rolId'])) {
                throw new Exception('ID de rol es requerido');
            }

            $rolId = $_POST['rolId'] ?? $_GET['rolId'];
            
            try {
                $sql = "SELECT p.PermisoID, p.NombrePermiso, p.Modulo 
                        FROM RolesPermisos rp
                        JOIN Permisos p ON rp.PermisoID = p.PermisoID
                        WHERE rp.RolID = ?
                        ORDER BY p.Modulo, p.NombrePermiso";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$rolId]);
                $permisos = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'data' => $permisos]);
            } catch (Exception $e) {
                throw new Exception('Error al obtener permisos: ' . $e->getMessage());
            }
            break;

        case 'buscarUsuarios':
            $termino = $_POST['termino'] ?? $_GET['termino'] ?? '';
            
            try {
                if (empty($termino)) {
                    // Si no hay término, devolver todos los usuarios
                    $sql = "SELECT u.UsuarioID, u.NombreUsuario, u.Email, u.NombreCompleto, 
                                   r.NombreRol, u.Activo, u.UltimoAcceso, u.FechaCreacion, u.RolID
                            FROM Usuarios u 
                            INNER JOIN Roles r ON u.RolID = r.RolID 
                            ORDER BY u.UsuarioID";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute();
                } else {
                    $sql = "SELECT u.UsuarioID, u.NombreUsuario, u.Email, u.NombreCompleto, 
                                   r.NombreRol, u.Activo, u.UltimoAcceso, u.FechaCreacion, u.RolID
                            FROM Usuarios u 
                            INNER JOIN Roles r ON u.RolID = r.RolID 
                            WHERE u.NombreUsuario LIKE ? OR u.NombreCompleto LIKE ? OR u.Email LIKE ?
                            ORDER BY u.UsuarioID";
                    $stmt = $pdo->prepare($sql);
                    $searchTerm = "%$termino%";
                    $stmt->execute([$searchTerm, $searchTerm, $searchTerm]);
                }
                
                $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'data' => $resultados]);
            } catch (Exception $e) {
                throw new Exception('Error al buscar usuarios: ' . $e->getMessage());
            }
            break;

        case 'verificarNombreUsuario':
            if (!isset($_POST['nombreUsuario'])) {
                throw new Exception('Nombre de usuario es requerido');
            }

            try {
                $sql = "SELECT COUNT(*) as total FROM Usuarios WHERE NombreUsuario = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$_POST['nombreUsuario']]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                $existe = $result['total'] > 0;
                echo json_encode(['success' => true, 'existe' => $existe]);
            } catch (Exception $e) {
                throw new Exception('Error al verificar usuario: ' . $e->getMessage());
            }
            break;

        case 'verificarEmail':
            if (!isset($_POST['email'])) {
                throw new Exception('Email es requerido');
            }

            try {
                $sql = "SELECT COUNT(*) as total FROM Usuarios WHERE Email = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$_POST['email']]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                $existe = $result['total'] > 0;
                echo json_encode(['success' => true, 'existe' => $existe]);
            } catch (Exception $e) {
                throw new Exception('Error al verificar email: ' . $e->getMessage());
            }
            break;

            // Agregar estos casos al switch de tu gestionUsuariosController.php
// Busca el switch($action) y agrega estos casos antes del default:

        case 'actualizarPermisosRol':
            if (!isset($_POST['rolId']) || !isset($_POST['permisos'])) {
                throw new Exception('Datos insuficientes');
            }

            try {
                $rolId = (int)$_POST['rolId'];
                $permisos = json_decode($_POST['permisos'], true);
                
                if (json_last_error() !== JSON_ERROR_NONE) {
                    throw new Exception('Formato de permisos inválido');
                }

                // Iniciar transacción
                $pdo->beginTransaction();
                
                // Eliminar permisos actuales del rol
                $sqlDelete = "DELETE FROM RolesPermisos WHERE RolID = ?";
                $stmtDelete = $pdo->prepare($sqlDelete);
                $stmtDelete->execute([$rolId]);
                
                // Insertar nuevos permisos
                if (!empty($permisos)) {
                    $sqlInsert = "INSERT INTO RolesPermisos (RolID, PermisoID) VALUES (?, ?)";
                    $stmtInsert = $pdo->prepare($sqlInsert);
                    
                    foreach ($permisos as $permisoId) {
                        $stmtInsert->execute([$rolId, (int)$permisoId]);
                    }
                }
                
                // Confirmar transacción
                $pdo->commit();
                
                echo json_encode(['success' => true, 'message' => 'Permisos actualizados correctamente']);
                
            } catch (Exception $e) {
                // Revertir transacción en caso de error
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                throw new Exception('Error al actualizar permisos: ' . $e->getMessage());
            }
            break;

        case 'obtenerTodosPermisos':
            try {
                $sql = "SELECT PermisoID, NombrePermiso, Modulo FROM Permisos ORDER BY Modulo, NombrePermiso";
                $stmt = $pdo->prepare($sql);
                $stmt->execute();
                $permisos = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'data' => $permisos]);
            } catch (Exception $e) {
                throw new Exception('Error al obtener todos los permisos: ' . $e->getMessage());
            }
            break;

        case 'crearRol':
            if (!isset($_POST['nombreRol']) || !isset($_POST['descripcion'])) {
                throw new Exception('Nombre y descripción del rol son requeridos');
            }

            try {
                $sql = "INSERT INTO Roles (NombreRol, Descripcion, FechaCreacion) VALUES (?, ?, GETDATE())";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([trim($_POST['nombreRol']), trim($_POST['descripcion'])]);
                
                echo json_encode(['success' => true, 'message' => 'Rol creado correctamente']);
            } catch (PDOException $e) {
                if (strpos($e->getMessage(), 'UNIQUE constraint') !== false) {
                    throw new Exception('Ya existe un rol con ese nombre');
                }
                throw new Exception('Error al crear rol: ' . $e->getMessage());
            }
            break;

        case 'actualizarRol':
            if (!isset($_POST['rolId']) || !isset($_POST['nombreRol']) || !isset($_POST['descripcion'])) {
                throw new Exception('Datos del rol incompletos');
            }

            try {
                $sql = "UPDATE Roles SET NombreRol = ?, Descripcion = ? WHERE RolID = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([trim($_POST['nombreRol']), trim($_POST['descripcion']), (int)$_POST['rolId']]);
                
                echo json_encode(['success' => true, 'message' => 'Rol actualizado correctamente']);
            } catch (PDOException $e) {
                if (strpos($e->getMessage(), 'UNIQUE constraint') !== false) {
                    throw new Exception('Ya existe un rol con ese nombre');
                }
                throw new Exception('Error al actualizar rol: ' . $e->getMessage());
            }
            break;

        case 'eliminarRol':
            if (!isset($_POST['rolId'])) {
                throw new Exception('ID del rol es requerido');
            }

            try {
                $rolId = (int)$_POST['rolId'];
                
                // Verificar que no haya usuarios con este rol
                $sqlCheck = "SELECT COUNT(*) as total FROM Usuarios WHERE RolID = ?";
                $stmtCheck = $pdo->prepare($sqlCheck);
                $stmtCheck->execute([$rolId]);
                $result = $stmtCheck->fetch(PDO::FETCH_ASSOC);
                
                if ($result['total'] > 0) {
                    throw new Exception('No se puede eliminar el rol porque tiene usuarios asignados');
                }
                
                // No permitir eliminar roles básicos del sistema
                if ($rolId <= 3) {
                    throw new Exception('No se pueden eliminar los roles básicos del sistema');
                }
                
                // Iniciar transacción
                $pdo->beginTransaction();
                
                // Eliminar permisos del rol
                $sqlDeletePermisos = "DELETE FROM RolesPermisos WHERE RolID = ?";
                $stmtDeletePermisos = $pdo->prepare($sqlDeletePermisos);
                $stmtDeletePermisos->execute([$rolId]);
                
                // Eliminar el rol
                $sqlDeleteRol = "DELETE FROM Roles WHERE RolID = ?";
                $stmtDeleteRol = $pdo->prepare($sqlDeleteRol);
                $stmtDeleteRol->execute([$rolId]);
                
                $pdo->commit();
                
                echo json_encode(['success' => true, 'message' => 'Rol eliminado correctamente']);
                
            } catch (Exception $e) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                throw new Exception('Error al eliminar rol: ' . $e->getMessage());
            }
            break;

        default:
            throw new Exception('Acción no válida: ' . $action);
    }

} catch (Exception $e) {
    error_log("Error en UsuariosController.php: " . $e->getMessage());
    if (!headers_sent()) {
        http_response_code(400);
    }
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
    
} catch (Error $e) {
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
    }
    echo json_encode([
        'success' => false, 
        'message' => 'Error interno del servidor'
    ]);
    error_log("Error fatal en UsuariosController.php: " . $e->getMessage());
}
?>