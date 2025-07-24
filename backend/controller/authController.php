<?php
// backend/controller/authController.php
session_start();
require_once '../includes/conexion.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

class AuthController {
    private $conexion;
    
    public function __construct() {
        $this->conexion = new Conexion();
    }
    
    public function login() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendResponse(false, 'Método no permitido');
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['nombreUsuario']) || !isset($input['password'])) {
            $this->sendResponse(false, 'Faltan datos requeridos');
            return;
        }
        
        $resultado = $this->conexion->autenticarUsuario($input['nombreUsuario'], $input['password']);
        
        if ($resultado['success']) {
            // Crear sesión
            $_SESSION['usuario_id'] = $resultado['usuario']['id'];
            $_SESSION['nombre_usuario'] = $resultado['usuario']['nombreUsuario'];
            $_SESSION['rol_id'] = $resultado['usuario']['rolId'];
            $_SESSION['nombre_rol'] = $resultado['usuario']['nombreRol'];
            $_SESSION['nombre_completo'] = $resultado['usuario']['nombreCompleto'];
            $_SESSION['permisos'] = $resultado['usuario']['permisos'];
            $_SESSION['cedula_cliente'] = $resultado['usuario']['cedulaCliente'];
            $_SESSION['loggedin'] = true;
            
            // Determinar la URL de redirección basada en el rol
            $redirectUrl = $this->determinarRedirect($resultado['usuario']['rolId']);
            
            $this->sendResponse(true, 'Login exitoso', [
                'usuario' => $resultado['usuario'],
                'redirectUrl' => $redirectUrl
            ]);
        } else {
            $this->sendResponse(false, $resultado['message']);
        }
    }
    
    public function logout() {
        session_start();
        session_destroy();
        $this->sendResponse(true, 'Logout exitoso', ['redirectUrl' => '../../login.html']);
    }
    
    public function verificarSesion() {
        if (!isset($_SESSION['loggedin']) || !$_SESSION['loggedin']) {
            $this->sendResponse(false, 'No hay sesión activa');
            return;
        }
        
        // Obtener información actualizada del usuario
        $infoUsuario = $this->conexion->obtenerInfoCompleta($_SESSION['usuario_id']);
        
        if (!$infoUsuario || !$infoUsuario['Activo']) {
            session_destroy();
            $this->sendResponse(false, 'Sesión inválida');
            return;
        }
        
        $this->sendResponse(true, 'Sesión válida', [
            'usuario' => [
                'id' => $_SESSION['usuario_id'],
                'nombreUsuario' => $_SESSION['nombre_usuario'],
                'rolId' => $_SESSION['rol_id'],
                'nombreRol' => $_SESSION['nombre_rol'],
                'nombreCompleto' => $_SESSION['nombre_completo'],
                'permisos' => $_SESSION['permisos'],
                'cedulaCliente' => $_SESSION['cedula_cliente']
            ]
        ]);
    }
    
    public function verificarPermiso($permiso) {
        if (!isset($_SESSION['loggedin']) || !$_SESSION['loggedin']) {
            return false;
        }
        
        return in_array($permiso, $_SESSION['permisos']);
    }
    
    private function determinarRedirect($rolId) {
    // Obtener la ruta base del proyecto
    $baseUrl = '/veterinariaSemestral/frontend/';
    
    switch ($rolId) {
        case 1: // Administrador
            return $baseUrl . 'admin/admin.html';
        case 2: // Operador/Trabajador
            return $baseUrl . 'trabajador/trabajador.html';
        case 3: // Cliente
            return $baseUrl . 'cliente/cliente.html';
        default:
            return $baseUrl . 'index.html';
    }
}
    
    private function sendResponse($success, $message, $data = null) {
        $response = [
            'success' => $success,
            'message' => $message
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        echo json_encode($response);
        exit;
    }
}

// Manejar las rutas
$controller = new AuthController();

if (isset($_GET['action'])) {
    switch ($_GET['action']) {
        case 'login':
            $controller->login();
            break;
        case 'logout':
            $controller->logout();
            break;
        case 'verificar':
            $controller->verificarSesion();
            break;
        default:
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Acción no encontrada']);
            break;
    }
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Acción requerida']);
}
?>