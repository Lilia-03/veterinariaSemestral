<?php
require_once __DIR__ . '/../clases/Sesion.php';
require_once __DIR__ . '/../includes/conexion.php';


header('Content-Type: application/json'); // Establece el tipo de contenido de la respuesta como JSON.
header('Access-Control-Allow-Origin: *'); // Permite que cualquier origen (dominio) acceda a este recurso.
header('Access-Control-Allow-Methods: POST, GET, OPTIONS'); // Indica qué métodos HTTP están permitidos (POST, GET, OPTIONS).
header('Access-Control-Allow-Headers: Content-Type'); // Permite que ciertas cabeceras específicas se usen en las solicitudes (como Content-Type).


// Si el navegador envía una solicitud "OPTIONS" (petición previa), se responde sin procesar más
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}


// Se cargan las clases necesarias para manejar usuarios, sesiones y respuestas
require_once __DIR__ . '/../clases/Usuario.php';
require_once __DIR__ . '/../clases/Sesion.php';
require_once __DIR__ . '/../includes/response.php';


// Se crean instancias de las clases Sesion y Usuario para usarlas más abajo
$sesion = new Sesion();
$usuario = new Usuario();



// Se determina qué tipo de petición llegó (POST o GET)
switch ($_SERVER['REQUEST_METHOD']) {
    // Si es una petición POST se obtiene el contenido enviado por el cliente en formato JSON y se convierte a arreglo
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';  // Se identifica qué acción quiere realizar el cliente
        
        // Según la acción indicada, se llama a la función correspondiente
        switch ($action) {
            case 'login':
                handleLogin($input, $usuario, $sesion);  // Iniciar sesión
                break;
                
            case 'logout':
                handleLogout($sesion); // Cerrar sesión
                break;
                
            case 'register':
                handleRegister($input, $usuario);  // Registrar nuevo usuario
                break;
                
            case 'check':
                handleCheck($sesion); // Verifica si hay una sesión activa
                break;
                
            case 'extend':
                handleExtend($sesion); // Extiende el tiempo de sesión
                break;
                
            default:
                Response::error('Acción no válida'); // Acción desconocida
        }
        break;
        
    // Si es una petición GET, se lee la acción que se pide por URL
    case 'GET':
        $action = $_GET['action'] ?? '';
        
        // Según la acción indicada, se llama a la función correspondiente
        switch ($action) {
            case 'status':
                handleStatus($sesion); // Verifica si el usuario está logueado y tiempo restante
                break;
                
            case 'user':
                handleGetUser($sesion); // Devuelve los datos del usuario logueado
                break;
                
            default:
                Response::error('Acción no válida');
        }
        break;
        
    default:
     // Si se usa un método distinto de POST o GET, se responde con error
        Response::error('Método no permitido', 405);
}


//Funcion para iniciar sesion
function handleLogin($input, $usuario, $sesion) {
    $email = $input['usuario'] ?? '';
    $password = $input['password'] ?? '';
    
    // Verifica que ambos campos estén llenos
    if (empty($email) || empty($password)) {
        Response::error('Usuario y contraseña son requeridos');
        return;
    }
    
    // Intenta autenticar al usuario
    try {
        $userData = $usuario->autenticar($usuario, $password);
        
         // Si el usuario existe pero está inactivo
        if ($userData) {
            if ($userData['estado'] !== 'activo') {
                Response::error('Cuenta inactiva. Contacte al administrador');
                return;
            }
            
             // Si todo está bien, inicia la sesión y devuelve los datos del usuario
            $sesion->iniciarSesionUsuario($userData);
            
            Response::success([
                'message' => 'Login exitoso',
                'user' => [
                    'id' => $userData['id'],
                    'nombre' => $userData['nombre'],
                    'email' => $userData['email'],
                    'rol' => $userData['rol']
                ],
                'csrf_token' => $sesion->obtenerTokenCSRF(), // Token de seguridad para formularios
                'expires_in' => $sesion->obtenerTiempoRestante() // Tiempo que queda antes de que la sesión expire
            ]);
        } else {
            Response::error('Credenciales inválidas'); // Usuario o contraseña incorrectos
        }
    } catch (Exception $e) {
        // Si ocurre algún error técnico
        Response::error('Error en el servidor: ' . $e->getMessage());
    }
}


// Función para cerrar sesión
function handleLogout($sesion) {
    $sesion->destruir(); // Destruye todos los datos de la sesión
    Response::success(['message' => 'Logout exitoso']);
}

function handleCheck($sesion) {
    if ($sesion->estaLogueado()) {
        Response::success([
            'authenticated' => true,
            'user' => $sesion->obtenerUsuario(),
            'expires_in' => $sesion->obtenerTiempoRestante()
        ]);
    } else {
        Response::success(['authenticated' => false]);
    }
}

function handleExtend($sesion) {
    if ($sesion->extenderSesion()) {
        Response::success([
            'message' => 'Sesión extendida',
            'expires_in' => $sesion->obtenerTiempoRestante()
        ]);
    } else {
        Response::error('No se pudo extender la sesión');
    }
}

function handleStatus($sesion) {
    Response::success([
        'authenticated' => $sesion->estaLogueado(),
        'expires_in' => $sesion->obtenerTiempoRestante()
    ]);
}

function handleGetUser($sesion) {
    if ($sesion->estaLogueado()) {
        Response::success([
            'user' => $sesion->obtenerUsuario(),
            'csrf_token' => $sesion->obtenerTokenCSRF()
        ]);
    } else {
        Response::error('No autenticado', 401);
    }
}
