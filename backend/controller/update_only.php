<?php
// 🎯 CONTROLLER ESPECÍFICO SOLO PARA ACTUALIZAR MASCOTAS
header("Content-Type: application/json; charset=utf-8");

error_log("🔥 UPDATE_ONLY CONTROLLER INICIADO");
error_log("METHOD: " . $_SERVER['REQUEST_METHOD']);
error_log("POST data: " . print_r($_POST, true));

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["estado" => "error", "mensaje" => "Solo acepta POST"]);
    exit;
}

if (!isset($_POST['accion']) || $_POST['accion'] !== 'actualizarMascota') {
    http_response_code(400);
    echo json_encode(["estado" => "error", "mensaje" => "Solo acepta accion actualizarMascota"]);
    exit;
}

error_log("✅ Acción actualizarMascota confirmada");

try {
    require_once __DIR__ . '/../clases/Mascota.php';
    
    $idMascota = $_POST['idMascota'] ?? '';
    $peso = floatval($_POST['peso'] ?? 0);
    $edad = intval($_POST['edad'] ?? 0);

    error_log("Datos recibidos:");
    error_log("- ID Mascota: $idMascota");
    error_log("- Peso: $peso");
    error_log("- Edad: $edad");

    // Validaciones básicas
    if (empty($idMascota)) {
        throw new Exception("ID de mascota es requerido");
    }
    if ($peso <= 0) {
        throw new Exception("El peso debe ser mayor a cero");
    }
    if ($edad <= 0) {
        throw new Exception("La edad debe ser mayor a cero");
    }

    error_log("✅ Validaciones pasadas, creando objeto Mascota");
    
    $mascota = new Mascota();
    $resultado = $mascota->actualizarMascota($_POST);
    
    error_log("Resultado de actualización: " . print_r($resultado, true));
    
    if ($resultado && isset($resultado['success']) && $resultado['success'] === true) {
        echo json_encode([
            "estado" => "ok", 
            "mensaje" => $resultado['message'] ?? "Mascota actualizada correctamente"
        ]);
    } else {
        $errorMsg = isset($resultado['message']) ? $resultado['message'] : "No se pudo actualizar la mascota";
        throw new Exception($errorMsg);
    }
    
} catch (Exception $e) {
    error_log("❌ Error en update_only: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        "estado" => "error", 
        "mensaje" => $e->getMessage()
    ]);
}

error_log("🏁 UPDATE_ONLY CONTROLLER TERMINADO");
?>