<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
session_start();
header('Content-Type: application/json');

// 1) Requerir tu configuración y la clase de conexión
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/conexion.php';

// 2) Leer JSON de la petición
$payload = json_decode(file_get_contents('php://input'), true);
$usuario = trim($payload['usuario'] ?? '');
$password = $payload['password'] ?? '';

if ($usuario === '' || $password === '') {
    echo json_encode(['success' => false, 'message' => 'Usuario y contraseña obligatorios']);
    exit;
}

// 3) Obtener conexión PDO
$db = new Conexion();
$conn = $db->getConnection();
if (!$conn) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos']);
    exit;
}

try {
    // 4) Preparar y ejecutar el SP
    $stmt = $conn->prepare("EXEC AutenticarUsuario :usuario");
    $stmt->bindParam(':usuario', $usuario, PDO::PARAM_STR);
    $stmt->execute();

    // 5) Traer datos
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    $stmt->closeCursor();

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
    } elseif (!(bool)$user['Activo']) {
        echo json_encode(['success' => false, 'message' => 'Cuenta inactiva']);
    } elseif (!password_verify($password, $user['PasswordHash'])) {
        echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta']);
    } else {
        // 6) Éxito: iniciar sesión y devolver rol
        $_SESSION['usuario_id'] = $user['UsuarioID'];
        $_SESSION['usuario']    = $user['NombreUsuario'];
        $_SESSION['rol']        = $user['NombreRol'];

        echo json_encode([
            'success' => true,
            'message' => 'Login exitoso',
            'rol'     => $user['NombreRol']
        ]);
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error en consulta: '.$e->getMessage()]);
}
