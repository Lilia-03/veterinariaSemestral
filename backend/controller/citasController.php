<?php
// ========== CONFIGURACIÓN DE ERRORES Y DEBUGGING ==========
ini_set('display_errors', 0); // Cambiar a 0 para producción
ini_set('display_startup_errors', 0);
error_reporting(0); // Cambiar a 0 para producción

// Log de errores personalizado
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/citas_errors.log');

// ========== HEADERS CORS ==========
header("Content-Type: application/json; charset=UTF-8");
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// ========== MANEJO DE ERRORES PERSONALIZADOS ==========
function enviarRespuestaError($mensaje, $codigo = 500) {
    http_response_code($codigo);
    echo json_encode([
        "estado" => "error", 
        "mensaje" => $mensaje,
        "timestamp" => date('Y-m-d H:i:s')
    ]);
    exit;
}

function enviarRespuestaExito($data, $mensaje = "Operación exitosa") {
    echo json_encode([
        "estado" => "ok",
        "mensaje" => $mensaje,
        "data" => $data,
        "timestamp" => date('Y-m-d H:i:s')
    ]);
    exit;
}

// ========== VERIFICACIÓN DE ARCHIVOS ==========
if (!file_exists('../clases/cita.php')) {
    enviarRespuestaError("Archivo de clase Cita no encontrado. Verifique la ruta: " . realpath('../clases/'));
}

require_once '../clases/cita.php';

// ========== MANEJO DE PREFLIGHT Y PARÁMETROS ==========
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// ========== VALIDAR PARÁMETROS BÁSICOS ==========
$accion = $_GET['accion'] ?? '';

if (empty($accion)) {
    enviarRespuestaError("Parámetro 'accion' requerido", 400);
}

// ========== LOG DE DEBUGGING ==========
error_log("CITAS CONTROLLER - Acción: $accion - Método: " . $_SERVER['REQUEST_METHOD'] . " - IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));

// ========== INICIALIZAR CLASE CITA ==========
try {
    $cita = new Cita();
} catch (Exception $e) {
    error_log("Error inicializando clase Cita: " . $e->getMessage());
    enviarRespuestaError("Error de inicialización del sistema", 500);
}

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        
        case 'GET':
            switch ($accion) {
                case 'obtenerCliente':
                    $cedula = $_GET['cedula'] ?? '';
                    
                    if (empty($cedula)) {
                        enviarRespuestaError("Cédula requerida", 400);
                    }

                    try {
                        $cliente = $cita->obtenerCliente($cedula);
                        
                        if ($cliente) {
                            echo json_encode(["estado" => "ok", "cliente" => $cliente]);
                        } else {
                            echo json_encode(["estado" => "error", "mensaje" => "Cliente no encontrado"]);
                        }
                    } catch (Exception $e) {
                        error_log("Error obtenerCliente: " . $e->getMessage());
                        enviarRespuestaError("Error al buscar cliente: " . $e->getMessage());
                    }
                    break;
                
                case 'obtenerMascotas':
                    $cedula = $_GET['cedula'] ?? '';
                    
                    if (empty($cedula)) {
                        enviarRespuestaError("Cédula requerida", 400);
                    }

                    try {
                        $mascotas = $cita->obtenerMascotasPorCliente($cedula);
                        echo json_encode(["estado" => "ok", "mascotas" => $mascotas]);
                    } catch (Exception $e) {
                        error_log("Error obtenerMascotas: " . $e->getMessage());
                        enviarRespuestaError("Error al obtener mascotas: " . $e->getMessage());
                    }
                    break;
                    
                case 'obtenerServicios':
                    try {
                        $servicios = $cita->obtenerServicios();
                        echo json_encode(["estado" => "ok", "servicios" => $servicios]);
                    } catch (Exception $e) {
                        error_log("Error obtenerServicios: " . $e->getMessage());
                        enviarRespuestaError("Error al obtener servicios: " . $e->getMessage());
                    }
                    break;
                    
                case 'obtenerDisponibilidad':
                    $fecha = $_GET['fecha'] ?? '';
                    
                    if (empty($fecha)) {
                        enviarRespuestaError("Fecha requerida", 400);
                    }

                    try {
                        $disponibilidad = $cita->obtenerDisponibilidad($fecha);
                        echo json_encode(["estado" => "ok", "horarios" => $disponibilidad]);
                    } catch (Exception $e) {
                        error_log("Error obtenerDisponibilidad: " . $e->getMessage());
                        enviarRespuestaError("Error al obtener disponibilidad: " . $e->getMessage());
                    }
                    break;
                    
                case 'obtenerCitasPorCliente':
                    $cedula = $_GET['cedula'] ?? '';
                    
                    if (empty($cedula)) {
                        enviarRespuestaError("Cédula requerida", 400);
                    }

                    try {
                        $citas = $cita->obtenerPorCliente($cedula);
                        echo json_encode(["estado" => "ok", "citas" => $citas]);
                    } catch (Exception $e) {
                        error_log("Error obtenerCitasPorCliente: " . $e->getMessage());
                        enviarRespuestaError("Error al obtener citas del cliente: " . $e->getMessage());
                    }
                    break;
                    
                case 'obtenerCitasPorFecha':
                    $fechaInicio = $_GET['fechaInicio'] ?? '';
                    $fechaFin = $_GET['fechaFin'] ?? null;
                    
                    if (empty($fechaInicio)) {
                        enviarRespuestaError("Fecha de inicio requerida", 400);
                    }

                    try {
                        $citas = $cita->obtenerPorFecha($fechaInicio, $fechaFin);
                        echo json_encode(["estado" => "ok", "citas" => $citas]);
                    } catch (Exception $e) {
                        error_log("Error obtenerCitasPorFecha: " . $e->getMessage());
                        enviarRespuestaError("Error al obtener citas por fecha: " . $e->getMessage());
                    }
                    break;
                    
                case 'obtenerPendientes':
                    try {
                        $pendientes = $cita->obtenerPendientes();
                        echo json_encode(["estado" => "ok", "citas" => $pendientes]);
                    } catch (Exception $e) {
                        error_log("Error obtenerPendientes: " . $e->getMessage());
                        enviarRespuestaError("Error al obtener citas pendientes: " . $e->getMessage());
                    }
                    break;
                    
                case 'obtenerDetalle':
                    $idCita = $_GET['id'] ?? '';
                    
                    if (empty($idCita)) {
                        enviarRespuestaError("ID de cita requerido", 400);
                    }

                    try {
                        $detalle = $cita->obtenerDetalle($idCita);
                        
                        if ($detalle) {
                            echo json_encode(["estado" => "ok", "cita" => $detalle]);
                        } else {
                            echo json_encode(["estado" => "error", "mensaje" => "Cita no encontrada"]);
                        }
                    } catch (Exception $e) {
                        error_log("Error obtenerDetalle: " . $e->getMessage());
                        enviarRespuestaError("Error al obtener detalle de cita: " . $e->getMessage());
                    }
                    break;
                    
                case 'obtenerEstadisticas':
                    $fechaInicio = $_GET['fechaInicio'] ?? '';
                    $fechaFin = $_GET['fechaFin'] ?? '';
                    
                    if (empty($fechaInicio) || empty($fechaFin)) {
                        enviarRespuestaError("Fechas de inicio y fin requeridas", 400);
                    }

                    try {
                        $estadisticas = $cita->obtenerEstadisticas($fechaInicio, $fechaFin);
                        echo json_encode(["estado" => "ok", "estadisticas" => $estadisticas]);
                    } catch (Exception $e) {
                        error_log("Error obtenerEstadisticas: " . $e->getMessage());
                        enviarRespuestaError("Error al obtener estadísticas: " . $e->getMessage());
                    }
                    break;
                    
                default:
                    enviarRespuestaError("Acción GET no válida: $accion", 400);
            }
            break;

        case 'POST':
            $input = json_decode(file_get_contents("php://input"), true);
            
            if (!$input) {
                enviarRespuestaError("No se pudo leer el JSON de entrada", 400);
            }

            switch ($accion) {
                case 'crearCita':
                    $cedulaCliente = $input['cedulaCliente'] ?? '';
                    $idMascota = $input['idMascota'] ?? '';
                    $fechaCita = $input['fechaCita'] ?? '';
                    $horaCita = $input['horaCita'] ?? '';
                    $tipoServicio = $input['tipoServicio'] ?? '';
                    $observaciones = $input['observaciones'] ?? null;
                    $usuarioCreador = $input['usuarioCreador'] ?? 1;
                    
                    if (empty($cedulaCliente) || empty($idMascota) || empty($fechaCita) || empty($horaCita) || empty($tipoServicio)) {
                        enviarRespuestaError("Datos incompletos para crear la cita", 400);
                    }

                    try {
                        $cita->setDatos($cedulaCliente, $idMascota, $fechaCita, $horaCita, $tipoServicio, $observaciones, $usuarioCreador);
                        $idCita = $cita->crear();
                        
                        echo json_encode([
                            "estado" => "ok", 
                            "mensaje" => "Cita creada exitosamente",
                            "idCita" => $idCita
                        ]);
                    } catch (Exception $e) {
                        error_log("Error crearCita: " . $e->getMessage());
                        enviarRespuestaError("Error al crear la cita: " . $e->getMessage());
                    }
                    break;
                    
                default:
                    enviarRespuestaError("Acción POST no válida: $accion", 400);
            }
            break;

        case 'PUT':
            $input = json_decode(file_get_contents("php://input"), true);
            
            if (!$input) {
                enviarRespuestaError("No se pudo leer el JSON de entrada", 400);
            }

            switch ($accion) {
                case 'actualizarEstado':
                    $idCita = $input['idCita'] ?? '';
                    $nuevoEstado = $input['nuevoEstado'] ?? '';
                    $motivoCancelacion = $input['motivoCancelacion'] ?? null;
                    $usuarioModificador = $input['usuarioModificador'] ?? 1;
                    
                    if (empty($idCita) || empty($nuevoEstado)) {
                        enviarRespuestaError("Datos incompletos para actualizar estado", 400);
                    }

                    try {
                        $resultado = $cita->actualizarEstado($idCita, $nuevoEstado, $motivoCancelacion, $usuarioModificador);
                        
                        if ($resultado) {
                            echo json_encode(["estado" => "ok", "mensaje" => "Estado actualizado exitosamente"]);
                        } else {
                            echo json_encode(["estado" => "error", "mensaje" => "Error al actualizar estado"]);
                        }
                    } catch (Exception $e) {
                        error_log("Error actualizarEstado: " . $e->getMessage());
                        enviarRespuestaError("Error al actualizar estado: " . $e->getMessage());
                    }
                    break;
                    
                case 'reagendar':
                    $idCita = $input['idCita'] ?? '';
                    $nuevaFecha = $input['nuevaFecha'] ?? '';
                    $nuevaHora = $input['nuevaHora'] ?? '';
                    $usuarioModificador = $input['usuarioModificador'] ?? 1;
                    
                    if (empty($idCita) || empty($nuevaFecha) || empty($nuevaHora)) {
                        enviarRespuestaError("Datos incompletos para reagendar", 400);
                    }

                    try {
                        $resultado = $cita->reagendar($idCita, $nuevaFecha, $nuevaHora, $usuarioModificador);
                        
                        if ($resultado) {
                            echo json_encode(["estado" => "ok", "mensaje" => "Cita reagendada exitosamente"]);
                        } else {
                            echo json_encode(["estado" => "error", "mensaje" => "Error al reagendar cita"]);
                        }
                    } catch (Exception $e) {
                        error_log("Error reagendar: " . $e->getMessage());
                        enviarRespuestaError("Error al reagendar cita: " . $e->getMessage());
                    }
                    break;
                    
                default:
                    enviarRespuestaError("Acción PUT no válida: $accion", 400);
            }
            break;

        default:
            enviarRespuestaError("Método HTTP no permitido: " . $_SERVER['REQUEST_METHOD'], 405);
    }

} catch (PDOException $e) {
    // Log del error completo para debugging
    error_log("PDOException en citasController.php: " . $e->getMessage() . " - Trace: " . $e->getTraceAsString());
    
    $mensajeCompleto = $e->getMessage();

    // Extraer el mensaje después del último ]
    if (stripos($mensajeCompleto, ']') !== false) {
        $partes = explode("]", $mensajeCompleto);
        $mensajeLimpio = trim(end($partes));
    } else {
        $mensajeLimpio = "Error en la base de datos.";
    }

    enviarRespuestaError($mensajeLimpio, 500);
    
} catch (Exception $e) {
    // Log del error completo para debugging
    error_log("Exception en citasController.php: " . $e->getMessage() . " - Trace: " . $e->getTraceAsString());
    
    enviarRespuestaError($e->getMessage(), 500);
    
} catch (Throwable $e) {
    // Capturar cualquier otro tipo de error
    error_log("Throwable en citasController.php: " . $e->getMessage() . " - Trace: " . $e->getTraceAsString());
    
    enviarRespuestaError("Error interno del servidor", 500);
}

// ========== FINALIZACIÓN ==========
error_log("CITAS CONTROLLER - Finalizando ejecución exitosa para acción: $accion");
?>