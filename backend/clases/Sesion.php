<?php
require_once __DIR__ . '/../includes/conexion.php';



class Sesion {
    private $tiempo_vida = 3600; // Duración máxima de la sesión en segundos (1 hora)
    private $nombre_sesion = 'VETERINARIA_SESSION';
    
    // Constructor: se ejecuta al instanciar la clase
    public function __construct() {
        $this->configurarSesion(); // Configura parámetros de la sesión
        $this->iniciarSesion(); // Inicia y gestiona la sesión
    }
    
    // Define cómo se debe comportar la sesión
    private function configurarSesion() {
        session_name($this->nombre_sesion); // Asigna un nombre personalizado a la sesión
        session_set_cookie_params([
            'lifetime' => $this->tiempo_vida, // Tiempo de vida de la cookie
            'path' => '/', // Disponible en todo el sitio
            'domain' => '', // Dominio actual
            'secure' => isset($_SERVER['HTTPS']), // Solo HTTPS si está disponible
            'httponly' => true, // Previene acceso via JavaScript
            'samesite' => 'Strict' // Protección CSRF
        ]);
    }
    

    // Inicia la sesión y verifica su validez
    private function iniciarSesion() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start(); // Inicia la sesión si aún no existe
        }
        
        // Si la sesión es nueva o han pasado más de 5 min, se regenera el ID
        if (!isset($_SESSION['iniciada']) || $_SESSION['iniciada'] < time() - 300) {
            session_regenerate_id(true); // Previene el secuestro de sesión
            $_SESSION['iniciada'] = time(); // Registra el inicio
        }
        
        // Verificar tiempo de vida, o sea comprueba si la sesion sigue activa
        $this->verificarTiempoVida();
    }
    // Verifica si la sesión ha expirado
    private function verificarTiempoVida() {
        if (isset($_SESSION['ultima_actividad'])) {
            // Si ha pasado más tiempo del permitido, se destruye la sesión
            if (time() - $_SESSION['ultima_actividad'] > $this->tiempo_vida) {
                $this->destruir();
                return false;
            }
        }
        // Actualiza el tiempo de última actividad
        $_SESSION['ultima_actividad'] = time();
        return true;
    }
    
    // Inicia sesión del usuario con sus datos
    public function iniciarSesionUsuario($usuario) {
        $_SESSION['usuario_id'] = $usuario['id'];
        $_SESSION['usuario_nombre'] = $usuario['nombre'];
        $_SESSION['usuario_email'] = $usuario['email'];
        $_SESSION['usuario_rol'] = $usuario['rol'];
        $_SESSION['usuario_estado'] = $usuario['estado'];
        $_SESSION['token_csrf'] = bin2hex(random_bytes(32)); // Genera un token único para formularios (CSRF)
        $_SESSION['ip_usuario'] = $_SERVER['REMOTE_ADDR']; // Guarda IP y navegador del usuario para seguridad
        $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'];
        
        $this->registrarActividad('LOGIN', $usuario['id']); // Registra el login
        
        return true;
    }
    
    // Verifica si el usuario está logueado y su sesión es válida
    public function estaLogueado() {
        return isset($_SESSION['usuario_id']) && 
               $this->verificarSeguridad() && 
               $this->verificarTiempoVida();
    }


  // Devuelve los datos del usuario si está logueado
    public function obtenerUsuario() {
        if (!$this->estaLogueado()) {
            return null;
        }
        
        return [
            'id' => $_SESSION['usuario_id'],
            'nombre' => $_SESSION['usuario_nombre'],
            'email' => $_SESSION['usuario_email'],
            'rol' => $_SESSION['usuario_rol'],
            'estado' => $_SESSION['usuario_estado']
        ];
    }
    
    // Obtiene solo el rol del usuario
    public function obtenerRol() {
        return $_SESSION['usuario_rol'] ?? null;
    }
    
    // Obtiene solo el ID del usuario
    public function obtenerId() {
        return $_SESSION['usuario_id'] ?? null;
    }
    
    // Verifica si el usuario es administrador
    public function esAdmin() {
        return $this->obtenerRol() === 'admin';
    }
    
    // Verifica si el usuario es veterinario
    public function esVeterinario() {
        return $this->obtenerRol() === 'veterinario';
    }
    
    // Verifica si el usuario es cliente
    public function esCliente() {
        return $this->obtenerRol() === 'cliente';
    }
    

    // Verifica si el usuario tiene los permisos especificados
    public function tienePermiso($permisos_requeridos) {
        if (!$this->estaLogueado()) {
            return false;
        }
        
        $rol_actual = $this->obtenerRol();
        
        // Si es un solo permiso en texto
        if (is_string($permisos_requeridos)) {
            return $rol_actual === $permisos_requeridos;
        }
        
        // Si es un arreglo con varios permisos
        if (is_array($permisos_requeridos)) {
            return in_array($rol_actual, $permisos_requeridos);
        }
        
        return false;
    }
    

    // Devuelve el token CSRF almacenado
    public function obtenerTokenCSRF() {
        return $_SESSION['token_csrf'] ?? null;
    }
    

    // Verifica si el token CSRF recibido es válido
    public function verificarTokenCSRF($token) {
        return isset($_SESSION['token_csrf']) && 
               hash_equals($_SESSION['token_csrf'], $token);
    }
    

    // Cierra sesión completamente y elimina los datos
    public function destruir() {
        if ($this->estaLogueado()) {
            $this->registrarActividad('LOGOUT', $_SESSION['usuario_id']);
        }
        
        // Limpiar todas las variables de sesión
        $_SESSION = array();
        
        // Eliminar la cookie de sesión
        if (isset($_COOKIE[session_name()])) {
            setcookie(session_name(), '', time() - 42000, '/');
        }
        
        // Destruir la sesión
        session_destroy();
        
        return true;
    }
    

    // Regenera el ID y actualiza la actividad si está logueado
    public function renovar() {
        if ($this->estaLogueado()) {
            $_SESSION['ultima_actividad'] = time();
            session_regenerate_id(true); // Seguridad extra
            return true;
        }
        return false;
    }
    

    // Registra cualquier acción en un archivo de log
    private function registrarActividad($accion, $usuario_id) {
        $fecha = date('Y-m-d H:i:s');
        $ip = $_SERVER['REMOTE_ADDR'];
        $user_agent = $_SERVER['HTTP_USER_AGENT'];
        
        $log = "[{$fecha}] {$accion} - Usuario: {$usuario_id} - IP: {$ip} - UserAgent: {$user_agent}" . PHP_EOL;
        
        // Crear directorio de logs si no existe
        $log_dir = __DIR__ . '/../logs/';
        if (!is_dir($log_dir)) {
            mkdir($log_dir, 0755, true);
        }
        
        file_put_contents($log_dir . 'auth.log', $log, FILE_APPEND | LOCK_EX); // Escribe en el archivo de log
    }
    


    // Permite guardar mensajes temporales (como alertas o errores)
    public function establecerMensaje($tipo, $mensaje) {
        $_SESSION['mensaje'] = [
            'tipo' => $tipo,
            'texto' => $mensaje,
            'timestamp' => time()
        ];
    }
    
    // Obtiene y elimina el mensaje temporal
    public function obtenerMensaje() {
        if (isset($_SESSION['mensaje'])) {
            $mensaje = $_SESSION['mensaje'];
            unset($_SESSION['mensaje']); // Elimina después de usarlo
            return $mensaje;
        }
        return null;
    }
    

     // Devuelve el tiempo restante antes de que la sesión expire
    public function obtenerTiempoRestante() {
        if (!$this->estaLogueado()) {
            return 0;
        }
        
        $tiempo_transcurrido = time() - $_SESSION['ultima_actividad'];
        return max(0, $this->tiempo_vida - $tiempo_transcurrido);
    }
    

    // Renueva manualmente el tiempo de actividad
    public function extenderSesion() {
        if ($this->estaLogueado()) {
            $_SESSION['ultima_actividad'] = time();
            return true;
        }
        return false;
    }
}