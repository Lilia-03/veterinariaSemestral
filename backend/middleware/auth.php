<?php
// Se incluyen las dependencias necesarias para este middleware:
require_once __DIR__ . '/../clases/Sesion.php'; // Carga la clase Sesion que maneja el control de sesiones.
require_once __DIR__ . '/../includes/response.php';  // Carga funciones para enviar respuestas estandarizadas (por ejemplo, errores JSON).


// Definición de la clase AuthMiddleware, usada para controlar acceso a recursos protegidos.
class AuthMiddleware {
    private $sesion; // Propiedad privada para manejar la sesión del usuario.
    
     // Constructor de la clase. Se ejecuta automáticamente cuando se crea un objeto.
    public function __construct() {
        // Se crea una nueva instancia de la clase Sesion para poder acceder a sus métodos.
        $this->sesion = new Sesion();
    }
    
    // Método que verifica si el usuario está autenticado.
    public function verificarAutenticacion() {
        if (!$this->sesion->estaLogueado()) { // Si el usuario no está logueado
            Response::error('No autenticado', 401); //envía un error con el mensaje 'No autenticado' y código HTTP 401 (no autorizado).
            exit; // Termina la ejecución del script inmediatamente.
        }
        return true; // Si pasa la validación, retorna verdadero.
    }
    
    // Método que verifica si el usuario tiene alguno de los roles permitidos.
    public function verificarRol($roles_permitidos) {
        $this->verificarAutenticacion();     // Primero se asegura de que el usuario esté autenticado.
        
        // Verifica si el usuario tiene uno de los roles necesarios.
        if (!$this->sesion->tienePermiso($roles_permitidos)) {
            // Si no tiene permiso, devuelve un error con mensaje y código HTTP 403 (prohibido).
            Response::error('Sin permisos suficientes', 403);
            exit;
        }
        return true; // Si tiene permiso, permite continuar.
    }
    
     // Método para verificar si el token CSRF recibido es válido.
    public function verificarCSRF($token = null) {
        // Si no se recibió un token como parámetro, intenta obtenerlo del formulario (POST o GET).
        if ($token === null) {
            $token = $_POST['csrf_token'] ?? $_GET['csrf_token'] ?? ''; // Usa el operador null coalescente para buscar el token.
        }
        
        // Verifica si el token CSRF es válido usando el método de la clase Sesion.
        if (!$this->sesion->verificarTokenCSRF($token)) {
            // Si es inválido, lanza un error con código 403.
            Response::error('Token CSRF inválido', 403);
            exit;
        }
        return true; // Si el token es válido, permite continuar.
    }
    
    // Método para obtener el usuario actualmente autenticado en sesión.
    public function obtenerUsuarioActual() {
        // Devuelve la información del usuario guardado en la sesión actual.
        return $this->sesion->obtenerUsuario();
    }
}