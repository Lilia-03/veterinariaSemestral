
<?php

// Habilitar errores para debug
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../includes/conexion.php';
require_once '../includes/sanitizar.php';
require_once '../clases/Usuarios.php';

// Iniciar sesión para obtener el usuario actual
session_start();

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

    switch ($action) {
        case 'obtenerUsuarios':
            header('Content-Type: application/json; charset=utf-8');
            
            $usuarios = new Usuarios();
            $listaUsuarios = $usuarios->obtenerUsuarios($usuarioActualId);
            echo json_encode(['success' => true, 'data' => $listaUsuarios]);
            break;

        case 'registrarUsuario':
            header('Content-Type: application/json; charset=utf-8');
            
            $datosRequeridos = ['nombreUsuario', 'email', 'nombreCompleto', 'rolId', 'password'];
            foreach ($datosRequeridos as $campo) {
                if (!isset($_POST[$campo]) || empty($_POST[$campo])) {
                    throw new Exception("El campo $campo es requerido");
                }
            }

            $datos = [
                'nombreUsuario' => $_POST['nombreUsuario'],
                'email' => $_POST['email'],
                'nombreCompleto' => $_POST['nombreCompleto'],
                'rolId' => $_POST['rolId'],
                'password' => $_POST['password'],
                'cedulaCliente' => $_POST['cedulaCliente'] ?? null
            ];

            $usuarios = new Usuarios();
            $resultado = $usuarios->registrarUsuario($datos, $usuarioActualId);

            echo json_encode([
                'success' => $resultado['success'],
                'message' => $resultado['message']
            ]);
            break;

        case 'actualizarUsuario':
            header('Content-Type: application/json; charset=utf-8');
            
            if (!isset($_POST['idUsuario']) || empty($_POST['idUsuario'])) {
                throw new Exception('ID de usuario es requerido');
            }

            $datos = [
                'email' => $_POST['email'] ?? '',
                'nombreCompleto' => $_POST['nombreCompleto'] ?? '',
                'rolId' => $_POST['rolId'] ?? '',
                'cedulaCliente' => $_POST['cedulaCliente'] ?? null,
                'activo' => isset($_POST['activo']) ? (bool)$_POST['activo'] : true,
                'password' => $_POST['password'] ?? ''
            ];

            $usuarios = new Usuarios();
            $resultado = $usuarios->actualizarUsuario($_POST['idUsuario'], $datos, $usuarioActualId);

            echo json_encode([
                'success' => $resultado['success'],
                'message' => $resultado['message']
            ]);
            break;


                case 'eliminarUsuario':
            header('Content-Type: application/json; charset=utf-8');
            if (!isset($_POST['usuarioId']) || empty($_POST['usuarioId'])) {
                throw new Exception('ID de usuario es requerido');
            }
            $usuarios = new Usuarios();
            $resultado = $usuarios->eliminarUsuario($_POST['usuarioId'], $usuarioActualId);
            echo json_encode([
                'success' => $resultado['success'],
                'message' => $resultado['message']
            ]);
            break;

        case 'cambiarEstadoUsuario':
            header('Content-Type: application/json; charset=utf-8');
            
            if (!isset($_POST['idUsuario']) || !isset($_POST['nuevoEstado'])) {
                throw new Exception('Datos insuficientes');
            }

            $usuarios = new Usuarios();
            $resultado = $usuarios->cambiarEstadoUsuario(
                $_POST['idUsuario'], 
                (bool)$_POST['nuevoEstado'], 
                $usuarioActualId
            );

            echo json_encode([
                'success' => $resultado['success'],
                'message' => $resultado['message']
            ]);
            break;

        case 'obtenerUsuarioPorId':
            header('Content-Type: application/json; charset=utf-8');
            
            if (!isset($_POST['idUsuario']) && !isset($_GET['idUsuario'])) {
                throw new Exception('ID de usuario es requerido');
            }

            $idUsuario = $_POST['idUsuario'] ?? $_GET['idUsuario'];
            
            $usuarios = new Usuarios();
            $usuario = $usuarios->obtenerUsuarioPorId($idUsuario);
            
            if (!$usuario) {
                throw new Exception('Usuario no encontrado');
            }
            
            echo json_encode(['success' => true, 'data' => $usuario]);
            break;

        case 'obtenerRoles':
            header('Content-Type: application/json; charset=utf-8');
            
            $usuarios = new Usuarios();
            $roles = $usuarios->obtenerRoles();
            
            echo json_encode(['success' => true, 'data' => $roles]);
            break;

        case 'obtenerPermisosRol':
            header('Content-Type: application/json; charset=utf-8');
            
            if (!isset($_POST['rolId']) && !isset($_GET['rolId'])) {
                throw new Exception('ID de rol es requerido');
            }

            $rolId = $_POST['rolId'] ?? $_GET['rolId'];
            
            $usuarios = new Usuarios();
            $permisos = $usuarios->obtenerPermisosPorRol($rolId);
            
            echo json_encode(['success' => true, 'data' => $permisos]);
            break;

        case 'actualizarPermisosRol':
            header('Content-Type: application/json; charset=utf-8');
            
            if (!isset($_POST['rolId']) || !isset($_POST['permisos'])) {
                throw new Exception('Datos insuficientes');
            }

            $usuarios = new Usuarios();
            $resultado = $usuarios->actualizarPermisosRol(
                $_POST['rolId'], 
                json_decode($_POST['permisos'], true)
            );

            echo json_encode([
                'success' => $resultado['success'],
                'message' => $resultado['message']
            ]);
            break;

        case 'buscarUsuarios':
            header('Content-Type: application/json; charset=utf-8');
            
            $termino = $_POST['termino'] ?? $_GET['termino'] ?? '';
            
            $usuarios = new Usuarios();
            $resultados = $usuarios->buscarUsuarios($termino, $usuarioActualId);
            
            echo json_encode(['success' => true, 'data' => $resultados]);
            break;

        case 'cambiarContrasena':
            header('Content-Type: application/json; charset=utf-8');
            
            if (!isset($_POST['idUsuario']) || !isset($_POST['nuevaContrasena'])) {
                throw new Exception('Datos insuficientes');
            }

            $usuarios = new Usuarios();
            $resultado = $usuarios->cambiarContrasena(
                $_POST['idUsuario'], 
                $_POST['nuevaContrasena']
            );

            echo json_encode([
                'success' => $resultado['success'],
                'message' => $resultado['message']
            ]);
            break;

        case 'verificarNombreUsuario':
            header('Content-Type: application/json; charset=utf-8');
            
            if (!isset($_POST['nombreUsuario'])) {
                throw new Exception('Nombre de usuario es requerido');
            }

            $usuarios = new Usuarios();
            $existe = $usuarios->existeNombreUsuario($_POST['nombreUsuario']);
            
            echo json_encode(['success' => true, 'existe' => $existe]);
            break;

        case 'verificarEmail':
            header('Content-Type: application/json; charset=utf-8');
            
            if (!isset($_POST['email'])) {
                throw new Exception('Email es requerido');
            }

            $usuarios = new Usuarios();
            $existe = $usuarios->existeEmail($_POST['email']);
            
            echo json_encode(['success' => true, 'existe' => $existe]);
            break;

        case 'exportarExcelUsuarios':
            // NO establecemos header JSON para exportación
            $usuarios = new Usuarios();
            $datos = $usuarios->obtenerUsuarios($usuarioActualId);

            // Headers para descarga de Excel
            header('Content-Transfer-Encoding: binary');
            header('Content-Type: application/vnd.ms-excel; charset=UTF-8');
            header('Content-Disposition: attachment; filename="usuarios_' . date('Y-m-d') . '.xls"');
            header('Pragma: no-cache');
            header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
            header('Expires: 0');

            // Comenzar el contenido HTML para Excel
            echo "\xEF\xBB\xBF"; // BOM para UTF-8
            echo '<!DOCTYPE html>';
            echo '<html>';
            echo '<head>';
            echo '<meta charset="UTF-8">';
            echo '<style>';
            echo 'table { border-collapse: collapse; width: 100%; }';
            echo 'th, td { border: 1px solid #000; padding: 8px; text-align: left; }';
            echo 'th { background-color: #f0f0f0; font-weight: bold; }';
            echo '</style>';
            echo '</head>';
            echo '<body>';
            
            echo '<h2>Reporte de Usuarios - CliniPet</h2>';
            echo '<p>Generado el: ' . date('Y-m-d H:i:s') . '</p>';
            
            echo '<table>';
            echo '<thead>';
            echo '<tr>';
            echo '<th>ID</th>';
            echo '<th>Nombre de Usuario</th>';
            echo '<th>Nombre Completo</th>';
            echo '<th>Email</th>';
            echo '<th>Rol</th>';
            echo '<th>Estado</th>';
            echo '<th>Último Acceso</th>';
            echo '</tr>';
            echo '</thead>';
            echo '<tbody>';

            if (!empty($datos)) {
                foreach ($datos as $usuario) {
                    echo '<tr>';
                    echo '<td>' . htmlspecialchars($usuario['UsuarioID'] ?? '') . '</td>';
                    echo '<td>' . htmlspecialchars($usuario['NombreUsuario'] ?? '') . '</td>';
                    echo '<td>' . htmlspecialchars($usuario['NombreCompleto'] ?? '') . '</td>';
                    echo '<td>' . htmlspecialchars($usuario['Email'] ?? '') . '</td>';
                    echo '<td>' . htmlspecialchars($usuario['NombreRol'] ?? '') . '</td>';
                    echo '<td>' . ($usuario['Activo'] ? 'Activo' : 'Inactivo') . '</td>';
                    echo '<td>' . htmlspecialchars($usuario['UltimoAcceso'] ?? 'Nunca') . '</td>';
                    echo '</tr>';
                }
            } else {
                echo '<tr>';
                echo '<td colspan="7" style="text-align: center;">No hay datos disponibles</td>';
                echo '</tr>';
            }

            echo '</tbody>';
            echo '</table>';
            echo '</body>';
            echo '</html>';
            
            exit;

        default:
            header('Content-Type: application/json; charset=utf-8');
            throw new Exception('Acción no válida: ' . $action);
    }

} catch (Exception $e) {
    // Solo establecer header JSON si no es exportación
    if ($action !== 'exportarExcelUsuarios') {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    } else {
        // Para exportación, mostrar error en HTML
        echo '<html><body><h1>Error</h1><p>' . htmlspecialchars($e->getMessage()) . '</p></body></html>';
    }
    error_log("Error en UsuariosController.php: " . $e->getMessage());
    
} catch (Error $e) {
    if ($action !== 'exportarExcelUsuarios') {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
    } else {
        echo '<html><body><h1>Error</h1><p>Error interno del servidor</p></body></html>';
    }
    error_log("Error fatal en UsuariosController.php: " . $e->getMessage());
}
?>