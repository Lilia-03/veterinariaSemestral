<?php
// backend/includes/sessionGuard.php
class SessionGuard {
    public static function verificarSesion() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['loggedin']) || !$_SESSION['loggedin']) {
            self::enviarErrorAuth('No hay sesión activa');
            exit;
        }
        
        return true;
    }
    
    public static function verificarRol($rolesPermitidos) {
        self::verificarSesion();
        
        $rolUsuario = $_SESSION['rol_id'];
        
        if (!in_array($rolUsuario, $rolesPermitidos)) {
            self::enviarErrorAuth('No tienes permisos para acceder a este recurso');
            exit;
        }
        
        return true;
    }
    
    public static function verificarPermiso($permisoRequerido) {
        self::verificarSesion();
        
        $permisos = $_SESSION['permisos'] ?? [];
        
        if (!in_array($permisoRequerido, $permisos)) {
            self::enviarErrorAuth('No tienes el permiso requerido: ' . $permisoRequerido);
            exit;
        }
        
        return true;
    }
    
    public static function obtenerUsuarioActual() {
        self::verificarSesion();
        
        return [
            'id' => $_SESSION['usuario_id'],
            'nombreUsuario' => $_SESSION['nombre_usuario'],
            'rolId' => $_SESSION['rol_id'],
            'nombreRol' => $_SESSION['nombre_rol'],
            'nombreCompleto' => $_SESSION['nombre_completo'],
            'permisos' => $_SESSION['permisos'],
            'cedulaCliente' => $_SESSION['cedula_cliente']
        ];
    }
    
    public static function esAdmin() {
        self::verificarSesion();
        return $_SESSION['rol_id'] == 1;
    }
    
    public static function esOperador() {
        self::verificarSesion();
        return $_SESSION['rol_id'] == 2;
    }
    
    public static function esCliente() {
        self::verificarSesion();
        return $_SESSION['rol_id'] == 3;
    }
    
    // Método específico para clientes - verificar que solo accedan a sus datos
    public static function verificarPropietarioCliente($cedulaRecurso) {
        self::verificarSesion();
        
        // Si es cliente, verificar que solo acceda a sus propios datos
        if ($_SESSION['rol_id'] == 3) {
            if ($_SESSION['cedula_cliente'] !== $cedulaRecurso) {
                self::enviarErrorAuth('Solo puedes acceder a tus propios datos');
                exit;
            }
        }
        
        return true;
    }
    
    private static function enviarErrorAuth($mensaje) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => $mensaje,
            'redirect' => '../../index.html'
        ]);
    }
}

// Ejemplo de uso de esta clase en  controladores existentes:
/*
// Al inicio de cualquier controlador protegido:
require_once '../includes/sessionGuard.php';

// Para verificar solo login:
SessionGuard::verificarSesion();

// Para verificar roles específicos:
SessionGuard::verificarRol([1, 2]); // Solo admin y operador

// Para verificar permisos específicos:
SessionGuard::verificarPermiso('clientes_crear');

// Para clientes, verificar que solo accedan a sus datos:
SessionGuard::verificarPropietarioCliente($cedula);
*/
?>