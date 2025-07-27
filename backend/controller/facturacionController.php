<?php
require_once '../clases/factura.php';

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json");
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

$accion = $_GET['accion'] ?? '';
$factura = new Factura();

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        
        case 'GET':
            if ($accion === 'obtenerCliente') {
                $cedula = $_GET['cedula'] ?? '';
                
                if (empty($cedula)) {
                    echo json_encode(["estado" => "error", "mensaje" => "Cédula requerida"]);
                    exit;
                }

                $cliente = $factura->obtenerCliente($cedula);
                
                if ($cliente) {
                    echo json_encode(["estado" => "ok", "cliente" => $cliente]);
                } else {
                    echo json_encode(["estado" => "error", "mensaje" => "Cliente no encontrado"]);
                }
                
            } elseif ($accion === 'obtenerMascotas') {
                $cedula = $_GET['cedula'] ?? '';
                
                if (empty($cedula)) {
                    echo json_encode(["estado" => "error", "mensaje" => "Cédula requerida"]);
                    exit;
                }

                $mascotas = $factura->obtenerMascotasPorCliente($cedula);
                echo json_encode(["estado" => "ok", "mascotas" => $mascotas]);
                
            } elseif ($accion === 'obtenerProductos') {
                $productos = $factura->obtenerProductos();
                echo json_encode(["estado" => "ok", "productos" => $productos]);
                
            } elseif ($accion === 'obtenerServicios') {
                $servicios = $factura->obtenerServicios();
                echo json_encode(["estado" => "ok", "servicios" => $servicios]);
                
            } elseif ($accion === 'verFactura') {
                $idFactura = $_GET['id'] ?? '';
                
                if (empty($idFactura)) {
                    echo json_encode(["estado" => "error", "mensaje" => "ID de factura requerido"]);
                    exit;
                }

                $detalles = $factura->obtenerDetalles($idFactura);
                echo json_encode(["estado" => "ok", "detalles" => $detalles]);
                
            } else {
                http_response_code(400);
                echo json_encode(["estado" => "error", "mensaje" => "Acción GET no válida"]);
            }
            break;

        case 'POST':
            $input = json_decode(file_get_contents("php://input"), true);
            
            if (!$input) {
                throw new Exception("No se pudo leer el JSON de entrada");
            }

            if ($accion === 'generarFactura') {
                $cedulaCliente = $input['cedulaCliente'] ?? '';
                $idMascota = $input['idMascota'] ?? null;
                
                if (empty($cedulaCliente)) {
                    echo json_encode(["estado" => "error", "mensaje" => "Cédula del cliente requerida"]);
                    exit;
                }

                $factura->setDatos($cedulaCliente, $idMascota);
                $idFactura = $factura->generar();
                
                echo json_encode([
                    "estado" => "ok", 
                    "mensaje" => "Factura generada exitosamente",
                    "idFactura" => $idFactura
                ]);
                
            } elseif ($accion === 'agregarProducto') {
                $idFactura = $input['idFactura'] ?? '';
                $idItem = $input['idItem'] ?? '';
                $cantidad = $input['cantidad'] ?? 1;
                
                if (empty($idFactura) || empty($idItem)) {
                    echo json_encode(["estado" => "error", "mensaje" => "Datos incompletos"]);
                    exit;
                }

                $factura->setIdFactura($idFactura);
                $resultado = $factura->agregarProducto($idItem, $cantidad);
                
                if ($resultado) {
                    echo json_encode(["estado" => "ok", "mensaje" => "Producto agregado exitosamente"]);
                } else {
                    echo json_encode(["estado" => "error", "mensaje" => "Error al agregar producto"]);
                }
                
            } elseif ($accion === 'agregarServicio') {
                $idFactura = $input['idFactura'] ?? '';
                $idMascota = $input['idMascota'] ?? '';
                $idItem = $input['idItem'] ?? '';
                
                if (empty($idFactura) || empty($idItem)) {
                    echo json_encode(["estado" => "error", "mensaje" => "Datos incompletos"]);
                    exit;
                }

                // Si no hay mascota específica, usar el ID 0 (mascota dummy)
                if (empty($idMascota)) {
                    $idMascota = 0;
                }

                $factura->setIdFactura($idFactura);
                $resultado = $factura->agregarServicio($idMascota, $idItem);
                
                if ($resultado) {
                    echo json_encode(["estado" => "ok", "mensaje" => "Servicio agregado exitosamente"]);
                } else {
                    echo json_encode(["estado" => "error", "mensaje" => "Error al agregar servicio"]);
                }
                
            } elseif ($accion === 'completarFactura') {
                $idFactura = $input['idFactura'] ?? '';
                
                if (empty($idFactura)) {
                    echo json_encode(["estado" => "error", "mensaje" => "ID de factura requerido"]);
                    exit;
                }

                $factura->setIdFactura($idFactura);
                $resultado = $factura->completar();
                
                if ($resultado) {
                    echo json_encode(["estado" => "ok", "mensaje" => "Factura completada exitosamente"]);
                } else {
                    echo json_encode(["estado" => "error", "mensaje" => "Error al completar factura"]);
                }
                
            } else {
                http_response_code(400);
                echo json_encode(["estado" => "error", "mensaje" => "Acción POST no válida"]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(["estado" => "error", "mensaje" => "Método no permitido"]);
            break;
    }

} catch (PDOException $e) {
    http_response_code(500);

    $mensajeCompleto = $e->getMessage();

    // Extraer el mensaje después del último ]
    if (stripos($mensajeCompleto, ']') !== false) {
        $partes = explode("]", $mensajeCompleto);
        $mensajeLimpio = trim(end($partes));
    } else {
        $mensajeLimpio = "Ocurrió un error en la base de datos.";
    }

    echo json_encode(["estado" => "error", "mensaje" => $mensajeLimpio]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["estado" => "error", "mensaje" => $e->getMessage()]);
}
?>